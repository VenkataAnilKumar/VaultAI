---
description: "Use when writing or editing document intelligence code: chunking, embeddings, semantic search, vector store, PDF/DOCX parsing, or Q&A citation logic for VaultAI."
applyTo: "src/webapp/server/services/**"
---

# VaultAI Document Intelligence — Coding Instructions

## Document Reading (`docReader.js`)

Supported file types and their parsers:

| Extension | Parser |
|---|---|
| `.pdf` | `pdf-parse` |
| `.docx`, `.doc` | `mammoth` (text extraction) |
| `.txt`, `.md` | `fs.readFile` (UTF-8) |
| `.py`, `.js`, `.ts`, `.go`, `.java`, `.rs`, `.cpp`, `.cs`, `.json`, `.yaml`, `.toml` | `fs.readFile` (UTF-8) |

- File size limit: **50 MB** — reject with a user-friendly error above this
- Always return `{ content: string, metadata: { filePath, fileName, fileType, sizeBytes, extractedAt } }`

## Chunking Strategy (`embeddings.js`)

```js
// Recommended chunk settings
const CHUNK_SIZE = 512;      // tokens (approximate via character split)
const CHUNK_OVERLAP = 50;    // overlap tokens between adjacent chunks

function chunkText(text, filePath) {
  // split into overlapping windows
  // return: [{ text, chunkIndex, filePath, startChar, endChar }]
}
```

- Never stuff entire large documents into the context window
- For Q&A: retrieve top-k relevant chunks, not the full document

## Embeddings (`embeddings.js`)

Always generate embeddings via Ollama — never use external embedding APIs:

```js
import { embed } from './ollama.js';

const vector = await embed('nomic-embed-text', chunkText);
// falls back to any available embedding model if nomic-embed-text absent
```

- Model: `nomic-embed-text` (fallback: any Ollama model that supports embeddings)
- Batch chunks where possible — minimize round-trips to Ollama

## Vector Store (`vectorStore.js`)

Uses `SQLite` + `sqlite-vec` extension. Schema:

```sql
CREATE TABLE embeddings (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  file_path  TEXT NOT NULL,
  chunk_idx  INTEGER NOT NULL,
  chunk_text TEXT NOT NULL,
  start_char INTEGER,
  end_char   INTEGER,
  vector     BLOB NOT NULL   -- sqlite-vec float32 array
);
```

Search pattern (cosine similarity):
```js
function search(queryVector, topK = 5) {
  // Use sqlite-vec vec_distance_cosine for ranking
  // Return: [{ file_path, chunk_text, start_char, end_char, score }]
}
```

## Document Q&A — Citation Required

Every Q&A answer **must** cite its source. Format:

```
Answer text here...

Source: contracts/acme_v2.pdf — Section 4.2 (Page 7)
```

- Include file name + chunk location in every answer
- If multiple chunks used: list all sources
- If answer cannot be found in document: say so explicitly — never hallucinate

## Context Window Management

For large documents (>10k tokens):
1. Chunk the document
2. Embed all chunks
3. Embed the user's question
4. Retrieve top-5 most similar chunks
5. Build context from retrieved chunks only
6. Include chunk metadata (page/section) in the prompt

Never send entire documents to the LLM if they exceed the model's context window.
