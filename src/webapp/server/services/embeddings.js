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

  async indexDirectory(directoryPath, vectorStore, docReader) {
    const supported = ['.txt', '.md', '.pdf', '.docx', '.doc', '.js', '.ts', '.py', '.go', '.rs', '.java', '.cpp', '.cs', '.json', '.yaml', '.toml', '.html', '.css', '.sql'];
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
}

module.exports = { EmbeddingsService };
