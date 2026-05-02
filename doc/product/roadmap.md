# Vault AI — Product Roadmap

**Version:** 1.0  
**Date:** 2026-05-02

---

## Vision

Become the default local AI file intelligence platform for privacy-conscious professionals and teams — the product that makes local AI genuinely useful for everyday document work.

---

## v1.0 — Core (MVP)

**Theme:** Local AI file management that actually works

### Features
- [ ] Chat interface + file browser panel
- [ ] Ollama multi-model integration + router
- [ ] File operations: move, copy, rename, delete, create folder
- [ ] Document reading: PDF, DOCX, TXT, MD
- [ ] Confirmation dialogs for destructive actions
- [ ] Model status panel (available models + roles)
- [ ] Welcome screen with Ollama setup guide
- [ ] Privacy status indicator

### Success Criteria
- Works with 1 Ollama model installed
- First file operation in < 2 minutes from install
- Zero external network calls
- macOS + Windows support

---

## v1.5 — Intelligence

**Theme:** Find and understand anything in your files

### Features
- [ ] Semantic search with local embeddings (SQLite-vec)
- [ ] Document Q&A with source citation
- [ ] Multi-document synthesis (compare, merge, find contradictions)
- [ ] Auto-rename suggestions from content
- [ ] Suggest organization for messy folders
- [ ] Duplicate file detection
- [ ] Index management UI (which folders are indexed)

---

## v2.0 — Generation

**Theme:** Create and transform documents with local AI

### Features
- [ ] Document generation (Create tab)
- [ ] Document transformation: rewrite, translate, simplify, expand
- [ ] Structured data extraction → CSV/JSON
- [ ] Streaming output with real-time preview
- [ ] Generation panel UI (Create / Transform / Synthesize / Extract)
- [ ] Template library: save and reuse document templates
- [ ] Voice input for chat

---

## v2.5 — Mobile

**Theme:** Vault AI in your pocket

### Features
- [ ] React Native mobile companion app
- [ ] Connect to desktop over local WiFi
- [ ] Mobile chat interface with voice input
- [ ] Mobile file browser
- [ ] Quick generate actions (Summarize, Translate, Draft)
- [ ] Offline banner when desktop unreachable

---

## v3.0 — Connectors

**Theme:** Local AI that reads all your data sources

### Features
- [ ] Obsidian vault connector (notes, tags, wikilinks)
- [ ] SQLite connector (natural language → SQL, read-only by default)
- [ ] Git connector (commit history, diffs, code search)
- [ ] Email archive connector (.mbox, .eml, Maildir)
- [ ] Browser bookmarks connector (Chrome, Firefox, Safari)
- [ ] Calendar connector (.ics files)
- [ ] Connector panel UI (connect, query, status per source)
- [ ] Connector tools auto-injected into agent tool set

---

## v3.5 — Multi-Agent

**Theme:** AI that coordinates specialist agents for complex tasks

### Features
- [ ] Orchestrator agent — decomposes complex requests into subtasks
- [ ] Specialized agents: file, document, search, generation, connector
- [ ] Parallel agent execution for independent subtasks
- [ ] Sequential execution with shared memory context
- [ ] Workflow progress panel with per-agent status
- [ ] Simple / Multi-Agent mode toggle in chat
- [ ] Agent memory scoped per workflow run

---

## v4.0 — MCP (Model Context Protocol)

**Theme:** Vault AI as a universal AI integration hub

### Features
- [ ] Vault AI as MCP server — exposes tools to Claude Desktop, Cursor, custom agents
- [ ] Vault AI as MCP client — connects to external MCP servers (brave-search, github, postgres, fetch)
- [ ] stdio and SSE transport modes
- [ ] MCP panel UI (start/stop server, add/remove external servers)
- [ ] Claude Desktop config snippet generator
- [ ] External tool namespacing (serverName__toolName)
- [ ] External MCP tools available to all agents

---

## v4.5 — Team

**Theme:** Vault AI for small teams

### Features
- [ ] Multi-user support with accounts
- [ ] Role-based access control (Admin, User, Viewer)
- [ ] Workspace isolation (separate document collections per user)
- [ ] Audit logging (every query, every file operation)
- [ ] Shared document index across team
- [ ] Admin console (user management, model approval, usage stats)
- [ ] Docker deployment option for self-hosted teams

---

## v5.0 — Automation

**Theme:** AI that works while you sleep

### Features
- [ ] Scheduled agents (cron-style triggered tasks)
  "Every Monday: summarize new files in /Inbox"
- [ ] Watch folders: auto-index and categorize new files
- [ ] Workflow builder: chain operations visually
- [ ] Auto-organize rules: run on schedule or on file arrival
- [ ] Email report generation from document collections

---

## v5.5 — Platform

**Theme:** Build on Vault AI

### Features
- [ ] Plugin/extension system for custom tools
- [ ] Custom tool definitions (user-defined function calling)
- [ ] Prompt versioning (git-like for agent configs)
- [ ] REST API for external integrations
- [ ] Mobile standalone (on-device 1B-3B models, no desktop required)
- [ ] Export/import all data in open formats

---

## Architectural Decisions Log

| Decision | Choice | Reason |
|---|---|---|
| Desktop framework | Web app (React+Vite) | Faster to ship, Replit-compatible |
| AI runtime | Ollama | Best local model support, model agnostic |
| Vector store | SQLite-vec | Zero infra, embedded, sufficient for local scale |
| File delete | OS Trash (trash package) | Safety first — always recoverable |
| Mobile framework | React Native + Expo | Share React knowledge, iOS + Android |
| State management | Zustand | Lightweight, no boilerplate |
| Streaming | Server-Sent Events | Simpler than WebSockets for one-way stream |
| Multi-agent memory | In-memory per run | Simple, scoped, no persistence complexity |
| Connector storage | Local SQLite | Config stays local, no env files |
| MCP transport | stdio (local) + SSE (web) | Matches Claude Desktop + browser clients |
| Tool namespacing | serverName__toolName | Prevents collision across external MCP servers |

---

## Competitive Positioning

| Competitor | Our Advantage |
|---|---|
| AnythingLLM | File operations + Gen AI + multi-agent + connectors |
| Open WebUI | File management + multi-model routing + MCP |
| LM Studio | Agentic capabilities + connectors + team features |
| Ollama | Complete managed experience on top |
| ChatGPT/Claude | 100% local — no data egress |
| n8n / Make | Local-first, AI-native, no cloud dependency |
