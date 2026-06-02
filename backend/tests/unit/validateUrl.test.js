const { validateWikipediaUrl } = require('../../src/scraper/validateUrl');

describe('validateWikipediaUrl', () => {
  it('accepts a valid https en.wikipedia.org wiki URL', () => {
    const url = 'https://en.wikipedia.org/wiki/Node.js';

    expect(validateWikipediaUrl(url)).toBe(url);
  });

  it('rejects http URLs', () => {
    expect(() =>
      validateWikipediaUrl('http://en.wikipedia.org/wiki/Node.js'),
    ).toThrow('Wikipedia URLs must use HTTPS');
  });

  it('rejects non-wikipedia domains', () => {
    expect(() =>
      validateWikipediaUrl('https://example.com/wiki/Node.js'),
    ).toThrow('URL must be an en.wikipedia.org article');
  });

  it('rejects other wikipedia language domains', () => {
    expect(() =>
      validateWikipediaUrl('https://de.wikipedia.org/wiki/Node.js'),
    ).toThrow('URL must be an en.wikipedia.org article');
  });

  it('rejects en.wikipedia.org paths that are not wiki articles', () => {
    expect(() =>
      validateWikipediaUrl('https://en.wikipedia.org/wiki/'),
    ).toThrow('URL must point to a Wikipedia article');
  });

  it('rejects malformed URLs', () => {
    expect(() => validateWikipediaUrl('not-a-url')).toThrow(
      'Invalid Wikipedia URL',
    );
  });
});
