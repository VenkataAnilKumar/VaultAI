# Vault AI

Privacy-first, local AI-powered file and document management platform. All AI runs via Ollama on the user's machine — zero data egress. Falls back to OpenAI (Replit integration) when Ollama is unavailable, enabling a full live demo without any local setup.

**Live URL**: served at root `/` (landing) and `/app` (main application)

---

## Architecture

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | React 18 + Vite + TailwindCSS | Port 5173 in dev, `/app/` in prod |
| Backend | Node.js + Express | Port 3001, proxied via Vite in dev |
| AI (local) | Ollama HTTP API | Default `http://localhost:11434` |
| AI (cloud) | OpenAI (Replit integration) | Fallback when Ollama unavailable |
| Vector DB | SQLite + better-sqlite3 | Cosine similarity, `~/vault-ai-vectors.db` |
| Document parsing | pdf-parse, mammoth, xlsx | PDF / DOCX / XLSX / CSV / TXT / code |
| State | Zustand | Client-side, includes `demoMode` flag |
| Landing page | Separate Vite app | Port 5000 in dev, `/` in prod |

---

## Project Structure

```
vault-ai/
├── src/
│   ├── landing/                  # Standalone landing page (Vite + React)
│   │   ├── src/App.jsx           # Full landing page — hero, features, FAQ, CTA
│   │   └── vite.config.js        # Port 5000, APP_URL → /app in production
│   └── webapp/
│       ├── client/               # React frontend
│       │   ├── index.html        # PWA meta, service worker registration
│       │   ├── public/
│       │   │   ├── manifest.json # PWA manifest
│       │   │   └── sw.js         # Service worker (cache-first, offline)
│       │   ├── vite.config.js    # base: /app/ in production, code-splitting
│       │   └── src/
│       │       ├── App.jsx       # Nav: Chat | Documents | Research | Skills | Generate | Connectors | MCP
│       │       ├── components/
│       │       │   ├── Chat.jsx              # Streaming chat, voice input, demo mode
│       │       │   ├── FileBrowser.jsx
│       │       │   ├── ConfirmDialog.jsx      # Destructive action confirmation
│       │       │   ├── ErrorBoundary.jsx      # Per-panel crash recovery
│       │       │   ├── GeneratePanel.jsx
│       │       │   ├── MessageBubble.jsx
│       │       │   ├── ModelPanel.jsx
│       │       │   ├── SessionHistory.jsx
│       │       │   ├── SettingsPanel.jsx
│       │       │   ├── SkillsPanel.jsx        # 12 built-in + custom skills
│       │       │   ├── StatusBar.jsx
│       │       │   ├── agents/               # WorkflowToggle, AgentStep, AgentWorkflowPanel
│       │       │   ├── connectors/           # ConnectorsPanel, ConnectorCard, ConnectorConfigForm
│       │       │   ├── document/             # DocumentAgentPanel
│       │       │   ├── mcp/                  # MCPPanel, MCPServerCard, MCPAddServerForm, MCPToolBadge
│       │       │   └── research/             # ResearchPanel
│       │       ├── api/
│       │       │   ├── client.js             # Axios wrapper + sendChatStream() (fetch/SSE) + demo adapter
│       │       │   └── demoData.js           # Pre-written demo responses (no Ollama needed)
│       │       ├── hooks/
│       │       │   ├── useTheme.js
│       │       │   └── useSessionHistory.js
│       │       └── store/
│       │           └── useStore.js           # Zustand global store
│       └── server/
│           ├── index.js          # Express entry; serves /app + / in production
│           ├── routes/
│           │   ├── chat.js       # POST /api/chat (non-streaming) + POST /api/chat/stream (SSE)
│           │   ├── documents.js  # ingest/list/delete/query/multi-query/summarize/extract/classify/pii/organize
│           │   ├── files.js
│           │   ├── models.js
│           │   ├── search.js
│           │   ├── generate.js
│           │   ├── agents.js
│           │   ├── connectors.js
│           │   ├── mcp.js
│           │   ├── research.js   # Web search, deep research, URL summarizer
│           │   └── skills.js     # Custom skills CRUD → ~/.vault-ai-skills.json
│           ├── services/
│           │   ├── ollama.js         # OllamaClient (chat + chatStream) + ModelRouter
│           │   ├── openaiClient.js   # OpenAIClient (chat + chatStream) + OpenAIModelRouter
│           │   ├── fileOps.js        # Async file operations
│           │   ├── docReader.js      # Multi-format parser + chunker
│           │   ├── embeddings.js     # HyDE + semantic search + directory indexer
│           │   ├── vectorStore.js    # SQLite cosine similarity store
│           │   ├── localEmbeddings.js
│           │   ├── genAI.js
│           │   └── webSearch.js      # DuckDuckGo (instant + HTML, 5-min cache)
│           ├── agents/               # orchestrator, registry, runner, memory
│           ├── connectors/           # obsidian, sqlite, git, email, bookmarks
│           ├── mcp/                  # MCP server + client
│           └── tools/
│               └── fileTools.js      # FILE_TOOLS definitions + DESTRUCTIVE_TOOLS list
```

