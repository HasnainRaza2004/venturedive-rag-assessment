const summarize = jest.fn();
const embed = jest.fn();
const answer = jest.fn();

const createOllamaClient = jest.fn(() => ({
  summarize,
  embed,
  answer,
}));

class OllamaClientError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'OllamaClientError';
    this.status = options.status;
  }
}

module.exports = {
  createOllamaClient,
  ollamaClient: { summarize, embed, answer },
  OllamaClientError,
};
