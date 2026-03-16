export * from './searcher'
export * from './processor'
export * from './verifier'

import { searcher } from './searcher'
import { leadProcessor } from './processor'
import { emailVerifier } from './verifier'
import { prisma } from '@/lib/prisma'
import type { SearchModule, SearchResponse } from './searcher'
import type { ExtractedLead } from './processor'

export interface LeadSearchOptions {
  keyword: string
  module: SearchModule
  maxQueries?: number
  verifyEmails?: boolean
  userId?: string
}

export interface LeadSearchResult {
  success: boolean
  taskId?: string
  totalResults: number
  validLeads: number
  leads: ExtractedLead[]
  error?: string
}

export class LeadSearchPipeline {
  async searchAndProcess(options: LeadSearchOptions): Promise<LeadSearchResult> {
    const { keyword, module, maxQueries = 10, verifyEmails = false, userId } = options

    const task = await prisma.leadSearchTask.create({
      data: {
        userId,
        taskName: `Search ${module} - ${keyword}`,
        keyword,
        searchModule: module,
        status: 'running'
      }
    })

    try {
      console.log(`[Pipeline] Starting search for: ${keyword} (${module})`)
      
      const searchResponses = await searcher.batchSearch(keyword, module, maxQueries)
      
      const allResults = searchResponses.flatMap(res => res.organic || [])
      
      await prisma.leadSearchTask.update({
        where: { id: task.id },
        data: { totalResults: allResults.length }
      })

      const leadType = module === 'china_forwarder' ? 'peer_company' : 'direct_customer'
      
      const leads = await leadProcessor.processBatch(allResults, leadType)
      
      await prisma.leadSearchTask.update({
        where: { id: task.id },
        data: { processedResults: allResults.length }
      })

      const savedLeads: ExtractedLead[] = []
      
      for (const lead of leads) {
        try {
          const savedLead = await prisma.lead.create({
            data: {
              userId,
              companyName: lead.companyName,
              location: lead.location,
              contactPerson: lead.contactPerson,
              email: lead.email,
              phone: lead.phone,
              businessScope: lead.businessScope,
              sourceUrl: lead.sourceUrl,
              leadType: lead.leadType,
              searchModule: module,
              searchKeyword: keyword,
              verificationStatus: 'pending'
            }
          })
          
          savedLeads.push(lead)
        } catch (error) {
          console.log(`[Pipeline] Duplicate lead skipped: ${lead.companyName}`)
        }
      }

      let validLeads = savedLeads.length
      
      if (verifyEmails && savedLeads.length > 0) {
        const emailsToVerify = savedLeads
          .filter(l => l.email && l.email.includes('@'))
          .map(l => l.email)
        
        if (emailsToVerify.length > 0) {
          const verificationResults = await emailVerifier.verifyBatchParallel(emailsToVerify, 3)
          
          for (const result of verificationResults) {
            await prisma.lead.updateMany({
              where: { email: result.email },
              data: {
                verificationStatus: result.isValid ? 'valid' : 'invalid',
                verificationDetails: result.details || result.error,
                lastVerifiedAt: new Date()
              }
            })
            
            await prisma.emailVerificationLog.create({
              data: {
                email: result.email,
                isValid: result.isValid,
                stage: result.stage,
                error: result.error,
                details: result.details
              }
            })
          }
          
          validLeads = verificationResults.filter(r => r.isValid).length
        }
      }

      await prisma.leadSearchTask.update({
        where: { id: task.id },
        data: {
          status: 'completed',
          validLeads,
          completedAt: new Date()
        }
      })

      return {
        success: true,
        taskId: task.id,
        totalResults: allResults.length,
        validLeads,
        leads: savedLeads
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      await prisma.leadSearchTask.update({
        where: { id: task.id },
        data: {
          status: 'failed',
          errorMessage,
          completedAt: new Date()
        }
      })

      return {
        success: false,
        taskId: task.id,
        totalResults: 0,
        validLeads: 0,
        leads: [],
        error: errorMessage
      }
    }
  }

  async getTaskStatus(taskId: string) {
    return prisma.leadSearchTask.findUnique({
      where: { id: taskId }
    })
  }

  async getLeads(options?: {
    leadType?: string
    verificationStatus?: string
    searchModule?: string
    limit?: number
    offset?: number
  }) {
    const where: any = {}
    
    if (options?.leadType) where.leadType = options.leadType
    if (options?.verificationStatus) where.verificationStatus = options.verificationStatus
    if (options?.searchModule) where.searchModule = options.searchModule

    return prisma.lead.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 50,
      skip: options?.offset || 0
    })
  }

  async getLeadsStats() {
    const [total, directCustomers, peerCompanies, validLeads, pendingLeads] = await Promise.all([
      prisma.lead.count(),
      prisma.lead.count({ where: { leadType: 'direct_customer' } }),
      prisma.lead.count({ where: { leadType: 'peer_company' } }),
      prisma.lead.count({ where: { verificationStatus: 'valid' } }),
      prisma.lead.count({ where: { verificationStatus: 'pending' } })
    ])

    return {
      total,
      directCustomers,
      peerCompanies,
      validLeads,
      pendingLeads
    }
  }
}

export const leadSearchPipeline = new LeadSearchPipeline()
