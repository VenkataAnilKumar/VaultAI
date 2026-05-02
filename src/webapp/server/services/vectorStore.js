const path = require('path');
const os = require('os');

class VectorStore {
  constructor(dbPath = path.join(os.homedir(), 'vault-ai-vectors.db')) {
    this.dbPath = dbPath;
    this.db = null;
  }

  initialize() {
    const Database = require('better-sqlite3');
    this.db = new Database(this.dbPath);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filePath TEXT NOT NULL,
        chunkIndex INTEGER NOT NULL,
        chunk TEXT NOT NULL,
        embedding BLOB NOT NULL,
        fileHash TEXT NOT NULL,
        indexedAt TEXT NOT NULL,
        UNIQUE(filePath, chunkIndex)
      );
      CREATE INDEX IF NOT EXISTS idx_filepath ON documents(filePath);
    `);
  }

  cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dot += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dot / denom;
  }

  embeddingToBuffer(embedding) {
    return Buffer.from(new Float32Array(embedding).buffer);
  }

  bufferToEmbedding(buf) {
    return Array.from(new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4));
  }

  upsertChunk(filePath, chunkIndex, chunk, embedding, fileHash) {
    if (!this.db) this.initialize();
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO documents (filePath, chunkIndex, chunk, embedding, fileHash, indexedAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(filePath, chunkIndex, chunk, this.embeddingToBuffer(embedding), fileHash, new Date().toISOString());
  }

  search(queryEmbedding, topK = 10, directoryFilter = null) {
    if (!this.db) this.initialize();
    let rows;
    if (directoryFilter) {
      rows = this.db.prepare('SELECT * FROM documents WHERE filePath LIKE ?').all(`${directoryFilter}%`);
    } else {
      rows = this.db.prepare('SELECT * FROM documents').all();
    }

    const scored = rows.map(row => {
      const embedding = this.bufferToEmbedding(row.embedding);
      const score = this.cosineSimilarity(queryEmbedding, embedding);
      return { filePath: row.filePath, chunk: row.chunk, score, chunkIndex: row.chunkIndex };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }

  isIndexed(filePath, fileHash) {
    if (!this.db) this.initialize();
    const row = this.db.prepare('SELECT 1 FROM documents WHERE filePath = ? AND fileHash = ? LIMIT 1').get(filePath, fileHash);
    return !!row;
  }

  getIndexedFiles() {
    if (!this.db) this.initialize();
    const rows = this.db.prepare(`
      SELECT filePath, COUNT(*) as chunkCount, MAX(indexedAt) as indexedAt
      FROM documents GROUP BY filePath
    `).all();
    return rows;
  }

  deleteFile(filePath) {
    if (!this.db) this.initialize();
    this.db.prepare('DELETE FROM documents WHERE filePath = ?').run(filePath);
  }
}

module.exports = { VectorStore };
