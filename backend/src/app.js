const cors = require('cors');
const express = require('express');
const { ollamaClient } = require('./clients/ollamaClient');
const { chromaClient } = require('./clients/chromaClient');
const { createIngestService } = require('./services/ingestService');
const { createRagService } = require('./services/ragService');
const { errorHandler } = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/requestLogger');
const { articleState } = require('./state/articleState');
const healthRouter = require('./routes/health');
const { createIngestRouter } = require('./routes/ingest');
const { createChatRouter } = require('./routes/chat');

function createDefaultIngestService() {
  return createIngestService({
    llmClient: ollamaClient,
    embedder: ollamaClient,
    vectorStore: chromaClient,
  });
}

function createDefaultRagService(state) {
  return createRagService({
    embedder: ollamaClient,
    vectorStore: chromaClient,
    llmClient: ollamaClient,
    getCollectionName: () => state.collectionName,
  });
}

function createApp(deps = {}) {
  const state = deps.articleState ?? articleState;
  const ingestService = deps.ingestService ?? createDefaultIngestService();
  const ragService =
    deps.ragService ??
    createDefaultRagService(state);

  const app = express();
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
    }),
  );
  app.use(express.json());

  if (process.env.NODE_ENV !== 'production') {
    app.use(requestLogger);
  }

  app.use('/api/health', healthRouter);
  app.use(
    '/api/ingest',
    createIngestRouter({ ingestService, articleState: state }),
  );
  app.use('/api/chat', createChatRouter({ ragService, articleState: state }));

  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
