const DEFAULTS = {
  NODE_ENV: 'development',
  PORT: '4000',
  OLLAMA_BASE_URL: 'http://localhost:11434',
  OLLAMA_MODEL: 'llama3.2:3b',
  EMBEDDING_MODEL: 'nomic-embed-text',
  CHROMA_URL: 'http://localhost:8000',
  CHROMA_COLLECTION_PREFIX: 'wiki_article',
  CHUNK_SIZE_CHARS: '600',
  CHUNK_OVERLAP_CHARS: '100',
  RAG_TOP_K: '8',
  RAG_MIN_SCORE: '0.1',
  LLM_TEMPERATURE: '0.2',
  WIKIPEDIA_HOST_ALLOWLIST: 'en.wikipedia.org',
  HTTP_TIMEOUT_MS: '15000',
  OLLAMA_TIMEOUT_MS: '300000',
  SUMMARIZE_MAX_CHARS: '12000',
};

function readString(source, key, defaultValue) {
  const value = source[key];
  if (value === undefined || value === '') {
    return defaultValue;
  }
  return String(value).trim();
}

function parsePositiveInt(value, name) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return parsed;
}

function parseNonNegativeFloat(value, name) {
  const parsed = Number.parseFloat(value);
  if (Number.isNaN(parsed) || parsed < 0) {
    throw new Error(`${name} must be a non-negative number`);
  }
  return parsed;
}

function parseUrl(value, name) {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('invalid protocol');
    }
    return url.toString().replace(/\/$/, '');
  } catch {
    throw new Error(`${name} must be a valid URL`);
  }
}

function loadEnv(source = process.env) {
  const merged = { ...DEFAULTS, ...source };

  return {
    NODE_ENV: readString(merged, 'NODE_ENV', DEFAULTS.NODE_ENV),
    PORT: parsePositiveInt(
      readString(merged, 'PORT', DEFAULTS.PORT),
      'PORT',
    ),
    OLLAMA_BASE_URL: parseUrl(
      readString(merged, 'OLLAMA_BASE_URL', DEFAULTS.OLLAMA_BASE_URL),
      'OLLAMA_BASE_URL',
    ),
    OLLAMA_MODEL: readString(merged, 'OLLAMA_MODEL', DEFAULTS.OLLAMA_MODEL),
    EMBEDDING_MODEL: readString(
      merged,
      'EMBEDDING_MODEL',
      DEFAULTS.EMBEDDING_MODEL,
    ),
    CHROMA_URL: parseUrl(
      readString(merged, 'CHROMA_URL', DEFAULTS.CHROMA_URL),
      'CHROMA_URL',
    ),
    CHROMA_COLLECTION_PREFIX: readString(
      merged,
      'CHROMA_COLLECTION_PREFIX',
      DEFAULTS.CHROMA_COLLECTION_PREFIX,
    ),
    CHUNK_SIZE_CHARS: parsePositiveInt(
      readString(merged, 'CHUNK_SIZE_CHARS', DEFAULTS.CHUNK_SIZE_CHARS),
      'CHUNK_SIZE_CHARS',
    ),
    CHUNK_OVERLAP_CHARS: parsePositiveInt(
      readString(merged, 'CHUNK_OVERLAP_CHARS', DEFAULTS.CHUNK_OVERLAP_CHARS),
      'CHUNK_OVERLAP_CHARS',
    ),
    RAG_TOP_K: parsePositiveInt(
      readString(merged, 'RAG_TOP_K', DEFAULTS.RAG_TOP_K),
      'RAG_TOP_K',
    ),
    RAG_MIN_SCORE: parseNonNegativeFloat(
      readString(merged, 'RAG_MIN_SCORE', DEFAULTS.RAG_MIN_SCORE),
      'RAG_MIN_SCORE',
    ),
    LLM_TEMPERATURE: parseNonNegativeFloat(
      readString(merged, 'LLM_TEMPERATURE', DEFAULTS.LLM_TEMPERATURE),
      'LLM_TEMPERATURE',
    ),
    WIKIPEDIA_HOST_ALLOWLIST: readString(
      merged,
      'WIKIPEDIA_HOST_ALLOWLIST',
      DEFAULTS.WIKIPEDIA_HOST_ALLOWLIST,
    ),
    HTTP_TIMEOUT_MS: parsePositiveInt(
      readString(merged, 'HTTP_TIMEOUT_MS', DEFAULTS.HTTP_TIMEOUT_MS),
      'HTTP_TIMEOUT_MS',
    ),
    OLLAMA_TIMEOUT_MS: parsePositiveInt(
      readString(merged, 'OLLAMA_TIMEOUT_MS', DEFAULTS.OLLAMA_TIMEOUT_MS),
      'OLLAMA_TIMEOUT_MS',
    ),
    SUMMARIZE_MAX_CHARS: parsePositiveInt(
      readString(merged, 'SUMMARIZE_MAX_CHARS', DEFAULTS.SUMMARIZE_MAX_CHARS),
      'SUMMARIZE_MAX_CHARS',
    ),
  };
}

const env = loadEnv();

module.exports = { env, loadEnv };
