---
description: "Use when writing or editing backend server code, Express routes, services, agents, connectors, or MCP files for VaultAI. Covers API conventions, Ollama integration, file operations, streaming, security, and privacy enforcement."
applyTo: "src/webapp/server/**"
---

# VaultAI Server — Coding Instructions

## API Route Conventions

Every route module exports an Express Router. Structure every handler as:

```js
router.post('/route', async (req, res) => {
  try {
    // validate inputs first
    // call service
    return res.json({ success: true, data: result });
  } catch (err) {
    console.error('[route] error:', err);
    return res.status(500).json({ success: false, error: err.message, code: 'INTERNAL_ERROR' });
  }
});
```

- Success: `{ success: true, data: <payload> }`
- Error: `{ success: false, error: "<message>", code: "<SNAKE_CASE_CODE>" }`
- Streaming (generation routes): `Content-Type: text/event-stream`, `Cache-Control: no-cache`

## Path Sanitization — ALWAYS REQUIRED

Validate every user-supplied path before any fs operation:

```js
import path from 'path';

function safePath(userInput, rootDir) {
  const resolved = path.resolve(rootDir, userInput);
  if (!resolved.startsWith(path.resolve(rootDir))) {
    throw Object.assign(new Error('Path traversal rejected'), { code: 'PATH_TRAVERSAL' });
  }
  return resolved;
}
```

Return HTTP 400 if `..` traversal is detected. Never log the raw user-supplied path.

## File Operations

- Use `fs-extra` for all fs operations (`import fs from 'fs-extra'`)
- Use `trash` for ALL user-initiated deletes — never `fs.unlink` / `fs.remove` for user files
- Bulk operations (3+ files) and any delete MUST be preceded by a confirmation step
- Single move/copy/rename: auto-execute without confirmation

```js
import trash from 'trash';
await trash(resolvedFilePath); // correct
await fs.unlink(resolvedFilePath); // WRONG — never do this for user files
```

## Ollama Integration

Always call through `services/ollama.js` — never call Ollama HTTP API directly from routes:

```js
import { routeModel, chat, generate, embed } from '../services/ollama.js';

const model = await routeModel('document-qa'); // returns best available model
const response = await chat(model, messages);
```

- Never hardcode a model name in routes or other services
- Always check if the model is available; fall back gracefully
- Show the user which model was actually used in the response

## SSE Streaming Pattern

All generation routes must stream via SSE:

```js
res.setHeader('Content-Type', 'text/event-stream');
res.setHeader('Cache-Control', 'no-cache');
res.setHeader('Connection', 'keep-alive');
res.flushHeaders();

const send = (type, payload) =>
  res.write(`data: ${JSON.stringify({ type, ...payload })}\n\n`);

// stream tokens
for await (const chunk of ollamaStream) {
  send('token', { content: chunk });
}
send('done', { filePath: outputPath });
res.end();
```

## Privacy Rules

- **Zero external HTTP calls** — the server must never call any host other than `localhost` / `127.0.0.1`
- No analytics, telemetry, or error reporting to external services
- Connector reads are local files/processes only
- Never log file content or user document text to console

## Multi-Agent Orchestration

- Orchestrator lives in `agents/orchestrator.js`
- Task graph: `{ id, type, instruction, dependsOn: string[] }`
- Independent tasks (no `dependsOn`) → run with `Promise.all`
- Dependent tasks → run sequentially after their dependencies resolve
- All agents share a `WorkflowMemory` instance — pass it through the runner
- Valid agent types: `file`, `document`, `search`, `generation`, `connector`, `mcp`, `orchestrator`

## Connector Pattern

Every connector in `connectors/` must extend `BaseConnector` from `connectors/base.js` and implement:
`connect`, `disconnect`, `isConnected`, `read`, `list`, `search`
`write` is optional — not all connectors support it.

## Security Checklist (before committing any server file)

- [ ] All file paths validated with `safePath()` — returns 400 on traversal
- [ ] No `exec`, `spawn`, or `eval` with user-supplied strings
- [ ] No HTTP calls to external hosts
- [ ] No hardcoded model names
- [ ] Deletes use `trash`, not `fs.unlink`
- [ ] Streaming routes set correct SSE headers
