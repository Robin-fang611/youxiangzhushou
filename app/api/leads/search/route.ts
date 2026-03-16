import { NextRequest, NextResponse } from 'next/server'
import { leadSearchPipeline } from '@/lib/lead-search'
import { SearchModuleSchema } from '@/lib/lead-search/searcher'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { keyword, module, maxQueries, verifyEmails } = body

    if (!keyword) {
      return NextResponse.json(
        { error: 'Keyword is required' },
        { status: 400 }
      )
    }

    const moduleResult = SearchModuleSchema.safeParse(module)
    if (!moduleResult.success) {
      return NextResponse.json(
        { error: 'Invalid module. Must be one of: logistics_usa_europe, importer_usa_europe, china_forwarder, china_exporter' },
        { status: 400 }
      )
    }

    const result = await leadSearchPipeline.searchAndProcess({
      keyword,
      module: moduleResult.data,
      maxQueries: maxQueries || 10,
      verifyEmails: verifyEmails || false
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('[API] Lead search failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('taskId')
    const leadType = searchParams.get('leadType')
    const verificationStatus = searchParams.get('verificationStatus')
    const searchModule = searchParams.get('searchModule')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const stats = searchParams.get('stats')

    if (taskId) {
      const task = await leadSearchPipeline.getTaskStatus(taskId)
      if (!task) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 })
      }
      return NextResponse.json(task)
    }

    if (stats === 'true') {
      const statsData = await leadSearchPipeline.getLeadsStats()
      return NextResponse.json(statsData)
    }

    const leads = await leadSearchPipeline.getLeads({
      leadType: leadType || undefined,
      verificationStatus: verificationStatus || undefined,
      searchModule: searchModule || undefined,
      limit,
      offset
    })

    return NextResponse.json(leads)
  } catch (error) {
    console.error('[API] Get leads failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
