import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  getLatestConfig,
  saveConfig,
  getLatestScheduledGoldPrice,
  getScheduledGoldPriceHistory,
  saveScheduledGoldPrice,
} from './utils/db.js';
import { transformMetalData } from './utils/index.js';
import { dispatchNotify } from './dispatch/index.js';
import { randomInt } from 'crypto';
import dayjs from 'dayjs';

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 添加动态 CORS 中间件
app.use((req, res, next) => {
  // 从请求头中获取 Origin
  const origin = req.headers.origin;

  // 允许的源列表
  const allowedOrigins = [
    'http://localhost:5173', // Vite 开发服务器
    'http://localhost:3000', // 生产环境或其他环境
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
  ];

  // 如果请求源在允许列表中，动态设置 CORS 头
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }

  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Credentials', 'true');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  next();
});

// Middleware to parse JSON bodies
app.use(express.json());

// 定时任务的状态跟踪
let schedulerRunning = false;
let schedulerTimeout = null;

async function getGoldRawData(timeParam) {
  try {
    const response = await fetch(
      `http://ypjgold.cn/price/data?time=${timeParam}`,
      {
        headers: {
          accept: '*/*',
          'accept-language': 'zh-CN,zh;q=0.9',
          'cache-control': 'no-cache',
          pragma: 'no-cache',
          'x-requested-with': 'XMLHttpRequest',
          Referer: 'http://ypjgold.cn/',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
        },
        body: null,
        method: 'GET',
      }
    );
    const responseData = await response.json();
    return responseData.data.find((item) => item.name === '黄金');
  } catch (error) {
    console.error('获取原始黄金价格数据失败:', error);
    return null;
  }
}

// 定时任务函数：检查并记录金价变化
async function scheduledGoldPriceCheck() {
  try {
    // 获取北京时间
    const now = new Date();
    // 转换为北京时区 (UTC+8)
    const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
    const beijingTime = new Date(utcTime + 3600000 * 8);
    const beijingHour = beijingTime.getHours();

    console.log(
      `定时任务: 北京时间 ${beijingHour}:${now.getMinutes()}:${now.getSeconds()}`
    );

    // 生成时间戳参数
    const timeParam = beijingTime.getTime();

    // 获取最新配置
    const config = await getLatestConfig();

    // 获取原始金价数据
    const rawGoldData = await getGoldRawData(timeParam);

    if (rawGoldData) {
      // 转换数据为标准格式
      const pricesData = transformMetalData(rawGoldData, config);

      // 获取黄金价格数据
      const goldData = pricesData.find((item) => item.type === '黄金');

      if (goldData) {
        // 当前金价
        const currentSellPrice = parseFloat(goldData.sellPrice);
        const currentRecyclePrice = parseFloat(goldData.recyclePrice);
        const rawSellPrice = parseFloat(rawGoldData.salePrice);
        const rawRecyclePrice = parseFloat(rawGoldData.buyPrice);

        // 获取最新一次记录的定时任务金价
        const latestScheduledPrice = await getLatestScheduledGoldPrice();

        let priceChanged = false;
        let prevSellPrice = null;
        let prevRecyclePrice = null;

        // 比较金价是否变化
        if (!latestScheduledPrice) {
          // 如果没有历史记录，则记录第一条数据
          priceChanged = true;
        } else {
          prevSellPrice = parseFloat(latestScheduledPrice.sellPrice);
          prevRecyclePrice = parseFloat(latestScheduledPrice.recyclePrice);

          // 如果卖出价格或回收价格有变化，则标记为变化
          if (
            currentSellPrice !== prevSellPrice ||
            currentRecyclePrice !== prevRecyclePrice
          ) {
            priceChanged = true;
          }
        }

        // 如果价格变化，保存新记录
        if (priceChanged) {
          const priceRecord = {
            sellPrice: currentSellPrice,
            recyclePrice: currentRecyclePrice,
            rawSellPrice: rawSellPrice,
            rawRecyclePrice: rawRecyclePrice,
            prevSellPrice: prevSellPrice,
            prevRecyclePrice: prevRecyclePrice,
            changeTime: rawGoldData.time,
          };
          await saveScheduledGoldPrice(priceRecord);
          console.log(
            '定时任务：金价变化已记录:',
            priceRecord,
            '时间:',
            dayjs(beijingTime).format('YYYY-MM-DD HH:mm:ss')
          );
          // 使用原有的通知逻辑
          if (prevSellPrice !== null && currentSellPrice !== prevSellPrice) {
            dispatchNotify({
              typeText: '售卖',
              realTimeValue: rawGoldData.salePrice,
              beforeValue: prevSellPrice,
              currentValue: currentSellPrice,
              updateTime: rawGoldData.time,
            });
          }
          if (
            prevRecyclePrice !== null &&
            currentRecyclePrice !== prevRecyclePrice
          ) {
            dispatchNotify({
              typeText: '回收',
              realTimeValue: rawGoldData.buyPrice,
              beforeValue: prevRecyclePrice,
              currentValue: currentRecyclePrice,
              updateTime: rawGoldData.time,
            });
          }
        } else {
          console.log('定时任务：金价未变化，无需记录');
        }
      }
    }
    // 设置随机间隔 5-10 秒
    const nextInterval = randomInt(5000, 10001); // 5000-10000ms
    schedulerTimeout = setTimeout(scheduledGoldPriceCheck, nextInterval);
  } catch (error) {
    console.error('定时任务执行出错:', error);
    // 出错后，继续尝试下一次执行
    schedulerTimeout = setTimeout(scheduledGoldPriceCheck, 5000);
  }
}

// 启动定时任务
function startScheduler() {
  if (!schedulerRunning) {
    console.log('启动金价监控定时任务');
    schedulerRunning = true;
    scheduledGoldPriceCheck();
  }
}

