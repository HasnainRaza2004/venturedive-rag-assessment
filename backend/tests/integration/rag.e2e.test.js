/**
 * @integration — wired stack: Express + real Ollama + real Chroma.
 * Wikipedia HTTP is mocked (nock) for speed and stability.
 *
 * Prerequisites:
 *   docker compose up -d ollama chroma
 *   cd backend && npm run test:integration
 */

process.env.CHROMA_COLLECTION_PREFIX = 'wiki_integration_e2e';
process.env.SUMMARIZE_MAX_CHARS = '4000';

const nock = require('nock');
const request = require('supertest');
const { MODERN_WIKI_ARTICLE_HTML } = require('../fixtures/wiki.fixture');
const { integrationServicesReady } = require('./helpers/services');
const { createApp } = require('../../src/app');
const { articleState, resetArticleState } = require('../../src/state/articleState');
const { chromaClient } = require('../../src/clients/chromaClient');
const { buildCollectionName } = require('../../src/services/ingestService');

const WIKI_URL = 'https://en.wikipedia.org/wiki/VentureDive_Integration_Test';
const WIKI_HOST = 'https://en.wikipedia.org';

jest.setTimeout(300_000);

describe('RAG stack E2E @integration', () => {
  let servicesUp = false;
  let collectionName = null;

  beforeAll(async () => {
    const status = await integrationServicesReady();
    servicesUp = status.ready;

    if (!servicesUp) {
      console.warn(
        '[integration] Skipping: Ollama=%s Chroma=%s. Run: docker compose up -d ollama chroma',
        status.ollama,
        status.chroma,
      );
    }
  });

  beforeEach(() => {
    resetArticleState();
    nock.cleanAll();
    nock(WIKI_HOST)
      .get('/wiki/VentureDive_Integration_Test')
      .reply(200, MODERN_WIKI_ARTICLE_HTML);
  });

  afterEach(() => {
    nock.cleanAll();
  });

  afterAll(async () => {
    if (collectionName) {
      await chromaClient.resetCollection(collectionName);
    }
  });

  it('ingests fixture article then answers from retrieved chunks', async () => {
    if (!servicesUp) {
      throw new Error(
        'Integration services unavailable. Start Ollama + Chroma: docker compose up -d ollama chroma',
      );
    }

    const app = createApp();
    collectionName = buildCollectionName(WIKI_URL, 'wiki_integration_e2e');

    const ingestResponse = await request(app)
      .post('/api/ingest')
      .send({ url: WIKI_URL });

    expect(ingestResponse.status).toBe(200);
    expect(ingestResponse.body.title).toBe('Modern Wikipedia Layout');
    expect(ingestResponse.body.summary).toEqual(expect.any(String));
    expect(ingestResponse.body.summary.length).toBeGreaterThan(10);
    expect(ingestResponse.body.chunkCount).toBeGreaterThan(0);
    expect(articleState.isIndexed).toBe(true);
    expect(articleState.collectionName).toBe(collectionName);

    const chatResponse = await request(app)
      .post('/api/chat')
      .send({ message: 'When did the project begin?' });

    expect(chatResponse.status).toBe(200);
    expect(chatResponse.body.answer).toEqual(expect.any(String));
    expect(chatResponse.body.answer.length).toBeGreaterThan(0);
    expect(chatResponse.body.sources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          section: expect.any(String),
          excerpt: expect.any(String),
          score: expect.any(Number),
        }),
      ]),
    );
    chatResponse.body.sources.forEach((source) => {
      expect(source.score).toBeGreaterThanOrEqual(0.1);
    });

    expect(chatResponse.body.answer).not.toMatch(
      /could not find that information/i,
    );

    const sourceText = chatResponse.body.sources
      .map((source) => source.excerpt)
      .join(' ')
      .toLowerCase();
    expect(sourceText).toMatch(/2024|rag|history/);
  });

  it('returns 409 for chat before ingest', async () => {
    if (!servicesUp) {
      throw new Error(
        'Integration services unavailable. Start Ollama + Chroma: docker compose up -d ollama chroma',
      );
    }

    const app = createApp();
    const response = await request(app)
      .post('/api/chat')
      .send({ message: 'Hello?' });

    expect(response.status).toBe(409);
    expect(response.body.error).toMatch(/ingest/i);
  });
});
