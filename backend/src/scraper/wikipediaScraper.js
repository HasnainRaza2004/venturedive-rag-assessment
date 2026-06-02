const axios = require('axios');
const cheerio = require('cheerio');
const { env } = require('../config/env');
const { normalizeArticle } = require('../text/normalize');
const { validateWikipediaUrl } = require('./validateUrl');

class ScrapeError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'ScrapeError';
    this.status = options.status;
  }
}
function parse(html) {
  const $ = cheerio.load(html);
  const title = $('#firstHeading').first().text().trim();
  const contentRoot = $('#mw-content-text').first();

  const leadParagraphs = [];
  contentRoot.children().each((_index, element) => {
    const tagName = element.tagName?.toLowerCase();
    if (tagName === 'h2' || tagName === 'h3') {
      return false;
    }
    if (tagName === 'p') {
      const text = $(element).text().trim();
      if (text) {
        leadParagraphs.push(text);
      }
    }
    return undefined;
  });

  const sections = [];
  let currentSection = null;

  contentRoot.children().each((_index, element) => {
    const tagName = element.tagName?.toLowerCase();

    if (tagName === 'h2') {
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = {
        title: $(element).text().trim(),
        level: 2,
        paragraphs: [],
      };
      return;
    }

    if (tagName === 'p' && currentSection) {
      const text = $(element).text().trim();
      if (text) {
        currentSection.paragraphs.push(text);
      }
    }
  });

  if (currentSection) {
    sections.push(currentSection);
  }

  const parsedSections = sections.map((section) => ({
    title: section.title,
    level: section.level,
    text: section.paragraphs.join('\n\n'),
  }));

  const sectionTexts = parsedSections.map((section) => section.text);
  const plainText = [...leadParagraphs, ...sectionTexts].filter(Boolean).join('\n\n');

  return {
    title,
    sections: parsedSections,
    plainText,
  };
}

async function fetchAndParse(url, options = {}) {
  const validatedUrl = validateWikipediaUrl(url);
  const timeoutMs = options.timeoutMs ?? env.HTTP_TIMEOUT_MS;

  try {
    const response = await axios.get(validatedUrl, {
      timeout: timeoutMs,
      headers: {
        'User-Agent': 'VentureDiveRAG/1.0 (take-home-assessment)',
      },
      validateStatus: () => true,
    });

    if (response.status === 404) {
      throw new ScrapeError('Wikipedia article not found', { status: 404 });
    }

    if (response.status !== 200) {
      throw new ScrapeError(
        `Wikipedia request failed with status ${response.status}`,
        { status: response.status },
      );
    }

    return normalizeArticle(parse(response.data));
  } catch (error) {
    if (error instanceof ScrapeError) {
      throw error;
    }

    if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
      throw new ScrapeError('Wikipedia request timed out');
    }

    throw error;
  }
}

module.exports = { parse, fetchAndParse, ScrapeError };