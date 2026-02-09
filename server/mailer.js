const sgMail = require('@sendgrid/mail');

// 核心发送邮件函数
const sendEmails = async (recipients, subject, content) => {
  // 检查是否配置了 API Key
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('警告: 未设置 SENDGRID_API_KEY。邮件将不会真正发送。');
    
    // 如果是在开发环境，我们模拟发送成功，方便调试前端
    if (process.env.NODE_ENV !== 'production') {
      console.log('模拟发送邮件给:', recipients);
      return true;
    }
    throw new Error('缺失 SendGrid API Key');
  }

  // 设置 API Key
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  // 构建邮件对象
  // 注意：from 字段必须是你在 SendGrid 后台验证过的发件人邮箱
  const msg = {
    to: recipients,              // 收件人列表
    from: process.env.SENDER_EMAIL, 
    subject: subject,            // 邮件主题
    html: content,               // 邮件内容 (支持 HTML)
  };

  try {
    // 调用 SendGrid 接口发送
    // sendMultiple 适合给多个人发同样的邮件，每个人看到的收件人只有自己
    await sgMail.sendMultiple(msg);
    return true;
  } catch (error) {
    console.error('SendGrid 发送错误:', error);
    if (error.response) {
      console.error(error.response.body);
    }
    throw error;
  }
};

module.exports = { sendEmails };
