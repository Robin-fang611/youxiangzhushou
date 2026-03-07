# 修复 SenderAccount 外键约束问题

## 问题诊断

### 错误信息
```
Foreign key constraint violated: `SenderAccount_userId_fkey (index)`
```

### 根本原因
1. **数据库表结构过时**：Vercel 上的 `SenderAccount` 表仍然有：
   - `userId` 字段为 `NOT NULL`
   - 外键约束指向 `User.id` 表
   - 唯一约束 `@@unique([userId, email])`

2. **代码已修复但未部署**：
   - ✅ `prisma/schema.prisma` 已修改 `userId` 为可选
   - ✅ `prisma/schema.build.prisma` 已同步修改
   - ✅ API 代码已移除硬编码的 `userId: 'system'`
   - ❌ **数据库表结构未更新**

## 解决方案

### 方案一：通过 Vercel 部署自动迁移（推荐）

1. **提交代码到 Git**
   ```bash
   git add .
   git commit -m "fix: 移除 SenderAccount.userId 硬编码，支持无用户系统"
   git push
   ```

2. **Vercel 会自动构建和部署**
   - Vercel 检测到代码变更会自动触发构建
   - 构建过程中会执行 `prisma generate`
   - 部署完成后会自动应用 schema 变更

3. **等待部署完成**
   - 访问 https://vercel.com/dashboard
   - 查看项目部署状态
   - 等待状态变为 "Ready"

### 方案二：手动执行数据库迁移（快速修复）

如果急需修复，可以在本地执行以下命令：

```bash
# 1. 生成迁移文件
npx prisma migrate dev --name fix_sender_account_foreign_key

# 2. 推送到生产数据库
npx prisma migrate deploy

# 或者直接推送表结构（不创建迁移记录）
npx prisma db push
```

### 方案三：在 Vercel 上执行迁移（需要 Vercel CLI）

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录 Vercel
vercel login

# 链接到项目
vercel link

# 执行迁移
vercel env pull
npx prisma migrate deploy
```

## 验证修复

部署完成后，测试以下步骤：

1. **打开设置页面**
   - 访问 https://system-35dx5itbi-robin-fang611s-projects.vercel.app/settings

2. **添加发件箱**
   - 点击"添加发件箱"
   - 填写测试数据：
     - 名称：测试发件箱
     - 邮箱：test@example.com
     - SMTP 服务器：smtp.example.com
     - 端口：587
     - 用户名：test@example.com
     - 密码：testpassword

3. **验证保存成功**
   - 应该显示"保存成功"提示
   - 发件箱列表中出现新记录
   - 不再出现外键约束错误

## 预防措施

### 1. 数据库迁移自动化

在 `package.json` 中添加：

```json
{
  "scripts": {
    "postinstall": "prisma generate",
    "db:migrate": "prisma migrate deploy",
    "db:push": "prisma db push"
  }
}
```

### 2. Schema 变更检查清单

每次修改 `prisma/schema.prisma` 时：

- [ ] 同步修改 `prisma/schema.build.prisma`
- [ ] 检查是否有破坏性变更（如删除字段、修改类型）
- [ ] 在本地测试迁移：`npx prisma migrate dev`
- [ ] 生成迁移文件后提交到 Git
- [ ] 确保 Vercel 部署成功

### 3. 外键约束最佳实践

```prisma
// ✅ 推荐：可选的外键关系
model SenderAccount {
  userId String?  // 可选字段
  user   User?    // 可选关系
}

// ❌ 避免：必填但无实际用户系统
model SenderAccount {
  userId String  // 必填，但系统没有用户认证
  user   User    @relation(fields: [userId], references: [id])
}
```

### 4. 错误处理增强

已在 API 中添加详细的错误处理：

```typescript
// 外键约束错误
if (error?.code === 'P2003') {
  return jsonErrorResponse(
    '外键约束失败，请检查关联数据是否存在',
    400,
    'FOREIGN_KEY_VIOLATION'
  )
}

// 唯一约束冲突
if (error?.code === 'P2002') {
  return jsonErrorResponse(
    '该邮箱地址已存在，请勿重复添加',
    409,
    'DUPLICATE_EMAIL'
  )
}
```

## 技术说明

### 为什么会出现外键约束错误？

1. **Prisma 默认行为**：
   - 当字段定义为 `String`（非可选）且有 `@relation` 时
   - Prisma 会创建外键约束，要求关联记录必须存在

2. **硬编码值的问题**：
   - 代码中使用 `userId: 'system'`
   - 但 `User` 表中不存在 `id='system'` 的记录
   - 数据库拒绝插入违反外键约束的数据

3. **解决方案的本质**：
   - 将 `userId` 改为可选 (`String?`)
   - 将关系改为可选 (`User?`)
   - 不传入 `userId`，让其为 `null`
   - 数据库不再检查外键约束

### 数据库迁移 SQL

执行迁移时，数据库会执行以下 SQL：

```sql
-- 移除 NOT NULL 约束
ALTER TABLE "SenderAccount" ALTER COLUMN "userId" DROP NOT NULL;

-- 移除外键约束
ALTER TABLE "SenderAccount" DROP CONSTRAINT IF EXISTS "SenderAccount_userId_fkey";

-- 移除唯一约束
DROP INDEX IF EXISTS "SenderAccount_userId_email_key";

-- 添加新索引
CREATE INDEX IF NOT EXISTS "SenderAccount_userId_idx" ON "SenderAccount"("userId");
CREATE INDEX IF NOT EXISTS "SenderAccount_email_idx" ON "SenderAccount"("email");
```

## 完成状态

- [x] 修改 `prisma/schema.prisma` - userId 改为可选
- [x] 修改 `prisma/schema.build.prisma` - 同步 schema
- [x] 修改 API 代码 - 移除硬编码 userId
- [ ] 执行数据库迁移 - **等待 Vercel 部署**
- [ ] 验证功能正常 - **部署完成后测试**
