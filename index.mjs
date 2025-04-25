import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const server = http.createServer((req, res) => {
  if (req.url.startsWith('/api')) {
    return handleAPIRequest(req, res);
  }
  if (req.url.startsWith('/static')) {
    return handleStaticFileRequest(req, res);
  }
  if (req.url.startsWith('/iframe')) {
    return handleIframeRequest(req, res);
  }
  // Handle other requests
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.write(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Server Response</title>
      <script src="static/client.js" defer></script>
      </head>
    <body>
      <div id="app">
        <div id="currentSalePrice"></div>
        <div id="originSalePrice"></div>
        <div id="beforeSalePrice"></div>
        <div id="changeTime"></div>
      </div>
    </body>
    </html>
  `);
  res.end();
});

function handleAPIRequest(req, res) {
  if (req.url === '/api/getPrice') {
    const urlParams = new URLSearchParams(req.url.split('?')[1]);
    const timeParam = urlParams.get('time') || Date.now();
    fetch(`http://ypjgold.cn/price/data?time=${timeParam}`, {
      headers: {
        accept: '*/*',
        'accept-language': 'zh-CN,zh;q=0.9',
        'cache-control': 'no-cache',
        pragma: 'no-cache',
        'x-requested-with': 'XMLHttpRequest',
      },
      referrer: 'http://ypjgold.cn/show',
      referrerPolicy: 'strict-origin-when-cross-origin',
      body: null,
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
    })
      .then((response) => response.json())
      .then((data) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
      })
      .catch((err) => {
        console.error('request error', err);
        console.error(err);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error fetching data');
      });
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end(`${req.url} Not Found`);
  }
}

function handleStaticFileRequest(req, res) {
  const filePath = path.join(process.cwd(), req.url);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Static file not found');
    } else {
      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
      };
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    }
  });
}

function handleIframeRequest(req, res) {
  return fetch('http://ypjgold.cn/show')
    .then((response) => response.text())
    .then((html) => {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.write(html);
      res.end();
    })
    .catch((err) => {
      console.error('Error fetching iframe content:', err);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error fetching iframe content');
    });
}

server.listen(6173, () => {
  console.log('Server is listening on port 6173');
});
