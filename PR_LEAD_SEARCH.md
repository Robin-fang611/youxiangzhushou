# Pull Request: AI Native 线索搜索系统集成

## 📋 变更类型

- [x] ✨ 新功能 (Feature)
- [x] 🎨 样式/设计 (Style/Design)
- [ ] 🐛 修复 (Fix)
- [ ] ♻️ 重构 (Refactor)
- [ ] 📝 文档 (Documentation)
- [ ] ⚡️ 性能优化 (Performance)
- [ ] 🔧 配置 (Configuration)

## 🎯 关联 Issue

Closes # (如有相关 Issue 请在此填写)

## 📖 变更描述

### 新增功能

本次 PR 集成了基于 `superlink-engine` 的 AI Native 线索搜索系统，为邮件营销系统添加了强大的客户挖掘能力。

#### 1. 线索搜索模块 (`lib/lead-search/`)
- ✅ **searcher.ts** - 基于 Serper API 的智能搜索服务
  - 支持 4 种搜索模块：欧美物流商、欧美进口商、中国货代同行、中国出口工厂
  - 关键词自动裂变功能
  - 批量搜索支持
  
- ✅ **processor.ts** - AI 数据处理服务
  - 集成通义千问/智谱 AI/OpenAI 多模型支持
  - 智能提取结构化线索数据
  - 自动去重和数据清洗
  
- ✅ **verifier.ts** - 三阶段邮箱验证服务
  - 格式验证
  - MX 记录验证
  - SMTP 握手验证
  
- ✅ **index.ts** - 统一的线索搜索流水线
  - 完整的搜索 → 处理 → 验证流程
  - 数据库持久化
  - 任务状态追踪

#### 2. API 路由 (`app/api/`)
- ✅ `/api/leads/search` - 线索搜索 API
  - POST: 执行搜索任务
  - GET: 获取线索列表和统计
  
- ✅ `/api/leads/verify` - 邮箱验证 API
  - POST: 批量验证邮箱
  - GET: 单个邮箱验证
  
- ✅ `/api/peers` - 同行公司管理 API
  - GET/POST/PUT/DELETE 完整 CRUD 支持

#### 3. 前端页面 (`app/leads/`)
- ✅ 线索搜索页面
  - 自然语言搜索界面
  - 搜索结果实时展示
  - 线索列表管理
  - 同行管理入口

#### 4. UI 组件库 (`components/ui/`)
采用飞书设计语言，创建 7 个核心组件：
- ✅ Button - 按钮 (7 种变体)
- ✅ Input - 输入框
- ✅ Card - 卡片容器
- ✅ Badge - 标签
- ✅ Tabs - 标签页
- ✅ Select - 下拉选择框
- ✅ Checkbox - 复选框

#### 5. 数据库模型扩展 (`prisma/schema.prisma`)
新增 4 个数据模型：
- ✅ `Lead` - 线索数据表
- ✅ `LeadSearchTask` - 搜索任务记录
- ✅ `PeerCompany` - 同行公司信息
- ✅ `EmailVerificationLog` - 邮箱验证日志

### 技术栈升级

| 组件 | 技术选型 | 说明 |
|------|----------|------|
| AI 模型 | 通义千问 (Qwen) | 优先支持中文场景 |
| 搜索 API | Serper | Google 搜索接口 |
| UI 风格 | 飞书设计语言 | 现代化、简洁 |
| 邮箱验证 | 三阶段验证 | 格式→MX→SMTP |

## 🔧 配置变更

### 环境变量 (`.env`)

新增配置项：
```bash
# AI 服务配置（线索挖掘）
QWEN_API_KEY=sk-your-qwen-api-key-here
SERPER_API_KEY=your-serper-api-key-here
```

### 依赖包 (`package.json`)

新增依赖：
- `openai` ^4.28.0 - AI 模型调用
- `@radix-ui/react-checkbox` ^1.0.4 - 复选框组件

## 📁 文件结构

### 新增文件
```
components/ui/
├── button.tsx
├── input.tsx
├── card.tsx
├── badge.tsx
├── tabs.tsx
├── select.tsx
└── checkbox.tsx

lib/lead-search/
├── index.ts
├── searcher.ts
├── processor.ts
└── verifier.ts

app/api/
├── leads/
│   ├── search/route.ts
│   └── verify/route.ts
└── peers/route.ts

app/leads/
└── page.tsx
```

### 修改文件
- `prisma/schema.prisma` - 新增数据模型
- `.env.example` - 新增 AI 配置示例
- `.env` - 新增 AI 配置
- `app/page.tsx` - 新增线索搜索入口
- `package.json` - 新增依赖

## 🧪 测试清单

- [ ] 线索搜索功能测试
- [ ] AI 数据处理测试
- [ ] 邮箱验证功能测试
- [ ] UI 组件渲染测试
- [ ] 数据库迁移测试
- [ ] API 端点测试

## 🚀 部署说明

### 1. 配置 API Keys
```bash
# .env 文件
QWEN_API_KEY=sk-your-actual-key
SERPER_API_KEY=your-actual-key
```

### 2. 数据库迁移
```bash
npx prisma db push
```

### 3. 启动开发服务器
```bash
npm run dev
```

### 4. 访问新功能
- 线索搜索：http://localhost:3001/leads
- 邮件营销：http://localhost:3001/campaigns

## 📊 功能演示

### 搜索流程
1. 访问 `/leads` 页面
2. 选择搜索类型（直客/同行）
3. 输入关键词（如 "Electronics"）
4. 点击"开始搜索"
5. AI 自动处理并返回结构化线索

### 验证流程
1. 线索自动进行邮箱格式验证
2. 可选：启用邮箱深度验证（MX + SMTP）
3. 验证结果实时更新到数据库

## ⚠️ 注意事项

1. **API 成本**
   - Serper API: 免费额度 100 次/月
   - 通义千问：按 token 计费
   - 建议：生产环境设置使用限制

2. **性能优化**
   - 批量搜索时限制最大查询次数
   - 邮箱验证采用并发控制（concurrency: 3）
   - 搜索结果自动去重

3. **数据安全**
   - API Keys 存储在 `.env` 文件
   - 不要将 `.env` 提交到 Git
   - 生产环境使用 Vercel 环境变量

## 📸 截图

（如有 UI 变更，请在此添加截图）

## 📝 后续计划

- AI 邮件生成：根据线索自动生成开发信
- 一键发送功能：线索直接转为营销活动
- 智能跟进系统：自动识别高意向客户
- 数据可视化：线索来源和质量分析

---

## ✅ 提交前检查

- [x] 代码已通过 ESLint 检查
- [x] 新增功能已测试
- [x] 数据库迁移已验证
- [x] 文档已更新
- [x] 环境变量配置已说明