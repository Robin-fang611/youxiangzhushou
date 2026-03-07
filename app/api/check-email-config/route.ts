import { NextResponse } from 'next/server'

export async function GET() {
  const envVars = {
    MAIL_PROVIDER: process.env.MAIL_PROVIDER || '未配置',
    QQ_EMAIL: process.env.QQ_EMAIL ? '已配置' : '未配置',
    QQ_SMTP_AUTH: process.env.QQ_SMTP_AUTH ? '已配置' : '未配置',
    GMAIL_EMAIL: process.env.GMAIL_EMAIL ? '已配置' : '未配置',
    GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD ? '已配置' : '未配置',
    SMTP_HOST: process.env.SMTP_HOST ? '已配置' : '未配置',
    SMTP_USER: process.env.SMTP_USER ? '已配置' : '未配置',
    SMTP_PASS: process.env.SMTP_PASS ? '已配置' : '未配置',
    DATABASE_URL: process.env.DATABASE_URL ? '已配置' : '未配置',
    DIRECT_DATABASE_URL: process.env.DIRECT_DATABASE_URL ? '已配置' : '未配置',
  }

  const missingVars = Object.entries(envVars)
    .filter(([_, value]) => value === '未配置')
    .map(([key]) => key)

  const isConfigured = envVars.MAIL_PROVIDER !== '未配置' &&
    (envVars.QQ_EMAIL === '已配置' || 
     envVars.GMAIL_EMAIL === '已配置' || 
     envVars.SMTP_HOST === '已配置')

  return NextResponse.json({
    success: isConfigured,
    configured: isConfigured,
    envVars,
    missingVars,
    message: isConfigured 
      ? '邮件服务配置正常' 
      : `缺少必要的环境变量：${missingVars.join(', ')}`
  })
}
