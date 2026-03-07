import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const REQUIRED_ENV_KEYS = ['DATABASE_URL', 'DIRECT_DATABASE_URL'] as const

function getMissingEnvVars() {
  return REQUIRED_ENV_KEYS.filter((key) => !process.env[key] || process.env[key]?.trim() === '')
}

function jsonErrorResponse(
  message: string,
  status: number,
  code: string,
  details?: Record<string, unknown>
) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        details: details || null
      }
    },
    { status }
  )
}

function normalizeSenderAccount(account: any) {
  let smtpHost = ''
  let smtpPort = 465
  let smtpUser = ''
  let smtpPass = ''
  let smtpSecure = true

  if (account?.smtpConfig) {
    try {
      const smtpConfig = JSON.parse(account.smtpConfig)
      smtpHost = smtpConfig?.host || ''
      smtpPort = Number(smtpConfig?.port) || 465
      smtpUser = smtpConfig?.auth?.user || ''
      smtpPass = smtpConfig?.auth?.pass || ''
      smtpSecure = Boolean(smtpConfig?.secure)
    } catch {
      smtpHost = ''
      smtpPort = 465
      smtpUser = ''
      smtpPass = ''
      smtpSecure = true
    }
  }

  return {
    ...account,
    smtpHost,
    smtpPort,
    smtpUser,
    smtpPass,
    smtpSecure
  }
}

export async function GET() {
  const missingEnv = getMissingEnvVars()
  if (missingEnv.length > 0) {
    console.error('[sender-accounts][GET] Missing required env vars', { missingEnv })
    return jsonErrorResponse(
      'Missing required database environment variables',
      500,
      'ENV_MISSING',
      { missingEnv }
    )
  }

  try {
    const accounts = await prisma.senderAccount.findMany({
      orderBy: { createdAt: 'desc' }
    })

    const result = Array.isArray(accounts) ? accounts.map(normalizeSenderAccount) : []
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('[sender-accounts][GET] Failed to fetch sender accounts', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : null
    })
    return jsonErrorResponse(
      'Failed to fetch sender accounts',
      500,
      'DB_QUERY_FAILED',
      { message: error instanceof Error ? error.message : 'Unknown error' }
    )
  }
}

export async function POST(request: NextRequest) {
  const missingEnv = getMissingEnvVars()
  if (missingEnv.length > 0) {
    console.error('[sender-accounts][POST] Missing required env vars', { missingEnv })
    return jsonErrorResponse(
      'Missing required database environment variables',
      500,
      'ENV_MISSING',
      { missingEnv }
    )
  }

  try {
    const body = await request.json()
    const {
      name,
      email,
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPass,
      smtpSecure,
      status,
      dailyLimit
    } = body

    // Validate required fields
    if (!name || !email || !smtpHost || !smtpPort || !smtpUser || !smtpPass) {
      return jsonErrorResponse(
        'Missing required fields',
        400,
        'VALIDATION_ERROR'
      )
    }

    // Encrypt SMTP config
    const smtpConfig = JSON.stringify({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    })

    const account = await prisma.senderAccount.create({
      data: {
        name,
        email,
        smtpConfig,
        status,
        dailyLimit: dailyLimit || 500
      }
    })

    return NextResponse.json({ success: true, data: normalizeSenderAccount(account) })
  } catch (error: any) {
    console.error('[sender-accounts][POST] Failed to create sender account', {
      code: error?.code,
      message: error?.message
    })

    // 处理唯一约束冲突
    if (error?.code === 'P2002') {
      return jsonErrorResponse(
        '该邮箱地址已存在，请勿重复添加',
        409,
        'DUPLICATE_EMAIL'
      )
    }

    // 处理数据库连接问题
    if (error?.message?.includes('DATABASE_URL')) {
      return jsonErrorResponse(
        '数据库连接失败，请检查 DATABASE_URL 配置',
        500,
        'DB_CONNECTION_FAILED',
        { message: error.message }
      )
    }

    // 处理表不存在的问题
    if (error?.message?.includes("does not exist") || error?.message?.includes("doesn't exist")) {
      return jsonErrorResponse(
        '数据库表未初始化，请等待部署完成或手动执行 prisma db push',
        500,
        'TABLE_NOT_FOUND',
        { message: error.message }
      )
    }

    return jsonErrorResponse(
      `保存失败：${error?.message || '未知错误'}`,
      500,
      'DB_WRITE_FAILED',
      { message: error?.message }
    )
  }
}

export async function PUT(request: NextRequest) {
  const missingEnv = getMissingEnvVars()
  if (missingEnv.length > 0) {
    console.error('[sender-accounts][PUT] Missing required env vars', { missingEnv })
    return jsonErrorResponse(
      'Missing required database environment variables',
      500,
      'ENV_MISSING',
      { missingEnv }
    )
  }

  try {
    const body = await request.json()
    const {
      id,
      name,
      email,
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPass,
      smtpSecure,
      status,
      dailyLimit
    } = body

    if (!id) {
      return jsonErrorResponse(
        'Missing account ID',
        400,
        'VALIDATION_ERROR'
      )
    }

    const smtpConfig = JSON.stringify({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    })

    const account = await prisma.senderAccount.update({
      where: { id },
      data: {
        name,
        email,
        smtpConfig,
        status,
        dailyLimit
      }
    })

    return NextResponse.json({ success: true, data: normalizeSenderAccount(account) })
  } catch (error) {
    console.error('[sender-accounts][PUT] Failed to update sender account', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : null
    })
    return jsonErrorResponse(
      'Failed to update sender account',
      500,
      'DB_WRITE_FAILED',
      { message: error instanceof Error ? error.message : 'Unknown error' }
    )
  }
}
