---
description: "Scaffold a new VaultAI Express API route with correct structure, error handling, path validation, and response shape."
name: "New API Route"
argument-hint: "Describe the route: e.g. POST /api/summarize — accepts filePath, returns summary"
agent: "agent"
---

Create a new Express route for VaultAI based on this description: $input

Follow these rules exactly:

1. **File location**: `src/webapp/server/routes/<name>.js`
2. **Structure**:
```js
import express from 'express';
import path from 'path';
const router = express.Router();

// validate path helper — always use for user-supplied paths
function safePath(userInput, root) {
  const resolved = path.resolve(root, userInput);
  if (!resolved.startsWith(path.resolve(root))) {
    throw Object.assign(new Error('Invalid path'), { code: 'PATH_TRAVERSAL' });
  }
  return resolved;
}

router.post('/', async (req, res) => {
  try {
    // 1. Validate inputs
    // 2. Call service (never business logic in route)
    // 3. Return success response
    return res.json({ success: true, data: result });
  } catch (err) {
    console.error('[<route>]', err);
    const status = err.code === 'PATH_TRAVERSAL' ? 400 : 500;
    return res.status(status).json({ success: false, error: err.message, code: err.code || 'INTERNAL_ERROR' });
  }
});

export default router;
```
3. **No hardcoded model names** — call `routeModel()` from `services/ollama.js`
4. **No external HTTP calls** — Ollama only at `localhost:11434`
5. **Streaming routes**: set SSE headers + stream `{ type, content }` events
6. After creating the route file, remind me to register it in `server/index.js`
