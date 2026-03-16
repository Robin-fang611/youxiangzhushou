import { NextRequest, NextResponse } from 'next/server'
import { emailVerifier } from '@/lib/lead-search/verifier'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { emails, leadId } = body

    if (leadId) {
      const lead = await prisma.lead.findUnique({
        where: { id: leadId }
      })

      if (!lead || !lead.email) {
        return NextResponse.json(
          { error: 'Lead not found or no email' },
          { status: 404 }
        )
      }

      const result = await emailVerifier.verify(lead.email)

      await prisma.lead.update({
        where: { id: leadId },
        data: {
          verificationStatus: result.isValid ? 'valid' : 'invalid',
          verificationDetails: result.details || result.error,
          lastVerifiedAt: new Date()
        }
      })

      await prisma.emailVerificationLog.create({
        data: {
          email: result.email,
          isValid: result.isValid,
          stage: result.stage,
          error: result.error,
          details: result.details
        }
      })

      return NextResponse.json(result)
    }

    if (!emails || !Array.isArray(emails)) {
      return NextResponse.json(
        { error: 'emails array is required' },
        { status: 400 }
      )
    }

    const results = await emailVerifier.verifyBatchParallel(emails, 3)

    for (const result of results) {
      await prisma.lead.updateMany({
        where: { email: result.email },
        data: {
          verificationStatus: result.isValid ? 'valid' : 'invalid',
          verificationDetails: result.details || result.error,
          lastVerifiedAt: new Date()
        }
      })

      await prisma.emailVerificationLog.create({
        data: {
          email: result.email,
          isValid: result.isValid,
          stage: result.stage,
          error: result.error,
          details: result.details
        }
      })
    }

    const validCount = results.filter(r => r.isValid).length

    return NextResponse.json({
      total: results.length,
      valid: validCount,
      invalid: results.length - validCount,
      results
    })
  } catch (error) {
    console.error('[API] Email verification failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      )
    }

    const cachedResult = await prisma.emailVerificationLog.findFirst({
      where: { email },
      orderBy: { verifiedAt: 'desc' }
    })

    if (cachedResult) {
      const oneDayAgo = new Date()
      oneDayAgo.setDate(oneDayAgo.getDate() - 1)
      
      if (cachedResult.verifiedAt > oneDayAgo) {
        return NextResponse.json({
          email: cachedResult.email,
          isValid: cachedResult.isValid,
          stage: cachedResult.stage,
          error: cachedResult.error,
          details: cachedResult.details,
          cached: true
        })
      }
    }

    const result = await emailVerifier.verify(email)

    await prisma.emailVerificationLog.create({
      data: {
        email: result.email,
        isValid: result.isValid,
        stage: result.stage,
        error: result.error,
        details: result.details
      }
    })

    return NextResponse.json({
      ...result,
      cached: false
    })
  } catch (error) {
    console.error('[API] Email verification failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
