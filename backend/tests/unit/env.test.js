const { loadEnv } = require('../../src/config/env');

describe('loadEnv', () => {
  it('applies default PORT=4000 when PORT is unset', () => {
    const env = loadEnv({});

    expect(env.PORT).toBe(4000);
  });

  it('exports OLLAMA_BASE_URL and CHROMA_URL with defaults', () => {
    const env = loadEnv({});

    expect(env.OLLAMA_BASE_URL).toBe('http://localhost:11434');
    expect(env.CHROMA_URL).toBe('http://localhost:8000');
  });

  it('uses provided values when environment variables are set', () => {
    const env = loadEnv({
      PORT: '5000',
      OLLAMA_BASE_URL: 'http://ollama:11434',
      CHROMA_URL: 'http://chroma:8000',
      OLLAMA_MODEL: 'llama3.2:3b',
      NODE_ENV: 'test',
      CHUNK_SIZE_CHARS: '800',
      CHUNK_OVERLAP_CHARS: '120',
    });

    expect(env.PORT).toBe(5000);
    expect(env.OLLAMA_BASE_URL).toBe('http://ollama:11434');
    expect(env.CHROMA_URL).toBe('http://chroma:8000');
    expect(env.OLLAMA_MODEL).toBe('llama3.2:3b');
    expect(env.NODE_ENV).toBe('test');
    expect(env.CHUNK_SIZE_CHARS).toBe(800);
    expect(env.CHUNK_OVERLAP_CHARS).toBe(120);
  });

  it('parses numeric configuration with defaults', () => {
    const env = loadEnv({});

    expect(env.CHUNK_SIZE_CHARS).toBe(600);
    expect(env.CHUNK_OVERLAP_CHARS).toBe(100);
    expect(env.RAG_TOP_K).toBe(8);
    expect(env.RAG_MIN_SCORE).toBe(0.3);
    expect(env.HTTP_TIMEOUT_MS).toBe(15000);
  });

  it('throws when PORT is not a positive integer', () => {
    expect(() => loadEnv({ PORT: 'not-a-port' })).toThrow(
      'PORT must be a positive integer',
    );
  });

  it('throws when a URL variable is invalid', () => {
    expect(() => loadEnv({ OLLAMA_BASE_URL: 'not-a-url' })).toThrow(
      'OLLAMA_BASE_URL must be a valid URL',
    );
  });

  it('falls back to defaults when a string env var is empty', () => {
    const env = loadEnv({ NODE_ENV: '' });

    expect(env.NODE_ENV).toBe('development');
  });

  it('trims whitespace from string env vars', () => {
    const env = loadEnv({ NODE_ENV: '  production  ' });

    expect(env.NODE_ENV).toBe('production');
  });

  it('throws when LLM_TEMPERATURE is negative', () => {
    expect(() => loadEnv({ LLM_TEMPERATURE: '-0.5' })).toThrow(
      'LLM_TEMPERATURE must be a non-negative number',
    );
  });

  it('throws when a URL uses a non-http(s) protocol', () => {
    expect(() => loadEnv({ CHROMA_URL: 'ftp://chroma:8000' })).toThrow(
      'CHROMA_URL must be a valid URL',
    );
  });
});
