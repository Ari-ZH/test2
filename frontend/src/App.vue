<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import dayjs from 'dayjs';
import GoldPriceHistory from './components/GoldPriceHistory.vue';

// 定义数据源
const metalPrices = ref([]);
const originList = ref([]);
const isLoading = ref(true);
const error = ref(null);
// 添加点击计数器和计时器
const clickCount = ref(0);
const lastClickTime = ref(0);
const configData = ref(null);
const showConfig = ref(false);
// 控制金价历史记录的显示
const showPriceHistory = ref(false);
// 存储定时器ID
let updateTimer = null;

// 配置模态框相关
const showConfigModal = ref(false);
const configForm = ref({
  key: '',
  minUp: 0,
  minDown: 0,
  silverRecyclePrice: 0,
  silverSellPrice: 0,
  platinumRecyclePrice: 0,
  platinumSellPrice: 0
});
const isSubmitting = ref(false);
const formError = ref(null);

// 随机更新函数
function startRandomUpdates() {
  const scheduleNextUpdate = () => {
    // 生成2-8秒之间的随机时间
    const randomDelay = Math.floor(Math.random() * (8000 - 2000 + 1)) + 2000;
    console.log(`下次数据更新将在 ${randomDelay / 1000} 秒后进行`);
    updateTimer = setTimeout(() => {
      updateData();
      scheduleNextUpdate(); // 安排下一次更新
    }, randomDelay);
  };
  scheduleNextUpdate();
}

function updateData() {
  error.value = null;
  fetch(
    `/api/prices?time=${Date.now()}&${location.search.slice(1)}`
  )
    .then((response) => {
      if (!response.ok) {
        throw new Error(`API 请求失败: ${response.status}`);
      }
      return response.json();
    })
    .then((res) => {
      metalPrices.value = res.priceList;
      originList.value = res.originList;
      console.log(
        '获取价格数据成功:',
        metalPrices.value,
        '原始列表:',
        originList.value
      );
    })
    .catch((err) => {
      console.error('获取价格数据失败:', err);
      error.value = err.message;
    })
    .finally(() => {
      isLoading.value = false;
    });
}

function fetchConfig() {
  showConfig.value = true;
  // 获取配置数据
  fetch('/api/config')
    .then((response) => {
      if (!response.ok) {
        throw new Error(`API 请求失败: ${response.status}`);
      }
      return response.json();
    })
    .then((res) => {
      console.log('获取配置数据成功:', res);
      configData.value = res;
    })
    .catch((err) => {
      console.error('获取配置数据失败:', err);
      configData.value = '获取配置数据失败' + err.message;
    });
}

// 处理logo点击事件
function handleLogoClick() {
  const now = Date.now();
  // 如果超过3秒，重置计数器
  if (now - lastClickTime.value > 500) {
    clickCount.value = 1;
  } else {
    clickCount.value++;
  }
  lastClickTime.value = now;
  // 如果在3秒内点击了5次
  if (clickCount.value >= 5) {
    console.log('展示配置项');
    fetchConfig();
    showPriceHistory.value = !showPriceHistory.value; // 切换历史记录显示状态
    clickCount.value = 0; // 重置计数器
  }
}
/** 点击配置项 */
function handleConfigClick() {
  showConfig.value = false;
  showPriceHistory.value = false;
  showConfigModal.value = true;
  if (configData.value) {
    // 填充表单数据
    configForm.value = {
      key: '',
      minUp: configData.value.minUp,
      minDown: configData.value.minDown,
      silverRecyclePrice: configData.value.silverRecyclePrice,
      silverSellPrice: configData.value.silverSellPrice,
      platinumRecyclePrice: configData.value.platinumRecyclePrice,
      platinumSellPrice: configData.value.platinumSellPrice
    };
  }
}

