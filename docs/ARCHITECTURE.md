# Vault AI — Technical Architecture

> Privacy-first, local AI-powered document intelligence platform.
> All AI runs via Ollama. No cloud. No telemetry. No data leaves the machine.

**Version:** 1.2  
**Date:** May 2026  
**Status:** Architecture Review — RAG Patterns, Agent Design & Multi-Agent Orchestration Added

---

## Table of Contents

1. [Guiding Principles](#1-guiding-principles)
2. [System Overview](#2-system-overview)
3. [High-Level Architecture Diagram](#3-high-level-architecture-diagram)
4. [Frontend Architecture](#4-frontend-architecture)
5. [Backend Architecture](#5-backend-architecture)
6. [AI Layer — Ollama Integration](#6-ai-layer--ollama-integration)
7. [Document Intelligent Agent Architecture](#7-document-intelligent-agent-architecture)
7B. [Multi-Agent Orchestration Architecture](#7b-multi-agent-orchestration-architecture)
8. [Data Storage Architecture](#8-data-storage-architecture)
9. [Web Search & Deep Research Architecture](#9-web-search--deep-research-architecture)
10. [Security & Privacy Model](#10-security--privacy-model)
11. [Data Flow Diagrams](#11-data-flow-diagrams)
12. [Tech Stack Decisions](#12-tech-stack-decisions)
13. [Scalability Considerations](#13-scalability-considerations)
14. [API Design](#14-api-design)
15. [Deployment Model](#15-deployment-model)
16. [Open Questions & Decisions](#16-open-questions--decisions)
17. [Reference — AI Architecture Comparisons](#17-reference--ai-architecture-comparisons)

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
│   ├── agents.js              # POST /api/agents/orchestrate · GET /api/agents/registry · retry · cancel
│   ├── connectors.js          # GET/POST /api/connectors/*
│   └── mcp.js                 # GET/POST /api/mcp/*
├── agents/
│   ├── registry.js            # Agent registry — maps agent IDs to handlers + action lists
│   ├── orchestrator.js        # Decomposes requests into JSON task graphs
│   ├── runner.js              # Topological sort + parallel execution engine (Promise.race)
│   ├── documentAgent.js       # Document Intelligence Agent (parse, embed, Q&A, extract, classify)
│   ├── researchAgent.js       # Deep Research Agent (search, fetch, summarize, synthesize)
│   ├── writerAgent.js         # Writer Agent (draft, transform, rewrite, translate)
│   ├── fileAgent.js           # File Agent (navigate, rename, organize, batch ops)
│   ├── synthesisAgent.js      # Synthesis Agent (merge results, reconcile, attribute sources)
│   └── classifierAgent.js     # Classifier Agent (auto-classify, tag, cluster documents)
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

### RAG Architecture — Generations & Design Decisions

Vault AI's Document Q&A is built on Retrieval-Augmented Generation (RAG). The field has evolved through three distinct generations. Understanding all three informs our design decisions.

#### Generation 1: Naive RAG (Current Baseline)

```
User Question
      │
      ▼
  Embed question (nomic-embed-text)
      │
      ▼
  Cosine similarity vs. all chunk embeddings in SQLite
      │
      ▼
  Top-K chunks (K=5 default)
      │
      ▼
  Build prompt: [system] + [chunks] + [question]
      │
      ▼
  Ollama chat → Answer with citations
```

**Strengths:** Simple, fast, no extra Ollama calls.  
**Weakness:** Questions and documents live in different semantic spaces. "What are the penalties?" doesn't embed close to "The party shall be liable for..." even though they're semantically aligned. Retrieval quality suffers on indirect or ambiguous questions.

---

#### Generation 2: HyDE — Hypothetical Document Embeddings (Phase 2 Target)

Introduced in the paper *"Precise Zero-Shot Dense Retrieval without Relevance Labels"* (Gao et al., 2022). The core insight: **embed a hypothetical answer, not the question.**

```
User Question
      │
      ▼
  [Fast Ollama call — 100-150 words]
  Prompt: "Write a short paragraph that would answer:
           '{question}'. Be factual and direct."
      │
      ▼
  Hypothetical Answer (not shown to user)
      │
      ▼
  Embed the hypothetical answer (nomic-embed-text)
  — this vector lives in the DOCUMENT semantic space —
      │
      ▼
  Cosine similarity vs. all chunk embeddings
  — much better alignment —
      │
      ▼
  Top-K chunks → Ollama chat → Real answer with citations
```

**Why this matters for Vault AI:**
- The hypothetical answer is written in the same style as document text — so its embedding lands near real document chunks
- Works dramatically better for indirect questions ("What could go wrong with this contract?")
- Cost: one extra fast Ollama call (< 500ms on a 3B model)
- No changes to the vector store or chunking pipeline

**Implementation note:** Use the fastest available model (llama3.2:3b or phi3:mini) for hypothesis generation. The hypothesis quality only needs to be good enough to guide the embedding — not good enough to show the user.

**Planned query flow with HyDE:**
```javascript
async function searchWithHyDE(question, topK, directoryFilter) {
  // Step 1: Generate hypothetical answer
  const fastModel = await router.selectModel('file_op'); // fastest available
  const hypothesis = await ollama.generate(fastModel,
    `Write a short factual paragraph that would answer this question:\n"${question}"\nBe direct and specific.`
  );

  // Step 2: Embed the hypothesis (not the question)
  const hypothesisEmbedding = await embeddings.getEmbedding(hypothesis.response);

  // Step 3: Search with hypothesis embedding
  return vectorStore.search(hypothesisEmbedding, topK, directoryFilter);
}
```

---

#### Generation 3: Agentic RAG (Phase 3+ Future)

The model decides *when* to retrieve, *what* to query, and *whether* the result is sufficient. Implemented as a ReAct loop (see Section 7.6 below).

```
Question
    │
    ▼
Ollama decides: "I need to retrieve more context"
    │
    ▼ [tool call: search_document(query="payment terms")]
    │
    ▼
Retrieved chunks
    │
    ▼
Ollama evaluates: "Confidence: 3/5 — I need more"
    │
    ▼ [tool call: search_document(query="liability clauses section 8")]
    │
    ▼
Retrieved chunks (refined)
    │
    ▼
Ollama: "Confidence: 5/5 — I can answer now"
    │
    ▼
Final answer with citations
```

**Cap at 3 iterations** to prevent infinite loops on local hardware.  
**Not recommended for Phase 1 or 2:** Multiple Ollama calls per query is expensive on consumer hardware. HyDE gets 80% of the quality benefit with ~10% of the complexity.

---

#### RAG Design Decision Summary

| Pattern | Ollama calls per query | Quality gain | When |
|---------|----------------------|--------------|------|
| Naive RAG | 1 (embed) + 1 (answer) | Baseline | Phase 1 ✅ |
| HyDE | 1 (hypothesize) + 1 (embed) + 1 (answer) | +30–50% retrieval accuracy | Phase 2 🎯 |
| Agentic RAG | 1–N (loop) + 1 (answer) | Highest, but unpredictable | Phase 3+ |

**Decision: Ship Naive RAG in Phase 1. Upgrade to HyDE in Phase 2 as a drop-in improvement to `searchSemantic()`.** The API contract is unchanged — only the retrieval step is better.

---

### Agent Design Patterns — Lessons from State-of-the-Art

Vault AI's agent design draws from two publicly documented approaches: OpenAI Codex Agent and Anthropic Claude.

#### The ReAct Pattern (Reason + Act)

Both Codex Agent and Claude's tool-use mode implement this loop:

```
┌─────────────────────────────────────────────────────┐
│                    REACT LOOP                        │
│                                                      │
│  User Input                                          │
│       │                                              │
│       ▼                                              │
│  [REASON] Ollama thinks: "I need to read file X"    │
│       │                                              │
│       ▼                                              │
│  [ACT] tool_call: { name: "read_file", args: {...} } │
│       │                                              │
│       ▼                                              │
│  [OBSERVE] Tool result returned to Ollama            │
│       │                                              │
│       ▼                                              │
│  [REASON] Ollama thinks: "Now I can answer"         │
│       │                                              │
│       ▼                                              │
│  [RESPOND] Final answer → User                       │
└─────────────────────────────────────────────────────┘
```

Vault AI's Chat agent already implements this via Ollama's native tool-use (`/api/chat` with `tools: [...]`). The model decides when to call a tool and when to answer directly.

**Loop termination rules (Vault AI):**
- Max 10 tool calls per conversation turn
- If Ollama returns a `content` response (no `tool_calls`), the loop ends
- Destructive tool calls pause the loop and wait for user confirmation

---

#### Context Management Strategy

Three approaches used by state-of-the-art agents:

| Strategy | How | Used by | Vault AI |
|----------|-----|---------|----------|
| **Stuff it all in** | Full documents in context window | Claude (large context) | For docs < 4K tokens |
| **RAG retrieval** | Retrieve only relevant chunks | Most RAG systems | For docs 4K–200K tokens |
| **Sandbox execution** | Agent reads files on-demand via tools | Codex Agent | For file system operations |

Vault AI uses all three strategies, selected by document size and task type:

```
Task: "Answer a question about this PDF"
  → Size < 4K tokens?  → Stuff full content
  → Size 4K–200K?      → RAG (embed + retrieve top-5 chunks)
  → Size > 200K?       → Summarize sections, then RAG on summaries

Task: "Find all PDFs in my Documents folder"
  → Sandbox execution (LLM calls list_directory tool)

Task: "Compare two contracts"
  → RAG on each document independently, then synthesize
```

---

#### Tool Design Principles

Drawing from how Codex Agent and Claude define tools:

1. **Atomic tools, not compound tools** — `read_file` and `write_file` separately, not `read_and_update_file`. Lets the model chain them as needed.

2. **Explicit parameter validation** — every tool validates its inputs before execution. Bad paths, out-of-bounds ranges, missing required params all fail loudly.

3. **Confirmation gate for destructive actions** — delete, move, bulk-rename require the tool to return a `confirmation_required: true` response rather than executing immediately. The frontend renders a confirmation dialog.

4. **Tool results as structured JSON** — not prose. The model re-reads the result; structured data is easier for it to reason about than "Files found: file1.pdf, file2.pdf..."

5. **Error messages are model-readable** — `{ "error": "Path not found: /Users/alex/Documents/report.pdf", "suggestion": "Did you mean /Users/alex/Documents/Report.pdf?" }` — the model can recover from this; an unstructured error string makes it harder.

---

## 7B. Multi-Agent Orchestration Architecture

Multi-Agent Orchestration is what separates Vault AI from a simple chatbot. When the user enables **Orchestrated mode**, complex requests are decomposed into atomic sub-tasks and routed to specialized agents — potentially in parallel.

### System Design

```
User Request (Orchestrated Mode)
           │
           ▼
   ┌─────────────────┐
   │  ORCHESTRATOR   │  Plans the task, builds a dependency graph,
   │                 │  assigns sub-tasks to agents
   └────────┬────────┘
            │
     ┌──────┴──────────────────────────────────┐
     │              TASK GRAPH                  │
     │                                         │
     │  [Task A] ──────────────► [Task C]      │
     │      │                      ▲           │
     │  [Task B] ──────────────────┘           │
     │  (parallel)              (sequential)    │
     └─────────────────────────────────────────┘
            │
     ┌──────┴───────────────────────────────────────┐
     │           SPECIALIZED SUB-AGENTS              │
     │                                              │
     │  📄 Document Agent   🔍 Research Agent       │
     │  ✍️  Writer Agent     📁 File Agent           │
     │  🔗 Synthesis Agent  🏷️  Classifier Agent    │
     └──────────────────────────────────────────────┘
            │
            ▼
   ┌─────────────────┐
   │  RESULT MERGER  │  Combines outputs, resolves conflicts,
   │                 │  builds final response with source attribution
   └─────────────────┘
            │
            ▼
       User Response (with cross-agent citations)
```

---

### Orchestrator Design

The Orchestrator is itself an Ollama model call with a specialized system prompt that outputs a structured task plan:

```json
{
  "tasks": [
    {
      "id": "t1",
      "agent": "document",
      "action": "summarize",
      "input": { "documentId": "contract-2024.pdf" },
      "dependsOn": []
    },
    {
      "id": "t2",
      "agent": "research",
      "action": "search",
      "input": { "query": "GDPR contract requirements 2024" },
      "dependsOn": []
    },
    {
      "id": "t3",
      "agent": "writer",
      "action": "synthesize",
      "input": { "sources": ["t1", "t2"] },
      "dependsOn": ["t1", "t2"]
    }
  ]
}
```

Tasks with no `dependsOn` run in parallel. Tasks with `dependsOn` wait for their dependencies before starting. The Runner executes this graph using a topological sort.

---

### Agent Registry

Each agent is registered with a fixed interface:

```javascript
// agents/registry.js
const AGENT_REGISTRY = {
  document: {
    name: "Document Agent",
    description: "Parse, embed, query, extract, classify, and summarize documents",
    actions: ["ingest", "query", "summarize", "extract", "classify", "compare", "audit"],
    handler: require('./documentAgent'),
  },
  research: {
    name: "Research Agent",
    description: "Web search and deep research with source fetching and synthesis",
    actions: ["search", "deep_research", "fetch_page", "summarize_source"],
    handler: require('./researchAgent'),
  },
  writer: {
    name: "Writer Agent",
    description: "Draft, transform, rewrite, translate, and format documents",
    actions: ["draft", "transform", "rewrite", "translate", "convert_format"],
    handler: require('./writerAgent'),
  },
  file: {
    name: "File Agent",
    description: "File system navigation and operations",
    actions: ["list", "read", "move", "rename", "find", "batch_rename", "organize"],
    handler: require('./fileAgent'),
  },
  synthesis: {
    name: "Synthesis Agent",
    description: "Combine and reconcile outputs from multiple agents",
    actions: ["merge", "reconcile", "deduplicate", "rank"],
    handler: require('./synthesisAgent'),
  },
  classifier: {
    name: "Classifier Agent",
    description: "Auto-classify and tag documents or files in batch",
    actions: ["classify", "tag", "cluster", "label"],
    handler: require('./classifierAgent'),
  },
};
```

---

### Agent Communication Protocol

Agents communicate via a **shared working context** — a typed in-memory scratchpad scoped to the current session turn:

```javascript
// Shared context passed to every agent in the session
const workingContext = {
  sessionId: "sess_abc123",
  turnId: "turn_7",
  results: {
    "t1": { agent: "document", status: "complete", output: { summary: "..." } },
    "t2": { agent: "research", status: "running", output: null },
  },
  userPreferences: { language: "en", tone: "professional" },
  documents: ["contract-2024.pdf"],   // in-scope documents for this turn
};
```

Agents read from `workingContext.results` to get upstream outputs and write their own output back into it. The Runner is responsible for injecting the right `dependsOn` results into each agent's input before calling it.

---

### Runner Execution Model

```javascript
// agents/runner.js — simplified execution model

async function runTaskGraph(taskGraph, workingContext) {
  const pending = new Set(taskGraph.tasks.map(t => t.id));
  const running = new Map();
  const completed = new Set();

  while (pending.size > 0 || running.size > 0) {
    // Start all tasks whose dependencies are complete
    for (const task of taskGraph.tasks) {
      if (!pending.has(task.id)) continue;
      if (task.dependsOn.every(dep => completed.has(dep))) {
        pending.delete(task.id);
        const promise = executeAgent(task, workingContext)
          .then(result => {
            workingContext.results[task.id] = result;
            completed.add(task.id);
            running.delete(task.id);
          });
        running.set(task.id, promise);
      }
    }
    // Wait for at least one running task to complete
    if (running.size > 0) await Promise.race(running.values());
  }
}
```

This gives true parallelism for independent tasks while respecting sequential dependencies.

---

### Agent State Machine (per task)

```
QUEUED
  │
  ▼ [dependencies met]
RUNNING
  │         │
  ▼         ▼
COMPLETE   FAILED
  │              │
  ▼              ▼
feeds next   retry or
agent(s)     surface error
```

Agents broadcast their state transitions to the frontend via SSE — the Live Agent Dashboard reflects these in real-time.

---

### Multi-Agent API Endpoints

```
POST   /api/agents/orchestrate      Submit a request for orchestration (returns SSE stream)
GET    /api/agents/registry         List all available agents and their actions
GET    /api/agents/session/:id      Get full task graph + results for a session turn
POST   /api/agents/retry/:taskId    Retry a specific failed or overridden task
DELETE /api/agents/session/:id      Cancel all running tasks for a session turn
```

---

### When to Use Single vs. Multi-Agent

| Mode | Use for | Speed | Quality |
|------|---------|-------|---------|
| **Simple** | Single-step questions, quick file ops, casual chat | Fast (1 model call) | Good |
| **Orchestrated** | Multi-step research, cross-document analysis, complex batch ops | Slower (N model calls) | Higher |

**Auto-detection rule (future):** If the user's message contains more than one distinct action verb targeting different data sources, suggest Orchestrated mode. If the message is a direct question or a single file operation, default to Simple.

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
| RAG retrieval strategy | Naive / HyDE / Agentic | **Decided: Naive in Phase 1, HyDE in Phase 2** (see Section 7 RAG Patterns) |
| Hypothesis model for HyDE | Same model / fastest available | Fastest available (llama3.2:3b or phi3:mini) — quality doesn't need to be high |
| Max ReAct loop iterations | 5 / 10 / unlimited | 10 tool calls per turn; Agentic RAG capped at 3 retrieve iterations |

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

### Resolved Decisions

| # | Question | Decision | Rationale |
|---|----------|----------|-----------|
| Q1 | How do we handle very large PDFs (500+ pages)? | Summarize-then-embed for docs > 200 pages | Full embedding of 500+ pages takes too long on local hardware; summarize each section first |
| Q2 | Should chat streaming be implemented in Phase 1? | Yes — SSE streaming from day one | UI impact too large to defer; Ollama supports `stream: true` natively |
| Q3 | Where do extracted data exports go? | File system save to `~/.vault-ai/exports/` | Consistent with "file system as source of truth" principle |
| Q4 | Should the vector store support multiple embedding models? | Single model per index (nomic-embed-text) | Re-index if model changes; mixing models in one index breaks cosine similarity comparisons |
| Q5 | Folder watcher — polling or native fs events? | `fs.watch` (Node.js built-in) with chokidar fallback | Avoids external process dependency; chokidar used as backup for platforms where `fs.watch` is unreliable |
| Q6 | Should research agent fetch pages server-side or client-side? | Server-side only | Avoids CORS, allows HTML stripping, hides user IP from sites to degree possible |
| Q7 | How to handle Ollama being offline mid-session? | Show connection banner, exponential backoff retry | Non-blocking — user can still browse files and sessions; AI features queue until Ollama reconnects |
| Q8 | RAG retrieval strategy? | Naive RAG in Phase 1, HyDE in Phase 2 | HyDE adds one extra Ollama call but improves retrieval accuracy 30–50%; too much for MVP |
| Q9 | Agent design pattern for Document Agent? | ReAct loop via Ollama tool-use, capped at 10 turns | Matches Codex Agent and Claude tool-use patterns; cap prevents runaway loops on local hardware |
| Q10 | Context management strategy by document size? | < 4K: full context; 4K–200K: RAG; > 200K: summarize-then-RAG | Balances quality and token cost across the full range of document sizes |

### Still Open

| # | Question | Options | Blocking |
|---|----------|---------|---------|
| Q11 | How do we display citation sources in the chat UI? | Inline footnotes / Collapsible panel / Highlighted passages | Phase 1 build |
| Q12 | Should batch operations run in a background worker thread? | Main thread (simple) / Worker thread (non-blocking) | Phase 2 build |
| Q13 | How do we handle embedding model changes for an existing library? | Block model change / Re-index warning / Auto re-index | Phase 2 build |
| Q14 | Should HyDE hypothesis generation be skippable per-query? | Always / User toggle / Auto-detect (short queries skip) | Phase 2 build |
| Q15 | Multi-document Q&A: merge all chunks or retrieve per-document then merge? | Unified pool / Per-doc retrieval + merge | Phase 2 build |

---

## 17. Reference — AI Architecture Comparisons

Brief reference on how production AI agents compare to Vault AI's approach. Useful for informing design decisions.

### OpenAI Codex Agent (2025)

- **Architecture:** GPT-4o / o3 + tool use in a cloud-hosted, network-isolated sandbox
- **Agent pattern:** ReAct loop — model reasons, calls tools (read file, run tests, search), observes results, repeats
- **Context strategy:** Sandbox-based — doesn't stuff files into context; reads what it needs via tools
- **Why relevant to Vault AI:** The file tool design (atomic read/write/list, explicit validation, confirmation for destructive ops) is directly applicable. Our FILE_TOOLS follow the same design pattern.

### Anthropic Claude (3.x / Claude.ai)

- **Architecture:** Transformer decoder, 200K context window, Constitutional AI training
- **Agent pattern:** Tool use with `tool_use` and `tool_result` message types; parallel tool calls supported
- **Context strategy:** Large context stuffing + retrieval for very large documents
- **Key published research:**
  - Constitutional AI (CAI) — training on AI-generated feedback against a set of principles
  - Interpretability: features as linear directions in activation space (Anthropic Alignment team)
  - Long context recall: Claude 3 achieves near-perfect recall up to 100K tokens
- **Why relevant to Vault AI:** Claude's tool result format is a useful reference for structuring how Vault AI returns tool outputs to Ollama. Also, Claude's approach of explicitly handling "I don't know" cases (rather than hallucinating) informs our system prompt design.

### RAG in Production (Academic Reference)

| Paper | Contribution | Applied in Vault AI |
|-------|-------------|---------------------|
| Lewis et al. (2020) — "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks" | Foundational RAG architecture | Phase 1 naive RAG baseline |
| Gao et al. (2022) — "Precise Zero-Shot Dense Retrieval without Relevance Labels" | HyDE (hypothetical document embeddings) | Phase 2 retrieval upgrade |
| Yao et al. (2022) — "ReAct: Synergizing Reasoning and Acting in Language Models" | ReAct agent loop | Document Agent + Chat tool-use |

---

*Document maintained at: `docs/ARCHITECTURE.md`*  
*Version: 1.2 — Updated May 2026 with RAG patterns, agent design, multi-agent orchestration, and full agent registry*  
*Previous: `docs/FEATURES.md`*  
*Next: `docs/BUILD_PLAN.md` — Sprint-by-Sprint Build Plan*
