# Vault AI — Feature Specifications

**Version:** 1.0  
**Date:** 2026-05-02

---

## Feature 1: Natural Language File Management

### Overview
Users manage files and folders by typing natural language instructions into a chat interface. The AI interprets intent, identifies files, and executes operations.

### Supported Operations
| Operation | Example Prompt |
|---|---|
| Move | "Move all PDFs from Downloads to Documents/Archive" |
| Copy | "Copy the project brief to the Backup folder" |
| Rename | "Rename budget_final_v3.xlsx to budget_2024.xlsx" |
| Delete | "Delete all .tmp files in the temp folder" |
| Create folder | "Create a folder called Q1-Reports in Documents" |
| Bulk organize | "Organize Downloads by file type into subfolders" |
| List | "What files are in my Desktop?" |
| Find | "Find all Word documents modified this month" |

### Confirmation Rules
- Single file move/copy/rename: auto-execute
- Any delete: always require confirmation
- Bulk operations (3+ files): always require confirmation
- Overwrite existing file: always require confirmation

---

## Feature 2: Document Q&A

### Overview
Users ask questions about documents. The AI reads the file content and answers based on what's in the document — not general knowledge.

### Supported File Types
- PDF (.pdf)
- Word documents (.docx, .doc)
- Text files (.txt)
- Markdown (.md)
- Code files (.py, .js, .ts, .go, .java, .rs, .cpp, .cs, .json, .yaml, .toml)

### Example Interactions
```
User: "What are the payment terms in acme_contract.pdf?"
AI:   Reads file → "Payment terms are Net 30, with a 1.5% late fee 
      per month. (Source: Section 4.2, Page 7)"

User: "Summarize the Q3 report in 5 bullet points"
AI:   Reads file → Returns 5 key points with section references

User: "What functions does auth.py export?"
AI:   Reads file → Lists exported functions with signatures
```

### Behavior
- Always cites source file and location when possible
- For large files: chunks and retrieves relevant sections
- For ambiguous files: asks for clarification before reading

---

## Feature 3: Semantic Search

### Overview
Search across all indexed documents by meaning — not just filename or exact keywords. Find relevant content even when you don't remember the exact words.

### How It Works
1. User indexes a folder (one-time setup per folder)
2. Documents are chunked, embedded, stored locally
3. Search queries are embedded and compared to document chunks
4. Results ranked by semantic similarity

### Example Interactions
```
User: "Find documents about termination clauses"
AI:   Returns: contract_v2.pdf (Section 8), nda_acme.pdf (Section 5)

User: "Search for anything related to the Henderson project"
AI:   Returns: 12 files with relevant excerpts

User: "Which files mention pricing or invoices?"
AI:   Returns: ranked list with preview text
```

### Index Management
- User chooses which folders to index
- Re-index on demand or when files change
- Index stored in local SQLite database

---

## Feature 4: Multi-Model Intelligence

### Overview
Different AI models handle different tasks automatically. Users never need to think about which model to use — the router selects the optimal model for each request.

### Model Roles
| Role | Default Model | Fallback |
|---|---|---|
| File Operations | llama3.2:3b | Any small model |
| Document Q&A | mistral:7b | Any large model |
| Embeddings | nomic-embed-text | Any model |
| Vision / Images | llava:7b | Skip vision, text only |
| Code Files | qwen2.5-coder:7b | codellama:7b |
| Generation | mistral:7b / llama3.1:8b | Largest available |

### Model Management UI
- See all installed Ollama models
- View which role each model is assigned
- Override model for next message manually
- Model status: loaded / idle / not installed
- Pull new models from within the app

### Graceful Degradation
- Works with just 1 model installed
- Falls back to available model if preferred is missing
- Shows user which model was actually used
- Warns if vision tasks attempted without vision model

---

## Feature 5: Document Generation

### Overview
Generate new documents from scratch using a prompt and optional context files. Output is saved directly to the user's file system.

### Create Tab
```
Prompt: "Write a project proposal for a mobile app redesign"
Context files: requirements.txt, competitor_analysis.pdf
Output path: /Documents/Proposals/mobile_redesign_proposal.md
```

### Transform Tab
Transform existing documents:
| Action | Description |
|---|---|
| Summarize | Condense to key points |
| Simplify | Rewrite in plain language |
| Expand | Add more detail and depth |
| Translate | Convert to another language |
| Rewrite | Change tone (formal/casual) |
| Shorten | Reduce length by X% |

### Synthesize Tab
Combine multiple documents:
| Action | Description |
|---|---|
| Compare | Side-by-side comparison of two docs |
| Merge | Combine into single document |
| Find contradictions | Identify conflicting statements |
| Extract themes | Common themes across all docs |
| Timeline | Extract chronological events |

### Extract Tab
Pull structured data from documents:
| Type | Output |
|---|---|
| Dates & deadlines | CSV with date, description, file source |
| Names & contacts | CSV with name, email, phone, company |
| Prices & amounts | CSV with item, amount, currency, file source |
| Action items | Markdown checklist |
| Key terms & definitions | Markdown glossary |

---

## Feature 6: Smart File Operations

### Auto-Rename
AI reads file content and suggests meaningful filename:
```
untitled_1.pdf → reads content → suggests: "acme_invoice_march2024.pdf"
```
User approves before rename executes.

### Suggest Organization
AI analyzes a folder and proposes a structure:
```
User: "Suggest how to organize my Documents folder"
AI:   Reads file list + content samples →
      Proposes: Projects/ Contracts/ Invoices/ Archive/
      Shows which files would move where
User: Approves or modifies → executes
```

### Duplicate Detection *(v1.5)*
```
User: "Find duplicate files in my Downloads"
AI:   Scans by filename + file hash →
      Returns: 5 duplicate groups, 1.2GB recoverable space
      User selects which to keep
```

---

## Feature 7: Privacy Dashboard

### Overview
A trust artifact showing users exactly what is running and where their data goes.

### Displays
- Ollama connection: localhost:11434 (local only)
- Active models and their memory usage
- Indexed document count and storage size
- Network activity: zero external connections
- All file operations log (current session)

### Indicators
- Green lock icon: all operations local
- Model status: running / idle
- Index status: up to date / needs refresh

---

## Feature 8: File Browser Panel

### Overview
A persistent file system panel alongside the chat for visual navigation.

### Functionality
- Directory tree with expand/collapse
- Navigate by clicking folders
- File metadata on hover: size, type, modified date
- Click file → shows info in panel
- Double-click file → auto-sends "Read [filename]" to chat
- Right-click menu: rename, move, delete, ask AI about this file
- Breadcrumb navigation with back/forward
- Working directory indicator (sent with every chat message)

---

> For the full versioned roadmap see `doc/product/roadmap.md`
