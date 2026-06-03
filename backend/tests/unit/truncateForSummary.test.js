const { truncateForSummary } = require('../../src/services/ingestService');

describe('truncateForSummary', () => {
  it('returns the original text when under the limit', () => {
    expect(truncateForSummary('short text', 100)).toBe('short text');
  });

  it('truncates and appends a marker when over the limit', () => {
    const result = truncateForSummary('abcdefghij', 5);

    expect(result).toBe('abcde\n\n[Article truncated for summarization.]');
  });
});
