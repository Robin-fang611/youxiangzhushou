/**
 * 邮件发送 API - 生产环境优化版本
 * 
 * 特性:
 * - 强制使用 Node.js Runtime (禁用 Edge Functions)
 * - 完整的错误捕获和处理
 * - 支持 Nodemailer 和 Resend 两种邮件服务
 * - 详细的关键节点日志
 * - 环境变量校验
 */

// 强制使用 Node.js Runtime (禁用 Edge Functions)
export const runtime = 'nodejs'

// 强制动态渲染 (禁用静态优化)
export const dynamic = 'force-dynamic'

// 禁用自动静态导出
export const dynamicParams = true

// 设置最大执行时间 (Vercel Serverless 函数)
export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

/**
 * 环境变量配置接口
 */
interface EmailEnvConfig {
  provider: 'nodemailer' | 'resend'
  // Nodemailer 配置
  smtpHost?: string
  smtpPort?: number
  smtpSecure?: boolean
  smtpUser?: string
  smtpPass?: string
  smtpFrom?: string
  // Resend 配置
  resendApiKey?: string
  resendFrom?: string
}

/**
 * 邮件发送请求体接口
 */
interface SendEmailRequest {
  to: string
  subject: string
  body: string
  html?: string
  fromName?: string
  replyTo?: string
  campaignId?: string
  contactId?: string
}

/**
 * 邮件发送响应接口
 */
interface SendEmailResponse {
  success: boolean
  messageId?: string
  error?: string
  provider?: string
  timestamp?: string
  details?: any
}

/**
 * 校验环境变量配置
 */
function validateEnvConfig(): { valid: boolean; config: EmailEnvConfig; errors: string[] } {
  const errors: string[] = []
  const config: EmailEnvConfig = {
    provider: (process.env.EMAIL_PROVIDER as any) || 'nodemailer'
  }

  console.log('[EmailAPI] 开始校验环境变量配置')
  console.log('[EmailAPI] EMAIL_PROVIDER:', config.provider)

  if (config.provider === 'resend') {
    // Resend 配置校验
    config.resendApiKey = process.env.RESEND_API_KEY
    config.resendFrom = process.env.RESEND_FROM_EMAIL || process.env.RESEND_FROM || 'onboarding@resend.dev'

    if (!config.resendApiKey) {
      errors.push('缺少 RESEND_API_KEY 环境变量')
      console.error('[EmailAPI] ❌ 缺少 RESEND_API_KEY')
    } else {
      console.log('[EmailAPI] ✅ RESEND_API_KEY 已配置')
    }

    if (!config.resendFrom) {
      errors.push('缺少 RESEND_FROM_EMAIL 环境变量')
      console.error('[EmailAPI] ❌ 缺少 RESEND_FROM_EMAIL')
    } else {
      console.log('[EmailAPI] ✅ RESEND_FROM_EMAIL 已配置:', config.resendFrom)
    }
  } else {
    // Nodemailer 配置校验 (默认)
    config.smtpHost = process.env.SMTP_HOST || 'smtp.qq.com'
    config.smtpPort = parseInt(process.env.SMTP_PORT || '465')
    config.smtpSecure = process.env.SMTP_SSL === 'true' || config.smtpPort === 465
    config.smtpUser = process.env.SMTP_USER || process.env.QQ_EMAIL
    config.smtpPass = process.env.SMTP_PASS || process.env.QQ_SMTP_AUTH
    config.smtpFrom = process.env.SMTP_FROM || process.env.QQ_EMAIL || config.smtpUser

    if (!config.smtpHost) {
      errors.push('缺少 SMTP_HOST 环境变量')
      console.error('[EmailAPI] ❌ 缺少 SMTP_HOST')
    } else {
      console.log('[EmailAPI] ✅ SMTP_HOST 已配置:', config.smtpHost)
    }

    if (!config.smtpPort) {
      errors.push('缺少 SMTP_PORT 环境变量')
      console.error('[EmailAPI] ❌ 缺少 SMTP_PORT')
    } else {
      console.log('[EmailAPI] ✅ SMTP_PORT 已配置:', config.smtpPort)
    }

    if (!config.smtpUser) {
      errors.push('缺少 SMTP_USER 或 QQ_EMAIL 环境变量')
      console.error('[EmailAPI] ❌ 缺少 SMTP_USER')
    } else {
      console.log('[EmailAPI] ✅ SMTP_USER 已配置:', config.smtpUser)
    }

    if (!config.smtpPass) {
      errors.push('缺少 SMTP_PASS 或 QQ_SMTP_AUTH 环境变量')
      console.error('[EmailAPI] ❌ 缺少 SMTP_PASS')
    } else {
      console.log('[EmailAPI] ✅ SMTP_PASS 已配置 (长度：' + config.smtpPass.length + ')')
    }

    if (!config.smtpFrom) {
      errors.push('缺少 SMTP_FROM 环境变量，将使用 SMTP_USER')
      console.warn('[EmailAPI] ⚠️ 缺少 SMTP_FROM，将使用 SMTP_USER')
      config.smtpFrom = config.smtpUser
    } else {
      console.log('[EmailAPI] ✅ SMTP_FROM 已配置:', config.smtpFrom)
    }
  }

  const valid = errors.length === 0
  console.log('[EmailAPI] 环境变量校验结果:', valid ? '✅ 通过' : '❌ 失败')
  
  return { valid, config, errors }
}

