const { env } = require('../config/env');
const { buildRagAnswerPrompt } = require('../prompts/ragAnswer');

const NOT_FOUND_MESSAGE = 'I could not find that information in the article.';

function createRagService(deps = {}) {
  const embedder = deps.embedder;
  const vectorStore = deps.vectorStore;
  const llmClient = deps.llmClient;
  const topK = deps.topK ?? env.RAG_TOP_K;
  const minScore = deps.minScore ?? env.RAG_MIN_SCORE;
  const defaultTemperature = deps.temperature ?? env.LLM_TEMPERATURE;

  function resolveCollectionName() {
    if (typeof deps.getCollectionName === 'function') {
      return deps.getCollectionName();
    }

    return deps.collectionName ?? null;
  }

  function toSource(chunk) {
    return {
      section: chunk.metadata?.sectionTitle ?? 'Unknown',
      excerpt: chunk.text,
      score: chunk.score,
    };
  }

  async function answer(question) {
    const collectionName = resolveCollectionName();

    if (!collectionName) {
      throw new Error('No article has been indexed yet');
    }

    const [queryVector] = await embedder.embed([question]);
    const retrievedChunks = await vectorStore.query(
      collectionName,
      queryVector,
      topK,
    );

    if (retrievedChunks.length === 0) {
      return {
        answer: NOT_FOUND_MESSAGE,
        sources: [],
      };
    }

    const contextChunks = retrievedChunks.map((chunk) => ({
      text: chunk.text,
      sectionTitle: chunk.metadata?.sectionTitle ?? 'Unknown',
    }));

    const prompt = buildRagAnswerPrompt(question, contextChunks);

    const answerText = await llmClient.answer(prompt, {
      temperature: defaultTemperature,
    });

    const strongSources = retrievedChunks.filter((chunk) => chunk.score >= minScore);
    const sources = (strongSources.length > 0 ? strongSources : retrievedChunks).map(
      toSource,
    );

    return {
      answer: answerText,
      sources,
    };
  }

  return { answer, NOT_FOUND_MESSAGE };
}

module.exports = { createRagService, NOT_FOUND_MESSAGE };
