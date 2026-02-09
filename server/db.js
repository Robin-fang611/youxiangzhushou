const { Pool } = require('pg');

// 创建数据库连接池
// 这里会根据环境变量 DATABASE_URL 来决定连接哪个数据库
// 如果在本地开发没有配置数据库，会使用一个模拟的数据库对象，防止报错
let pool;

if (process.env.DATABASE_URL) {
  // 生产环境或配置了数据库地址的情况
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // 允许自签名证书，适配 Railway 等云服务
    }
  });
} else {
  // 本地开发且未配置数据库时的“假”数据库
  console.warn('警告: 未设置 DATABASE_URL。将使用模拟数据库，数据不会真正保存。');
  pool = {
    query: async () => console.log('模拟数据库查询已执行 (数据未保存)')
  };
}

// 初始化数据库表结构
// 这个函数会在服务器启动时运行，自动创建需要的表格
const initDb = async () => {
  if (!process.env.DATABASE_URL) return; // 如果没有数据库连接，就不执行
  
  try {
    // 1. 创建邮件发送日志表 (email_logs)
    // 用于记录每一次发送的历史
    await pool.query(`
      CREATE TABLE IF NOT EXISTS email_logs (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 发送时间
        recipient_count INTEGER,                       -- 收件人数量
        subject TEXT,                                  -- 邮件主题
        status TEXT,                                   -- 发送状态 (success/failed)
        error_details TEXT                             -- 如果失败，记录错误信息
      )
    `);

    // 2. 创建客户表 (customers)
    // 用于存储常用的客户联系方式
    await pool.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        name TEXT,                                     -- 客户姓名
        email TEXT UNIQUE NOT NULL,                    -- 邮箱 (必须唯一)
        company TEXT,                                  -- 公司名称
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- 创建时间
      )
    `);
    
    console.log('数据库表结构初始化完成');
  } catch (err) {
    console.error('数据库初始化失败:', err);
  }
};

// 记录邮件发送日志的辅助函数
const logEmail = async (count, subject, status, error = null) => {
  try {
    await pool.query(
      'INSERT INTO email_logs (recipient_count, subject, status, error_details) VALUES ($1, $2, $3, $4)',
      [count, subject, status, error]
    );
  } catch (err) {
    console.error('写入日志失败:', err);
  }
};

// 立即执行初始化
initDb();

// 导出数据库连接池和日志函数，供其他文件使用
module.exports = { pool, logEmail };
