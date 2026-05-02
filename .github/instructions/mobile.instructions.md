---
description: "Use when writing or editing React Native mobile app code for VaultAI. Covers Expo Router structure, NativeWind styling, LAN connection to desktop, voice input, and offline handling."
applyTo: "src/mobile/**"
---

# VaultAI Mobile — Coding Instructions

## Language & Framework
- TypeScript (`.tsx`) for all files — strict mode
- React Native + Expo (Expo Router for navigation)
- NativeWind for styling (same Tailwind class names as the web app)
- Zustand for state (shared slice shape with webapp store)

## Screen Structure (Expo Router tabs)

```
app/
  (tabs)/
    index.tsx     # Chat tab
    files.tsx     # File browser tab
    generate.tsx  # Quick generate (Summarize, Translate, Draft)
    settings.tsx  # Desktop connection settings (IP + port)
  _layout.tsx     # Root layout + tab bar
  connect.tsx     # Initial connection screen (desktop discovery)
```

## Desktop Connection

All API calls go to the desktop app over LAN. Never call localhost from mobile:

```ts
import { useVaultConnection } from '../hooks/useVaultConnection';
const { desktopUrl, isConnected } = useVaultConnection();

// All fetch/axios calls use desktopUrl:
const res = await fetch(`${desktopUrl}/api/chat`, { ... });
```

- `desktopUrl` is stored in `settings` store slice (e.g. `http://192.168.1.x:3001`)
- Show offline banner when `isConnected === false`
- Never hard-code an IP address

## Voice Input

```ts
import { useVoiceInput } from '../hooks/useVoiceInput';
const { isRecording, transcript, startRecording, stopRecording } = useVoiceInput();
```

- Microphone permission must be requested before first use
- Show real-time transcript while recording
- Auto-send to chat when recording stops (with user confirmation option)

## NativeWind Styling

- Same Tailwind classes as web: `bg-gray-900`, `text-gray-100`, `text-blue-400`, etc.
- Use `className` prop on all `View`, `Text`, `Pressable` components
- Dark theme only — no light mode switching
- Safe area: always wrap screens in `<SafeAreaView className="flex-1 bg-gray-900">`

## Offline State

```tsx
{!isConnected && (
  <View className="bg-yellow-800 px-4 py-2">
    <Text className="text-yellow-200 text-sm">Desktop unreachable — reconnect in Settings</Text>
  </View>
)}
```

Show this banner at the top of every tab when disconnected.

## State Management

- Store in `store/` — mirror the webapp Zustand slice shape
- Slices needed on mobile: `chat`, `files`, `generate`, `settings` (desktopUrl, port)
- `settings.desktopUrl` persists via `AsyncStorage`

## Error Handling

- Wrap all API calls in try/catch
- Network errors → show inline error message, never crash
- Return type: `{ success: boolean; data?: T; error?: string }`

## Quick Generate Actions (generate.tsx tab)

Three actions available without full chat:
1. **Summarize** — pick a file, get a summary
2. **Translate** — pick a file, pick target language
3. **Draft** — describe document, generate to Desktop

All stream output via SSE — show live token output in a scrollable text area.
