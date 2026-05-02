# Vault AI — GitHub Copilot Instructions

> **Long-context product memory for GitHub Copilot.**
> Read this file before generating any code, tests, docs, or architecture decisions for this repository.

---

## 1. What Is Vault AI

Vault AI is a **privacy-first, local AI-powered file and document management platform** available as a desktop web app and mobile companion. Users manage, search, organize, generate, and understand files through natural language conversation with locally-running AI models.

**Core promise:** No cloud. No data egress. No API keys. No telemetry. Ever.

Everything runs on the user's machine:
- AI models via **Ollama** (`localhost:11434`)
- Vector store via **SQLite** (embedded, zero infra)
- File system via **Node.js `fs-extra` + `trash`** (OS trash, never hard delete)
- External connectors are also local-only (Obsidian vault, local SQLite DBs, local Git repos, local .mbox files, local bookmarks)

---

## 2. Repository Layout

```
VaultAI/
├── .github/
│   └── copilot-instructions.md   ← you are here
├── doc/
│   ├── product/
│   │   ├── product-overview.md   # Personas, market, pillars
│   │   ├── prd.md                # User stories, acceptance criteria
│   │   └── roadmap.md            # v1.0 → v5.0 versioned roadmap
│   ├── technical/
│   │   ├── architecture.md       # Full system diagram + data flows
│   │   ├── features.md           # Detailed feature specs
│   │   ├── agents.md             # Multi-agent orchestration design
│   │   ├── connectors.md         # Local data source connectors
│   │   └── mcp.md                # Model Context Protocol server + client
│   └── prompts/
│       ├── replit-build-prompt.md
│       ├── gen-ai-addon-prompt.md
│       ├── mobile-app-prompt.md
│       ├── agents-prompt.md
│       ├── connectors-prompt.md
│       ├── mcp-prompt.md
│       └── system-prompts.md
└── src/
    ├── webapp/                   # Main desktop application
    │   ├── client/               # React + Vite frontend (port 5173)
    │   └── server/               # Node.js + Express backend (port 3001)
    ├── landing/                  # Marketing landing page
    └── mobile/                   # React Native + Expo companion app
```

---

## 3. Tech Stack — Never Deviate Without Explicit Instruction

| Layer | Technology | Notes |
|---|---|---|
| **webapp/client** | React 18 + Vite + TailwindCSS + Zustand | No Redux, no MUI |
| **webapp/server** | Node.js 18+ + Express | No NestJS, no Fastify |
| **AI runtime** | Ollama HTTP API (`localhost:11434`) | No OpenAI, no Anthropic cloud |
| **Vector store** | SQLite + `better-sqlite3` + `sqlite-vec` | No Chroma, no Pinecone |
| **Document parsing** | `pdf-parse` (PDF), `mammoth` (DOCX) | Already chosen |
| **File ops** | `fs-extra` + `trash` | Always use `trash` for deletes |
| **Git connector** | `simple-git` | Read-only by default |
| **MCP** | `@modelcontextprotocol/sdk` | stdio + SSE transports |
| **Streaming** | Server-Sent Events (SSE) | Not WebSockets |
| **Mobile** | React Native + Expo + NativeWind | No bare RN |

---

## 4. Architecture Rules

### 4.1 Privacy — Non-Negotiable
- The server **must never** make HTTP calls to any host other than `localhost` and loopback addresses
- No analytics, no error telemetry, no usage tracking
- All connector reads are local files/processes only
- Validate all file paths — **reject any path containing `..` traversal**
- File deletes **always** go to OS trash via `trash` — never `fs.unlink` for user-initiated deletes

