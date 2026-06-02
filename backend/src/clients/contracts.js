/**
 * @typedef {Object} LlmClient
 * @property {(articleText: string) => Promise<string>} summarize
 * @property {(prompt: string, options?: { temperature?: number }) => Promise<string>} answer
 */

/**
 * @typedef {Object} Embedder
 * @property {(texts: string[]) => Promise<number[][]>} embed
 */

/**
 * @typedef {Object} ChunkRecord
 * @property {string} id
 * @property {number[]} embedding
 * @property {string} document
 * @property {Object} metadata
 */

/**
 * @typedef {Object} ScoredChunk
 * @property {string} id
 * @property {string} text
 * @property {number} score
 * @property {number} distance
 * @property {Object} metadata
 */

/**
 * @typedef {Object} VectorStore
 * @property {(name: string) => Promise<void>} resetCollection
 * @property {(collection: string, records: ChunkRecord[]) => Promise<void>} upsert
 * @property {(collection: string, vector: number[], topK: number) => Promise<ScoredChunk[]>} query
 */

module.exports = {};
