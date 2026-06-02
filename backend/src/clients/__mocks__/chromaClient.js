const resetCollection = jest.fn();
const upsert = jest.fn();
const query = jest.fn();

const createChromaClient = jest.fn(() => ({
  resetCollection,
  upsert,
  query,
}));

class ChromaClientError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'ChromaClientError';
    this.cause = options.cause;
  }
}

module.exports = {
  createChromaClient,
  chromaClient: { resetCollection, upsert, query },
  ChromaClientError,
};
