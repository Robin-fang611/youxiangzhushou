'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Mail, CheckCircle, XCircle, Save, X } from 'lucide-react'

interface SenderAccount {
  id: string
  name: string
  email: string
  smtpHost: string
  smtpPort: number
  smtpUser: string
  smtpPass: string
  smtpSecure: boolean
  status: 'ACTIVE' | 'INACTIVE'
  isDefault: boolean
  dailyLimit: number
  dailySent: number
  reputation: 'GOOD' | 'FAIR' | 'POOR'
  lastError?: string
  lastUsedAt?: Date
}

export default function SettingsPage() {
  const [accounts, setAccounts] = useState<SenderAccount[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingAccount, setEditingAccount] = useState<SenderAccount | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    loadAccounts()
  }, [])

  async function loadAccounts() {
    try {
      setLoadError('')
      const res = await fetch('/api/sender-accounts')
      const payload = await res.json()
      const accountsData = Array.isArray(payload)
        ? payload
        : (Array.isArray(payload?.data) ? payload.data : [])

      if (!res.ok) {
        const message =
          payload?.error?.message ||
          payload?.error ||
          `HTTP error! status: ${res.status}`
        throw new Error(message)
      }

      setAccounts(accountsData)
    } catch (error) {
      console.error('Failed to load accounts:', error)
      setAccounts([])
      setLoadError(error instanceof Error ? error.message : '加载发件邮箱失败')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('确定要删除这个发件邮箱吗？')) return

    try {
      const res = await fetch(`/api/sender-accounts/${id}`, { method: 'DELETE' })
      if (res.ok) {
        await loadAccounts()
      } else {
        alert('删除失败')
      }
    } catch (error) {
      console.error('Delete failed:', error)
      alert('删除失败')
    }
  }

  async function handleSetDefault(id: string) {
    try {
      const res = await fetch(`/api/sender-accounts/${id}/default`, { method: 'POST' })
      if (res.ok) {
        await loadAccounts()
      } else {
        alert('设置失败')
      }
    } catch (error) {
      console.error('Set default failed:', error)
      alert('设置失败')
    }
  }

  async function handleTestConnection(account: SenderAccount) {
    try {
      const res = await fetch('/api/sender-accounts/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(account)
      })
      const data = await res.json()
      
      if (data.success) {
        alert('✅ 连接成功！')
      } else {
        alert('❌ 连接失败：' + data.error)
      }
    } catch (error) {
      alert('测试失败：' + error)
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      {/* 导航栏 */}
      <nav className="bg-white border-b border-[#dee0e3] sticky top-0 z-50">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-[#1f2329]">邮件营销系统</span>
            </div>
            <div className="flex items-center gap-4">
              <a href="/campaigns" className="text-[#86909c] hover:text-[#3370ff]">活动</a>
              <a href="/campaigns/new" className="text-[#86909c] hover:text-[#3370ff]">新建</a>
              <a href="/settings" className="text-[#3370ff] font-medium">设置</a>
            </div>
          </div>
        </div>
      </nav>

      {/* 主内容 */}
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#1f2329] mb-2">发件邮箱管理</h1>
            <p className="text-[#86909c]">配置 SMTP 邮箱账户，支持多邮箱切换</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-[#3370ff] hover:bg-[#2860e1] text-white px-5 py-2.5 rounded-md font-medium inline-flex items-center gap-2 transition-all"
          >
            <Plus className="w-5 h-5" />
            添加邮箱
          </button>
        </div>
        {loadError && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {loadError}
          </div>
        )}

        {/* 邮箱列表 */}
        {loading ? (
          <div className="text-center py-12 text-[#86909c]">加载中...</div>
        ) : !Array.isArray(accounts) || accounts.length === 0 ? (
          <div className="bg-white rounded-lg border border-[#dee0e3] p-12 text-center">
            <Mail className="w-16 h-16 text-[#dee0e3] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#1f2329] mb-2">暂无发件邮箱</h3>
            <p className="text-[#86909c] mb-6">添加第一个发件邮箱开始发送</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-[#3370ff] hover:bg-[#2860e1] text-white px-6 py-2.5 rounded-md font-medium inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              添加邮箱
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {Array.isArray(accounts) && accounts.map((account) => (
              <div
                key={account.id}
                className={`bg-white rounded-lg border-2 p-5 transition-all ${
                  account.isDefault ? 'border-[#3370ff] bg-blue-50' : 'border-[#dee0e3]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-[#1f2329]">{account.name}</h3>
                      {account.isDefault && (
                        <span className="bg-[#3370ff] text-white text-xs px-2 py-1 rounded">默认</span>
                      )}
                      <span className={`text-xs px-2 py-1 rounded ${
                        account.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {account.status === 'ACTIVE' ? '启用' : '禁用'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                      <div className="flex items-center gap-2 text-[#86909c]">
                        <Mail className="w-4 h-4" />
                        <span>{account.email}</span>
                      </div>
                      <div className="text-[#86909c]">
                        SMTP: {account.smtpHost}:{account.smtpPort}
                      </div>
                      <div className="text-[#86909c]">
                        每日限额：{account.dailyLimit}封
                      </div>
                      <div className="text-[#86909c]">
                        已发送：{account.dailySent}封
                      </div>
                    </div>
                    {account.lastError && (
                      <div className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <XCircle className="w-4 h-4" />
                        {account.lastError}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTestConnection(account)}
                      className="text-[#3370ff] hover:text-[#2860e1] p-2"
                      title="测试连接"
                    >
                      <CheckCircle className="w-5 h-5" />
                    </button>
                    {!account.isDefault && (
                      <button
                        onClick={() => handleSetDefault(account.id)}
                        className="text-[#00b365] hover:text-[#009152] p-2"
                        title="设为默认"
                      >
                        <Save className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => setEditingAccount(account)}
                      className="text-[#3370ff] hover:text-[#2860e1] p-2"
                      title="编辑"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(account.id)}
                      className="text-red-500 hover:text-red-600 p-2"
                      title="删除"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 添加/编辑邮箱弹窗 */}
      {(showAddModal || editingAccount) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-[#dee0e3] sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-[#1f2329]">
                {editingAccount ? '编辑发件邮箱' : '添加发件邮箱'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setEditingAccount(null)
                }}
                className="text-[#86909c] hover:text-[#1f2329]"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <EmailForm
              account={editingAccount}
              onSave={() => {
                setShowAddModal(false)
                setEditingAccount(null)
                loadAccounts()
              }}
              onCancel={() => {
                setShowAddModal(false)
                setEditingAccount(null)
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function EmailForm({ account, onSave, onCancel }: { 
  account: SenderAccount | null
  onSave: () => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    name: account?.name || '',
    email: account?.email || '',
    smtpHost: account?.smtpHost || 'smtp.qq.com',
    smtpPort: account?.smtpPort || 465,
    smtpUser: account?.smtpUser || '',
    smtpPass: account?.smtpPass || '',
    smtpSecure: account?.smtpSecure ?? true,
    status: account?.status || 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
    dailyLimit: account?.dailyLimit || 500
  })

  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      const res = await fetch('/api/sender-accounts', {
        method: account ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          id: account?.id
        })
      })

      const data = await res.json()

      if (res.ok && data.success) {
        onSave()
      } else {
        // 显示错误信息
        const errorInfo = data.error
        let errorMsg = '保存失败'
        
        if (typeof errorInfo === 'string') {
          errorMsg = errorInfo
        } else if (errorInfo?.message) {
          errorMsg = errorInfo.message
        }
        
        alert(errorMsg)
      }
    } catch (error) {
      console.error('保存发件箱失败:', error)
      alert('保存失败：网络错误或服务器异常')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-5">
      <div>
        <label className="block text-sm font-medium text-[#1f2329] mb-2">
          邮箱名称 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-4 py-2 border border-[#dee0e3] rounded-md focus:outline-none focus:ring-2 focus:ring-[#3370ff]"
          placeholder="如：公司主邮箱、备用邮箱"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[#1f2329] mb-2">
          邮箱地址 <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full px-4 py-2 border border-[#dee0e3] rounded-md focus:outline-none focus:ring-2 focus:ring-[#3370ff]"
          placeholder="your-email@qq.com"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#1f2329] mb-2">
            SMTP 服务器 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.smtpHost}
            onChange={(e) => setFormData({ ...formData, smtpHost: e.target.value })}
            className="w-full px-4 py-2 border border-[#dee0e3] rounded-md focus:outline-none focus:ring-2 focus:ring-[#3370ff]"
            placeholder="smtp.qq.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#1f2329] mb-2">
            端口 <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            required
            value={formData.smtpPort}
            onChange={(e) => setFormData({ ...formData, smtpPort: parseInt(e.target.value) })}
            className="w-full px-4 py-2 border border-[#dee0e3] rounded-md focus:outline-none focus:ring-2 focus:ring-[#3370ff]"
            placeholder="465"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#1f2329] mb-2">
          SMTP 用户名 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          value={formData.smtpUser}
          onChange={(e) => setFormData({ ...formData, smtpUser: e.target.value })}
          className="w-full px-4 py-2 border border-[#dee0e3] rounded-md focus:outline-none focus:ring-2 focus:ring-[#3370ff]"
          placeholder="通常是邮箱地址"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[#1f2329] mb-2">
          SMTP 密码/授权码 <span className="text-red-500">*</span>
        </label>
        <input
          type="password"
          required
          value={formData.smtpPass}
          onChange={(e) => setFormData({ ...formData, smtpPass: e.target.value })}
          className="w-full px-4 py-2 border border-[#dee0e3] rounded-md focus:outline-none focus:ring-2 focus:ring-[#3370ff]"
          placeholder="QQ 邮箱需要授权码，不是登录密码"
        />
      </div>

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.smtpSecure}
            onChange={(e) => setFormData({ ...formData, smtpSecure: e.target.checked })}
            className="w-4 h-4"
          />
          <span className="text-sm text-[#1f2329]">启用 SSL/TLS（推荐）</span>
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#1f2329] mb-2">
          每日发送限额
        </label>
        <input
          type="number"
          value={formData.dailyLimit}
          onChange={(e) => setFormData({ ...formData, dailyLimit: parseInt(e.target.value) })}
          className="w-full px-4 py-2 border border-[#dee0e3] rounded-md focus:outline-none focus:ring-2 focus:ring-[#3370ff]"
          placeholder="500"
        />
        <p className="text-xs text-[#86909c] mt-1">QQ 个人邮箱建议 500，企业邮箱 2000</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#1f2329] mb-2">
          状态
        </label>
        <select
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
          className="w-full px-4 py-2 border border-[#dee0e3] rounded-md focus:outline-none focus:ring-2 focus:ring-[#3370ff]"
        >
          <option value="ACTIVE">启用</option>
          <option value="INACTIVE">禁用</option>
        </select>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#dee0e3]">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2 text-[#86909c] hover:text-[#1f2329]"
        >
          取消
        </button>
        <button
          type="submit"
          disabled={saving}
          className="bg-[#3370ff] hover:bg-[#2860e1] text-white px-6 py-2 rounded-md font-medium disabled:opacity-50"
        >
          {saving ? '保存中...' : '保存'}
        </button>
      </div>
    </form>
  )
}
