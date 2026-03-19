import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { emailService } from '@/lib/email-service'
import { parseVariables } from '@/lib/utils'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // Vercel Serverless 函数最大超时 60 秒

const BATCH_SIZE = 1 // 每次只处理 1 封，确保稳定性
const SEND_DELAY_MS = 3000 // QQ 邮箱间隔 3 秒，避免触发频率限制

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const campaignId = params.id
  
  try {
    // 1. 获取活动信息
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        senderAccount: true
      }
    })

    if (!campaign) {
      return NextResponse.json({ error: '活动不存在' }, { status: 404 })
    }

    // 解析发件账户配置
    let smtpConfig = undefined
    if (campaign.senderAccount?.smtpConfig) {
      try {
        smtpConfig = JSON.parse(campaign.senderAccount.smtpConfig)
      } catch (e) {
        console.error('解析 SMTP 配置失败:', e)
      }
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

    // 3. 处理发送 - 改为串行发送，确保稳定性
    let successCount = 0
    let failedCount = 0
    
    for (const contact of contacts) {
      try {
        const variables = {
          name: contact.name || '',
          company: contact.company || ''
        }
        
        const subject = parseVariables(campaign.subject, variables)
        const body = parseVariables(campaign.body, variables)
        
        // 使用解析出的 smtpConfig 发送邮件，增加重试次数
        const result = await emailService.sendEmail(
          contact.email, 
          subject, 
          body,
          { 
            smtpConfig,
            retryCount: 5 // 增加到 5 次重试
          }
        )
        
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
        
        if (result.success) {
          successCount++
        } else {
          failedCount++
        }
        
        // 发送延迟，避免触发频率限制
        if (contacts.indexOf(contact) < contacts.length - 1) {
          await new Promise(resolve => setTimeout(resolve, SEND_DELAY_MS))
        }
      } catch (error: any) {
        console.error(`发送给 ${contact.email} 失败:`, error)
        
        await prisma.campaignContact.update({
            where: { id: contact.id },
            data: {
                status: 'FAILED',
                errorMsg: error.message
            }
        })
        
        failedCount++
        
        // 错误后也要延迟
        if (contacts.indexOf(contact) < contacts.length - 1) {
          await new Promise(resolve => setTimeout(resolve, SEND_DELAY_MS))
        }
      }
    }

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
