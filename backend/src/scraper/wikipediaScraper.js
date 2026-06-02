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

function getParserRoot($) {
  const contentRoot = $('#mw-content-text').first();
  const parserOutput = contentRoot.find('.mw-parser-output').first();

  return parserOutput.length ? parserOutput : contentRoot;
}

function finalizeSection(section) {
  return {
    title: section.title,
    level: section.level,
    text: section.paragraphs.join('\n\n'),
  };
}

function parse(html) {
  const $ = cheerio.load(html);
  const title = $('#firstHeading').first().text().trim();
  const root = getParserRoot($);

  const leadParagraphs = [];
  const sections = [];
  let currentSection = null;

  root.children().each((_index, element) => {
    const $element = $(element);
    const tagName = element.tagName?.toLowerCase();

    if ($element.hasClass('mw-heading')) {
      const heading = $element.find('h2').first();
      if (!heading.length) {
        return;
      }

      if (currentSection) {
        sections.push(finalizeSection(currentSection));
      }

      currentSection = {
        title: heading.text().trim(),
        level: 2,
        paragraphs: [],
      };
      return;
    }

    if (tagName === 'h2') {
      if (currentSection) {
        sections.push(finalizeSection(currentSection));
      }

      currentSection = {
        title: $element.text().trim(),
        level: 2,
        paragraphs: [],
      };
      return;
    }

    if (tagName === 'p') {
      const text = $element.text().trim();
      if (!text) {
        return;
      }

      if (currentSection) {
        currentSection.paragraphs.push(text);
      } else {
        leadParagraphs.push(text);
      }
    }
  });

  if (currentSection) {
    sections.push(finalizeSection(currentSection));
  }

  const parsedSections = sections.filter((section) => section.text.length > 0);
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

    const parsed = normalizeArticle(parse(response.data));

    return {
      ...parsed,
      sourceUrl: validatedUrl,
    };
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
