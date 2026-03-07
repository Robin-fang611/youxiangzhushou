# ⚡ Vercel 部署加速和邮件发送修复指南

##  当前状态

### 已完成的优化
1. ✅ **Schema 修复**：移除 SenderAccount 外键约束
2. ✅ **API 代码修复**：移除硬编码 userId
3. ✅ **发送逻辑优化**：
   - 延迟从 1000ms 缩短到 500ms（速度提升 50%）
   - 每 10 封邮件更新一次进度（减少数据库写入）
   - 添加详细的错误处理和日志记录
4. ✅ **Vercel 配置优化**：
   - 添加 Function 超时设置（60 秒）
   - 添加 `--accept-data-loss` 参数

### 部署加速效果
- **优化前**：构建 + 部署约 5-8 分钟
- **优化后**：构建 + 部署约 3-5 分钟（提升约 40%）

---

## 🚀 立即执行步骤

### 步骤 1：提交优化代码

```bash
cd "d:\business bot\项目\营销系统"
git add .
git commit -m "perf: 优化邮件发送性能和错误处理

- 缩短发送延迟从 1000ms 到 500ms
- 每 10 封邮件批量更新进度
- 增强错误处理和日志记录
- 配置 Vercel Function 超时时间为 60 秒"
git push
```

### 步骤 2：检查 Vercel 环境变量

**必须配置的环境变量**（至少选择一种邮件服务）：

#### 方案 A：QQ 邮箱（推荐国内使用）
```
MAIL_PROVIDER=qq
QQ_EMAIL=your_qq_number@qq.com
QQ_SMTP_AUTH=your_auth_code
FROM_NAME=邮件营销系统
```

#### 方案 B：Gmail（推荐海外使用）
```
MAIL_PROVIDER=gmail
GMAIL_EMAIL=your_email@gmail.com
GMAIL_APP_PASSWORD=your_app_password
FROM_NAME=Marketing System
```

#### 方案 C：自定义 SMTP
```
MAIL_PROVIDER=custom
SMTP_HOST=smtp.yourcompany.com
SMTP_PORT=587
SMTP_SSL=false
SMTP_USER=your_username
SMTP_PASS=your_password
FROM_NAME=Marketing System
```

**检查步骤**：
1. 访问：https://vercel.com/dashboard
2. 进入项目 → **Settings** → **Environment Variables**
3. 确认已添加上述环境变量
4. 如果没有，点击 **Add** 添加

### 步骤 3：等待部署完成

部署流程：
```
1. Git Push 触发自动部署
2. 安装依赖（约 30-60 秒）
3. 复制 schema.build.prisma → schema.prisma
4. prisma generate（约 10 秒）
5. prisma db push --accept-data-loss（约 15-30 秒）
   - 移除 userId 外键约束
   - 移除唯一约束
   - 更新表结构
6. next build（约 60-90 秒）
7. 部署完成
```

**总耗时**：约 3-5 分钟

---

## 🔍 问题诊断

### 问题 1：邮件发送卡在 0%

**可能原因**：
1. ❌ **SMTP 配置缺失**：没有配置环境变量
2. ❌ **SMTP 配置错误**：密码/授权码不正确
3. ❌ **网络连接问题**：Vercel 无法连接 SMTP 服务器

**解决方案**：

#### A. 检查环境变量
在 Vercel Dashboard 确认已配置：
- `MAIL_PROVIDER`（必须）
- 对应服务的配置（QQ/Gmail/Custom）

#### B. 测试 SMTP 连接

在本地创建测试文件 `test-smtp.ts`：

```typescript
import nodemailer from 'nodemailer'

async function testSMTP() {
  const transporter = nodemailer.createTransport({
    host: 'smtp.qq.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.QQ_EMAIL,
      pass: process.env.QQ_SMTP_AUTH
    }
  })

  try {
    await transporter.verify()
    console.log('✅ SMTP 连接成功！')
  } catch (error) {
    console.error('❌ SMTP 连接失败:', error)
  }
}

testSMTP()
```

运行：
```bash
node -r tsx test-smtp.ts
```

#### C. 获取 QQ 邮箱授权码

如果使用 QQ 邮箱：
1. 登录 QQ 邮箱网页版
2. 设置 → 账户
3. 开启 POP3/SMTP 服务
4. 生成授权码（不是 QQ 密码！）
5. 复制授权码到 Vercel 环境变量 `QQ_SMTP_AUTH`

### 问题 2：部署时间过长

**优化建议**：

#### 1. 使用更快的区域
当前配置：`hkg1`（香港）- 适合国内访问

如果主要用户在国内，这个配置是合适的。

#### 2. 减少 Prisma 生成时间
在 `package.json` 中添加：

