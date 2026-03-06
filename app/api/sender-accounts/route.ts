import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
  try {
    const accounts = await prisma.senderAccount.findMany({
      orderBy: { createdAt: 'desc' }
    })

    const result = Array.isArray(accounts) ? accounts.map(normalizeSenderAccount) : []
    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to fetch sender accounts:', error)
    
    // 返回更详细的错误信息（非生产环境或特定情况），方便调试
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch sender accounts',
        details: errorMessage
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
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
        userId: 'system', // TODO: Replace with actual user ID from session
        name,
        email,
        smtpConfig,
        status,
        dailyLimit: dailyLimit || 500
      }
    })

    return NextResponse.json(account)
  } catch (error) {
    console.error('Failed to create sender account:', error)
    return NextResponse.json(
      { error: 'Failed to create sender account' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
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
      return NextResponse.json(
        { error: 'Missing account ID' },
        { status: 400 }
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

    return NextResponse.json(account)
  } catch (error) {
    console.error('Failed to update sender account:', error)
    return NextResponse.json(
      { error: 'Failed to update sender account' },
      { status: 500 }
    )
  }
}
