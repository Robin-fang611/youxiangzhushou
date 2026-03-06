'use client'

import Link from 'next/link'
import { ArrowLeft, FileText, Mail, Users, AlertCircle, CheckCircle, HelpCircle } from 'lucide-react'

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">使用帮助</h1>
          <p className="text-gray-600">详细的使用指南和常见问题解答</p>
        </div>

        {/* 快速入门 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-blue-600" />
            快速入门
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">准备客户列表</h3>
                <p className="text-gray-600 text-sm">
                  使用 Excel 或 CSV 文件整理客户信息，确保包含邮箱地址
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-green-600 font-bold">2</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">上传文件</h3>
                <p className="text-gray-600 text-sm">
                  在新建营销活动页面上传文件，系统会自动识别和验证
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-purple-600 font-bold">3</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">撰写邮件</h3>
                <p className="text-gray-600 text-sm">
                  填写邮件主题和正文，可以使用个性化变量
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-orange-600 font-bold">4</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">发送并追踪</h3>
                <p className="text-gray-600 text-sm">
                  点击发送后，可以实时查看发送进度和结果
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 文件格式说明 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-6 h-6 text-green-600" />
            文件格式要求
          </h2>
          
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">支持的格式</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li>CSV 文件（.csv）</li>
              <li>Excel 文件（.xlsx, .xls）</li>
            </ul>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">必填字段</h3>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 mb-2">
                <strong>✅ 邮箱（必须）</strong> - 包含 @ 符号的有效邮箱地址
              </p>
              <p className="text-green-700 text-sm">
                示例：zhangsan@example.com, lisi@example.com
              </p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">可选字段</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <ul className="text-blue-800 space-y-2">
                <li>
                  <strong>📝 姓名</strong> - 用于个性化称呼
                  <br />
                  <span className="text-sm text-blue-700">示例：张三，李四</span>
                </li>
                <li>
                  <strong>🏢 公司</strong> - 用于个性化内容
                  <br />
                  <span className="text-sm text-blue-700">示例：示例公司，示例集团</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">格式示例</h3>
            
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">示例 1：带表头（推荐）</p>
              <div className="bg-gray-50 border border-gray-200 rounded p-3 font-mono text-sm">
                <div className="grid grid-cols-3 gap-2 pb-2 border-b border-gray-300 mb-2">
                  <span className="text-blue-600 font-bold">姓名</span>
                  <span className="text-green-600 font-bold">邮箱</span>
                  <span className="text-purple-600 font-bold">公司</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span>张三</span>
                  <span>zhangsan@example.com</span>
                  <span>示例公司</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span>李四</span>
                  <span>lisi@example.com</span>
                  <span>示例集团</span>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">示例 2：无表头（纯数据）</p>
              <div className="bg-gray-50 border border-gray-200 rounded p-3 font-mono text-sm">
                <div className="grid grid-cols-3 gap-2">
                  <span>张三</span>
                  <span>zhangsan@example.com</span>
                  <span>示例公司</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span>李四</span>
                  <span>lisi@example.com</span>
                  <span>示例集团</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              注意事项
            </h3>
            <ul className="text-yellow-800 text-sm space-y-1">
              <li>• 系统会自动检测中文逗号（，）和英文逗号（,）</li>
              <li>• 邮箱地址必须包含 @ 符号</li>
              <li>• 姓名和公司字段可以为空</li>
              <li>• 如果只有邮箱，可以只有一列</li>
            </ul>
          </div>
        </div>

        {/* 个性化变量 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Mail className="w-6 h-6 text-purple-600" />
            个性化变量
          </h2>
          
          <p className="text-gray-700 mb-4">
            在邮件主题和正文中使用变量，可以实现个性化内容，让每封邮件都是专属定制。
          </p>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-purple-900 mb-2">可用变量</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <code className="bg-white px-3 py-1 rounded text-purple-600 font-mono text-sm">{'{{name}}'}</code>
                <div>
                  <p className="text-purple-900 font-medium">姓名</p>
                  <p className="text-purple-700 text-sm">自动替换为联系人的姓名</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <code className="bg-white px-3 py-1 rounded text-purple-600 font-mono text-sm">{'{{company}}'}</code>
                <div>
                  <p className="text-purple-900 font-medium">公司</p>
                  <p className="text-purple-700 text-sm">自动替换为联系人的公司</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">使用示例</h3>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">邮件主题：</p>
                <code className="block bg-white p-3 rounded border border-gray-200 text-sm">
                  尊敬的 {'{{name}}'}，这是我们为您准备的特别优惠
                </code>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">邮件正文：</p>
                <code className="block bg-white p-3 rounded border border-gray-200 text-sm whitespace-pre-line">
                  尊敬的 {'{{name}}'}：

                  您好！感谢您对 {'{{company}}'} 的关注。

                  我们为您准备了专属优惠，期待您的参与！

                  此致
                  敬礼
                </code>
              </div>
            </div>
          </div>
        </div>

        {/* 常见问题 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-orange-600" />
            常见问题
          </h2>
          
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Q: 上传文件后提示"未找到有效的邮箱地址"怎么办？</h3>
              <p className="text-gray-700 text-sm">
                A: 请检查：1) 文件中是否包含有效的邮箱地址（必须有@符号）；2) 如果是 CSV 文件，确保使用英文逗号或中文逗号作为分隔符；3) 第一行可以是表头（如：邮箱，姓名，公司）或直接是数据。
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Q: 姓名和公司字段必须填写吗？</h3>
              <p className="text-gray-700 text-sm">
                A: 不需要。姓名和公司是可选字段，可以留空。系统会自动使用空字符串填充。即使只有邮箱地址，也能正常发送邮件。
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Q: 如何测试邮件是否会被识别为垃圾邮件？</h3>
              <p className="text-gray-700 text-sm">
                A: 可以使用系统的"反垃圾邮件测试"功能（访问 /test 页面），检查邮件内容的垃圾邮件评分，并根据建议优化内容。
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Q: 发送失败怎么办？</h3>
              <p className="text-gray-700 text-sm">
                A: 请检查：1) SMTP 配置是否正确；2) 邮箱地址是否有效；3) 查看发送日志了解具体错误信息。系统会记录每封邮件的发送状态和错误原因。
              </p>
            </div>
          </div>
        </div>

        {/* 快速操作 */}
        <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">准备好开始了吗？</h2>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/campaigns/new"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              <Users className="w-5 h-5" />
              创建营销活动
            </Link>
            <Link
              href="/campaigns"
              className="inline-flex items-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors border border-blue-200"
            >
              <FileText className="w-5 h-5" />
              查看历史活动
            </Link>
            <Link
              href="/test"
              className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              <CheckCircle className="w-5 h-5" />
              反垃圾邮件测试
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
