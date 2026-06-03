const express = require('express');
const { validateWikipediaUrl } = require('../scraper/validateUrl');
const { setArticleState } = require('../state/articleState');

function createIngestRouter({ ingestService, articleState: state }) {
  const router = express.Router();

  router.post('/', async (req, res, next) => {
    try {
      const { url } = req.body ?? {};

      if (!url || typeof url !== 'string') {
        res.status(400).json({ error: 'URL is required' });
        return;
      }

      validateWikipediaUrl(url.trim());

      const result = await ingestService.ingest(url.trim());

      setArticleState(state, {
        title: result.title,
        summary: result.summary,
        collectionName: result.collectionName,
        chunkCount: result.chunkCount,
      });

      res.status(200).json({
        title: state.title,
        summary: state.summary,
        chunkCount: state.chunkCount,
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = { createIngestRouter };
