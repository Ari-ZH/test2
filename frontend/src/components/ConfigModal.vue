<script setup>
import { ref, watch } from 'vue';
import dayjs from 'dayjs';

const props = defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  configData: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['update:show', 'submit-success']);

const isSubmitting = ref(false);
const formError = ref(null);

const configForm = ref({
  key: '',
  minUp: props.configData?.minUp || 0,
  minDown: props.configData?.minDown || 0,
  silverRecyclePrice: props.configData?.silverRecyclePrice || 0,
  silverSellPrice: props.configData?.silverSellPrice || 0,
  platinumRecyclePrice: props.configData?.platinumRecyclePrice || 0,
  platinumSellPrice: props.configData?.platinumSellPrice || 0,
  porpeziteRecyclePrice: props.configData?.porpeziteRecyclePrice || 0,
  porpeziteSellPrice: props.configData?.porpeziteSellPrice || 0,
});

// 初始化表单数据
watch(
  () => props.configData,
  (newConfigData) => {
    if (newConfigData) {
      configForm.value = {
        key: '',
        minUp: newConfigData.minUp,
        minDown: newConfigData.minDown,
        silverRecyclePrice: newConfigData.silverRecyclePrice,
        silverSellPrice: newConfigData.silverSellPrice,
        platinumRecyclePrice: newConfigData.platinumRecyclePrice,
        platinumSellPrice: newConfigData.platinumSellPrice,
        porpeziteRecyclePrice: newConfigData.porpeziteRecyclePrice,
        porpeziteSellPrice: newConfigData.porpeziteSellPrice,
      };
    }
  },
  {
    immediate: true,
  }
);

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
    porpeziteRecyclePrice: parseFloat(configForm.value.porpeziteRecyclePrice),
    porpeziteSellPrice: parseFloat(configForm.value.porpeziteSellPrice),
    updateTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    key: configForm.value.key,
  };

  // 发送请求
  fetch('/api/config', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formData),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`API 请求失败: ${response.status}`);
      }
      return response.json();
    })
    .then((res) => {
      console.log('更新配置数据成功:', res);
      emit('submit-success', res);
      closeModal();
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
function closeModal() {
  emit('update:show', false);
  formError.value = null;
}
</script>

<template>
  <div v-if="show" class="config-modal-backdrop" @click.self="closeModal">
    <div class="config-modal">
      <div class="config-modal-header">
        <h3>配置设置</h3>
        <button class="close-button" @click="closeModal">&times;</button>
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

        <div class="form-group">
          <label for="porpeziteRecyclePrice">钯金回收价格</label>
          <input
            id="porpeziteRecyclePrice"
            type="number"
            v-model="configForm.porpeziteRecyclePrice"
            step="0.01"
            required
          />
        </div>

        <div class="form-group">
          <label for="porpeziteSellPrice">钯金卖出价格</label>
          <input
            id="porpeziteSellPrice"
            type="number"
            v-model="configForm.porpeziteSellPrice"
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
        <button class="cancel-button" @click="closeModal">取消</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
  padding: 16px;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  max-height: 100vh;
  overflow: scroll;
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
</style>
