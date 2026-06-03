module.exports = {
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/tests/integration/'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',
    '!src/clients/contracts.js',
  ],
  coverageThreshold: {
    global: { lines: 85 },
  },
};
