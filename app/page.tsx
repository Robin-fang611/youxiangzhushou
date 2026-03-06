'use client'

import Link from 'next/link'
import { Mail, Users, BarChart3, Zap, ShieldCheck, FileText, CheckCircle, HelpCircle, Upload, Edit, Send, ArrowRight } from 'lucide-react'

export default function Home() {
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
            <div className="flex items-center gap-3">
              <Link 
                href="/settings" 
                className="bg-white hover:border-[#3370ff] hover:text-[#3370ff] text-[#1f2329] px-5 py-2 rounded-md text-sm font-medium inline-flex items-center gap-2 transition-all border border-[#dee0e3]"
              >
                <Mail className="w-4 h-4" />
                邮箱设置
              </Link>
              <Link 
                href="/test" 
                className="bg-[#00b365] hover:bg-[#009152] text-white px-5 py-2 rounded-md text-sm font-medium inline-flex items-center gap-2 transition-all"
              >
                <ShieldCheck className="w-4 h-4" />
                反垃圾测试
              </Link>
              <Link 
                href="/help" 
                className="bg-[#ff7a45] hover:bg-[#e66a3a] text-white px-5 py-2 rounded-md text-sm font-medium inline-flex items-center gap-2 transition-all"
              >
                <HelpCircle className="w-4 h-4" />
                使用帮助
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-[#1f2329] mb-6 tracking-tight">
            现代化邮件营销系统
          </h1>
          <p className="text-xl text-[#86909c] mb-10 max-w-2xl mx-auto">
            高效、可靠、易用的批量邮件发送解决方案，让营销更简单
          </p>
          
          {/* 主操作按钮组 */}
          <div className="flex justify-center gap-4 mb-4">
            <Link
              href="/campaigns/new"
              className="bg-[#3370ff] hover:bg-[#2860e1] text-white px-8 py-3.5 rounded-md text-base font-medium inline-flex items-center gap-2.5 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
            >
              <Zap className="w-5 h-5" />
              开始创建营销活动
            </Link>
            <Link
              href="/campaigns"
              className="bg-white hover:border-[#3370ff] hover:text-[#3370ff] text-[#1f2329] px-8 py-3.5 rounded-md text-base font-medium inline-flex items-center gap-2.5 transition-all border border-[#dee0e3]"
            >
              <FileText className="w-5 h-5" />
              查看历史活动
            </Link>
          </div>
          
          {/* 快捷设置入口 */}
          <div className="flex justify-center gap-3 mt-6">
            <Link
              href="/settings"
              className="bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-[#3370ff] px-6 py-2.5 rounded-md text-sm font-medium inline-flex items-center gap-2 transition-all border border-blue-200"
            >
              <Mail className="w-4 h-4" />
              配置发件邮箱
            </Link>
          </div>
        </div>

        {/* 快速入门三步曲 */}
        <div className="max-w-6xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-[#1f2329] mb-10 text-center">快速入门</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg border border-[#dee0e3] p-8 hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Mail className="w-6 h-6 text-[#3370ff]" />
                </div>
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-[#3370ff] font-bold">0</div>
              </div>
              <h3 className="text-xl font-semibold text-[#1f2329] mb-3">配置邮箱</h3>
              <p className="text-[#86909c] mb-5 leading-relaxed">
                添加 SMTP 发件邮箱，支持多邮箱切换
              </p>
              <Link href="/settings" className="text-[#3370ff] hover:text-[#2860e1] font-medium inline-flex items-center gap-1.5 text-sm">
                立即配置
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="bg-white rounded-lg border border-[#dee0e3] p-8 hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Upload className="w-6 h-6 text-[#3370ff]" />
                </div>
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-[#3370ff] font-bold">1</div>
              </div>
              <h3 className="text-xl font-semibold text-[#1f2329] mb-3">上传客户列表</h3>
              <p className="text-[#86909c] mb-5 leading-relaxed">
                支持 CSV/Excel 格式，自动识别邮箱、姓名、公司等信息
              </p>
              <Link href="/campaigns/new" className="text-[#3370ff] hover:text-[#2860e1] font-medium inline-flex items-center gap-1.5 text-sm">
                立即上传
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="bg-white rounded-lg border border-[#dee0e3] p-8 hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Edit className="w-6 h-6 text-[#3370ff]" />
                </div>
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-[#3370ff] font-bold">2</div>
              </div>
              <h3 className="text-xl font-semibold text-[#1f2329] mb-3">撰写邮件内容</h3>
              <p className="text-[#86909c] mb-5 leading-relaxed">
                使用变量实现个性化，让每封邮件都独一无二
              </p>
              <Link href="/campaigns/new" className="text-[#3370ff] hover:text-[#2860e1] font-medium inline-flex items-center gap-1.5 text-sm">
                学习技巧
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="bg-white rounded-lg border border-[#dee0e3] p-8 hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                  <Send className="w-6 h-6 text-[#9f54ff]" />
                </div>
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center text-[#9f54ff] font-bold">3</div>
              </div>
              <h3 className="text-xl font-semibold text-[#1f2329] mb-3">发送并追踪</h3>
              <p className="text-[#86909c] mb-5 leading-relaxed">
                一键发送，实时监控进度，查看发送结果
              </p>
              <Link href="/campaigns" className="text-[#9f54ff] hover:text-[#8a47e6] font-medium inline-flex items-center gap-1.5 text-sm">
                查看进度
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* 功能特性 */}
        <div className="max-w-6xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-[#1f2329] mb-10 text-center">核心功能</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg border border-[#dee0e3] p-8 hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-[#3370ff]" />
              </div>
              <h3 className="text-lg font-semibold text-[#1f2329] mb-3">客户管理</h3>
              <p className="text-[#86909c] leading-relaxed">
                支持 CSV/Excel 导入，自动识别邮箱、姓名、公司等信息，智能去重验证
              </p>
            </div>

            <div className="bg-white rounded-lg border border-[#dee0e3] p-8 hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center mb-6">
                <Mail className="w-6 h-6 text-[#00b365]" />
              </div>
              <h3 className="text-lg font-semibold text-[#1f2329] mb-3">个性化发送</h3>
              <p className="text-[#86909c] leading-relaxed">
                支持变量替换（{`{name}`}、{`{company}`}），每封邮件都是专属定制
              </p>
            </div>

            <div className="bg-white rounded-lg border border-[#dee0e3] p-8 hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center mb-6">
                <BarChart3 className="w-6 h-6 text-[#9f54ff]" />
              </div>
              <h3 className="text-lg font-semibold text-[#1f2329] mb-3">实时追踪</h3>
              <p className="text-[#86909c] leading-relaxed">
                完整的发送日志、成功/失败统计，随时掌握营销活动进度
              </p>
            </div>
          </div>
        </div>

        {/* 产品优势 */}
        <div className="max-w-5xl mx-auto mb-16 bg-white rounded-lg border border-[#dee0e3] p-10">
          <h2 className="text-3xl font-bold text-[#1f2329] mb-10 text-center">产品优势</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start gap-4 p-5 rounded-md hover:bg-[#f7f8fa] transition-colors">
              <div className="w-8 h-8 bg-green-50 rounded-md flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-[#00b365]" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#1f2329] mb-1.5">智能格式识别</h3>
                <p className="text-[#86909c] text-sm">自动检测中文/英文逗号，支持带表头或不带表头格式</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-5 rounded-md hover:bg-[#f7f8fa] transition-colors">
              <div className="w-8 h-8 bg-blue-50 rounded-md flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-5 h-5 text-[#3370ff]" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#1f2329] mb-1.5">反垃圾邮件优化</h3>
                <p className="text-[#86909c] text-sm">内置垃圾邮件检测，确保邮件送达率</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-5 rounded-md hover:bg-[#f7f8fa] transition-colors">
              <div className="w-8 h-8 bg-purple-50 rounded-md flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-[#9f54ff]" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#1f2329] mb-1.5">灵活字段支持</h3>
                <p className="text-[#86909c] text-sm">姓名和公司字段可选，只有邮箱也能正常发送</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-5 rounded-md hover:bg-[#f7f8fa] transition-colors">
              <div className="w-8 h-8 bg-orange-50 rounded-md flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-[#ff7a45]" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#1f2329] mb-1.5">完整日志记录</h3>
                <p className="text-[#86909c] text-sm">详细的发送日志和错误信息，问题排查更轻松</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mb-16">
          <p className="text-xl text-[#86909c] mb-8 font-medium">准备好开始您的第一次邮件营销了吗？</p>
          <Link
            href="/campaigns/new"
            className="bg-[#3370ff] hover:bg-[#2860e1] text-white px-10 py-4 rounded-md text-base font-medium inline-flex items-center gap-2.5 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
          >
            <Zap className="w-5 h-5" />
            立即开始
          </Link>
        </div>
      </div>

      {/* 页脚 */}
      <footer className="bg-white border-t border-[#dee0e3] py-8">
        <div className="container mx-auto px-6 text-center text-[#86909c] text-sm">
          <p>© 2024 邮件营销系统 · 专业、可靠、易用</p>
        </div>
      </footer>
    </div>
  )
}
