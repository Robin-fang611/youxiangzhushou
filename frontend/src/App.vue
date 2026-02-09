<template>
  <div class="container">
    <!-- 顶部标题 -->
    <header class="header">
      <h1>📦 物流邮件助手</h1>
      <p class="subtitle">简单三步，批量触达您的客户</p>
    </header>

    <!-- 步骤进度条 -->
    <div class="steps">
      <div :class="['step', currentStep >= 1 ? 'active' : '']">1. 选择收件人</div>
      <div class="line"></div>
      <div :class="['step', currentStep >= 2 ? 'active' : '']">2. 撰写内容</div>
      <div class="line"></div>
      <div :class="['step', currentStep >= 3 ? 'active' : '']">3. 预览发送</div>
    </div>

    <!-- 步骤一：选择收件人 -->
    <div v-if="currentStep === 1" class="step-content">
      <div class="panel">
        <div class="panel-header">
          <h3>我的客户列表</h3>
          <button class="btn-small" @click="showAddCustomer = true">+ 新增客户</button>
        </div>
        
        <!-- 新增客户表单 (仅在点击新增时显示) -->
        <div v-if="showAddCustomer" class="add-customer-form">
          <input v-model="newCustomer.name" placeholder="姓名" />
          <input v-model="newCustomer.email" placeholder="邮箱 (必填)" />
          <input v-model="newCustomer.company" placeholder="公司" />
          <div class="btn-group">
            <button @click="addCustomer" :disabled="!newCustomer.email">保存</button>
            <button @click="showAddCustomer = false" class="btn-secondary">取消</button>
          </div>
        </div>

        <!-- 客户列表 -->
        <div class="customer-list" v-if="customers.length > 0">
          <div v-for="c in customers" :key="c.id" class="customer-item">
            <label>
              <input type="checkbox" :value="c.email" v-model="selectedEmails" />
              <span class="name">{{ c.name || '未命名' }}</span>
              <span class="email">{{ c.email }}</span>
              <span class="company" v-if="c.company">({{ c.company }})</span>
            </label>
            <button class="btn-icon" @click="deleteCustomer(c.id)" title="删除">🗑️</button>
          </div>
        </div>
        <div v-else class="empty-state">
          暂无保存的客户，请点击上方“新增”或在下方直接粘贴邮箱。
        </div>
      </div>

      <div class="panel">
        <h3>手动添加/粘贴邮箱</h3>
        <p class="hint">每行一个邮箱地址，或者用逗号分隔</p>
        <textarea v-model="manualEmails" rows="4" placeholder="client1@example.com&#10;client2@company.com"></textarea>
      </div>

      <div class="actions">
        <span>已选择 {{ totalRecipients }} 人</span>
        <button @click="nextStep" :disabled="totalRecipients === 0">下一步</button>
      </div>
    </div>

    <!-- 步骤二：撰写邮件 -->
    <div v-if="currentStep === 2" class="step-content">
      <div class="form-group">
        <label>邮件主题</label>
        <input v-model="subject" type="text" placeholder="例如：最新运费报价单 - 2024年2月" />
      </div>

      <div class="form-group">
        <label>邮件内容</label>
        <textarea v-model="content" rows="12" placeholder="尊敬的客户：&#10;&#10;附件是本月的最新报价..."></textarea>
        <p class="hint">支持简单的文字输入，暂不支持复杂的排版。</p>
      </div>

      <div class="actions">
        <button @click="currentStep = 1" class="btn-secondary">上一步</button>
        <button @click="nextStep" :disabled="!subject || !content">下一步</button>
      </div>
    </div>

    <!-- 步骤三：预览与发送 -->
    <div v-if="currentStep === 3" class="step-content">
      <div class="preview-card">
        <h3>确认发送信息</h3>
        <div class="preview-item">
          <strong>收件人数量：</strong> {{ totalRecipients }} 人
        </div>
        <div class="preview-item">
          <strong>主题：</strong> {{ subject }}
        </div>
        <div class="preview-item content-preview">
          <strong>内容预览：</strong>
          <pre>{{ content }}</pre>
        </div>
      </div>

      <!-- 发送状态反馈 -->
      <div v-if="message" :class="['message-box', status]">
        {{ message }}
      </div>

      <div class="actions">
        <button @click="currentStep = 2" class="btn-secondary" :disabled="sending">返回修改</button>
        <button @click="sendEmails" class="btn-primary" :disabled="sending">
          {{ sending ? '正在发送中...' : '确认发送 🚀' }}
        </button>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

