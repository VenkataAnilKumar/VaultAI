const express = require('express');
const router = express.Router();
const { GenAIService } = require('../services/genAI');
const { OllamaClient, ModelRouter } = require('../services/ollama');

const ollama = new OllamaClient();
const modelRouter = new ModelRouter(ollama);
const genAI = new GenAIService();

router.post('/document', async (req, res) => {
  try {
    const { prompt, contextFiles = [], outputPath } = req.body;
    if (!prompt) return res.status(400).json({ error: 'prompt is required' });
    const result = await genAI.generateDocument(prompt, contextFiles, outputPath, ollama, modelRouter);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/transform', async (req, res) => {
  try {
    const { inputPath, instruction, outputPath } = req.body;
    if (!inputPath || !instruction) return res.status(400).json({ error: 'inputPath and instruction are required' });
    const result = await genAI.transformDocument(inputPath, instruction, outputPath, ollama, modelRouter);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/synthesize', async (req, res) => {
  try {
    const { inputPaths, instruction, outputPath } = req.body;
    if (!inputPaths || !instruction) return res.status(400).json({ error: 'inputPaths and instruction are required' });
    const result = await genAI.synthesizeDocuments(inputPaths, instruction, outputPath, ollama, modelRouter);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/extract', async (req, res) => {
  try {
    const { inputPath, goal, outputPath } = req.body;
    if (!inputPath || !goal) return res.status(400).json({ error: 'inputPath and goal are required' });
    const result = await genAI.extractStructuredData(inputPath, goal, outputPath, ollama, modelRouter);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/autorename', async (req, res) => {
  try {
    const { filePath } = req.body;
    if (!filePath) return res.status(400).json({ error: 'filePath is required' });
    const result = await genAI.autoRenameFile(filePath, ollama, modelRouter);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/suggest-organization', async (req, res) => {
  try {
    const { directoryPath } = req.body;
    if (!directoryPath) return res.status(400).json({ error: 'directoryPath is required' });
    const result = await genAI.suggestOrganization(directoryPath, ollama, modelRouter);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
