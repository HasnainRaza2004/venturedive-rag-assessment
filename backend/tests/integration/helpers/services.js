async function isOllamaReady(baseUrl = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434') {
  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/tags`);
    if (!response.ok) {
      return false;
    }

    const payload = await response.json();
    const names = (payload.models ?? []).map((model) => model.name ?? '');

    const hasChatModel = names.some(
      (name) => name.includes('llama3.2:3b') || name.includes('llama3.2:latest'),
    );
    const hasEmbedModel = names.some((name) => name.includes('nomic-embed-text'));

    return hasChatModel && hasEmbedModel;
  } catch {
    return false;
  }
}

async function isChromaReady(chromaUrl = process.env.CHROMA_URL ?? 'http://localhost:8000') {
  try {
    const response = await fetch(
      `${chromaUrl.replace(/\/$/, '')}/api/v2/heartbeat`,
    );
    return response.ok;
  } catch {
    return false;
  }
}

async function integrationServicesReady() {
  const [ollama, chroma] = await Promise.all([isOllamaReady(), isChromaReady()]);
  return { ollama, chroma, ready: ollama && chroma };
}

module.exports = {
  isOllamaReady,
  isChromaReady,
  integrationServicesReady,
};
