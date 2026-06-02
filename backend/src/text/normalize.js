function normalizeText(text) {
  if (!text) {
    return '';
  }

  return text
    .replace(/\[\d+\]/g, '')
    .replace(/\[\s*citation needed\s*\]/gi, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

function normalizeArticle(article) {
  const sections = article.sections
    .map((section) => ({
      ...section,
      title: normalizeText(section.title),
      text: normalizeText(section.text),
    }))
    .filter((section) => section.text.length > 0);

  return {
    ...article,
    title: normalizeText(article.title),
    plainText: normalizeText(article.plainText),
    sections,
  };
}

module.exports = { normalizeText, normalizeArticle };
