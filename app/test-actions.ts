'use server'

import { emailService } from '@/lib/email-service'

/**
 * 发送测试邮件到各大邮箱服务商
 */
export async function sendTestEmails() {
  const testEmails = [
    { provider: 'QQ', email: '544639213@qq.com' },
    // 可以添加更多测试邮箱
    // { provider: '163', email: 'test@163.com' },
    // { provider: 'Gmail', email: 'test@gmail.com' }
  ]

  const results: any[] = []

  for (const { provider, email } of testEmails) {
    const result = await emailService.sendEmail(
      email,
      '【测试邮件】邮件系统送达率测试',
      `尊敬的测试用户：

您好！这是一封测试邮件，用于验证邮件系统的送达率。

如果您收到这封邮件，说明：
1. ✅ 邮件成功发送
2. ✅ 未被识别为垃圾邮件
3. ✅ SPF/DKIM/DMARC 配置正常

邮件内容测试：
- 主题长度：适中
- 无敏感词汇
- 包含退订说明
- 包含联系方式

---
此致
敬礼

测试团队
邮箱：test@example.com
电话：400-xxx-xxxx

如不再接收此类邮件，请回复"退订"`
    )

    results.push({
      provider,
      email,
      ...result
    })
  }

  return {
    success: true,
    results,
    summary: {
      total: results.length,
      success: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    }
  }
}

/**
 * 检查邮件内容质量
 */
export async function checkEmailQuality(subject: string, body: string) {
  // 这里复用 emailService 的检查逻辑
  // 由于是私有方法，我们创建一个简化版本
  
  const issues: string[] = []
  const suggestions: string[] = []
  let score = 0

  // 垃圾词检查
  const spamWords = ['免费', '赚钱', '点击', '优惠', '限时', '立即', '赢取', '中奖']
  const subjectUpper = subject.toUpperCase()
  
  spamWords.forEach(word => {
    if (subjectUpper.includes(word)) {
      score += 2
      issues.push(`主题包含敏感词：${word}`)
      suggestions.push(`避免使用"${word}"`)
    }
  })

  // 主题长度
  if (subject.length < 10) {
    score += 1
    issues.push('主题过短')
    suggestions.push('建议 10-50 个字符')
  } else if (subject.length > 80) {
    score += 1
    issues.push('主题过长')
    suggestions.push('建议 10-50 个字符')
  }

  // 大写字母
  const upperRatio = (subject.match(/[A-Z]/g) || []).length / subject.length
  if (upperRatio > 0.5) {
    score += 2
    issues.push('过多大写字母')
    suggestions.push('避免全大写')
  }

  // 感叹号
  const exclamationCount = (subject.match(/!/g) || []).length
  if (exclamationCount > 2) {
    score += 2
    issues.push('过多感叹号')
    suggestions.push('不超过 2 个感叹号')
  }

  // 退订说明
  if (!body.toLowerCase().includes('unsubscribe') && !body.includes('退订')) {
    score += 2
    issues.push('缺少退订说明')
    suggestions.push('添加退订说明')
  }

  // 联系方式
  if (!body.includes('@') && !body.includes('电话') && !body.includes('联系')) {
    score += 1
    issues.push('缺少联系方式')
    suggestions.push('添加联系方式')
  }

  return {
    score,
    maxScore: 15,
    passed: score < 5,
    issues,
    suggestions,
    rating: score === 0 ? '优秀' : score < 5 ? '良好' : score < 10 ? '一般' : '需要优化'
  }
}

/**
 * 验证 SMTP 连接
 */
export async function verifySMTPConnection() {
  const result = await emailService.verifyConnection()
  return {
    success: result,
    message: result ? 'SMTP 连接正常' : 'SMTP 连接失败',
    timestamp: new Date().toISOString()
  }
}

/**
 * 获取发送统计
 */
export async function getSendStatistics() {
  const stats = emailService.getSendStats()
  return {
    ...stats,
    timestamp: new Date().toISOString()
  }
}
