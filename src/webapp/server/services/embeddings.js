const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

class EmbeddingsService {
  constructor(ollamaClient, modelRouter) {
    this.ollama = ollamaClient;
    this.router = modelRouter;
  }

  async getEmbedding(text) {
    const model = await this.router.selectModel('embedding');
    if (!model) throw new Error('No embedding model available');
    return await this.ollama.embeddings(model, text);
  }

  // ── HyDE: Hypothetical Document Embeddings ────────────────────
  // Generate a hypothetical answer to the query, then embed that.
  // The hypothetical answer is stylistically closer to real document
  // chunks, dramatically improving retrieval accuracy.
  async getHyDEEmbedding(query) {
    try {
      const model = await this.router.selectModel('doc_qa');
      if (!model) return this.getEmbedding(query); // fallback to naive

      const hypothetical = await this.ollama.generate(model,
        `Write a short paragraph (3-5 sentences) that directly answers this question as if it came from a document:\n\nQuestion: ${query}\n\nAnswer (be factual and specific):`
      );
      const hypotheticalText = hypothetical.response?.trim() || query;
      return this.getEmbedding(hypotheticalText);
    } catch {
      return this.getEmbedding(query); // fallback to naive on any error
    }
  }

  async indexDirectory(directoryPath, vectorStore, docReader) {
    const supported = ['.txt', '.md', '.markdown', '.rst', '.log', '.pdf', '.docx', '.doc', '.xlsx', '.xls', '.csv', '.js', '.ts', '.jsx', '.tsx', '.py', '.go', '.rs', '.java', '.cpp', '.c', '.cs', '.rb', '.php', '.sh', '.yaml', '.yml', '.toml', '.json', '.xml', '.html', '.css', '.sql'];
    let indexed = 0, skipped = 0, errors = [];

    function walk(dir) {
      let entries;
      try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return []; }
      const files = [];
      for (const e of entries) {
        const fullPath = path.join(dir, e.name);
        if (e.isDirectory()) {
          if (!e.name.startsWith('.') && e.name !== 'node_modules') {
            files.push(...walk(fullPath));
          }
        } else if (supported.includes(path.extname(e.name).toLowerCase())) {
          files.push(fullPath);
        }
      }
      return files;
    }

    const files = walk(directoryPath);

    for (const filePath of files) {
      try {
        let stat;
        try { stat = fs.statSync(filePath); } catch { errors.push({ file: filePath, error: 'stat failed' }); continue; }

        const hash = crypto.createHash('md5').update(filePath + stat.mtime.toISOString()).digest('hex');
        if (vectorStore.isIndexed(filePath, hash)) { skipped++; continue; }

        const doc = await docReader.extractText(filePath);
        if (!doc.text) { skipped++; continue; }

        const chunks = docReader.chunkText(doc.text);
        for (const chunk of chunks) {
          const embedding = await this.getEmbedding(chunk.chunk);
          vectorStore.upsertChunk(filePath, chunk.index, chunk.chunk, embedding, hash);
        }
        indexed++;
      } catch (err) {
        errors.push({ file: filePath, error: err.message });
      }
    }

    return { indexed, skipped, errors };
  }

  // Naive RAG search (Phase 1 default)
  async searchSemantic(query, topK = 10, directoryFilter, vectorStore) {
    const queryEmbedding = await this.getEmbedding(query);
    const results = vectorStore.search(queryEmbedding, topK, directoryFilter || null);
    return results.map(r => ({
      filePath: r.filePath,
      excerpt: r.chunk.slice(0, 300),
      score: r.score,
      chunkIndex: r.chunkIndex
    }));
  }

  // HyDE-enhanced search (Phase 2) — better recall for doc Q&A
  async searchHyDE(query, topK = 10, filePathFilter, vectorStore) {
    const hydeEmbedding = await this.getHyDEEmbedding(query);
    const filter = filePathFilter || null;
    const results = vectorStore.search(hydeEmbedding, topK, filter);
    return results.map(r => ({
      filePath: r.filePath,
      excerpt: r.chunk.slice(0, 400),
      score: r.score,
      chunkIndex: r.chunkIndex
    }));
  }
}

module.exports = { EmbeddingsService };
