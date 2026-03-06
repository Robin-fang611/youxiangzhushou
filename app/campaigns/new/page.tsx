'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { parseFile, createCampaign, startCampaign } from '../../actions'
import { Upload, FileText, Send, ChevronRight, Loader2, AlertCircle, Mail } from 'lucide-react'

interface Customer {
  email: string
  name?: string
  company?: string
}

export default function NewCampaignPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [campaignName, setCampaignName] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [error, setError] = useState('')
  const [errorSolution, setErrorSolution] = useState('')

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError('')
    setErrorSolution('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const result = await parseFile(formData)

      if (result.error) {
        setError(result.error)
        setErrorSolution('请检查文件格式是否正确，或查看使用帮助了解详细的格式要求。')
        return
      }

      if (result.validCount === 0) {
        setError('未找到有效的邮箱地址。请确保文件第一行是表头（如：邮箱，姓名，公司），或直接使用数据行。')
        setErrorSolution('💡 提示：邮箱地址必须包含 @ 符号。系统支持 CSV/Excel 格式，自动识别中文/英文逗号。')
        return
      }

      setCustomers(result.validCustomers)
      setStep(2)
    } catch (err) {
      setError('文件上传失败，请重试')
      setErrorSolution('如果问题持续，请检查：1) 文件是否损坏；2) 文件格式是否支持；3) 文件大小是否过大。')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCampaign = async () => {
    if (!subject.trim() || !body.trim()) {
      setError('请填写邮件主题和正文')
      setErrorSolution('💡 提示：邮件主题和正文是必填项。可以使用 {{name}} 和 {{company}} 变量实现个性化内容。')
      return
    }

    setLoading(true)
    setError('')
    setErrorSolution('')

    try {
      const result = await createCampaign(customers, subject, body, campaignName || undefined)

      if (!result.success) {
        setError(result.error || '创建失败')
        if (result.error?.includes('customer')) {
          setErrorSolution('数据库错误，请检查数据库连接或联系技术支持。')
        } else if (result.error?.includes('SMTP')) {
          setErrorSolution('邮件服务器配置错误，请检查 SMTP 设置是否正确。')
        } else {
          setErrorSolution('如果问题持续，请查看系统日志或联系技术支持。')
        }
        return
      }

      // 自动开始发送
      const startResult = await startCampaign(result.campaignId!)
      if (startResult.success) {
        router.push(`/campaigns/${result.campaignId}/status`)
      } else {
        setError(startResult.error || '创建成功但启动失败')
        setErrorSolution('活动已创建，但启动失败。您可以稍后在 activity 列表中手动启动。')
      }
    } catch (err) {
      setError('系统错误，请重试')
      setErrorSolution('如果问题持续存在，请查看浏览器控制台（F12）的错误日志，或联系技术支持。')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-[#dee0e3] sticky top-0 z-50">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-[#1f2329]">新建活动</span>
            </div>
            <div className="flex items-center gap-4">
              <a href="/" className="text-[#86909c] hover:text-[#3370ff]">首页</a>
              <a href="/campaigns" className="text-[#86909c] hover:text-[#3370ff]">活动</a>
              <a href="/campaigns/new" className="text-[#3370ff] font-medium">新建</a>
              <a href="/settings" className="text-[#86909c] hover:text-[#3370ff]">设置</a>
            </div>
          </div>
        </div>
      </nav>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">新建营销活动</h1>
          <p className="text-gray-600">按照步骤创建并发送您的营销活动</p>
        </div>

        {/* Steps Indicator */}
        <div className="flex items-center mb-8">
          <div className={`flex items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
              step >= 1 ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'
            }`}>
              <Upload className="w-5 h-5" />
            </div>
            <span className="ml-2 font-medium">上传客户</span>
          </div>

          <ChevronRight className="w-5 h-5 mx-4 text-gray-400" />

          <div className={`flex items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
              step >= 2 ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'
            }`}>
              <FileText className="w-5 h-5" />
            </div>
            <span className="ml-2 font-medium">撰写邮件</span>
          </div>

          <ChevronRight className="w-5 h-5 mx-4 text-gray-400" />

          <div className={`flex items-center ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
              step >= 3 ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'
            }`}>
              <Send className="w-5 h-5" />
            </div>
            <span className="ml-2 font-medium">发送</span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-medium text-red-800">错误</h3>
              <p className="text-red-700 text-sm mt-1">{error}</p>
              {errorSolution && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                  <strong>💡 解决方案：</strong>
                  <p className="mt-1">{errorSolution}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow p-6">
          {step === 1 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">步骤 1: 上传客户列表</h2>
              <p className="text-gray-600 mb-6">
                支持 CSV 或 Excel 文件，自动识别邮箱、姓名、公司等信息
              </p>

              {/* 格式说明 */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">📋 文件格式要求：</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>✅ <strong>必填字段：</strong>邮箱（包含 @ 符号）</li>
                  <li>✅ <strong>可选字段：</strong>姓名、公司（可以为空）</li>
                  <li>✅ <strong>支持格式：</strong>CSV, XLSX, XLS</li>
                  <li>✅ <strong>智能识别：</strong>自动检测中文/英文逗号，支持带表头或不带表头</li>
                </ul>
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <p className="text-xs text-blue-700 mb-1"><strong>示例 1（带表头）：</strong></p>
                  <code className="text-xs bg-white px-2 py-1 rounded">姓名，邮箱，公司</code>
                  <p className="text-xs text-blue-700 mt-2 mb-1"><strong>示例 2（无表头）：</strong></p>
                  <code className="text-xs bg-white px-2 py-1 rounded">张三，zhangsan@example.com，示例公司</code>
                </div>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  disabled={loading}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-lg font-medium text-gray-700 mb-2">
                    点击上传或拖拽文件到此处
                  </p>
                  <p className="text-sm text-gray-500">支持 CSV, XLSX, XLS 格式</p>
                </label>
                {loading && (
                  <div className="mt-4">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" />
                    <p className="text-sm text-gray-600 mt-2">正在解析文件...</p>
                  </div>
                )}
              </div>

              {customers.length > 0 && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800">
                    <strong>✅ 成功解析 {customers.length} 个有效联系人</strong>
                  </p>
                  <div className="mt-3 max-h-40 overflow-y-auto bg-white rounded border border-green-200 p-2">
                    <table className="w-full text-sm">
                      <thead className="bg-green-100">
                        <tr>
                          <th className="text-left p-2">邮箱</th>
                          <th className="text-left p-2">姓名</th>
                          <th className="text-left p-2">公司</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customers.slice(0, 5).map((c, i) => (
                          <tr key={i} className="border-t border-green-100">
                            <td className="p-2">{c.email}</td>
                            <td className="p-2">{c.name || '-'}</td>
                            <td className="p-2">{c.company || '-'}</td>
                          </tr>
                        ))}
                        {customers.length > 5 && (
                          <tr>
                            <td colSpan={3} className="p-2 text-center text-gray-500 text-xs">
                              还有 {customers.length - 5} 个联系人...
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-green-700 text-sm mt-3">
                    👉 点击"下一步"继续撰写邮件内容
                  </p>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">步骤 2: 撰写邮件内容</h2>
              <p className="text-gray-600 mb-6">
                使用 {'{{name}}'} 和 {'{{company}}'} 变量实现个性化内容
              </p>

              {/* 变量使用提示 */}
              <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <h3 className="font-semibold text-purple-900 mb-2">💡 个性化变量使用说明：</h3>
                <ul className="text-sm text-purple-800 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-mono text-xs mt-0.5">{'{{name}}'}</span>
                    <span>→ 自动替换为联系人姓名（如：张三）</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-mono text-xs mt-0.5">{'{{company}}'}</span>
                    <span>→ 自动替换为联系人公司（如：示例公司）</span>
                  </li>
                </ul>
                <div className="mt-3 p-3 bg-white rounded border border-purple-200">
                  <p className="text-xs text-purple-700 mb-1"><strong>示例：</strong></p>
                  <p className="text-sm text-gray-700">
                    主题：尊敬的 {'{{name}}'}，这是我们为您准备的特别优惠<br/>
                    正文：尊敬的 {'{{name}}'}：您好！感谢您对 {'{{company}}'} 的关注...
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    活动名称（可选）
                  </label>
                  <input
                    type="text"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder="例如：2024 春季促销活动"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    邮件主题 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="例如：尊敬的 {{name}}，这是我们为您准备的特别优惠"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    邮件正文 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder={`尊敬的 {{name}}：\n\n您好！感谢您对 {{company}} 的关注...\n\n此致\n敬礼`}
                    rows={12}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                  />
                </div>
              </div>

              {/* 客户列表预览 */}
              <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-2">
                  📧 将发送给 {customers.length} 位联系人
                </h3>
                <div className="flex gap-4 text-sm text-gray-600">
                  <span>姓名：{customers.filter(c => c.name).length} 位有姓名</span>
                  <span>公司：{customers.filter(c => c.company).length} 位有公司</span>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  ← 上一步
                </button>
                <button
                  onClick={handleCreateCampaign}
                  disabled={loading || !subject.trim() || !body.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      创建中...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      创建并发送
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
