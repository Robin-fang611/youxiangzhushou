import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as nodemailer from 'nodemailer'

export async function GET() {
  try {
    const accounts = await prisma.senderAccount.findMany({
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(accounts)
  } catch (error) {
    console.error('Failed to fetch sender accounts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sender accounts' },
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
