const axios = require('axios');
const { env } = require('../config/env');
const { buildSummarizePrompt } = require('../prompts/summarize');

class OllamaClientError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'OllamaClientError';
    this.status = options.status;
  }
}

function bodyUsesModel(path, body) {
  return Boolean(body?.model && ['/api/generate', '/api/chat', '/api/embed'].includes(path));
}

function createOllamaClient(deps = {}) {
  const httpClient = deps.httpClient ?? axios;
  const baseUrl = (deps.baseUrl ?? env.OLLAMA_BASE_URL).replace(/\/$/, '');
  const model = deps.model ?? env.OLLAMA_MODEL;
  const embeddingModel = deps.embeddingModel ?? env.EMBEDDING_MODEL;
  const embedBatchSize = deps.embedBatchSize ?? 16;
  const timeoutMs = deps.timeoutMs ?? env.OLLAMA_TIMEOUT_MS ?? env.HTTP_TIMEOUT_MS;
  const defaultTemperature = deps.defaultTemperature ?? env.LLM_TEMPERATURE;

  async function request(path, body) {
    try {
      const response = await httpClient.post(`${baseUrl}${path}`, body, {
        timeout: timeoutMs,
        validateStatus: () => true,
      });

      if (response.status >= 500) {
        throw new OllamaClientError(
          `Ollama request failed with status ${response.status}`,
          { status: response.status },
        );
      }

      if (response.status >= 400) {
        const modelHint = bodyUsesModel(path, body)
          ? ` Run "ollama pull ${body.model}" if it is not installed.`
          : '';
        const detail =
          response.status === 404
            ? `Ollama model or endpoint not found (HTTP 404).${modelHint}`
            : `Ollama request failed with status ${response.status}`;

        throw new OllamaClientError(detail, { status: response.status });
      }

      return response.data;
    } catch (error) {
      if (error instanceof OllamaClientError) {
        throw error;
      }

      if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
        throw new OllamaClientError('Ollama request timed out');
      }

      throw error;
    }
  }

  async function summarize(articleText) {
    const data = await request('/api/generate', {
      model,
      prompt: buildSummarizePrompt(articleText),
      stream: false,
    });

    if (!data || typeof data.response !== 'string') {
      throw new OllamaClientError('Invalid Ollama generate response');
    }

    return data.response.trim();
  }

  async function answer(prompt, options = {}) {
    const data = await request('/api/chat', {
      model,
      messages: [{ role: 'user', content: prompt }],
      stream: false,
      options: {
        temperature: options.temperature ?? defaultTemperature,
      },
    });

    const content = data?.message?.content;
    if (typeof content !== 'string') {
      throw new OllamaClientError('Invalid Ollama chat response');
    }

    return content.trim();
  }

  async function embed(texts) {
    if (!texts.length) {
      return [];
    }

    const embeddings = [];

    for (let index = 0; index < texts.length; index += embedBatchSize) {
      const batch = texts.slice(index, index + embedBatchSize);
      const data = await request('/api/embed', {
        model: embeddingModel,
        input: batch,
      });

      if (!data || !Array.isArray(data.embeddings)) {
        throw new OllamaClientError('Invalid Ollama embed response');
      }

      embeddings.push(...data.embeddings);
    }

    return embeddings;
  }

  return {
    summarize,
    embed,
    answer,
  };
}

const ollamaClient = createOllamaClient();

module.exports = {
  createOllamaClient,
  ollamaClient,
  OllamaClientError,
};
