# Vault AI — Technical Architecture

**Version:** 1.0  
**Date:** 2026-05-02

---

## System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                        USER'S MACHINE                            │
│                                                                  │
│  External MCP Clients        External MCP Servers                │
│  (Claude Desktop, Cursor)    (brave-search, github, postgres)    │
│         │ stdio/SSE                    │ stdio                   │
│         ▼                             ▼                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      Vault AI App                         │   │
│  │                                                           │   │
│  │  ┌──────────────────┐    ┌──────────────────────────┐    │   │
│  │  │  React Frontend  │    │      File Browser         │    │   │
│  │  │  (Vite port 5173)│    │      (directory tree)     │    │   │
│  │  └────────┬─────────┘    └──────────────────────────┘    │   │
│  │           │ HTTP/SSE                                       │   │
│  │  ┌────────▼──────────────────────────────────────────┐    │   │
│  │  │           Express Backend (port 3001)              │    │   │
│  │  │                                                    │    │   │
│  │  │  ┌──────────┐  ┌──────────┐  ┌────────────────┐   │    │   │
│  │  │  │  Router  │  │ FileOps  │  │   GenAI        │   │    │   │
│  │  │  │ (model   │  │ Service  │  │   Service      │   │    │   │
│  │  │  │ select)  │  │          │  │                │   │    │   │
│  │  │  └──────────┘  └──────────┘  └────────────────┘   │    │   │
│  │  │  ┌──────────┐  ┌──────────┐  ┌────────────────┐   │    │   │
│  │  │  │Orchestrat│  │Connectors│  │  MCP Server    │   │    │   │
│  │  │  │or+Agents │  │Registry  │  │  + Client      │   │    │   │
│  │  │  └──────────┘  └──────────┘  └────────────────┘   │    │   │
│  │  └───────────────────────────────────────────────────┘    │   │
│  │          │ HTTP                                             │   │
│  │  ┌───────▼────────────┐  ┌──────────────────────────┐     │   │
│  │  │  Ollama Runtime    │  │   SQLite-vec Database    │     │   │
│  │  │  localhost:11434   │  │   (embeddings + config)  │     │   │
│  │  │  llama3.2:3b       │  └──────────────────────────┘     │   │
│  │  │  mistral:7b        │                                    │   │
│  │  │  nomic-embed-text  │  ┌──────────────────────────┐     │   │
│  │  │  llava:7b          │  │  Local Data Sources      │     │   │
│  │  │  qwen2.5-coder:7b  │  │  (Obsidian, Git, SQLite, │     │   │
│  │  └────────────────────┘  │   Email, Bookmarks)      │     │   │
│  │                          └──────────────────────────┘     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│                       USER'S FILE SYSTEM                         │
└──────────────────────────────────────────────────────────────────┘

NO EXTERNAL NETWORK CALLS (connectors and MCP servers are also local)
```

---

## Repository Structure

```
VaultAI/                              # repo root
├── README.md
├── doc/
│   ├── product/                      # Product docs
│   │   ├── product-overview.md
│   │   ├── prd.md
│   │   └── roadmap.md
│   ├── technical/                    # Technical docs
│   │   ├── architecture.md
│   │   ├── features.md
│   │   ├── agents.md
│   │   ├── connectors.md
│   │   └── mcp.md
│   └── prompts/                      # AI build prompts
│       ├── replit-build-prompt.md
│       ├── gen-ai-addon-prompt.md
│       ├── mobile-app-prompt.md
│       ├── agents-prompt.md
│       ├── connectors-prompt.md
│       ├── mcp-prompt.md
│       └── system-prompts.md
└── src/
    ├── webapp/                       # Main desktop web application
    │   ├── client/                   # React + Vite frontend
    │   │   ├── src/
    │   │   │   ├── components/
    │   │   │   │   ├── Chat.jsx
    │   │   │   │   ├── MessageBubble.jsx
    │   │   │   │   ├── FileBrowser.jsx
    │   │   │   │   ├── FileItem.jsx
    │   │   │   │   ├── ModelPanel.jsx
    │   │   │   │   ├── ConfirmDialog.jsx
    │   │   │   │   ├── GeneratePanel.jsx
    │   │   │   │   ├── StatusBar.jsx
    │   │   │   │   ├── PrivacyBadge.jsx
    │   │   │   │   ├── agents/
    │   │   │   │   │   ├── AgentWorkflowPanel.jsx
    │   │   │   │   │   ├── AgentStep.jsx
    │   │   │   │   │   └── WorkflowToggle.jsx
    │   │   │   │   ├── connectors/
    │   │   │   │   │   ├── ConnectorsPanel.jsx
    │   │   │   │   │   ├── ConnectorCard.jsx
    │   │   │   │   │   ├── ConnectorConfigForm.jsx
    │   │   │   │   │   └── ConnectorQueryInput.jsx
    │   │   │   │   └── mcp/
    │   │   │   │       ├── MCPPanel.jsx
    │   │   │   │       ├── MCPServerCard.jsx
    │   │   │   │       ├── MCPAddServerForm.jsx
    │   │   │   │       └── MCPToolBadge.jsx
    │   │   │   ├── store/
    │   │   │   │   └── useStore.js
    │   │   │   ├── api/
    │   │   │   │   └── client.js
    │   │   │   ├── App.jsx
    │   │   │   └── main.jsx
    │   │   ├── index.html
    │   │   └── vite.config.js
    │   └── server/                   # Node.js + Express backend
    │       ├── routes/
    │       │   ├── chat.js
    │       │   ├── files.js
    │       │   ├── models.js
    │       │   ├── search.js
    │       │   ├── generate.js
    │       │   ├── agents.js
    │       │   ├── connectors.js
    │       │   └── mcp.js
    │       ├── services/
    │       │   ├── ollama.js
    │       │   ├── fileOps.js
    │       │   ├── docReader.js
    │       │   ├── embeddings.js
    │       │   ├── vectorStore.js
    │       │   └── genAI.js
    │       ├── tools/
    │       │   └── fileTools.js
    │       ├── agents/
    │       │   ├── orchestrator.js
    │       │   ├── registry.js
    │       │   ├── runner.js
    │       │   └── memory.js
    │       ├── connectors/
    │       │   ├── base.js
    │       │   ├── registry.js
    │       │   ├── obsidian.js
    │       │   ├── sqlite.js
    │       │   ├── git.js
    │       │   ├── email.js
    │       │   └── bookmarks.js
    │       ├── mcp/
    │       │   ├── server.js
    │       │   ├── client.js
    │       │   ├── tools.js
    │       │   └── registry.js
    │       └── index.js
    ├── landing/                      # Marketing landing page
    │   ├── public/
    │   └── src/
    │       ├── components/
    │       └── sections/
    └── mobile/                       # React Native companion app
        └── src/
            ├── app/
            │   ├── (tabs)/
            │   │   ├── index.tsx
            │   │   ├── files.tsx
            │   │   ├── generate.tsx
            │   │   └── settings.tsx
            │   ├── _layout.tsx
            │   └── connect.tsx
            ├── components/
            ├── store/
            └── api/
