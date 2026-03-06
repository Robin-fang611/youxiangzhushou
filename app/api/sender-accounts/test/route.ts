import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPass,
      smtpSecure
    } = body

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    })

    // Test connection
    await transporter.verify()

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('SMTP connection test failed:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Connection failed'
    })
  }
}
