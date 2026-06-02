const { chunkArticle } = require('../../src/text/chunker');

function repeatWords(count, word = 'alpha') {
  return Array.from({ length: count }, () => word).join(' ');
}

function buildArticle(overrides = {}) {
  return {
    title: 'Test Article',
    sourceUrl: 'https://en.wikipedia.org/wiki/Test',
    sections: [
      {
        title: 'History',
        level: 2,
        text: repeatWords(120, 'history'),
      },
      {
        title: 'See also',
        level: 2,
        text: repeatWords(120, 'seealso'),
      },
    ],
    ...overrides,
  };
}

describe('chunkArticle', () => {
  it('does not merge text from different sections into one chunk', () => {
    const article = buildArticle({
      sections: [
        {
          title: 'History',
          level: 2,
          text: `${repeatWords(80, 'history')} UNIQUE_HISTORY_MARKER`,
        },
        {
          title: 'See also',
          level: 2,
          text: `${repeatWords(80, 'seealso')} UNIQUE_SEEALSO_MARKER`,
        },
      ],
    });

    const chunks = chunkArticle(article, {
      chunkSizeChars: 200,
      chunkOverlapChars: 40,
    });

    chunks.forEach((chunk) => {
      if (chunk.text.includes('UNIQUE_HISTORY_MARKER')) {
        expect(chunk.sectionTitle).toBe('History');
        expect(chunk.text).not.toContain('UNIQUE_SEEALSO_MARKER');
      }

      if (chunk.text.includes('UNIQUE_SEEALSO_MARKER')) {
        expect(chunk.sectionTitle).toBe('See also');
        expect(chunk.text).not.toContain('UNIQUE_HISTORY_MARKER');
      }
    });

    expect(chunks.some((chunk) => chunk.sectionTitle === 'History')).toBe(true);
    expect(chunks.some((chunk) => chunk.sectionTitle === 'See also')).toBe(true);
  });

  it('creates chunks near the target size with overlap between consecutive chunks', () => {
    const article = buildArticle({
      sections: [
        {
          title: 'History',
          level: 2,
          text: repeatWords(250, 'chunkable'),
        },
      ],
    });

    const chunkSizeChars = 200;
    const chunkOverlapChars = 50;
    const chunks = chunkArticle(article, { chunkSizeChars, chunkOverlapChars });

    expect(chunks.length).toBeGreaterThan(1);

    chunks.forEach((chunk) => {
      expect(chunk.text.length).toBeLessThanOrEqual(chunkSizeChars);
    });

    for (let index = 1; index < chunks.length; index += 1) {
      const previous = chunks[index - 1].text;
      const current = chunks[index].text;
      let sharedLength = 0;

      for (
        let size = Math.min(previous.length, current.length, chunkOverlapChars);
        size > 0;
        size -= 1
      ) {
        if (previous.endsWith(current.slice(0, size))) {
          sharedLength = size;
          break;
        }
      }

      expect(sharedLength).toBeGreaterThan(0);
    }
  });

  it('splits on word boundaries instead of cutting words in half', () => {
    const article = buildArticle({
      sections: [
        {
          title: 'History',
          level: 2,
          text: repeatWords(180, 'boundary'),
        },
      ],
    });

    const sourceWords = new Set(article.sections[0].text.split(/\s+/));
    const chunks = chunkArticle(article, {
      chunkSizeChars: 180,
      chunkOverlapChars: 30,
    });

    chunks.forEach((chunk) => {
      const chunkWords = chunk.text.split(/\s+/).filter(Boolean);
      chunkWords.forEach((word) => {
        expect(sourceWords.has(word)).toBe(true);
      });
    });
  });

  it('includes chunk metadata for each output chunk', () => {
    const article = buildArticle();
    const chunks = chunkArticle(article, {
      chunkSizeChars: 250,
      chunkOverlapChars: 50,
    });

    expect(chunks.length).toBeGreaterThan(0);

    chunks.forEach((chunk, index) => {
      expect(chunk).toMatchObject({
        sectionTitle: expect.any(String),
        chunkIndex: index,
        articleTitle: 'Test Article',
        sourceUrl: 'https://en.wikipedia.org/wiki/Test',
      });
      expect(chunk.text.length).toBeGreaterThan(0);
    });
  });

  it('uses env chunk defaults when options are omitted', () => {
    const article = buildArticle({
      sections: [
        {
          title: 'History',
          level: 2,
          text: 'short section text',
        },
      ],
    });

    const chunks = chunkArticle(article);

    expect(chunks).toHaveLength(1);
    expect(chunks[0].chunkIndex).toBe(0);
  });

  it('respects custom chunk size and overlap from options', () => {
    const article = buildArticle({
      sections: [
        {
          title: 'History',
          level: 2,
          text: repeatWords(40, 'tiny'),
        },
      ],
    });

    const chunks = chunkArticle(article, {
      chunkSizeChars: 30,
      chunkOverlapChars: 5,
    });

    expect(chunks.length).toBeGreaterThan(1);
    chunks.forEach((chunk) => {
      expect(chunk.text.length).toBeLessThanOrEqual(30);
    });
  });
});
