<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// 添加 dayjs 的时区插件
dayjs.extend(utc);
dayjs.extend(timezone);

// 北京时间
const beijingTime = ref('');
let beijingTimeTimer = null;

// 更新北京时间
function updateBeijingTime() {
  beijingTime.value = dayjs()
    .tz('Asia/Shanghai')
    .format('YYYY年MM月DD日 HH:mm:ss');
}

onMounted(() => {
  // 启动北京时间更新
  updateBeijingTime();
  beijingTimeTimer = setInterval(updateBeijingTime, 1000);
});

onUnmounted(() => {
  if (beijingTimeTimer) {
    clearInterval(beijingTimeTimer);
  }
});
</script>

<template>
  <div class="beijing-time-container">
    <div class="beijing-time">北京时间: {{ beijingTime }}</div>
  </div>
</template>

<style scoped>
.beijing-time-container {
  text-align: center;
  margin: 10px 0;
  font-size: 1.1rem;
  color: #333;
}
</style>