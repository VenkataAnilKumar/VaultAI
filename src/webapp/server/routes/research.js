const express = require('express');
const router = express.Router();
const { WebSearchService } = require('../services/webSearch');
const { OllamaClient, ModelRouter } = require('../services/ollama');

const searcher = new WebSearchService();
const ollama = new OllamaClient();
const modelRouter = new ModelRouter(ollama);

// ── GET /api/research/search ────────────────────────────────────
router.get('/search', async (req, res) => {
  const { q, limit = 8 } = req.query;
  if (!q) return res.status(400).json({ error: 'q is required' });
  try {
    const [webResults, instant] = await Promise.allSettled([
      searcher.search(q, parseInt(limit)),
      searcher.instantAnswer(q)
    ]);
    res.json({
      query: q,
      results: webResults.status === 'fulfilled' ? webResults.value : [],
      instant: instant.status === 'fulfilled' ? instant.value : null,
      error: webResults.status === 'rejected' ? webResults.reason?.message : null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/research/deep ──────────────────────────────────────
// Deep Research: break question → search sub-questions → synthesize
router.post('/deep', async (req, res) => {
  const { question, maxSteps = 3 } = req.body;
  if (!question) return res.status(400).json({ error: 'question is required' });

  try {
    const model = await modelRouter.selectModel('generate');
    if (!model) return res.status(503).json({ error: 'No AI model available. Start Ollama.' });

    // Step 1: Break the question into sub-questions
    const breakdownRes = await ollama.generate(model,
      `You are a research assistant. Break this research question into 3 focused sub-questions that together will help answer the main question. Return ONLY a JSON array of 3 strings.\n\nMain question: ${question}\n\nReturn format: ["sub-question 1", "sub-question 2", "sub-question 3"]`
    );

    let subQuestions = [question];
    try {
      const match = breakdownRes.response.match(/\[[\s\S]*?\]/);
      if (match) subQuestions = JSON.parse(match[0]).slice(0, parseInt(maxSteps));
    } catch { subQuestions = [question]; }

    // Step 2: Search for each sub-question
    const searchResults = [];
    for (const sq of subQuestions) {
      try {
        const results = await searcher.search(sq, 4);
        searchResults.push({ question: sq, results });
      } catch {
        searchResults.push({ question: sq, results: [] });
      }
    }

    // Step 3: Synthesize all results into a comprehensive report
    const contextText = searchResults.map(sr => {
      const snippets = sr.results.map((r, i) => `[${i + 1}] ${r.title}: ${r.snippet}`).join('\n');
      return `Sub-question: ${sr.question}\nSources:\n${snippets}`;
    }).join('\n\n---\n\n');

    const reportRes = await ollama.generate(model,
      `You are a research analyst. Write a comprehensive, well-structured research report answering the main question based on the web search results below.\n\nMain Question: ${question}\n\nSearch Results:\n${contextText}\n\nWrite a detailed report with sections: ## Overview, ## Key Findings, ## Analysis, ## Conclusion. Cite sources using [source title] notation. Be factual and balanced.`
    );

    res.json({
      question,
      subQuestions,
      searchResults,
      report: reportRes.response || '',
      model
    });
  } catch (err) {
    console.error('Deep research error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/research/summarize-url ────────────────────────────
// Fetch a URL and summarize it
router.post('/summarize-url', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'url is required' });

  try {
    const axios = require('axios');
    const { htmlToText } = require('html-to-text');

    const pageRes = await axios.get(url, {
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VaultAI/1.0)' }
    });

    const text = htmlToText(pageRes.data, {
      wordwrap: false,
      selectors: [
        { selector: 'nav', format: 'skip' },
        { selector: 'footer', format: 'skip' },
        { selector: 'script', format: 'skip' },
        { selector: 'style', format: 'skip' }
      ]
    }).slice(0, 8000);

    const model = await modelRouter.selectModel('doc_qa');
    if (!model) return res.status(503).json({ error: 'No AI model available.' });

    const summaryRes = await ollama.generate(model,
      `Summarize this webpage content in 3-5 bullet points. Be concise and focus on key facts.\n\nContent:\n${text}`
    );

    res.json({ url, summary: summaryRes.response || '', model });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