### 4.2 Backend Structure (`server/`)
```
server/
├── index.js            # Express app setup, port 3001
├── routes/
│   ├── chat.js         # POST /api/chat — main conversation endpoint
│   ├── files.js        # GET/POST /api/files — file operations
│   ├── models.js       # GET /api/models — Ollama model list + status
│   ├── search.js       # POST /api/search — semantic search
│   ├── generate.js     # POST /api/generate — SSE streaming generation
│   ├── agents.js       # POST /api/agents — multi-agent workflow
│   ├── connectors.js   # /api/connectors — connector CRUD + query
│   └── mcp.js          # /api/mcp — MCP server control + client config
├── services/
│   ├── ollama.js       # Ollama API wrapper + model router
│   ├── fileOps.js      # File system operations (uses fs-extra + trash)
│   ├── docReader.js    # PDF/DOCX/TXT/MD content extraction
│   ├── embeddings.js   # Chunk text + generate embeddings via Ollama
│   ├── vectorStore.js  # SQLite-vec read/write for semantic search
│   └── genAI.js        # Document generation + transformation logic
├── tools/
│   └── fileTools.js    # Ollama function-call tool definitions
├── agents/
│   ├── orchestrator.js # Task decomposition + agent graph builder
│   ├── registry.js     # Agent type → handler mapping
│   ├── runner.js       # Parallel + sequential execution engine
│   └── memory.js       # Per-workflow shared context memory
├── connectors/
│   ├── base.js         # BaseConnector interface
│   ├── registry.js     # Connector instances registry
│   ├── obsidian.js     # Obsidian vault reader (Markdown + frontmatter)
│   ├── sqlite.js       # Natural language → SQL on local SQLite DBs
│   ├── git.js          # Git history + diff reader (simple-git)
│   ├── email.js        # .mbox / .eml parser (mailparser)
│   └── bookmarks.js    # Browser bookmark files (Chrome/Firefox/Safari)
└── mcp/
    ├── server.js       # MCP server — exposes Vault tools via stdio/SSE
    ├── client.js       # MCP client — connects to external MCP servers
    ├── tools.js        # Tool definitions exposed by MCP server
    └── registry.js     # Connected external MCP servers registry
```

### 4.3 Frontend Structure (`client/src/`)
```
client/src/
├── App.jsx
├── main.jsx
├── components/
│   ├── Chat.jsx              # Main chat panel
│   ├── MessageBubble.jsx     # User / AI message display
│   ├── FileBrowser.jsx       # Left-panel directory tree
│   ├── FileItem.jsx          # Single file row in browser
│   ├── ModelPanel.jsx        # Model status + role assignments
│   ├── ConfirmDialog.jsx     # Modal for destructive action confirmation
│   ├── GeneratePanel.jsx     # Create / Transform / Synthesize / Extract tabs
│   ├── StatusBar.jsx         # Bottom bar: model, connection, privacy
│   ├── PrivacyBadge.jsx      # Green lock — all local indicator
│   ├── agents/
│   │   ├── AgentWorkflowPanel.jsx  # Live agent workflow progress
│   │   ├── AgentStep.jsx           # Single step status (pending/running/done)
│   │   └── WorkflowToggle.jsx      # Simple / Multi-Agent mode switch
│   ├── connectors/
│   │   ├── ConnectorsPanel.jsx     # List + manage connected sources
│   │   ├── ConnectorCard.jsx       # Per-connector status card
│   │   ├── ConnectorConfigForm.jsx # Config input (vault path, db path, etc.)
│   │   └── ConnectorQueryInput.jsx # Natural language query input
│   └── mcp/
│       ├── MCPPanel.jsx            # MCP server toggle + external servers list
│       ├── MCPServerCard.jsx       # Per-server status card
│       ├── MCPAddServerForm.jsx    # Add new external MCP server
│       └── MCPToolBadge.jsx        # Display available tools from a server
├── store/
│   └── useStore.js           # Zustand global state
└── api/
    └── client.js             # Axios API client (baseURL: http://localhost:3001)
```

### 4.4 Mobile Structure (`mobile/src/`)
```
mobile/src/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx       # Chat tab
│   │   ├── files.tsx       # File browser tab
│   │   ├── generate.tsx    # Quick generate tab
│   │   └── settings.tsx    # Desktop connection settings
│   ├── _layout.tsx
│   └── connect.tsx         # Desktop discovery + connect screen
├── components/             # Mobile UI components
├── store/                  # Zustand state (shared shape with webapp)
├── api/                    # Desktop API client (LAN HTTP calls to desktop)
├── hooks/
│   ├── useVaultConnection.ts  # LAN connection management
│   └── useVoiceInput.ts       # Voice-to-text for mobile chat
└── constants/              # Theme tokens (NativeWind)
```

