---
description: "Use when building, configuring, or debugging VaultAI on Replit. Covers Replit Agent build workflow, port configuration, Ollama connectivity, and environment differences from local development."
---

# VaultAI on Replit — Build & Run Instructions

## Building with Replit Agent

The complete build prompt is in `doc/prompts/replit-build-prompt.md`.
Copy its entire contents and paste into Replit Agent to scaffold the full application.

**Build order Replit Agent should follow:**
1. `src/webapp/package.json` — workspace root with scripts + deps
2. `src/webapp/server/` — all services first, then routes, then `index.js`
3. `src/webapp/client/` — store first, then api/client.js, then components, then App.jsx
4. Tailwind + Vite config last

## Port Configuration on Replit

Replit maps ports differently from local dev:

| Service | Local Port | Replit External |
|---|---|---|
| React (Vite) | 5173 | 80 (main webview) |
| Express API | 3001 | 3001 |

**Vite config must use `0.0.0.0` host on Replit:**

```js
// vite.config.js
export default {
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  }
}
```

**Express must bind to `0.0.0.0`:**

```js
// server/index.js
app.listen(3001, '0.0.0.0', () => {
  console.log('Server running on port 3001');
});
```

## Ollama on Replit

Ollama **cannot run inside Replit** (requires a local runtime with GPU/CPU access).

**Two options:**

### Option A — Connect to local machine Ollama (recommended for development)
Set `OLLAMA_BASE_URL` environment variable in Replit Secrets:
```
OLLAMA_BASE_URL = http://<your-local-ip>:11434
```
Then in `services/ollama.js` read from env:
```js
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
```

### Option B — Mock mode for UI-only development
When `OLLAMA_BASE_URL` is unset and Ollama is unreachable, the app should:
- Show the "Ollama not connected" banner in the UI
- Allow browsing files and UI exploration
- Queue AI requests and notify user to connect Ollama

## Environment Variables (Replit Secrets)

Set these in the Replit Secrets tab (not in code):

| Key | Value | Required |
|---|---|---|
| `OLLAMA_BASE_URL` | `http://localhost:11434` or remote | Optional |
| `VAULT_ROOT` | `/home/runner/VaultAI` | Optional — defaults to home dir |
| `PORT` | `3001` | Optional |
| `NODE_ENV` | `development` | Optional |

## native module `better-sqlite3`

`better-sqlite3` compiles a native binary. On Replit this requires:
- `replit.nix` includes `python3`, `gcc`, `gnumake` (already configured)
- Install with `npm install --build-from-source better-sqlite3` if pre-built binary fails

**If build fails**, add to `package.json` scripts:
```json
"postinstall": "cd server && npm rebuild better-sqlite3"
```

## `trash` package on Replit

The `trash` package sends files to OS trash. On Replit Linux environment, it uses `gio trash` or falls back to a `.trash` folder in the home dir. This is acceptable — do not replace with `fs.unlink`.

## Running the App

Replit run button triggers:
```bash
cd src/webapp && npm install && npm run dev
```

This starts both the Vite dev server (port 5173) and Express (port 3001) concurrently via the root `package.json` dev script.

The Replit webview opens on port 80 → mapped to 5173.

## File System on Replit

- Replit's file system is persistent within the Repl
- `VAULT_ROOT` defaults to `/home/runner/<repl-name>/` 
- Path validation still applies — reject `..` traversal even on Replit
- The `trash` fallback directory will be `/home/runner/.local/share/Trash/`
