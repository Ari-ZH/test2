<script setup>
const props = defineProps({
  metalPrices: {
    type: Array,
    required: true,
  },
  originList: {
    type: Array,
    default: () => [],
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: null,
  },
});
</script>

<template>
  <div class="price-table-container">
    <div v-if="isLoading" class="loading-indicator">正在加载数据...</div>
    <div v-else-if="error" class="error-message">
      {{ error }}
    </div>
    <table v-else class="metal-table">
      <thead>
        <tr>
          <th>金属类别</th>
          <th>回收价格</th>
          <th>销售价格</th>
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
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.price-table-container {
  width: 100%;
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

.metal-table tr:last-child td {
  border-bottom: none;
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

@media (max-width: 768px) {
  .metal-table th,
  .metal-table td {
    padding: 10px 8px;
    font-size: 0.95rem;
  }
}
</style>
