# Vault AI — MCP (Model Context Protocol)

**Version:** 1.0  
**Date:** 2026-05-02

---

## Overview

Model Context Protocol (MCP) is an open standard by Anthropic for connecting AI models to external tools and data sources. Vault AI implements MCP in two roles simultaneously:

**Role A — MCP Server:** Vault AI exposes its tools to any MCP-compatible AI client (Claude Desktop, Cursor, custom agents). External AI apps can call Vault AI's file management, search, and generation capabilities.

**Role B — MCP Client:** Vault AI connects to external MCP servers to extend its own capabilities — adding web search, database access, API integrations, and more.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    USER'S MACHINE                        │
│                                                          │
│  External MCP Clients          External MCP Servers      │
│  ┌──────────────┐              ┌─────────────────────┐   │
│  │ Claude Desktop│             │  brave-search MCP   │   │
│  │ Cursor        │             │  postgres MCP       │   │
│  │ Custom agents │             │  github MCP         │   │
│  └──────┬───────┘              └──────────┬──────────┘   │
│         │ MCP (stdio/SSE)                 │ MCP          │
│         ▼                                 ▼              │
│  ┌──────────────────────────────────────────────────┐   │
│  │                  Vault AI                         │   │
│  │  ┌─────────────────┐   ┌──────────────────────┐  │   │
│  │  │  MCP Server     │   │  MCP Client          │  │   │
│  │  │  (exposes tools)│   │  (consumes servers)  │  │   │
│  │  └─────────────────┘   └──────────────────────┘  │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## Role A: Vault AI as MCP Server

### Exposed Tools

Vault AI exposes all its core tools via MCP so external clients can use them:

| MCP Tool | Description |
|---|---|
| `vault_list_directory` | List files and folders at a path |
| `vault_read_file` | Read content of any file |
| `vault_search` | Semantic search across indexed documents |
| `vault_move_file` | Move a file (requires confirmation) |
| `vault_copy_file` | Copy a file |
| `vault_delete_file` | Delete a file (to trash, requires confirmation) |
| `vault_create_folder` | Create a new directory |
| `vault_rename_file` | Rename a file |
| `vault_generate_document` | Generate a new document from prompt |
| `vault_transform_document` | Rewrite/translate/summarize a document |
| `vault_extract_data` | Extract structured data from a document |
| `vault_query_connector` | Query any active connector |
| `vault_run_workflow` | Run a multi-agent workflow |

### Transport

Supports two MCP transport modes:
- **stdio** — for local clients like Claude Desktop (process communication)
- **SSE (Server-Sent Events)** — for web-based clients over HTTP

### Configuration for Claude Desktop

Users add Vault AI to Claude Desktop's `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "vault-ai": {
      "command": "node",
      "args": ["/path/to/vault-ai/src/webapp/server/mcp/server.js"],
      "env": {
        "VAULT_PORT": "3001"
      }
    }
  }
}
```

---

## Role B: Vault AI as MCP Client

### Connecting External MCP Servers

Vault AI can connect to any MCP-compatible server and make its tools available to agents.

**Built-in MCP server support:**

| MCP Server | Adds Capability |
|---|---|
| `@modelcontextprotocol/server-brave-search` | Web search |
| `@modelcontextprotocol/server-github` | GitHub repo access |
| `@modelcontextprotocol/server-postgres` | PostgreSQL queries |
| `@modelcontextprotocol/server-fetch` | Fetch web page content |
| `@modelcontextprotocol/server-memory` | Persistent knowledge graph |
| Any custom MCP server | User-defined tools |

### How It Works

1. User adds an MCP server via the MCP panel (name + command/URL)
2. Vault AI connects and discovers available tools
3. Tools are registered into the agent tool set
4. Any agent can now call these tools as if they were native

---

## Components

### server/mcp/server.js

```
VaultMCPServer class:

  constructor(vaultApiUrl)
    baseUrl = vaultApiUrl  // http://localhost:3001
  
  start(transport):
    Initialize MCP server with stdio or SSE transport
    Register all vault tools
    Start listening
  
  registerTools():
    For each tool in VAULT_MCP_TOOLS:
      server.tool(name, description, schema, handler)
  
  Tool handlers proxy to Vault AI API:
    vault_list_directory → GET /api/files?path=
    vault_read_file      → GET /api/files/read?path=
    vault_search         → GET /api/search?q=
    vault_generate_document → POST /api/generate/document
    etc.
  
  handleConfirmation(toolName, args):
    For destructive tools: return confirmation_required response
    MCP client must call vault_confirm to proceed
