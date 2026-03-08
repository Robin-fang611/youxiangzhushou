const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkCampaigns() {
  try {
    console.log('=== 检查所有营销活动 ===\n')
    const campaigns = await prisma.campaign.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        contacts: true,
        logs: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    })

    console.log(`共找到 ${campaigns.length} 个活动\n`)

    campaigns.forEach((c, i) => {
      console.log(`--- 活动 ${i+1} ---`)
      console.log(`ID: ${c.id}`)
      console.log(`名称：${c.name || '未命名'}`)
      console.log(`状态：${c.status}`)
      console.log(`总收件人：${c.totalRecipients}`)
      console.log(`成功：${c.successCount}`)
      console.log(`失败：${c.failedCount}`)
      console.log(`进度：${c.progress}%`)
      console.log(`联系人数量：${c.contacts.length}`)
      if (c.contacts.length > 0) {
        console.log(`联系人:`)
        c.contacts.forEach(co => {
          console.log(`  - ${co.email} (${co.status})`)
        })
      }
      if (c.logs.length > 0) {
        console.log(`最近日志:`)
        c.logs.forEach(l => {
          console.log(`  [${l.level}] ${l.message}`)
        })
      } else {
        console.log(`日志：无`)
      }
      console.log('')
    })

    await prisma.$disconnect()
  } catch (error) {
    console.error('检查失败:', error.message)
    await prisma.$disconnect()
    process.exit(1)
  }
}

checkCampaigns()
