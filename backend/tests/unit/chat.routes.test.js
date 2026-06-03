const request = require('supertest');
const { createApp } = require('../../src/app');
const { articleState, resetArticleState, setArticleState } = require('../../src/state/articleState');

describe('POST /api/chat', () => {
  const ingestService = { ingest: jest.fn() };
  const ragService = { answer: jest.fn() };

  beforeEach(() => {
    resetArticleState();
    jest.clearAllMocks();
  });

  it('returns 200 with answer and sources when an article is indexed', async () => {
    setArticleState(articleState, {
      title: 'Karachi',
      summary: 'Summary text',
      collectionName: 'wiki_article_test',
      chunkCount: 10,
    });

    ragService.answer.mockResolvedValue({
      answer: 'Karachi was founded in 1729.',
      sources: [
        {
          section: 'History',
          excerpt: 'Founded in 1729.',
          score: 0.9,
        },
      ],
    });

    const app = createApp({ ingestService, ragService });
    const response = await request(app)
      .post('/api/chat')
      .send({ message: 'When was Karachi founded?' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      answer: 'Karachi was founded in 1729.',
      sources: [
        {
          section: 'History',
          excerpt: 'Founded in 1729.',
          score: 0.9,
        },
      ],
    });
    expect(ragService.answer).toHaveBeenCalledWith('When was Karachi founded?');
  });

  it('returns 409 when no article has been ingested', async () => {
    const app = createApp({ ingestService, ragService });
    const response = await request(app)
      .post('/api/chat')
      .send({ message: 'Hello?' });

    expect(response.status).toBe(409);
    expect(response.body).toEqual({ error: 'Ingest an article before chatting' });
    expect(ragService.answer).not.toHaveBeenCalled();
    expect(articleState.isIndexed).toBe(false);
  });
});
