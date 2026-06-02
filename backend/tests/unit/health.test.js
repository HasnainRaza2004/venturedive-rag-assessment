const request = require('supertest');
const { createApp } = require('../../src/app');

describe('GET /api/health', () => {
  it('returns 200 with status and downstream service flags', async () => {
    const app = createApp();

    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      status: 'ok',
      ollama: expect.any(String),
      chroma: expect.any(String),
    });
  });
});
