const { ChromaClient } = require('chromadb');
const { env } = require('../config/env');

class ChromaClientError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'ChromaClientError';
    this.cause = options.cause;
  }
}

function parseChromaUrl(chromaUrl) {
  const url = new URL(chromaUrl);

  return {
    host: url.hostname,
    port: url.port ? Number(url.port) : url.protocol === 'https:' ? 443 : 8000,
    ssl: url.protocol === 'https:',
  };
}

function isNotFoundError(error) {
  return (
    error?.name === 'ChromaNotFoundError' ||
    /not found/i.test(error?.message ?? '')
  );
}

function serializeMetadata(metadata = {}) {
  const serialized = {};

  Object.entries(metadata).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      serialized[key] = value;
      return;
    }

    serialized[key] = String(value);
  });

  return serialized;
}

function createChromaClient(deps = {}) {
  const chromaUrl = deps.chromaUrl ?? env.CHROMA_URL;
  const sdkClient =
    deps.client ?? new ChromaClient(parseChromaUrl(chromaUrl));

  async function resetCollection(name) {
    try {
      await sdkClient.deleteCollection({ name });
    } catch (error) {
      if (!isNotFoundError(error)) {
        throw new ChromaClientError('Failed to reset Chroma collection', {
          cause: error,
        });
      }
    }
  }

  async function upsert(collectionName, records) {
    try {
      const collection = await sdkClient.getOrCreateCollection({
        name: collectionName,
        embeddingFunction: null,
      });

      await collection.upsert({
        ids: records.map((record) => record.id),
        embeddings: records.map((record) => record.embedding),
        documents: records.map((record) => record.document),
        metadatas: records.map((record) => serializeMetadata(record.metadata)),
      });
    } catch (error) {
      throw new ChromaClientError('Failed to upsert records into Chroma collection', {
        cause: error,
      });
    }
  }

  async function query(collectionName, vector, topK) {
    try {
      const collection = await sdkClient.getCollection({ name: collectionName });
      const result = await collection.query({
        queryEmbeddings: [vector],
        nResults: topK,
        include: ['metadatas', 'documents', 'distances'],
      });

      const ids = result.ids?.[0] ?? [];
      const distances = result.distances?.[0] ?? [];
      const documents = result.documents?.[0] ?? [];
      const metadatas = result.metadatas?.[0] ?? [];

      return ids.map((id, index) => {
        const distance = distances[index] ?? 1;
        return {
          id,
          text: documents[index] ?? '',
          distance,
          score: Math.max(0, 1 - distance),
          metadata: metadatas[index] ?? {},
        };
      });
    } catch (error) {
      throw new ChromaClientError('Failed to query Chroma collection', {
        cause: error,
      });
    }
  }

  return {
    resetCollection,
    upsert,
    query,
  };
}

const chromaClient = createChromaClient();

module.exports = {
  createChromaClient,
  chromaClient,
  ChromaClientError,
  parseChromaUrl,
  serializeMetadata,
};
