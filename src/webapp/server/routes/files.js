const express = require('express');
const router = express.Router();
const fileOps = require('../services/fileOps');
const docReader = require('../services/docReader');
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
    const dirPath = req.query.path || process.env.HOME || '/tmp';
    const result = await fileOps.executeTool('list_directory', { path: dirPath });
    if (!result.success) return res.status(400).json({ error: result.error });
    res.json(result.result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/read', async (req, res) => {
  try {
    const { path: filePath } = req.query;
    if (!filePath) return res.status(400).json({ error: 'path is required' });
    const result = await docReader.extractText(filePath);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/index', async (req, res) => {
  try {
    const { directory } = req.body;
    if (!directory) return res.status(400).json({ error: 'directory is required' });
    const result = await embeddingsService.indexDirectory(directory, vectorStore, docReader);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/indexed', (req, res) => {
  try {
    const files = vectorStore.getIndexedFiles();
    res.json({ files });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
