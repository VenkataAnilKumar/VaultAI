# Vault AI

Privacy-first, local AI-powered file and document management platform. All AI runs via Ollama on localhost — zero data egress.

## Architecture

- **Frontend**: React + Vite + TailwindCSS (port 5173 → external port 80)
- **Backend**: Node.js + Express (port 3001)
- **AI**: Ollama HTTP API (OLLAMA_BASE_URL env var, default localhost:11434)
- **Vector DB**: SQLite + better-sqlite3 (cosine similarity search)
- **Document parsing**: pdf-parse (PDF), mammoth (DOCX), fs (TXT/MD/code)
- **State**: Zustand (client)

## Project Structure

```
src/webapp/
├── client/              # React + Vite frontend
│   └── src/
│       ├── components/
│       │   ├── agents/        # WorkflowToggle, AgentStep, AgentWorkflowPanel
│       │   ├── connectors/    # ConnectorsPanel, ConnectorCard, ConnectorConfigForm
│       │   ├── mcp/           # MCPPanel, MCPServerCard, MCPAddServerForm, MCPToolBadge
│       │   ├── Chat.jsx       # Main chat with multi-agent support
│       │   ├── FileBrowser.jsx
│       │   ├── GeneratePanel.jsx  # Create/Transform/Synthesize/Extract
│       │   ├── ModelPanel.jsx
│       │   ├── MessageBubble.jsx
│       │   ├── ConfirmDialog.jsx
│       │   └── StatusBar.jsx
│       ├── store/       # Zustand state (useStore.js)
│       ├── api/         # Axios API client (client.js)
│       ├── App.jsx      # Navigation: Chat | Generate | Connectors | MCP
│       └── main.jsx
└── server/
    ├── routes/
    │   ├── chat.js      # Multi-agent + connector + MCP tool routing
    │   ├── files.js
    │   ├── models.js
    │   ├── search.js
    │   ├── generate.js
    │   ├── agents.js    # /api/agents — orchestrator workflow
    │   ├── connectors.js # /api/connectors — connector management
    │   └── mcp.js       # /api/mcp — MCP server/client management
    ├── services/
    │   ├── ollama.js    # OllamaClient + ModelRouter
    │   ├── fileOps.js
    │   ├── docReader.js
    │   ├── embeddings.js
    │   ├── vectorStore.js
    │   └── genAI.js
    ├── agents/
    │   ├── orchestrator.js  # Task decomposition + workflow management
    │   ├── registry.js      # 6 agent definitions
    │   ├── runner.js        # Parallel + sequential execution
    │   └── memory.js        # Shared context between agents
    ├── connectors/
    │   ├── base.js
    │   ├── registry.js      # Connector management singleton
    │   ├── obsidian.js      # Obsidian vault (.md notes)
    │   ├── sqlite.js        # SQLite DB with NL→SQL
    │   ├── git.js           # Git repo (simple-git)
    │   ├── email.js         # .mbox / .eml archives
    │   └── bookmarks.js     # Chrome bookmarks JSON
    ├── mcp/
    │   ├── server.js        # Vault AI as MCP server (SSE or stdio)
    │   ├── client.js        # Vault AI as MCP client (external servers)
    │   ├── registry.js      # MCPRegistry singleton
    │   └── tools.js         # Tool format conversion + VAULT_MCP_TOOLS
    ├── tools/
    │   └── fileTools.js
    └── index.js
```

## API Routes

| Route | Description |
|-------|-------------|
| POST /api/chat | Chat with AI (supports workflowMode: simple/multi-agent) |
| POST /api/chat/confirm | Confirm pending destructive action |
| GET /api/models | List available Ollama models |
| GET /api/models/status | Ollama connection status |
| GET/POST /api/files | File browser + index |
| GET /api/search | Semantic vector search |
| POST /api/generate/* | Document generation (document/transform/synthesize/extract) |
| GET /api/agents | List agent definitions |
| POST /api/agents/run | Run multi-agent orchestration workflow |
| GET /api/connectors | List all connectors |
| POST /api/connectors/connect | Connect a data source |
| POST /api/connectors/disconnect | Disconnect a data source |
| GET/POST /api/connectors/:name/* | Per-connector list/query |
| GET /api/mcp/server/status | MCP server status |
| POST /api/mcp/server/start | Start MCP server (sse/stdio) |
| POST /api/mcp/server/stop | Stop MCP server |
| GET /api/mcp/server/config | Claude Desktop config snippet |
| GET /api/mcp/servers | List external MCP connections |
| POST /api/mcp/connect | Connect external MCP server |
| GET /api/mcp/tools | All available MCP tools |

## Agents

| Agent | Role | Model Type |
|-------|------|------------|
| orchestrator | Task decomposition | generate |
| file | File system ops | file_op |
| document | Read/summarize docs | doc_qa |
| search | Semantic search | embedding |
| generation | Create/transform docs | generate |
| connector | Query data sources | doc_qa |

## Connectors

| Connector | Source | Dependencies |
|-----------|--------|--------------|
| obsidian | Obsidian vault (.md) | js-yaml |
| sqlite | SQLite database | better-sqlite3 |
| git | Git repository | simple-git |
| email | .mbox/.eml archive | mailparser |
| bookmarks | Chrome Bookmarks JSON | built-in |

## MCP (Model Context Protocol)

- **As server**: Exposes 13 Vault AI tools via SSE or stdio. Claude Desktop can connect.
- **As client**: Connects to external MCP servers (Brave Search, GitHub, PostgreSQL, etc.)
- MCP server binds to localhost only (127.0.0.1). Never exposed to network.
- Destructive tools require confirmation even via MCP.
- External tool env vars (API keys) stored locally only, never logged.

## Running Locally

Requires Ollama installed and running:
```bash
ollama serve
ollama pull llama3.2            # Chat + agents
ollama pull nomic-embed-text    # Semantic search
```

Start the app:
```bash
cd src/webapp && npm install && npm run dev
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| OLLAMA_BASE_URL | http://localhost:11434 | Ollama API endpoint |
| PORT | 3001 | Express server port |

## Security

- Path traversal prevention: all paths validated against home directory
- No hard deletes: files moved to OS trash via `trash` package
- Destructive actions require explicit confirmation dialog
- Connector write ops require `allowWrite: true` in config
- All AI computation is local via Ollama — zero data egress
- MCP API keys are never included in API responses or logs

## Dependencies

Server: express, cors, better-sqlite3, pdf-parse, mammoth, fs-extra, trash, axios, md5, simple-git, js-yaml, mailparser, html-to-text, @modelcontextprotocol/sdk

Client: react, react-dom, zustand, axios, lucide-react, react-markdown, tailwindcss
