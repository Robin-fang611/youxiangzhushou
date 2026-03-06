# Vercel 部署指南

## 📋 部署步骤

### 1. 在 Vercel 导入项目

1. 访问 https://vercel.com/new
2. 登录 GitHub 账号
3. 导入仓库：`Robin-fang611/youxiangzhushou`

### 2. 配置环境变量

在 **Environment Variables** 添加以下变量：

```
SECRET_KEY=f185279926c542c2c44a00948a88e80e4acc065633457842decc8c1d50891d88
JWT_SECRET=bd464cf5adbf698059a48972d331a72411ab0e5e23b79c9bbaf999916b00bec7
MAIL_PROVIDER=qq
QQ_EMAIL=544639213@qq.com
QQ_SMTP_AUTH=lpbgqstvjfmebeba
NODE_ENV=production
```

### 3. 部署项目

点击 **Deploy** 按钮，等待部署完成（约 2-3 分钟）

### 4. 添加 PostgreSQL 数据库

部署完成后：

1. 进入项目页面
2. 点击 **Storage** 标签
3. 点击 **Create Database**
4. 选择 **Neon**（推荐，免费）
5. 点击 **Connect** 自动连接

### 5. 初始化数据库

首次部署需要初始化数据库：

1. 在 Vercel Dashboard 进入 **Settings → Functions**
2. 确认 **Build Command** 为：
   ```
   prisma generate && prisma migrate deploy && next build
   ```
3. 重新部署一次以应用迁移

---

## 📧 配置发件邮箱

部署完成后，访问 `https://你的域名.vercel.app/settings` 添加发件邮箱：

### QQ 邮箱配置示例

| 字段 | 值 |
|------|-----|
| 邮箱名称 | 公司主邮箱 |
| 邮箱地址 | your-qq@qq.com |
| SMTP 服务器 | smtp.qq.com |
| 端口 | 465 |
| SMTP 用户名 | your-qq@qq.com |
| SMTP 密码 | 授权码（不是登录密码） |
| 启用 SSL | ✅ |
| 每日限额 | 500 |

> 💡 **获取 QQ 邮箱授权码**：登录 QQ 邮箱 → 设置 → 账户 → 开启 SMTP 服务 → 获取授权码

---

## 💰 免费额度说明

### Vercel 免费额度

- **Function 执行时间**：100 万毫秒/月
- **带宽**：100GB/月
- **请求次数**：无限

### 邮件发送量

- **QQ 个人邮箱**：约 500 封/天
- **Vercel 免费额度**：足够每天 500 封
- **瓶颈**：QQ 邮箱 SMTP 限制，不是 Vercel

### 升级方案

如需更高发送量：
- **SendGrid**：100 封/天免费
- **Amazon SES**：$0.10/1000 封
- **阿里云邮件推送**：¥0.04/封

---

## 🔧 故障排查

### 部署失败

查看 Vercel 部署日志：
```
Deployments → 最新部署 → View Build Logs
```

### 数据库错误

确保已正确连接 Neon 数据库，并运行了迁移。

### SMTP 连接失败

1. 检查邮箱授权码是否正确
2. 确认 SMTP 服务器和端口配置
3. 在设置页面使用"测试连接"功能

---

## 📊 访问地址

部署成功后，访问地址格式：
```
https://your-project.vercel.app
```

可在 Vercel Dashboard 绑定自定义域名。
