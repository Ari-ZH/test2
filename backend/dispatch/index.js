const ZH_SPT = 'SPT_bWcFeRTxRQ1BTuy1TXz6HoBYHb27';
const MQY_SPT = 'SPT_cIdNUyRrlsCrnWAY9aQPYDu4TJb1';
const BCJ_SPT = 'SPT_jkQuCTQ9qRvsZIqpWJZWSiUSZb7c';
import dayjs from 'dayjs';
export function dispatchNotify(params) {
  // Only send notifications between 9 AM and 9 PM
  const { typeText, realTimeValue, beforeValue, currentValue, updateTime } =
    params;
  const now = new Date();
  // 转换为北京时区 (UTC+8)
  const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
  const beijingTime = new Date(utcTime + 3600000 * 8);
  const beijingHour = beijingTime.getHours();
  if (beijingHour < 9 || beijingHour >= 21) {
    console.log('Notification not sent due to time restrictions.', {
      typeText,
      realTimeValue,
      beforeValue,
      currentValue,
      updateTime,
      beijingDate: dayjs(beijingTime).format('YYYY-MM-DD HH:mm:ss'),
    });
    return Promise.resolve({
      success: false,
      message: 'Outside notification hours (9AM-9PM)',
    });
  }
  const data = {
    content: `
      <div style="font-family: Arial, sans-serif; padding: 10px; color: #333333; background-color: #ffffff;">
        <h2 style="color: #1a73e8; margin-bottom: 12px;">黄金${typeText}价格变动通知</h2>
        <p style="font-size: 16px; margin: 8px 0; color: #555555;">
          更新时间: <span style="color: #4285f4; font-weight: 500;">${updateTime}</span>
        </p>
        <div style="background-color: #f8f9fa; padding: 12px; border-left: 4px solid #fbbc05; margin: 12px 0; border-radius: 4px;">
          <p style="margin: 5px 0; color: #333333;">
            价格变化: <span style="color: #ea4335; font-weight: bold;">${beforeValue}</span> 
            <span style="color: #555555;">→</span> 
            <span style="color: #34a853; font-weight: bold;">${currentValue}</span>
          </p>
          <p style="margin: 8px 0; color: #333333;">
            实时金价: <span style="color: #4285f4; font-weight: bold;">${realTimeValue}</span>
          </p>
        </div>
        <p style="font-size: 14px; margin-top: 15px; color: #555555;">
          查看更多:
        </p>
        <p style="font-size: 14px; margin-top: 5px; color: #555555;">
          <a href="http://ypjgold.cn/show" style="color: #1a73e8; text-decoration: underline; display: block; margin-bottom: 8px;">金价实时查询</a>
          <a href="http://47.115.210.76/" style="color: #1a73e8; text-decoration: underline; display: block;">当前报价</a>
        </p>
      </div>
    `,
    sptList: [ZH_SPT, BCJ_SPT],
    // sptList: [ZH_SPT],
    contentType: '2',
    summary: `${typeText}${beforeValue}=>${currentValue}，实时${realTimeValue}`,
  };
  return fetch('https://wxpusher.zjiecode.com/api/send/message/simple-push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}

export function dispatchCurrentPriceNotify(params) {
  // Only send notifications between 9 AM and 9 PM
  const { sellPrice, buyBackPrice, updateTime } = params;
  const now = new Date();
  // 转换为北京时区 (UTC+8)
  const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
  const beijingTime = new Date(utcTime + 3600000 * 8);
  const beijingHour = beijingTime.getHours();
  if (beijingHour < 9 || beijingHour >= 21) {
    console.log('Notification not sent due to time restrictions.', {
      sellPrice,
      buyBackPrice,
      updateTime,
      beijingDate: dayjs(beijingTime).format('YYYY-MM-DD HH:mm:ss'),
    });
    return Promise.resolve({
      success: false,
      message: 'Outside notification hours (9AM-9PM)',
    });
  }

  const data = {
    content: `
      <div style="font-family: Arial, sans-serif; padding: 10px; color: #333333; background-color: #ffffff;">
        <h2 style="color: #1a73e8; margin-bottom: 12px;">早9点 黄金价格通知</h2>
        <p style="font-size: 16px; margin: 8px 0; color: #555555;">
          更新时间: <span style="color: #4285f4; font-weight: 500;">${updateTime}</span>
        </p>
        <div style="background-color: #f8f9fa; padding: 12px; border-left: 4px solid #fbbc05; margin: 12px 0; border-radius: 4px;">
          <p style="margin: 5px 0; color: #333333;">
            售卖价格: <span style="color: #34a853; font-weight: bold;">${sellPrice}</span>
          </p>
          <p style="margin: 5px 0; color: #333333;">
            回收价格: <span style="color: #ea4335; font-weight: bold;">${buyBackPrice}</span>
          </p>
          <p style="margin: 8px 0; color: #333333;">
            差价: <span style="color: #4285f4; font-weight: bold;">${(
              sellPrice - buyBackPrice
            ).toFixed(2)}</span>
          </p>
        </div>
         <p style="font-size: 14px; margin-top: 15px; color: #555555;">
          查看更多:
        </p>
        <p style="font-size: 14px; margin-top: 5px; color: #555555;">
          <a href="http://ypjgold.cn/show" style="color: #1a73e8; text-decoration: underline; display: block; margin-bottom: 8px;">金价实时查询</a>
          <a href="http://47.115.210.76/" style="color: #1a73e8; text-decoration: underline; display: block;">当前报价</a>
        </p>
      </div>
    `,
    sptList: [ZH_SPT, BCJ_SPT, MQY_SPT],
    contentType: '2',
    summary: `当前：售卖${sellPrice}，回收${buyBackPrice}`,
  };

  return fetch('https://wxpusher.zjiecode.com/api/send/message/simple-push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}
