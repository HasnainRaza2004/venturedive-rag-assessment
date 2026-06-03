const crypto = require('crypto');
const { env } = require('../config/env');
const { fetchAndParse } = require('../scraper/wikipediaScraper');
const { chunkArticle } = require('../text/chunker');

function buildCollectionName(url, prefix = env.CHROMA_COLLECTION_PREFIX) {
  const hash = crypto.createHash('sha256').update(url).digest('hex').slice(0, 16);
  return `${prefix}_${hash}`;
}

function toChunkRecords(chunks, embeddings) {
  return chunks.map((chunk, index) => ({
    id: `chunk-${chunk.chunkIndex}`,
    embedding: embeddings[index],
    document: chunk.text,
    metadata: {
      sectionTitle: chunk.sectionTitle,
      sectionLevel: chunk.sectionLevel,
      chunkIndex: chunk.chunkIndex,
      articleTitle: chunk.articleTitle,
      sourceUrl: chunk.sourceUrl,
    },
  }));
}

function truncateForSummary(text, maxChars) {
  if (text.length <= maxChars) {
    return text;
  }

  return `${text.slice(0, maxChars)}\n\n[Article truncated for summarization.]`;
}

function resolveSections(article) {
  if (article.sections.length > 0) {
    return article.sections;
  }

  return [
    {
      title: 'Introduction',
      level: 2,
      text: article.plainText,
    },
  ];
}

function createIngestService(deps = {}) {
  const scrape = deps.fetchAndParse ?? fetchAndParse;
  const chunk = deps.chunkArticle ?? chunkArticle;
  const llmClient = deps.llmClient;
  const embedder = deps.embedder;
  const vectorStore = deps.vectorStore;
  const collectionPrefix = deps.collectionPrefix ?? env.CHROMA_COLLECTION_PREFIX;
  const summarizeMaxChars = deps.summarizeMaxChars ?? env.SUMMARIZE_MAX_CHARS;

  async function ingest(url) {
    const article = await scrape(url);
    const summaryInput = truncateForSummary(
      article.plainText,
      summarizeMaxChars,
    );
    const summary = await llmClient.summarize(summaryInput);
    const sections = resolveSections(article);
    const chunks = chunk({
      title: article.title,
      sourceUrl: article.sourceUrl ?? url,
      sections,
    });

    const embeddings = await embedder.embed(chunks.map((item) => item.text));
    const collectionName = buildCollectionName(url, collectionPrefix);

    await vectorStore.resetCollection(collectionName);
    await vectorStore.upsert(collectionName, toChunkRecords(chunks, embeddings));

    return {
      title: article.title,
      summary,
      chunkCount: chunks.length,
      collectionName,
    };
  }

  return { ingest, buildCollectionName };
}

module.exports = {
  createIngestService,
  buildCollectionName,
  toChunkRecords,
  truncateForSummary,
};
