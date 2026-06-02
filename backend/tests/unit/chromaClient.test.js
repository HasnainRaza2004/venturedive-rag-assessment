const { ChromaClient } = require('chromadb');
const {
  createChromaClient,
  ChromaClientError,
} = require('../../src/clients/chromaClient');

const mockDeleteCollection = jest.fn();
const mockGetOrCreateCollection = jest.fn();
const mockGetCollection = jest.fn();
const mockUpsert = jest.fn();
const mockQuery = jest.fn();

const mockCollection = {
  upsert: mockUpsert,
  query: mockQuery,
};

jest.mock('chromadb', () => ({
  ChromaClient: jest.fn(),
}));

describe('createChromaClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetOrCreateCollection.mockResolvedValue(mockCollection);
    mockGetCollection.mockResolvedValue(mockCollection);
    mockDeleteCollection.mockResolvedValue(undefined);
    mockUpsert.mockResolvedValue(undefined);

    ChromaClient.mockImplementation(() => ({
      deleteCollection: mockDeleteCollection,
      getOrCreateCollection: mockGetOrCreateCollection,
      getCollection: mockGetCollection,
    }));
  });

  it('resetCollection deletes the collection when it exists', async () => {
    const client = createChromaClient({ chromaUrl: 'http://chroma.test:8000' });

    await client.resetCollection('wiki_article_test');

    expect(ChromaClient).toHaveBeenCalledWith({
      host: 'chroma.test',
      port: 8000,
      ssl: false,
    });
    expect(mockDeleteCollection).toHaveBeenCalledWith({
      name: 'wiki_article_test',
    });
  });

  it('resetCollection ignores missing collections', async () => {
    mockDeleteCollection.mockRejectedValueOnce(
      Object.assign(new Error('not found'), { name: 'ChromaNotFoundError' }),
    );

    const client = createChromaClient();
    await expect(client.resetCollection('missing')).resolves.toBeUndefined();
  });

  it('upserts chunk records with metadata into the collection', async () => {
    const client = createChromaClient();
    const records = [
      {
        id: 'chunk-0',
        embedding: [0.1, 0.2],
        document: 'First chunk text',
        metadata: {
          sectionTitle: 'History',
          chunkIndex: 0,
          articleTitle: 'Test Article',
          sourceUrl: 'https://en.wikipedia.org/wiki/Test',
        },
      },
    ];

    await client.upsert('wiki_article_test', records);

    expect(mockGetOrCreateCollection).toHaveBeenCalledWith({
      name: 'wiki_article_test',
      embeddingFunction: null,
    });
    expect(mockUpsert).toHaveBeenCalledWith({
      ids: ['chunk-0'],
      embeddings: [[0.1, 0.2]],
      documents: ['First chunk text'],
      metadatas: [
        {
          sectionTitle: 'History',
          chunkIndex: 0,
          articleTitle: 'Test Article',
          sourceUrl: 'https://en.wikipedia.org/wiki/Test',
        },
      ],
    });
  });

  it('query returns scored chunks with metadata', async () => {
    mockQuery.mockResolvedValue({
      ids: [['chunk-0', 'chunk-1']],
      distances: [[0.2, 0.5]],
      documents: [['First chunk text', 'Second chunk text']],
      metadatas: [[
        {
          sectionTitle: 'History',
          chunkIndex: 0,
          articleTitle: 'Test Article',
          sourceUrl: 'https://en.wikipedia.org/wiki/Test',
        },
        {
          sectionTitle: 'See also',
          chunkIndex: 1,
          articleTitle: 'Test Article',
          sourceUrl: 'https://en.wikipedia.org/wiki/Test',
        },
      ]],
    });

    const client = createChromaClient();
    const results = await client.query('wiki_article_test', [0.9, 0.1], 2);

    expect(mockGetCollection).toHaveBeenCalledWith({ name: 'wiki_article_test' });
    expect(mockQuery).toHaveBeenCalledWith({
      queryEmbeddings: [[0.9, 0.1]],
      nResults: 2,
      include: ['metadatas', 'documents', 'distances'],
    });
    expect(results).toEqual([
      {
        id: 'chunk-0',
        text: 'First chunk text',
        distance: 0.2,
        score: 0.8,
        metadata: {
          sectionTitle: 'History',
          chunkIndex: 0,
          articleTitle: 'Test Article',
          sourceUrl: 'https://en.wikipedia.org/wiki/Test',
        },
      },
      {
        id: 'chunk-1',
        text: 'Second chunk text',
        distance: 0.5,
        score: 0.5,
        metadata: {
          sectionTitle: 'See also',
          chunkIndex: 1,
          articleTitle: 'Test Article',
          sourceUrl: 'https://en.wikipedia.org/wiki/Test',
        },
      },
    ]);
  });

  it('throws ChromaClientError when reset fails for non-not-found errors', async () => {
    mockDeleteCollection.mockRejectedValueOnce(new Error('permission denied'));

    const client = createChromaClient();

    await expect(client.resetCollection('wiki_article_test')).rejects.toMatchObject({
      name: 'ChromaClientError',
      message: 'Failed to reset Chroma collection',
    });
  });

  it('throws ChromaClientError when upsert fails', async () => {
    mockUpsert.mockRejectedValueOnce(new Error('write failed'));

    const client = createChromaClient();

    await expect(
      client.upsert('wiki_article_test', [
        {
          id: 'chunk-0',
          embedding: [0.1],
          document: 'text',
          metadata: { sectionTitle: 'History' },
        },
      ]),
    ).rejects.toMatchObject({
      name: 'ChromaClientError',
      message: 'Failed to upsert records into Chroma collection',
    });
  });
});

describe('ChromaClientError', () => {
  it('is an Error subclass', () => {
    const error = new ChromaClientError('failed');
    expect(error).toBeInstanceOf(Error);
  });
});
