const { env } = require('../config/env');

const DEFAULT_CHUNK_SIZE_CHARS = 600;
const DEFAULT_CHUNK_OVERLAP_CHARS = 100;

function resolveChunkOptions(options = {}) {
  return {
    chunkSizeChars:
      options.chunkSizeChars ??
      env.CHUNK_SIZE_CHARS ??
      DEFAULT_CHUNK_SIZE_CHARS,
    chunkOverlapChars:
      options.chunkOverlapChars ??
      env.CHUNK_OVERLAP_CHARS ??
      DEFAULT_CHUNK_OVERLAP_CHARS,
  };
}

function findWordSplitEnd(text, start, targetEnd) {
  if (targetEnd >= text.length) {
    return text.length;
  }

  const slice = text.slice(start, targetEnd);
  const lastSpace = slice.lastIndexOf(' ');

  if (lastSpace > 0) {
    return start + lastSpace;
  }

  return targetEnd;
}

function findOverlapStart(text, end, overlap) {
  let start = Math.max(0, end - overlap);

  if (start > 0 && text[start] !== ' ') {
    const nextSpace = text.indexOf(' ', start);
    start = nextSpace === -1 ? start : nextSpace + 1;
  }

  return start;
}

function splitSectionText(text, chunkSizeChars, chunkOverlapChars) {
  const normalized = text.trim();

  if (!normalized) {
    return [];
  }

  if (normalized.length <= chunkSizeChars) {
    return [normalized];
  }

  const chunks = [];
  let start = 0;

  while (start < normalized.length) {
    const targetEnd = Math.min(start + chunkSizeChars, normalized.length);
    const end = findWordSplitEnd(normalized, start, targetEnd);
    const chunkText = normalized.slice(start, end).trim();

    if (chunkText) {
      chunks.push(chunkText);
    }

    if (end >= normalized.length) {
      break;
    }

    start = findOverlapStart(normalized, end, chunkOverlapChars);

    if (start >= normalized.length) {
      break;
    }
  }

  return chunks;
}

function chunkArticle(article, options = {}) {
  const { chunkSizeChars, chunkOverlapChars } = resolveChunkOptions(options);
  const chunks = [];
  let chunkIndex = 0;

  article.sections.forEach((section) => {
    const sectionChunks = splitSectionText(
      section.text,
      chunkSizeChars,
      chunkOverlapChars,
    );

    sectionChunks.forEach((text) => {
      chunks.push({
        text,
        sectionTitle: section.title,
        sectionLevel: section.level,
        chunkIndex,
        articleTitle: article.title,
        sourceUrl: article.sourceUrl,
      });
      chunkIndex += 1;
    });
  });

  return chunks;
}

module.exports = {
  chunkArticle,
  splitSectionText,
  resolveChunkOptions,
};
