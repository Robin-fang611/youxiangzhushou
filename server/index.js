// 引入环境变量配置
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sendEmails } = require('./mailer');
const { pool, logEmail } = require('./db');

const app = express();
// 设置端口，如果环境变量没有设置，默认使用 3000
const PORT = process.env.PORT || 3000;

// 允许跨域请求 (让前端可以访问后端)
app.use(cors());
// 允许解析 JSON 格式的请求体
app.use(express.json());

// ==========================================
// 邮件发送接口
// ==========================================
app.post('/api/send', async (req, res) => {
  const { recipients, subject, content } = req.body;
  
  // 简单的参数校验
  if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
    return res.status(400).json({ error: '请提供有效的收件人列表' });
  }

  try {
    // 调用邮件发送服务
    const result = await sendEmails(recipients, subject, content);
    // 记录成功日志
    await logEmail(recipients.length, subject, 'success');
    res.json({ message: '邮件发送任务已提交', count: recipients.length });
  } catch (error) {
    console.error('邮件发送出错:', error);
    // 记录失败日志
    await logEmail(recipients.length, subject, 'failed', error.message);
    res.status(500).json({ error: '邮件发送失败，请检查配置或网络' });
  }
});

// ==========================================
// 客户管理接口
// ==========================================

// 1. 获取所有客户列表
app.get('/api/customers', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM customers ORDER BY created_at DESC');
    res.json(result.rows || []);
  } catch (error) {
    console.error('获取客户列表失败:', error);
    // 如果数据库未连接，返回空数组，避免前端崩溃
    res.json([]); 
  }
});

// 2. 添加新客户
app.post('/api/customers', async (req, res) => {
  const { name, email, company } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: '邮箱地址必填' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO customers (name, email, company) VALUES ($1, $2, $3) RETURNING *',
      [name, email, company]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('添加客户失败:', error);
    if (error.code === '23505') { // PostgreSQL 唯一性约束错误代码
      return res.status(400).json({ error: '该邮箱已存在' });
    }
    res.status(500).json({ error: '添加客户失败' });
  }
});

// 3. 删除客户
app.delete('/api/customers/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM customers WHERE id = $1', [id]);
    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('删除客户失败:', error);
    res.status(500).json({ error: '删除操作失败' });
  }
});

// ==========================================
// 基础健康检查接口
// ==========================================
app.get('/', (req, res) => {
  res.send('Logistics Email Assistant API (物流邮件助手后台)');
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器已启动，运行在端口 ${PORT}`);
});
