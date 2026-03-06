import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatEmailError(error: string): string {
  const errorMap: Record<string, string> = {
    'Invalid login': '用户名或密码错误',
    'Connection timeout': '连接超时，请检查网络',
    'Self signed certificate': 'SSL 证书错误',
    'Authentication failed': '认证失败',
    'Rate limit exceeded': '发送频率过高，请稍后重试'
  }
  
  for (const [key, message] of Object.entries(errorMap)) {
    if (error.includes(key)) {
      return message
    }
  }
  
  return error
}

export function validateEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

export function parseVariables(text: string, variables: Record<string, string>): string {
  let result = text
  for (const [key, value] of Object.entries(variables)) {
    const pattern = new RegExp(`{{${key}}}`, 'g')
    result = result.replace(pattern, value || '')
  }
  return result
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('zh-CN').format(num)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date))
}

export function calculateProgress(current: number, total: number): number {
  if (total === 0) return 0
  return Math.round((current / total) * 100)
}