---

## Deployment (Production)

```
Build:  cd src/webapp && npm install && npm run build
        cd src/landing && npm install && npm run build

Run:    cd src/webapp && NODE_ENV=production npm run start
```

**Routing in production (`server/index.js`):**
- `/app/*` → serves `client/dist` (React SPA with base `/app/`)
- `/api/*` → Express API routes
- `/*` → serves `src/landing/dist` (landing page)

**Vite base path:** `client/vite.config.js` sets `base: '/app/'` when `NODE_ENV=production`, so all built assets reference `/app/assets/...`.

---

## Streaming Chat (SSE)

### Server-side (`POST /api/chat/stream`)
- Sends `Content-Type: text/event-stream` with `X-Accel-Buffering: no`
- Calls `ollama.chatStream()` / `openaiClient.chatStream()` — both stream tokens via an `onToken` callback
- SSE event protocol:

| Event | Payload | Meaning |
|-------|---------|---------|
| `token` | `{ type, content }` | Partial text chunk |
| `tool` | `{ type, name, status: "running"\|"done" }` | Tool executing |
| `done` | `{ type, toolsUsed[], model }` | Stream complete |
| `confirmation` | `{ type, pendingAction, message }` | Destructive action blocked — needs user confirmation |
| `error` | `{ type, message }` | Fatal error |

- If first AI response has `tool_calls`: sends `tool:running` events, executes tools in parallel, sends `tool:done` events, then streams the follow-up response
- Destructive tools (`delete_file`, bulk operations > 3 files) emit `confirmation` event instead of executing
- Multi-agent `workflowMode` falls back to non-streaming `POST /api/chat`

### Client-side (`client.js` + `Chat.jsx`)
- `sendChatStream(data, { onToken, onTool, onDone, onError })` — uses native `fetch` + `ReadableStream` (not axios, which buffers)
- In demo mode: simulates word-by-word streaming from pre-written demo responses
- Returns an abort function — hooked into component unmount and "Stop" button
- `Chat.jsx` renders a live `<StreamingBubble>` that grows as tokens arrive, with animated tool chips and a blinking cursor
- On `done`: calls `addMessage()` with the complete accumulated content, clears streaming state

---

## API Routes

| Route | Description |
|-------|-------------|
| `POST /api/chat` | Chat (non-streaming; used for multi-agent workflow mode) |
| `POST /api/chat/stream` | Chat with SSE token streaming |
| `POST /api/chat/confirm` | Execute a confirmed destructive action |
| `GET /api/models` | List available Ollama/OpenAI models |
| `GET /api/models/status` | Connection status |
| `GET/POST /api/files` | File browser + read |
| `GET /api/search` | Semantic vector search |
| `POST /api/generate/*` | Document generation |
| `POST /api/documents/ingest` | Parse + embed single file |
| `GET /api/documents` | List indexed documents |
| `DELETE /api/documents` | Remove from index |
| `POST /api/documents/query` | RAG Q&A (HyDE) |
| `POST /api/documents/multi-query` | Cross-document Q&A with citation |
| `POST /api/documents/summarize` | TL;DR / Key Points / Full brief |
| `POST /api/documents/extract` | Structured data extraction |
| `POST /api/documents/classify` | Auto-classify + tag + sensitivity |
| `POST /api/documents/pii` | PII detection (regex + LLM) |
| `POST /api/documents/organize` | AI folder organization suggestions |
| `POST /api/documents/index-directory` | Batch index entire directory |
| `GET /api/research/search` | DuckDuckGo web search |
| `POST /api/research/deep` | Multi-step deep research + AI report |
| `POST /api/research/summarize-url` | Fetch + summarize a webpage |
| `GET/POST /api/skills` | Custom skills CRUD |
| `DELETE /api/skills/:id` | Delete custom skill |
| `GET/POST /api/connectors/*` | Connector management |
| `GET/POST /api/mcp/*` | MCP server/client management |

