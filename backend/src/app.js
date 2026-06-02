const express = require('express');
const healthRouter = require('./routes/health');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/health', healthRouter);
  return app;
}

module.exports = { createApp };
