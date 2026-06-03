/** Jest config for real Ollama + Chroma integration tests only. */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/integration/**/*.test.js'],
  testTimeout: 300_000,
};
