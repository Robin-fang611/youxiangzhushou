# ⚠️ 紧急：Vercel 环境变量配置

## 🔴 当前问题

**错误信息：** `Error: P1001: Can't reach database server at 'host.neon.tech:5432'`

**根本原因：** Vercel 项目中**没有配置环境变量** `DATABASE_URL` 和 `DIRECT_DATABASE_URL`

## ✅ 立即执行以下步骤

### 步骤 1：在 Vercel 添加 Neon 数据库

**这是解决问题的关键！**

1. **访问 Vercel Dashboard**
   - 打开：https://vercel.com/dashboard
   - 登录你的账户

2. **找到项目**
   - 点击项目 `youxiangzhushou` 或 `system-table-three`

3. **添加 Neon 数据库**
   - 点击左侧菜单 "Storage"
   - 点击 "Add Database"
   - 选择 "Neon"
   - 点击 "Install"
   - Vercel 会自动创建数据库并添加环境变量

4. **确认环境变量**
   - 进入 "Settings" → "Environment Variables"
   - 应该看到自动添加的变量：
     ```
     DATABASE_URL=postgresql://user:password@xxx.neon.tech/dbname?sslmode=require
     DIRECT_DATABASE_URL=postgresql://user:password@xxx.neon.tech/dbname?sslmode=require
     ```

### 步骤 2：添加其他必需的环境变量

在同一个 "Environment Variables" 页面添加：

```env
# 邮件服务配置
MAIL_PROVIDER=qq
QQ_EMAIL=544639213@qq.com
QQ_SMTP_AUTH=lpbgqstvjfmebeba

# 安全配置（至少 32 个字符）
SECRET_KEY=your-secret-key-at-least-32-characters-long-for-security-12345
JWT_SECRET=your-jwt-secret-at-least-32-characters-long-for-security-67890

# 运行环境
NODE_ENV=production
```

### 步骤 3：重新部署

**重要：添加环境变量后必须重新部署！**

1. 进入项目 "Deployments" 标签
2. 找到最新的部署（失败的）
3. 点击右侧的三个点 "..."
4. 选择 "Redeploy"
5. 确认重新部署

或者：
1. 进入 "Settings" → "Git"
2. 关闭 "Ignore Git Pushes"（如果开启）
3. 推送一个新的提交来触发部署

### 步骤 4：验证部署

部署完成后：
1. 点击部署的 URL
2. 访问 `/settings` 页面
3. 尝试添加发件邮箱
4. 如果能成功保存，说明数据库连接正常

## 🎯 为什么会出现这个问题？

1. **Vercel 不会自动创建数据库**
   - 需要手动添加 Neon 数据库集成
   - 或者手动配置环境变量

2. **环境变量不会自动同步**
   - `.env.vercel` 文件只是示例
   - 必须在 Vercel Dashboard 手动配置

3. **部署时使用了默认值**
   - schema 中的 `host.neon.tech` 是占位符
   - 实际地址需要从环境变量读取

## 📝 环境变量说明

### 数据库变量（自动添加）
- `DATABASE_URL` - 主数据库连接（用于 Prisma Client）
- `DIRECT_DATABASE_URL` - 直接连接（用于 Serverless 环境）

### 邮件服务变量
- `MAIL_PROVIDER` - 邮件服务商（qq）
- `QQ_EMAIL` - QQ 邮箱地址
- `QQ_SMTP_AUTH` - QQ 邮箱授权码（不是登录密码！）

### 安全变量
- `SECRET_KEY` - Session 加密密钥（至少 32 字符）
- `JWT_SECRET` - JWT 签名密钥（至少 32 字符）

### 运行环境变量
- `NODE_ENV` - 运行环境（production）

## ⚡ 快速获取 QQ 邮箱授权码

如果还没有 QQ 邮箱授权码：

1. 登录 QQ 邮箱网页版
2. 点击 "设置" → "账户"
3. 找到 "POP3/IMAP/SMTP/Exchange/CardDAV/CalDAV 服务"
4. 开启 "IMAP/SMTP 服务"
5. 点击 "生成授权码"
6. 按提示发送短信验证
7. 复制生成的授权码

## 🔍 验证环境变量配置

部署后，查看 Build Logs：

1. 进入项目 "Deployments"
2. 点击正在进行的部署
3. 查看 "Build Logs"
4. 应该看到类似：
   ```
   Prisma schema loaded from prisma/schema.prisma
   Datasource "db": PostgreSQL database "xxx", schema "public" at "xxx.neon.tech"
   ```

如果仍然显示 `host.neon.tech`，说明环境变量没有配置！

## 📞 如果还有问题

### 问题 1：找不到 Storage 选项

**解决方案：**
- Vercel 账户可能需要升级
- 或者手动配置环境变量

### 问题 2：Neon 数据库创建失败

**解决方案：**
- 访问 https://neon.tech 手动创建
- 复制连接字符串到 Vercel 环境变量

### 问题 3：部署仍然失败

**检查清单：**
- [ ] DATABASE_URL 已配置
- [ ] DIRECT_DATABASE_URL 已配置
- [ ] 连接字符串格式正确
- [ ] 包含 `?sslmode=require`
- [ ] 已重新部署

## 🔗 相关链接

- Vercel Dashboard: https://vercel.com/dashboard
- Neon Dashboard: https://console.neon.tech
- Vercel 环境变量文档：https://vercel.com/docs/environment-variables

---

**状态：** 等待配置环境变量
**下一步：** 立即在 Vercel Dashboard 添加 Neon 数据库！
