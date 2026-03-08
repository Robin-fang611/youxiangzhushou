const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function fixCampaigns() {
  try {
    console.log('=== 修复营销活动状态 ===\n')
    
    // 1. 找到所有状态异常的活动
    const campaigns = await prisma.campaign.findMany({
      where: {
        status: {
          in: ['SENDING']  // 查找所有发送中的活动
        }
      },
      include: {
        contacts: true
      }
    })
    
    console.log(`找到 ${campaigns.length} 个发送中的活动\n`)
    
    for (const campaign of campaigns) {
      console.log(`检查活动：${campaign.id}`)
      
      // 检查联系人状态
      const pendingContacts = campaign.contacts.filter(c => c.status === 'PENDING')
      const sentContacts = campaign.contacts.filter(c => c.status === 'SENT')
      const failedContacts = campaign.contacts.filter(c => c.status === 'FAILED')
      
      console.log(`  - 总收件人：${campaign.totalRecipients}`)
      console.log(`  - 待发送：${pendingContacts.length}`)
      console.log(`  - 已发送：${sentContacts.length}`)
      console.log(`  - 已失败：${failedContacts.length}`)
      console.log(`  - 当前状态：${campaign.status}`)
      console.log(`  - 成功计数：${campaign.successCount}`)
      console.log(`  - 失败计数：${campaign.failedCount}`)
      
      // 如果所有联系人都已处理，但活动状态还是 SENDING，则更新为 COMPLETED
      if (pendingContacts.length === 0 && campaign.status === 'SENDING') {
        console.log(`  → 更新状态为 COMPLETED`)
        
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
            successCount: sentContacts.length,
            failedCount: failedContacts.length,
            progress: 100
          }
        })
        
        console.log(`  ✓ 状态已更新\n`)
      } else if (pendingContacts.length > 0 && campaign.status === 'SENDING') {
        console.log(`  → 仍有待发送的联系人，保持 SENDING 状态\n`)
      } else {
        console.log(`  → 状态正常\n`)
      }
    }
    
    console.log('=== 修复完成 ===')
    await prisma.$disconnect()
  } catch (error) {
    console.error('修复失败:', error)
    await prisma.$disconnect()
    process.exit(1)
  }
}

fixCampaigns()