// 停止定时任务
function stopScheduler() {
  if (schedulerRunning) {
    console.log('停止金价监控定时任务');
    if (schedulerTimeout) {
      clearTimeout(schedulerTimeout);
      schedulerTimeout = null;
    }
    schedulerRunning = false;
  }
}

// 配置接口 - GET 获取当前配置
app.get('/api/config', async (req, res) => {
  try {
    const config = await getLatestConfig();
    res.json(config);
  } catch (error) {
    console.error('获取配置失败:', error);
    res.status(500).json({ error: '获取配置失败' });
  }
});

// 配置接口 - POST 更新配置
app.post('/api/config', express.json(), async (req, res) => {
  try {
    const {
      minUp,
      minDown,
      silverRecyclePrice,
      silverSellPrice,
      platinumRecyclePrice,
      platinumSellPrice,
      porpeziteRecyclePrice,
      porpeziteSellPrice,
      updateTime,
      key,
    } = req.body;

    // 验证密钥
    if (!key || key !== 'hengshang') {
      return res.status(403).json({ error: '密钥无效，无法修改配置' });
    }

    // 保存新配置
    const config = await saveConfig({
      minUp: parseFloat(minUp),
      minDown: parseFloat(minDown),
      silverRecyclePrice: parseFloat(silverRecyclePrice),
      silverSellPrice: parseFloat(silverSellPrice),
      platinumRecyclePrice: parseFloat(platinumRecyclePrice),
      platinumSellPrice: parseFloat(platinumSellPrice),
      porpeziteRecyclePrice: parseFloat(porpeziteRecyclePrice),
      porpeziteSellPrice: parseFloat(porpeziteSellPrice),
      updateTime,
    });

    res.json(config);
  } catch (error) {
    console.error('更新配置失败:', error);
    res.status(500).json({ error: '更新配置失败' });
  }
});

// 新增API端点：获取最新金价（从定时任务记录表获取）
app.get('/api/latest-price', async (req, res) => {
  try {
    const latestPrice = await getLatestScheduledGoldPrice();
    if (latestPrice) {
      // Transform the data to match the priceList format
      // Get the latest config to apply other metal prices
      const config = await getLatestConfig();
      const formattedPrice = [
        {
          type: '黄金',
          recyclePrice: latestPrice.recyclePrice,
          sellPrice: latestPrice.sellPrice,
          updateTime: latestPrice.changeTime,
          rawRecyclePrice: latestPrice.rawRecyclePrice,
          rawSellPrice: latestPrice.rawSellPrice,
        },
        {
          type: '白银',
          recyclePrice: config.silverRecyclePrice,
          sellPrice: config.silverSellPrice,
          updateTime: latestPrice.changeTime,
        },
        {
          type: '铂金',
          recyclePrice: config.platinumRecyclePrice,
          sellPrice: config.platinumSellPrice,
          updateTime: latestPrice.changeTime,
        },
        {
          type: '钯金',
          recyclePrice: config.porpeziteRecyclePrice,
          sellPrice: config.porpeziteSellPrice,
          updateTime: latestPrice.changeTime,
        },
      ];

      res.json({
        priceList: formattedPrice,
      });
    } else {
      res.json({
        success: false,
        message: '暂无记录',
        priceList: [],
      });
    }
  } catch (error) {
    console.error('获取最新金价记录时出错:', error);
    res.status(500).json({ error: '获取最新金价记录失败' });
  }
});

// 新增API端点：获取实时金价（代理请求到数据源）
app.get('/api/realtime-price', async (req, res) => {
  try {
    const timeParam = req.query.time;
    const rawGoldData = await getGoldRawData(timeParam);
    if (rawGoldData) {
      console.log(
        '获取实时数据:',
        rawGoldData.salePrice,
        rawGoldData.buyPrice,
        timeParam
      );
      res.json({
        success: true,
        originList: [rawGoldData],
      });
    } else {
      res.json({
        success: false,
        message: '获取实时金价失败',
      });
    }
  } catch (error) {
    console.error('获取实时金价数据时出错:', error);
    res.status(500).json({ error: '获取实时金价数据失败' });
  }
});

// Handle other /api requests
app.use('/api', (req, res, next) => {
  // 获取 URL 中的 time 参数
  const timeParam = req.query.time;
  console.log('API request with time parameter:', timeParam);

  // 只处理未被其他路由处理的 /api 请求
  if (
    // req.path !== '/prices' &&
    req.path !== '/config' &&
    req.path !== '/price-history' &&
    req.path !== '/latest-price' &&
    req.path !== '/realtime-price'
  ) {
    const method = req.method;
    const queryParams = req.query;
    const body = req.body;

    return res.json({
      message: 'API request received',
      method,
      queryParams,
      body,
      time: timeParam,
    });
  }
  next();
});

// 新增API端点：获取金价变化历史记录
app.get('/api/price-history', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 200;
    // 修改为从定时任务写入的表中获取金价历史记录
    const history = await getScheduledGoldPriceHistory(limit);
    res.json({ history });
  } catch (error) {
    console.error('获取金价历史记录时出错:', error);
    res.status(500).json({ error: '获取金价历史记录失败' });
  }
});

// Serve static files from the frontend build
const frontendPath = path.join(__dirname, 'static');
app.use('/assets', express.static(path.join(frontendPath, 'assets')));

// Fallback to serve the frontend index.html for any other routes
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// 开启定时任务
startScheduler();

// 优雅地处理进程退出
process.on('SIGINT', () => {
  console.log('接收到 SIGINT，正在关闭服务器...');
  stopScheduler();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('接收到 SIGTERM，正在关闭服务器...');
  stopScheduler();
  process.exit(0);
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