---

## Key Features

### Chat
- Real-time token streaming (SSE) — AI types in as it generates
- Tool execution mid-stream with animated status badges
- Stop button cancels in-flight stream
- Voice input (Web Speech API) — microphone button, real-time transcript
- Workflow toggle: Simple (streaming) vs Multi-Agent (orchestrator)
- Demo mode: simulates all responses without Ollama

### Document Agent
- **RAG Q&A**: HyDE (Hypothetical Document Embedding) for improved retrieval accuracy
- **Multi-doc Q&A**: Ask across all indexed documents with per-document citations
- **Summarize**: TL;DR / Key Points / Full Executive Brief
- **Extract**: Structured pull of dates, names, amounts, decisions, obligations
- **Classify**: Auto-tag + sensitivity rating (public / internal / confidential / restricted)
- **PII Detection**: Regex (email, phone, SSN, CC, IP) + LLM (names, addresses, medical)
- **Smart Organize**: AI suggests folder structure for document library

### Research Panel
- **Quick Search**: DuckDuckGo — private, no API key, instant answers + organic results
- **Deep Research**: Breaks question → parallel sub-searches → AI synthesizes report
- 5-minute in-memory cache for search results, 8s timeout per query
- **URL Summarizer**: Fetch any page and summarize with AI
- Export reports as Markdown

### Custom Skills
- 12 built-in skills: Summarize, Extract, Draft Reply, Find Duplicates, Report, Explain, Tag, Privacy Audit, Translate, Meeting Notes, Organize Files, Find Patterns
- Custom skill builder: name, icon, system prompt — fully persistent (`~/.vault-ai-skills.json`)

### Local Connectors
- **Obsidian**: Read vault notes, query by tag/folder
- **SQLite**: Query any local SQLite database
- **Git**: Repo status, log, diff
- **Email**: Parse local `.mbox` / `Maildir`
- **Bookmarks**: Read browser bookmark exports

### MCP (Model Context Protocol)
- Add any external MCP server by URL
- Discovered tools appear in chat tool belt automatically

### PWA
- Installable as desktop/mobile app (manifest.json + service worker)
- Cache-first offline support for app shell

---

## AI Model Routing

`ModelRouter` (in `ollama.js`) classifies the task and picks the optimal model:

| Task type | Preferred Ollama models | Cloud fallback |
|-----------|------------------------|----------------|
| `file_op` | llama3.2:3b, phi3:mini | gpt-5-mini |
| `doc_qa` | mistral:7b, llama3.1:8b | gpt-5-mini |
| `generate` | llama3.1:8b, mistral:7b | gpt-5.4 |
| `transform` | mistral:7b | gpt-5-mini |
| `synthesize` | llama3.1:8b | gpt-5.4 |
| `extract` | mistral:7b | gpt-5-mini |
| `vision` | llava:7b | gpt-5.4 |
| `code` | qwen2.5-coder:7b, codellama | gpt-5.4 |
| `embedding` | nomic-embed-text | text-embedding-3-small |

---

## Performance

| Optimization | Detail |
|---|---|
| Code splitting | Initial JS bundle: **44KB** (was 455KB) — 90% reduction via `manualChunks` |
| React.lazy | All 6 heavy panels lazy-loaded with `<PanelSkeleton>` fallback |
| Gzip | `compression` middleware at level 6 on all API responses |
| Parallel tool calls | All `tool_calls` in a single turn executed via `Promise.all` |
| Async file ops | `fileOps.js` fully async — no event-loop blocking on large directories |
| Search cache | 5-min in-memory cache for web search results |
| Search timeout | 8s per query (was 12s) |
| renderPanel memoized | `useMemo([activeTab])` prevents JSX recreation on every parent render |

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama API endpoint |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | Replit integration | OpenAI fallback |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | Replit integration | OpenAI base URL |
| `PORT` | `3001` | Express server port |
| `NODE_ENV` | — | Set to `production` in deployment run command |

