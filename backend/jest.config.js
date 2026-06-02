module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',
    '!src/clients/contracts.js',
  ],
  coverageThreshold: {
    global: { lines: 85 },
  },
};
