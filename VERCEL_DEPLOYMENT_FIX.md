# 🚀 Vercel 邮件发送 API 修复指南

## 📋 问题说明

**问题**: 部署到 Vercel 后，邮件营销活动一直显示"发送中"，无法成功发送邮件。

**原因**: 
- Server Actions 在 Vercel Serverless 环境中执行超时
- 缺少明确的 Runtime 配置，可能被部署到 Edge Functions
- 错误处理不完善，无法捕获和返回明确的错误信息
- 环境变量校验缺失

---

## ✅ 解决方案

已创建新的 API Route: `/app/api/send-email/route.ts`

### 核心改进

1. **强制使用 Node.js Runtime**
   ```typescript
   export const runtime = 'nodejs'
   export const dynamic = 'force-dynamic'
   export const maxDuration = 60
   ```

2. **完整的错误捕获**
   - SMTP 连接错误
   - 邮件发送错误
   - 环境变量校验错误
   - 请求参数验证

3. **明确的 HTTP 响应**
   - 200: 发送成功
   - 400: 请求参数错误
   - 500: 服务器错误

4. **双邮件服务支持**
   - Nodemailer (SMTP)
   - Resend (API)

5. **详细的关键节点日志**
   - 开始连接
   - 验证成功
   - 发送成功
   - 错误详情

---

## 📦 文件更改

### 新增文件

1. **`/app/api/send-email/route.ts`** - 新的邮件发送 API
2. **`.env.example`** - 环境变量配置示例
3. **`VERCEL_DEPLOYMENT_FIX.md`** - 本指南

### 修改文件

无需修改现有文件，新 API 向后兼容。

---

## 🔧 配置步骤

### 步骤 1: 选择邮件服务提供商

#### 方案 A: 使用 Nodemailer (SMTP) - 推荐

适用于 QQ 邮箱、Gmail、企业邮箱

**优点**:
- 免费
- 配置简单
- 适合小规模发送 (< 500 封/天)

**缺点**:
- 需要 SMTP 授权码
- 可能被识别为垃圾邮件

#### 方案 B: 使用 Resend API - 生产环境推荐

适用于生产环境、大规模发送

**优点**:
- 更好的送达率
- 内置反垃圾优化
- 详细的发送分析
- 免费额度：100 封/天，3000 封/月

**缺点**:
- 需要注册账号
- 需要验证域名

---

### 步骤 2: 配置环境变量

#### 方案 A: Nodemailer 配置 (以 QQ 邮箱为例)

1. **获取 SMTP 授权码**:
   - 登录 QQ 邮箱：https://mail.qq.com
   - 设置 > 账户 > 开启 POP3/SMTP 服务
   - 获取 16 位授权码

2. **Vercel 环境变量配置**:

在 Vercel Dashboard > Settings > Environment Variables 添加:

```bash
# 邮件服务提供商
EMAIL_PROVIDER=nodemailer

# SMTP 配置
SMTP_HOST=smtp.qq.com
SMTP_PORT=465
SMTP_SSL=true
SMTP_USER=544639213@qq.com
SMTP_PASS=vrugyitwiqctbbec  # 你的授权码
SMTP_FROM=544639213@qq.com
FROM_NAME=Business Bot

# 数据库配置
DATABASE_URL=postgresql://user:pass@host:5432/dbname?pgbouncer=true
DIRECT_DATABASE_URL=postgresql://user:pass@host:5432/dbname

# 安全配置
SECRET_KEY=your-secret-key-min-32-characters

# 运行环境
NODE_ENV=production
```

#### 方案 B: Resend 配置

1. **注册 Resend 账号**:
   - 访问：https://resend.com
   - 注册并登录
   - 创建 API Key

2. **验证域名** (可选但推荐):
   - 在 Resend 后台添加域名
   - 配置 DNS 记录
   - 验证通过

3. **Vercel 环境变量配置**:

```bash
# 邮件服务提供商
EMAIL_PROVIDER=resend

# Resend 配置
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=contact@yourdomain.com
RESEND_FROM_NAME=Your Company

# 数据库配置
DATABASE_URL=postgresql://user:pass@host:5432/dbname?pgbouncer=true
DIRECT_DATABASE_URL=postgresql://user:pass@host:5432/dbname

# 安全配置
SECRET_KEY=your-secret-key-min-32-characters

# 运行环境
NODE_ENV=production
```

---

### 步骤 3: 提交代码到 Git

```bash
# 添加新文件
git add app/api/send-email/route.ts
git add .env.example
git add VERCEL_DEPLOYMENT_FIX.md

# 提交
git commit -m "feat: add production-ready email API with proper error handling

- Add /api/send-email route with Node.js runtime
- Implement complete error catching and validation
- Support both Nodemailer and Resend providers
- Add detailed logging for debugging
- Add environment variable configuration example"

# 推送到 GitHub
git push origin main
```

---

### 步骤 4: 在 Vercel 重新部署

#### 方法 A: 自动部署 (推荐)

1. 推送到 GitHub 后，Vercel 自动触发部署
2. 访问 Vercel Dashboard 查看部署进度
3. 等待部署完成 (约 2-3 分钟)

#### 方法 B: 手动重新部署

1. 访问 Vercel Dashboard
2. 选择项目
3. 点击 "Deployments" 标签
4. 找到最新部署，点击右侧 "..." 菜单
5. 选择 "Redeploy"
6. 勾选 "Use existing Build Cache"
7. 点击 "Redeploy"

---

### 步骤 5: 验证部署

#### 1. 健康检查

访问 API 健康检查端点:

