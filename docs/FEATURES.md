# Vault AI — Complete Feature Specification

> Privacy-first, local AI-powered file and document management platform.
> All AI runs via Ollama — no cloud, no subscriptions, no data leaving your machine.

**Version:** 1.0 Draft  
**Date:** May 2026  
**Total Features:** 97  

---

## Table of Contents

1. [AI Chat](#module-1-ai-chat)
2. [Skills](#module-2-skills)
3. [Web Search](#module-3-web-search)
4. [Deep Research](#module-4-deep-research)
5. [Document Intelligent Agent](#module-5-document-intelligent-agent)
6. [File Management](#module-6-file-management)
7. [Connectors](#module-7-connectors)
8. [Generate](#module-8-generate)
9. [App Experience](#module-9-app-experience)
10. [Roadmap & Phases](#roadmap--phases)

---

## Module 1: AI Chat

> The core conversational interface. All AI powered locally via Ollama.

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| 1.1 | Local AI Chat | Conversational interface powered entirely by Ollama | P0 |
| 1.2 | Multi-Model Selection | Switch between any installed Ollama model per session | P0 |
| 1.3 | Model Role Routing | Auto-routes tasks to best model (code, vision, doc Q&A) | P1 |
| 1.4 | Image Attachment | Attach images to chat, analyzed by local vision model (llava) | P1 |
| 1.5 | Session History | All chats saved locally, grouped by Today / Yesterday / Older | P0 |
| 1.6 | Session Restore | Click any past session to restore the full conversation | P0 |
| 1.7 | Workflow Mode | Toggle between Simple (single agent) and Multi-Agent orchestration | P1 |
| 1.8 | Tool Use | AI can read, write, move, delete files using built-in tools | P0 |
| 1.9 | Confirmation Dialog | Destructive actions (delete, bulk move) require user approval | P0 |
| 1.10 | Suggestion Chips | Quick-start prompts shown when chat is empty | P1 |

---

## Module 2: Skills

> Pre-built and custom AI task shortcuts. One click to run a complex prompt.

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| 2.1 | Built-in Skills (10) | Summarize, Extract, Draft Reply, Find Duplicates, Report, Explain, Tag, Privacy Audit, Translate, Meeting Notes | P0 |
| 2.2 | One-click Execution | Click any skill — prompt sent to Chat automatically | P0 |
| 2.3 | Custom Skill Builder | Create skills with name, icon, description, and prompt template | P1 |
| 2.4 | Skill Categories | Filter skills by category: Writing, Analysis, Privacy, Organization | P2 |
| 2.5 | Skill Favorites | Pin frequently used skills to the top | P2 |

---

## Module 3: Web Search

> Privacy-first web access. No tracking, no API key. Powered by DuckDuckGo.

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| 3.1 | Web Search | Full web results (title, URL, snippet) via DuckDuckGo | P0 |
| 3.2 | Image Search | Grid of image results from DuckDuckGo image search | P1 |
| 3.3 | Inline Quick-Read | Preview search result content without opening a browser tab | P2 |
| 3.4 | Search-to-Chat | Send any result directly to AI for summarization or Q&A | P1 |
| 3.5 | Search History | Recent searches stored locally | P2 |

---

## Module 4: Deep Research

> Autonomous multi-step AI research agent. Searches, reads, summarizes, and synthesizes — all locally.

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| 4.1 | Research Query Input | Enter a question and set depth: Quick / Standard / Deep (3 / 5 / 8 sources) | P0 |
| 4.2 | Live Progress Tracker | Real-time step status: Searching → Reading → Summarizing → Synthesizing | P0 |
| 4.3 | Source Fetching | Automatically fetches and reads top N web pages | P0 |
| 4.4 | Per-Source Summarization | Each source summarized locally by Ollama | P0 |
| 4.5 | Report Synthesis | Final comprehensive Markdown report with citations via Ollama | P0 |
| 4.6 | Export Report | Save report as `.md` or `.pdf` to the file system | P1 |
| 4.7 | Source Citations | Every claim in the report links back to its source URL | P1 |
| 4.8 | Research History | Past research sessions saved and accessible | P2 |

---

## Module 5: Document Intelligent Agent

> End-to-end document understanding and action. The core differentiator of Vault AI.

---

### 5A — Ingestion & Parsing

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| 5.1 | PDF Parsing | Full text, tables, and page structure extraction | P0 |
| 5.2 | Word (.docx) Parsing | Paragraphs, headings, embedded tables | P0 |
| 5.3 | Excel / CSV Parsing | Row/column data with headers | P0 |
| 5.4 | Markdown / Text | Full content with structure preserved | P0 |
| 5.5 | Image OCR | Text extraction from images via local vision model | P1 |
| 5.6 | Email (.eml) Parsing | Sender, subject, body, and attachments | P1 |
| 5.7 | PowerPoint | Slide titles and body text per slide | P2 |
| 5.8 | Drag & Drop Upload | Drop any file into the Document Agent to begin | P0 |
| 5.9 | Batch Ingestion | Add an entire folder at once | P1 |

---

### 5B — Conversational Q&A (RAG)

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| 5.10 | Single Document Chat | Ask questions about any uploaded document | P0 |
| 5.11 | Multi-Document Chat | Ask across multiple documents simultaneously | P1 |
| 5.12 | Cited Answers | Every answer cites the exact page and paragraph | P0 |
| 5.13 | Semantic Search | Find relevant passages by meaning, not just keyword | P0 |
| 5.14 | Local Embeddings | All vector embeddings generated locally via Ollama (nomic-embed-text) | P0 |
| 5.15 | Local Vector Store | SQLite-based local vector database — no external service required | P0 |

---

### 5C — Extraction & Classification

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| 5.16 | Structured Extraction | Extract names, dates, amounts, addresses from any document | P0 |
| 5.17 | Custom Extraction Schema | User defines fields to extract via form or natural language | P1 |
| 5.18 | Export Extracted Data | Output as JSON, CSV, or formatted table | P1 |
| 5.19 | Auto Classification | Classifies document type: contract, invoice, report, letter, etc. | P0 |
| 5.20 | Topic Tagging | Assigns topic tags: Finance, Legal, HR, Technical, etc. | P1 |
| 5.21 | Sensitivity Rating | Flags documents as Public / Internal / Confidential | P1 |
| 5.22 | Batch Classification | Run classification across an entire folder automatically | P1 |

---

### 5D — Summarization

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| 5.23 | TL;DR Summary | 2–3 sentence executive summary | P0 |
| 5.24 | Key Points Summary | Bulleted list of 5–10 most important points | P0 |
| 5.25 | Full Brief | Structured summary with sections, findings, and next steps | P1 |
| 5.26 | Folder Summarization | Summarize all documents in a folder in one operation | P1 |
| 5.27 | Auto-Save Summary | Saves `.summary.md` alongside the original file | P2 |
| 5.28 | Export Summary | Export summary as Markdown or PDF | P1 |

---

### 5E — Compare & Diff

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| 5.29 | Side-by-Side Diff | Visual diff of two document versions (additions/deletions highlighted) | P1 |
| 5.30 | AI Diff Explanation | Plain-English explanation of what changed and why it matters | P1 |
| 5.31 | Clause-Level Compare | Compares specific sections or clauses between two documents | P2 |

---

### 5F — Drafting & Transformation

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| 5.32 | Draft Reply | Generate a reply to any document or email | P1 |
| 5.33 | Tone Rewrite | Rewrite in formal, casual, technical, or simplified tone | P1 |
| 5.34 | Translation | Translate document to any language via Ollama | P1 |
| 5.35 | Format Conversion | Convert meeting notes → minutes, bullets → report, outline → draft | P1 |
| 5.36 | Expand / Condense | Expand bullet points into prose or condense long text | P2 |
| 5.37 | Save Transformed Output | All outputs saved directly to the file system | P1 |

---

### 5G — Privacy & Compliance Audit

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| 5.38 | PII Detection | Finds names, emails, phones, SSNs, credit card numbers | P1 |
| 5.39 | GDPR / HIPAA Flagging | Highlights content relevant to compliance regulations | P1 |
| 5.40 | Risky Clause Detection | Flags unlimited liability, auto-renewal, non-compete clauses | P2 |
| 5.41 | Audit Report | Per-file or per-folder privacy audit report | P1 |
| 5.42 | Redaction Suggestions | AI suggests what to redact and why | P2 |

---

### 5H — Monitoring & Automation

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| 5.43 | Folder Watcher | Monitor a folder and act automatically when new files arrive | P2 |
| 5.44 | Auto-Classify on Arrival | New files get classified and tagged automatically | P2 |
| 5.45 | Auto-Summarize on Arrival | Summary generated and saved next to new files | P2 |
| 5.46 | Smart Alerts | Alert when a document matches a pattern (e.g. invoice > $10,000) | P2 |
| 5.47 | Watcher Dashboard | UI showing active watchers, last triggered, and files processed | P2 |

---

### 5I — Knowledge Base

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| 5.48 | Full Library Indexing | Index all documents in a directory into a local knowledge base | P1 |
| 5.49 | Cross-Document Q&A | Ask questions across the entire library | P1 |
| 5.50 | Topic Clustering | AI groups related documents into topic clusters | P2 |
| 5.51 | Knowledge Graph View | Visual map of document relationships by topic | P3 |
| 5.52 | Incremental Indexing | Only re-indexes changed or new files | P2 |

---

## Module 6: File Management

> Local file system operations with AI superpowers.

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| 6.1 | File Browser | macOS-style file browser with breadcrumb navigation | P0 |
| 6.2 | Context Menu | Right-click: open, rename, move, delete, summarize, tag | P0 |
| 6.3 | Drag & Drop | Move files within the browser | P1 |
| 6.4 | Vault Encryption | Lock/unlock files or folders with a local AES-256 passphrase | P2 |
| 6.5 | Auto-Rename | AI suggests a better filename based on document content | P2 |
| 6.6 | Smart Organization | AI suggests a folder structure for a messy directory | P2 |

---

## Module 7: Connectors

> External data source integrations. Bring outside data into Vault AI's AI context.

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| 7.1 | Obsidian Connector | Read and write to an Obsidian vault | P1 |
| 7.2 | Git Connector | Query commit history, diffs, and code across a repo | P1 |
| 7.3 | SQLite Connector | Query local SQLite databases in natural language | P1 |
| 7.4 | Email Connector | Read and process local email files | P2 |
| 7.5 | Bookmarks Connector | Import and search browser bookmarks | P2 |
| 7.6 | MCP Tools | Connect to any external Model Context Protocol server | P1 |

---

## Module 8: Generate

> AI-powered document creation from scratch or from existing content.

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| 8.1 | Document Generation | Generate new Markdown documents from a prompt | P0 |
| 8.2 | Document Transformation | Edit or transform existing documents with AI | P0 |
| 8.3 | Data Extraction | Pull structured JSON from unstructured documents | P1 |
| 8.4 | Synthesis | Combine multiple documents into one synthesized output | P1 |

---

## Module 9: App Experience

> UI, settings, personalization, and distribution.

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| 9.1 | Codex-Style UI | Lavender background, white sidebar, floating content card | P0 |
| 9.2 | Dark / Light / System Theme | Persisted theme preference, instant switching | P0 |
| 9.3 | macOS Traffic Lights | Authentic sidebar header with window controls | P0 |
| 9.4 | Keyboard Shortcuts | ⌘K new chat, ⌘B sidebar toggle, ⌘, settings | P0 |
| 9.5 | Settings Panel | Theme, shortcuts, privacy info, version | P0 |
| 9.6 | Status Bar | Ollama connection and active model indicator | P0 |
| 9.7 | PWA Install | Installable to desktop as a native-feel app | P2 |
| 9.8 | Voice Input | Transcribe voice messages via local Whisper model | P2 |
| 9.9 | Onboarding Wizard | First-run setup to connect Ollama and pull a model | P1 |
| 9.10 | Multi-Model Routing Config | Assign specific models to specific task types in Settings | P2 |

---

## Feature Summary

| Module | Feature Count | P0 | P1 | P2 | P3 |
|--------|--------------|----|----|----|----|
| AI Chat | 10 | 6 | 4 | 0 | 0 |
| Skills | 5 | 2 | 1 | 2 | 0 |
| Web Search | 5 | 1 | 2 | 2 | 0 |
| Deep Research | 8 | 5 | 2 | 1 | 0 |
| Document Intelligent Agent | 43 | 11 | 19 | 12 | 1 |
| File Management | 6 | 2 | 1 | 3 | 0 |
| Connectors | 6 | 0 | 4 | 2 | 0 |
| Generate | 4 | 2 | 2 | 0 | 0 |
| App Experience | 10 | 6 | 1 | 3 | 0 |
| **Total** | **97** | **35** | **36** | **25** | **1** |

> **Priority Key:** P0 = Must have (MVP) · P1 = Should have · P2 = Nice to have · P3 = Future

---

## Roadmap & Phases

### Phase 1 — Foundation (MVP)
*Goal: A working local AI app that handles documents end-to-end*

- AI Chat with tool use, session history, model selection
- File browser with context menu
- Document ingestion (PDF, DOCX, TXT, CSV)
- Document Q&A with local RAG (embeddings + vector store)
- TL;DR and Key Points summarization
- Structured data extraction
- Auto classification and tagging
- Skills panel (10 built-in)
- Codex UI with dark mode, keyboard shortcuts, settings

### Phase 2 — Intelligence Layer
*Goal: Make the Document Agent genuinely powerful*

- Multi-document Q&A
- Batch classification and tagging
- Full Brief summarization + export
- Side-by-side document diff with AI explanation
- Drafting, tone rewrite, translation, format conversion
- PII detection and GDPR flagging
- Audit reports
- Full library indexing and cross-document Q&A
- Onboarding wizard

### Phase 3 — Research & Web
*Goal: Connect Vault AI to the outside world, privacy-first*

- Web Search (DuckDuckGo)
- Image Search
- Image Analysis in Chat (vision model)
- Deep Research agent with live progress + report export
- Search-to-Chat

### Phase 4 — Automation & Power Features
*Goal: Run Vault AI as a background intelligence layer*

- Folder Watcher with auto-classify and auto-summarize
- Smart Alerts
- Vault Encryption
- Custom Skill Builder
- Multi-Model Routing Config
- Knowledge Graph View
- Incremental Indexing

### Phase 5 — Distribution
*Goal: Make Vault AI feel like a native product*

- PWA install support
- Voice input via Whisper
- Auto-Rename and Smart Organization
- Topic Clustering

---

*Document maintained at: `docs/FEATURES.md`*  
*Next: `docs/ARCHITECTURE.md` — Technical Architecture*
