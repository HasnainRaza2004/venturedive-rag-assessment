const express = require('express');

function createChatRouter({ ragService, articleState }) {
  const router = express.Router();

  router.post('/', async (req, res, next) => {
    try {
      if (!articleState.isIndexed) {
        res.status(409).json({ error: 'Ingest an article before chatting' });
        return;
      }

      const { message } = req.body ?? {};

      if (!message || typeof message !== 'string' || !message.trim()) {
        res.status(400).json({ error: 'Message is required' });
        return;
      }

      const result = await ragService.answer(message.trim());
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = { createChatRouter };