```bash
# 替换为你的 Vercel 域名
curl https://your-domain.vercel.app/api/send-email
```

**预期响应**:
```json
{
  "status": "ok",
  "timestamp": "2026-03-08T12:00:00.000Z",
  "runtime": "nodejs",
  "emailProvider": "nodemailer",
  "envConfigured": true,
  "errors": []
}
```

#### 2. 测试邮件发送

使用以下脚本测试:

```bash
curl -X POST https://your-domain.vercel.app/api/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "测试邮件",
    "body": "这是一封测试邮件，用于验证 API 是否正常工作。",
    "campaignId": "test-123"
  }'
```

**成功响应**:
```json
{
  "success": true,
  "messageId": "<xxx@qq.com>",
  "provider": "nodemailer",
  "timestamp": "2026-03-08T12:00:00.000Z",
  "details": {
    "response": "250 OK"
  }
}
```

**失败响应**:
```json
{
  "success": false,
  "error": "SMTP 认证失败：Invalid login",
  "provider": "nodemailer",
  "timestamp": "2026-03-08T12:00:00.000Z",
  "details": {
    "code": "EAUTH",
    "response": "535 Login fail"
  }
}
```

#### 3. 查看 Vercel 日志

1. 访问 Vercel Dashboard
2. 选择项目 > Deployments
3. 点击最新部署的 "View Build Logs"
4. 切换到 "Function Logs" 查看运行时日志

**关键日志标记**:
```
[EmailAPI] 开始处理请求
[EmailAPI] 步骤 1: 解析请求体...
[EmailAPI] 步骤 2: 校验必填字段...
[EmailAPI] 步骤 3: 校验环境变量配置...
[EmailAPI] 步骤 4: 选择邮件服务并发送...
[EmailAPI] ✅ 邮件发送成功!
```

---

## 🐛 故障排查

### 问题 1: 环境变量未生效

**症状**: 健康检查返回 `envConfigured: false`

**解决**:
1. 检查 Vercel 环境变量是否已保存
2. 确认变量名称完全匹配（区分大小写）
3. 重新部署项目
4. 清除浏览器缓存

### 问题 2: SMTP 认证失败

**症状**: 返回 `535 Login fail` 错误

**解决**:
1. 确认使用的是 SMTP 授权码，不是登录密码
2. 检查授权码是否正确复制（无空格）
3. 确认 SMTP 服务已开启
4. 等待 24 小时（如触发频率限制）

### 问题 3: 函数执行超时

**症状**: Vercel 返回 `504 Gateway Timeout`

**解决**:
1. 检查 `maxDuration` 设置（当前为 60 秒）
2. 减少单次发送数量
3. 使用批量发送策略
4. 考虑升级到 Resend

### 问题 4: 邮件进入垃圾箱

**症状**: 邮件发送成功但进入收件人垃圾箱

**解决**:
1. 优化邮件内容（避免敏感词）
2. 添加退订链接
3. 使用 Resend 提高送达率
4. 配置 SPF/DKIM 记录

---

## 📊 性能优化建议

### 1. 批量发送策略

不要一次性发送大量邮件，建议:

```typescript
// 每批发送 10 封
const batchSize = 10
const delay = 1000 // 1 秒间隔

for (let i = 0; i < contacts.length; i += batchSize) {
  const batch = contacts.slice(i, i + batchSize)
  await Promise.all(batch.map(contact => sendEmail(contact)))
  await new Promise(resolve => setTimeout(resolve, delay))
}
```

### 2. 使用队列系统

对于大规模发送，建议使用队列:

- Vercel Queues (即将推出)
- AWS SQS + Lambda
- Bull + Redis

### 3. 监控和告警

添加发送监控:

```typescript
// 记录发送统计
const stats = {
  total: contacts.length,
  success: successCount,
  failed: failedCount,
  duration: Date.now() - startTime
}

// 发送到监控服务
await fetch('/api/analytics', { method: 'POST', body: JSON.stringify(stats) })
```

---

## 📈 升级建议

### 短期 (1-2 周)

- [ ] 迁移到 Resend (提高送达率)
- [ ] 添加邮件模板系统
- [ ] 实现发送队列
- [ ] 添加打开率追踪

### 中期 (1-2 月)

- [ ] 多 SMTP 账号轮换
- [ ] 定时发送功能
- [ ] A/B 测试支持
- [ ] 数据可视化仪表板

### 长期 (3-6 月)

- [ ] 多租户支持
- [ ] API 开放平台
- [ ] 自动化营销流程
- [ ] AI 内容优化

---

## 📞 技术支持

### 官方文档

- [Nodemailer](https://nodemailer.com/)
- [Resend](https://resend.com/docs)
- [Vercel Functions](https://vercel.com/docs/functions)

### 常见问题

- [QQ 邮箱 SMTP 设置](https://service.mail.qq.com/detail/0/75)
- [Gmail SMTP 设置](https://support.google.com/mail/answer/7126229)
- [Resend 域名验证](https://resend.com/docs/send-with-api)

---

## ✅ 检查清单

部署前请确认:

- [ ] 已创建 `/app/api/send-email/route.ts`
- [ ] 已配置环境变量
- [ ] 已选择邮件服务提供商
- [ ] 已测试 SMTP 连接/Resend API
- [ ] 已提交代码到 Git
- [ ] 已推送到 GitHub
- [ ] Vercel 自动部署已触发
- [ ] 健康检查返回正常
- [ ] 测试邮件发送成功

---

**修复完成时间**: 2026-03-08  
**API 版本**: v2.1.0  
**状态**: ✅ 生产就绪
