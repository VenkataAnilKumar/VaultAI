const express = require('express');
const router = express.Router();
const { EmbeddingsService } = require('../services/embeddings');
const { VectorStore } = require('../services/vectorStore');
const { OllamaClient, ModelRouter } = require('../services/ollama');

const ollama = new OllamaClient();
const modelRouter = new ModelRouter(ollama);
const embeddingsService = new EmbeddingsService(ollama, modelRouter);
const vectorStore = new VectorStore();

try {
  vectorStore.initialize();
} catch (e) {
  console.warn('Vector store init failed:', e.message);
}

router.get('/', async (req, res) => {
  try {
    const { q, dir, limit = 10 } = req.query;
    if (!q) return res.status(400).json({ error: 'q is required' });

    const results = await embeddingsService.searchSemantic(q, parseInt(limit), dir, vectorStore);
    res.json({ results, query: q });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
