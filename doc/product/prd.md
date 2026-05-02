# Vault AI — Product Requirements Document (PRD)

**Version:** 1.0  
**Date:** 2026-05-02  
**Status:** Draft

---

## Problem Statement

Users who handle sensitive, confidential, or regulated documents cannot use cloud AI tools due to privacy, legal, and compliance constraints. Existing local AI tools (Ollama, LM Studio, AnythingLLM) provide model running or basic chat but do not offer a managed, agentic file management experience. The gap: no product combines local AI + file operations + document generation + multi-model routing in a single, usable desktop application.

---

## Goals

1. Let users manage files and documents through natural language — no manual folder navigation required
2. Keep all data, models, and processing entirely on the user's device
3. Use the best available local model for each task type automatically
4. Generate, transform, and synthesize documents using local AI
5. Ship an MVP that works with a single Ollama model installed

---

## Non-Goals (v1)

- Cloud AI integration (by design — privacy first)
- Multi-user / team features (v2)
- Mobile standalone app (v2/v3)
- Real-time file system watching / sync
- Email or calendar integration

---

## User Stories

### File Management

| ID | Story | Priority |
|---|---|---|
| FM-01 | As a user, I can tell the AI to move files using natural language | P0 |
| FM-02 | As a user, I can ask the AI to rename files based on content | P0 |
| FM-03 | As a user, I can ask the AI to create folders and organize files | P0 |
| FM-04 | As a user, I can ask the AI to delete files (with confirmation) | P0 |
| FM-05 | As a user, I can browse my file system in a visual panel | P0 |
| FM-06 | As a user, I can bulk move or organize files by rule | P1 |
| FM-07 | As a user, destructive actions require my explicit confirmation | P0 |

### Document Intelligence

| ID | Story | Priority |
|---|---|---|
| DI-01 | As a user, I can ask questions about any document on my machine | P0 |
| DI-02 | As a user, I can search across all my documents by meaning | P0 |
| DI-03 | As a user, I can get a summary of any file | P0 |
| DI-04 | As a user, I can ask questions across multiple documents | P1 |
| DI-05 | As a user, answers include the source file and location | P1 |

### Generative AI

| ID | Story | Priority |
|---|---|---|
| GA-01 | As a user, I can generate a new document from a prompt | P1 |
| GA-02 | As a user, I can rewrite or simplify an existing document | P1 |
| GA-03 | As a user, I can translate a document to another language | P1 |
| GA-04 | As a user, I can synthesize multiple documents into one | P1 |
| GA-05 | As a user, I can extract structured data from documents to CSV | P1 |
| GA-06 | As a user, I can generate documents using saved templates | P2 |
| GA-07 | As a user, I can get AI-suggested filenames based on content | P2 |

### Model Management

| ID | Story | Priority |
|---|---|---|
| MM-01 | As a user, I can see all available Ollama models | P0 |
| MM-02 | As a user, the app selects the best model per task automatically | P0 |
| MM-03 | As a user, I can manually override which model is used | P1 |
| MM-04 | As a user, I can pull new models from within the app | P2 |
| MM-05 | As a user, I can see model status (loaded/idle/unavailable) | P1 |

### Privacy & Trust

| ID | Story | Priority |
|---|---|---|
| PT-01 | As a user, no data is ever sent to external servers | P0 |
| PT-02 | As a user, I can see a privacy status indicator | P1 |
| PT-03 | As a user, the app works fully offline | P0 |
| PT-04 | As a user, deleted files go to OS trash, not permanently deleted | P0 |

---

## Acceptance Criteria

### FM-01: Move files via natural language
- User types: "Move all PDFs from Downloads to Documents/PDFs"
- AI identifies source files and destination
- AI shows confirmation: "I will move 5 PDF files to Documents/PDFs. Confirm?"
- User confirms → files are moved
- AI reports: "Moved 5 files successfully"

### FM-07: Destructive action confirmation
- Any delete, bulk move, or overwrite operation
- Must show modal with exact list of affected files
- User must click "Confirm" before execution
- Cancel returns to normal state with no changes

### DI-01: Document Q&A
- User asks question about a specific file
- AI reads file content
- AI answers with relevant excerpt cited
- Works for PDF, DOCX, TXT, MD file types

### MM-02: Auto model routing
- File operations → uses fastest/smallest available model
- Document Q&A → uses largest available reasoning model
- Image files → uses vision model if available, else skips
- Falls back gracefully if preferred model is not installed

### PT-01: Zero data egress
- App makes zero HTTP requests outside localhost
- All Ollama calls go to localhost:11434
- No analytics, telemetry, or error reporting to external services

---

## MVP Feature Set

**Phase 1 — Core (Weeks 1-4)**
- Chat interface + file browser panel
- Ollama connection + multi-model routing
- File operations: move, copy, rename, delete, create folder
- Document reading: PDF, DOCX, TXT, MD
- Confirmation dialog for destructive actions
- Model status panel

**Phase 2 — Intelligence (Weeks 5-8)**
- Semantic search with local embeddings (SQLite-vec)
- Document Q&A with source citation
- Multi-document synthesis
- Structured data extraction

**Phase 3 — Generation (Weeks 9-12)**
- Document generation from prompt
- Document transformation (rewrite, translate, summarize)
- Generate panel UI (Create / Transform / Synthesize / Extract tabs)
- Streaming output preview

---

## Technical Constraints

- Must work with minimum: 1 Ollama model installed, 8GB RAM, no GPU
- Must support: macOS 12+, Windows 10+
- File size limit for reading: 50MB per document
- Context window management: chunk large docs, summarize if needed
- Path validation: reject all paths with ".." traversal

---

## Success Metrics

| Metric | Target |
|---|---|
| Time to first file operation | < 2 minutes from app open |
| File op success rate | > 95% |
| Document Q&A relevance | User-rated > 4/5 |
| App startup time | < 3 seconds |
| Supported file types | PDF, DOCX, TXT, MD, code files |
