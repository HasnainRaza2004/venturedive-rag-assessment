function buildSummarizePrompt(articleText) {
  return [
    'You are a summarization assistant. Write 3 to 5 concise sentences summarizing the Wikipedia article below.',
    'Use only information present in the article. Do not add outside facts.',
    '',
    'Output ONLY the summary text. You must not include any introductory phrases, preambles, formatting, or conversational filler (e.g., do not say "Here is a summary"). Output the raw summary text directly.',
    '',
    'Article:',
    articleText,
  ].join('\n');
}

module.exports = { buildSummarizePrompt };
