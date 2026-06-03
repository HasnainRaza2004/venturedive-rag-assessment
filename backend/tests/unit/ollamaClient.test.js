const nock = require('nock');
const axios = require('axios');
const {
  createOllamaClient,
  OllamaClientError,
} = require('../../src/clients/ollamaClient');

const OLLAMA_BASE_URL = 'http://ollama.test';

function createTestClient(overrides = {}) {
  return createOllamaClient({
    baseUrl: OLLAMA_BASE_URL,
    model: 'llama3.2:3b',
    embeddingModel: 'nomic-embed-text',
    embedBatchSize: 2,
    timeoutMs: 5000,
    ...overrides,
  });
}

describe('createOllamaClient', () => {
  afterEach(() => {
    nock.cleanAll();
  });

  describe('summarize', () => {
    it('calls /api/generate and returns the response text', async () => {
      nock(OLLAMA_BASE_URL)
        .post('/api/generate', (body) => {
          expect(body.model).toBe('llama3.2:3b');
          expect(body.stream).toBe(false);
          expect(body.prompt).toContain('Output ONLY the summary text');
          expect(body.prompt).toContain('Article body here.');
          return true;
        })
        .reply(200, { response: '  Short summary.  ' });

      const client = createTestClient();
      const summary = await client.summarize('Article body here.');

      expect(summary).toBe('Short summary.');
      expect(nock.isDone()).toBe(true);
    });
  });

  describe('embed', () => {
    it('batches embedding requests according to embedBatchSize', async () => {
      const scope = nock(OLLAMA_BASE_URL)
        .post('/api/embed', (body) => {
          expect(body.model).toBe('nomic-embed-text');
          expect(body.input).toEqual(['one', 'two']);
          return true;
        })
        .reply(200, { embeddings: [[0.1, 0.2], [0.3, 0.4]] })
        .post('/api/embed', (body) => {
          expect(body.input).toEqual(['three']);
          return true;
        })
        .reply(200, { embeddings: [[0.5, 0.6]] });

      const client = createTestClient({ embedBatchSize: 2 });
      const vectors = await client.embed(['one', 'two', 'three']);

      expect(vectors).toEqual([
        [0.1, 0.2],
        [0.3, 0.4],
        [0.5, 0.6],
      ]);
      expect(scope.isDone()).toBe(true);
    });

    it('returns an empty array when no texts are provided', async () => {
      const client = createTestClient();
      await expect(client.embed([])).resolves.toEqual([]);
    });
  });

  describe('answer', () => {
    it('calls /api/chat and returns assistant message content', async () => {
      nock(OLLAMA_BASE_URL)
        .post('/api/chat', (body) => {
          expect(body.model).toBe('llama3.2:3b');
          expect(body.stream).toBe(false);
          expect(body.messages).toEqual([
            { role: 'user', content: 'Answer this question.' },
          ]);
          expect(body.options.temperature).toBe(0.1);
          return true;
        })
        .reply(200, {
          message: { role: 'assistant', content: '  Grounded answer.  ' },
        });

      const client = createTestClient();
      const answer = await client.answer('Answer this question.', {
        temperature: 0.1,
      });

      expect(answer).toBe('Grounded answer.');
    });
  });

  describe('error handling', () => {
    it('throws OllamaClientError on 5xx responses', async () => {
      nock(OLLAMA_BASE_URL).post('/api/generate').reply(500, { error: 'boom' });

      const client = createTestClient();

      await expect(client.summarize('text')).rejects.toMatchObject({
        name: 'OllamaClientError',
        message: 'Ollama request failed with status 500',
        status: 500,
      });
    });

    it('throws OllamaClientError on request timeout', async () => {
      nock(OLLAMA_BASE_URL)
        .post('/api/generate')
        .delayConnection(200)
        .reply(200, { response: 'late' });

      const client = createTestClient({ timeoutMs: 50 });

      await expect(client.summarize('text')).rejects.toMatchObject({
        name: 'OllamaClientError',
        message: 'Ollama request timed out',
      });
    });

    it('throws OllamaClientError when response shape is invalid', async () => {
      nock(OLLAMA_BASE_URL).post('/api/generate').reply(200, { unexpected: true });

      const client = createTestClient();

      await expect(client.summarize('text')).rejects.toMatchObject({
        name: 'OllamaClientError',
        message: 'Invalid Ollama generate response',
      });
    });

    it('throws OllamaClientError when embed response shape is invalid', async () => {
      nock(OLLAMA_BASE_URL).post('/api/embed').reply(200, { embeddings: 'bad' });

      const client = createTestClient();

      await expect(client.embed(['one'])).rejects.toMatchObject({
        name: 'OllamaClientError',
        message: 'Invalid Ollama embed response',
      });
    });
  });
});

describe('OllamaClientError', () => {
  it('is an Error subclass', () => {
    const error = new OllamaClientError('failed', { status: 502 });
    expect(error).toBeInstanceOf(Error);
    expect(error.status).toBe(502);
  });
});