/**
 * 使用 Nodemailer 发送邮件
 */
async function sendWithNodemailer(
  req: SendEmailRequest,
  config: EmailEnvConfig
): Promise<SendEmailResponse> {
  console.log('[EmailAPI] 开始使用 Nodemailer 发送邮件')
  console.log('[EmailAPI] 收件人:', req.to)
  console.log('[EmailAPI] 主题:', req.subject)

  let transporter: nodemailer.Transporter | null = null

  try {
    // 创建 transporter
    console.log('[EmailAPI] 创建 SMTP transporter...')
    transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpSecure,
      auth: {
        user: config.smtpUser!,
        pass: config.smtpPass!
      },
      // 连接池优化
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      // 速率限制
      rateLimit: 10,
      rateDelta: 1000,
      // 日志
      logger: true,
      debug: process.env.NODE_ENV === 'development'
    })

    // 验证连接
    console.log('[EmailAPI] 验证 SMTP 连接...')
    await transporter.verify()
    console.log('[EmailAPI] ✅ SMTP 连接验证成功')

    // 构造邮件选项
    const mailOptions: nodemailer.SendMailOptions = {
      from: {
        name: req.fromName || 'Business Bot',
        address: config.smtpFrom!
      },
      to: req.to,
      subject: req.subject,
      text: req.body,
      html: req.html || req.body.replace(/\n/g, '<br>'),
      replyTo: req.replyTo || config.smtpFrom!,
      // 邮件头优化
      headers: {
        'X-Mailer': 'Marketing System v2.0',
        'X-Priority': '3',
        'Importance': 'Normal',
        'Date': new Date().toUTCString()
      }
    }

    // 发送邮件
    console.log('[EmailAPI] 开始发送邮件...')
    const info = await transporter.sendMail(mailOptions)

    console.log('[EmailAPI] ✅ 邮件发送成功!')
    console.log('[EmailAPI] Message ID:', info.messageId)
    console.log('[EmailAPI] Response:', info.response)

    return {
      success: true,
      messageId: info.messageId,
      provider: 'nodemailer',
      timestamp: new Date().toISOString(),
      details: {
        response: info.response
      }
    }
  } catch (error: any) {
    console.error('[EmailAPI] ❌ Nodemailer 发送失败:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response
    })

    return {
      success: false,
      error: `Nodemailer 发送失败：${error.message}`,
      provider: 'nodemailer',
      timestamp: new Date().toISOString(),
      details: {
        code: error.code,
        command: error.command,
        response: error.response
      }
    }
  } finally {
    // 关闭连接
    if (transporter) {
      console.log('[EmailAPI] 关闭 SMTP 连接...')
      try {
        await transporter.close()
        console.log('[EmailAPI] ✅ SMTP 连接已关闭')
      } catch (error) {
        console.error('[EmailAPI] 关闭连接失败:', error)
      }
    }
  }
}

/**
 * 使用 Resend 发送邮件
 */
async function sendWithResend(
  req: SendEmailRequest,
  config: EmailEnvConfig
): Promise<SendEmailResponse> {
  console.log('[EmailAPI] 开始使用 Resend 发送邮件')
  console.log('[EmailAPI] 收件人:', req.to)
  console.log('[EmailAPI] 主题:', req.subject)

  try {
    // 动态导入 Resend SDK
    console.log('[EmailAPI] 初始化 Resend SDK...')
    const { Resend } = await import('resend')
    const resend = new Resend(config.resendApiKey!)

    // 发送邮件
    console.log('[EmailAPI] 调用 Resend API 发送邮件...')
    const { data, error } = await resend.emails.send({
      from: req.fromName 
        ? `${req.fromName} <${config.resendFrom!}>`
        : config.resendFrom!,
      to: [req.to],
      subject: req.subject,
      text: req.body,
      html: req.html || req.body.replace(/\n/g, '<br>'),
      replyTo: req.replyTo,
      headers: {
        'X-Entity-Ref-ID': req.campaignId || 'unknown'
      }
    })

    if (error) {
      console.error('[EmailAPI] ❌ Resend API 返回错误:', error)
      return {
        success: false,
        error: `Resend API 错误：${error.message}`,
        provider: 'resend',
        timestamp: new Date().toISOString(),
        details: error
      }
    }

    console.log('[EmailAPI] ✅ Resend 发送成功!')
    console.log('[EmailAPI] Email ID:', data?.id)

    return {
      success: true,
      messageId: data?.id,
      provider: 'resend',
      timestamp: new Date().toISOString(),
      details: data
    }
  } catch (error: any) {
    console.error('[EmailAPI] ❌ Resend 发送失败:', {
      message: error.message,
      stack: error.stack
    })

    return {
      success: false,
      error: `Resend 发送失败：${error.message}`,
      provider: 'resend',
      timestamp: new Date().toISOString(),
      details: {
        stack: error.stack
      }
    }
  }
}

