# 测试验证清单

## 本地测试

### 1. 检查代码修复

**文件 1**: `app/api/sender-accounts/route.ts`
- ✅ 第 12 行：添加了 `const result = Array.isArray(accounts) ? accounts : []`
- ✅ 第 14 行：返回 `result` 而不是直接返回 `accounts`

**文件 2**: `app/settings/page.tsx`
- ✅ 第 37-38 行：添加了 HTTP 状态检查
- ✅ 第 41 行：添加了数据格式验证

**文件 3**: `vercel.json`
- ✅ 第 3 行：添加了 `--accept-data-loss` 参数

### 2. 本地运行测试

```bash
# 安装依赖
npm install

# 生成本地数据库
npx prisma generate

# 运行开发服务器
npm run dev
```

访问：http://localhost:3000/settings

**预期结果**：
- 页面正常加载，不出现 "e.map is not a function" 错误
- 如果没有配置邮箱，显示 "暂无发件邮箱"
- 如果有配置邮箱，显示邮箱列表

### 3. 浏览器控制台检查

打开浏览器开发者工具（F12），检查控制台：

**应该看到的日志**：
- `Loaded accounts: []` 或 `Loaded accounts: [...]`（数组格式）
- `Fetched accounts: []` 或 `Fetched accounts: [...]`

**不应该看到的错误**：
- ❌ `TypeError: e.map is not a function`
- ❌ `500 Internal Server Error`

## Vercel 部署测试

### 1. 推送代码到 Git

```bash
git add .
git commit -m "fix: 修复 API 返回数据格式验证和数据库配置"
git push origin main
```

### 2. 检查 Vercel 部署

访问 Vercel Dashboard，找到最新部署：

**检查 Build Logs**：
1. 搜索 "prisma db push" - 应该显示成功执行
2. 搜索 "Datasource" - 应该显示 Neon PostgreSQL 地址
3. 不应该有数据库连接错误

**关键日志示例**：
```
✓ Prisma schema copied successfully
✓ Prisma Client generated successfully
✓ Database pushed successfully (prisma db push)
✓ Build completed successfully
```

### 3. 在线功能测试

访问部署的 URL（例如：https://your-app.vercel.app）

**测试步骤**：

1. **访问 /settings 页面**
   - 页面应该正常加载
   - 不应该出现 "Application error" 页面
   - 控制台不应该有 "e.map is not a function" 错误

2. **添加发件箱**
   - 点击 "添加邮箱" 按钮
   - 填写表单信息
   - 点击 "保存"
   - 应该成功保存并显示在列表中

3. **测试连接**
   - 点击邮箱卡片上的 "测试连接" 按钮
   - 应该显示 "✅ 连接成功！" 或具体的错误信息

4. **设为默认**
   - 点击 "设为默认" 按钮
   - 邮箱卡片应该高亮显示（蓝色边框）
   - 刷新页面后设置应该保持

5. **编辑和删除**
   - 点击 "编辑" 按钮，修改信息并保存
   - 点击 "删除" 按钮，确认删除

### 4. 其他页面测试

- ✅ **首页** (`/`) - 应该正常显示
- ✅ **活动列表** (`/campaigns`) - 应该正常显示
- ✅ **新建活动** (`/campaigns/new`) - 表单应该正常加载

## 错误排查

### 如果仍然出现错误

**错误 1**: "e.map is not a function"
- 原因：API 返回的数据不是数组
- 解决：检查 `/api/sender-accounts/route.ts` 是否正确部署

**错误 2**: "Unable to open the database file"
- 原因：数据库表未创建
- 解决：检查 Vercel Build Logs，确认 prisma db push 执行成功

**错误 3**: "Can't reach database server"
- 原因：DATABASE_URL 配置错误
- 解决：在 Vercel Settings → Environment Variables 检查配置

**错误 4**: "Table doesn't exist"
- 原因：数据库同步失败
- 解决：手动执行 `vercel env pull` 然后 `npx prisma db push`

## 成功标准

所有以下条件必须满足：

- [ ] `/settings` 页面正常加载，无错误
- [ ] 发件箱列表显示正常（空列表或数据列表）
- [ ] 可以成功添加新的发件箱
- [ ] 可以编辑和删除发件箱
- [ ] 可以设置默认发件箱
- [ ] 浏览器控制台无 "e.map is not a function" 错误
- [ ] 浏览器控制台无 500 Internal Server Error
- [ ] Vercel Build Logs 显示 prisma db push 成功执行
- [ ] 所有其他页面正常显示

## 测试完成后的操作

如果所有测试都通过：

1. 清除浏览器缓存（Ctrl+Shift+Delete）
2. 重新访问应用确认功能正常
3. 开始正常使用系统（创建客户、上传 Excel、发送邮件等）

如果测试失败：

1. 记录具体的错误信息
2. 截图 Vercel Build Logs
3. 截图浏览器控制台错误
4. 根据错误排查部分进行修复
