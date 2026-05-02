const express = require('express');
const router = express.Router();
const { OllamaClient, ModelRouter } = require('../services/ollama');
const { OrchestratorAgent } = require('../agents/orchestrator');
const { agentRegistry } = require('../agents/registry');

const ollama = new OllamaClient();
const modelRouter = new ModelRouter(ollama);

router.post('/run', async (req, res) => {
  const { message, workingDirectory, stream = false } = req.body;

  const orchestrator = new OrchestratorAgent(ollama, modelRouter);

  if (!orchestrator.isComplexTask(message)) {
    return res.json({ fallback: true });
  }

  if (stream) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const onProgress = (update) => {
      res.write('data: ' + JSON.stringify(update) + '\n\n');
    };

    try {
      const result = await orchestrator.run(message, workingDirectory, onProgress);
      res.write('data: ' + JSON.stringify({ done: true, ...result }) + '\n\n');
    } catch (err) {
      res.write('data: ' + JSON.stringify({ error: err.message }) + '\n\n');
    }
    return res.end();
  }

  try {
    const result = await orchestrator.run(message, workingDirectory);
    res.json(result || { fallback: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', (req, res) => {
  res.json({ agents: agentRegistry.list() });
});

module.exports = router;
