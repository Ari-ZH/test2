import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 数据库文件路径
const dbPath = path.join(__dirname, '../config.db');

// 创建数据库连接
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('数据库连接失败:', err.message);
  } else {
    console.log('已成功连接到 SQLite 数据库');
    initDatabase();
  }
});

// 初始化数据库表结构
function initDatabase() {
  // 创建金属配置表
  db.run(
    `
    CREATE TABLE IF NOT EXISTS metal_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      minUp REAL NOT NULL,
      minDown REAL NOT NULL,
      silverRecyclePrice REAL NOT NULL,
      silverSellPrice REAL NOT NULL,
      platinumRecyclePrice REAL NOT NULL DEFAULT 0,
      platinumSellPrice REAL NOT NULL DEFAULT 0,
      porpeziteRecyclePrice REAL NOT NULL DEFAULT 0,
      porpeziteSellPrice REAL NOT NULL DEFAULT 0,
      updateTime TEXT NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `,
    (err) => {
      if (err) {
        console.error('创建配置表失败:', err.message);
      } else {
        console.log('配置表已创建或已存在');
        // 检查是否有初始数据
        checkAndInsertDefaultConfig();
      }
    }
  );
  
  // 创建金价变化记录表
  db.run(
    `
    CREATE TABLE IF NOT EXISTS gold_price_changes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sellPrice REAL NOT NULL,
      recyclePrice REAL NOT NULL,
      changeTime TEXT NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `,
    (err) => {
      if (err) {
        console.error('创建金价变化记录表失败:', err.message);
      } else {
        console.log('金价变化记录表已创建或已存在');
      }
    }
  );
  
  // 创建定时任务金价记录表 - 新表，不影响原有表
  db.run(
    `
    CREATE TABLE IF NOT EXISTS scheduled_gold_prices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sellPrice REAL NOT NULL,
      recyclePrice REAL NOT NULL,
      rawSellPrice REAL NOT NULL,
      rawRecyclePrice REAL NOT NULL,
      prevSellPrice REAL,
      prevRecyclePrice REAL,
      changeTime TEXT NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `,
    (err) => {
      if (err) {
        console.error('创建定时任务金价记录表失败:', err.message);
      } else {
        console.log('定时任务金价记录表已创建或已存在');
      }
    }
  );
}

// 检查是否有默认配置，如果没有则插入
function checkAndInsertDefaultConfig() {
  db.get('SELECT COUNT(*) as count FROM metal_config', (err, row) => {
    if (err) {
      console.error('查询配置数据失败:', err.message);
      return;
    }

    if (row.count === 0) {
      // 插入默认配置
      const defaultConfig = {
        minUp: 10.0,
        minDown: 10.0,
        silverRecyclePrice: 5.0,
        silverSellPrice: 6.0,
        platinumRecyclePrice: 230.0,
        platinumSellPrice: 260.0,
        porpeziteRecyclePrice: 290.0,
        porpeziteSellPrice: 320.0,
        updateTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
      };

      db.run(
        `INSERT INTO metal_config (minUp, minDown, silverRecyclePrice, silverSellPrice, platinumRecyclePrice, platinumSellPrice, porpeziteRecyclePrice, porpeziteSellPrice, updateTime) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          defaultConfig.minUp,
          defaultConfig.minDown,
          defaultConfig.silverRecyclePrice,
          defaultConfig.silverSellPrice,
          defaultConfig.platinumRecyclePrice,
          defaultConfig.platinumSellPrice,
          defaultConfig.porpeziteRecyclePrice,
          defaultConfig.porpeziteSellPrice,
          defaultConfig.updateTime,
        ],
        function (err) {
          if (err) {
            console.error('插入默认配置失败:', err.message);
          } else {
            console.log('已插入默认配置，ID:', this.lastID);
          }
        }
      );
    } else {
      console.log('配置表中已有数据，无需插入默认配置');
    }
  });
}

// 获取最新配置
function getLatestConfig() {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM metal_config ORDER BY id DESC LIMIT 1',
      (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(
            row || {
              minUp: 1.0,
              minDown: 1.0,
              silverRecyclePrice: 5.0,
              silverSellPrice: 6.0,
              platinumRecyclePrice: 230.0,
              platinumSellPrice: 260.0,
              porpeziteRecyclePrice: 290.0,
              porpeziteSellPrice: 320.0,
              updateTime: new Date()
                .toISOString()
                .replace('T', ' ')
                .substring(0, 19),
            }
          );
        }
      }
    );
  });
}

// 保存新配置
function saveConfig(config) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO metal_config (minUp, minDown, silverRecyclePrice, silverSellPrice, platinumRecyclePrice, platinumSellPrice, porpeziteRecyclePrice, porpeziteSellPrice, updateTime) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        config.minUp,
        config.minDown,
        config.silverRecyclePrice,
        config.silverSellPrice,
        config.platinumRecyclePrice || 0,
        config.platinumSellPrice || 0,
        config.porpeziteRecyclePrice || 0,
        config.porpeziteSellPrice || 0,
        config.updateTime,
      ],
      function (err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, ...config });
        }
      }
    );
  });
}

// 获取最新的金价记录
function getLatestGoldPrice() {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM gold_price_changes ORDER BY id DESC LIMIT 1',
      (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row || null);
        }
      }
    );
  });
}

// 保存新的金价记录
function saveGoldPriceChange(priceData) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO gold_price_changes (sellPrice, recyclePrice, changeTime) 
       VALUES (?, ?, ?)`,
      [
        priceData.sellPrice,
        priceData.recyclePrice,
        priceData.changeTime,
      ],
      function (err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, ...priceData });
        }
      }
    );
  });
}

