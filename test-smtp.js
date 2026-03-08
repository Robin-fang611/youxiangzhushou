const nodemailer = require('nodemailer')

// 测试 SMTP 连接
async function testSMTPConnection() {
  console.log('=== 开始测试 SMTP 连接 ===\n')
  
  const transporter = nodemailer.createTransport({
    host: 'smtp.qq.com',
    port: 465,
    secure: true,
    auth: {
      user: '544639213@qq.com',
      pass: 'vrugyitwiqctbbec'  // 新授权码
    },
    logger: true,
    debug: true
  })
  
  try {
    console.log('1. 测试 SMTP 连接...')
    await transporter.verify()
    console.log('✅ SMTP 连接验证成功！\n')
    
    console.log('2. 尝试发送测试邮件...')
    const info = await transporter.sendMail({
      from: {
        name: '测试发送',
        address: '544639213@qq.com'
      },
      to: '544639213@qq.com',
      subject: 'SMTP 连接测试',
      text: '这是一封测试邮件，用于验证 SMTP 配置是否正确。',
      html: '<p>这是一封测试邮件，用于验证 SMTP 配置是否正确。</p>'
    })
    
    console.log('✅ 邮件发送成功！')
    console.log('Message ID:', info.messageId)
    console.log('Response:', info.response)
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message)
    console.error('错误堆栈:', error.stack)
  }
}

testSMTPConnection()
