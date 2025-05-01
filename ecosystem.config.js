module.exports = {
  apps: [
    {
      name: 'fetcher',
      script: './backend/index.js',
      // 其他配置项...
      output: 'logs/output.log',
      error: 'logs/error.log',
      time: true, // 添加这一行来启用日志时间戳
      env: {
        PORT: '3000',
        // 其他环境变量...
      },
    },
  ],
};
