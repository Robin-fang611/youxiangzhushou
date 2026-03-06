# 🚀 部署指南

本文档提供完整的生产环境部署指南，支持多种部署方式。

---

## 📋 部署前准备

### 系统要求
- Node.js 18+
- PostgreSQL 15+ (生产环境)
- Redis 7+ (可选，用于缓存)
- 内存: 最低 2GB，推荐 4GB+
- 存储: 最低 10GB，推荐 20GB+

### 必需的环境变量
```bash
# 数据库
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# 安全密钥（至少 32 位随机字符）
SECRET_KEY="your-secret-key-min-32-characters"
JWT_SECRET="your-jwt-secret-min-32-characters"

# 邮件服务
MAIL_PROVIDER="qq"
QQ_EMAIL="your@qq.com"
QQ_SMTP_AUTH="your-auth-code"
```

---

## 🌐 方式一：Vercel 部署（推荐）

### 优点
- ✅ 自动 CI/CD
- ✅ 全球 CDN
- ✅ 自动 HTTPS
- ✅ 零运维

### 步骤

#### 1. 安装 Vercel CLI
```bash
npm i -g vercel
```

#### 2. 登录 Vercel
```bash
vercel login
```

#### 3. 创建项目
```bash
vercel
```

#### 4. 配置环境变量
在 Vercel Dashboard 中设置：
- `DATABASE_URL`
- `SECRET_KEY`
- `JWT_SECRET`
- `MAIL_PROVIDER`
- `QQ_EMAIL`
- `QQ_SMTP_AUTH`

#### 5. 部署
```bash
vercel --prod
```

### 数据库配置

#### 使用 Vercel Postgres
```bash
# 在 Vercel Dashboard 中创建数据库
# 自动生成 DATABASE_URL
```

#### 使用外部 PostgreSQL
推荐服务商：
- [Neon](https://neon.tech) - Serverless PostgreSQL
- [Supabase](https://supabase.com) - PostgreSQL + 额外功能
- [Railway](https://railway.app) - 全托管数据库

---

## 🐳 方式二：Docker 部署

### 优点
- ✅ 环境一致性
- ✅ 易于扩展
- ✅ 本地测试方便

### 步骤

#### 1. 构建镜像
```bash
docker build -t marketing-email-system .
```

#### 2. 使用 Docker Compose
```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

#### 3. 配置环境变量
创建 `.env` 文件：
```bash
SECRET_KEY=your-secret-key
JWT_SECRET=your-jwt-secret
MAIL_PROVIDER=qq
QQ_EMAIL=your@qq.com
QQ_SMTP_AUTH=your-auth-code
```

#### 4. 初始化数据库
```bash
# 进入容器
docker-compose exec app sh

# 运行迁移
npx prisma migrate deploy

# 生成客户端
npx prisma generate
```

---

## 🖥️ 方式三：传统服务器部署

### 服务器要求
- CPU: 2 核+
- 内存: 4GB+
- 存储: 20GB+
- 操作系统: Ubuntu 20.04+ / CentOS 8+

### 步骤

#### 1. 安装依赖
```bash
# Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib

# PM2
sudo npm install -g pm2
```

#### 2. 配置 PostgreSQL
```bash
# 切换到 postgres 用户
sudo -u postgres psql

# 创建数据库和用户
CREATE DATABASE marketing_system;
CREATE USER marketing_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE marketing_system TO marketing_user;
```

#### 3. 部署应用
```bash
# 克隆代码
git clone <your-repo>
cd marketing-email-system

# 安装依赖
npm ci

# 配置环境变量
cp .env.example .env
nano .env

# 构建应用
npm run build

# 数据库迁移
npx prisma migrate deploy
```

#### 4. 使用 PM2 管理
```bash
# 创建 ecosystem.config.js
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'marketing-email-system',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
EOF

# 启动应用
pm2 start ecosystem.config.js

# 设置开机自启
pm2 startup
pm2 save
```

#### 5. 配置 Nginx
```bash
# 安装 Nginx
sudo apt-get install -y nginx

# 配置反向代理
sudo nano /etc/nginx/sites-available/marketing-email-system
```

配置内容：
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# 启用配置
sudo ln -s /etc/nginx/sites-available/marketing-email-system /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

#### 6. 配置 HTTPS（Let's Encrypt）
```bash
# 安装 Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

---

## 📊 性能优化建议

### 1. 数据库优化
```sql
-- 创建索引
CREATE INDEX idx_user_email ON "User"(email);
CREATE INDEX idx_customer_user_email ON "Customer"(userId, email);
CREATE INDEX idx_campaign_status ON "Campaign"(status);

-- 定期清理
DELETE FROM "Session" WHERE "expiresAt" < NOW();
DELETE FROM "CampaignLog" WHERE "createdAt" < NOW() - INTERVAL '30 days';
```

### 2. 应用优化
- 启用 Redis 缓存
- 使用 CDN 加速静态资源
- 启用 Gzip 压缩
- 配置合理的并发数

### 3. 监控配置
- 使用 PM2 监控
- 配置日志轮转
- 设置告警规则

---

## 🔒 安全检查清单

### 部署前检查
- [ ] 更改所有默认密钥
- [ ] 配置 HTTPS
- [ ] 设置防火墙规则
- [ ] 配置数据库备份
- [ ] 设置日志监控

### 安全配置
- [ ] 启用 CSRF 保护
- [ ] 配置 XSS 防护
- [ ] 设置 SQL 注入防护
- [ ] 配置速率限制
- [ ] 启用安全头

---

## 🆘 故障排查

### 常见问题

#### 1. 数据库连接失败
```bash
# 检查数据库状态
sudo systemctl status postgresql

# 检查连接
psql -U marketing_user -d marketing_system -h localhost
```

#### 2. 应用启动失败
```bash
# 查看日志
pm2 logs marketing-email-system

# 检查端口占用
lsof -i :3000
```

#### 3. 邮件发送失败
```bash
# 测试 SMTP 连接
telnet smtp.qq.com 587

# 检查环境变量
echo $QQ_EMAIL
echo $QQ_SMTP_AUTH
```

---

## 📞 技术支持

如遇到问题，请查看：
1. 应用日志: `pm2 logs`
2. Nginx 日志: `/var/log/nginx/error.log`
3. 数据库日志: `/var/log/postgresql/`

---

**文档版本**: v1.0  
**更新时间**: 2026-03-05
