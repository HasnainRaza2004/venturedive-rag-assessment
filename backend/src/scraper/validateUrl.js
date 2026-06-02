const WIKIPEDIA_HOST = 'en.wikipedia.org';
const WIKI_PATH_PREFIX = '/wiki/';

function validateWikipediaUrl(urlString) {
  let parsed;

  try {
    parsed = new URL(urlString);
  } catch {
    throw new Error('Invalid Wikipedia URL');
  }

  if (parsed.protocol !== 'https:') {
    throw new Error('Wikipedia URLs must use HTTPS');
  }

  if (parsed.hostname !== WIKIPEDIA_HOST) {
    throw new Error('URL must be an en.wikipedia.org article');
  }

  const articleSlug = parsed.pathname.slice(WIKI_PATH_PREFIX.length);
  if (!parsed.pathname.startsWith(WIKI_PATH_PREFIX) || articleSlug.length === 0) {
    throw new Error('URL must point to a Wikipedia article');
  }

  return urlString;
}

module.exports = { validateWikipediaUrl };
