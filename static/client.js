function setValueById(id, value) {
  let element = document.getElementById(id);
  if (!element) {
    element = document.createElement('div');
    element.id = id;
    document.body.appendChild(element);
  }
  element.innerHTML = value;
}
function setAppChildValueById(value, childId) {
  let element = document.getElementById('app');
  let childElement = element.querySelector(`#${childId}`);
  if (!childElement) {
    childElement = document.createElement('div');
    childElement.id = childId;
    element.appendChild(childElement);
  }
  childElement.innerHTML = value;
}

let timer = null;
let errorCount = 0;
let beforeSalePrice = 0;
let currentSalePrice = 0;

function fetchGoldSalePrice() {
  return fetch('/api/getPrice')
    .then((response) => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then((data) => {
      console.log('Gold Sale Price:', data);
      if (data.data && data.data.length > 0) {
        const goldItem = data.data.find((item) => item.name === '黄金');
        if (!goldItem) {
          throw new Error('Gold item not found in data');
        }
        const salePrice = goldItem.salePrice;
        errorCount = 0; // Reset error count on success
        return salePrice;
      } else {
        throw new Error('Invalid data format');
      }
    })
    .catch((error) => {
      console.error('Error fetching gold sale price:', error);
      errorCount++;
      if (errorCount >= 3) {
        console.error('Stopping polling due to consecutive errors.');
        clearInterval(timer);
      }
    });
}

function updateOriginSalePrice(
  updateBeforeSalePrice = true,
  showOriginValue = true
) {
  fetchGoldSalePrice().then((salePrice) => {
    const originSalePrice = salePrice;
    const curPrice = Math.ceil(originSalePrice / 5) * 5 + 10;
    if (beforeSalePrice === 0) {
      beforeSalePrice = curPrice;
      setAppChildValueById(
        `Before Gold Sale Price: ${beforeSalePrice}`,
        'beforeSalePrice'
      );
    }
    // 发生变价, 替换当前展示价格到上次价格
    if (curPrice !== currentSalePrice && beforeSalePrice !== currentSalePrice) {
      beforeSalePrice = currentSalePrice;
      currentSalePrice = curPrice;
      setAppChildValueById(
        `Current Gold Sale Price: ${currentSalePrice}`,
        'currentSalePrice'
      );
      if (updateBeforeSalePrice) {
        setAppChildValueById(
          `Before Gold Sale Price: ${beforeSalePrice}`,
          'beforeSalePrice'
        );
      }
      // 设置变更价格时间
      const changeTime = new Date();
      const formattedTime = `${changeTime.getFullYear()}-${String(
        changeTime.getMonth() + 1
      ).padStart(2, '0')}-${String(changeTime.getDate()).padStart(
        2,
        '0'
      )} ${String(changeTime.getHours()).padStart(2, '0')}:${String(
        changeTime.getMinutes()
      ).padStart(2, '0')}`;
      setAppChildValueById(`Change Time: ${formattedTime}`, 'changeTime');
    }
    // 更新当前展示价格
    // 设置展示
    if (showOriginValue) {
      setAppChildValueById(
        `Origin Gold Sale Price: ${originSalePrice}`,
        'originSalePrice'
      );
    }
  });
}

document.addEventListener('DOMContentLoaded', function () {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('ypj')) {
    // const iframe = document.createElement('iframe');
    // iframe.src = '/iframe'; // Replace with the desired iframe source URL
    // iframe.style.width = '300px';
    // iframe.style.height = '500px';
    // document.body.appendChild(iframe);
    setValueById(
      'data source',
      `Data Source: <a href="http://ypjgold.cn/show">http://ypjgold.cn/show</a>`
    );
  }

  const showOriginValue = urlParams.has('showOriginValue');

  function scheduleNextFetch() {
    const delay = Math.random() * (8000 - 2000) + 2000; // Random delay between 2s and 8s
    timer = setTimeout(() => {
      updateOriginSalePrice(true, showOriginValue);
      scheduleNextFetch(); // Schedule the next fetch
    }, delay);
  }
  updateOriginSalePrice(false, showOriginValue);
  scheduleNextFetch(); // Start the first fetch
});
