const request = require('supertest');
const { createApp } = require('../../src/app');
const { articleState, resetArticleState } = require('../../src/state/articleState');
const { ScrapeError } = require('../../src/scraper/wikipediaScraper');

describe('POST /api/ingest', () => {
  const ingestService = { ingest: jest.fn() };

  beforeEach(() => {
    resetArticleState();
    jest.clearAllMocks();
  });

  it('returns 200 with title, summary, and chunkCount on success', async () => {
    ingestService.ingest.mockResolvedValue({
      title: 'Karachi',
      summary: 'Karachi is the largest city in Pakistan.',
      chunkCount: 42,
      collectionName: 'wiki_article_abc123',
    });

    const app = createApp({ ingestService });
    const response = await request(app)
      .post('/api/ingest')
      .send({ url: 'https://en.wikipedia.org/wiki/Karachi' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      title: 'Karachi',
      summary: 'Karachi is the largest city in Pakistan.',
      chunkCount: 42,
    });
    expect(ingestService.ingest).toHaveBeenCalledWith(
      'https://en.wikipedia.org/wiki/Karachi',
    );
    expect(articleState).toMatchObject({
      isIndexed: true,
      title: 'Karachi',
      summary: 'Karachi is the largest city in Pakistan.',
      chunkCount: 42,
      collectionName: 'wiki_article_abc123',
    });
  });

  it('returns 400 for an invalid Wikipedia URL', async () => {
    const app = createApp({ ingestService });
    const response = await request(app)
      .post('/api/ingest')
      .send({ url: 'http://en.wikipedia.org/wiki/Karachi' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'Wikipedia URLs must use HTTPS',
    });
    expect(ingestService.ingest).not.toHaveBeenCalled();
  });

  it('returns 422 when scraping fails', async () => {
    ingestService.ingest.mockRejectedValue(
      new ScrapeError('Wikipedia article not found', { status: 404 }),
    );

    const app = createApp({ ingestService });
    const response = await request(app)
      .post('/api/ingest')
      .send({ url: 'https://en.wikipedia.org/wiki/Missing' });

    expect(response.status).toBe(422);
    expect(response.body).toEqual({ error: 'Wikipedia article not found' });
  });
});
