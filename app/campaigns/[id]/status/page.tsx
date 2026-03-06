'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getCampaignStatus } from '../../../actions'
import { CheckCircle, XCircle, Loader2, Mail, ArrowLeft } from 'lucide-react'

interface CampaignStatus {
  id: string
  status: string
  totalRecipients: number
  successCount: number
  failedCount: number
  progress: number
  logs: {
    id: string
    level: string
    message: string
    createdAt: string
  }[]
}

export default function CampaignStatusPage() {
  const params = useParams()
  const router = useRouter()
  const [status, setStatus] = useState<CampaignStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const pollStatus = async () => {
      const data = await getCampaignStatus(params.id as string)
      if (data) {
        setStatus(data)
        setLoading(false)

        // 如果已完成，停止轮询
        if (data.status === 'COMPLETED' || data.status === 'FAILED') {
          return
        }
      }

      // 继续轮询
      setTimeout(pollStatus, 2000)
    }

    pollStatus()
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-600 mb-4" />
          <p className="text-gray-600">加载状态中...</p>
        </div>
      </div>
    )
  }

  if (!status) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">营销活动不存在</p>
          <button
            onClick={() => router.push('/campaigns')}
            className="text-blue-600 hover:text-blue-700"
          >
            返回营销活动列表
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/campaigns')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            返回营销活动列表
          </button>
          <h1 className="text-3xl font-bold text-gray-900">发送状态</h1>
          <p className="text-gray-600 mt-1">实时追踪营销活动进度</p>
        </div>

        {/* Progress Overview */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600 mb-2">总收件人</div>
            <div className="text-3xl font-bold text-gray-900">{status.totalRecipients}</div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600 mb-2">成功</div>
            <div className="text-3xl font-bold text-green-600">{status.successCount}</div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600 mb-2">失败</div>
            <div className="text-3xl font-bold text-red-600">{status.failedCount}</div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600 mb-2">进度</div>
            <div className="text-3xl font-bold text-blue-600">{status.progress}%</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">总体进度</span>
            <span className="text-sm text-gray-600">{status.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className={`h-4 rounded-full transition-all duration-500 ${
                status.status === 'COMPLETED' ? 'bg-green-600' : 'bg-blue-600'
              }`}
              style={{ width: `${status.progress}%` }}
            />
          </div>
          <div className="mt-4 flex items-center gap-2">
            {status.status === 'SENDING' ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <span className="text-blue-600 font-medium">正在发送中...</span>
              </>
            ) : status.status === 'COMPLETED' ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-600 font-medium">发送完成</span>
              </>
            ) : status.status === 'FAILED' ? (
              <>
                <XCircle className="w-5 h-5 text-red-600" />
                <span className="text-red-600 font-medium">发送失败</span>
              </>
            ) : (
              <span className="text-gray-600 font-medium">状态：{status.status}</span>
            )}
          </div>
        </div>

        {/* Logs */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Mail className="w-5 h-5" />
              发送日志
            </h2>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {status.logs.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                暂无日志记录
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {status.logs.map(log => (
                  <div key={log.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start gap-3">
                      {log.level === 'INFO' ? (
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{log.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(log.createdAt).toLocaleString('zh-CN')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
