function buildSummarizePrompt(articleText) {
  return [
    'Summarize the following Wikipedia article in 3 to 5 concise sentences.',
    'Use only information present in the article. Do not add outside facts.',
    '',
    articleText,
  ].join('\n');
}

module.exports = { buildSummarizePrompt };