// 获取金价变化历史记录
function getGoldPriceHistory(limit = 100) {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM gold_price_changes ORDER BY id DESC LIMIT ?',
      [limit],
      (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      }
    );
  });
}

// 获取最新的定时任务金价记录
function getLatestScheduledGoldPrice() {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM scheduled_gold_prices ORDER BY id DESC LIMIT 1',
      (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row || null);
        }
      }
    );
  });
}

// 保存新的定时任务金价记录
function saveScheduledGoldPrice(priceData) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO scheduled_gold_prices (sellPrice, recyclePrice, rawSellPrice, rawRecyclePrice, prevSellPrice, prevRecyclePrice, changeTime) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        priceData.sellPrice,
        priceData.recyclePrice,
        priceData.rawSellPrice,
        priceData.rawRecyclePrice,
        priceData.prevSellPrice,
        priceData.prevRecyclePrice,
        priceData.changeTime,
      ],
      function (err) {
        if (err) {
          console.error('插入数据失败:', err);
          return reject(err);
        }
        // 插入成功后立即 resolve
        resolve({ id: this.lastID, ...priceData });

        // 异步检查并清理过期数据
        db.get(`SELECT COUNT(*) as count FROM scheduled_gold_prices`, [], (err, row) => {
          if (err) {
            console.error('查询总数失败:', err);
            // 不需要 reject，因为已经 resolve 了
            return;
          }

          const total = row.count;

          if (total > 5000) {
            console.log(`数据超出5000条，当前总共${total}条，执行清空到3000条操作`);
            // id 倒序 保留最新值
            db.run(
              `DELETE FROM scheduled_gold_prices
               WHERE id NOT IN (
                 SELECT id FROM scheduled_gold_prices
                 ORDER BY id DESC
                 LIMIT 3000
               )`,
              (err) => {
                if (err) {
                  console.error("删除旧数据失败:", err);
                  // 同样，这里不需要处理错误，因为 promise 已经 resolve
                }
              }
            );
          }
        });
      }
    );
  });
}

// 获取定时任务金价历史记录
function getScheduledGoldPriceHistory(limit = 100) {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM scheduled_gold_prices ORDER BY id DESC LIMIT ?',
      [limit],
      (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      }
    );
  });
}


function insertDummyData(db, count) {
  return new Promise((resolve, reject) => {
    let inserted = 0;
    function insertNext() {
      if (inserted >= count) return resolve();

      const priceData = {
        sellPrice: Math.random() * 100,
        recyclePrice: Math.random() * 80,
        rawSellPrice: Math.random() * 90,
        rawRecyclePrice: Math.random() * 70,
        prevSellPrice: Math.random() * 60,
        prevRecyclePrice: Math.random() * 50,
        changeTime: new Date().toISOString(),
      };
      saveScheduledGoldPrice(priceData).then(() => {
        inserted++;
        insertNext();
      }).catch(reject);
    }

    insertNext();
  });
}


export { 
  db, 
  getLatestConfig, 
  saveConfig, 
  getLatestGoldPrice, 
  saveGoldPriceChange, 
  getGoldPriceHistory,
  getLatestScheduledGoldPrice,
  saveScheduledGoldPrice,
  getScheduledGoldPriceHistory
};
