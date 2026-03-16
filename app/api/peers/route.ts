import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const region = searchParams.get('region')
    const mainRoutes = searchParams.get('mainRoutes')
    const cooperationLevel = searchParams.get('cooperationLevel')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {}
    if (region) where.region = region
    if (mainRoutes) where.mainRoutes = { contains: mainRoutes }
    if (cooperationLevel) where.cooperationLevel = cooperationLevel

    const [peers, total] = await Promise.all([
      prisma.peerCompany.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.peerCompany.count({ where })
    ])

    return NextResponse.json({
      data: peers,
      total,
      limit,
      offset
    })
  } catch (error) {
    console.error('[API] Get peer companies failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      companyName,
      region,
      scale,
      mainRoutes,
      weakRoutes,
      contactName,
      contactPhone,
      contactEmail,
      source,
      notes
    } = body

    if (!companyName || !contactEmail) {
      return NextResponse.json(
        { error: 'companyName and contactEmail are required' },
        { status: 400 }
      )
    }

    const peer = await prisma.peerCompany.create({
      data: {
        companyName,
        region,
        scale,
        mainRoutes: mainRoutes ? JSON.stringify(mainRoutes) : null,
        weakRoutes: weakRoutes ? JSON.stringify(weakRoutes) : null,
        contactName,
        contactPhone,
        contactEmail,
        source,
        notes
      }
    })

    return NextResponse.json(peer)
  } catch (error) {
    console.error('[API] Create peer company failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      )
    }

    if (updateData.mainRoutes) {
      updateData.mainRoutes = JSON.stringify(updateData.mainRoutes)
    }
    if (updateData.weakRoutes) {
      updateData.weakRoutes = JSON.stringify(updateData.weakRoutes)
    }

    const peer = await prisma.peerCompany.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json(peer)
  } catch (error) {
    console.error('[API] Update peer company failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      )
    }

    await prisma.peerCompany.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API] Delete peer company failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
