import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { emailService } from '@/lib/email-service'
import { parseVariables } from '@/lib/utils'

export const dynamic = 'force-dynamic' // 禁用静态缓存

const BATCH_SIZE = 5 // 每次处理 5 封，避免 Vercel 10s 超时

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const campaignId = params.id
  
  try {
    // 1. 获取活动信息
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId }
    })

    if (!campaign) {
      return NextResponse.json({ error: '活动不存在' }, { status: 404 })
    }

    if (campaign.status !== 'SENDING' && campaign.status !== 'DRAFT') {
      // 如果不是 SENDING 或 DRAFT (允许从 DRAFT 直接开始)，则可能已经完成或暂停
       return NextResponse.json({ 
         message: '活动状态不正确', 
         status: campaign.status,
         processed: 0,
         remaining: 0
       })
    }
    
    // 确保状态为 SENDING
    if (campaign.status === 'DRAFT') {
        await prisma.campaign.update({
            where: { id: campaignId },
            data: { status: 'SENDING', startedAt: new Date() }
        })
    }

    // 2. 获取待发送联系人
    const contacts = await prisma.campaignContact.findMany({
      where: {
        campaignId,
        status: 'PENDING'
      },
      take: BATCH_SIZE
    })

    if (contacts.length === 0) {
      // 没有待发送联系人，标记为完成
      await prisma.campaign.update({
        where: { id: campaignId },
        data: { 
          status: 'COMPLETED',
          completedAt: new Date(),
          progress: 100
        }
      })
      
      return NextResponse.json({
        success: true,
        status: 'COMPLETED',
        processed: 0,
        remaining: 0
      })
    }

    // 3. 处理发送
    let successCount = 0
    let failedCount = 0
    
    const results = await Promise.all(contacts.map(async (contact) => {
      try {
        const variables = {
          name: contact.name || '',
          company: contact.company || ''
        }
        
        const subject = parseVariables(campaign.subject, variables)
        const body = parseVariables(campaign.body, variables)
        
        const result = await emailService.sendEmail(contact.email, subject, body)
        
        // 更新联系人状态
        await prisma.campaignContact.update({
          where: { id: contact.id },
          data: {
            status: result.success ? 'SENT' : 'FAILED',
            sentAt: result.success ? new Date() : null,
            errorMsg: result.error || null
          }
        })
        
        // 记录日志
        await prisma.campaignLog.create({
          data: {
            campaignId,
            level: result.success ? 'INFO' : 'ERROR',
            message: result.success 
              ? `邮件已发送至 ${contact.email}` 
              : `发送失败 ${contact.email}: ${result.error}`,
            details: JSON.stringify({ email: contact.email, ...result })
          }
        })
        
        return result.success
      } catch (error: any) {
        console.error(`发送给 ${contact.email} 失败:`, error)
        
        await prisma.campaignContact.update({
            where: { id: contact.id },
            data: {
                status: 'FAILED',
                errorMsg: error.message
            }
        })
        
        return false
      }
    }))
    
    successCount = results.filter(r => r).length
    failedCount = results.filter(r => !r).length

    // 4. 更新活动统计
    const updatedCampaign = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        successCount: { increment: successCount },
        failedCount: { increment: failedCount }
      }
    })
    
    // 重新计算进度
    const totalProcessed = updatedCampaign.successCount + updatedCampaign.failedCount
    const progress = updatedCampaign.totalRecipients > 0
      ? Math.round((totalProcessed / updatedCampaign.totalRecipients) * 100)
      : 0
      
    await prisma.campaign.update({
        where: { id: campaignId },
        data: { progress }
    })

    // 检查是否还有剩余
    const remainingCount = await prisma.campaignContact.count({
      where: {
        campaignId,
        status: 'PENDING'
      }
    })

    return NextResponse.json({
      success: true,
      processed: contacts.length,
      successCount,
      failedCount,
      remaining: remainingCount,
      status: remainingCount === 0 ? 'COMPLETED' : 'SENDING',
      progress
    })

  } catch (error: any) {
    console.error('[BatchSend] Error:', error)
    return NextResponse.json(
      { error: error.message || '批量发送失败' },
      { status: 500 }
    )
  }
}