---

## 5. Key Features & Behaviour

### 5.1 File Operations
- All operations take a natural language instruction → parsed by LLM with function calling
- **Confirmation is required** for: any delete, any bulk operation (3+ files), any overwrite
- Confirmation shows the exact list of affected files before execution
- Single move/copy/rename: auto-execute (no confirmation needed)
- Always validate paths: no `..` traversal, no paths outside the user's configured root
- Use `trash` package (OS recycle bin) for all user-initiated deletes

### 5.2 Model Routing
| Task Type | Preferred Model | Fallback |
|---|---|---|
| File operations (fast) | `llama3.2:3b` | Any smallest available |
| Document Q&A | `mistral:7b` | Any large model |
| Embeddings | `nomic-embed-text` | Any embedding model |
| Vision / images | `llava:7b` | Skip vision, text-only fallback |
| Code files | `qwen2.5-coder:7b` | `codellama:7b` |
| Generation / transform | `mistral:7b` / `llama3.1:8b` | Largest available |
| Orchestrator planning | Largest available | Any large model |

- App **must work with just 1 model installed** — always fall back gracefully
- Show the user which model was actually used
- Warn (don't error) when preferred model is absent

### 5.3 Document Intelligence
- Supported file types: PDF, DOCX, DOC, TXT, MD, and code files (.py .js .ts .go .java .rs .cpp .cs .json .yaml .toml)
- File size limit: 50 MB per document
- Large files: chunk and retrieve relevant sections (don't stuff entire doc into context)
- Always cite source file + location (section/page) in Q&A answers
- Semantic search: chunk → embed via Ollama → store in SQLite-vec → cosine similarity query

### 5.4 Generation (SSE Streaming)
- All generation routes must stream via Server-Sent Events
- Client reads `EventSource` or `fetch` with `ReadableStream`
- Events: `{ type: "token", content: "..." }` and `{ type: "done", filePath: "..." }`
- Generated files saved to user-specified output path

### 5.5 Multi-Agent Workflow
1. Orchestrator classifies: simple (direct) vs. complex (multi-step)
2. Complex → decompose into task graph: `{ id, type, instruction, dependsOn[] }`
3. Independent tasks run **in parallel** (`Promise.all`)
4. Dependent tasks run **sequentially** after dependencies resolve
5. All agents share a `WorkflowMemory` object (context passing between steps)
6. UI shows live per-agent status: pending / running / done / error

Agent types: `file`, `document`, `search`, `generation`, `connector`, `mcp`, `orchestrator`

### 5.6 Connectors
All connectors implement `BaseConnector` with: `connect`, `disconnect`, `isConnected`, `read`, `write` (optional), `list`, `search`

| Connector | Key Config | Notes |
|---|---|---|
| `obsidian` | `vaultPath` | Reads .md files, frontmatter, wikilinks |
| `sqlite` | `dbPath` | NL → SQL, read-only by default |
| `git` | `repoPath` | History, diffs, code search (simple-git) |
| `email` | `mailboxPath` | .mbox / .eml parser (mailparser) |
| `bookmarks` | `browserType`, `profilePath` | Chrome/Firefox/Safari bookmark files |

### 5.7 MCP Integration
- **MCP Server** (port configurable, default SSE): exposes 13 Vault tools (`vault_list_directory`, `vault_read_file`, `vault_search`, `vault_move_file`, `vault_copy_file`, `vault_delete_file`, `vault_create_folder`, `vault_rename_file`, `vault_generate_document`, `vault_transform_document`, `vault_extract_data`, `vault_query_connector`, `vault_run_workflow`)
- **MCP Client**: connects to external servers (brave-search, github, postgres, fetch, etc.), namespaces their tools as `serverName__toolName`
- Transports: `stdio` for local clients (Claude Desktop), `SSE` for web clients

---

## 6. Coding Conventions

### 6.1 General
- JavaScript (ES modules) for all server and client code unless the file is already TypeScript
- Mobile (`src/mobile`) is TypeScript + `.tsx`
- Use `async/await` — no raw `.then()` chains
- Error handling: return structured errors `{ error: true, message: "...", code: "..." }` from API routes — never throw unhandled
- Log with `console.error` for errors, `console.log` for info — no third-party logger unless asked

### 6.2 API Routes
- All routes under `/api/*`
- Successful response: `{ success: true, data: ... }`
- Error response: `{ success: false, error: "message", code: "ERROR_CODE" }`
- Streaming routes use SSE — set `Content-Type: text/event-stream`, `Cache-Control: no-cache`

### 6.3 Security
- Sanitize all file paths — reject `..` traversal with a 400 error
- Never execute shell commands with user-provided strings
- Never call external HTTP endpoints from server code
- Treat all Ollama responses as untrusted text — no `eval`, no `Function()` constructor

### 6.4 Frontend State (Zustand)
- Single store in `client/src/store/useStore.js`
- Slices: `chat`, `files`, `models`, `generate`, `agents`, `connectors`, `mcp`
- Never call API directly from components — always use `useStore` actions

### 6.5 Styling
- TailwindCSS utility classes only — no inline styles, no CSS modules unless explicitly asked
- Dark mode first (the app uses a dark theme)
- Mobile: NativeWind (same Tailwind class names)

---

## 7. Product Roadmap — Version Context

| Version | Theme | Status |
|---|---|---|
| **v1.0** | Core file management + multi-model Ollama | MVP |
| **v1.5** | Semantic search + document Q&A + smart file ops | Intelligence |
| **v2.0** | Document generation + transformation + streaming | Generation |
| **v2.5** | React Native mobile companion (LAN) | Mobile |
| **v3.0** | Local data source connectors | Connectors |
| **v3.5** | Multi-agent orchestration + parallel workflows | Agents |
| **v4.0** | MCP server + client (universal integration hub) | MCP |
| **v4.5** | Multi-user, RBAC, audit logging, Docker | Team |
| **v5.0** | Scheduled agents, watch folders, workflow builder | Automation |

When generating code for a feature, check which version it belongs to. Do not implement v3+ features unless explicitly asked while working on v1/v2 code.

---

## 8. User Personas — Context for UX Decisions

| Persona | Name | Context |
|---|---|---|
| Solo professional | Clara (Immigration Attorney) | Handles sensitive client files; ethics rules block cloud AI; needs zero-friction local AI |
| Compliance team | Marcus (HealthTech VP Eng) | PHI data; compliance blocks cloud; needs on-prem, audit logs, RBAC |
| Privacy-conscious dev | Priya (Indie Developer) | Tired of wiring Ollama + LangChain manually; wants a managed local AI platform |

UX decisions should prioritize Clara first (simplicity, trust signals, zero setup friction), then Marcus (governance, transparency), then Priya (power features, extensibility).

---

## 9. Competitive Context — What Makes Vault AI Different

| Competitor | Gap |
|---|---|
| Ollama | No UI, no file management, no agent layer |
| AnythingLLM | No file ops, limited gen AI, no governance |
| LM Studio | Consumer chat only, no file system integration |
| Open WebUI | Chat focused, no file system integration |
| GPT4All | Basic RAG only, no agent tools, no gen AI |

**Vault AI's unique position:** Only product combining local file management + multi-model AI + generative capabilities + connectors + MCP in a single managed desktop experience.

---

## 10. What Copilot Should Always Do

1. **Privacy check first** — before any code that touches networking, storage, or file ops, verify it respects the zero-egress rule
2. **Confirm destructive actions** — any delete or bulk operation must have a confirmation step
3. **Respect the model router** — don't hardcode a model name; always call the router/service
4. **Stream generation output** — all LLM generation routes must use SSE
5. **Sanitize file paths** — always validate and reject `..` traversal
6. **Use trash, not unlink** — for user-initiated file deletes
7. **Keep data local** — never suggest cloud storage, external APIs, or third-party AI services
8. **Match the stack** — don't suggest adding new frameworks or libraries not already in the stack without flagging the addition explicitly
9. **Cite sources** — document Q&A responses must include source file + location
10. **Graceful degradation** — assume minimum 1 Ollama model; always fall back, never hard-fail
