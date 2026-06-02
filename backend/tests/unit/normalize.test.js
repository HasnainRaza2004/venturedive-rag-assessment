const {
  normalizeText,
  normalizeArticle,
} = require('../../src/text/normalize');

describe('normalizeText', () => {
  it('returns an empty string for falsy input', () => {
    expect(normalizeText('')).toBe('');
    expect(normalizeText(null)).toBe('');
  });

  it('removes numeric Wikipedia citation brackets', () => {
    const input = 'A fact[1] and another[23] claim.';

    expect(normalizeText(input)).toBe('A fact and another claim.');
  });

  it('removes [citation needed] markers case-insensitively', () => {
    const input = 'Unverified text [citation needed] here.';

    expect(normalizeText(input)).toBe('Unverified text here.');
  });

  it('compresses excessive newlines into a single newline', () => {
    const input = 'Line one\n\n\n\nLine two';

    expect(normalizeText(input)).toBe('Line one\nLine two');
  });

  it('trims leading and trailing whitespace', () => {
    const input = '  \n  padded text  \n  ';

    expect(normalizeText(input)).toBe('padded text');
  });
});

describe('normalizeArticle', () => {
  it('drops sections whose text is empty after normalization', () => {
    const article = {
      title: '  Title  ',
      plainText: 'Body[1]',
      sections: [
        { title: 'Full', level: 2, text: 'Real content' },
        { title: 'Empty', level: 2, text: '   [1]   ' },
      ],
    };

    const result = normalizeArticle(article);

    expect(result.title).toBe('Title');
    expect(result.plainText).toBe('Body');
    expect(result.sections).toEqual([
      { title: 'Full', level: 2, text: 'Real content' },
    ]);
  });
});
