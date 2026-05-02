const express = require('express');
const router = express.Router();
const { OllamaClient, ModelRouter } = require('../services/ollama');

const ollama = new OllamaClient();
const modelRouter = new ModelRouter(ollama);

const TASK_TYPES = ['file_op', 'doc_qa', 'generate', 'transform', 'synthesize', 'extract', 'embedding', 'vision', 'code'];

router.get('/', async (req, res) => {
  try {
    const connected = await ollama.isConnected();
    if (!connected) {
      return res.json({ models: [], connected: false });
    }
    const models = await ollama.listModels();

    const annotated = await Promise.all(models.map(async m => {
      const roles = [];
      for (const task of TASK_TYPES) {
        const selected = await modelRouter.selectModel(task);
        if (selected === m.name) roles.push(task);
      }
      return { ...m, roles, status: 'available' };
    }));

    res.json({ models: annotated, connected: true });
  } catch (err) {
    res.status(500).json({ error: err.message, connected: false });
  }
});

router.get('/status', async (req, res) => {
  try {
    const connected = await ollama.isConnected();
    res.json({ connected, baseUrl: 'http://localhost:11434' });
  } catch {
    res.json({ connected: false, baseUrl: 'http://localhost:11434' });
  }
});

module.exports = router;
