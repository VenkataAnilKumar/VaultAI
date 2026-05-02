const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { SUPPORTED_EXTENSIONS } = require('../services/docReader');
const { OllamaClient, ModelRouter } = require('../services/ollama');
const { EmbeddingsService } = require('../services/embeddings');
const { VectorStore } = require('../services/vectorStore');
const docReader = require('../services/docReader');

const ollama = new OllamaClient();
const modelRouter = new ModelRouter(ollama);
const embeddingsService = new EmbeddingsService(ollama, modelRouter);
const vectorStore = new VectorStore();

try { vectorStore.initialize(); } catch (e) { console.warn('Documents: vector store init:', e.message); }

// PII regex patterns (Phase 2)
const PII_PATTERNS = {
  emails:    { re: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g, label: 'Email Addresses' },
  phones:    { re: /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}/g, label: 'Phone Numbers' },
  ssn:       { re: /\b\d{3}[-\s]\d{2}[-\s]\d{4}\b/g, label: 'SSNs' },
  creditCard:{ re: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g, label: 'Credit Card Numbers' },
  ipAddrs:   { re: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, label: 'IP Addresses' },
  dates:     { re: /\b(?:\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\w+ \d{1,2},? \d{4})\b/g, label: 'Dates' },
  urls:      { re: /https?:\/\/[^\s<>"{}|\\^`\[\]]+/g, label: 'URLs' }
};

// ── POST /api/documents/ingest ─────────────────────────────────
router.post('/ingest', async (req, res) => {
  const { filePath } = req.body;
  if (!filePath) return res.status(400).json({ error: 'filePath is required' });
  try {
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: `File not found: ${filePath}` });
    const doc = await docReader.extractText(filePath);
    if (!doc.text) return res.status(400).json({ error: 'Could not extract text from file', type: doc.type });
    const stat = fs.statSync(filePath);
    const hash = crypto.createHash('md5').update(filePath + stat.mtime.toISOString()).digest('hex');
    const chunks = docReader.chunkText(doc.text);
    for (const chunk of chunks) {
      const embedding = await embeddingsService.getEmbedding(chunk.chunk);
      vectorStore.upsertChunk(filePath, chunk.index, chunk.chunk, embedding, hash);
    }
    res.json({ success: true, filePath, fileName: path.basename(filePath), chunks: chunks.length, wordCount: doc.wordCount, type: doc.type });
  } catch (err) {
    console.error('Ingest error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/documents ────────────────────────────────────────
router.get('/', (req, res) => {
  try {
    const files = vectorStore.getIndexedFiles();
    const documents = files.map(f => ({
      filePath: f.filePath,
      fileName: path.basename(f.filePath),
      chunkCount: f.chunkCount,
      indexedAt: f.indexedAt,
      ext: path.extname(f.filePath).toLowerCase().replace('.', '')
    }));
    res.json({ documents });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/documents ──────────────────────────────────────
router.delete('/', (req, res) => {
  const { filePath } = req.body;
  if (!filePath) return res.status(400).json({ error: 'filePath is required' });
  try {
    vectorStore.deleteFile(filePath);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/documents/query ──────────────────────────────────
router.post('/query', async (req, res) => {
  const { question, filePath, topK = 5, useHyDE = true } = req.body;
  if (!question) return res.status(400).json({ error: 'question is required' });
  try {
    let results;
    if (useHyDE) {
      try {
        results = await embeddingsService.searchHyDE(question, parseInt(topK), filePath || null, vectorStore);
      } catch {
        results = await embeddingsService.searchSemantic(question, parseInt(topK), filePath || null, vectorStore);
      }
    } else {
      results = await embeddingsService.searchSemantic(question, parseInt(topK), filePath || null, vectorStore);
    }
    if (results.length === 0) {
      return res.json({ answer: 'No relevant content found. Please ingest a document first.', sources: [] });
    }
    const context = results.map((r, i) => `[${i + 1}] From "${path.basename(r.filePath)}":\n${r.excerpt}`).join('\n\n');
    const model = await modelRouter.selectModel('doc_qa');
    if (!model) return res.status(503).json({ error: 'No AI model available. Start Ollama.' });
    const response = await ollama.chat(model, [
      { role: 'system', content: 'You are a precise document Q&A assistant. Answer ONLY using the provided excerpts. Cite excerpt numbers like [1] or [2] when referencing content. If the answer is not in the excerpts, say so clearly.' },
      { role: 'user', content: `Document excerpts:\n\n${context}\n\nQuestion: ${question}` }
    ]);
    res.json({ answer: response.message?.content || '', sources: results, model });
  } catch (err) {
    console.error('Query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/documents/multi-query (Phase 2) ──────────────────
// Ask a question across ALL indexed documents simultaneously
router.post('/multi-query', async (req, res) => {
  const { question, filePaths, topK = 6 } = req.body;
  if (!question) return res.status(400).json({ error: 'question is required' });
  try {
    // Search across all docs or specified subset
    let results;
    try {
      results = await embeddingsService.searchHyDE(question, parseInt(topK), null, vectorStore);
    } catch {
      results = await embeddingsService.searchSemantic(question, parseInt(topK), null, vectorStore);
    }

    // Filter to specified filePaths if provided
    if (filePaths && filePaths.length > 0) {
      results = results.filter(r => filePaths.includes(r.filePath));
    }

    if (results.length === 0) {
      return res.json({ answer: 'No relevant content found in any indexed documents.', sources: [], documentsSearched: 0 });
    }

    // Group by file for citation
    const byFile = {};
    results.forEach((r, i) => {
      const name = path.basename(r.filePath);
      if (!byFile[name]) byFile[name] = [];
      byFile[name].push({ index: i + 1, excerpt: r.excerpt, score: r.score });
    });

    const context = results.map((r, i) => `[${i + 1}] From "${path.basename(r.filePath)}":\n${r.excerpt}`).join('\n\n');
    const docList = [...new Set(results.map(r => path.basename(r.filePath)))].join(', ');

    const model = await modelRouter.selectModel('doc_qa');
    if (!model) return res.status(503).json({ error: 'No AI model available. Start Ollama.' });

    const response = await ollama.chat(model, [
      {
        role: 'system',
        content: `You are a multi-document research assistant. Answer the question by synthesizing information from multiple documents: ${docList}. Cite sources using [N] notation. Compare and contrast information when relevant. If documents disagree, note the discrepancy.`
      },
      { role: 'user', content: `Excerpts from multiple documents:\n\n${context}\n\nQuestion: ${question}` }
    ]);

    const uniqueFiles = [...new Set(results.map(r => r.filePath))];
    res.json({
      answer: response.message?.content || '',
      sources: results,
      documentsSearched: uniqueFiles.length,
      documentsReferenced: uniqueFiles.map(fp => path.basename(fp)),
      model
    });
  } catch (err) {
    console.error('Multi-query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/documents/pii (Phase 2) ─────────────────────────
// Detect PII (regex + LLM) in a document
router.post('/pii', async (req, res) => {
  const { filePath } = req.body;
  if (!filePath) return res.status(400).json({ error: 'filePath is required' });
  try {
    const doc = await docReader.extractText(filePath);
    if (!doc.text) return res.status(400).json({ error: 'Could not extract text from file' });

    const text = doc.text;

    // Regex-based PII detection
    const regexFindings = {};
    let totalRegex = 0;
    for (const [key, { re, label }] of Object.entries(PII_PATTERNS)) {
      re.lastIndex = 0;
      const matches = [...new Set(text.match(re) || [])];
      if (matches.length > 0) {
        regexFindings[key] = { label, matches: matches.slice(0, 20), count: matches.length };
        totalRegex += matches.length;
      }
    }

    // LLM-based PII detection (more nuanced: names, addresses, medical info)
    let aiFindings = [];
    const model = await modelRouter.selectModel('extract');
    if (model) {
      try {
        const snippet = text.slice(0, 6000);
        const aiRes = await ollama.generate(model,
          `Analyze this document for personally identifiable information (PII) that regex alone might miss: full names, physical addresses, medical/health info, financial account details, passport/ID numbers, biometric references, or other sensitive personal data.\n\nReturn ONLY a JSON array of objects: [{"type":"Full Name","value":"John Smith","risk":"medium"},{"type":"Address","value":"123 Main St...","risk":"high"}]\n\nIf no PII found beyond what regex catches, return []\n\nDocument:\n${snippet}\n\nReturn valid JSON array only:`
        );
        const match = aiRes.response.match(/\[[\s\S]*?\]/);
        if (match) aiFindings = JSON.parse(match[0]).slice(0, 30);
      } catch { aiFindings = []; }
    }

    // Risk level
    const totalPii = totalRegex + aiFindings.length;
    const riskLevel = totalPii === 0 ? 'clean' : totalPii < 5 ? 'low' : totalPii < 20 ? 'medium' : 'high';

    res.json({
      filePath,
      fileName: path.basename(filePath),
      riskLevel,
      totalFindings: totalPii,
      regexFindings,
      aiFindings,
      model: model || 'regex-only'
    });
  } catch (err) {
    console.error('PII error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/documents/summarize ─────────────────────────────
router.post('/summarize', async (req, res) => {
  const { filePath, type = 'tldr' } = req.body;
  if (!filePath) return res.status(400).json({ error: 'filePath is required' });
  try {
    const doc = await docReader.extractText(filePath);
    if (!doc.text) return res.status(400).json({ error: 'Could not extract text from file' });
    const text = doc.text.slice(0, 14000);
    const model = await modelRouter.selectModel('doc_qa');
    if (!model) return res.status(503).json({ error: 'No AI model available. Start Ollama.' });
    const prompts = {
      tldr: `Write a 2–3 sentence executive summary of this document. Be direct and capture the essential meaning.\n\nDocument:\n${text}`,
      keypoints: `Extract the 5–8 most important points from this document as a clean bullet list. Each point should be concise and self-contained.\n\nDocument:\n${text}`,
      full: `Create a structured summary with these sections:\n## Executive Summary\n## Key Findings\n## Important Details\n## Conclusions / Next Steps\n\nDocument:\n${text}`
    };
    const response = await ollama.generate(model, prompts[type] || prompts.tldr);
    res.json({ summary: response.response || '', type, model });
  } catch (err) {
    console.error('Summarize error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/documents/extract ───────────────────────────────
router.post('/extract', async (req, res) => {
  const { filePath, fields } = req.body;
  if (!filePath) return res.status(400).json({ error: 'filePath is required' });
  try {
    const doc = await docReader.extractText(filePath);
    if (!doc.text) return res.status(400).json({ error: 'Could not extract text from file' });
    const text = doc.text.slice(0, 10000);
    const model = await modelRouter.selectModel('extract');
    if (!model) return res.status(503).json({ error: 'No AI model available. Start Ollama.' });
    const fieldList = fields && fields.length > 0
      ? `Extract specifically: ${fields.join(', ')}`
      : 'Extract all of the following that are present: names of people, organizations, dates, monetary amounts, addresses, phone numbers, email addresses, key decisions, and action items';
    const prompt = `${fieldList} from this document. Return ONLY a valid JSON object where keys are field names and values are arrays of found items. Only include fields that actually appear in the document.\n\nDocument:\n${text}\n\nReturn valid JSON only, no other text.`;
    const response = await ollama.generate(model, prompt);
    let extracted = {};
    try {
      const match = response.response.match(/\{[\s\S]*\}/);
      if (match) extracted = JSON.parse(match[0]);
    } catch { extracted = { raw_output: response.response }; }
    res.json({ extracted, model });
  } catch (err) {
    console.error('Extract error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/documents/classify ──────────────────────────────
router.post('/classify', async (req, res) => {
  const { filePath } = req.body;
  if (!filePath) return res.status(400).json({ error: 'filePath is required' });
  try {
    const doc = await docReader.extractText(filePath);
    if (!doc.text) return res.status(400).json({ error: 'Could not extract text from file' });
    const text = doc.text.slice(0, 5000);
    const model = await modelRouter.selectModel('extract');
    if (!model) return res.status(503).json({ error: 'No AI model available. Start Ollama.' });
    const prompt = `Classify this document and return ONLY a valid JSON object with these exact fields:
- "type": one of [contract, invoice, report, email, letter, resume, technical_doc, meeting_notes, financial, legal, policy, research, other]
- "tags": array of 3–6 descriptive topic tags (lowercase, e.g. ["finance", "q4-2024", "vendor"])
- "sensitivity": one of [public, internal, confidential]
- "confidence": a number between 0 and 1
- "reason": a single sentence explaining the classification

Document (excerpt):\n${text}\n\nReturn valid JSON only, no other text.`;
    const response = await ollama.generate(model, prompt);
    let classification = {};
    try {
      const match = response.response.match(/\{[\s\S]*\}/);
      if (match) classification = JSON.parse(match[0]);
    } catch { classification = { raw_output: response.response }; }
    res.json({ classification, model });
  } catch (err) {
    console.error('Classify error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/documents/organize ──────────────────────────────
// Phase 4: Smart file organization suggestions
router.post('/organize', async (req, res) => {
  const { filePaths } = req.body;
  if (!filePaths || !filePaths.length) return res.status(400).json({ error: 'filePaths array is required' });
  try {
    const model = await modelRouter.selectModel('extract');
    if (!model) return res.status(503).json({ error: 'No AI model available.' });

    // Extract brief metadata from each file
    const fileInfo = [];
    for (const fp of filePaths.slice(0, 20)) {
      try {
        const doc = await docReader.extractText(fp);
        fileInfo.push({ path: fp, name: path.basename(fp), snippet: doc.text?.slice(0, 500) || '' });
      } catch {
        fileInfo.push({ path: fp, name: path.basename(fp), snippet: '' });
      }
    }

    const fileList = fileInfo.map(f => `- ${f.name}: ${f.snippet.slice(0, 200)}`).join('\n');
    const result = await ollama.generate(model,
      `You are a file organization expert. Analyze these files and suggest a folder structure to organize them. Return ONLY a JSON object where keys are suggested folder names and values are arrays of file names that belong there.\n\nFiles:\n${fileList}\n\nReturn valid JSON only:`
    );
    let suggestions = {};
    try {
      const match = result.response.match(/\{[\s\S]*\}/);
      if (match) suggestions = JSON.parse(match[0]);
    } catch { suggestions = { Unsorted: filePaths.map(fp => path.basename(fp)) }; }

    res.json({ suggestions, model, fileCount: filePaths.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/documents/index-directory ───────────────────────
router.post('/index-directory', async (req, res) => {
  const { directoryPath } = req.body;
  if (!directoryPath) return res.status(400).json({ error: 'directoryPath is required' });
  if (!fs.existsSync(directoryPath)) return res.status(404).json({ error: `Directory not found: ${directoryPath}` });
  const stat = fs.statSync(directoryPath);
  if (!stat.isDirectory()) return res.status(400).json({ error: `Path is not a directory: ${directoryPath}` });
  try {
    const result = await embeddingsService.indexDirectory(directoryPath, vectorStore, docReader);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('Index directory error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
