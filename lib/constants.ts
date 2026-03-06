// 数据库 URL 配置
// 注意：这个文件主要用于类型提示，实际配置在 .env 文件中
export const DATABASE_URL = process.env.DATABASE_URL || 'file:./dev.db'

// 邮件服务配置常量
export const SUPPORTED_MAIL_PROVIDERS = ['qq', 'gmail', 'custom'] as const

// 应用配置
export const APP_CONFIG = {
  name: '邮件营销系统',
  version: '2.0.0',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  emailSendDelay: 1000, // 发送间隔（毫秒）
} as const
