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
  silverBarRecyclePrice: props.configData?.silverBarRecyclePrice || 0,
  silverBarSellPrice: props.configData?.silverBarSellPrice || 0,
  platinumBarRecyclePrice: props.configData?.platinumBarRecyclePrice || 0,
  platinumBarSellPrice: props.configData?.platinumBarSellPrice || 0,
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
        silverBarRecyclePrice: newConfigData.silverBarRecyclePrice || 0,
        silverBarSellPrice: newConfigData.silverBarSellPrice || 0,
        platinumBarRecyclePrice: newConfigData.platinumBarRecyclePrice || 0,
        platinumBarSellPrice: newConfigData.platinumBarSellPrice || 0,
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
    silverBarRecyclePrice: parseFloat(configForm.value.silverBarRecyclePrice),
    silverBarSellPrice: parseFloat(configForm.value.silverBarSellPrice),
    platinumBarRecyclePrice: parseFloat(configForm.value.platinumBarRecyclePrice),
    platinumBarSellPrice: parseFloat(configForm.value.platinumBarSellPrice),
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

        <!-- 验证密钥 -->
        <div class="section">
          <div class="form-group full-width">
            <label for="configKey">验证密钥</label>
            <input
              id="configKey"
              type="password"
              v-model="configForm.key"
              placeholder="请输入验证密钥"
              required
            />
          </div>
        </div>

        <!-- 黄金价格配置 -->
        <div class="section">
          <h4 class="section-title">黄金价格配置</h4>
          <div class="form-row">
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
          </div>
        </div>

        <!-- 金属价格配置 -->
        <div class="section">
          <h4 class="section-title">金属价格配置</h4>
          
          <!-- 白银 -->
          <div class="metal-group">
            <h5 class="metal-title">白银</h5>
            <div class="form-row">
              <div class="form-group">
                <label for="silverRecyclePrice">回收价格</label>
                <input
                  id="silverRecyclePrice"
                  type="number"
                  v-model="configForm.silverRecyclePrice"
                  step="0.01"
                  required
                />
              </div>
              <div class="form-group">
                <label for="silverSellPrice">卖出价格</label>
                <input
                  id="silverSellPrice"
                  type="number"
                  v-model="configForm.silverSellPrice"
                  step="0.01"
                  required
                />
              </div>
            </div>
          </div>

          <!-- 铂金 -->
          <div class="metal-group">
            <h5 class="metal-title">铂金</h5>
            <div class="form-row">
              <div class="form-group">
                <label for="platinumRecyclePrice">回收价格</label>
                <input
                  id="platinumRecyclePrice"
                  type="number"
                  v-model="configForm.platinumRecyclePrice"
                  step="0.01"
                  required
                />
              </div>
              <div class="form-group">
                <label for="platinumSellPrice">卖出价格</label>
                <input
                  id="platinumSellPrice"
                  type="number"
                  v-model="configForm.platinumSellPrice"
                  step="0.01"
                  required
                />
              </div>
            </div>
          </div>

          <!-- 钯金 -->
          <div class="metal-group">
            <h5 class="metal-title">钯金</h5>
            <div class="form-row">
              <div class="form-group">
                <label for="porpeziteRecyclePrice">回收价格</label>
                <input
                  id="porpeziteRecyclePrice"
                  type="number"
                  v-model="configForm.porpeziteRecyclePrice"
                  step="0.01"
                  required
                />
              </div>
              <div class="form-group">
                <label for="porpeziteSellPrice">卖出价格</label>
                <input
                  id="porpeziteSellPrice"
                  type="number"
                  v-model="configForm.porpeziteSellPrice"
                  step="0.01"
                  required
                />
              </div>
            </div>
          </div>

          <!-- 白银银条 -->
          <div class="metal-group">
            <h5 class="metal-title">白银银条</h5>
            <div class="form-row">
              <div class="form-group">
                <label for="silverBarRecyclePrice">回收价格</label>
                <input
                  id="silverBarRecyclePrice"
                  type="number"
                  v-model="configForm.silverBarRecyclePrice"
                  step="0.01"
                  required
                />
              </div>
              <div class="form-group">
                <label for="silverBarSellPrice">卖出价格</label>
                <input
                  id="silverBarSellPrice"
                  type="number"
                  v-model="configForm.silverBarSellPrice"
                  step="0.01"
                  required
                />
              </div>
            </div>
          </div>

          <!-- 铂金金条 -->
          <div class="metal-group">
            <h5 class="metal-title">铂金金条</h5>
            <div class="form-row">
              <div class="form-group">
                <label for="platinumBarRecyclePrice">回收价格</label>
                <input
                  id="platinumBarRecyclePrice"
                  type="number"
                  v-model="configForm.platinumBarRecyclePrice"
                  step="0.01"
                  required
                />
              </div>
              <div class="form-group">
                <label for="platinumBarSellPrice">卖出价格</label>
                <input
                  id="platinumBarSellPrice"
                  type="number"
                  v-model="configForm.platinumBarSellPrice"
                  step="0.01"
                  required
                />
              </div>
            </div>
          </div>
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
  padding: 8px;
  border-radius: 8px;
  width: 95%;
  max-width: 600px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  max-height: 95vh;
  overflow-y: auto;
}

.config-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid #e0e0e0;
}

.config-modal-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.1rem;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.close-button:hover {
  background-color: #f5f5f5;
}

.config-modal-body {
  margin-bottom: 12px;
}

/* 分组样式 */
.section {
  margin-bottom: 10px;
}

.section-title {
  margin: 0 0 8px 0;
  font-size: 1rem;
  font-weight: 600;
  color: #2c3e50;
  padding-bottom: 4px;
  border-bottom: 2px solid #3498db;
}

.metal-group {
  margin-bottom: 8px;
  padding: 8px;
  background-color: #f8f9fa;
  border-radius: 6px;
  border-left: 3px solid #3498db;
}

.metal-title {
  margin: 0 0 6px 0;
  font-size: 0.9rem;
  font-weight: 500;
  color: #34495e;
}

/* 表单行布局 */
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.form-group {
  margin-bottom: 0;
}

.form-group.full-width {
  margin-bottom: 8px;
}

.form-group label {
  display: block;
  margin-bottom: 3px;
  font-weight: 500;
  color: #555;
  font-size: 0.8rem;
}

.form-group input {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.85rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.config-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid #e0e0e0;
}

.submit-button,
.cancel-button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.85rem;
  transition: background-color 0.2s, transform 0.1s;
}

.submit-button {
  background-color: #27ae60;
  color: white;
}

.submit-button:hover:not(:disabled) {
  background-color: #229954;
  transform: translateY(-1px);
}

.cancel-button {
  background-color: #95a5a6;
  color: white;
}

.cancel-button:hover {
  background-color: #7f8c8d;
  transform: translateY(-1px);
}

.submit-button:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
  transform: none;
}

.form-error {
  color: #e74c3c;
  margin-bottom: 8px;
  font-size: 0.8rem;
  padding: 6px 8px;
  background-color: #fdf2f2;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .config-modal {
    width: 95%;
    max-width: none;
    max-height: 95vh;
    padding: 6px 8px;
  }
  
  .form-row {
    gap: 6px;
  }
  
  .metal-group {
    padding: 6px;
  }
}
</style>
