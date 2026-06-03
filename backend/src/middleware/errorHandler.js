const { ScrapeError } = require('../scraper/wikipediaScraper');
const { OllamaClientError } = require('../clients/ollamaClient');
const { ChromaClientError } = require('../clients/chromaClient');

const BAD_REQUEST_URL_MESSAGES = [
  'Invalid Wikipedia URL',
  'Wikipedia URLs must use HTTPS',
  'URL must be an en.wikipedia.org article',
  'URL must point to a Wikipedia article',
];

function isBadRequestUrlError(error) {
  return BAD_REQUEST_URL_MESSAGES.includes(error.message);
}

function errorHandler(error, _req, res, _next) {
  if (res.headersSent) {
    return;
  }

  if (isBadRequestUrlError(error)) {
    res.status(400).json({ error: error.message });
    return;
  }

  if (error instanceof ScrapeError) {
    res.status(422).json({ error: error.message });
    return;
  }

  if (error instanceof OllamaClientError || error instanceof ChromaClientError) {
    res.status(502).json({ error: error.message });
    return;
  }

  if (error.statusCode) {
    res.status(error.statusCode).json({ error: error.message });
    return;
  }

  res.status(500).json({ error: error.message || 'Internal server error' });
}

module.exports = { errorHandler, isBadRequestUrlError };
