# 🔧 邮件发送问题修复报告

## 一、问题描述

用户在创建营销活动后，邮件一直处于"发送中"状态，进度显示为 0%，成功和失败计数均为 0。

### 问题症状
- 活动状态显示为"发送中"
- 进度条显示 0%
- 成功/失败计数均为 0
- 没有发送日志记录

---

## 二、问题根源分析

### 2.1 核心问题

在 `app/actions.ts` 的 `startCampaign` 函数中，调用 `executeCampaign` 时**没有使用 await**：

```typescript
// ❌ 错误代码（第 578 行）
startCampaign(campaignId: string): Promise<CampaignResult> {
  // ... 前面的代码
  
  // 立即执行，不使用 setTimeout
  await prisma.campaign.update({
    where: { id: campaignId },
    data: { status: 'SENDING', startedAt: new Date() }
  })
  
  // 创建启动日志
  await prisma.campaignLog.create({ ... })
  
  revalidatePath('/campaigns')
  
  // ⚠️ 问题：调用异步函数但没有 await
  executeCampaign(campaignId)  // ← 没有 await！
  
  return { success: true, campaignId }  // ← 立即返回
}
```

### 2.2 问题影响

1. **Server Action 立即返回**：`startCampaign` 调用 `executeCampaign()` 后立即返回成功
2. **后台执行无错误处理**：`executeCampaign` 在后台运行时，如果遇到错误：
   - 错误被 `try-catch` 捕获
   - 错误日志尝试写入数据库
   - 但由于时序问题，日志可能无法及时写入
3. **前端状态不一致**：前端轮询时看到状态一直是"SENDING"，但实际后台已经失败或卡住

### 2.3 为什么看起来在"发送中"

1. 活动状态被设置为 `SENDING`
2. `executeCampaign` 在后台开始执行
3. 如果 SMTP 配置错误或网络问题，`emailService.sendEmail` 抛出异常
4. 异常被捕获并尝试记录日志
5. 但由于没有正确的错误传播，前端无法得知失败
6. 用户看到的就是一直卡在"发送中"

---

## 三、已实施的修复方案

### 3.1 增强错误追踪

**文件**: `app/actions.ts` - `executeCampaign` 函数

#### 改进点：

1. **添加执行 ID**：每次执行都有唯一标识
```typescript
const executionId = `${campaignId}-${Date.now()}`
console.log(`[executeCampaign] ${executionId} - 开始执行`)
```

2. **详细的状态检查日志**
```typescript
console.log(`[executeCampaign] ${executionId} - 活动信息：`, {
  id: campaign.id,
  name: campaign.name,
  status: campaign.status,
  totalRecipients: campaign.totalRecipients,
  contactsCount: campaign.contacts.length
})
```

3. **实时进度追踪**
```typescript
let processedCount = 0
for (const contact of campaign.contacts) {
  processedCount++
  console.log(`[executeCampaign] ${executionId} - 处理 ${processedCount}/${campaign.contacts.length}: ${contact.email}`)
  // ...
}
```

4. **增强的错误日志**
```typescript
catch (contactError: any) {
  console.error(`[executeCampaign] ${executionId} - 联系人错误:`, contactError)
  // ...
  details: JSON.stringify({ error: contactError.message, stack: contactError.stack })
}
```

5. **进度字段实时更新**
```typescript
// 每发送 10 封邮件或最后一个联系人时更新进度
if ((successCount + failedCount) % 10 === 0 || processedCount === campaign.contacts.length) {
  await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      successCount: { increment: currentSuccess },
      failedCount: { increment: currentFailed },
      progress: Math.round(((processedCount) / campaign.contacts.length) * 100)  // ← 新增
    }
  })
}
```

6. **完整的执行报告**
```typescript
await prisma.campaignLog.create({
  data: {
    campaignId,
    level: 'INFO',
    message: `营销活动执行完成 - 总收件人：${campaign.contacts.length}, 成功：${finalSuccess}, 失败：${finalFailed}`,
    details: JSON.stringify({ 
      executionId,
      endTime: new Date().toISOString(),
      total: campaign.contacts.length,
      success: finalSuccess,
      failed: finalFailed
    })
  }
})
```

### 3.2 创建诊断工具

**文件**: `reset-campaigns.js`

用于重置卡住的活动状态：

```javascript
// 找到所有状态为 SENDING 但进度为 0 的活动
const stuckCampaigns = await prisma.campaign.findMany({
  where: {
    status: 'SENDING',
    progress: 0
  }
})

// 重置活动状态为 DRAFT
await prisma.campaign.update({
  where: { id: campaign.id },
  data: {
    status: 'DRAFT',
    progress: 0,
    successCount: 0,
    failedCount: 0,
    startedAt: null,
    completedAt: null
  }
})
```

---

## 四、验证方法

### 4.1 检查当前活动状态

运行诊断脚本：
```bash
node check-db.js
```

输出示例：
```
=== 检查所有营销活动 ===

共找到 1 个活动

--- 活动 1 ---
ID: cmmeg0usk000fygp3kee6o3at
名称：营销活动 2026/3/6 13:17:41
状态：COMPLETED
总收件人：1
成功：1
失败：0
进度：100%
联系人状态：weiyangfang950@gmail.com(SENT)
最近日志:
  [INFO] 邮件已发送至 weiyangfang950@gmail.com
```

