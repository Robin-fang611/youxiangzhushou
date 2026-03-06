import nodemailer from 'nodemailer'
import { createHash, randomBytes } from 'crypto'

export interface EmailConfig {
  provider: 'qq' | 'gmail' | 'custom'
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
  fromName?: string
  replyTo?: string
}

export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
  spamScore?: number
  suggestions?: string[]
}

// 反垃圾邮件检查规则
interface SpamCheckResult {
  score: number
  issues: string[]
  suggestions: string[]
}

export class EmailService {
  private transporter: nodemailer.Transporter
  private config: EmailConfig
  private sendCount: Map<string, number> = new Map() // 按收件人统计
  private lastSendTime: Map<string, number> = new Map() // 按收件人统计
  private domainReputation: Map<string, number> = new Map() // 域名信誉

  constructor(config?: Partial<EmailConfig>) {
    const provider = config?.provider || (process.env.MAIL_PROVIDER as any) || 'qq'
    
    let baseConfig: EmailConfig
    switch (provider) {
      case 'gmail':
        baseConfig = {
          provider: 'gmail',
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          auth: {
            user: process.env.GMAIL_EMAIL || '',
            pass: process.env.GMAIL_APP_PASSWORD || ''
          },
          fromName: process.env.FROM_NAME || 'Business Bot'
        }
        break
      case 'custom':
        baseConfig = {
          provider: 'custom',
          host: process.env.SMTP_HOST || 'smtp.example.com',
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SSL === 'true',
          auth: {
            user: process.env.SMTP_USER || '',
            pass: process.env.SMTP_PASS || ''
          },
          fromName: process.env.FROM_NAME || 'Business Bot'
        }
        break
      case 'qq':
      default:
        baseConfig = {
          provider: 'qq',
          host: 'smtp.qq.com',
          port: 465,
          secure: true,
          auth: {
            user: process.env.QQ_EMAIL || '',
            pass: process.env.QQ_SMTP_AUTH || ''
          },
          fromName: process.env.FROM_NAME || 'Business Bot'
        }
        break
    }

    this.config = { ...baseConfig, ...config }
    
    // 优化 SMTP 配置，提高送达率
    this.transporter = nodemailer.createTransport({
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure,
      auth: this.config.auth,
      logger: true,
      debug: process.env.NODE_ENV === 'development',
      // 连接池优化
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      // 速率限制（避免触发反垃圾机制）
      rateLimit: 10, // 每秒最多 10 封
      rateDelta: 1000
    })
  }

  /**
   * 反垃圾邮件内容检查
   */
  private checkSpamScore(subject: string, body: string): SpamCheckResult {
    const result: SpamCheckResult = {
      score: 0,
      issues: [],
      suggestions: []
    }

    // 1. 主题检查
    const spamWords = [
      '免费', '赚钱', '点击', '优惠', '限时', '立即', '赢取', '中奖',
      '发票', '税务', '信用卡', '贷款', '减肥', '壮阳', '色情',
      'FREE', 'WINNER', 'CLICK', 'URGENT', 'ACT NOW', 'MILLION'
    ]

    const subjectUpper = subject.toUpperCase()
    const bodyUpper = body.toUpperCase()

    // 检查垃圾词汇
    spamWords.forEach(word => {
      if (subjectUpper.includes(word)) {
        result.score += 2
        result.issues.push(`主题包含敏感词：${word}`)
        result.suggestions.push(`避免在主题中使用"${word}"等营销词汇`)
      }
      if (bodyUpper.includes(word)) {
        result.score += 1
        result.issues.push(`正文包含敏感词：${word}`)
      }
    })

    // 2. 主题长度检查
    if (subject.length < 10) {
      result.score += 1
      result.issues.push('主题过短')
      result.suggestions.push('主题长度建议在 10-50 个字符之间')
    } else if (subject.length > 80) {
      result.score += 1
      result.issues.push('主题过长')
      result.suggestions.push('主题长度建议在 10-50 个字符之间')
    }

    // 3. 大写检查（过多大写字母）
    const upperCaseRatio = (subject.match(/[A-Z]/g) || []).length / subject.length
    if (upperCaseRatio > 0.5) {
      result.score += 2
      result.issues.push('主题包含过多大写字母')
      result.suggestions.push('避免使用全大写字母，会被识别为垃圾邮件')
    }

    // 4. 标点符号检查
    const exclamationCount = (subject.match(/!/g) || []).length
    if (exclamationCount > 2) {
      result.score += 2
      result.issues.push('主题包含过多感叹号')
      result.suggestions.push('减少感叹号的使用，建议不超过 2 个')
    }

    // 5. 链接检查
    const urlRegex = /https?:\/\/[^\s]+/g
    const urls = body.match(urlRegex) || []
    if (urls.length > 3) {
      result.score += 2
      result.issues.push('包含过多链接')
      result.suggestions.push('减少链接数量，建议不超过 3 个')
    }

    // 6. 链接缩短服务检查
    const shortUrlServices = ['bit.ly', 'tinyurl.com', 't.cn', 'url.cn']
    urls.forEach(url => {
      if (shortUrlServices.some(service => url.includes(service))) {
        result.score += 3
        result.issues.push(`使用链接缩短服务：${url}`)
        result.suggestions.push('避免使用短链接服务，使用完整域名')
      }
    })

    // 7. 图片检查
    const imgCount = (body.match(/<img[^>]*>/gi) || []).length
    if (imgCount > 3) {
      result.score += 1
      result.issues.push('包含过多图片')
      result.suggestions.push('增加文字内容比例，图文比例建议 60:40')
    }

    // 8. HTML 检查
    const htmlTagCount = (body.match(/<[^>]+>/g) || []).length
    if (htmlTagCount > 50) {
      result.score += 1
      result.issues.push('HTML 标签过多')
      result.suggestions.push('简化 HTML 结构，避免过度格式化')
    }

    // 9. 退订链接检查（重要！）
    const hasUnsubscribe = body.toLowerCase().includes('unsubscribe') || 
                          body.includes('退订') ||
                          body.includes('取消订阅')
    if (!hasUnsubscribe) {
      result.score += 2
      result.issues.push('缺少退订说明')
      result.suggestions.push('添加退订说明或退订链接，符合法规要求')
    }

    // 10. 联系方式检查
    const hasContact = body.includes('@') || body.includes('电话') || body.includes('联系')
    if (!hasContact) {
      result.score += 1
      result.issues.push('缺少联系方式')
      result.suggestions.push('添加有效的联系方式，提高可信度')
    }

    return result
  }

