# 邮件营销系统

基于 Next.js 14 的全栈邮件营销解决方案，采用现代化设计，提供专业、可靠、易用的批量邮件发送体验。

![版本](https://img.shields.io/badge/版本 -2.0.0-blue)
![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-5-blue?logo=prisma)

---

## ✨ 核心功能

### 📧 智能客户管理
- CSV/Excel 导入，自动识别邮箱、姓名、公司
- 智能去重和格式验证
- 支持客户标签和分组管理

### 🎯 个性化发送
- 变量替换（`{{name}}`、`{{company}}`）
- 每封邮件都是专属定制
- 提升邮件打开率和转化率

### 📊 实时追踪
- 发送进度实时监控
- 成功/失败统计
- 详细日志记录

### 🛡️ 反垃圾优化
- 内置垃圾邮件检测
- 智能发送频率控制
- 确保邮件送达率

---

## 🚀 快速开始

### 环境要求
- Node.js 18+
- npm 或 yarn

### 1. 安装依赖
```bash
npm install
```

### 2. 配置环境变量
```bash
cp .env.example .env
```

编辑 `.env` 文件配置邮件服务：

#### QQ 邮箱配置（推荐）
```env
MAIL_PROVIDER=qq
QQ_EMAIL=your_qq@qq.com
QQ_SMTP_AUTH=your_auth_code
```

**获取 QQ 邮箱授权码：**
1. 登录 QQ 邮箱网页版
2. 设置 → 账户 → 开启 SMTP 服务
3. 获取授权码

### 3. 初始化数据库
```bash
npm run db:migrate
```

### 4. 启动开发服务器
```bash
npm run dev
```

访问 http://localhost:3000

---

## 📖 使用指南

### 创建营销活动

#### 步骤 1：上传客户列表
- 支持格式：CSV、XLSX、XLS
- 必填字段：邮箱
- 可选字段：姓名、公司

**示例格式：**
```csv
姓名，邮箱，公司
张三，zhangsan@example.com，示例公司
李四，lisi@example.com，示例集团
```

#### 步骤 2：撰写邮件内容
- 邮件主题（必填）
- 邮件正文（必填）

**使用变量实现个性化：**
```
主题：尊敬的 {{name}}，这是我们为您准备的特别优惠

正文：
尊敬的 {{name}}：

您好！感谢您对 {{company}} 的关注。

我们为您准备了专属优惠，期待您的参与！
```

#### 步骤 3：发送并追踪
- 创建后自动开始发送
- 实时查看发送进度
- 查看详细日志

---

## 🛠️ 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Next.js 14 (App Router) |
| 语言 | TypeScript 5 |
| 数据库 | SQLite (dev) / PostgreSQL (prod) |
| ORM | Prisma 5 |
| 邮件 | nodemailer 6 |
| UI | Tailwind CSS |
| 图标 | Lucide React |

---

## 🔧 开发命令

```bash
# 开发模式
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start

# 数据库管理
npm run db:studio

# 数据库迁移
npm run db:migrate

# 生成 Prisma 客户端
npm run db:generate
```

---

## 📊 数据模型

```prisma
Campaign (营销活动)
├── name: 活动名称
├── subject: 邮件主题
├── body: 邮件正文
├── status: DRAFT | SENDING | COMPLETED | FAILED
├── totalRecipients: 总收件人数
├── successCount: 成功数
├── failedCount: 失败数
└── contacts: CampaignContact[]

CampaignContact (联系人)
├── email: 邮箱
├── name: 姓名
├── company: 公司
├── status: PENDING | SENT | FAILED
└── errorMsg: 失败原因

Customer (客户)
├── email: 邮箱（唯一）
├── name: 姓名
└── company: 公司
```

---

## 🔒 安全性

- ✅ 环境变量隔离
- ✅ 输入验证
- ✅ SQL 注入防护（Prisma 参数化查询）
- ✅ 友好的错误提示

---

## 🚀 部署

### Vercel 部署（推荐）

```bash
npm i -g vercel
vercel
```

### 生产环境配置

1. 使用 PostgreSQL 替代 SQLite
2. 配置环境变量
3. 设置 SSL/HTTPS
4. 配置反向代理（Nginx）

---

## 📝 开发计划

- [ ] 邮件模板管理
- [ ] 定时发送
- [ ] 邮件打开率追踪
- [ ] A/B 测试
- [ ] 数据导出
- [ ] 多用户系统

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🙏 致谢

感谢以下开源项目：

- [Next.js](https://nextjs.org/)
- [Prisma](https://www.prisma.io/)
- [nodemailer](https://nodemailer.com/)
- [Lucide Icons](https://lucide.dev/)
- [Tailwind CSS](https://tailwindcss.com/)

---

**版本**: 2.0.0  
**更新时间**: 2026-03-05
