function formatContextExcerpt(index, chunk) {
  return `[${index}] Section: ${chunk.sectionTitle}\n${chunk.text}`;
}

function buildRagAnswerPrompt(question, contextChunks) {
  const excerpts = contextChunks
    .map((chunk, index) => formatContextExcerpt(index + 1, chunk))
    .join('\n\n');

  return [
    'You answer questions using ONLY the provided excerpts from a Wikipedia article.',
    'Read all excerpts before answering. Use the excerpt that best matches the question.',
    'Treat spelling variants and alternate spellings in the excerpts as relevant to the question.',
    'If none of the excerpts contain the answer, say you cannot find it in the article.',
    'Do not use outside knowledge.',
    '',
    'Excerpts:',
    excerpts,
    '',
    `Question: ${question}`,
    '',
    'Answer:',
  ].join('\n');
}

module.exports = { buildRagAnswerPrompt, formatContextExcerpt };
