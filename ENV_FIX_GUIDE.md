# 🚨 紧急：环境变量配置问题

## 当前状态

代码已修复并推送，使用标准环境变量名称：
- `DATABASE_URL`
- `DIRECT_DATABASE_URL`

## ⚠️ 必须在 Vercel 配置环境变量

### 步骤 1：检查现有环境变量

1. 访问：https://vercel.com/dashboard
2. 进入项目 → Settings → Environment Variables
3. 查看是否有以下变量：
   - `DATABASE_URL`
   - `DIRECT_DATABASE_URL`
   - `A_DATABASE_URL`
   - `A_DIRECT_DATABASE_URL`

### 步骤 2：配置正确的环境变量

**如果看到 `A_DATABASE_URL` 和 `A_DIRECT_DATABASE_URL`：**

需要重命名或创建新的环境变量：

1. 点击 `A_DATABASE_URL` → Edit
2. 将 Name 改为 `DATABASE_URL`
3. 确保 Value 是完整的 Neon 连接字符串
4. 勾选 Production, Preview, Development
5. Save

6. 点击 `A_DIRECT_DATABASE_URL` → Edit
7. 将 Name 改为 `DIRECT_DATABASE_URL`
8. Value 使用相同的连接字符串
9. 勾选 Production, Preview, Development
10. Save

**如果没有环境变量：**

手动添加：

```
Name: DATABASE_URL
Value: postgresql://用户名：密码@ep-xxx.region.aws.neon.tech/数据库名？sslmode=require
Environments: ✓ Production ✓ Preview ✓ Development

Name: DIRECT_DATABASE_URL
Value: postgresql://用户名：密码@ep-xxx.region.aws.neon.tech/数据库名？sslmode=require
Environments: ✓ Production ✓ Preview ✓ Development
```

### 步骤 3：获取 Neon 连接字符串

1. 访问：https://console.neon.tech
2. 点击你的数据库
3. 点击 Connection Details
4. 复制 Connection string

### 步骤 4：添加其他必需的环境变量

```
MAIL_PROVIDER = qq
QQ_EMAIL = 544639213@qq.com
QQ_SMTP_AUTH = lpbgqstvjfmebeba
SECRET_KEY = your-secret-key-at-least-32-characters-long-12345
JWT_SECRET = your-jwt-secret-at-least-32-characters-long-67890
NODE_ENV = production
```

### 步骤 5：重新部署

1. 进入 Deployments 标签
2. 找到最新部署
3. 点击 ... → Redeploy

## 📊 验证成功的标志

Build Logs 应该显示：

```
Datasource "db": PostgreSQL database "neondb", schema "public" at "ep-xxx.c-4.us-east-1.aws.neon.tech"
1 migration found in prisma/migrations
Applying migration `00000000000000_init`
```

## 🔍 故障排查

### 问题：仍然显示 "Environment variable not found"

**解决方案：**
1. 确认环境变量名称完全正确（区分大小写）
2. 确认勾选了 Production 环境
3. 确认 Value 不是空的
4. 重新部署

### 问题：数据库连接失败

**解决方案：**
1. 确认连接字符串包含 `?sslmode=require`
2. 确认用户名和密码正确
3. 确认数据库主机地址正确

## 📞 最终检查清单

- [ ] DATABASE_URL 已配置
- [ ] DIRECT_DATABASE_URL 已配置
- [ ] 连接字符串格式正确
- [ ] 勾选了 Production 环境
- [ ] MAIL_PROVIDER 已配置
- [ ] QQ_EMAIL 已配置
- [ ] QQ_SMTP_AUTH 已配置
- [ ] SECRET_KEY 已配置
- [ ] JWT_SECRET 已配置
- [ ] NODE_ENV 已配置
- [ ] 已重新部署

---

**配置完成后，部署应该会成功！**
