---
description: "Scaffold a new VaultAI React component with correct dark-mode Tailwind styling, store integration, and prop types."
name: "New React Component"
argument-hint: "Describe the component: e.g. A panel that lists all active connectors with status badges"
agent: "agent"
---

Create a new React component for VaultAI based on this description: $input

Follow these rules:

1. **File location**: `src/webapp/client/src/components/<ComponentName>.jsx` (or subdirectory if it belongs to `agents/`, `connectors/`, or `mcp/`)
2. **Component template**:
```jsx
import { useStore } from '../store/useStore';

export default function ComponentName({ prop1, prop2 }) {
  // Get state from store — never call API directly
  const { data, action } = useStore(s => ({
    data: s.<slice>.data,
    action: s.<slice>.action,
  }));

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      {/* component content */}
    </div>
  );
}
```
3. **Styling rules**:
   - TailwindCSS classes only — no `style={{}}`, no CSS modules
   - Dark theme: `bg-gray-900` (app), `bg-gray-800` (panels), `bg-gray-700` (cards)
   - Text: `text-gray-100` (primary), `text-gray-400` (secondary)
   - Accent: `text-blue-400`, `bg-blue-600`
   - Danger: `text-red-400`, `bg-red-600`
   - Success/privacy: `text-green-400`
4. **Destructive actions** (delete, bulk ops): must open `ConfirmDialog` before executing
5. **Store only**: all API calls go through store actions — never `fetch`/`axios` in component body
6. **No prop drilling** beyond 2 levels — use store instead
