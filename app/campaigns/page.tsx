'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getAllCampaigns, deleteCampaign } from '../actions'
import { Plus, Play, Trash2, CheckCircle, XCircle, Clock, Loader2, Eye, Mail, BarChart3 } from 'lucide-react'

interface Campaign {
  id: string
  name: string
  status: string
  totalRecipients: number
  successCount: number
  failedCount: number
  progress: number
  createdAt: string
  completedAt?: string
}

const statusConfig = {
  DRAFT: { label: '草稿', color: 'bg-gray-100 text-gray-800', icon: Clock, desc: '尚未发送' },
  SENDING: { label: '发送中', color: 'bg-blue-100 text-blue-800', icon: Loader2, desc: '正在发送邮件' },
  COMPLETED: { label: '已完成', color: 'bg-green-100 text-green-800', icon: CheckCircle, desc: '全部发送完成' },
  FAILED: { label: '失败', color: 'bg-red-100 text-red-800', icon: XCircle, desc: '发送失败' },
  PAUSED: { label: '已暂停', color: 'bg-yellow-100 text-yellow-800', icon: Clock, desc: '已暂停发送' }
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCampaigns()
  }, [])

  const loadCampaigns = async () => {
    setLoading(true)
    const data = await getAllCampaigns()
    setCampaigns(data)
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个营销活动吗？')) return
    
    const result = await deleteCampaign(id)
    if (result.success) {
      setCampaigns(campaigns.filter(c => c.id !== id))
    } else {
      alert(result.error || '删除失败')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">营销活动</h1>
            <p className="text-gray-600 mt-1">管理和追踪您的邮件营销活动</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/help"
              className="inline-flex items-center gap-2 bg-white text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors border border-gray-300"
            >
              <Eye className="w-5 h-5" />
              使用帮助
            </Link>
            <Link
              href="/campaigns/new"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              新建活动
            </Link>
          </div>
        </div>

        {/* 统计卡片 */}
        {!loading && campaigns.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Mail className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">总活动数</div>
                  <div className="text-2xl font-bold text-gray-900">{campaigns.length}</div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">已完成</div>
                  <div className="text-2xl font-bold text-green-600">
                    {campaigns.filter(c => c.status === 'COMPLETED').length}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">发送中</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {campaigns.filter(c => c.status === 'SENDING').length}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">总发送量</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {campaigns.reduce((sum, c) => sum + c.totalRecipients, 0)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Campaigns List */}
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-4" />
            <p className="text-gray-600">加载中...</p>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-600 mb-4">暂无营销活动</p>
            <Link
              href="/campaigns/new"
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              创建第一个活动 →
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {campaigns.map(campaign => {
              const StatusIcon = statusConfig[campaign.status as keyof typeof statusConfig]?.icon || Clock
              const statusInfo = statusConfig[campaign.status as keyof typeof statusConfig] || statusConfig.DRAFT

              return (
                <div key={campaign.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{campaign.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color} flex items-center gap-1`}>
                          <StatusIcon className="w-4 h-4 inline" />
                          {statusInfo.label}
                        </span>
                        <span className="text-xs text-gray-500 ml-2">{statusInfo.desc}</span>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-4 mb-4">
                        <div>
                          <div className="text-sm text-gray-600">总收件人</div>
                          <div className="text-2xl font-bold text-gray-900">{campaign.totalRecipients}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">成功</div>
                          <div className="text-2xl font-bold text-green-600">{campaign.successCount}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">失败</div>
                          <div className="text-2xl font-bold text-red-600">{campaign.failedCount}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">进度</div>
                          <div className="text-2xl font-bold text-blue-600">{campaign.progress}%</div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${campaign.progress}%` }}
                        />
                      </div>

                      <div className="text-sm text-gray-600 mt-2">
                        创建于 {new Date(campaign.createdAt).toLocaleString('zh-CN')}
                        {campaign.completedAt && (
                          <span className="ml-4">
                            完成于 {new Date(campaign.completedAt).toLocaleString('zh-CN')}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {campaign.status === 'DRAFT' && (
                        <Link
                          href={`/campaigns/${campaign.id}/start`}
                          className="p-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                          title="开始发送"
                        >
                          <Play className="w-5 h-5" />
                        </Link>
                      )}
                      {campaign.status !== 'SENDING' && (
                        <button
                          onClick={() => handleDelete(campaign.id)}
                          className="p-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                          title="删除"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
