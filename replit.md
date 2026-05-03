# Vault AI

Privacy-first, local AI-powered file and document management platform. All AI runs via Ollama on localhost — zero data egress.

## Architecture

- **Frontend**: React + Vite + TailwindCSS (port 5173)
- **Backend**: Node.js + Express (port 3001)
- **AI**: Ollama HTTP API (OLLAMA_BASE_URL env var, default localhost:11434)
- **Vector DB**: SQLite + better-sqlite3 (cosine similarity search, `~/vault-ai-vectors.db`)
- **Document parsing**: pdf-parse (PDF), mammoth (DOCX), xlsx (XLSX/CSV), fs (TXT/MD/code)
- **State**: Zustand (client)
- **Landing page**: Separate Vite app (port 5000) at `src/landing/`

## Build Phases

| Phase | Status | Description |
|-------|--------|-------------|
| 1 — Foundation    | ✅ Complete | Chat, file browser, skills, document agent, RAG, classify, extract, summarize |
| 2 — Intelligence  | ✅ Complete | HyDE retrieval, multi-doc Q&A, PII detection, smart organization |
| 3 — Research      | ✅ Complete | DuckDuckGo web search, deep research (multi-step AI), URL summarizer |
| 4 — Automation    | ✅ Complete | Custom skills builder (CRUD + persistent), smart file organization |
| 5 — Distribution  | ✅ Complete | PWA (manifest + service worker), voice input (Web Speech API) |

## Project Structure

```
src/webapp/
├── client/              # React + Vite frontend
│   ├── index.html       # PWA meta + service worker registration
│   ├── public/
│   │   ├── manifest.json    # PWA manifest
│   │   └── sw.js            # Service worker (cache-first, offline)
│   └── src/
│       ├── components/
│       │   ├── agents/        # WorkflowToggle, AgentStep, AgentWorkflowPanel
│       │   ├── connectors/    # ConnectorsPanel, ConnectorCard, ConnectorConfigForm
│       │   ├── document/      # DocumentAgentPanel — Q&A, TL;DR, Key Points, Full, Extract, Classify, PII, Multi-doc, Organize
│       │   ├── mcp/           # MCPPanel, MCPServerCard, MCPAddServerForm, MCPToolBadge
│       │   ├── research/      # ResearchPanel — Quick Search + Deep Research
│       │   ├── Chat.jsx       # Chat + voice input (Web Speech API)
│       │   ├── FileBrowser.jsx
│       │   ├── GeneratePanel.jsx
│       │   ├── ModelPanel.jsx
│       │   ├── MessageBubble.jsx
│       │   ├── ConfirmDialog.jsx
│       │   ├── SkillsPanel.jsx    # 12 built-in + custom skills (persistent)
│       │   └── StatusBar.jsx
│       ├── store/       # Zustand state (useStore.js) — includes demoMode flag
│       ├── api/         # client.js (Axios + demo adapter) + demoData.js (mock responses)
│       ├── App.jsx      # Nav: Chat | Documents | Research | Skills | Generate | Connectors | MCP
│       └── main.jsx
└── server/
    ├── routes/
    │   ├── chat.js           # Multi-agent + connector + MCP tool routing
    │   ├── documents.js      # ingest/list/delete/query/multi-query/summarize/extract/classify/pii/organize/index-dir
    │   ├── files.js
    │   ├── models.js
    │   ├── search.js         # Semantic vector search
    │   ├── generate.js       # Document generation
    │   ├── agents.js         # Multi-agent orchestration
    │   ├── connectors.js
    │   ├── mcp.js
    │   ├── research.js       # Web search + deep research + URL summarizer
    │   └── skills.js         # Custom skills CRUD (persisted to ~/.vault-ai-skills.json)
    ├── services/
    │   ├── ollama.js         # OllamaClient + ModelRouter
    │   ├── fileOps.js
    │   ├── docReader.js      # PDF/DOCX/XLSX/CSV/TXT/code parsing + chunking
    │   ├── embeddings.js     # EmbeddingsService — HyDE + searchSemantic + indexDirectory
    │   ├── vectorStore.js    # SQLite cosine similarity store
    │   ├── genAI.js
    │   └── webSearch.js      # DuckDuckGo search (instant answers + HTML results)
    ├── agents/               # orchestrator, registry, runner, memory
    ├── connectors/           # obsidian, sqlite, git, email, bookmarks
    ├── mcp/                  # MCP server + client
    ├── tools/
    │   └── fileTools.js
    └── index.js
```