```

### server/mcp/client.js

```
VaultMCPClient class:

  async connect(serverConfig):
    serverConfig: { name, command, args[], env{} }
    Spawn process or connect via SSE
    Initialize MCP client session
    Discover available tools via tools/list
    Return: { name, tools[], connected: true }
  
  async disconnect(serverName): void
  
  async callTool(serverName, toolName, args):
    Find connected server
    Call tools/call with toolName + args
    Return result
  
  async listTools(serverName): Tool[]
  
  getRegisteredTools():
    Return all tools from all connected servers
    Namespaced: { serverName__toolName, description, schema }
```

### server/mcp/tools.js

```
Maps Vault AI's internal tool format to MCP tool schema format.

toMCPTool(internalTool):
  Returns: {
    name: "vault_" + internalTool.name,
    description: internalTool.description,
    inputSchema: {
      type: "object",
      properties: internalTool.parameters,
      required: internalTool.required[]
    }
  }

fromMCPResult(mcpResult):
  Normalizes MCP tool result to internal format
  Handles text, image, and error content types
```

### server/mcp/registry.js

```
MCPRegistry class:
  Stores all connected MCP servers and their tools.
  
  register(serverConfig): connect + store
  unregister(serverName): disconnect + remove
  get(serverName): return server instance
  list(): return all servers with status + tool count
  getAllTools(): return merged tool list from all servers
  findTool(toolName): find which server provides a tool
```

---

## API Routes

### server/routes/mcp.js

| Method | Route | Description |
|---|---|---|
| GET | /api/mcp/servers | List connected MCP servers |
| POST | /api/mcp/connect | Connect a new MCP server |
| POST | /api/mcp/disconnect | Disconnect an MCP server |
| GET | /api/mcp/tools | List all tools from all MCP servers |
| POST | /api/mcp/call | Call a specific MCP tool directly |
| GET | /api/mcp/server/status | Vault AI MCP server status |
| POST | /api/mcp/server/start | Start Vault AI MCP server |
| POST | /api/mcp/server/stop | Stop Vault AI MCP server |

**POST /api/mcp/connect body:**
```json
{
  "name": "brave-search",
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-brave-search"],
  "env": { "BRAVE_API_KEY": "" }
}
```

---

## UI: MCP Panel

### MCPPanel.jsx
Main MCP management interface with two sections:

**Section 1 — Vault AI as Server**
- Toggle: Start / Stop MCP Server
- Transport selector: stdio / SSE
- Status: running / stopped + port
- Connected clients count
- "Copy config" button → copies Claude Desktop config snippet
- Tool list: all exposed vault tools

**Section 2 — External MCP Servers (Client)**
- List of connected servers with status badges
- "Add Server" button → form: name, command, args, env vars
- Each server card:
  - Name + status (connected / error)
  - Tool count
  - "View Tools" → lists available tools
  - "Disconnect" button

### MCPServerCard.jsx
- Server name + icon
- Status indicator (green/red)
- Tool count badge
- Expandable tool list
- Quick test: call a tool directly from UI

### MCPToolBadge.jsx
- Shows active MCP tools in chat header
- Tooltip lists which server provides each tool

---

## Integration with Agents

When MCP servers are connected, their tools automatically become available to all agents:

```
server/mcp/registry.js
       │
       ▼ getRegisteredTools()
server/agents/runner.js
       │
       ▼ merged into agent tool set
Ollama function calling
```

Agent example with MCP tools:
```
User: "Search the web for recent news about pgvector and 
       save a summary to my Research folder"

Orchestrator:
  MCP Agent → brave_search("pgvector news 2025") [MCP tool]
  Generation Agent → summarize results
  File Agent → save to /Research/pgvector_news.md
```

---

## Security Considerations

- MCP server runs on localhost only — not exposed to network by default
- Destructive Vault AI tools require confirmation even when called via MCP
- External MCP server env vars (API keys) stored in local config only
- MCP server can be stopped at any time from the UI
- Tool permissions: user can disable specific tools from MCP exposure
- No MCP server auto-starts — user must explicitly enable

---

## Getting Started

### Expose Vault AI to Claude Desktop

1. Start Vault AI
2. Go to MCP Panel → Start MCP Server
3. Click "Copy Config"
4. Paste into `~/Library/Application Support/Claude/claude_desktop_config.json`
5. Restart Claude Desktop
6. Vault AI tools appear in Claude Desktop's tool list

### Add External MCP Server

1. Go to MCP Panel → Add Server
2. Enter server command (e.g. `npx -y @modelcontextprotocol/server-brave-search`)
3. Add any required env vars (e.g. API keys)
4. Click Connect
5. Tools from that server are now available to all Vault AI agents
