# Vault AI

**Your files. Your AI. Your privacy.**

A privacy-first, local AI-powered file and document management platform. Manage, search, organize, and generate documents through natural language — powered entirely by locally-running AI models via Ollama. No cloud. No data egress. No API keys. Ever.

---

## Features

- **Natural Language File Management** — Move, copy, rename, and organize files by just describing what you want
- **Document Q&A** — Ask questions about any PDF, DOCX, or text file on your machine
- **Semantic Search** — Find documents by meaning, not just keywords
- **Document Generation** — Draft, transform, summarize, and extract data from documents
- **Multi-Agent Orchestration** — Complex tasks automatically split across specialized agents running in parallel
- **Local Connectors** — Connect to Obsidian vaults, SQLite databases, Git repos, email archives, and browser bookmarks
- **MCP Integration** — Expose Vault AI tools to Claude Desktop; consume external MCP servers
- **Mobile Companion** — React Native app for managing files over your local network

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + TailwindCSS + Zustand |
| Backend | Node.js + Express |
| AI Runtime | Ollama (`localhost:11434`) |
| Vector Store | SQLite + `better-sqlite3` + `sqlite-vec` |
| Mobile | React Native + Expo + NativeWind |

---

## Prerequisites

- Node.js 18+
- [Ollama](https://ollama.com/download) installed and running locally
- Recommended models:

```bash
ollama pull llama3.2:3b        # file operations (fast)
ollama pull mistral:7b          # document Q&A
ollama pull nomic-embed-text    # semantic search (required)
```

> The app works with just 1 model installed — it falls back gracefully.

---

## Getting Started

```bash
# Clone the repo
git clone https://github.com/VenkataAnilKumar/VaultAI.git
cd VaultAI

# Install and run the web app
cd src/webapp
npm install
npm run dev
```

App runs at **http://localhost:5173** — backend API at **http://localhost:3001**.

### Mobile App (optional)
```bash
cd src/mobile
npm install
npx expo start
```

---

## Project Structure

```
src/
├── webapp/
│   ├── client/     # React + Vite frontend
│   └── server/     # Node.js + Express backend
├── landing/        # Marketing landing page
└── mobile/         # React Native + Expo companion app
doc/
├── product/        # PRD, personas, roadmap
└── technical/      # Architecture, features, agents, connectors, MCP
```

---

## Privacy

- All AI inference runs locally via Ollama — no external API calls
- Files never leave your machine
- No telemetry, no analytics, no tracking
- File deletes go to the OS trash — never permanently deleted silently
