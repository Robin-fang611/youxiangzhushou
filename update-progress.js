const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function updateProgress() {
  try {
    console.log('=== 更新所有活动的进度字段 ===\n')
    
    const campaigns = await prisma.campaign.findMany({})
    
    console.log(`共找到 ${campaigns.length} 个活动\n`)
    
    for (const campaign of campaigns) {
      const calculatedProgress = campaign.totalRecipients > 0
        ? Math.round(((campaign.successCount + campaign.failedCount) / campaign.totalRecipients) * 100)
        : 0
      
      if (campaign.progress !== calculatedProgress) {
        console.log(`更新活动：${campaign.id}`)
        console.log(`  - 旧进度：${campaign.progress}%`)
        console.log(`  - 新进度：${calculatedProgress}%`)
        
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: { progress: calculatedProgress }
        })
        
        console.log(`  ✓ 已更新\n`)
      }
    }
    
    console.log('=== 更新完成 ===')
    await prisma.$disconnect()
  } catch (error) {
    console.error('更新失败:', error)
    await prisma.$disconnect()
    process.exit(1)
  }
}

updateProgress()
