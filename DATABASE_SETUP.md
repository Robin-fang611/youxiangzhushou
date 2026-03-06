# 数据库配置指南 - 解决 Vercel 部署问题

## 问题诊断

### 当前错误
- `TypeError: e.map is not a function` - API 返回数据格式问题
- `500 Internal Server Error` on `/api/sender-accounts` - 数据库连接或表未创建

### 根本原因
1. **API 返回数据格式问题**：数据库查询可能返回 `null` 而不是数组
2. **数据库表未创建**：Vercel 部署时 `prisma db push` 可能未成功执行
3. **环境变量配置问题**：DATABASE_URL 可能未配置或配置错误

## 解决方案

### 步骤 1：检查 Vercel 环境变量配置

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 进入您的项目
3. 点击 **Settings** → **Environment Variables**
4. 确保存在以下变量：
   - `DATABASE_URL`
   - `DIRECT_DATABASE_URL`

**如果不存在，请添加：**

```
Name: DATABASE_URL
Value: postgresql://user:password@host.neon.tech/dbname?sslmode=require
Environment: Production (选中)

Name: DIRECT_DATABASE_URL
Value: postgresql://user:password@host.neon.tech/dbname?sslmode=require
Environment: Production (选中)
```

**重要：**
- 连接字符串必须使用 Neon PostgreSQL 的地址
- 必须包含 `?sslmode=require` 参数
- 确保选择 **Production** 环境

### 步骤 2：检查 Neon 数据库状态

1. 访问 [Neon Console](https://console.neon.tech/)
2. 登录您的账户
3. 确认数据库已创建
4. 复制连接字符串（包含用户、密码、主机地址）

### 步骤 3：重新部署 Vercel

1. 在 Vercel Dashboard 点击 **Deployments**
2. 点击 **Redeploy**（重新部署）
3. 等待部署完成
4. 点击 **View Build Logs** 查看构建日志

**关键检查点：**
- 搜索 "prisma db push" - 应该看到成功执行的日志
- 搜索 "Datasource" - 应该显示 Neon PostgreSQL 地址
- 不应该有 "P1001" 或 "P1015" 等数据库错误

### 步骤 4：手动同步数据库（如果自动同步失败）

如果部署后仍然出现数据库错误，需要手动执行：

```bash
# 在 Vercel 项目中
vercel env pull .env.production.local

# 使用生产环境变量执行数据库同步
npx prisma db push --accept-data-loss
```

### 步骤 5：验证数据库连接

部署成功后，访问应用：
1. 打开 `/settings` 页面
2. 应该能看到发件箱列表（即使为空也不会报错）
3. 尝试添加一个发件箱，确认可以正常保存

## 常见错误排查

### 错误 1：P1001 - Can't reach database server
**原因**：DATABASE_URL 配置错误
**解决**：检查连接字符串格式，确保包含完整的用户名、密码、主机地址

### 错误 2：P1015 - Authentication failed
**原因**：密码错误或用户不存在
**解决**：在 Neon Console 重置密码并更新环境变量

### 错误 3：Table 'public.SenderAccount' doesn't exist
**原因**：数据库表未创建
**解决**：执行 `prisma db push` 同步数据库结构

### 错误 4：e.map is not a function
**原因**：API 返回数据格式问题
**解决**：已修复 - API 和前端都添加了数组验证

## 已完成的修复

✅ **代码修复**：
1. `/api/sender-accounts/route.ts` - 添加数组验证
2. `/app/settings/page.tsx` - 添加数据格式验证
3. `vercel.json` - 添加 `--accept-data-loss` 参数

✅ **配置修复**：
1. `prisma/schema.prisma` - 使用 PostgreSQL
2. `prisma/schema.build.prisma` - 构建时 schema 配置
3. 环境变量使用标准名称 `DATABASE_URL`

## 下一步

1. **立即执行**：检查 Vercel 环境变量配置
2. **重新部署**：触发新的部署
3. **查看日志**：确认 prisma db push 执行成功
4. **测试功能**：访问 /settings 页面验证

## 联系支持

如果以上步骤都无法解决问题，请提供：
- Vercel Build Logs 的完整截图
- 环境变量配置截图（隐藏敏感信息）
- 浏览器控制台错误信息
