# Vault AI

Privacy-first, local AI-powered file and document management platform.

## Architecture

- **Frontend**: React + Vite + TailwindCSS (port 5173 → external port 80)
- **Backend**: Node.js + Express (port 3001)
- **AI**: Ollama HTTP API at localhost:11434 (local only, no cloud)
- **Vector DB**: SQLite + better-sqlite3 (cosine similarity search)
- **Document parsing**: pdf-parse (PDF), mammoth (DOCX), fs (TXT/MD/code)
- **State**: Zustand (client)

## Project Structure

```
src/webapp/
├── client/              # React + Vite frontend
│   └── src/
│       ├── components/  # Chat, FileBrowser, ModelPanel, etc.
│       ├── store/       # Zustand state (useStore.js)
│       ├── api/         # Axios API client
│       ├── App.jsx
│       └── main.jsx
└── server/              # Node.js + Express backend
    ├── routes/          # chat.js, files.js, models.js, search.js, generate.js
    ├── services/        # ollama.js, fileOps.js, docReader.js, embeddings.js, vectorStore.js, genAI.js
    ├── tools/           # fileTools.js (Ollama function-calling definitions)
    └── index.js
```

## Running Locally

Requires Ollama installed and running:
```bash
ollama serve
ollama pull llama3.2
ollama pull nomic-embed-text
```

Start the app:
```bash
cd src/webapp && npm install && npm run dev
```

## Key Features

- **Chat**: Natural language file management with Ollama tool-calling
- **File Browser**: Navigate, browse, and ask AI about files
- **Semantic Search**: Vector-based document search via SQLite embeddings
- **Document Generation**: Create, transform, synthesize, and extract from docs
- **Privacy**: Zero data egress — all AI runs on localhost via Ollama

## Security

- Path traversal prevention: all paths validated, must stay within home directory
- No hard deletes: files moved to OS trash via `trash` package
- Destructive actions require explicit confirmation dialog
- No external network calls (Ollama is localhost only)

## Dependencies

Server: express, cors, better-sqlite3, pdf-parse, mammoth, fs-extra, trash, axios, md5
Client: react, react-dom, zustand, axios, lucide-react, react-markdown, tailwindcss
