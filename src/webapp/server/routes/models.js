const express = require('express');
const router = express.Router();
const { OllamaClient, ModelRouter } = require('../services/ollama');

const ollama = new OllamaClient();
const modelRouter = new ModelRouter(ollama);

const TASK_TYPES = ['file_op', 'doc_qa', 'generate', 'transform', 'synthesize', 'extract', 'embedding', 'vision', 'code'];

router.get('/', async (req, res) => {
  try {
    const providerInfo = await ollama.getProviderInfo();

    if (!providerInfo.ollama && !providerInfo.cloud) {
      return res.json({ models: [], connected: false, provider: null });
    }

    const models = await ollama.listModels();

    const annotated = await Promise.all(models.map(async m => {
      const roles = [];
      for (const task of TASK_TYPES) {
        const selected = await modelRouter.selectModel(task);
        if (selected === m.name) roles.push(task);
      }
      return { ...m, roles, status: 'available', provider: providerInfo.activeProvider };
    }));

    res.json({
      models: annotated,
      connected: true,
      provider: providerInfo.activeProvider,
      ollama: providerInfo.ollama,
      cloud: providerInfo.cloud
    });
  } catch (err) {
    res.status(500).json({ error: err.message, connected: false });
  }
});

router.get('/status', async (req, res) => {
  try {
    const providerInfo = await ollama.getProviderInfo();
    res.json({
      connected: providerInfo.ollama || providerInfo.cloud,
      provider: providerInfo.activeProvider,
      ollama: providerInfo.ollama,
      cloud: providerInfo.cloud,
      baseUrl: 'http://localhost:11434'
    });
  } catch {
    res.json({ connected: false, provider: null, ollama: false, cloud: false });
  }
});

module.exports = router;