// 提交配置表单
function submitConfigForm() {
  formError.value = null;
  isSubmitting.value = true;
  
  // 验证key是否填写
  if (!configForm.value.key) {
    formError.value = '请输入验证密钥';
    isSubmitting.value = false;
    return;
  }
  
  // 准备发送的数据
  const formData = {
    minUp: parseFloat(configForm.value.minUp),
    minDown: parseFloat(configForm.value.minDown),
    silverRecyclePrice: parseFloat(configForm.value.silverRecyclePrice),
    silverSellPrice: parseFloat(configForm.value.silverSellPrice),
    platinumRecyclePrice: parseFloat(configForm.value.platinumRecyclePrice),
    platinumSellPrice: parseFloat(configForm.value.platinumSellPrice),
    updateTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    key: configForm.value.key
  };
  
  // 发送请求
  fetch('/api/config', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formData)
  })
  .then((response) => {
    if (!response.ok) {
      throw new Error(`API 请求失败: ${response.status}`);
    }
    return response.json();
  })
  .then((res) => {
    console.log('更新配置数据成功:', res);
    configData.value = res;
    showConfigModal.value = false;
    alert('配置更新成功');
  })
  .catch((err) => {
    console.error('更新配置数据失败:', err);
    formError.value = `更新失败: ${err.message}`;
  })
  .finally(() => {
    isSubmitting.value = false;
  });
}

// 关闭配置模态框
function closeConfigModal() {
  showConfigModal.value = false;
  formError.value = null;
}

// 从 API 获取数据
onMounted(async () => {
  isLoading.value = true;
  updateData();
  // 启动随机间隔更新
  startRandomUpdates();
  // 获取url中的参数 silverR 和 silverS
  const urlParams = new URLSearchParams(location.search);
});

// 组件卸载时清除定时器
onUnmounted(() => {
  if (updateTimer) {
    clearTimeout(updateTimer);
  }
});
</script>

<template>
  <div class="app-container">
    <div class="poster-card">
      <header class="logo-section">
        <div class="logo-container" @click="handleLogoClick">
          <img
            src="./assets/WechatIMG2.jpg"
            alt="恒上金店 Logo"
            class="company-logo"
          />
        </div>
      </header>

      <div class="content-section">
        <div v-if="isLoading" class="loading-indicator">正在加载数据...</div>
        <div v-else-if="error" class="error-message">
          {{ error }}
        </div>
        <table v-else class="metal-table">
          <thead>
            <tr>
              <th>金属类别</th>
              <th>回收价格</th>
              <th>卖出价格</th>
              <th>价格更新时间</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in metalPrices" :key="item.id">
              <td>{{ item.type }}</td>
              <td>
                {{ `¥${item.recyclePrice}/克` }}
                {{
                  originList && originList[index]
                    ? `(${originList[index].buyPrice})`
                    : ''
                }}
              </td>
              <td>
                {{ `¥${item.sellPrice}/克` }}
                {{
                  originList && originList[index]
                    ? `(${originList[index].salePrice})`
                    : ''
                }}
              </td>
              <td>{{ item.updateTime }}</td>
            </tr>
          </tbody>
        </table>

        <!-- 金价历史记录组件 -->
        <GoldPriceHistory v-if="showPriceHistory" />
      </div>
      <div v-if="showConfig" class="config-section" @click="handleConfigClick">
        配置项:
        <span>{{ configData }}</span>
      </div>
      <footer class="contact-section">
        <div class="contact-info">联系方式: 0313-3070555</div>
      </footer>
    </div>

    <!-- 配置模态框 -->
    <div v-if="showConfigModal" class="config-modal-backdrop" @click.self="closeConfigModal">
      <div class="config-modal">
        <div class="config-modal-header">
          <h3>配置设置</h3>
          <button class="close-button" @click="closeConfigModal">&times;</button>
        </div>
        
        <div class="config-modal-body">
          <div v-if="formError" class="form-error">{{ formError }}</div>
          
          <div class="form-group">
            <label for="configKey">验证密钥</label>
            <input 
              id="configKey" 
              type="password" 
              v-model="configForm.key" 
              placeholder="请输入验证密钥" 
              required
            />
          </div>
          
          <div class="form-group">
            <label for="minUp">最小上调幅度</label>
            <input 
              id="minUp" 
              type="number" 
              v-model="configForm.minUp" 
              step="0.1" 
              required
            />
          </div>
          
          <div class="form-group">
            <label for="minDown">最小下调幅度</label>
            <input 
              id="minDown" 
              type="number" 
              v-model="configForm.minDown" 
              step="0.1" 
              required
            />
          </div>
          
          <div class="form-group">
            <label for="silverRecyclePrice">白银回收价格</label>
            <input 
              id="silverRecyclePrice" 
              type="number" 
              v-model="configForm.silverRecyclePrice" 
              step="0.01" 
              required
            />
          </div>
          
          <div class="form-group">
            <label for="silverSellPrice">白银卖出价格</label>
            <input 
              id="silverSellPrice" 
              type="number" 
              v-model="configForm.silverSellPrice" 
              step="0.01" 
              required
            />
          </div>
          
          <div class="form-group">
            <label for="platinumRecyclePrice">铂金回收价格</label>
            <input 
              id="platinumRecyclePrice" 
              type="number" 
              v-model="configForm.platinumRecyclePrice" 
              step="0.01" 
              required
            />
          </div>
          
          <div class="form-group">
            <label for="platinumSellPrice">铂金卖出价格</label>
            <input 
              id="platinumSellPrice" 
              type="number" 
              v-model="configForm.platinumSellPrice" 
              step="0.01" 
              required
            />
          </div>
        </div>
        
        <div class="config-modal-footer">
          <button 
            class="submit-button" 
            @click="submitConfigForm" 
            :disabled="isSubmitting"
          >
            {{ isSubmitting ? '提交中...' : '提交' }}
          </button>
          <button class="cancel-button" @click="closeConfigModal">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://at.alicdn.com/t/c/font_2996356_1b8z5k9z5k.css');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background-color: #ffffff;
  font-family: 'Alibaba PuHuiTi', sans-serif;
}