/**
 * POST 请求处理函数
 */
export async function POST(request: NextRequest): Promise<NextResponse<SendEmailResponse>> {
  const startTime = Date.now()
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(7)}`

  console.log('='.repeat(60))
  console.log('[EmailAPI] 开始处理请求')
  console.log('[EmailAPI] Request ID:', requestId)
  console.log('[EmailAPI] 请求时间:', new Date().toISOString())
  console.log('='.repeat(60))

  try {
    // 1. 解析请求体
    console.log('[EmailAPI] 步骤 1: 解析请求体...')
    let body: SendEmailRequest
    
    try {
      body = await request.json()
    } catch (parseError: any) {
      console.error('[EmailAPI] ❌ 请求体解析失败:', parseError.message)
      return NextResponse.json(
        {
          success: false,
          error: '请求体格式错误：必须是有效的 JSON',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    console.log('[EmailAPI] ✅ 请求体解析成功')
    console.log('[EmailAPI] 收件人:', body.to)
    console.log('[EmailAPI] 主题:', body.subject)
    console.log('[EmailAPI] Campaign ID:', body.campaignId || 'N/A')

    // 2. 校验必填字段
    console.log('[EmailAPI] 步骤 2: 校验必填字段...')
    const requiredFields = ['to', 'subject', 'body']
    const missingFields = requiredFields.filter(field => !body[field])

    if (missingFields.length > 0) {
      console.error('[EmailAPI] ❌ 缺少必填字段:', missingFields)
      return NextResponse.json(
        {
          success: false,
          error: `缺少必填字段：${missingFields.join(', ')}`,
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    // 校验邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.to)) {
      console.error('[EmailAPI] ❌ 邮箱格式无效:', body.to)
      return NextResponse.json(
        {
          success: false,
          error: '收件人邮箱格式无效',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    console.log('[EmailAPI] ✅ 字段校验通过')

    // 3. 校验环境变量配置
    console.log('[EmailAPI] 步骤 3: 校验环境变量配置...')
    const envValidation = validateEnvConfig()

    if (!envValidation.valid) {
      console.error('[EmailAPI] ❌ 环境变量配置错误:', envValidation.errors)
      return NextResponse.json(
        {
          success: false,
          error: '服务器配置错误',
          details: envValidation.errors,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }

    console.log('[EmailAPI] ✅ 环境变量配置校验通过')

    // 4. 根据配置选择邮件服务发送
    console.log('[EmailAPI] 步骤 4: 选择邮件服务并发送...')
    const config = envValidation.config
    let result: SendEmailResponse

    if (config.provider === 'resend') {
      console.log('[EmailAPI] 使用 Resend 邮件服务')
      result = await sendWithResend(body, config)
    } else {
      console.log('[EmailAPI] 使用 Nodemailer 邮件服务')
      result = await sendWithNodemailer(body, config)
    }

    // 5. 返回结果
    const duration = Date.now() - startTime
    console.log('[EmailAPI] 步骤 5: 返回结果')
    console.log('[EmailAPI] 请求耗时:', duration + 'ms')
    console.log('[EmailAPI] 发送结果:', result.success ? '✅ 成功' : '❌ 失败')
    console.log('='.repeat(60))

    if (result.success) {
      return NextResponse.json(result, { status: 200 })
    } else {
      return NextResponse.json(result, { status: 500 })
    }
  } catch (error: any) {
    // 6. 全局错误捕获
    const duration = Date.now() - startTime
    console.error('[EmailAPI] ❌ 全局错误捕获:', {
      message: error.message,
      stack: error.stack,
      duration: duration + 'ms'
    })
    console.log('='.repeat(60))

    return NextResponse.json(
      {
        success: false,
        error: `邮件发送失败：${error.message}`,
        timestamp: new Date().toISOString(),
        duration: duration + 'ms'
      },
      { status: 500 }
    )
  }
}

/**
 * GET 请求处理函数 (用于健康检查)
 */
export async function GET(): Promise<NextResponse> {
  console.log('[EmailAPI] 健康检查请求')
  
  const envValidation = validateEnvConfig()
  
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    runtime: process.runtime,
    emailProvider: process.env.EMAIL_PROVIDER || 'nodemailer',
    envConfigured: envValidation.valid,
    errors: envValidation.errors
  })
}
