<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import GoldPriceHistory from './components/GoldPriceHistory.vue';
import MetalPriceTable from './components/MetalPriceTable.vue';
import ConfigModal from './components/ConfigModal.vue';
import BeijingTime from './components/BeijingTime.vue';

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

// 随机更新函数
function startRandomUpdates() {
  const scheduleNextUpdate = () => {
    // 生成2-8秒之间的随机时间
    const randomDelay = Math.floor(Math.random() * (8000 - 2000 + 1)) + 2000;
    updateTimer = setTimeout(() => {
      updateData();
      scheduleNextUpdate(); // 安排下一次更新
    }, randomDelay);
  };
  scheduleNextUpdate();
}

function updateData() {
  error.value = null;
  fetch(`/api/latest-price?time=${Date.now()}&${location.search.slice(1)}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`API 请求失败: ${response.status}`);
      }
      return response.json();
    })
    .then((res) => {
      metalPrices.value = res.priceList;
      console.log('获取价格数据成功:', metalPrices.value);
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

// 存储来源更新定时器ID
let originUpdateTimer = null;

function startOriginUpdates() {
  // 检查URL是否包含origin=1参数
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('origin') === '1') {
    const scheduleNextOriginUpdate = () => {
      // 生成1-3秒之间的随机时间
      const randomDelay = Math.floor(Math.random() * (3000 - 1000 + 1)) + 1000;
      // console.log(`下次来源数据更新将在 ${randomDelay / 1000} 秒后进行`);
      originUpdateTimer = setTimeout(() => {
        fetchOriginList();
        scheduleNextOriginUpdate(); // 安排下一次更新
      }, randomDelay);
    };
    fetchOriginList();
    scheduleNextOriginUpdate();
  }
}

function fetchOriginList() {
  fetch(`/api/realtime-price?time=${Date.now()}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`API 请求失败: ${response.status}`);
      }
      return response.json();
    })
    .then((res) => {
      originList.value = res.originList || [];
      console.log('获取来源数据成功:', originList.value);
    })
    .catch((err) => {
      console.error('获取来源数据失败:', err);
    });
}

// 在onMounted中添加启动来源更新的调用
onMounted(() => {
  startOriginUpdates();
});

// 在onUnmounted中清除来源更新定时器
onUnmounted(() => {
  if (originUpdateTimer) {
    clearTimeout(originUpdateTimer);
  }
});
// 处理logo点击事件
function handleLogoClick() {
  const now = Date.now();
  // 如果超过0.5秒，重置计数器
  if (now - lastClickTime.value > 500) {
    clickCount.value = 1;
  } else {
    clickCount.value++;
  }
  lastClickTime.value = now;
  // 如果在短时间内点击了5次
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
}

// 处理配置更新成功
function handleConfigSuccess(newConfig) {
  configData.value = newConfig;
}

// 从 API 获取数据
onMounted(async () => {
  isLoading.value = true;
  updateData();
  // 启动随机间隔更新
  startRandomUpdates();
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
            src="./assets/WechatIMG2.png"
            alt="恒上金店 Logo"
            class="company-logo"
          />
        </div>
      </header>

      <div class="content-section">
        <!-- 使用金属价格表组件 -->
        <MetalPriceTable
          :metalPrices="metalPrices"
          :originList="originList"
          :isLoading="isLoading"
          :error="error"
        />

        <!-- 金价历史记录组件 -->
        <GoldPriceHistory v-if="showPriceHistory" />
      </div>

      <div v-if="showConfig" class="config-section" @click="handleConfigClick">
        配置项:
        <span>{{ configData }}</span>
      </div>

      <!-- 使用北京时间组件 -->
      <BeijingTime />

      <footer class="contact-section">
        <div class="contact-info">联系方式: 0313-3070555</div>
      </footer>
    </div>

    <!-- 使用配置模态框组件 -->
    <ConfigModal
      v-model:show="showConfigModal"
      :configData="configData"
      @submit-success="handleConfigSuccess"
    />
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
  max-width: 340px;
}

.config-section {
  padding: 10px;
  background-color: #f5f5f5;
  font-size: 0.9rem;
  color: #333;
}

@media (max-width: 768px) {
  .company-logo {
    width: 180px;
  }

  .poster-title {
    font-size: 1.5rem;
    margin: 10px 0;
  }

  .contact-info {
    padding: 10px;
    font-size: 1.2rem;
  }
}
</style>
