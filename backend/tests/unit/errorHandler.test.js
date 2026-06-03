const { errorHandler } = require('../../src/middleware/errorHandler');
const { ScrapeError } = require('../../src/scraper/wikipediaScraper');
const { OllamaClientError } = require('../../src/clients/ollamaClient');

describe('errorHandler', () => {
  function createResponse() {
    const res = {
      headersSent: false,
      statusCode: 200,
      body: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.body = payload;
        return this;
      },
    };
    return res;
  }

  it('returns a consistent JSON shape for validation errors', () => {
    const res = createResponse();
    errorHandler(new Error('Invalid Wikipedia URL'), {}, res, jest.fn());

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid Wikipedia URL' });
  });

  it('maps ScrapeError to 422', () => {
    const res = createResponse();
    errorHandler(new ScrapeError('Wikipedia article not found'), {}, res, jest.fn());

    expect(res.statusCode).toBe(422);
    expect(res.body).toEqual({ error: 'Wikipedia article not found' });
  });

  it('maps OllamaClientError to 502', () => {
    const res = createResponse();
    errorHandler(new OllamaClientError('Ollama request timed out'), {}, res, jest.fn());

    expect(res.statusCode).toBe(502);
    expect(res.body).toEqual({ error: 'Ollama request timed out' });
  });
});
