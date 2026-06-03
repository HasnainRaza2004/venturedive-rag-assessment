const { createRagService } = require('../../src/services/ragService');

describe('createRagService', () => {
  const embedder = { embed: jest.fn() };
  const vectorStore = { query: jest.fn() };
  const llmClient = { answer: jest.fn() };

  const baseDeps = {
    embedder,
    vectorStore,
    llmClient,
    collectionName: 'wiki_article_test',
    topK: 8,
    minScore: 0.3,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    embedder.embed.mockResolvedValue([[0.1, 0.2]]);
    llmClient.answer.mockResolvedValue('It was founded in 1729.');
  });

  it('returns an answer and sources on the happy path', async () => {
    vectorStore.query.mockResolvedValue([
      {
        id: 'chunk-0',
        text: 'Karachi was founded in 1729.',
        score: 0.82,
        distance: 0.18,
        metadata: { sectionTitle: 'History' },
      },
    ]);

    const service = createRagService(baseDeps);
    const result = await service.answer('When was Karachi founded?');

    expect(embedder.embed).toHaveBeenCalledWith(['When was Karachi founded?']);
    expect(vectorStore.query).toHaveBeenCalledWith(
      'wiki_article_test',
      [0.1, 0.2],
      8,
    );
    expect(llmClient.answer).toHaveBeenCalledWith(
      expect.stringContaining('When was Karachi founded?'),
      expect.objectContaining({ temperature: 0.2 }),
    );
    expect(result).toEqual({
      answer: 'It was founded in 1729.',
      sources: [
        {
          section: 'History',
          excerpt: 'Karachi was founded in 1729.',
          score: 0.82,
        },
      ],
    });
  });

  it('returns a not-found message when Chroma returns no chunks', async () => {
    vectorStore.query.mockResolvedValue([]);

    const service = createRagService(baseDeps);
    const result = await service.answer('Unknown fact?');

    expect(llmClient.answer).not.toHaveBeenCalled();
    expect(result).toEqual({
      answer: 'I could not find that information in the article.',
      sources: [],
    });
  });

  it('passes all top-k chunks to the LLM when the best match clears the threshold', async () => {
    vectorStore.query.mockResolvedValue([
      {
        id: 'chunk-0',
        text: 'Karachi was founded in 1729.',
        score: 0.45,
        distance: 0.55,
        metadata: { sectionTitle: 'History' },
      },
      {
        id: 'chunk-1',
        text: 'Unrelated education content.',
        score: 0.2,
        distance: 0.8,
        metadata: { sectionTitle: 'Education' },
      },
    ]);

    const service = createRagService(baseDeps);
    await service.answer('When was Karachi founded?');

    expect(llmClient.answer).toHaveBeenCalledWith(
      expect.stringContaining('Karachi was founded in 1729.'),
      expect.any(Object),
    );
    expect(llmClient.answer).toHaveBeenCalledWith(
      expect.stringContaining('Unrelated education content.'),
      expect.any(Object),
    );
  });

  it('still calls the LLM when similarity scores are low (e.g. typos in the question)', async () => {
    vectorStore.query.mockResolvedValue([
      {
        id: 'chunk-0',
        text: 'The name Karachee was used for the first time in a Dutch report from 1742.',
        score: 0.12,
        distance: 0.88,
        metadata: { sectionTitle: 'Etymology' },
      },
    ]);
    llmClient.answer.mockResolvedValue(
      'Karachee is an older spelling of the name Karachi.',
    );

    const service = createRagService(baseDeps);
    const result = await service.answer('What is Karachee?');

    expect(llmClient.answer).toHaveBeenCalled();
    expect(result.answer).toContain('Karachee');
    expect(result.sources).toHaveLength(1);
  });

  it('throws when no collection is indexed', async () => {
    const service = createRagService({
      ...baseDeps,
      getCollectionName: () => null,
      collectionName: undefined,
    });

    await expect(service.answer('Hello?')).rejects.toThrow(
      'No article has been indexed yet',
    );
  });
});