.app-container {
  width: 100%;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0;
}

.poster-card {
  width: 100%;
  max-width: 100%;
  height: 100vh;
  background-color: white;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* Logo section - 固定在顶部 */
.logo-section {
  width: 100%;
  background-color: #610711;
  padding: 0;
  position: sticky;
  top: 0;
  z-index: 10;
}

.logo-container {
  width: 100%;
  padding: 20px 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #610711;
}

/* Content section - 可滚动区域 */
.content-section {
  flex: 1;
  overflow-y: auto;
  padding: 0;
  background-color: #ffffff;
}

.poster-title {
  color: #d89614;
  text-align: center;
  font-size: 1.8rem;
  font-weight: bold;
  margin: 15px 0;
}

.metal-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.metal-table th,
.metal-table td {
  padding: 12px 5px;
  text-align: center;
  color: #333;
  border: none;
}

.metal-table th {
  background-color: #d89614;
  color: white;
  font-weight: bold;
  border: none;
}

.metal-table th:nth-child(1) {
  width: 20%;
}

.metal-table th:nth-child(2),
.metal-table th:nth-child(3) {
  width: 25%;
}

.metal-table th:nth-child(4) {
  width: 30%;
}

.metal-table td:nth-child(4) {
  font-size: 0.9em;
}

.metal-table tr:last-child td {
  border-bottom: none;
}

/* Contact section - 固定在底部 */
.contact-section {
  width: 100%;
  position: sticky;
  bottom: 0;
  z-index: 10;
}

.contact-info {
  background-color: #f8d584;
  color: #333;
  text-align: center;
  padding: 12px;
  font-weight: normal;
  width: 100%;
}
.company-logo {
  max-width: 240px;
}

.loading-indicator,
.error-message {
  text-align: center;
  padding: 2rem;
  font-size: 1.2rem;
}

.error-message {
  color: #b91c1c;
}

.config-modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.config-modal {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.config-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.config-modal-header h3 {
  margin: 0;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
}

.config-modal-body {
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.config-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.submit-button,
.cancel-button {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.submit-button {
  background-color: #4caf50;
  color: white;
}

.cancel-button {
  background-color: #f44336;
  color: white;
}

.submit-button:disabled {
  background-color: #9e9e9e;
  cursor: not-allowed;
}

.form-error {
  color: #f44336;
  margin-bottom: 15px;
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .company-logo {
    width: 120px;
  }

  .poster-title {
    font-size: 1.5rem;
    margin: 10px 0;
  }

  .metal-table th,
  .metal-table td {
    padding: 10px 8px;
    font-size: 0.95rem;
  }

  .contact-info {
    padding: 10px;
    font-size: 0.95rem;
  }
}
</style>
