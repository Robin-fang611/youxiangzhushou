# 物流邮件助手 (Logistics Email Assistant)

这是一个专为物流从业者设计的邮件群发工具。它可以帮助你轻松管理客户列表，并批量发送报价单或通知邮件。

## 🌟 主要功能

*   **简单易用**：只需三步（选择客户 -> 写邮件 -> 发送）即可完成。
*   **客户管理**：可以保存客户的姓名、邮箱和公司，下次直接勾选，不用重复粘贴。
*   **手机可用**：界面适配手机屏幕，随时随地都能发邮件。
*   **安全稳定**：使用专业的 SendGrid 邮件服务，到达率高。

---

## 🚀 部署指南 (如何把这个工具放到网上)

由于你不懂代码，请严格按照以下步骤操作。我们将使用两个免费平台：**Railway** (放后端和数据库) 和 **Vercel** (放前端网页)。

### 第一部分：后端部署 (Railway)

1.  **准备账号**：
    *   注册一个 [GitHub](https://github.com/) 账号。
    *   注册一个 [Railway](https://railway.app/) 账号 (可以用 GitHub 登录)。
    *   注册一个 [SendGrid](https://sendgrid.com/) 账号 (用于发邮件)。

2.  **上传代码**：
    *   将本项目的代码上传到你的 GitHub 仓库中。

3.  **在 Railway 创建项目**：
    *   登录 Railway，点击 `New Project` -> `Deploy from GitHub repo`。
    *   选择你刚才上传的仓库。
    *   点击 `Add Variable` (添加变量)，我们需要设置以下几个东西：

    | 变量名 (Variable Name) | 值 (Value) | 说明 |
    | :--- | :--- | :--- |
    | `SENDGRID_API_KEY` | (你的 SendGrid Key) | 在 SendGrid 后台生成，以 SG. 开头 |
    | `SENDER_EMAIL` | (你的发件邮箱) | 在 SendGrid 验证过的发件人邮箱 |
    | `PORT` | `3000` | 固定填 3000 |

4.  **添加数据库**：
    *   在 Railway 项目页面，右键点击空白处或点击 `New`，选择 `Database` -> `PostgreSQL`。
    *   数据库创建好后，Railway 会自动把数据库地址连接到你的项目中 (它会自动生成一个 `DATABASE_URL` 变量，你不用管)。

5.  **获取后端地址**：
    *   等部署完成后，点击你的项目卡片，找到 `Settings` -> `Domains`。
    *   复制生成的域名 (例如 `https://web-production-xxxx.up.railway.app`)，我们稍后要用。

---

### 第二部分：前端部署 (Vercel)

1.  **准备账号**：
    *   注册一个 [Vercel](https://vercel.com/) 账号 (用 GitHub 登录)。

2.  **创建项目**：
    *   在 Vercel 控制台点击 `Add New...` -> `Project`。
    *   选择同一个 GitHub 仓库，点击 `Import`。

3.  **配置项目**：
    *   **Framework Preset** (框架预设)：选择 `Vite`。
    *   **Root Directory** (根目录)：点击 `Edit`，选择 `frontend` 文件夹 (这一点很重要！)。
    *   **Environment Variables** (环境变量)：点击展开，添加以下变量：

    | 变量名 | 值 | 说明 |
    | :--- | :--- | :--- |
    | `VITE_API_URL` | (刚才复制的 Railway 地址) | **注意**：结尾不要带斜杠 `/` |

4.  **部署**：
    *   点击 `Deploy` 按钮。
    *   等待一分钟，出现撒花动画，说明部署成功！
    *   点击预览图，你就可以看到你的邮件助手了。

---

## 📖 使用说明

1.  打开 Vercel 生成的网页链接。
2.  **第一步**：
    *   如果是第一次使用，点击“+ 新增客户”，把你的老客户录入进去。
    *   或者直接在下方文本框粘贴一堆邮箱地址。
    *   勾选你要发送的人，点击“下一步”。
3.  **第二步**：
    *   填写邮件主题（例如：2月上海至洛杉矶海运报价）。
    *   填写邮件内容。
4.  **第三步**：
    *   预览一下信息对不对。
    *   点击“确认发送”，系统会开始逐个发送邮件。
    *   看到“发送成功”提示后，就搞定啦！

## 🛠️ 本地运行 (给懂技术的看)

如果你想在自己电脑上运行：

1.  **后端**：
    ```bash
    cd server
    npm install
    # 复制 .env.example 为 .env 并填入配置
    npm start
    ```

2.  **前端**：
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

如有问题，请检查 Railway 的日志 (Logs) 或浏览器的控制台 (F12)。