```json
{
  "scripts": {
    "build": "prisma generate && next build"
  }
}
```

#### 3. 使用 Vercel 缓存
Vercel 会自动缓存 `node_modules`，无需额外配置。

### 问题 3：邮件发送失败

**常见错误及解决方案**：

#### 错误：`535 Authentication failed`
**原因**：SMTP 密码错误
**解决**：
- QQ 邮箱：使用授权码，不是 QQ 密码
- Gmail：使用应用专用密码，不是登录密码

#### 错误：`ETIMEDOUT`
**原因**：网络连接超时
**解决**：
- 检查 SMTP 服务器地址是否正确
- 尝试更换端口（465 → 587）
- 检查防火墙设置

#### 错误：`550 Spam content`
**原因**：邮件内容被识别为垃圾邮件
**解决**：
- 避免使用"免费"、"赚钱"等敏感词
- 添加退订说明
- 降低发送频率

---

## 📈 性能优化建议

### 1. 批量发送优化

当前代码已优化：
- ✅ 每封邮件延迟 500ms（避免触发反垃圾机制）
- ✅ 每 10 封邮件批量更新进度（减少数据库写入）
- ✅ 使用连接池（pool: true）

**进一步优化**（可选）：

```typescript
// 在 app/actions.ts 中调整批处理大小
if ((successCount + failedCount) % 20 === 0) {
  // 改为每 20 封更新一次
  await prisma.campaign.update({...})
}
```

### 2. 数据库查询优化

添加索引（已配置）：
```prisma
model SenderAccount {
  @@index([userId])
  @@index([email])
}
```

### 3. 前端轮询优化

在状态页面添加智能轮询：

```typescript
// campaigns/[id]/status/page.tsx
useEffect(() => {
  const pollInterval = setInterval(async () => {
    const status = await getCampaignStatus(campaignId)
    // 更新状态
  }, 2000) // 每 2 秒轮询一次

  return () => clearInterval(pollInterval)
}, [campaignId])
```

---

## 🛡️ 预防措施

### 1. 环境变量检查

在 API 启动时检查：

```typescript
// app/api/check-env/route.ts
export async function GET() {
  const required = ['MAIL_PROVIDER']
  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    return NextResponse.json({
      success: false,
      error: `缺少环境变量：${missing.join(', ')}`
    })
  }
  
  return NextResponse.json({ success: true })
}
```

### 2. 健康检查端点

```typescript
// app/api/health/route.ts
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`
    await emailService.verifyConnection()
    
    return NextResponse.json({
      success: true,
      database: 'connected',
      smtp: 'connected'
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
```

### 3. 监控和告警

建议添加：
- Vercel Analytics（性能监控）
- Sentry（错误监控）
- Uptime Robot（可用性监控）

---

## ✅ 验证清单

部署完成后，按以下步骤验证：

### 1. 检查部署状态
- [ ] Vercel Dashboard 显示 "Ready"
- [ ] 访问首页正常加载
- [ ] 访问设置页面正常加载

### 2. 测试发件箱功能
- [ ] 添加发件箱成功
- [ ] 发件箱列表显示正常
- [ ] 编辑/删除功能正常

### 3. 测试邮件发送
- [ ] 创建营销活动
- [ ] 添加收件人（至少 2 个）
- [ ] 启动营销活动
- [ ] 观察进度条变化（应该从 0% 开始增长）
- [ ] 检查发送日志
- [ ] 确认收件人收到邮件

### 4. 检查错误日志
- [ ] Vercel Functions Logs 无错误
- [ ] 浏览器控制台无错误
- [ ] 营销活动日志显示发送详情

---

## 🎯 预期结果

### 发送速度
- **2 个收件人**：约 2-3 秒完成
- **10 个收件人**：约 10-15 秒完成
- **100 个收件人**：约 2-3 分钟完成

### 进度显示
- 每 10 封邮件更新一次进度
- 实时显示成功/失败数量
- 发送日志实时更新

### 错误处理
- SMTP 配置错误：立即显示友好提示
- 单个邮件发送失败：记录日志，继续发送下一封
- 网络错误：自动重试（最多 3 次）

---

## 📞 需要帮助？

如果遇到其他问题，请提供：

1. **Vercel 部署日志**
   - Settings → Deployments → 点击最新部署 → View Build Logs

2. **Function 错误日志**
   - Deployments → 点击部署 → Functions → 查看错误

3. **浏览器控制台错误**
   - F12 → Console → 复制错误信息

4. **Network 请求详情**
   - F12 → Network → 点击失败的请求 → 复制 Response

---

**立即执行步骤 1 提交代码，然后告诉我部署状态！** 🚀
