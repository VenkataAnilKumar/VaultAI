# Vault AI

**Your files. Your AI. Your privacy.**

Privacy-first, local AI-powered file and document management platform.
Manage, search, organize, and generate documents through natural language
conversation with local AI models. No cloud. No data egress. Ever.

---

## Repository Structure

```
VaultAI/                          # repo root
├── README.md
├── doc/
│   ├── product/                  # Product docs
│   │   ├── product-overview.md   # What Vault AI is, personas, market
│   │   ├── prd.md                # Product requirements, user stories
│   │   └── roadmap.md            # v1.0 → v4.0 roadmap
│   ├── technical/                # Technical docs
│   │   ├── architecture.md       # System design, data flows, API routes
│   │   ├── features.md           # Detailed feature specifications
│   │   ├── agents.md             # Multi-agent orchestration architecture
│   │   ├── connectors.md         # Local data source connectors
│   │   └── mcp.md                # Model Context Protocol (server + client)
│   └── prompts/                  # AI build prompts
│       ├── replit-build-prompt.md     # Full stack build (Replit Agent)
│       ├── gen-ai-addon-prompt.md     # Gen AI capabilities addon
│       ├── mobile-app-prompt.md       # Mobile companion app
│       ├── agents-prompt.md           # Multi-agent orchestration addon
│       ├── connectors-prompt.md       # Local connectors addon
│       ├── mcp-prompt.md              # MCP server + client addon
│       └── system-prompts.md          # All AI system prompts
│
└── src/
    ├── webapp/                   # Main desktop web application
    │   ├── package.json          # Workspaces: [client, server]
    │   ├── client/               # React + Vite frontend
    │   │   └── src/
    │   │       ├── components/   # UI components
    │   │       ├── store/        # Zustand state
    │   │       └── api/          # Axios API client
    │   └── server/               # Node.js + Express backend
    │       ├── routes/           # API route handlers
    │       ├── services/         # Ollama, fileOps, genAI, embeddings
    │       └── tools/            # File tool definitions (function calling)
    │
    ├── landing/                  # Marketing landing page
    │   ├── public/               # Static assets
    │   └── src/
    │       ├── components/       # Shared UI components
    │       └── sections/         # Page sections (Hero, Features, etc.)
    │
    └── mobile/                   # React Native companion app
        └── src/
            ├── app/              # Expo Router screens
            ├── components/       # Mobile UI components
            ├── store/            # Zustand state
            ├── api/              # Desktop API client
            ├── hooks/            # useVaultConnection, useVoiceInput
            └── constants/        # Theme tokens
```

---

## Tech Stack

| Package | Technology |
|---|---|
| **webapp/client** | React + Vite + TailwindCSS + Zustand |
| **webapp/server** | Node.js + Express + Ollama API |
| **landing** | React + Vite + TailwindCSS |
| **mobile** | React Native + Expo + NativeWind |
| **AI Runtime** | Ollama (localhost:11434) |
| **Vector Store** | SQLite + better-sqlite3 |

---

## Prerequisites

- Node.js 18+
- [Ollama](https://ollama.com) installed and running
- At least one model pulled:

```bash
ollama pull llama3.2
ollama pull nomic-embed-text
```

---

## Getting Started

### Web App
```bash
cd src/webapp
npm install
npm run dev
# Opens at http://localhost:5173
```

### Landing Page
```bash
cd src/landing
npm install
npm run dev
```

### Mobile App
```bash
cd src/mobile
npm install
npx expo start
```

---

## Core Capabilities

- **File Management** — Move, copy, rename, organize via natural language
- **Document Q&A** — Ask questions about any file on your machine
- **Semantic Search** — Find documents by meaning across your entire library
- **Multi-Model AI** — Best model selected automatically per task type
- **Document Generation** — Draft, transform, synthesize, extract data
- **Multi-Agent Orchestration** — Complex tasks split across specialized agents running in parallel
- **Local Connectors** — Read from Obsidian, SQLite, Git, email archives, and browser bookmarks
- **MCP Integration** — Expose Vault AI tools to Claude Desktop; consume external MCP servers
- **Privacy First** — Zero data egress, all processing on your device

---

## Build Prompts

To build using Replit Agent, use the prompts in `doc/prompts/`:

| Prompt | Path | Use |
|---|---|---|
| `replit-build-prompt.md` | `doc/prompts/` | Build the complete webapp from scratch |
| `gen-ai-addon-prompt.md` | `doc/prompts/` | Add Gen AI after base app is running |
| `mobile-app-prompt.md` | `doc/prompts/` | Build the mobile companion app |
| `agents-prompt.md` | `doc/prompts/` | Add multi-agent orchestration |
| `connectors-prompt.md` | `doc/prompts/` | Add local data source connectors |
| `mcp-prompt.md` | `doc/prompts/` | Add MCP server + client support |
| `system-prompts.md` | `doc/prompts/` | Reference for all in-app AI prompts |
