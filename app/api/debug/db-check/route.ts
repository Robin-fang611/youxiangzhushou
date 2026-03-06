import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const results: any = {
    env: {
      DATABASE_URL_SET: !!process.env.DATABASE_URL,
      DIRECT_DATABASE_URL_SET: !!process.env.DIRECT_DATABASE_URL,
      NODE_ENV: process.env.NODE_ENV,
    },
    prisma: {
      connected: false,
      error: null
    }
  }

  try {
    // 尝试简单的数据库查询
    await prisma.$queryRaw`SELECT 1`
    results.prisma.connected = true
  } catch (error) {
    results.prisma.error = error instanceof Error ? error.message : String(error)
  }

  return NextResponse.json(results, {
    status: results.prisma.connected ? 200 : 500
  })
}
