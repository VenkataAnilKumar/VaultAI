---
description: "Add a new feature to VaultAI end-to-end: server route, service logic, Zustand store action, and React component. Use when implementing a complete feature slice."
name: "Full Feature Scaffold"
argument-hint: "Describe the feature: e.g. Document translation — user picks a file and target language, AI translates and saves as new file"
agent: "agent"
---

Scaffold a complete end-to-end VaultAI feature based on this description: $input

Plan and implement all four layers in order:

## Step 1 — Server Route (`src/webapp/server/routes/`)
- Create a new Express route following `server.instructions.md` conventions
- Validate all inputs including file paths
- Call services — no business logic in the route handler
- Use SSE streaming if the feature involves LLM generation

## Step 2 — Service Logic (`src/webapp/server/services/`)
- Create or extend a service file for the core logic
- Use `routeModel()` for model selection — never hardcode
- Use `docReader.js` for file reading, `genAI.js` for generation, `vectorStore.js` for search
- Return structured results, not raw Ollama responses

## Step 3 — Zustand Store (`src/webapp/client/src/store/useStore.js`)
- Add state fields and actions to the appropriate slice
- Action pattern: set loading state → call `api/client.js` → update state → clear loading
- Handle errors: set an error field in the slice, never throw from actions

## Step 4 — React Component (`src/webapp/client/src/components/`)
- Build the UI using `client.instructions.md` conventions
- Dark-mode Tailwind only
- Get state from store — no direct API calls in components
- If destructive: include `ConfirmDialog`
- If streaming: show live token output with a streaming cursor

## Step 5 — Register
- Add the new route to `server/index.js`
- Export the new component from the appropriate barrel if one exists

## Roadmap Check
Before implementing, confirm which roadmap version this feature belongs to:
- v1.0: Core file ops + Ollama
- v1.5: Semantic search + Doc Q&A
- v2.0: Document generation + streaming
- v3.0+: Connectors, Agents, MCP

Do not implement v3+ dependencies when working on a v1/v2 feature.
