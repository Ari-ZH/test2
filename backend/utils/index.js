/** 向上向下取整数 */
export function getFixedValue(type, value, fixedStep) {
  if (type === 'up') {
    return Math.ceil(Number(value) / 5) * 5 + fixedStep;
  } else if (type === 'down') {
    return Math.floor(Number(value) / 5) * 5 - fixedStep;
  }
  throw new Error('Invalid type. Use "up" or "down".');
}

/**
 * 将原始金属数据格式转换为 pricesData 格式
 *
 * 原始格式:
 * {
 *   "type": "1_au_1",
 *   "name": "黄金",
 *   "buyPrice": "789.00",
 *   "salePrice": "790.00",
 *   "minPrice": "789.30",
 *   "maxPrice": "790.00",
 *   "openPrice": null,
 *   "closePrice": null,
 *   "time": "2025-04-26 15:24:12",
 *   "allowDeal": false,
 *   "selling": true,
 *   "sort": 1,
 *   "rate": "1.0000"
 * }
 *
 * 目标格式:
 * {
 *   id: 1,
 *   type: "黄金",
 *   recyclePrice: "¥450/克",
 *   sellPrice: "¥470/克",
 *   updateTime: "2025年4月26日 14:30"
 * }
 */
function transformMetalData(rawData, config) {
  if (!rawData) return [];

  const result = [];
  const data = Array.isArray(rawData) ? rawData : [rawData];

  // 处理黄金数据
  const goldData = data.find(
    (item) => item.name === '黄金' || item.type.includes('au')
  );
  if (goldData) {
    // 提取并格式化日期时间
    const updateTime = goldData.time;

    // 提取价格并应用配置的上浮和下降
    const buyPrice = parseFloat(goldData.buyPrice);
    const salePrice = parseFloat(goldData.salePrice);

    // 应用配置的上浮和下降
    const adjustedBuyPrice = getFixedValue(
      'down',
      buyPrice,
      config.minDown
    ).toFixed(2);
    const adjustedSalePrice = getFixedValue(
      'up',
      salePrice,
      config.minUp
    ).toFixed(2);

    result.push({
      id: 1,
      type: '黄金',
      recyclePrice: adjustedBuyPrice,
      sellPrice: adjustedSalePrice,
      updateTime,
    });
  }

  // 添加白银数据（使用配置中的固定价格）
  result.push({
    id: 2,
    type: '白银',
    recyclePrice: config.silverRecyclePrice.toFixed(2),
    sellPrice: config.silverSellPrice.toFixed(2),
    updateTime: config.updateTime,
  });

  // 添加铂金数据（使用配置中的固定价格）
  result.push({
    id: 3,
    type: '铂金',
    recyclePrice: config.platinumRecyclePrice.toFixed(2),
    sellPrice: config.platinumSellPrice.toFixed(2),
    updateTime: config.updateTime,
  });

  return result;
}

export { transformMetalData };