---

## Security

- Path traversal prevention on all file operations
- No hard deletes — files moved to OS trash via `trash` package
- Destructive actions require explicit confirmation dialog (SSE `confirmation` event)
- All AI computation local — zero data egress in Ollama mode
- MCP API keys never logged or returned in API responses
- PII scanner helps users identify sensitive data before sharing documents

---

## Running Locally

```bash
# 1. Start Ollama
ollama serve
ollama pull llama3.2          # Chat, agents, summarize, classify, extract
ollama pull nomic-embed-text  # Semantic search, document Q&A

# 2. Start the app
cd src/webapp && npm install && npm run dev
# → Express on :3001, Vite on :5173

# 3. (Optional) Landing page
cd src/landing && npm install && npm run dev
# → Landing on :5000
```

---

## Roadmap Status

### ✅ Tier 1 — Complete
| # | Feature | Implementation |
|---|---------|---------------|
| 1 | **Drag-and-drop files into chat** | FileReader client-side for text/code files; chip UI in input bar; binary files redirect to Documents panel; paperclip button fallback |
| 2 | **Local vs. cloud privacy indicator** | `activeProvider` in store; `PrivacyBadge` component in chat toolbar; green "Local" (Ollama) or yellow "Cloud" (OpenAI) |
| 3 | **Mobile-responsive layout** | Sidebar drawer overlay on `< 768px`; bottom nav (Chat/Docs/Research/Skills/More); hamburger in header; safe-area padding |

### ✅ Tier 2 — Complete
| # | Feature | Implementation |
|---|---------|---------------|
| 4 | **Smoother Ollama onboarding** | OS-detected tabs (Mac/Windows/Linux) in Settings; one-click copy install commands; live Recheck button with spinner |
| 5 | **Settings page** | Full `SettingsPanel`: model select dropdown, working directory input, OpenAI API key (localStorage), theme toggle, shortcuts |
| 6 | **Export chat** | Export dropdown in toolbar; Markdown download (`.md`) + Print/PDF (opens styled HTML in new tab) |

### ✅ Tier 3 — Complete
| # | Feature | Implementation |
|---|---------|---------------|
| 7 | **File watcher** | `GET/POST /api/watch` routes (fs.watch, event queue, 8s poll); `FileWatcher.jsx` widget in sidebar footer |
| 8 | **Voice output (TTS)** | `useTTS` hook using Web Speech API; "🔊 Read" button on every AI bubble; pulsing stop indicator |
| 10 | **Usage dashboard** | `useStats` hook (localStorage); `UsageDashboard.jsx` with today/all-time tiles + 7-day bar chart |

### ✅ Tier 4 — Complete (Polish + Scheduled Summaries)
| # | Feature | Implementation |
|---|---------|---------------|
| P1 | **Animated skeleton loaders** | `PanelSkeleton` → shimmer-animated `skel-block` CSS, replaces plain "Loading…" text |
| P2 | **Toast notifications** | `useToast` (Zustand) + `ToastContainer.jsx`; fire on file attach, binary file warn, MD/PDF export confirm |
| P3 | **⌘E export shortcut** | `vault:export-chat` custom event dispatched from `App.jsx`, listened in `Chat.jsx` |
| P4 | **Mobile toolbar fixes** | `@media ≤600px` rules: toolbar no-wrap/scroll, compact button sizes, export dropdown positioning |
| 11 | **Scheduled summaries** | `server/routes/digest.js` — SQLite-backed, scans dirs for changed files, AI summary, 5-min scheduler loop; `DigestPanel.jsx` with History/Schedule tabs, Run-now strip, collapsible digest cards, interval config, per-dir management |

### 🔜 Remaining
| # | Feature | Notes |
|---|---------|-------|
| 9 | **More connectors** | Notion, GitHub Issues, browser history |

---

## Dependencies

**Server**: express, cors, compression, better-sqlite3, pdf-parse, mammoth, xlsx, fs-extra, trash, axios, md5, simple-git, js-yaml, mailparser, html-to-text, @modelcontextprotocol/sdk, openai

**Client**: react, react-dom, zustand, axios, lucide-react, react-markdown, tailwindcss