  /**
   * 生成符合 RFC 标准的 Message-ID
   */
  private generateMessageId(domain: string): string {
    const timestamp = Date.now()
    const random = randomBytes(16).toString('hex')
    const hash = createHash('md5').update(random).digest('hex').substring(0, 8)
    return `<${timestamp}.${hash}@${domain}>`
  }

  /**
   * 速率限制检查
   */
  private checkRateLimit(to: string): { allowed: boolean; waitTime?: number } {
    const now = Date.now()
    const lastTime = this.lastSendTime.get(to) || 0
    const minInterval = 60000 // 同一收件人最小间隔 60 秒

    if (now - lastTime < minInterval) {
      return {
        allowed: false,
        waitTime: Math.ceil((minInterval - (now - lastTime)) / 1000)
      }
    }

    return { allowed: true }
  }

  /**
   * 邮箱域名信誉检查
   */
  private checkDomainReputation(email: string): number {
    const domain = email.split('@')[1]?.toLowerCase()
    if (!domain) return 0

    // 常见高质量域名
    const trustedDomains = [
      'qq.com', '163.com', '126.com', 'gmail.com', 'outlook.com',
      'hotmail.com', 'yahoo.com', 'sina.com', 'sohu.com',
      'foxmail.com', 'icloud.com', 'me.com', 'mac.com'
    ]

    if (trustedDomains.includes(domain)) {
      return this.domainReputation.get(domain) || 80
    }

    // 企业域名
    if (!['com', 'cn', 'net', 'org', 'edu', 'gov'].includes(domain.split('.').pop() || '')) {
      return this.domainReputation.get(domain) || 60
    }

    return this.domainReputation.get(domain) || 50
  }