## API Routes

| Route | Phase | Description |
|-------|-------|-------------|
| POST /api/chat | 1 | Chat with AI (workflowMode: simple/multi-agent) |
| POST /api/chat/confirm | 1 | Confirm pending destructive action |
| GET /api/models | 1 | List available Ollama models |
| GET /api/models/status | 1 | Ollama connection status |
| GET/POST /api/files | 1 | File browser + index |
| GET /api/search | 1 | Semantic vector search |
| POST /api/generate/* | 1 | Document generation |
| POST /api/documents/ingest | 1 | Parse + embed single file |
| GET /api/documents | 1 | List indexed documents |
| DELETE /api/documents | 1 | Remove document from index |
| POST /api/documents/query | 1+2 | RAG Q&A (HyDE by default) |
| POST /api/documents/summarize | 1 | TL;DR / Key Points / Full brief |
| POST /api/documents/extract | 1 | Structured data extraction |
| POST /api/documents/classify | 1 | Auto-classify + tag + sensitivity |
| POST /api/documents/index-directory | 1 | Batch index entire directory |
| POST /api/documents/multi-query | 2 | Cross-document Q&A with citation |
| POST /api/documents/pii | 2 | PII detection (regex + LLM) |
| POST /api/documents/organize | 2 | AI folder organization suggestions |
| GET /api/research/search | 3 | DuckDuckGo web search |
| POST /api/research/deep | 3 | Multi-step deep research + AI report |
| POST /api/research/summarize-url | 3 | Fetch + summarize a webpage |
| GET /api/skills | 4 | List custom skills |
| POST /api/skills | 4 | Create custom skill |
| DELETE /api/skills/:id | 4 | Delete custom skill |
| GET/POST /api/connectors/* | 1 | Connector management |
| GET/POST /api/mcp/* | 1 | MCP server/client management |

## Key Features

### Phase 2 — Intelligence
- **HyDE retrieval**: Hypothetical Document Embedding improves Q&A accuracy
- **Multi-doc Q&A**: Ask questions across ALL indexed documents simultaneously, with per-document citations
- **PII Detection**: Regex patterns (email, phone, SSN, CC, IP, URL) + LLM for names/addresses/medical info
- **Smart Organization**: AI suggests folder structure for indexed document library

### Phase 3 — Research
- **Quick Search**: DuckDuckGo powered, private, no API key needed, instant answers + organic results
- **Deep Research**: Breaks question into sub-questions → searches each → AI synthesizes full report
- **URL Summarizer**: Fetch any page and summarize with AI
- **Save & Export**: Save results, download reports as Markdown

### Phase 4 — Custom Skills
- **12 built-in skills**: Summarize, Extract, Draft Reply, Duplicates, Report, Explain, Tag, Privacy Audit, Translate, Meeting Notes, Organize Files, Find Patterns
- **Custom skill builder**: Create/name/delete your own AI skills with custom prompts
- **Persistent**: Custom skills saved to `~/.vault-ai-skills.json`

### Phase 5 — Distribution
- **PWA**: Install as desktop/mobile app via manifest.json + service worker
- **Offline capable**: Service worker caches app shell, serves cached on reconnect
- **Voice input**: Web Speech API — microphone button in chat, real-time transcript

## Running Locally

Requires Ollama:
```bash
ollama serve
ollama pull llama3.2            # Chat + agents + summarize/extract/classify
ollama pull nomic-embed-text    # Semantic search + document Q&A (HyDE)
```

Start the app:
```bash
cd src/webapp && npm install && npm run dev
```

## OpenAI Fallback (Live Demo Mode)

When Ollama is not running locally, the app automatically falls back to OpenAI:
- **Models available**: `gpt-5-mini` (default), `gpt-5.4`
- **Integration**: Replit OpenAI integration (`OPENAI_API_KEY` injected automatically)
- **Model router**: `ModelRouter` in `ollama.js` tries Ollama first, falls back to `openaiClient.js`
- **Tool use**: OpenAI tool calls include `id` + `type:"function"` — critical for follow-up messages

## Theme

- **Default**: Dark Premium (`#0A0A0F` background, `#6366F1` indigo accent)
- **Storage key**: `vault-ai-theme` in localStorage
- **Flash prevention**: Inline script in `index.html` applies theme before React mounts
- **Toggle**: Settings panel (bottom-left of sidebar)

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| OLLAMA_BASE_URL | http://localhost:11434 | Ollama API endpoint |
| OPENAI_API_KEY | (Replit integration) | OpenAI fallback when Ollama unavailable |
| PORT | 3001 | Express server port |

## Security

- Path traversal prevention: paths validated before operations
- No hard deletes: files moved to OS trash via `trash`
- Destructive actions require explicit confirmation dialog
- All AI computation is local — zero data egress
- MCP API keys never in responses or logs
- PII scanner helps identify sensitive data in documents

## Performance & Reliability (Audit Pass)

### Server
- **Gzip compression** — `compression` middleware at level 6 (1KB threshold) on all API responses
- **Multi-tool calls** — `chat.js` now loops all `tool_calls` in parallel via `Promise.all` (was only handling `tool_calls[0]`, silently dropping extra calls)
- **Async file ops** — `fileOps.js` fully converted from blocking `readdirSync`/`statSync`/`mkdirSync`/`renameSync` to async `readdir`/`stat`/`mkdir`/`rename` — prevents event-loop blocking on large directories

### Client
- **Code splitting** — `vite.config.js` `manualChunks` splits bundle into focused async chunks:
  - Initial load: **44KB** (was 455KB monolithic) — **90% reduction**
  - Vendor chunks: react, markdown, axios, lucide, zustand loaded separately
  - Panel chunks: DocumentAgent, Research, Skills, Generate, Connectors+MCP loaded lazily
- **React.lazy + Suspense** — All 6 heavy panels lazy-loaded in `App.jsx`; `<PanelSkeleton>` shown while loading
- **renderPanel memoized** — Wrapped in `useMemo([activeTab])` — prevents JSX recreation on every parent render
- **Stale closure fix** — `App.jsx` polling interval uses `demoModeRef` to avoid reading stale `demoMode` from closure
- **Session save debounce** — `useEffect` for session save wrapped in `setTimeout` with proper cleanup
- **Error boundary** — `ErrorBoundary.jsx` class component wraps each panel; catches render crashes, shows "Try again" UI
- **CmdLine timer leak** — `setTimeout` tracked via `useRef` in `CmdLine` component; cleared on unmount
- **Voice recognition cleanup** — `useEffect` return now calls `rec.abort()` and nulls all event handlers on unmount
- **MessageBubble dark mode** — Hardcoded `bg-white`/`border-gray-200`/`text-gray-800` replaced with `msg-bubble` CSS class with full dark-mode variants
- **OllamaSetupGuide dark mode** — All 300+ lines of hardcoded light-theme inline styles converted to `ollama-guide` CSS classes with dark mode support
- **Chat UI CSS** — Demo exit button, voice button, offline banner, listening indicator, welcome screen, feature cards, suggestions all converted to theme-aware CSS classes

## Dependencies

Server: express, cors, compression, better-sqlite3, pdf-parse, mammoth, xlsx, fs-extra, trash, axios, md5, simple-git, js-yaml, mailparser, html-to-text, @modelcontextprotocol/sdk

Client: react, react-dom, zustand, axios, lucide-react, react-markdown, tailwindcss
