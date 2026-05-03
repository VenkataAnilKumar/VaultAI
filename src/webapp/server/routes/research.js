const express = require('express');
const router = express.Router();
const { WebSearchService } = require('../services/webSearch');
const { OllamaClient, ModelRouter } = require('../services/ollama');

const searcher    = new WebSearchService();
const ollama      = new OllamaClient();
const modelRouter = new ModelRouter(ollama);

// ── GET /api/research/search ────────────────────────────────────
router.get('/search', async (req, res) => {
  const { q, limit = 8 } = req.query;
  if (!q) return res.status(400).json({ error: 'q is required' });
  try {
    // Both requests fire in parallel
    const [webResults, instant] = await Promise.allSettled([
      searcher.search(q, parseInt(limit)),
      searcher.instantAnswer(q)
    ]);
    res.json({
      query:   q,
      results: webResults.status === 'fulfilled' ? webResults.value : [],
      instant: instant.status  === 'fulfilled' ? instant.value  : null,
      error:   webResults.status === 'rejected'  ? webResults.reason?.message : null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/research/deep ──────────────────────────────────────
router.post('/deep', async (req, res) => {
  const { question, maxSteps = 3 } = req.body;
  if (!question) return res.status(400).json({ error: 'question is required' });

  try {
    // Step 1: model selection + question breakdown — run concurrently
    const [model] = await Promise.all([
      modelRouter.selectModel('generate')
    ]);
    if (!model) return res.status(503).json({ error: 'No AI model available. Start Ollama.' });

    const breakdownRes = await ollama.generate(model,
      `You are a research assistant. Break this research question into ${maxSteps} focused sub-questions that together will help answer the main question. Return ONLY a JSON array of ${maxSteps} strings, no explanation.\n\nMain question: ${question}\n\nReturn format: ["sub-question 1", "sub-question 2", "sub-question 3"]`
    );

    let subQuestions = [question];
    try {
      const match = breakdownRes.response.match(/\[[\s\S]*?\]/);
      if (match) subQuestions = JSON.parse(match[0]).slice(0, parseInt(maxSteps));
    } catch { subQuestions = [question]; }

    // Step 2: Search all sub-questions IN PARALLEL (was sequential — this was the bottleneck)
    const searchSettled = await Promise.allSettled(
      subQuestions.map(sq => searcher.search(sq, 4))
    );
    const searchResults = subQuestions.map((sq, i) => ({
      question: sq,
      results:  searchSettled[i].status === 'fulfilled' ? searchSettled[i].value : []
    }));

    // Step 3: Synthesize — build context and call AI once
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
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/research/summarize-url ────────────────────────────
router.post('/summarize-url', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'url is required' });

  try {
    const axios = require('axios');
    const { htmlToText } = require('html-to-text');

    // Fetch the page and select model in parallel
    const [pageRes, model] = await Promise.all([
      axios.get(url, {
        timeout: 8000,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VaultAI/1.0)' }
      }),
      modelRouter.selectModel('doc_qa')
    ]);

    if (!model) return res.status(503).json({ error: 'No AI model available.' });

    const text = htmlToText(pageRes.data, {
      wordwrap: false,
      selectors: [
        { selector: 'nav',    format: 'skip' },
        { selector: 'footer', format: 'skip' },
        { selector: 'script', format: 'skip' },
        { selector: 'style',  format: 'skip' },
        { selector: 'header', format: 'skip' },
        { selector: 'aside',  format: 'skip' },
      ]
    }).slice(0, 6000); // tighter cap — less tokens, faster AI response

    const summaryRes = await ollama.generate(model,
      `Summarize this webpage content in 3-5 bullet points. Be concise and focus on key facts.\n\nContent:\n${text}`
    );

    res.json({ url, summary: summaryRes.response || '', model });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
