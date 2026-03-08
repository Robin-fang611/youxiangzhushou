# 🔧 邮件发送问题诊断报告

## 📋 问题概述

**症状**: 
- 营销活动状态一直显示"正在发送中"
- 成功/失败计数均为 0
- 进度条显示 0%
- 无法发送邮件

**诊断时间**: 2026-03-08

---

## 🔍 问题根源分析

### 核心问题：**SMTP 认证失败**

通过运行 `test-smtp.js` 诊断脚本，发现以下错误：

```
❌ 测试失败：Invalid login: 535 Login fail. 
Account is abnormal, service is not open, 
password is incorrect, login frequency limited, 
or system is busy.
```

### 错误原因

QQ 邮箱返回的 535 错误代码表示：

1. **SMTP 服务未开启** ⚠️ (最可能)
2. **授权码错误** ⚠️ (当前使用密码而非授权码)
3. **账号异常** (账号被冻结或限制)
4. **登录频率限制** (短时间内多次尝试)

### 当前配置

```env
MAIL_PROVIDER=qq
QQ_EMAIL=544639213@qq.com
QQ_SMTP_AUTH=lpbgqstvjfmebeba  # ← 这个授权码无效
```

---

## ✅ 解决方案

### 方案一：获取新的 QQ 邮箱授权码（推荐）

#### 步骤 1：开启 SMTP 服务

1. 登录 QQ 邮箱网页版：https://mail.qq.com
2. 点击"设置" → "账户"
3. 找到 "POP3/IMAP/SMTP/Exchange/CardDAV/CalDAV 服务"
4. 点击 "IMAP/SMTP 服务" 的 "开启" 按钮
5. 按提示验证手机号

#### 步骤 2：获取授权码

- 验证成功后，系统会显示 **16 位授权码**
- ⚠️ **重要**：授权码只显示一次，立即复制保存！
- 示例：`abcdefghijklmnop`

#### 步骤 3：更新环境变量

编辑 `.env` 文件：

```env
QQ_SMTP_AUTH=你的新授权码  # 替换为刚获取的 16 位授权码
```

#### 步骤 4：重启服务

```bash
# 停止当前服务 (Ctrl+C)
# 重新启动
npm run dev
```

---

### 方案二：检查账号状态

如果无法获取授权码，可能是：

1. **手机号未绑定**
   - 前往 QQ 安全中心绑定手机号

2. **账号存在安全风险**
   - 修改 QQ 密码
   - 完成实名认证

3. **频繁获取被限制**
   - 等待 24 小时后重试

---

## 🛠️ 已实施的代码改进

### 1. 增强错误处理

**文件**: `lib/email-service.ts`

**改进内容**:
- ✅ 添加重试逻辑（最多重试 3 次）
- ✅ 指数退避策略（1s, 2s, 4s）
- ✅ 详细的错误日志输出
- ✅ 区分认证错误和网络错误
- ✅ 认证错误不重试，网络错误自动重试

**代码示例**:

```typescript
// 重试逻辑
for (let attempt = 0; attempt <= maxRetries; attempt++) {
  try {
    if (attempt > 0) {
      // 指数退避
      await new Promise(resolve => 
        setTimeout(resolve, Math.pow(2, attempt) * 1000)
      )
    }
    
    // 发送邮件...
  } catch (error) {
    // 认证错误不重试
    if (error.message.includes('535')) {
      break
    }
    // 网络错误继续重试
    continue
  }
}
```

### 2. 详细的错误提示

**改进前**:
```
发送失败：Unknown error
```

**改进后**:
```
发送失败 (尝试 1/3): 535 Login fail
认证错误，停止重试：Invalid login
最终发送失败：
  - 错误：535 Login fail
  - 尝试次数：3
  - 建议：SMTP 认证失败，请检查邮箱账号和授权码
```

### 3. 创建诊断工具

**文件**: `test-smtp.js`

**用途**:
- 快速测试 SMTP 连接
- 验证授权码是否有效
- 查看详细错误信息

**使用方法**:
```bash
node test-smtp.js
```

### 4. 创建配置指南

**文件**: `SMTP_SETUP_GUIDE.md`

**内容**:
- 详细的 SMTP 开启步骤
- 授权码获取教程
- 常见问题解答
- 安全建议

---

## 📊 测试验证

### 测试步骤

1. **更新授权码后**，运行诊断测试：
   ```bash
   node test-smtp.js
   ```

2. **预期输出**:
   ```
   === 开始测试 SMTP 连接 ===
   
   1. 测试 SMTP 连接...
   ✅ SMTP 连接验证成功！
   
   2. 尝试发送测试邮件...
   ✅ 邮件发送成功！
   Message ID: <xxx@qq.com>
   Response: 250 OK
   ```

3. **创建测试活动**:
   - 访问 http://localhost:3000/campaigns/new
   - 上传包含 1-2 个联系人的 CSV
   - 填写简单的邮件内容
   - 点击发送

4. **观察结果**:
   - ✅ 状态从"发送中"变为"已完成"
   - ✅ 成功计数显示正确的数字
   - ✅ 进度条达到 100%
   - ✅ 收到测试邮件

---

## 🎯 验证清单

完成修复后，请检查以下项目：

- [ ] 已获取新的 QQ 邮箱授权码
- [ ] 已更新 `.env` 文件中的 `QQ_SMTP_AUTH`
- [ ] 已重启开发服务器
- [ ] `node test-smtp.js` 测试通过
- [ ] 能够成功发送测试邮件
- [ ] 营销活动状态正确更新
- [ ] 邮件接收正常

---

## 📝 文件更改清单

### 修改的文件
- ✅ `lib/email-service.ts` - 增强错误处理和重试机制
- ✅ `.env` - 需要更新 QQ_SMTP_AUTH

### 新增的文件
- ✅ `test-smtp.js` - SMTP 连接测试脚本
- ✅ `SMTP_SETUP_GUIDE.md` - 配置指南
- ✅ `DIAGNOSIS_REPORT.md` - 诊断报告

---

## 🔐 安全提醒

1. **保护授权码**
   - 不要提交到 Git（已在 .gitignore 中）
   - 不要分享给他人
   - 定期更新（建议每 3-6 个月）

2. **监控发送记录**
   - 定期检查邮箱发送日志
   - 发现异常立即停止服务

3. **遵守发送限制**
   - QQ 邮箱每日发送上限：500 封
   - 单封邮件发送间隔：500ms
   - 避免触发反垃圾机制

---

## 📞 官方帮助

- [QQ 邮箱 SMTP 设置](https://service.mail.qq.com/detail/0/75)
- [授权码获取](https://help.mail.qq.com/detail/108/1023)
- [常见问题](https://service.mail.qq.com/)

---

## 📈 后续优化建议

1. **添加邮件发送队列**
   - 使用 Bull 或 Agenda 管理发送任务
   - 支持暂停、恢复、取消

2. **增强监控**
   - 集成 Sentry 进行错误追踪
   - 添加发送成功率监控

3. **多 SMTP 支持**
   - 配置多个发件邮箱
   - 自动切换故障邮箱

4. **发送统计**
   - 记录打开率、点击率
   - 生成发送报告

---

**诊断完成时间**: 2026-03-08  
**问题状态**: ✅ 已定位，等待更新授权码  
**预计修复时间**: 5-10 分钟（获取授权码后）
