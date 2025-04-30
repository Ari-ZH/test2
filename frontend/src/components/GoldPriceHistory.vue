<script setup>
import { ref, onMounted } from 'vue';

const priceHistory = ref([]);
const isLoading = ref(false);
const error = ref(null);

// 从API获取金价历史记录
async function fetchPriceHistory() {
  isLoading.value = true;
  error.value = null;

  try {
    const response = await fetch(`/api/price-history?time=${Date.now()}`);

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`);
    }

    const data = await response.json();
    priceHistory.value = data.history || [];
    console.log('获取金价历史数据成功:', priceHistory.value);
  } catch (err) {
    console.error('获取金价历史数据失败:', err);
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
}

// 格式化日期时间
function formatDateTime(dateTimeStr) {
  if (!dateTimeStr) return '暂无数据';

  try {
    const date = new Date(dateTimeStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      '0'
    )}-${String(date.getDate()).padStart(2, '0')} ${String(
      date.getHours()
    ).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  } catch (error) {
    console.error('日期格式化错误:', error);
    return dateTimeStr;
  }
}

// 组件挂载时加载数据
onMounted(() => {
  fetchPriceHistory();
});
</script>

<template>
  <div class="gold-history-container">
    <div class="history-header">
      <h2>金价变化历史记录</h2>
    </div>
    <div v-if="isLoading" class="loading-indicator">正在加载历史数据...</div>
    <div v-else-if="error" class="error-message">{{ error }}</div>
    <div v-else-if="priceHistory.length === 0" class="no-data-message">
      暂无金价变化记录
    </div>
    <table v-else class="history-table">
      <thead>
        <tr>
          <th>变更时间</th>
          <th>回收</th>
          <th>售卖</th>
          <th>源回收</th>
          <th>源售卖</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in priceHistory" :key="item.id">
          <td>{{ formatDateTime(item.changeTime) }}</td>
          <td>{{ item.recyclePrice }}</td>
          <td>{{ item.sellPrice }}</td>
          <td>{{ item.rawRecyclePrice }}</td>
          <td>{{ item.rawSellPrice }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.gold-history-container {
  margin: 10px 0;
  padding: 0 8px;
  max-width: 98%;
  margin-left: auto;
  margin-right: auto;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.history-header h2 {
  color: #610711;
  font-size: 1.2rem;
  margin: 0;
}

.refresh-button {
  background-color: #d89614;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  font-size: 0.9rem;
}

.refresh-button:hover {
  background-color: #b77700;
}

.history-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #eee;
  font-size: 0.9rem;
}

.history-table th,
.history-table td {
  padding: 8px 6px;
  text-align: center;
  border-bottom: 1px solid #eee;
}

.history-table th {
  background-color: #f8d584;
  color: #333;
  font-weight: bold;
}

.history-table tr:nth-child(even) {
  background-color: #fbf8ef;
}

.loading-indicator,
.error-message,
.no-data-message {
  text-align: center;
  padding: 15px;
  color: #666;
  font-size: 0.9rem;
}

.error-message {
  color: #b91c1c;
}
</style>
