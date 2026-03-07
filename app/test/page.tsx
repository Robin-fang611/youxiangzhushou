'use client'

import { useState } from 'react'
import { sendTestEmails, checkEmailQuality, verifySMTPConnection, getSendStatistics } from '../test-actions'
import { Mail, CheckCircle, XCircle, Loader2, BarChart3, ShieldCheck } from 'lucide-react'

export default function TestPage() {
  const [testing, setTesting] = useState(false)
  const [testResults, setTestResults] = useState<any[]>([])
  const [smtpStatus, setSmtpStatus] = useState<any>(null)
  const [qualityCheck, setQualityCheck] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [testSubject, setTestSubject] = useState('【测试邮件】邮件系统送达率测试')
  const [testBody, setTestBody] = useState(`尊敬的测试用户：

您好！这是一封测试邮件。

---
此致
敬礼

如不再接收，请回复"退订"`)

  const handleSendTest = async () => {
    setTesting(true)
    const result = await sendTestEmails()
    setTestResults(result.results || [])
    setTesting(false)
  }

  const handleCheckSMTP = async () => {
    const result = await verifySMTPConnection()
    setSmtpStatus(result)
  }

  const handleCheckQuality = async () => {
    const result = await checkEmailQuality(testSubject, testBody)
    setQualityCheck(result)
  }

  const handleGetStats = async () => {
    const result = await getSendStatistics()
    setStats(result)
  }

  const safeIssues = Array.isArray(qualityCheck?.issues) ? qualityCheck.issues : []
  const safeSuggestions = Array.isArray(qualityCheck?.suggestions) ? qualityCheck.suggestions : []
  const safeTestResults = Array.isArray(testResults) ? testResults : []
  const safeDomainReputation =
    stats && typeof stats.domainReputation === 'object' && stats.domainReputation !== null
      ? stats.domainReputation
      : {}

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            <ShieldCheck className="w-8 h-8 inline mr-2" />
            反垃圾邮件测试中心
          </h1>
          <p className="text-gray-600">
            测试邮件送达率，检查反垃圾邮件配置
          </p>
        </div>

        {/* 快速操作 */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <button
            onClick={handleCheckSMTP}
            className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <Mail className="w-6 h-6 text-blue-600 mb-2" />
            <div className="text-sm font-medium">SMTP 检查</div>
          </button>

          <button
            onClick={handleCheckQuality}
            className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <CheckCircle className="w-6 h-6 text-green-600 mb-2" />
            <div className="text-sm font-medium">内容质量检查</div>
          </button>

          <button
            onClick={handleSendTest}
            disabled={testing}
            className="p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Mail className="w-6 h-6 mb-2" />
            <div className="text-sm font-medium">
              {testing ? '发送中...' : '发送测试邮件'}
            </div>
          </button>

          <button
            onClick={handleGetStats}
            className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <BarChart3 className="w-6 h-6 text-purple-600 mb-2" />
            <div className="text-sm font-medium">发送统计</div>
          </button>
        </div>

        {/* SMTP 状态 */}
        {smtpStatus && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">SMTP 连接状态</h2>
            <div className="flex items-center gap-3">
              {smtpStatus.success ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600" />
              )}
              <span className={smtpStatus.success ? 'text-green-600' : 'text-red-600'}>
                {smtpStatus.message}
              </span>
            </div>
            <div className="text-sm text-gray-600 mt-2">
              检查时间：{new Date(smtpStatus.timestamp).toLocaleString('zh-CN')}
            </div>
          </div>
        )}

        {/* 内容质量检查 */}
        {qualityCheck && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">邮件内容质量</h2>
            
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div>
                <div className="text-sm text-gray-600">质量评分</div>
                <div className={`text-3xl font-bold ${
                  qualityCheck.score < 5 ? 'text-green-600' : 
                  qualityCheck.score < 10 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {qualityCheck.score} / {qualityCheck.maxScore}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">评级</div>
                <div className="text-3xl font-bold text-gray-900">{qualityCheck.rating}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">是否通过</div>
                <div className={`text-3xl font-bold ${
                  qualityCheck.passed ? 'text-green-600' : 'text-red-600'
                }`}>
                  {qualityCheck.passed ? '✓' : '✗'}
                </div>
              </div>
            </div>

            {safeIssues.length > 0 && (
              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">发现的问题:</h3>
                <ul className="list-disc list-inside text-red-600 space-y-1">
                  {safeIssues.map((issue: string, i: number) => (
                    <li key={i}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}

            {safeSuggestions.length > 0 && (
              <div className="border-t pt-4 mt-4">
                <h3 className="font-medium mb-2">优化建议:</h3>
                <ul className="list-disc list-inside text-green-600 space-y-1">
                  {safeSuggestions.map((suggestion: string, i: number) => (
                    <li key={i}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* 测试邮件编辑 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">测试邮件内容</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                邮件主题
              </label>
              <input
                type="text"
                value={testSubject}
                onChange={(e) => setTestSubject(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                邮件正文
              </label>
              <textarea
                value={testBody}
                onChange={(e) => setTestBody(e.target.value)}
                rows={8}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* 发送测试结果 */}
        {safeTestResults.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">测试邮件发送结果</h2>
            
            <div className="space-y-3">
              {safeTestResults.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {result.success ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-600" />
                    )}
                    <div>
                      <div className="font-medium">{result.provider}</div>
                      <div className="text-sm text-gray-600">{result.email}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    {result.success ? (
                      <div className="text-green-600">发送成功</div>
                    ) : (
                      <div className="text-red-600 text-sm">{result.error}</div>
                    )}
                    {result.spamScore !== undefined && (
                      <div className="text-xs text-gray-600">
                        垃圾邮件评分：{result.spamScore}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 发送统计 */}
        {stats && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">发送统计</h2>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-gray-600">总收件人数</div>
                <div className="text-3xl font-bold text-gray-900">{stats.totalRecipients || 0}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">总发送数</div>
                <div className="text-3xl font-bold text-blue-600">{stats.totalSent || 0}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">域名信誉</div>
                <div className="text-3xl font-bold text-green-600">
                  {Object.keys(safeDomainReputation).length} 个
                </div>
              </div>
            </div>

            {Object.keys(safeDomainReputation).length > 0 && (
              <div className="border-t mt-4 pt-4">
                <h3 className="font-medium mb-2">域名信誉详情:</h3>
                <div className="grid md:grid-cols-4 gap-2">
                  {Object.entries(safeDomainReputation).map(([domain, rep]: any) => (
                    <div key={domain} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">{domain}</span>
                      <span className={`font-bold ${
                        rep > 70 ? 'text-green-600' : rep > 50 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {rep}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 反垃圾邮件建议 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-4">
            🛡️ 反垃圾邮件最佳实践
          </h2>
          <ul className="space-y-2 text-blue-800">
            <li>✅ 配置 SPF、DKIM、DMARC 记录</li>
            <li>✅ 避免使用敏感词汇（免费、赚钱、点击等）</li>
            <li>✅ 主题长度控制在 10-50 字符</li>
            <li>✅ 包含退订说明和联系方式</li>
            <li>✅ 控制发送频率，避免短时间内大量发送</li>
            <li>✅ 定期清理无效邮箱</li>
            <li>✅ 使用 Mail-Tester 等工具检测评分</li>
          </ul>
          <div className="mt-4">
            <a
              href="/ANTI_SPAM_GUIDE.md"
              target="_blank"
              className="text-blue-600 hover:text-blue-700 underline"
            >
              查看完整的反垃圾邮件指南 →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