  /**
   * 优化邮件内容
   */
  private optimizeContent(subject: string, body: string, to: string): {
    subject: string
    body: string
    headers: Record<string, string>
  } {
    const domain = this.config.auth.user.split('@')[1] || 'qq.com'
    const timestamp = new Date().toISOString()

    // 优化主题（移除可能的垃圾词）
    let optimizedSubject = subject
      .replace(/!!!+/g, '!') // 减少感叹号
      .replace(/\s+/g, ' ') // 规范化空格
      .trim()

    // 优化正文
    let optimizedBody = body
      .replace(/<font[^>]*color=["']?(red|orange|yellow)["']?[^>]*>/gi, '') // 移除警示色字体
      .replace(/<b[^>]*>/gi, '<strong>') // 统一加粗标签
      .replace(/\s+/g, ' ') // 规范化空格

    // 添加退订说明（如果没有）
    if (!optimizedBody.toLowerCase().includes('unsubscribe') && 
        !optimizedBody.includes('退订')) {
      optimizedBody += `\n\n---\n如不再接收此类邮件，请回复"退订"`
    }

    // 生成专业的邮件头
    const headers: Record<string, string> = {
      'X-Mailer': 'Marketing System v2.0 (Anti-Spam Optimized)',
      'X-Priority': '3', // 普通优先级
      'X-MSMail-Priority': 'Normal',
      'Importance': 'Normal',
      'List-Unsubscribe': `<mailto:${this.config.auth.user}?subject=unsubscribe>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      'Feedback-ID': `marketing:${domain}:${this.config.auth.user}`,
      'X-Campaign-Type': 'Marketing',
      'X-Mailer-ID': createHash('sha256').update(this.config.auth.user).digest('hex').substring(0, 16),
      'Date': new Date().toUTCString()
    }

    // 添加 DKIM 签名提示（如果配置了 DKIM）
    if (process.env.DKIM_PRIVATE_KEY) {
      headers['X-DKIM'] = 'enabled'
    }

    return {
      subject: optimizedSubject,
      body: optimizedBody,
      headers
    }
  }

  async sendEmail(
    to: string,
    subject: string,
    body: string,
    options?: {
      fromName?: string
      replyTo?: string
      skipSpamCheck?: boolean
      headers?: Record<string, string>
    }
  ): Promise<EmailResult> {
    try {
      // 1. 速率限制检查
      const rateCheck = this.checkRateLimit(to)
      if (!rateCheck.allowed) {
        return {
          success: false,
          error: `发送频率过高，请等待 ${rateCheck.waitTime} 秒后重试`,
          spamScore: 100,
          suggestions: ['降低发送频率，避免被识别为垃圾邮件']
        }
      }

      // 2. 域名信誉检查
      const domainReputation = this.checkDomainReputation(to)
      if (domainReputation < 30) {
        return {
          success: false,
          error: '收件人域名信誉较低',
          spamScore: 80,
          suggestions: ['该邮箱可能是无效域名，建议清理']
        }
      }

      // 3. 垃圾邮件检查（除非明确跳过）
      if (!options?.skipSpamCheck) {
        const spamCheck = this.checkSpamScore(subject, body)
        
        if (spamCheck.score >= 10) {
          return {
            success: false,
            error: '邮件内容可能被识别为垃圾邮件',
            spamScore: spamCheck.score,
            suggestions: spamCheck.suggestions
          }
        }

        if (spamCheck.score >= 5) {
          console.warn('[EmailService] 邮件内容警告:', {
            to,
            score: spamCheck.score,
            issues: spamCheck.issues
          })
        }
      }

      // 4. 优化邮件内容
      const { subject: optimizedSubject, body: optimizedBody, headers } = 
        this.optimizeContent(subject, body, to)

      // 5. 构造邮件选项
      const fromName = options?.fromName || this.config.fromName || 'Business Bot'
      const replyTo = options?.replyTo || this.config.replyTo || this.config.auth.user

      const mailOptions: nodemailer.SendMailOptions = {
        from: {
          name: fromName,
          address: this.config.auth.user
        },
        to,
        subject: optimizedSubject,
        text: optimizedBody, // 纯文本版本（反垃圾邮件推荐）
        html: optimizedBody.replace(/\n/g, '<br>'), // HTML 版本
        replyTo,
        headers: {
          ...headers,
          ...options?.headers
        },
        // 添加 Message-ID（符合 RFC 5322）
        messageId: this.generateMessageId(this.config.auth.user.split('@')[1] || 'qq.com'),
        // 添加退订头（RFC 8058）
        list: {
          unsubscribe: `<mailto:${this.config.auth.user}?subject=unsubscribe>`
        }
      }

      // 6. 发送邮件
      const info = await this.transporter.sendMail(mailOptions)
      
      // 7. 更新发送记录
      this.sendCount.set(to, (this.sendCount.get(to) || 0) + 1)
      this.lastSendTime.set(to, Date.now())

      // 8. 更新域名信誉
      const domain = to.split('@')[1]?.toLowerCase()
      if (domain) {
        const currentRep = this.domainReputation.get(domain) || 50
        this.domainReputation.set(domain, Math.min(100, currentRep + 1))
      }

      console.log('[EmailService] 发送成功:', {
        to,
        messageId: info.messageId,
        response: info.response
      })

      return {
        success: true,
        messageId: info.messageId,
        spamScore: 0,
        suggestions: []
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      // 分析错误类型
      let spamRelated = false
      if (errorMessage.includes('550') || errorMessage.includes('spam')) {
        spamRelated = true
      }

      console.error('[EmailService] 发送失败:', {
        to,
        subject,
        error: errorMessage,
        spamRelated
      })

      // 降低域名信誉
      const domain = to.split('@')[1]?.toLowerCase()
      if (domain) {
        const currentRep = this.domainReputation.get(domain) || 50
        this.domainReputation.set(domain, Math.max(0, currentRep - 10))
      }

      return {
        success: false,
        error: errorMessage,
        spamScore: spamRelated ? 100 : 0,
        suggestions: spamRelated 
          ? ['邮件可能被识别为垃圾邮件，请检查内容和发送频率']
          : []
      }
    }
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify()
      console.log('[EmailService] SMTP 连接验证成功')
      return true
    } catch (error) {
      console.error('[EmailService] SMTP 连接验证失败:', error)
      return false
    }
  }

  /**
   * 获取发送统计
   */
  getSendStats() {
    return {
      totalRecipients: this.sendCount.size,
      totalSent: Array.from(this.sendCount.values()).reduce((a, b) => a + b, 0),
      domainReputation: Object.fromEntries(this.domainReputation)
    }
  }

  /**
   * 重置发送记录（用于测试）
   */
  resetStats() {
    this.sendCount.clear()
    this.lastSendTime.clear()
    this.domainReputation.clear()
  }
}

// 导出单例
export const emailService = new EmailService()