```

---

## Tech Stack

| Package | Technology | Reason |
|---|---|---|
| **webapp/client** | React + Vite + TailwindCSS | Fast dev, component reuse with mobile |
| **webapp/client** | Zustand | Lightweight state, no boilerplate |
| **webapp/server** | Node.js + Express | Fast setup, good fs/stream support |
| **webapp/server** | Ollama (localhost) | Best local model runtime, model agnostic |
| **webapp/server** | SQLite + better-sqlite3 | Zero infra, embedded vector store |
| **webapp/server** | pdf-parse + mammoth | PDF and DOCX text extraction |
| **webapp/server** | fs-extra + trash | Safe file ops, OS trash integration |
| **webapp/server** | Server-Sent Events | Real-time generation streaming |
| **webapp/server** | simple-git | Git connector — read commit history, diffs |
| **webapp/server** | js-yaml | Obsidian connector — parse note frontmatter |
| **webapp/server** | mailparser + html-to-text | Email connector — parse .mbox/.eml files |
| **webapp/server** | @modelcontextprotocol/sdk | MCP server + client — stdio/SSE transport |
| **landing** | React + Vite + TailwindCSS | Consistent stack, fast static build |
| **mobile** | React Native + Expo + NativeWind | iOS + Android, shared React knowledge |

---

## Multi-Model Router

```
User Message
     │
     ▼
┌─────────────────────────────────────────────────┐
│              Task Classifier                     │
│  (keyword + heuristic — no extra LLM call)       │
└──┬──────────┬──────────┬──────────┬─────────────┘
   │          │          │          │
   ▼          ▼          ▼          ▼
file_op   doc_qa    generate    embedding
   │          │          │          │
   ▼          ▼          ▼          ▼
llama3.2  mistral   mistral   nomic-embed
  :3b      :7b       :7b        -text
(fast)  (reasoning) (largest)  (purpose-built)
   │          │          │          │
   └──────────┴──────────┴──────────┘
              │
       Fallback: first available model
```

**Task classification keywords:**

| Task Type | Keywords |
|---|---|
| file_op | move, copy, delete, rename, create, organize, list, find file |
| doc_qa | what, explain, summarize, tell me, describe, read |
| generate | write, draft, create document, generate, make a |
| transform | rewrite, translate, simplify, shorten, improve, convert |
| synthesize | compare, combine, merge, contrast, across files |
| extract | extract, pull out, list all, get all dates/names/prices |
| embedding | (internal only — triggered by indexing operations) |

> **Note:** `vision` and `code` are NOT returned by `classifyTask()`. They are special cases checked via the `fileType` parameter — when the file extension matches an image or code type, the router bypasses keyword classification and routes directly to the vision or code model.

---

## File Tool Execution Flow

```
User: "Delete old_report.pdf"
         │
         ▼
1. Chat route receives message
2. Router classifies: file_op
3. Selects: llama3.2:3b
4. Builds prompt with tools + working directory
5. Ollama returns tool_call: delete_file("old_report.pdf")
         │
         ▼
