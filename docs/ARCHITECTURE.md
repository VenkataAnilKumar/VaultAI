# Vault AI — Technical Architecture

> Privacy-first, local AI-powered document intelligence platform.
> All AI runs via Ollama. No cloud. No telemetry. No data leaves the machine.

**Version:** 1.0 Draft  
**Date:** May 2026  
**Status:** Architecture Review

---

## Table of Contents

1. [Guiding Principles](#1-guiding-principles)
2. [System Overview](#2-system-overview)
3. [High-Level Architecture Diagram](#3-high-level-architecture-diagram)
4. [Frontend Architecture](#4-frontend-architecture)
5. [Backend Architecture](#5-backend-architecture)
6. [AI Layer — Ollama Integration](#6-ai-layer--ollama-integration)
7. [Document Intelligent Agent Architecture](#7-document-intelligent-agent-architecture)
8. [Data Storage Architecture](#8-data-storage-architecture)
9. [Web Search & Deep Research Architecture](#9-web-search--deep-research-architecture)
10. [Security & Privacy Model](#10-security--privacy-model)
11. [Data Flow Diagrams](#11-data-flow-diagrams)
12. [Tech Stack Decisions](#12-tech-stack-decisions)
13. [Scalability Considerations](#13-scalability-considerations)
14. [API Design](#14-api-design)
15. [Deployment Model](#15-deployment-model)
16. [Open Questions & Decisions](#16-open-questions--decisions)

---

## 1. Guiding Principles

Every architectural decision in Vault AI must satisfy these principles in order:

| # | Principle | What it means |
|---|-----------|---------------|
| 1 | **Local-first** | All AI inference, embeddings, and data processing happen on the user's machine |
| 2 | **Privacy by design** | No telemetry, no analytics, no network calls except those the user explicitly initiates |
| 3 | **No mandatory cloud** | The app works fully offline except for Web Search and Deep Research (user-initiated) |
| 4 | **Ollama as the AI runtime** | Single, consistent interface to all AI models — chat, vision, embeddings, generation |
| 5 | **File system as the source of truth** | Documents live on disk in standard formats; Vault AI never moves or locks user data |
| 6 | **Zero vendor lock-in** | No proprietary file formats, no SaaS dependencies |

---

## 2. System Overview

Vault AI is a **locally-hosted web application** that runs on the user's machine and is accessed via a browser. It consists of:

- A **React frontend** (the UI the user interacts with)
- A **Node.js/Express backend** (the orchestration layer)
- **Ollama** (the local AI inference runtime, runs as a separate process)
- A **local SQLite database** (metadata, vector store, session history, settings)
- The **user's file system** (source of truth for all documents)

```
User's Browser
      │
      ▼
React Frontend (Vite · port 5173)
      │  HTTP / REST / SSE
      ▼
Express Backend (Node.js · port 3001)
      │                    │
      ▼                    ▼
Ollama Runtime      Local SQLite DB
(port 11434)        (metadata + vectors)
      │
      ▼
Local AI Models
(llama3, llava, nomic-embed-text, etc.)
```

---

## 3. High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        USER'S MACHINE                        │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                   VAULT AI APP                        │  │
│  │                                                      │  │
│  │  ┌─────────────┐        ┌──────────────────────┐    │  │
│  │  │   BROWSER   │◄──────►│   EXPRESS BACKEND    │    │  │
│  │  │             │  HTTP  │                      │    │  │
│  │  │  React UI   │  REST  │  ┌────────────────┐  │    │  │
│  │  │  (Vite)     │  SSE   │  │  API Routes    │  │    │  │
│  │  │             │        │  │  /api/chat     │  │    │  │
│  │  │  - Chat     │        │  │  /api/docs     │  │    │  │
│  │  │  - Docs     │        │  │  /api/search   │  │    │  │
│  │  │  - Search   │        │  │  /api/research │  │    │  │
│  │  │  - Research │        │  │  /api/generate │  │    │  │
│  │  │  - Skills   │        │  └────────────────┘  │    │  │
│  │  │  - Settings │        │                      │    │  │
│  │  └─────────────┘        │  ┌────────────────┐  │    │  │
│  │                         │  │  Agent Layer   │  │    │  │
│  │                         │  │  - DocAgent    │  │    │  │
│  │                         │  │  - ResearchAgt │  │    │  │
│  │                         │  │  - Orchestratr │  │    │  │
│  │                         │  └────────────────┘  │    │  │
│  │                         │                      │    │  │
│  │                         │  ┌────────────────┐  │    │  │
│  │                         │  │  Services      │  │    │  │
│  │                         │  │  - OllamaClient│  │    │  │
│  │                         │  │  - Parser      │  │    │  │
│  │                         │  │  - Embeddings  │  │    │  │
│  │                         │  │  - VectorStore │  │    │  │
│  │                         │  │  - FileOps     │  │    │  │
│  │                         │  │  - WebFetcher  │  │    │  │
│  │                         │  └────────────────┘  │    │  │
│  │                         └──────────┬───────────┘    │  │
│  │                                    │                 │  │
│  │          ┌─────────────────────────┼──────────────┐ │  │
│  │          │                         │              │ │  │
│  │          ▼                         ▼              ▼ │  │
│  │  ┌──────────────┐   ┌──────────────────┐  ┌──────┐ │  │
│  │  │    OLLAMA    │   │   SQLITE (local)  │  │ FILE │ │  │
│  │  │              │   │                  │  │  SYS │ │  │
│  │  │  Chat models │   │  - doc_metadata  │  │      │ │  │
│  │  │  llama3      │   │  - embeddings    │  │ PDFs │ │  │
│  │  │  Vision      │   │  - sessions      │  │ DOCX │ │  │
│  │  │  llava       │   │  - skills        │  │ TXT  │ │  │
│  │  │  Embeddings  │   │  - search_cache  │  │ CSV  │ │  │
│  │  │  nomic-embed │   │  - watcher_rules │  │ etc. │ │  │
│  │  └──────────────┘   └──────────────────┘  └──────┘ │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          EXTERNAL (user-initiated only)               │  │
│  │   DuckDuckGo (Web Search · Image Search)             │  │
│  │   Target websites (Deep Research page fetching)      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Frontend Architecture

### Stack
| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | React 18 | Component model, hooks, ecosystem |
| Build tool | Vite | Fast HMR, simple config |
| State management | Zustand | Lightweight, no boilerplate, persist middleware |
| Styling | Tailwind CSS + CSS custom properties | Utility classes + design tokens for theming |
| HTTP client | Axios | Interceptors, timeout, error handling |
| Icons | Lucide React | Consistent, tree-shakeable |
| Markdown rendering | react-markdown + remark-gfm | For AI responses and document previews |
| Diff rendering | diff-match-patch + custom view | Document comparison |

### Directory Structure
```
client/src/
├── api/
│   └── client.js              # All API calls — single source of truth
├── components/
│   ├── Chat.jsx               # Main chat interface
│   ├── MessageBubble.jsx      # Individual message renderer
│   ├── FileBrowser.jsx        # File system navigator
│   ├── SkillsPanel.jsx        # Skills grid
│   ├── SettingsPanel.jsx      # Settings overlay
│   ├── SessionHistory.jsx     # Thread list in sidebar
│   ├── WebSearchPanel.jsx     # Web + image search
│   ├── ResearchPanel.jsx      # Deep research interface
│   ├── GeneratePanel.jsx      # Document generation
│   ├── StatusBar.jsx          # Bottom status bar
│   ├── ConfirmDialog.jsx      # Destructive action confirmation
│   ├── document/              # Document Intelligent Agent UI
│   │   ├── DocumentAgent.jsx  # Main document workspace
│   │   ├── DocLibrary.jsx     # Document library tree
│   │   ├── DocViewer.jsx      # Document preview pane
│   │   ├── DocChat.jsx        # Document Q&A chat
│   │   ├── DocExtract.jsx     # Extraction results
│   │   ├── DocDiff.jsx        # Side-by-side diff view
│   │   ├── DocAudit.jsx       # Privacy audit report
│   │   └── DocBatch.jsx       # Batch operations panel
│   ├── agents/                # Agent workflow components
│   ├── connectors/            # Connector management UI
│   └── mcp/                   # MCP tools UI
├── hooks/
│   ├── useTheme.js            # Dark/light/system theme
│   ├── useSessionHistory.js   # Chat session persistence
│   ├── useDocumentAgent.js    # Document agent state
│   └── useResearch.js         # Research session state
├── store/
│   └── useStore.js            # Global Zustand store
└── App.jsx                    # Root layout, nav, routing
```

### State Management Model
```
Zustand Store (useStore.js)
├── UI State
│   ├── activeTab
│   ├── sidebarOpen
│   └── settingsOpen
├── Connection State
│   ├── ollamaConnected
│   ├── availableModels
│   └── selectedModel
├── Chat State
│   ├── messages[]
│   ├── isLoading
│   ├── pendingAction
│   └── workflowMode
├── File State
│   └── workingDirectory
└── Document Agent State
    ├── loadedDocuments[]
    ├── activeDocumentId
    ├── indexedLibraries[]
    └── extractionResults{}
```

### Theming System
- Design tokens stored as CSS custom properties on `:root`
- Dark mode overrides on `[data-theme="dark"]`
- `useTheme` hook applies `data-theme` to `document.documentElement`
- Persisted to `localStorage`

---

## 5. Backend Architecture

### Stack
| Layer | Technology | Why |
|-------|-----------|-----|
| Runtime | Node.js 20+ | Native fetch, async/await, large ecosystem |
| Framework | Express 4 | Minimal, flexible, well-understood |
| Process manager | nodemon (dev) | Auto-restart on change |
| HTTP client | Axios | Ollama API calls, web page fetching |
| File parsing | pdf-parse, mammoth, xlsx | Multi-format document ingestion |
| HTML parsing | html-to-text, cheerio | Web page content extraction |
| Database | better-sqlite3 | Synchronous SQLite — simple, fast, local |
| Vector ops | Custom (float32 cosine similarity) | No external vector DB dependency |
| File operations | fs-extra | Enhanced fs with copy/move/ensure |
| Process watching | chokidar | Folder watcher for auto-processing |

### Directory Structure
```
server/
├── index.js                   # Entry point, middleware, route mounting
├── routes/
│   ├── chat.js                # POST /api/chat
│   ├── files.js               # GET/POST /api/files
│   ├── models.js              # GET /api/models, /api/models/status
│   ├── search.js              # GET /api/search (semantic file search)
│   ├── websearch.js           # GET /api/websearch (DuckDuckGo)
│   ├── research.js            # POST /api/research (SSE streaming)
│   ├── generate.js            # POST /api/generate/*
│   ├── documents.js           # POST /api/documents/* (Doc Agent)
│   ├── agents.js              # POST /api/agents/run
│   ├── connectors.js          # GET/POST /api/connectors/*
│   └── mcp.js                 # GET/POST /api/mcp/*
├── agents/
│   ├── orchestrator.js        # Multi-agent task orchestration
│   ├── runner.js              # Agent execution engine
│   ├── documentAgent.js       # Document Intelligence Agent
│   └── researchAgent.js       # Deep Research Agent
├── services/
│   ├── ollama.js              # OllamaClient + ModelRouter
│   ├── parser.js              # Multi-format document parser
│   ├── chunker.js             # Smart text chunking
│   ├── embeddings.js          # Embedding generation via Ollama
│   ├── vectorStore.js         # SQLite-backed vector store
│   ├── fileOps.js             # File system operations
│   ├── webFetcher.js          # Web page fetching + HTML stripping
│   ├── watcher.js             # Folder watcher (chokidar)
│   └── genAI.js               # High-level AI generation workflows
├── tools/
│   ├── fileTools.js           # Tool definitions for AI tool-use
│   └── documentTools.js       # Document-specific tool definitions
├── connectors/
│   ├── registry.js            # Connector registry
│   ├── obsidian.js
│   ├── git.js
│   ├── sqlite.js
│   ├── email.js
│   └── bookmarks.js
├── mcp/
│   ├── registry.js            # MCP tool registry
│   └── server.js              # MCP server implementation
└── db/
    ├── database.js            # SQLite connection + migrations
    └── schema.sql             # Database schema
```

---

## 6. AI Layer — Ollama Integration

### OllamaClient
All AI calls go through a single `OllamaClient` class. Never call Ollama directly from routes.

```
OllamaClient
├── chat(model, messages, tools, stream)   → /api/chat
├── generate(model, prompt, options)       → /api/generate
├── embeddings(model, text)                → /api/embeddings
├── listModels()                           → /api/tags
└── isConnected()                          → /api/tags (health check)
```

### ModelRouter
Routes tasks to the best available model based on capability:

| Task Type | Preferred Models (in order) |
|-----------|----------------------------|
| General chat | llama3.2, llama3.1, mistral, gemma2 |
| Code | qwen2.5-coder, deepseek-coder, codellama |
| Vision (image analysis) | llava, bakllava, minicpm-v |
| Embeddings | nomic-embed-text, mxbai-embed-large, all-minilm |
| Long document | llama3.1:70b, mistral:7b (large context) |
| Fast classification | llama3.2:3b, phi3:mini |

### Recommended Minimum Model Set
```
ollama pull llama3.2          # General chat, Q&A, summarization
ollama pull nomic-embed-text  # Embeddings for RAG and search
ollama pull llava             # Vision / image analysis (optional)
```

### Model Context Window Management
| Document size | Strategy |
|--------------|----------|
| < 4K tokens | Send full content in context |
| 4K–16K tokens | Send with summarized context window |
| > 16K tokens | Chunk + embed → RAG retrieval |

---

## 7. Document Intelligent Agent Architecture

The Document Intelligent Agent is the most complex component. It follows a pipeline architecture:

### Pipeline Overview
```
Input (file path or upload)
         │
         ▼
   ┌───────────┐
   │  PARSER   │  Reads the file, extracts raw text + structure
   └─────┬─────┘  (pdf-parse, mammoth, xlsx, html-to-text, vision OCR)
         │
         ▼
   ┌───────────┐
   │  CHUNKER  │  Splits text into overlapping chunks
   └─────┬─────┘  preserving section boundaries
         │
         ▼
   ┌────────────┐
   │ EMBEDDINGS │  Generates vector embeddings for each chunk
   └─────┬──────┘  via Ollama (nomic-embed-text)
         │
         ▼
   ┌─────────────┐
   │ VECTOR STORE│  Stores chunks + embeddings in SQLite
   └─────┬───────┘  indexed by document ID
         │
         ▼
   ┌─────────────────────────────────────────┐
   │            AGENT CAPABILITIES           │
   │                                         │
   │  Q&A        Extract     Summarize       │
   │  Classify   Compare     Draft           │
   │  Audit      Transform   Monitor         │
   └─────────────────────────────────────────┘
         │
         ▼
   ┌──────────┐
   │  OUTPUT  │  JSON, Markdown, saved file, UI response
   └──────────┘
```

### Parser Layer

Supports all formats through a unified interface:

```javascript
// Unified output format from all parsers
{
  text: string,          // Full extracted text
  pages: Page[],         // Per-page content (PDF, PPTX)
  sections: Section[],   // Named sections/headings
  tables: Table[],       // Extracted table data
  metadata: {
    title, author, created, modified,
    pageCount, wordCount, format
  }
}
```

| Format | Library | Notes |
|--------|---------|-------|
| PDF | pdf-parse | Text + page numbers |
| DOCX | mammoth | Preserves heading structure |
| XLSX/CSV | xlsx | Sheet → JSON rows |
| TXT/MD | built-in | Direct read |
| Images | Ollama vision (llava) | OCR via vision model |
| Email | mailparser | Extracts all fields + attachments |
| PPTX | future: pptx-parser | Per-slide content |

### Chunking Strategy

Smart chunking respects document structure:

```
Strategy: Section-aware chunking

1. Split on headings (H1, H2, H3) first
2. Within sections, chunk at paragraph boundaries
3. Target chunk size: 512 tokens (~400 words)
4. Overlap: 64 tokens (~50 words) between chunks
5. Store: chunk_index, section_title, page_number, char_offset

Result: Chunks that preserve semantic context
        and enable precise citation (page + section)
```

### Embedding & Vector Store

```
Embedding Model: nomic-embed-text (768 dimensions)
Storage: SQLite table (embeddings)
Similarity: Cosine similarity (float32 dot product)
Index: Chunk ID → document ID → file path

Query flow:
1. Embed the user's question
2. Cosine similarity against all chunks for target doc(s)
3. Return top-K chunks (default K=5)
4. Build context: [system prompt] + [top-K chunks] + [user question]
5. Send to Ollama chat → get cited answer
```

### Document Agent State Machine

```
IDLE
  │
  ├──[upload/select file]──► PARSING
  │                              │
  │                         [parsed]──► CHUNKING
  │                                         │
  │                                    [chunked]──► EMBEDDING
  │                                                     │
  │                                              [embedded]──► READY
  │                                                               │
  │                    ┌──────────────────────────────────────────┤
  │                    │                                          │
  │               [user asks]                              [batch op]
  │                    │                                          │
  │                    ▼                                          ▼
  │               RETRIEVING                              PROCESSING
  │                    │                                          │
  │               [chunks found]                         [complete]
  │                    │                                          │
  │               GENERATING                                 READY
  │                    │
  │               [response]──► READY
```

---

## 8. Data Storage Architecture

### Database: SQLite (local, single file)

**Location:** `~/.vault-ai/vault.db`

### Schema

```sql
-- Documents indexed by the Document Agent
CREATE TABLE documents (
  id            TEXT PRIMARY KEY,
  file_path     TEXT NOT NULL UNIQUE,
  file_name     TEXT NOT NULL,
  format        TEXT NOT NULL,          -- pdf, docx, csv, txt, etc.
  size_bytes    INTEGER,
  word_count    INTEGER,
  page_count    INTEGER,
  indexed_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL,
  summary_tldr  TEXT,
  summary_full  TEXT,
  doc_type      TEXT,                   -- contract, invoice, report, etc.
  sensitivity   TEXT,                   -- public, internal, confidential
  tags          TEXT,                   -- JSON array
  metadata      TEXT                    -- JSON blob (author, created, etc.)
);

-- Text chunks from parsed documents
CREATE TABLE chunks (
  id            TEXT PRIMARY KEY,
  document_id   TEXT NOT NULL REFERENCES documents(id),
  chunk_index   INTEGER NOT NULL,
  content       TEXT NOT NULL,
  section_title TEXT,
  page_number   INTEGER,
  token_count   INTEGER,
  char_offset   INTEGER
);

-- Vector embeddings (one row per chunk)
CREATE TABLE embeddings (
  chunk_id      TEXT PRIMARY KEY REFERENCES chunks(id),
  document_id   TEXT NOT NULL,
  embedding     BLOB NOT NULL           -- float32 binary blob (768 dims)
);

-- Chat session history
CREATE TABLE sessions (
  id            TEXT PRIMARY KEY,
  title         TEXT NOT NULL,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL,
  messages      TEXT NOT NULL,          -- JSON array
  doc_context   TEXT                    -- JSON array of document IDs in context
);

-- Custom user skills
CREATE TABLE skills (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  icon          TEXT,
  description   TEXT,
  prompt        TEXT NOT NULL,
  category      TEXT,
  is_builtin    INTEGER DEFAULT 0,
  created_at    TEXT NOT NULL
);

-- Folder watcher rules
CREATE TABLE watchers (
  id            TEXT PRIMARY KEY,
  folder_path   TEXT NOT NULL,
  actions       TEXT NOT NULL,          -- JSON: ["classify", "summarize", "alert"]
  alert_rules   TEXT,                   -- JSON: conditions for alerts
  active        INTEGER DEFAULT 1,
  created_at    TEXT NOT NULL,
  last_run      TEXT
);

-- Web search and research history
CREATE TABLE search_history (
  id            TEXT PRIMARY KEY,
  query         TEXT NOT NULL,
  type          TEXT NOT NULL,          -- web, image, research
  results       TEXT,                   -- JSON cache
  created_at    TEXT NOT NULL
);

-- App settings
CREATE TABLE settings (
  key           TEXT PRIMARY KEY,
  value         TEXT NOT NULL
);
```

### File System Layout

```
~/.vault-ai/
├── vault.db               # SQLite database (all metadata + vectors)
├── config.json            # App configuration (port, Ollama URL, etc.)
├── exports/               # Exported reports and documents
├── summaries/             # Auto-generated summaries (mirror of file structure)
└── logs/
    └── vault-ai.log       # Application logs

[User's documents stay exactly where they are — never moved]
```

---

## 9. Web Search & Deep Research Architecture

### Web Search

```
Client                    Backend                     DuckDuckGo
  │                          │                             │
  │──GET /api/websearch?q=──►│                             │
  │                          │──GET html.duckduckgo.com──►│
  │                          │◄──HTML response─────────────│
  │                          │                             │
  │                          │ [parse: titles, URLs,       │
  │                          │  snippets, display URLs]    │
  │                          │                             │
  │◄──JSON results───────────│                             │
```

**DuckDuckGo HTML parser extracts:**
- Result title (`.result__a`)
- Display URL (`.result__url`)
- Snippet (`.result__snippet`)
- Actual destination URL (decoded from redirect)

**Image Search (DuckDuckGo two-step):**
```
Step 1: GET duckduckgo.com?q=QUERY&iax=images&ia=images
        → Extract vqd token from HTML

Step 2: GET duckduckgo.com/i.js?q=QUERY&vqd=TOKEN&o=json
        → Returns image results with thumbnail URLs
```

### Deep Research Agent

```
Client                     ResearchAgent              Ollama
  │                             │                        │
  │──POST /api/research (SSE)──►│                        │
  │                             │                        │
  │◄─[step: searching]──────────│                        │
  │                             │──search DuckDuckGo     │
  │◄─[step: found N sources]────│                        │
  │                             │──fetch each URL        │
  │                             │──strip HTML            │
  │◄─[step: reading source 1]───│                        │
  │                             │──summarize src 1──────►│
  │                             │◄──summary 1────────────│
  │◄─[step: reading source 2]───│                        │
  │                             │  ... (per source) ...  │
  │◄─[step: synthesizing]───────│                        │
  │                             │──synthesize all sums──►│
  │                             │◄──final report──────────│
  │◄─[result: full report]──────│                        │
  │◄─[done]─────────────────────│                        │
```

**SSE Event Types:**
```json
{ "type": "step",   "title": "Searching DuckDuckGo...", "status": "running" }
{ "type": "step",   "title": "Found 5 sources",         "status": "done" }
{ "type": "source", "index": 1, "url": "...", "title": "..." }
{ "type": "step",   "title": "Summarizing source 1/5",  "status": "running" }
{ "type": "step",   "title": "Synthesizing report...",  "status": "running" }
{ "type": "result", "report": "# Research Report\n...", "citations": [...] }
{ "type": "done" }
```

---

## 10. Security & Privacy Model

### Data Isolation

| Data type | Where it lives | Ever leaves machine? |
|-----------|---------------|---------------------|
| Documents | User's file system | Never |
| Embeddings | `~/.vault-ai/vault.db` | Never |
| Chat history | `~/.vault-ai/vault.db` | Never |
| AI inference | Ollama (local) | Never |
| Web search queries | DuckDuckGo (user-initiated) | Yes, but no account/tracking |
| Research page fetches | Target websites (user-initiated) | Yes, request headers only |

### Vault Encryption (Phase 4)
- Algorithm: AES-256-GCM
- Key derivation: PBKDF2 (100,000 iterations, SHA-256)
- Salt: 32-byte random, stored alongside encrypted file
- IV: 16-byte random per encryption operation
- Implementation: Node.js built-in `crypto` module — no external library
- Passphrase: never stored; derived key held in memory only during active session

### Network Exposure
- Backend binds to `127.0.0.1:3001` (localhost only — not exposed to network)
- Vite dev server: `0.0.0.0:5173` (exposed for Replit preview — production: localhost only)
- Ollama: `127.0.0.1:11434` (default — localhost only)
- No inbound ports required

### Content Security
- No arbitrary code execution from AI output
- File operations validated against working directory (no path traversal)
- Destructive operations require explicit user confirmation
- All file paths sanitized before OS calls

---

## 11. Data Flow Diagrams

### Flow 1: Document Upload → Q&A Answer

```
User drops PDF onto Document Agent
           │
           ▼
     [parser.js]
     pdf-parse → extracts text, pages, metadata
           │
           ▼
     [chunker.js]
     Split into 512-token chunks with 64-token overlap
           │
           ▼
     [embeddings.js]
     For each chunk:
       POST localhost:11434/api/embeddings
       model: nomic-embed-text
       → float32[768] vector
           │
           ▼
     [vectorStore.js]
     INSERT INTO chunks (...)
     INSERT INTO embeddings (chunk_id, embedding BLOB)
           │
           ▼
     Document status → READY (shown in UI)
           │
           ▼ [user types a question]
           │
     [vectorStore.js]
     Embed the question (same model)
     Cosine similarity against all chunks for this doc
     → Top 5 chunks retrieved
           │
           ▼
     [ollama.js]
     Build messages:
       system: "Answer using these document excerpts: [chunks]"
       user: "What are the payment terms?"
     POST localhost:11434/api/chat
     model: llama3.2
           │
           ▼
     Response with cited page numbers
     → Displayed in DocChat UI
```

### Flow 2: Deep Research

```
User: "How does transformer attention work?"
depth: Standard (5 sources)
           │
           ▼
     researchAgent.run(query, depth=5)
           │
           ├──[1] webFetcher.search(query) → DuckDuckGo → top 5 URLs
           │  SSE: { type:"step", title:"Found 5 sources" }
           │
           ├──[2] For each URL (parallel, max 3 concurrent):
           │     fetch(url, timeout:10s)
           │     html-to-text → clean text
           │     truncate to 4000 chars
           │  SSE: { type:"source", index:1, url:..., title:... }
           │
           ├──[3] For each source (sequential):
           │     ollama.chat(fastModel, summarizePrompt + sourceText)
           │     → 150-word summary
           │  SSE: { type:"step", title:"Summarizing source 1/5" }
           │
           └──[4] ollama.chat(mainModel, synthesizePrompt + allSummaries)
                  → Full Markdown report with citations
              SSE: { type:"result", report:"# Research Report\n..." }
```

### Flow 3: Chat with File Tool Use

```
User: "Find all PDFs in my Documents folder"
           │
           ▼
     chat.js → buildSystemPrompt + FILE_TOOLS
           │
           ▼
     ollama.chat(model, messages, tools)
     → response.tool_calls: [{ name:"list_directory", args:{path:"~/Documents"} }]
           │
           ▼
     fileOps.executeTool("list_directory", { path:"~/Documents" })
     → { files: [...], dirs: [...] }
           │
           ▼
     ollama.chat(model, [...messages, toolResult])
     → "I found 12 PDF files in your Documents folder: ..."
           │
           ▼
     Response shown in Chat UI
```

---

## 12. Tech Stack Decisions

### Confirmed Choices

| Decision | Choice | Rationale |
|----------|--------|-----------|
| AI runtime | Ollama | Only production-quality local AI runtime; supports all needed model types |
| Embedding model | nomic-embed-text | Best quality/speed ratio for local embeddings; 768 dims; fits in 2GB RAM |
| Vector storage | SQLite (custom) | No external service; cosine similarity on float32 blobs is fast enough for <100K chunks |
| Database | better-sqlite3 | Synchronous API fits Node.js event loop; excellent performance; zero config |
| Frontend | React + Vite | Proven, fast, great DX; Vite HMR essential for rapid iteration |
| State | Zustand | Minimal boilerplate; persist middleware for localStorage; no Redux complexity |
| Web search | DuckDuckGo HTML | No API key; privacy-aligned; reliable HTML endpoint |
| File parsing | pdf-parse + mammoth | Most reliable open-source parsers for PDF and DOCX |
| Styling | Tailwind + CSS vars | Utility classes for components; CSS vars for design tokens and theming |

### Considered and Rejected

| Option | Rejected because |
|--------|-----------------|
| LangChain | Too heavy, opinionated, abstracts too much; Ollama SDK is simpler for our needs |
| ChromaDB / Qdrant | External process dependency; SQLite achieves same result locally |
| Electron | Too complex for current phase; PWA achieves desktop-feel with less overhead |
| Next.js | SSR not needed; Vite is faster and simpler for a local SPA |
| MongoDB | Overkill; SQLite covers all use cases without a server process |
| Brave Search API | Requires API key; DuckDuckGo is key-free and more privacy-aligned |

### Open for Discussion

| Decision | Options | Recommended |
|----------|---------|-------------|
| Long-doc chunking | Fixed-size / Sentence / Semantic | Sentence-aware with fixed fallback |
| Re-ranking | No re-ranking / Cross-encoder | No re-ranking for now (keep deps minimal) |
| Streaming chat | No / Yes (SSE) | Yes — improves perceived performance |
| PDF table extraction | pdf-parse (text only) / Camelot | pdf-parse for now; Camelot in Phase 2 |

---

## 13. Scalability Considerations

### Target Hardware Profile
Vault AI should work well on:
- CPU: Apple M1 / M2 or Intel i7 8th gen+
- RAM: 8GB minimum, 16GB recommended
- Storage: 1GB for app + model storage handled by Ollama
- GPU: Optional but dramatically improves inference speed

### Document Library Scale

| Library size | Chunks | Embedding time | Query time |
|-------------|--------|---------------|------------|
| 100 docs | ~5,000 | ~2 min | <100ms |
| 1,000 docs | ~50,000 | ~20 min | <500ms |
| 10,000 docs | ~500,000 | ~3 hrs | 1–2s |

For libraries > 5,000 docs: add SQLite FTS5 pre-filter before cosine similarity to reduce the vector comparison space.

### Performance Optimizations

1. **Batch embedding** — embed 10 chunks per Ollama call instead of 1
2. **Parallel source fetching** — fetch 3 web pages concurrently in research
3. **Model caching** — ModelRouter caches model list; don't call `/api/tags` on every request
4. **Incremental indexing** — compare file `mtime` before re-embedding unchanged docs
5. **Lazy chunk loading** — only embed chunks when a document is first queried, not on upload
6. **SQLite WAL mode** — enable Write-Ahead Logging for better concurrent read performance

### Streaming Responses
- Chat responses: stream from Ollama using `stream: true` in `/api/chat`
- Research progress: Server-Sent Events (SSE) on `/api/research`
- Document processing: SSE progress on `/api/documents/process`

---

## 14. API Design

### Base URL: `/api`

### Chat
```
POST   /api/chat                    Send a message, get AI response (with tool use)
POST   /api/chat/confirm            Confirm a destructive pending action
```

### Models
```
GET    /api/models                  List available Ollama models + their roles
GET    /api/models/status           Check Ollama connectivity
```

### Files
```
GET    /api/files?path=             List directory contents
GET    /api/files/read?path=        Read file content
POST   /api/files/index             Index a directory for semantic search
GET    /api/files/indexed           List indexed directories
```

### Document Agent
```
POST   /api/documents/ingest        Parse + chunk + embed a document
GET    /api/documents               List all indexed documents
GET    /api/documents/:id           Get document metadata + chunks
DELETE /api/documents/:id           Remove document from index
POST   /api/documents/query         Q&A against one or more documents
POST   /api/documents/summarize     Generate summary (tldr / keypoints / full)
POST   /api/documents/extract       Extract structured fields
POST   /api/documents/classify      Classify and tag a document
POST   /api/documents/compare       Compare two documents + AI diff
POST   /api/documents/transform     Rewrite / translate / reformat
POST   /api/documents/audit         Run privacy audit
POST   /api/documents/batch         Batch operation across multiple docs
GET    /api/documents/status/:jobId Track progress of async batch operation
```

### Search
```
GET    /api/search?q=&dir=&limit=   Semantic search across indexed files
GET    /api/websearch?q=&type=      Web or image search (DuckDuckGo)
```

### Research
```
POST   /api/research                Start deep research (returns SSE stream)
GET    /api/research/history        Past research sessions
```

### Generate
```
POST   /api/generate/document       Generate a new document from prompt
POST   /api/generate/transform      Transform an existing document
POST   /api/generate/extract        Extract structured data
POST   /api/generate/synthesize     Synthesize multiple documents
POST   /api/generate/autorename     Suggest a filename for a document
POST   /api/generate/suggest-organization  Suggest folder structure
```

### Watchers
```
GET    /api/watchers                List all folder watchers
POST   /api/watchers                Create a new watcher
DELETE /api/watchers/:id            Remove a watcher
GET    /api/watchers/:id/log        View watcher activity log
```

### Settings
```
GET    /api/settings                Get all settings
PUT    /api/settings/:key           Update a setting
```

### Connectors
```
GET    /api/connectors              List connectors + status
POST   /api/connectors/connect      Connect a connector
POST   /api/connectors/disconnect   Disconnect a connector
GET    /api/connectors/:name/list   List items from a connector
POST   /api/connectors/:name/query  Query a connector
```

### MCP
```
GET    /api/mcp/tools               List available MCP tools
POST   /api/mcp/connect             Connect external MCP server
POST   /api/mcp/call                Call an MCP tool
GET    /api/mcp/server/status       Vault AI MCP server status
POST   /api/mcp/server/start        Start Vault AI as an MCP server
```

---

## 15. Deployment Model

### Development (Current)
```
Vite dev server      → http://localhost:5173
Express backend      → http://localhost:3001
Ollama               → http://localhost:11434
Vite proxies /api/* → http://localhost:3001
```

### Production (Local Machine)
```
Express serves built React static files (client/dist/)
Single process on port 3001
User accesses via http://localhost:3001
Ollama runs as a system service
```

### Future: PWA + Installable
```
Web App Manifest + Service Worker
Installable from browser to OS dock/taskbar
Offline shell (UI loads without network)
All data access via localhost backend
```

---

## 16. Open Questions & Decisions

These need to be resolved before or during Phase 1 build:

| # | Question | Options | Recommendation |
|---|----------|---------|----------------|
| Q1 | How do we handle very large PDFs (500+ pages)? | Truncate / Summarize-then-embed / Progressive | Summarize-then-embed for docs > 200 pages |
| Q2 | Should chat streaming be implemented in Phase 1? | No (simpler) / Yes (better UX) | Yes — Ollama supports it, UI impact is large |
| Q3 | Where do extracted data exports go? | Browser download / File system save | File system save to `~/.vault-ai/exports/` |
| Q4 | Should the vector store support multiple embedding models? | Single model / Multi-model | Single model per index (nomic-embed-text); re-index if model changes |
| Q5 | Folder watcher — polling or native fs events? | chokidar (native events) / polling | chokidar with native events |
| Q6 | Should research agent fetch pages server-side or client-side? | Server-side | Server-side (avoids CORS, allows HTML stripping) |
| Q7 | How to handle Ollama being offline mid-session? | Error message / Queue and retry | Show connection banner, queue retries with exponential backoff |

---

*Document maintained at: `docs/ARCHITECTURE.md`*  
*Previous: `docs/FEATURES.md`*  
*Next: `docs/BUILD_PLAN.md` — Sprint-by-Sprint Build Plan*