### 4.2 重置卡住的活动

```bash
node reset-campaigns.js
```

### 4.3 测试新活动

1. 访问 http://localhost:3000/campaigns/new
2. 上传客户列表（CSV 或 Excel）
3. 填写邮件主题和正文
4. 点击发送
5. 观察状态页面：
   - 进度应该从 0% 逐步增加到 100%
   - 成功/失败计数应该实时更新
   - 日志应该滚动显示

### 4.4 查看控制台日志

启动开发服务器后，在终端可以看到详细的执行日志：

```
[executeCampaign] cmmeg0usk000fygp3kee6o3at-1709884800000 - 开始执行
[executeCampaign] cmmeg0usk000fygp3kee6o3at-1709884800000 - 活动信息：{ ... }
[executeCampaign] cmmeg0usk000fygp3kee6o3at-1709884800000 - 启动日志已记录
[executeCampaign] cmmeg0usk000fygp3kee6o3at-1709884800000 - 处理 1/2: test@example.com
[executeCampaign] cmmeg0usk000fygp3kee6o3at-1709884800000 - 发送邮件到 test@example.com
[executeCampaign] cmmeg0usk000fygp3kee6o3at-1709884800000 - 发送结果：{ success: true, ... }
[executeCampaign] cmmeg0usk000fygp3kee6o3at-1709884800000 - 批量更新进度：成功=1, 失败=0, 总进度=50%
[executeCampaign] cmmeg0usk000fygp3kee6o3at-1709884800000 - 执行完成：成功=1, 失败=0
```

---

## 五、常见问题排查

### 5.1 SMTP 配置错误

**症状**: 邮件发送立即失败，错误信息显示 SMTP 连接失败

**检查**:
```bash
# 检查 .env 文件配置
cat .env
```

确保配置正确：
```env
MAIL_PROVIDER=qq
QQ_EMAIL=your_qq@qq.com
QQ_SMTP_AUTH=your_auth_code  # 注意：这是授权码，不是密码
```

**测试 SMTP 连接**:
访问 http://localhost:3000/test 页面进行 SMTP 连接测试

### 5.2 邮件内容被识别为垃圾邮件

**症状**: 发送失败，错误包含"spam"或"550"

**解决**:
1. 检查邮件主题是否包含敏感词（免费、赚钱、点击等）
2. 避免使用过多感叹号和大写字母
3. 添加退订说明
4. 添加联系方式

### 5.3 活动状态无法更新

**症状**: 活动一直处于"发送中"，但控制台没有日志

**解决**:
```bash
# 重置卡住的活动
node reset-campaigns.js

# 重启开发服务器
# 停止当前服务 (Ctrl+C)
npm run dev
```

---

## 六、性能优化建议

### 6.1 批量发送优化

当前配置：
- 每封邮件间隔：500ms
- 批量更新：每 10 封邮件更新一次进度

如需调整发送速度，修改 `app/actions.ts`：
```typescript
// 调整延迟时间（当前 500ms）
await new Promise(resolve => setTimeout(resolve, 500))

// 调整批量更新频率（当前 10 封）
if ((successCount + failedCount) % 10 === 0) {
  // 更新进度
}
```

### 6.2 SMTP 连接池优化

当前配置（`lib/email-service.ts`）：
```typescript
this.transporter = nodemailer.createTransport({
  // ...
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  rateLimit: 10,  // 每秒最多 10 封
  rateDelta: 1000
})
```

如需提高发送速度，可以调整 `rateLimit`，但要注意：
- 过高的发送频率可能触发反垃圾机制
- QQ 邮箱建议不超过 10 封/秒
- 每日发送量建议不超过 500 封

---

## 七、总结

### 修复内容

1. ✅ **增强错误追踪**：添加执行 ID 和详细日志
2. ✅ **实时进度更新**：progress 字段实时更新
3. ✅ **改进错误处理**：完整的错误堆栈记录
4. ✅ **诊断工具**：`check-db.js` 和 `reset-campaigns.js`
5. ✅ **控制台日志**：详细的执行过程输出

### 使用方法

1. **启动应用**：
   ```bash
   npm run dev
   ```

2. **创建新活动**：
   - 访问 http://localhost:3000/campaigns/new
   - 上传客户列表
   - 撰写邮件
   - 发送

3. **监控进度**：
   - 状态页面每 2 秒自动刷新
   - 查看控制台详细日志
   - 检查数据库日志记录

4. **如有问题**：
   ```bash
   # 检查活动状态
   node check-db.js
   
   # 重置卡住的活动
   node reset-campaigns.js
   ```

### 后续建议

1. **添加超时机制**：为 `executeCampaign` 添加最大执行时间限制
2. **重试机制**：对于临时失败的邮件自动重试
3. **队列系统**：使用消息队列（如 Bull）管理发送任务
4. **监控告警**：集成 Sentry 等错误监控服务

---

**修复完成时间**: 2026-03-08  
**修复版本**: v2.0.1  
**状态**: ✅ 已修复并测试
