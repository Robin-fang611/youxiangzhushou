# Vercel 数据库配置指南

## ⚠️ 当前问题

根据检查，发现以下问题导致数据库错误：

1. **缺少数据库迁移** - 没有执行 `prisma migrate deploy`
2. **schema 文件不匹配** - 构建时使用 SQLite schema，但运行时需要 PostgreSQL
3. **数据库表未创建** - Vercel 部署后没有自动创建数据库表

## 🔧 解决方案

### 步骤 1：在 Vercel 添加 Neon 数据库

1. **访问 Vercel Dashboard**
   - 打开 https://vercel.com/dashboard
   - 选择你的项目

2. **添加 Neon 数据库**
   - 点击 "Storage" → "Add Database"
   - 选择 "Neon"
   - 点击 "Install"
   - Vercel 会自动创建数据库并添加环境变量

3. **确认环境变量**
   - 进入项目 "Settings" → "Environment Variables"
   - 确保有以下变量：
     ```
     DATABASE_URL=postgresql://...
     DIRECT_DATABASE_URL=postgresql://...
     ```

### 步骤 2：更新 vercel.json 配置

修改 `vercel.json` 以支持数据库迁移：

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "cp prisma/schema.build.prisma prisma/schema.prisma && prisma generate && prisma migrate deploy && next build",
  "framework": "nextjs",
  "regions": ["hkg1"]
}
```

**注意：** 添加了 `prisma migrate deploy` 来在构建时执行数据库迁移

### 步骤 3：创建数据库迁移文件

在本地执行以下命令生成迁移文件：

```bash
# 确保使用 PostgreSQL schema
cp prisma/schema.prisma prisma/schema.local.prisma

# 生成迁移文件
npx prisma migrate dev --name init

# 这会创建 prisma/migrations/ 文件夹
```

### 步骤 4：提交并推送

```bash
git add prisma/migrations
git add vercel.json
git commit -m "feat: add database migrations and update Vercel config"
git push origin main
```

### 步骤 5：手动执行迁移（可选）

如果自动迁移失败，可以手动执行：

1. **获取数据库连接字符串**
   - 从 Vercel 项目设置中复制 `DATABASE_URL`

2. **本地执行迁移**
   ```bash
   # 设置临时数据库 URL
   export DATABASE_URL="你的数据库连接字符串"
   
   # 执行迁移
   npx prisma migrate deploy
   ```

3. **生成 Prisma Client**
   ```bash
   npx prisma generate
   ```

## 🎯 完整的工作流程

### 本地开发
```bash
# 使用本地 SQLite 或 PostgreSQL
npx prisma migrate dev
npx prisma generate
npm run dev
```

### Vercel 部署
1. 推送代码到 GitHub
2. Vercel 自动触发部署
3. 执行 `prisma migrate deploy` 创建数据库表
4. 构建 Next.js 应用
5. 部署完成

## 📝 环境变量配置

### 本地开发 (.env)
```env
DATABASE_URL="file:./dev.db"
DIRECT_DATABASE_URL="file:./dev.db"
```

### Vercel 生产环境
```env
DATABASE_URL="postgresql://user:password@host.neon.tech/dbname?sslmode=require"
DIRECT_DATABASE_URL="postgresql://user:password@host.neon.tech/dbname?sslmode=require"
```

## ⚡ 快速修复（推荐）

如果上述步骤太复杂，可以使用这个快速方案：

### 方案 A：使用 Vercel + Neon 集成（最简单）

1. 在 Vercel Dashboard 添加 Neon 数据库
2. 更新 `vercel.json` 添加 `prisma migrate deploy`
3. 推送代码

### 方案 B：手动初始化数据库

1. 在 Vercel Settings 获取 `DATABASE_URL`
2. 本地执行：
   ```bash
   npx prisma db push --accept-data-loss
   npx prisma generate
   ```
3. 提交并推送 `schema.prisma` 和 `prisma/schema.local.prisma`

## 🔍 验证数据库连接

部署后，访问 Vercel 提供的 URL 并测试：

1. ✅ 访问 `/settings` 页面
2. ✅ 添加发件邮箱
3. ✅ 如果成功保存，说明数据库连接正常

## 📞 故障排查

### 错误：Unable to open the database file

**原因：** 使用了 SQLite 但路径不正确或权限问题

**解决方案：**
- 确保 Vercel 使用 PostgreSQL 而不是 SQLite
- 检查 `DATABASE_URL` 环境变量是否正确配置

### 错误：Table doesn't exist

**原因：** 数据库表未创建

**解决方案：**
- 执行 `prisma migrate deploy`
- 或执行 `prisma db push`（开发环境）

### 错误：Prisma Client not generated

**原因：** 缺少 `prisma generate` 步骤

**解决方案：**
- 确保 buildCommand 包含 `prisma generate`
- 重新部署

## 🔗 相关资源

- [Prisma on Vercel](https://www.prisma.io/docs/guides/database/vercel)
- [Neon Database](https://neon.tech/)
- [Vercel Storage](https://vercel.com/docs/storage)
