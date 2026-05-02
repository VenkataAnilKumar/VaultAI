---
description: "Use when writing or editing React frontend components, Zustand store, or API client code for VaultAI webapp. Covers component patterns, state management, dark-mode styling, streaming UI, and confirmation dialog requirements."
applyTo: "src/webapp/client/**"
---

# VaultAI Client — Coding Instructions

## Component Rules

- Functional components only — no class components
- All data fetching and mutations go through Zustand store actions — never call `api/client.js` directly from a component
- Destructure only what you need from the store:
  ```jsx
  const { messages, sendMessage } = useStore(s => ({ messages: s.chat.messages, sendMessage: s.chat.sendMessage }));
  ```

## Zustand Store Structure

Single store at `src/store/useStore.js`. Slices and their responsibilities:

| Slice | Owns |
|---|---|
| `chat` | messages, streaming state, active model display |
| `files` | currentDirectory, fileTree, selectedFile |
| `models` | availableModels, modelRoles, connectionStatus |
| `generate` | activeTab, generationOutput, outputPath |
| `agents` | workflowSteps, agentStatuses, isMultiAgentMode |
| `connectors` | connectorList, connectorStatuses, queryResults |
| `mcp` | serverStatus, externalServers, availableTools |

Never add a new top-level slice without checking this list first.

## Styling

- TailwindCSS utility classes only — no inline `style={{}}`, no CSS Modules, no styled-components
- **Dark mode first** — the app uses a dark theme throughout; default background is `bg-gray-900`, panels `bg-gray-800`, cards `bg-gray-750`
- Text: `text-gray-100` (primary), `text-gray-400` (secondary), `text-gray-500` (muted)
- Accent: `text-blue-400` / `bg-blue-600` for interactive elements
- Danger / destructive: `text-red-400` / `bg-red-600`
- Privacy badge / success: `text-green-400`

## Confirmation Dialog — Required for Destructive Actions

Any delete, bulk operation (3+ files), or overwrite MUST route through `ConfirmDialog`:

```jsx
<ConfirmDialog
  open={confirmOpen}
  title="Delete files?"
  description="This will move the following files to trash:"
  items={filesToDelete}          // string[] shown as a list
  onConfirm={handleConfirm}
  onCancel={() => setConfirmOpen(false)}
  danger                         // red confirm button
/>
```

Never execute destructive operations without showing this dialog first.

## SSE Streaming in UI

Consume generation streams with `fetch` + `ReadableStream`:

```js
const response = await fetch('/api/generate', { method: 'POST', body: ... });
const reader = response.body.getReader();
const decoder = new TextDecoder();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  const lines = decoder.decode(value).split('\n');
  for (const line of lines) {
    if (!line.startsWith('data: ')) continue;
    const event = JSON.parse(line.slice(6));
    if (event.type === 'token') appendToken(event.content);
    if (event.type === 'done') finalize(event.filePath);
  }
}
```

- Show a streaming cursor while tokens arrive
- Disable the send button while streaming is active

## Agent Workflow Panel

`AgentWorkflowPanel` renders each step from `agents.workflowSteps`:
- `pending` → gray dot + step name
- `running` → animated spinner + step name
- `done` → green checkmark + step name + result summary
- `error` → red X + error message

Only show the panel when `agents.isMultiAgentMode === true` and a workflow is active.

## Model Display

Always show the actual model used in the response, not the preferred model:
- Display in `StatusBar` as: `Model: mistral:7b`
- If the preferred model was unavailable, show a warning badge: `(fallback)`

## Privacy Badge

`PrivacyBadge` must always be visible in `StatusBar`:
- Green lock icon + "All Local" text
- Never hide or remove it

## File Browser

`FileBrowser` interactions:
- Single click → select file, show metadata in side panel
- Double click → send `"Read [filename]"` message to chat automatically
- Right-click → context menu: Rename, Move, Delete, Ask AI about this file
