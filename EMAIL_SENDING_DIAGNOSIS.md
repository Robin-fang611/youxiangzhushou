# 🚨 邮件发送失败诊断指南

## 当前症状

从 Network 面板看到：
- ✅ 前端轮询正常（大量 status 请求返回 200）
- ❌ 发送日志为空
- ❌ 进度一直为 0%

**诊断**：后端 `executeCampaign` 函数没有执行或静默失败

---

## 🔍 立即诊断步骤

### 步骤 1：检查环境变量配置

在浏览器访问：
```
https://system-35dx5itbi-robin-fang611s-projects.vercel.app/api/check-email-config
```

**预期结果**：
```json
{
  "success": true,
  "configured": true,
  "envVars": {
    "MAIL_PROVIDER": "qq",
    "QQ_EMAIL": "已配置",
    "QQ_SMTP_AUTH": "已配置",
    ...
  },
  "missingVars": []
}
```

**如果显示未配置**：
1. 访问 Vercel Dashboard
2. Settings → Environment Variables
3. 添加缺失的环境变量

---

### 步骤 2：检查 Vercel Function Logs

1. 访问：https://vercel.com/dashboard
2. 进入项目 → **Deployments**
3. 点击最新部署 → **Functions**
4. 查看是否有错误日志

**常见错误**：
- `MAIL_PROVIDER is not defined` → 环境变量未配置
- `Invalid SMTP credentials` → SMTP 密码错误
- `Database connection timeout` → 数据库连接问题

---

### 步骤 3：手动测试邮件发送

在设置页面添加测试功能。访问：
```
https://system-35dx5itbi-robin-fang611s-projects.vercel.app/settings
```

尝试添加一个发件箱，看是否成功。

**如果失败**：
- 检查数据库连接
- 检查环境变量

**如果成功**：
- 说明数据库正常
- 问题在邮件发送逻辑

---

## 🛠️ 已实施的修复

### 修复 1：移除 setTimeout 延迟

**问题**：Serverless 环境中 setTimeout 可能不工作

**修复**：
```typescript
// ❌ 之前（不可靠）
setTimeout(() => {
  executeCampaign(campaignId)
}, 1000)

// ✅ 现在（立即执行）
executeCampaign(campaignId)
```

### 修复 2：添加详细日志

**问题**：静默失败，无法诊断

**修复**：
```typescript
// 启动时立即创建日志
await prisma.campaignLog.create({
  data: {
    campaignId,
    level: 'INFO',
    message: `营销活动启动，共 ${campaign.contacts.length} 个联系人`
  }
})

// 每个联系人处理时添加 try-catch
try {
  await emailService.sendEmail(...)
} catch (contactError) {
  console.error('[executeCampaign] Contact error:', contactError)
  // 记录详细错误
}
```

### 修复 3：增强错误处理

添加了完整的错误捕获和日志记录：
- 单个联系人发送失败 → 记录错误，继续发送下一个
- 整体执行失败 → 更新活动状态为 FAILED
- 所有错误都记录到 campaign_log 表

---

## 📋 推送步骤

### 1. 提交修复代码

```bash
cd "d:\business bot\项目\营销系统"
git add .
git commit -m "fix: execute campaign immediately and add detailed logging"
git push
```

### 2. 检查环境变量

访问 Vercel Dashboard，确认已配置：
- `MAIL_PROVIDER` = `qq` 或 `gmail` 或 `custom`
- 对应服务的配置（QQ_EMAIL, QQ_SMTP_AUTH 等）

### 3. 等待部署完成

预计 3-5 分钟。

### 4. 测试

1. 访问：`https://system-35dx5itbi-robin-fang611s-projects.vercel.app/api/check-email-config`
   - 确认显示 "success": true

2. 重启一个营销活动
   - 应该立即看到发送日志
   - 进度条开始增长

---

## 🎯 预期结果

### 启动营销活动后

**立即（0-1 秒）**：
- 状态变为"正在发送中"
- 出现第一条日志："营销活动启动，共 X 个联系人"

**2 秒后**：
- 看到第一条发送日志
- 成功/失败计数开始变化

**每 2 秒**：
- 进度条更新
- 日志增加

---

## 🐛 如果仍然失败

### 场景 A：API 检查显示环境变量未配置

**解决方案**：
1. 访问 Vercel Dashboard
2. Settings → Environment Variables
3. 添加以下变量：

**QQ 邮箱**：
```
MAIL_PROVIDER=qq
QQ_EMAIL=your_qq@qq.com
QQ_SMTP_AUTH=your_auth_code
FROM_NAME=营销系统
```

**Gmail**：
```
MAIL_PROVIDER=gmail
GMAIL_EMAIL=your_email@gmail.com
GMAIL_APP_PASSWORD=your_app_password
```

### 场景 B：环境变量已配置，但仍然失败

**可能原因**：
1. SMTP 授权码错误
2. 数据库连接问题
3. Vercel Function 超时

**诊断步骤**：
1. 查看 Vercel Function Logs
2. 复制错误信息
3. 发送给我

### 场景 C：显示发送成功，但进度仍为 0%

**原因**：前端轮询没有获取到最新数据

**解决方案**：
1. 刷新页面
2. 检查 getCampaignStatus 函数返回值
3. 确认数据库中有 successCount 和 failedCount

---

## 📞 紧急联系

如果以上步骤都无法解决，请提供：

1. **API 检查结果**
   - 访问 `/api/check-email-config` 的响应

2. **Vercel Function Logs**
   - Deployments → Functions → 错误日志截图

3. **Network 请求详情**
   - F12 → Network → 点击 status 请求
   - 复制 Response 内容

4. **浏览器控制台错误**
   - F12 → Console → 复制所有错误

---

**立即执行推送，然后检查 `/api/check-email-config`！** 🚀
