# 📧 QQ 邮箱 SMTP 配置指南

## ⚠️ 重要：邮件发送失败原因

根据诊断，发现 SMTP 认证失败，错误信息：
```
535 Login fail. Account is abnormal, service is not open, 
password is incorrect, login frequency limited, or system is busy.
```

## 🔧 解决步骤

### 步骤 1：开启 QQ 邮箱 SMTP 服务

1. **登录 QQ 邮箱网页版**
   - 访问 https://mail.qq.com
   - 使用 QQ 账号登录

2. **进入设置页面**
   - 点击顶部的"设置"
   - 选择"账户"标签页

3. **开启 SMTP 服务**
   - 找到 "POP3/IMAP/SMTP/Exchange/CardDAV/CalDAV 服务" 部分
   - 点击 "IMAP/SMTP 服务" 的 "开启" 按钮
   
   ![开启 SMTP](https://help.mail.qq.com/detail/108/1023)

4. **获取授权码**
   - 系统会要求验证手机号
   - 验证后会显示 **16 位授权码**
   - ⚠️ **重要**：授权码只显示一次，请立即复制保存！

### 步骤 2：更新环境变量

打开 `.env` 文件，更新配置：

```env
# 邮件服务配置
MAIL_PROVIDER=qq
QQ_EMAIL=544639213@qq.com
QQ_SMTP_AUTH=你的 16 位授权码  # ← 替换为新获取的授权码
```

### 步骤 3：重启开发服务器

```bash
# 停止当前服务器 (Ctrl+C)
# 重新启动
npm run dev
```

### 步骤 4：测试 SMTP 连接

访问 http://localhost:3000/test 页面，点击"测试 SMTP 连接"按钮。

---

## 📋 常见问题

### Q1: 为什么不能使用 QQ 密码？

**A**: 为了安全，QQ 邮箱要求使用专门的"授权码"而不是登录密码。授权码：
- 是 16 位字符串
- 可以单独管理每个应用的权限
- 可以随时撤销

### Q2: 授权码获取失败怎么办？

**可能原因**：
1. 手机号未绑定或已更换
2. 账号存在安全风险
3. 频繁获取被限制

**解决方法**：
- 确保 QQ 账号已绑定手机号
- 等待 24 小时后重试
- 联系 QQ 邮箱客服

### Q3: SMTP 服务开启后仍然失败？

**检查清单**：
- [ ] 授权码是否正确复制（无空格、无换行）
- [ ] 环境变量是否已更新
- [ ] 开发服务器是否已重启
- [ ] 网络连接是否正常

**测试命令**：
```bash
node test-smtp.js
```

---

## 🔐 安全建议

1. **不要泄露授权码**
   - 不要提交到 Git
   - 不要分享给他人
   - `.env` 文件已在 .gitignore 中

2. **定期更新授权码**
   - 建议每 3-6 个月更新一次
   - 如怀疑泄露，立即撤销并重新生成

3. **监控发送记录**
   - 定期检查邮箱发送记录
   - 发现异常立即停止服务

---

## 📞 官方帮助

- [QQ 邮箱 SMTP 设置帮助](https://service.mail.qq.com/detail/0/75)
- [授权码获取教程](https://help.mail.qq.com/detail/108/1023)
- [常见问题解答](https://service.mail.qq.com/)

---

**更新时间**: 2026-03-08  
**版本**: v1.0
