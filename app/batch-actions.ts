'use server'

import { prisma } from '@/lib/prisma'
import { emailService } from '@/lib/email-service'
import { parseVariables } from '@/lib/utils'
import { revalidatePath } from 'next/cache'

// 配置参数
const BATCH_SIZE = 20 // 每批发送数量
const MAX_RETRY = 3 // 最大重试次数
const RETRY_DELAYS = [10000, 30000, 60000] // 重试间隔（毫秒）：10 秒，30 秒，60 秒

/**
 * 分批发送邮件（带进度追踪）
 */
export async function sendCampaignInBatches(campaignId: string) {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { contacts: { where: { status: 'PENDING' } } }
    })

    if (!campaign) {
      return { success: false, error: '活动不存在' }
    }

    const contacts = campaign.contacts
    const totalContacts = contacts.length

    if (totalContacts === 0) {
      await prisma.campaign.update({
        where: { id: campaignId },
        data: { status: 'COMPLETED' }
      })
      return { success: true, message: '没有待发送的联系人' }
    }

    // 计算批次
    const totalBatches = Math.ceil(totalContacts / BATCH_SIZE)
    let currentBatch = 0
    let successCount = 0
    let failedCount = 0

    // 更新活动状态
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { 
        status: 'SENDING',
        startedAt: new Date()
      }
    })

    // 分批处理
    for (let i = 0; i < totalContacts; i += BATCH_SIZE) {
      currentBatch++
      const batch = contacts.slice(i, i + BATCH_SIZE)
      const batchPromises = batch.map(contact => 
        sendEmailWithRetry(campaignId, contact)
      )

      const batchResults = Array.isArray(batchPromises) ? await Promise.all(batchPromises) : []

      // 统计批次结果
      batchResults.forEach(result => {
        if (result.success) {
          successCount++
        } else {
          failedCount++
        }
      })

      // 更新进度
      const processedCount = currentBatch * batch.length
      const progress = Math.round((processedCount / totalContacts) * 100)

      await prisma.campaign.update({
        where: { id: campaignId },
        data: {
          successCount,
          failedCount
        }
      })

      // 批次间延迟，避免触发反垃圾邮件
      if (i + BATCH_SIZE < totalContacts) {
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    // 完成活动
    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date()
      }
    })

    revalidatePath('/campaigns')

    return {
      success: true,
      total: totalContacts,
      sent: successCount,
      failed: failedCount,
      batches: totalBatches
    }
  } catch (error) {
    console.error('[sendCampaignInBatches] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '批量发送失败'
    }
  }
}

/**
 * 发送邮件（带重试机制）
 */
async function sendEmailWithRetry(campaignId: string, contact: any) {
  const variables = {
    name: contact.name || '',
    company: contact.company || ''
  }

  const personalizedSubject = parseVariables(campaignId, variables)
  const personalizedBody = parseVariables(campaignId, variables)

  let lastError: string | null = null
  let retryCount = 0

  while (retryCount < MAX_RETRY) {
    try {
      const result = await emailService.sendEmail(
        contact.email,
        personalizedSubject,
        personalizedBody
      )

      if (result.success) {
        // 发送成功
        await prisma.campaignContact.update({
          where: { id: contact.id },
          data: {
            status: 'SENT',
            sentAt: new Date(),
            errorMsg: null
          }
        })

        await prisma.campaignLog.create({
          data: {
            campaignId,
            level: 'INFO',
            message: `邮件已发送至 ${contact.email}`,
            details: JSON.stringify({ 
              email: contact.email, 
              retryCount,
              timestamp: new Date().toISOString()
            })
          }
        })

        return { success: true, email: contact.email, retryCount }
      } else {
        lastError = result.error || '未知错误'
        throw new Error(lastError)
      }
    } catch (error: any) {
      lastError = error.message || '发送失败'
      retryCount++

      if (retryCount < MAX_RETRY) {
        // 指数退避策略
        const delay = RETRY_DELAYS[retryCount - 1] || 60000
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  // 所有重试都失败
  await prisma.campaignContact.update({
    where: { id: contact.id },
    data: {
      status: 'FAILED',
      errorMsg: lastError || '发送失败'
    }
  })

  await prisma.campaignLog.create({
    data: {
      campaignId,
      level: 'ERROR',
      message: `发送失败 ${contact.email}: ${lastError}`,
      details: JSON.stringify({ 
        email: contact.email, 
        retryCount,
        error: lastError,
        timestamp: new Date().toISOString()
      })
    }
  })

  return { 
    success: false, 
    email: contact.email, 
    error: lastError,
    retryCount 
  }
}

/**
 * 暂停活动发送
 */
export async function pauseCampaign(campaignId: string) {
  try {
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'PAUSED' }
    })

    revalidatePath('/campaigns')

    return { success: true, message: '活动已暂停' }
  } catch (error) {
    console.error('[pauseCampaign] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '暂停活动失败'
    }
  }
}

/**
 * 恢复活动发送
 */
export async function resumeCampaign(campaignId: string) {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId }
    })

    if (!campaign) {
      return { success: false, error: '活动不存在' }
    }

    if (campaign.status !== 'PAUSED') {
      return { success: false, error: '活动未暂停' }
    }

    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'SENDING' }
    })

    revalidatePath('/campaigns')

    // 异步继续发送
    setTimeout(() => {
      sendCampaignInBatches(campaignId)
    }, 1000)

    return { success: true, message: '活动已恢复' }
  } catch (error) {
    console.error('[resumeCampaign] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '恢复活动失败'
    }
  }
}

/**
 * 获取活动发送进度
 */
export async function getCampaignProgress(campaignId: string) {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { 
        contacts: true,
        logs: {
          orderBy: { createdAt: 'desc' },
          take: 50
        }
      }
    })

    if (!campaign) {
      return { success: false, error: '活动不存在' }
    }

    const total = campaign.totalRecipients
    const success = campaign.successCount || 0
    const failed = campaign.failedCount || 0
    const pending = total - success - failed
    const percentage = total > 0 ? Math.round(((success + failed) / total) * 100) : 0

    return {
      success: true,
      progress: {
        total,
        success,
        failed,
        pending,
        percentage,
        status: campaign.status,
        logs: campaign.logs
      }
    }
  } catch (error) {
    console.error('[getCampaignProgress] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '获取进度失败'
    }
  }
}

/**
 * 导出发送结果为 CSV
 */
export async function exportCampaignResults(campaignId: string) {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { contacts: true }
    })

    if (!campaign) {
      return { success: false, error: '活动不存在' }
    }

    // 生成 CSV 内容
    const headers = ['邮箱', '姓名', '公司', '状态', '发送时间', '错误信息']
    const rows = campaign.contacts.map(contact => [
      contact.email,
      contact.name || '',
      contact.company || '',
      contact.status,
      contact.sentAt ? contact.sentAt.toISOString() : '',
      contact.errorMsg || ''
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    return {
      success: true,
      filename: `campaign_${campaignId}_results.csv`,
      content: csvContent,
      total: campaign.contacts.length
    }
  } catch (error) {
    console.error('[exportCampaignResults] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '导出失败'
    }
  }
}
