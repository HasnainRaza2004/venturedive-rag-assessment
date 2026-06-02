const nock = require('nock');
const { WIKI_ARTICLE_HTML } = require('../fixtures/wiki.fixture');
const { parse, fetchAndParse } = require('../../src/scraper/wikipediaScraper');

const WIKI_URL = 'https://en.wikipedia.org/wiki/Node.js';
const WIKI_HOST = 'https://en.wikipedia.org';
describe('wikipediaScraper.parse', () => {
  it('extracts the article title from #firstHeading', () => {
    const result = parse(WIKI_ARTICLE_HTML);

    expect(result.title).toBe('VentureDive Test Article');
  });

  it('extracts sections with headings and paragraph text from #mw-content-text', () => {
    const result = parse(WIKI_ARTICLE_HTML);

    expect(result.sections).toEqual([
      {
        title: 'History',
        level: 2,
        text: 'The project began in 2024.\n\nInitial development focused on RAG.',
      },
      {
        title: 'See also',
        level: 2,
        text: 'Related topics appear here.',
      },
    ]);
  });

  it('extracts the full plain-text body including the lead paragraph', () => {
    const result = parse(WIKI_ARTICLE_HTML);

    expect(result.plainText).toContain('Lead paragraph about the test subject.');
    expect(result.plainText).toContain('The project began in 2024.');
    expect(result.plainText).toContain('Initial development focused on RAG.');
    expect(result.plainText).toContain('Related topics appear here.');
  });
});

describe('wikipediaScraper.fetchAndParse', () => {
  afterEach(() => {
    nock.cleanAll();
  });

  it('fetches HTML and returns parsed article content on 200', async () => {
    nock(WIKI_HOST).get('/wiki/Node.js').reply(200, WIKI_ARTICLE_HTML);

    const result = await fetchAndParse(WIKI_URL);

    expect(result.title).toBe('VentureDive Test Article');
    expect(result.sections).toHaveLength(2);
    expect(result.plainText).toContain('Lead paragraph about the test subject.');
    expect(nock.isDone()).toBe(true);
  });

  it('throws ScrapeError when Wikipedia returns 404', async () => {
    nock(WIKI_HOST).get('/wiki/Missing_Page').reply(404, 'Not found');

    await expect(
      fetchAndParse('https://en.wikipedia.org/wiki/Missing_Page'),
    ).rejects.toMatchObject({
      name: 'ScrapeError',
      message: 'Wikipedia article not found',
      status: 404,
    });
  });

  it('throws ScrapeError for unexpected non-200 responses', async () => {
    nock(WIKI_HOST).get('/wiki/Server_Error').reply(500, 'error');

    await expect(
      fetchAndParse('https://en.wikipedia.org/wiki/Server_Error'),
    ).rejects.toMatchObject({
      name: 'ScrapeError',
      message: 'Wikipedia request failed with status 500',
      status: 500,
    });
  });

  it('throws ScrapeError on network timeout', async () => {
    nock(WIKI_HOST)
      .get('/wiki/Slow_Page')
      .delayConnection(200)
      .reply(200, WIKI_ARTICLE_HTML);

    await expect(
      fetchAndParse('https://en.wikipedia.org/wiki/Slow_Page', {
        timeoutMs: 50,
      }),
    ).rejects.toMatchObject({
      name: 'ScrapeError',
      message: 'Wikipedia request timed out',
    });
  });
});