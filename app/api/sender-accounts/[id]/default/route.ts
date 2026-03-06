import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const target = await prisma.senderAccount.findUnique({
      where: { id },
      select: { id: true, userId: true }
    })

    if (!target) {
      return NextResponse.json(
        { error: '发件账户不存在' },
        { status: 404 }
      )
    }

    await prisma.senderAccount.updateMany({
      where: { userId: target.userId },
      data: { isDefault: false }
    })

    const account = await prisma.senderAccount.update({
      where: { id: target.id },
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