// ==========================================
// 状态变量定义
// ==========================================
const currentStep = ref(1) // 当前步骤 (1, 2, 3)
const customers = ref([])  // 数据库里的客户列表
const showAddCustomer = ref(false) // 是否显示新增客户表单
const newCustomer = ref({ name: '', email: '', company: '' }) // 新客户表单数据

const selectedEmails = ref([]) // 勾选的客户邮箱
const manualEmails = ref('')   // 手动输入的邮箱文本
const subject = ref('')        // 邮件主题
const content = ref('')        // 邮件内容

const sending = ref(false)     // 发送中状态
const message = ref('')        // 提示消息
const status = ref('')         // 消息状态 (success/error)

// 获取后端 API 地址 (从环境变量读取，如果没有则默认为空，即当前域名)
const baseURL = import.meta.env.VITE_API_URL || ''

// ==========================================
// 计算属性
// ==========================================

// 计算总收件人列表 (合并勾选的和手动输入的)
const allRecipients = computed(() => {
  // 1. 获取手动输入的邮箱，按换行或逗号分割，去空格，去空项
  const manualList = manualEmails.value
    .split(/[\n,]/)
    .map(e => e.trim())
    .filter(e => e.length > 0);
  
  // 2. 合并勾选的列表，并去重
  const set = new Set([...selectedEmails.value, ...manualList]);
  return Array.from(set);
});

// 计算总人数
const totalRecipients = computed(() => allRecipients.value.length);

// ==========================================
// 方法函数
// ==========================================

// 1. 初始化：加载客户列表
const loadCustomers = async () => {
  try {
    const res = await axios.get(`${baseURL}/api/customers`);
    customers.value = res.data;
  } catch (err) {
    console.error('加载客户失败', err);
    // 不弹窗报错，以免影响用户心情，只是列表为空
  }
};

// 2. 添加客户
const addCustomer = async () => {
  try {
    const res = await axios.post(`${baseURL}/api/customers`, newCustomer.value);
    customers.value.unshift(res.data); // 添加到列表开头
    newCustomer.value = { name: '', email: '', company: '' }; // 重置表单
    showAddCustomer.value = false; // 关闭表单
  } catch (err) {
    alert(err.response?.data?.error || '添加失败');
  }
};

// 3. 删除客户
const deleteCustomer = async (id) => {
  if (!confirm('确定要删除这个客户吗？')) return;
  try {
    await axios.delete(`${baseURL}/api/customers/${id}`);
    customers.value = customers.value.filter(c => c.id !== id);
    // 同时从已选列表中移除该邮箱 (如果需要更严谨逻辑可加)
  } catch (err) {
    alert('删除失败');
  }
};

// 4. 下一步检查
const nextStep = () => {
  if (currentStep.value === 1 && totalRecipients.value === 0) {
    alert('请至少选择或输入一个收件人');
    return;
  }
  if (currentStep.value === 2 && (!subject.value || !content.value)) {
    alert('请填写完整的主题和内容');
    return;
  }
  currentStep.value++;
};

