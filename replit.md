# Vault AI

Privacy-first, local AI-powered file and document management platform. Runs entirely in your browser against a local Node.js server. No cloud, no subscriptions — Ollama for 100% local AI, OpenAI as a fallback/demo provider.

---

## Project Structure

```
/
├── src/
│   ├── webapp/                    # Main application (port 5173 client, 3001 server)
│   │   ├── client/                # React 18 + Vite frontend
│   │   │   └── src/
│   │   │       ├── App.jsx                    # Root layout, sidebar, nav, session management
│   │   │       ├── main.jsx                   # React entry point
│   │   │       ├── index.css                  # All styles (~3100+ lines, structured in tiers)
│   │   │       ├── components/
│   │   │       │   ├── Chat.jsx               # Main chat panel, streaming, voice, drag-drop, export
│   │   │       │   ├── FileBrowser.jsx        # File/folder explorer with AI chat integration
│   │   │       │   ├── ModelPanel.jsx         # Ollama model manager (pull, delete, switch)
│   │   │       │   ├── StatusBar.jsx          # Bottom bar: provider, model, directory, tokens
│   │   │       │   ├── SettingsPanel.jsx      # Theme, font, model, working directory settings
│   │   │       │   ├── SessionHistory.jsx     # Saved chat threads (grouped Today/Yesterday/Older)
│   │   │       │   ├── ErrorBoundary.jsx      # React error boundary wrapper
│   │   │       │   ├── ConfirmDialog.jsx      # Destructive-action confirm modal
│   │   │       │   ├── ToastContainer.jsx     # Toast notification overlay
│   │   │       │   ├── UsageDashboard.jsx     # 7-day bar chart + stats tiles (localStorage)
│   │   │       │   ├── FileWatcher.jsx        # Real-time folder watcher (polls /api/watch)
│   │   │       │   ├── DigestPanel.jsx        # Scheduled AI summaries (History + Schedule tabs)
│   │   │       │   ├── MessageBubble.jsx      # Individual chat message renderer (markdown + tools)
│   │   │       │   ├── document/
│   │   │       │   │   └── DocumentAgentPanel.jsx  # Ingest, summarize, extract, PII detect, classify
│   │   │       │   ├── research/
│   │   │       │   │   └── ResearchPanel.jsx       # AI-powered web research with source tracking
│   │   │       │   ├── connectors/
│   │   │       │   │   ├── ConnectorsPanel.jsx     # Connector grid + connect/disconnect flow
│   │   │       │   │   ├── ConnectorCard.jsx       # Individual connector card
│   │   │       │   │   └── ConnectorConfigForm.jsx # Config modal (handles text/password/select/number/boolean + help text)
│   │   │       │   ├── agents/
│   │   │       │   │   ├── AgentWorkflowPanel.jsx  # Multi-agent workflow visualiser
│   │   │       │   │   ├── AgentStep.jsx           # Step card in workflow
│   │   │       │   │   └── WorkflowToggle.jsx      # Simple ↔ Multi-agent mode switch
│   │   │       │   ├── mcp/
│   │   │       │   │   ├── MCPPanel.jsx            # MCP server manager
│   │   │       │   │   ├── MCPServerCard.jsx       # Individual MCP server card
│   │   │       │   │   ├── MCPAddServerForm.jsx    # Add new MCP server form
│   │   │       │   │   └── MCPToolBadge.jsx        # Inline tool-use indicator in messages
│   │   │       │   └── SkillsPanel.jsx             # AI skill library browser
│   │   │       ├── hooks/
│   │   │       │   ├── useStore.js            # Zustand global state
│   │   │       │   ├── useTheme.js            # Dark/light/system theme toggle
│   │   │       │   ├── useSessionHistory.js   # localStorage session save/load/delete
│   │   │       │   ├── useStats.js            # Usage tracking (messages, files, tools, exports)
│   │   │       │   ├── useToast.js            # Toast hook (success/info/warn/error)
│   │   │       │   └── useTTS.js              # Text-to-speech for AI responses
│   │   │       ├── api/
│   │   │       │   └── client.js              # Axios API client + SSE streaming helper
│   │   │       └── store/
│   │   │           └── useStore.js            # Re-export of Zustand store
│   │   │
│   │   └── server/                # Node.js + Express API (port 3001)
│   │       ├── index.js           # Server entry: routes, compression, CORS, production static
│   │       ├── routes/
│   │       │   ├── chat.js        # /api/chat — streaming SSE + multi-agent orchestration
│   │       │   ├── files.js       # /api/files — list, read, write, delete, mkdir
│   │       │   ├── models.js      # /api/models — list Ollama/OpenAI models, health check
│   │       │   ├── search.js      # /api/search — vector + keyword hybrid search
│   │       │   ├── generate.js    # /api/generate — document generation from templates
│   │       │   ├── documents.js   # /api/documents — ingest, summarize, extract, PII, classify
│   │       │   ├── agents.js      # /api/agents — multi-agent workflow runner
│   │       │   ├── connectors.js  # /api/connectors — connect, disconnect, list, tool execution
│   │       │   ├── mcp.js         # /api/mcp — MCP server start/stop/tool call
│   │       │   ├── research.js    # /api/research — web search + AI synthesis
│   │       │   ├── skills.js      # /api/skills — skill library CRUD
│   │       │   ├── watch.js       # /api/watch — real-time file system watcher
│   │       │   └── digest.js      # /api/digest — scheduled AI summaries (SQLite-backed, 5-min scheduler)
│   │       ├── services/
│   │       │   ├── ollama.js      # OllamaClient + ModelRouter (Ollama→OpenAI fallback)
│   │       │   └── vectorStore.js # In-memory vector store (embeddings + cosine similarity)
│   │       └── connectors/
│   │           ├── base.js            # BaseConnector abstract class
│   │           ├── registry.js        # ConnectorRegistry — register, connect, dispatch tools
│   │           ├── obsidian.js        # Obsidian vault connector (markdown files)
│   │           ├── sqlite.js          # SQLite database connector (query, list tables)
│   │           ├── git.js             # Git repository connector (log, commit, diff)
│   │           ├── email.js           # Local email archive connector (mbox/maildir)
│   │           ├── bookmarks.js       # Chrome/Firefox bookmarks connector
│   │           ├── notion.js          # Notion API connector (pages, databases, search)
│   │           ├── github.js          # GitHub REST API connector (issues, PRs, README)
│   │           └── browserhistory.js  # Browser history connector (Chrome/Brave/Edge/Firefox)
│   │
│   └── landing/                   # Marketing landing page (port 5000)
│       └── src/
│           └── App.jsx            # Single-file landing page (announcement bar, hero, features, FAQ)
│
└── replit.md                      # This file
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend framework | React 18 with hooks |
| Frontend build | Vite 5 (HMR, code-split lazy panels) |
| Styling | Plain CSS with CSS variables (no Tailwind in webapp) |
| State management | Zustand |
| AI (local) | Ollama (llama3.2, nomic-embed-text, etc.) |
| AI (cloud fallback) | OpenAI GPT-4o via Replit integration |
| Backend | Node.js 18 + Express |
| Database | better-sqlite3 (digest schedules) |
| Vector store | In-memory cosine similarity (vectorStore.js) |
| Landing page | React 18 + Vite + Tailwind CSS |
| Icons | lucide-react |
| Markdown | react-markdown |
| HTTP client | Axios |
| Streaming | Server-Sent Events (SSE) via `sendChatStream` |

---

## Workflows

| Name | Command | Port | Purpose |
|------|---------|------|---------|
| Start Vault AI | `cd src/webapp && npm run dev` | 5173 (client), 3001 (server) | Main app — runs both Vite dev server and Express concurrently |
| Vault AI Landing | `cd src/landing && npm run dev` | 5000 | Marketing landing page |
| Install Only | `cd src/webapp && npm install` | — | Dependency install only |

---

## API Endpoints

All endpoints are served by Express on port 3001. The Vite dev server on 5173 proxies `/api/*` to 3001.

### Core
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Server health check |
| `/api/models` | GET | List models + provider status (Ollama or OpenAI) |

### Chat
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/chat` | POST | Non-streaming chat (multi-agent mode) |
| `/api/chat/stream` | POST | SSE streaming chat with tool calls |

### Files
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/files/list` | GET | List directory contents |
| `/api/files/read` | GET | Read file content |
| `/api/files/write` | POST | Write file |
| `/api/files/delete` | DELETE | Delete file or directory |
| `/api/files/mkdir` | POST | Create directory |

### Documents
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/documents/ingest` | POST | Ingest file into vector store |
| `/api/documents/query` | POST | Semantic query against ingested docs |
| `/api/documents/summarize` | POST | AI summary of a document |
| `/api/documents/extract` | POST | Extract structured data (JSON) from document |
| `/api/documents/pii` | POST | Detect PII (names, emails, SSNs, cards) |
| `/api/documents/classify` | POST | Classify document type/topic |
| `/api/documents/index-dir` | POST | Batch ingest all files in a directory |

### Search
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/search` | POST | Hybrid vector + keyword search over ingested docs |

### Connectors
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/connectors` | GET | List all 8 connectors + schema |
| `/api/connectors/:name/connect` | POST | Connect a connector with config |
| `/api/connectors/:name/disconnect` | POST | Disconnect a connector |
| `/api/connectors/:name/tools` | GET | List tools exposed by a connected connector |

### File Watcher
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/watch/status` | GET | List actively watched directories |
| `/api/watch/start` | POST | Start watching a directory |
| `/api/watch/stop` | POST | Stop watching a directory |
| `/api/watch/events` | GET | Poll recent file events for a watched dir |

### Scheduled Digests
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/digest/history` | GET | List all past digest summaries |
| `/api/digest/run` | POST | Manually trigger a digest for a directory |
| `/api/digest/schedule` | GET | Get current schedule config |
| `/api/digest/schedule` | PUT | Update schedule (dirs, interval_hours, enabled) |
| `/api/digest/:id` | DELETE | Delete a digest history entry |

### Generate / Research / Skills / Agents / MCP
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/generate` | POST | Generate documents from prompt/template |
| `/api/research` | POST | AI-powered web research + synthesis |
| `/api/skills` | GET/POST/DELETE | Skill library CRUD |
| `/api/agents/run` | POST | Run multi-agent workflow |
| `/api/mcp/servers` | GET/POST | List/add MCP servers |
| `/api/mcp/call` | POST | Call an MCP tool |

---

## Connectors (8 total)

All connectors extend `BaseConnector` and are registered in `registry.js`. Once connected, they expose AI tools automatically added to the chat's tool list.

| Connector | Name | Tools | Config |
|-----------|------|-------|--------|
| Obsidian | `obsidian` | `obsidian_list`, `obsidian_read`, `obsidian_search`, `obsidian_write` | `vaultPath` |
| SQLite | `sqlite` | `sqlite_list_tables`, `sqlite_query`, `sqlite_read_table` | `dbPath`, `allowWrite` |
| Git | `git` | `git_log`, `git_read_commit`, `git_recent` | `repoPath` |
| Email | `email` | `email_list`, `email_read`, `email_search` | `archivePath`, `format` |
| Bookmarks | `bookmarks` | `bookmarks_list`, `bookmarks_search` | `browser`, `profilePath` |
| Notion | `notion` | `notion_list`, `notion_read`, `notion_search` | `apiKey` (password), `rootPageId` |
| GitHub | `github` | `github_list`, `github_read`, `github_search`, `github_readme` | `token` (password), `repo` |
| Browser History | `browserhistory` | `browserhistory_list`, `browserhistory_search`, `browserhistory_top` | `browser` (select), `historyPath`, `limit` (number) |

The `ConnectorConfigForm` supports field types: `text`, `password` (masked), `select` (dropdown), `number`, `boolean` (checkbox). It also renders `help` text below each field.

---

## Key Hooks

| Hook | File | Purpose |
|------|------|---------|
| `useStore` | `store/useStore.js` | Global Zustand store (messages, models, provider, activeTab, demoMode, etc.) |
| `useTheme` | `hooks/useTheme.js` | `light` / `dark` / `system` theme with `data-theme` on `<html>` |
| `useSessionHistory` | `hooks/useSessionHistory.js` | Save/load/delete chat sessions from localStorage |
| `useStats` | `hooks/useStats.js` | Track `message_sent`, `file_attached`, `tool_run`, `export`, `session_start` per day in localStorage |
| `useToast` | `hooks/useToast.js` | `success()`, `info()`, `warn()`, `error()` toast notifications |
| `useTTS` | `hooks/useTTS.js` | Web Speech API text-to-speech for AI messages |

---

## AI Provider Flow

```
User sends message
       │
       ▼
ModelRouter.route()
       │
       ├─── Ollama available? ──► Use Ollama (local, private)
       │
       └─── Ollama unavailable? ──► Use OpenAI (cloud, via Replit integration)
```

The `ModelRouter` in `services/ollama.js` handles automatic fallback. The privacy badge in the chat toolbar shows `🔒 Local · Private` (Ollama) or `☁ Cloud · OpenAI` depending on which provider is active.

In **Demo Mode** (triggered from landing page or via `activateDemoMode()`):
- Sets `demoMode=true`, `activeProvider='openai'`
- Unlocks the full UI without requiring Ollama setup
- All AI calls route through OpenAI (real responses, not simulated)
- Footer shows: *"Demo mode · Live AI via OpenAI · Install Ollama for local-only AI"*

---

## Streaming Architecture

Chat messages stream via SSE:

1. Client calls `sendChatStream()` in `api/client.js` — opens a `fetch()` with `Content-Type: text/event-stream`
2. Server in `routes/chat.js` writes `data: {"type":"token","content":"..."}` chunks
3. Tool calls emit `data: {"type":"tool","name":"...","status":"running|done"}`
4. Final `data: {"type":"done","model":"...","toolsUsed":[...]}` closes the stream
5. Client accumulates tokens into `streamContent` state, renders live in the chat UI

---

## State Management

Zustand store (`useStore`) holds all global state:

| Key | Type | Description |
|-----|------|-------------|
| `messages` | `Message[]` | Current chat thread |
| `workingDirectory` | `string` | Active file system path |
| `activeProvider` | `'ollama' \| 'openai' \| null` | Current AI provider |
| `availableModels` | `Model[]` | Models from Ollama or OpenAI |
| `selectedModel` | `string` | User-chosen model |
| `ollamaConnected` | `boolean` | Whether Ollama is reachable |
| `isLoading` | `boolean` | Non-streaming request in flight |
| `pendingAction` | `object \| null` | Action awaiting user confirmation |
| `workflowMode` | `'simple' \| 'multi-agent'` | Chat mode |
| `activeTab` | `string` | Current sidebar panel |
| `demoMode` | `boolean` | Demo mode active |
| `externalMCPTools` | `Tool[]` | Tools from connected MCP servers |

---

## Usage Dashboard

Stats are stored in `localStorage` under `vault_ai_stats` as a date-keyed object:

```json
{
  "2026-05-03": {
    "messages": 12,
    "filesAttached": 3,
    "toolsRun": 7,
    "exports": 1,
    "sessions": 2
  }
}
```

**Tracked events** (all wired in `Chat.jsx` → `useStats.track()`):
- `message_sent` — every user message sent
- `file_attached` — drag-drop or file picker attachment
- `tool_run` — when AI uses one or more tools (count tracked)
- `export` — Markdown download or HTML print export

The `UsageDashboard` component shows: today/all-time stat tiles + 7-day bar chart.

---

## Scheduled Digests

Stored in SQLite at `src/webapp/data/digest.db`. Two tables:

- **`digests`** — history of past summaries (dir, summary, file_count, changed_files, model, created)
- **`schedule`** — singleton row (id=1) with dirs, interval_hours, enabled, last_run, next_run

A Node.js `setInterval` runs every 5 minutes on the server and fires the digest generator when `next_run` is due. The generator:
1. Scans the directory for files modified in the last `interval_hours`
2. Reads up to 800 chars of each changed file
3. Calls the AI to produce a summary
4. Saves to `digests` table

---

## File Watcher

Polls `chokidar` on the server every 8 seconds from the client. Events (add/change/delete) are stored in a server-side ring buffer per watched directory and returned on `/api/watch/events`.

---

## Landing Page

Single-file React app (`src/landing/src/App.jsx`) served on port 5000.

Sections: announcement bar → hero → features grid → how it works → privacy section → FAQ → CTA footer.

**APP_URL detection** (critical for "Try Demo" links):
```js
const APP_URL = (() => {
  const { hostname, port, protocol } = window.location;
  if (hostname === 'localhost' || hostname === '127.0.0.1') return `${protocol}//localhost:5173`;
  if (port && port !== '80' && port !== '443') return `${protocol}//${hostname}:5173`; // Replit dev
  return '/app'; // Production
})();
```

In production, the Express server serves the landing build at `/` and the client build at `/app`.

---

## Production Build

```bash
# Build client
cd src/webapp/client && npm run build

# Build landing
cd src/landing && npm run build

# Start production server (serves both from Express)
cd src/webapp && npm start
```

Express in `NODE_ENV=production` serves:
- `/app` → `src/webapp/client/dist/index.html` (SPA)
- `/` → `src/landing/dist/index.html` (SPA)
- All `/api/*` routes handled by Express directly

---

## Environment Variables / Integrations

| Variable | Source | Usage |
|----------|--------|-------|
| `OPENAI_API_KEY` | Replit OpenAI integration (`javascript_openai_ai_integrations`) | OpenAI API calls in `services/ollama.js` (ModelRouter fallback) |
| `PORT` | Replit env | Express server port (default: 3001) |
| `NODE_ENV` | Replit env | `production` enables static file serving from Express |

The OpenAI integration is already installed (`javascript_openai_ai_integrations==2.0.0`). No manual key setup needed.

---

## CSS Architecture

All styles live in `src/webapp/client/src/index.css` (~3100+ lines). Structured in tiers:

| Lines (approx) | Content |
|----------------|---------|
| 1–200 | CSS variables (light/dark theme, spacing, colors) |
| 200–800 | Base layout, sidebar, nav, chat area |
| 800–1400 | File browser, model panel, status bar |
| 1400–2038 | Tier 1: mobile layout, privacy badge, drag-drop, settings |
| 2038–2266 | Tier 2: connectors, MCP, agents, skills, research |
| 2266–2496 | Tier 3: voice, TTS, export, onboarding |
| 2496–2800 | Tier 4: skeleton loaders, toasts, mobile toolbar, digest |
| 2800–3100+ | Tier 5/misc: usage dashboard, session history polish |

---

## Known Limitations / Future Work

- **Vector store is in-memory** — restarting the server loses all ingested document embeddings. Persisting to SQLite or a file is a natural next step.
- **File watcher ring buffer is in-memory** — events are lost on server restart.
- **Browser History connector** requires that the browser is not currently open (history DB is locked while the browser runs). A temp-copy approach is already implemented to mitigate this.
- **Digest scheduler** is process-local (no persistence of schedule across restarts beyond the SQLite config row).

---

## Completed Feature Tiers

| Tier | Features |
|------|---------|
| 1 | Drag-drop file attachment, privacy badge, mobile layout, settings panel |
| 2 | Ollama onboarding, connectors panel (5 connectors), MCP tools, research panel |
| 3 | Chat export (Markdown + HTML print), voice input (Web Speech API), TTS playback, file watcher, usage dashboard |
| 4 | Animated skeleton loaders, toast system, ⌘E export shortcut, mobile toolbar scroll fix, scheduled summaries (digest) |
| 5 | Notion connector, GitHub connector, Browser History connector (total: 8 connectors) |
| Bug fixes | Demo link APP_URL detection for Replit dev; useMemo removed; useStats wired to Chat; ConnectorConfigForm password/select/number/help fields; demo footer text corrected |
