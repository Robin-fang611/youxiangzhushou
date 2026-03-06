import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Set this account as default
    await prisma.senderAccount.updateMany({
      where: {},
      data: { isDefault: false }
    })

    const account = await prisma.senderAccount.update({
      where: { id },
      data: { isDefault: true }
    })

    return NextResponse.json(account)
  } catch (error) {
    console.error('Failed to set default sender account:', error)
    return NextResponse.json(
      { error: 'Failed to set default sender account' },
      { status: 500 }
    )
  }
}