// 5. 发送邮件
const sendEmails = async () => {
  sending.value = true;
  message.value = '';
  
  try {
    const res = await axios.post(`${baseURL}/api/send`, {
      recipients: allRecipients.value,
      subject: subject.value,
      content: content.value // 这里后端支持 HTML，但前端目前只提供了普通文本框
    });
    
    message.value = `🎉 发送成功！已发送给 ${res.data.count} 位客户。`;
    status.value = 'success';
    
    // 发送成功后，3秒后可以重置，或者留给用户手动重置
  } catch (err) {
    message.value = `❌ 发送失败: ${err.response?.data?.error || err.message}`;
    status.value = 'error';
  } finally {
    sending.value = false;
  }
};

// 页面加载时执行
onMounted(() => {
  loadCustomers();
});
</script>

<style scoped>
/* 容器样式 */
.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  font-family: 'Segoe UI', sans-serif;
  color: #333;
}

/* 顶部样式 */
.header {
  text-align: center;
  margin-bottom: 2rem;
}
.header h1 { margin: 0; color: #2c3e50; }
.subtitle { color: #7f8c8d; margin-top: 0.5rem; }

/* 步骤条样式 */
.steps {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2rem;
}
.step {
  font-weight: bold;
  color: #bdc3c7;
  padding: 0.5rem;
}
.step.active { color: #27ae60; }
.line {
  width: 50px;
  height: 2px;
  background: #ecf0f1;
  margin: 0 10px;
}

/* 步骤内容区域 */
.step-content {
  background: #fff;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

/* 面板样式 */
.panel {
  margin-bottom: 1.5rem;
  border: 1px solid #eee;
  padding: 1rem;
  border-radius: 6px;
}
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}
.panel h3 { margin: 0 0 0.5rem 0; font-size: 1.1rem; }

/* 表单元素 */
input, textarea {
  width: 100%;
  padding: 0.8rem;
  margin-bottom: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
  font-size: 1rem;
}
textarea { resize: vertical; }

/* 按钮样式 */
button {
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background-color: #2c3e50;
  color: white;
  font-size: 1rem;
  transition: opacity 0.2s;
}
button:hover { opacity: 0.9; }
button:disabled { background-color: #bdc3c7; cursor: not-allowed; }

.btn-secondary { background-color: #95a5a6; }
.btn-primary { background-color: #27ae60; }
.btn-small { padding: 0.4rem 0.8rem; font-size: 0.9rem; }
.btn-icon { background: none; color: #e74c3c; padding: 0; font-size: 1.2rem; }

/* 底部操作栏 */
.actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

/* 客户列表项 */
.customer-item {
  display: flex;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f9f9f9;
}
.customer-item label {
  flex: 1;
  display: flex;
  align-items: center;
  cursor: pointer;
}
.customer-item input { width: auto; margin-right: 10px; }
.customer-item .name { font-weight: bold; margin-right: 10px; }
.customer-item .email { color: #666; margin-right: 10px; }
.customer-item .company { color: #999; font-size: 0.9rem; }

/* 新增客户表单 */
.add-customer-form {
  background: #f9f9f9;
  padding: 1rem;
  margin-bottom: 1rem;
  border-radius: 4px;
}
.btn-group { display: flex; gap: 10px; margin-top: 0.5rem; }

/* 预览卡片 */
.preview-card {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 6px;
  margin-bottom: 1.5rem;
}
.preview-item { margin-bottom: 1rem; }
.content-preview pre {
  background: white;
  padding: 1rem;
  border: 1px solid #eee;
  white-space: pre-wrap;
  font-family: inherit;
}

/* 消息提示 */
.message-box {
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  text-align: center;
  font-weight: bold;
}
.success { background-color: #d4edda; color: #155724; }
.error { background-color: #f8d7da; color: #721c24; }
.hint { color: #999; font-size: 0.9rem; margin-top: -5px; margin-bottom: 10px; }

/* 响应式调整 */
@media (max-width: 600px) {
  .container { padding: 1rem; }
  .step-content { padding: 1rem; }
  .customer-item { flex-wrap: wrap; }
  .customer-item .name, .customer-item .email { width: 100%; }
}
</style>