6. Check: is this DESTRUCTIVE? → YES
7. Return to frontend: { requiresConfirmation: true, pendingAction: {...} }
         │
         ▼
8. Frontend shows ConfirmDialog
9. User clicks Confirm
         │
         ▼
10. POST /api/chat/confirm
11. Execute: trash("old_report.pdf")
12. Return result to model → final response
13. AI: "old_report.pdf has been moved to trash."
```

---

## Document Indexing Pipeline

```
POST /api/files/index { directory }
         │
         ▼
1. Walk directory recursively
2. For each file:
   a. Check if already indexed (hash check)
   b. Extract text (pdf-parse / mammoth / fs.readFile)
   c. Chunk text (500 tokens, 50 token overlap)
   d. Generate embedding per chunk (nomic-embed-text via Ollama)
   e. Store in SQLite-vec: { chunk, embedding, filePath, chunkIndex }
3. Return { indexed: N, skipped: M, errors: [] }
```

---

## Semantic Search Flow

```
GET /api/search?q="termination clause"&dir="/Documents"
         │
         ▼
1. Generate query embedding (nomic-embed-text)
2. Cosine similarity search in SQLite-vec
3. Filter by directory if specified
4. Return top-K results sorted by score
5. Each result: { filePath, excerpt, score, chunkIndex }
```

---

## Generation Streaming Flow

```
POST /api/generate/document { prompt, contextFiles, outputPath }
         │
         ▼
1. Read context files (docReader)
2. Build generation prompt
3. Call Ollama /api/generate with stream: true
4. Stream chunks via SSE to frontend
5. Frontend renders tokens in real-time
6. On completion: save to outputPath
7. Return { success, outputPath, wordCount }
```

---

## Frontend Component Tree

```
App
├── Header
│   ├── Logo
│   ├── ModelPanel (connection status + active models)
│   └── SettingsButton
├── MainLayout
│   ├── FileBrowser (left panel, 280px)
│   │   ├── PathBreadcrumb
│   │   ├── FileTree
│   │   │   ├── FolderItem (recursive)
│   │   │   └── FileItem
│   │   └── RefreshButton
│   └── RightPanel (flex)
│       ├── ChatPanel (default view)
│       │   ├── MessageList
│       │   │   ├── UserMessage
│       │   │   └── AIMessage
│       │   │       ├── ResponseText (markdown)
│       │   │       ├── ActionsUsed (collapsible)
│       │   │       └── ModelBadge
│       │   ├── ConfirmDialog (overlay, conditional)
│       │   └── InputBar
│       └── GeneratePanel (tab view)
│           ├── CreateTab
│           ├── TransformTab
│           ├── SynthesizeTab
│           └── ExtractTab
└── StatusBar
    ├── OllamaStatus
    ├── ActiveModel
    └── WorkingDirectory
```

---

## API Routes

### Chat
| Method | Route | Description |
|---|---|---|
| POST | /api/chat | Main AI chat with tool calling |
| POST | /api/chat/confirm | Execute confirmed destructive action |

**POST /api/chat body:** `{ message, history, workingDirectory, modelOverride? }`  
**POST /api/chat/confirm body:** `{ pendingAction: { function: { name, arguments }, description, affectedFiles[] } }`  
**Destructive response shape:** `{ requiresConfirmation: true, pendingAction, model, message }`

### Files
| Method | Route | Description |
|---|---|---|
| GET | /api/files | List directory contents |
| GET | /api/files/read | Read file text content |
| POST | /api/files/index | Index directory for semantic search |

### Models
| Method | Route | Description |
|---|---|---|
| GET | /api/models | List available Ollama models with roles |
| GET | /api/models/status | Ollama connection health check |

### Search
| Method | Route | Description |
|---|---|---|
| GET | /api/search | Semantic search across indexed docs |

### Generate
| Method | Route | Description |
|---|---|---|
| POST | /api/generate/document | Generate new document |
| POST | /api/generate/transform | Transform existing document |
| POST | /api/generate/synthesize | Synthesize multiple documents |
| POST | /api/generate/extract | Extract structured data |
| POST | /api/generate/autorename | Suggest filename from content |
| POST | /api/generate/suggest-organization | Suggest folder structure |

---

## Security Considerations

- **Path traversal prevention:** All file paths validated — reject any containing `..`
- **Scope limiting:** Operations restricted to user-specified root directory
- **No hard delete:** All deletions use OS trash via `trash` package
- **Confirmation layer:** All destructive operations require explicit user approval
- **No network egress:** Ollama runs on localhost only, zero external calls
- **No auth required:** Single-user local app — OS filesystem permissions are the security boundary

---

## Hardware Requirements

| Config | Models Supported | Performance |
|---|---|---|
| 8GB RAM, no GPU | 3B models only | Slow but functional |
| 16GB RAM, no GPU | 3B-7B (not simultaneously) | Moderate |
| 16GB RAM + 8GB VRAM | 7B models | Good |
| Apple M2/M3 16GB+ | 7B-13B via Metal | Very good |
| 32GB RAM / 24GB VRAM | Multiple 7B simultaneously | Excellent |
