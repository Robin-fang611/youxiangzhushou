# 📧 邮件营销系统

<div align="center">

![Version](https://img.shields.io/badge/版本-2.0.0-blue)
![Next.js](https://img.shields.io/badge/Next.js-14.1-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-5.22-blue?logo=prisma)
![License](https://img.shields.io/badge/license-MIT-green)

**现代化、高效、可靠的批量邮件营销解决方案**

[快速开始](#-快速开始) | [功能特性](#-功能特性) | [API 文档](#-api-文档) | [部署指南](#-部署指南)

</div>

---

## 📋 目录

- [项目简介](#项目简介)
- [功能特性](#-功能特性)
- [技术栈](#-技术栈)
- [快速开始](#-快速开始)
- [配置说明](#-配置说明)
- [使用指南](#-使用指南)
- [项目结构](#-项目结构)
- [API 文档](#-api-文档)
- [部署指南](#-部署指南)
- [开发计划](#-开发计划)
- [贡献指南](#-贡献指南)
- [许可证](#-许可证)

---

## 项目简介

邮件营销系统是一个基于 Next.js 14 开发的全栈应用，专为企业级邮件营销场景设计。系统提供完整的客户管理、邮件模板、批量发送、实时追踪等功能，帮助用户高效执行邮件营销活动。

### 核心优势

- 🚀 **高性能**：基于 Next.js 14 App Router，支持服务端渲染和流式响应
- 🎯 **精准投递**：智能反垃圾邮件检测，提高邮件送达率
- 📊 **实时监控**：完整的发送日志和统计数据，实时掌握营销效果
- 🔒 **安全可靠**：Prisma ORM 防止 SQL 注入，环境变量隔离敏感信息
- 💡 **易于使用**：现代化 UI 设计，三步完成邮件营销活动
- 🤖 **AI 增强**：集成智能线索搜索和邮件生成功能

---

## ✨ 功能特性

### 📧 智能客户管理

- **多格式支持**：CSV、XLSX、XLS 格式一键导入
- **智能识别**：自动识别邮箱、姓名、公司等字段
- **数据验证**：实时验证邮箱格式，智能去重
- **标签分组**：支持客户标签和分组管理（规划中）

### 🎨 个性化邮件

- **变量替换**：支持 `{{name}}`、`{{company}}` 等变量
- **富文本编辑**：可视化邮件编辑器（规划中）
- **模板管理**：邮件模板库，快速复用（规划中）
- **预览功能**：发送前预览个性化邮件效果

### 📊 实时追踪

- **进度监控**：实时查看发送进度和状态
- **统计分析**：成功/失败统计，详细日志记录
- **错误诊断**：详细的错误信息和解决方案提示
- **数据导出**：发送结果导出功能（规划中）

### 🛡️ 安全与合规

- **反垃圾优化**：内置垃圾邮件检测机制
- **频率控制**：智能发送频率限制，避免被标记为垃圾邮件
- **数据安全**：敏感信息加密存储，环境变量隔离
- **退订管理**：自动处理退订请求（规划中）

### 🔧 多邮箱管理

- **SMTP 配置**：支持 QQ、163、Gmail 等主流邮箱
- **多账户切换**：支持多个发件邮箱配置和切换
- **连接测试**：一键测试 SMTP 连接状态
- **限额管理**：每日发送限额设置和监控

### 🤖 AI 线索搜索（新增）

- **智能搜索**：基于 Serper API 的 Google 搜索
- **AI 处理**：通义千问智能提取结构化线索
- **邮箱验证**：三阶段邮箱验证（格式→MX→SMTP）
- **同行管理**：同行公司信息管理

---

## 🛠️ 技术栈

### 前端

| 技术 | 版本 | 说明 |
|------|------|------|
| Next.js | 14.1.0 | React 全栈框架（App Router） |
| React | 18.2.0 | 用户界面库 |
| TypeScript | 5.3.3 | 类型安全 |
| Tailwind CSS | 3.4.1 | 原子化 CSS 框架 |
| Lucide React | 0.468.0 | 图标库 |
| Radix UI | 1.0.x | 无障碍 UI 组件 |

### 后端

| 技术 | 版本 | 说明 |
|------|------|------|
| Prisma | 5.22.0 | ORM 数据库工具 |
| Nodemailer | 6.9.9 | 邮件发送库 |
| SQLite | - | 开发环境数据库 |
| PostgreSQL | - | 生产环境数据库 |
| XLSX | 0.18.5 | Excel 文件解析 |
| PapaParse | 5.5.3 | CSV 文件解析 |
| OpenAI | ^4.28.0 | AI 模型调用 |

### 开发工具

- **ESLint** - 代码质量检查
- **PostCSS** - CSS 后处理器
- **tsx** - TypeScript 执行器

---

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0 或 yarn >= 1.22.0
- Git

### 安装步骤

#### 1. 克隆项目

```bash
git clone <repository-url>
cd 营销系统
```

#### 2. 安装依赖

```bash
npm install
```

#### 3. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置必要的环境变量：

```env
# 数据库配置（开发环境使用 SQLite）
DATABASE_URL="file:./dev.db"
DIRECT_DATABASE_URL="file:./dev.db"

# 应用安全配置
SECRET_KEY="your-secret-key-at-least-32-characters-long"
JWT_SECRET="your-jwt-secret-at-least-32-characters-long"

# 邮件服务配置（QQ 邮箱示例）
MAIL_PROVIDER=qq
QQ_EMAIL=your_email@qq.com
QQ_SMTP_AUTH=your_authorization_code

# AI 服务配置（线索挖掘）
QWEN_API_KEY=sk-your-qwen-api-key-here
SERPER_API_KEY=your-serper-api-key-here

# 运行环境
NODE_ENV=development
```

#### 4. 初始化数据库

```bash
# 生成 Prisma 客户端
npm run db:generate

# 运行数据库迁移
npm run db:migrate

# （可选）打开 Prisma Studio 查看数据
npm run db:studio
```

#### 5. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000 开始使用！

---

## ⚙️ 配置说明

### 邮箱配置

#### QQ 邮箱（推荐）

1. 登录 QQ 邮箱网页版
2. 进入 **设置** → **账户**
3. 开启 **POP3/SMTP 服务**
4. 获取 **授权码**（不是登录密码）
5. 配置环境变量：

```env
MAIL_PROVIDER=qq
QQ_EMAIL=your_email@qq.com
QQ_SMTP_AUTH=your_authorization_code
```

#### 163 邮箱

```env
MAIL_PROVIDER=163
MAIL_HOST=smtp.163.com
MAIL_PORT=465
MAIL_USER=your_email@163.com
MAIL_PASS=your_authorization_code
```

#### Gmail

```env
MAIL_PROVIDER=gmail
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your_email@gmail.com
MAIL_PASS=your_app_password
```

### 数据库配置

#### 开发环境（SQLite）

```env
DATABASE_URL="file:./dev.db"
DIRECT_DATABASE_URL="file:./dev.db"
```

#### 生产环境（PostgreSQL）

推荐使用 [Neon](https://neon.tech/) 或 [Supabase](https://supabase.com/) 提供的免费 PostgreSQL 数据库：

```env
DATABASE_URL="postgresql://user:password@host.neon.tech/dbname?sslmode=require"
DIRECT_DATABASE_URL="postgresql://user:password@host.neon.tech/dbname?sslmode=require"
```

### AI 服务配置

#### 通义千问 API

1. 访问 [阿里云 DashScope](https://dashscope.aliyun.com/)
2. 注册并获取 API Key
3. 配置环境变量：

```env
QWEN_API_KEY=sk-your-actual-key
```

#### Serper API

1. 访问 [Serper.dev](https://serper.dev/)
2. 注册并获取 API Key（免费额度 100 次/月）
3. 配置环境变量：

```env
SERPER_API_KEY=your-actual-key
```

---

## 📖 使用指南

### 创建营销活动

#### 步骤 0：配置发件邮箱

1. 访问 **设置** 页面
2. 点击 **添加邮箱**
3. 填写 SMTP 配置信息
4. 点击 **测试连接** 验证配置
5. 保存配置

#### 步骤 1：上传客户列表

支持格式：
- **CSV**：逗号分隔值文件
- **XLSX**：Excel 2007+ 格式
- **XLS**：Excel 97-2003 格式

文件格式示例：

```csv
姓名,邮箱,公司
张三,zhangsan@example.com,示例公司
李四,lisi@example.com,示例集团
```

或

```csv
zhangsan@example.com,张三,示例公司
lisi@example.com,李四,示例集团
```

**注意事项**：
- 邮箱字段必填
- 姓名和公司字段可选
- 支持中文/英文逗号分隔
- 自动识别带表头或不带表头格式

#### 步骤 2：撰写邮件内容

使用变量实现个性化：

```
主题：尊敬的 {{name}}，专属优惠等您领取

正文：
尊敬的 {{name}}：

您好！感谢您对 {{company}} 的关注。

我们为您准备了专属优惠活动...

此致
敬礼
```

**支持的变量**：
- `{{name}}` - 客户姓名
- `{{company}}` - 公司名称
- `{{email}}` - 邮箱地址

#### 步骤 3：发送并追踪

1. 点击 **创建并开始发送**
2. 系统自动创建营销活动
3. 实时查看发送进度
4. 查看详细日志和统计数据

### 使用 AI 线索搜索

1. 访问 **线索** 页面
2. 选择搜索类型（直客/同行）
3. 输入关键词（如 "Electronics"）
4. 点击"开始搜索"
5. AI 自动处理并返回结构化线索
6. 可选：启用邮箱深度验证
7. 将线索导出或直接用于邮件发送

---

## 📁 项目结构

```
营销系统/
├── app/                    # Next.js App Router
│   ├── api/               # API 路由
│   │   ├── campaigns/     # 营销活动 API
│   │   ├── leads/         # 线索管理 API
│   │   ├── peers/         # 同行公司 API
│   │   └── sender-accounts/ # 发件账户 API
│   ├── campaigns/         # 营销活动页面
│   │   ├── [id]/          # 活动详情
│   │   ├── new/           # 创建新活动
│   │   └── page.tsx       # 活动列表
│   ├── leads/             # 线索搜索页面
│   ├── settings/          # 设置页面
│   ├── help/              # 帮助页面
│   ├── test/              # 测试页面
│   ├── actions.ts         # Server Actions
│   ├── error.tsx          # 错误边界
│   ├── favicon.ico        # 网站图标
│   ├── globals.css        # 全局样式
│   ├── layout.tsx         # 根布局
│   ├── loading.tsx        # 加载组件
│   ├── page.tsx           # 首页
│   └── test-actions.ts    # 测试操作
├── components/            # React 组件
│   └── ui/                # UI 组件库
│       ├── badge.tsx      # 标签组件
│       ├── button.tsx     # 按钮组件
│       ├── card.tsx       # 卡片组件
│       ├── checkbox.tsx   # 复选框
│       ├── input.tsx      # 输入框
│       ├── select.tsx     # 下拉选择框
│       └── tabs.tsx       # 标签页
├── lib/                   # 核心库
│   ├── lead-search/       # 线索搜索模块
│   │   ├── index.ts       # 统一导出
│   │   ├── processor.ts   # AI 数据处理
│   │   ├── searcher.ts    # 搜索服务
│   │   └── verifier.ts    # 邮箱验证
│   ├── constants.ts       # 常量定义
│   ├── email-service.ts   # 邮件发送服务
│   ├── prisma.ts          # Prisma 客户端
│   └── utils.ts           # 工具函数
├── prisma/                # 数据库
│   ├── migrations/        # 数据库迁移
│   ├── schema.build.prisma # 构建时 schema
│   └── schema.prisma      # 数据模型定义
├── public/                # 静态资源
├── superlink-engine/      # 参考项目
├── .env.example           # 环境变量示例
├── .gitignore             # Git 忽略文件
├── eslint.config.mjs      # ESLint 配置
├── next.config.js         # Next.js 配置
├── package-lock.json      # 依赖锁文件
├── package.json           # 项目依赖
├── postcss.config.js      # PostCSS 配置
├── tailwind.config.ts     # Tailwind 配置
├── tsconfig.json          # TypeScript 配置
└── vercel.json            # Vercel 配置
```

---

## 📚 API 文档

### 发件邮箱管理

#### GET /api/sender-accounts

获取所有发件邮箱列表

**响应**：
```json
[
  {
    "id": "clx123...",
    "name": "公司主邮箱",
    "email": "company@example.com",
    "status": "ACTIVE",
    "isDefault": true,
    "dailyLimit": 500,
    "dailySent": 120
  }
]
```

#### POST /api/sender-accounts

创建新的发件邮箱

**请求体**：
```json
{
  "name": "公司主邮箱",
  "email": "company@example.com",
  "smtpHost": "smtp.qq.com",
  "smtpPort": 465,
  "smtpUser": "company@example.com",
  "smtpPass": "authorization_code",
  "smtpSecure": true,
  "status": "ACTIVE",
  "dailyLimit": 500
}
```

#### POST /api/sender-accounts/test

测试 SMTP 连接

**请求体**：
```json
{
  "smtpHost": "smtp.qq.com",
  "smtpPort": 465,
  "smtpUser": "company@example.com",
  "smtpPass": "authorization_code",
  "smtpSecure": true
}
```

### 营销活动

#### POST /api/campaigns/[id]/send-batch

批量发送邮件

### 线索管理

#### POST /api/leads/search

执行线索搜索任务

**请求体**：
```json
{
  "type": "direct_customer", // direct_customer | peer_company
  "keywords": "Electronics",
  "limit": 50
}
```

#### POST /api/leads/verify

批量验证邮箱

**请求体**：
```json
{
  "emails": ["test@example.com", "user@company.com"]
}
```

### 同行管理

#### GET /api/peers

获取同行公司列表

#### POST /api/peers

创建同行公司

**请求体**：
```json
{
  "name": "同行公司",
  "email": "contact@peer.com",
  "website": "https://peer.com"
}
```

---

## 🚀 部署指南

### Vercel 部署（推荐）

#### 1. 准备工作

- 注册 [Vercel](https://vercel.com/) 账户
- 注册 [Neon](https://neon.tech/) 或 [Supabase](https://supabase.com/) 获取 PostgreSQL 数据库
- 准备 Git 仓库（GitHub、GitLab 或 Bitbucket）

#### 2. 导入项目

1. 在 Vercel Dashboard 点击 **New Project**
2. 导入 Git 仓库
3. 选择 Next.js 框架（自动检测）

#### 3. 配置环境变量

在 Vercel 项目设置中添加以下环境变量：

```
DATABASE_URL=postgresql://...
DIRECT_DATABASE_URL=postgresql://...
SECRET_KEY=your-secret-key
JWT_SECRET=your-jwt-secret
MAIL_PROVIDER=qq
QQ_EMAIL=your_email@qq.com
QQ_SMTP_AUTH=your_auth_code
QWEN_API_KEY=your-qwen-api-key
SERPER_API_KEY=your-serper-api-key
NODE_ENV=production
```

**重要**：
- `DATABASE_URL` 必须是 Neon/Supabase 提供的连接字符串
- 必须包含 `?sslmode=require` 参数
- 选择 **Production** 环境

#### 4. 部署

点击 **Deploy**，等待构建完成。

**构建过程**：
1. 复制 `prisma/schema.build.prisma` 到 `prisma/schema.prisma`
2. 执行 `prisma generate` 生成客户端
3. 执行 `prisma db push` 同步数据库结构
4. 执行 `next build` 构建应用

#### 5. 验证部署

访问部署的 URL，测试以下功能：
- ✅ 首页正常显示
- ✅ 设置页面可以添加邮箱
- ✅ 可以创建营销活动
- ✅ 发送邮件功能正常
- ✅ 线索搜索功能正常

### 其他平台部署

#### Docker 部署

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

#### 传统服务器部署

```bash
# 安装依赖
npm ci --only=production

# 生成 Prisma 客户端
npx prisma generate

# 构建应用
npm run build

# 启动服务
npm start
```

使用 PM2 管理进程：

```bash
npm install -g pm2
pm start pm2 start npm --name "email-marketing" -- start
npm save pm2 save
npm startup pm2 startup
```

---

## 🗺️ 开发计划

### v2.1 - 邮件模板系统（计划中）

- [ ] 可视化邮件编辑器
- [ ] 模板库管理
- [ ] 模板分类和标签
- [ ] 模板预览功能

### v2.2 - 高级功能（计划中）

- [ ] 定时发送
- [ ] 邮件打开率追踪
- [ ] 点击率统计
- [ ] A/B 测试功能

### v2.3 - AI 增强（计划中）

- [ ] AI 邮件生成
- [ ] 智能跟进系统
- [ ] 客户意向识别
- [ ] 自动营销流程

### v2.4 - 用户系统（计划中）

- [ ] 多用户支持
- [ ] 角色权限管理
- [ ] 团队协作功能
- [ ] 操作日志审计

### v2.5 - 数据分析（计划中）

- [ ] 数据可视化仪表板
- [ ] 营销效果分析报告
- [ ] 数据导出功能
- [ ] API 接口开放

---

## 🤝 贡献指南

欢迎贡献代码、报告 Bug 或提出新功能建议！

### 贡献流程

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

### 代码规范

- 使用 TypeScript 编写代码
- 遵循 ESLint 规则
- 编写清晰的注释
- 提交前运行 `npm run lint` 检查代码质量

---

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

---

## 🙏 致谢

感谢以下开源项目：

- [Next.js](https://nextjs.org/) - React 全栈框架
- [Prisma](https://www.prisma.io/) - 数据库 ORM
- [Nodemailer](https://nodemailer.com/) - 邮件发送库
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [Lucide](https://lucide.dev/) - 图标库
- [Radix UI](https://www.radix-ui.com/) - UI 组件库
- [Serper](https://serper.dev/) - Google 搜索 API
- [通义千问](https://help.aliyun.com/zh/dashscope/) - AI 模型

---

## 📞 联系方式

- 项目主页：[GitHub Repository]
- 问题反馈：[GitHub Issues]
- 邮件联系：support@example.com

---

<div align="center">

**如果这个项目对您有帮助，请给一个 ⭐️ Star！**

Made with ❤️ by Your Team

</div>