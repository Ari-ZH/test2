import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  getLatestConfig,
  saveConfig,
  getLatestGoldPrice,
  saveGoldPriceChange,
  getGoldPriceHistory,
} from './utils/db.js';
import { transformMetalData } from './utils/index.js';

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

// API endpoint for metal prices
app.get('/api/prices', async (req, res) => {
  try {
    // 获取 URL 中的 time 参数
    const timeParam = req.query.time;
    const showOrigin = req.query.origin;
    console.log('Received time parameter:', timeParam);
    console.log('Received origin parameter:', showOrigin);

    // 获取最新配置
    const config = await getLatestConfig();
    const responseData = await fetch(
      `http://ypjgold.cn/price/data?time=${timeParam}`,
      {
        headers: {
          accept: '*/*',
          'accept-language': 'zh-CN,zh;q=0.9',
          'cache-control': 'no-cache',
          pragma: 'no-cache',
          'x-requested-with': 'XMLHttpRequest',
          // cookie:
          //   'Hm_lvt_00907a92664191457ef765fb6dac29a8=1745652125; Hm_lpvt_00907a92664191457ef765fb6dac29a8=1745652125; HMACCOUNT=BECA5EAE452C8581',
          Referer: 'http://ypjgold.cn/',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
        },
        body: null,
        method: 'GET',
      }
    ).then((response) => response.json());
    // 模拟的原始数据 (实际环境中这里可能来自其他 API 或数据库)
    // const rawData = [
    //   {
    //     type: '1_au_1',
    //     name: '黄金',
    //     buyPrice: '729.00',
    //     salePrice: '821.00',
    //     minPrice: '789.30',
    //     maxPrice: '790.00',
    //     openPrice: null,
    //     closePrice: null,
    //     time: '2025-04-26 15:24:12',
    //     allowDeal: false,
    //     selling: true,
    //     sort: 1,
    //     rate: '1.0000',
    //   },
    // ];
    const rawData = responseData.data;

    // 转换数据为 pricesData 格式
    const pricesData = transformMetalData(rawData, config);

    // 获取黄金价格数据
    const goldData = pricesData.find((item) => item.type === '黄金');

    if (goldData) {
      // 获取最新一次记录的金价
      const latestGoldPrice = await getLatestGoldPrice();

      // 当前金价
      const currentSellPrice = parseFloat(goldData.sellPrice);
      const currentRecyclePrice = parseFloat(goldData.recyclePrice);

      // 检查金价是否变化
      let priceChanged = false;

      if (!latestGoldPrice) {
        // 如果没有历史记录，则创建第一条记录
        priceChanged = true;
      } else {
        // 比较当前价格和历史价格
        const lastSellPrice = parseFloat(latestGoldPrice.sellPrice);
        const lastRecyclePrice = parseFloat(latestGoldPrice.recyclePrice);

        // 如果卖出价格或回收价格有变化，则记录新的金价
        if (
          currentSellPrice !== lastSellPrice ||
          currentRecyclePrice !== lastRecyclePrice
        ) {
          priceChanged = true;
        }
      }

      // 如果价格变化，保存新的金价记录
      const goldItem = pricesData.find((item) => item.type === '黄金');
      if (priceChanged) {
        const priceRecord = {
          sellPrice: currentSellPrice,
          recyclePrice: currentRecyclePrice,
          changeTime: goldItem.updateTime,
        };
        await saveGoldPriceChange(priceRecord);
        console.log('金价变化已记录:', priceRecord);
      } else {
        const latestGoldPriceHistory = await getGoldPriceHistory(1);
        goldItem.updateTime = latestGoldPriceHistory[0].changeTime; // 将记录添加到返回数据中
        console.log('金价未变化，无需记录');
      }
    }

    if (showOrigin) {
      res.json({
        priceList: pricesData,
        originList: rawData.filter((item) => item.name === '黄金'),
      });
    } else {
      res.json({ priceList: pricesData, originList: null });
    }
  } catch (error) {
    console.error('获取价格数据时出错:', error);
    res.status(500).json({ error: '获取价格数据失败' });
  }
});

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

// Handle other /api requests
app.use('/api', (req, res, next) => {
  // 获取 URL 中的 time 参数
  const timeParam = req.query.time;
  console.log('API request with time parameter:', timeParam);

  // 只处理未被其他路由处理的 /api 请求
  if (
    req.path !== '/prices' &&
    req.path !== '/config' &&
    req.path !== '/price-history'
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
    const history = await getGoldPriceHistory(limit);
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

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
