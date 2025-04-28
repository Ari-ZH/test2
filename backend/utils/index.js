/** 向上向下取整数 */
export function getFixedValue(type, value, fixedStep) {
  if (!value) {
    return '';
  }
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
  // 提取黄金数据
  const goldData = rawData.find((item) => item.name === '黄金');

  // 创建返回数据数组
  const processedData = [
    {
      id: 1,
      type: '黄金',
      recyclePrice:
        getFixedValue('down', goldData?.buyPrice, config.minDown) || '--',
      sellPrice: getFixedValue('up', goldData?.salePrice, config.minUp) || '--',
      updateTime: goldData?.time || new Date().toLocaleString('zh-CN'),
    },
    {
      id: 2,
      type: '白银',
      recyclePrice: config.silverRecyclePrice.toFixed(2),
      sellPrice: config.silverSellPrice.toFixed(2),
      updateTime: goldData?.time || new Date().toLocaleString('zh-CN'),
    },
    {
      id: 3,
      type: '铂金',
      recyclePrice: config.platinumRecyclePrice.toFixed(2),
      sellPrice: config.platinumSellPrice.toFixed(2),
      updateTime: goldData?.time || new Date().toLocaleString('zh-CN'),
    },
    {
      id: 4,
      type: '钯金',
      recyclePrice: config.porpeziteRecyclePrice.toFixed(2),
      sellPrice: config.porpeziteSellPrice.toFixed(2),
      updateTime: goldData?.time || new Date().toLocaleString('zh-CN'),
    },
  ];

  return processedData;
}

export { transformMetalData };
