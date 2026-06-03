const {
  createIngestService,
  truncateForSummary,
} = require('../../src/services/ingestService');

describe('createIngestService', () => {
  const fetchAndParse = jest.fn();
  const chunkArticle = jest.fn();
  const llmClient = { summarize: jest.fn() };
  const embedder = { embed: jest.fn() };
  const vectorStore = { resetCollection: jest.fn(), upsert: jest.fn() };

  const url = 'https://en.wikipedia.org/wiki/Karachi';

  beforeEach(() => {
    jest.clearAllMocks();

    fetchAndParse.mockResolvedValue({
      title: 'Karachi',
      sourceUrl: url,
      plainText: 'Karachi is a major city.',
      sections: [{ title: 'History', level: 2, text: 'Founded in 1729.' }],
    });
    llmClient.summarize.mockResolvedValue('Short summary of Karachi.');
    chunkArticle.mockReturnValue([
      {
        text: 'Founded in 1729.',
        sectionTitle: 'History',
        sectionLevel: 2,
        chunkIndex: 0,
        articleTitle: 'Karachi',
        sourceUrl: url,
      },
    ]);
    embedder.embed.mockResolvedValue([[0.5, 0.6]]);
    vectorStore.resetCollection.mockResolvedValue(undefined);
    vectorStore.upsert.mockResolvedValue(undefined);
  });

  it('orchestrates scrape, summarize, chunk, embed, and Chroma upsert', async () => {
    const service = createIngestService({
      fetchAndParse,
      chunkArticle,
      llmClient,
      embedder,
      vectorStore,
      collectionPrefix: 'wiki_article',
    });

    const result = await service.ingest(url);

    expect(fetchAndParse).toHaveBeenCalledWith(url);
    expect(llmClient.summarize).toHaveBeenCalledWith('Karachi is a major city.');
    expect(chunkArticle).toHaveBeenCalledWith({
      title: 'Karachi',
      sourceUrl: url,
      sections: [{ title: 'History', level: 2, text: 'Founded in 1729.' }],
    });
    expect(embedder.embed).toHaveBeenCalledWith(['Founded in 1729.']);
    expect(vectorStore.resetCollection).toHaveBeenCalledWith(
      expect.stringMatching(/^wiki_article_[a-f0-9]{16}$/),
    );
    expect(vectorStore.upsert).toHaveBeenCalledWith(
      expect.stringMatching(/^wiki_article_[a-f0-9]{16}$/),
      [
        {
          id: 'chunk-0',
          embedding: [0.5, 0.6],
          document: 'Founded in 1729.',
          metadata: {
            sectionTitle: 'History',
            sectionLevel: 2,
            chunkIndex: 0,
            articleTitle: 'Karachi',
            sourceUrl: url,
          },
        },
      ],
    );
    expect(result).toEqual({
      title: 'Karachi',
      summary: 'Short summary of Karachi.',
      chunkCount: 1,
      collectionName: expect.stringMatching(/^wiki_article_[a-f0-9]{16}$/),
    });
  });

  it('truncates very long article text before summarization', async () => {
    const longText = 'word '.repeat(5000);
    fetchAndParse.mockResolvedValue({
      title: 'Long Article',
      sourceUrl: url,
      plainText: longText,
      sections: [{ title: 'Intro', level: 2, text: 'Section text.' }],
    });

    const service = createIngestService({
      fetchAndParse,
      chunkArticle,
      llmClient,
      embedder,
      vectorStore,
      summarizeMaxChars: 100,
    });

    await service.ingest(url);

    expect(llmClient.summarize).toHaveBeenCalledWith(
      expect.stringContaining('[Article truncated for summarization.]'),
    );
    expect(llmClient.summarize.mock.calls[0][0].length).toBeLessThan(longText.length);
  });

  it('uses a single introduction section when the article has no headings', async () => {
    fetchAndParse.mockResolvedValue({
      title: 'Stub',
      sourceUrl: url,
      plainText: 'Only lead text.',
      sections: [],
    });
    chunkArticle.mockReturnValue([
      {
        text: 'Only lead text.',
        sectionTitle: 'Introduction',
        sectionLevel: 2,
        chunkIndex: 0,
        articleTitle: 'Stub',
        sourceUrl: url,
      },
    ]);

    const service = createIngestService({
      fetchAndParse,
      chunkArticle,
      llmClient,
      embedder,
      vectorStore,
    });

    await service.ingest(url);

    expect(chunkArticle).toHaveBeenCalledWith({
      title: 'Stub',
      sourceUrl: url,
      sections: [{ title: 'Introduction', level: 2, text: 'Only lead text.' }],
    });
  });
});
