# Vault AI Mobile — Replit Build Prompt

Paste into Replit Agent to build the Vault AI mobile companion app.

---

```
Build a React Native mobile app called "Vault AI Mobile" — the companion 
app for Vault AI desktop. Users connect to their Vault AI desktop over 
local WiFi to access the full multi-model AI file management experience 
from their phone.

---

## PRODUCT CONTEXT

Vault AI is a privacy-first local AI file manager. The desktop app runs 
on the user's computer with Ollama (local AI models) and manages files 
via natural language. The mobile app connects to the desktop over LAN 
and provides a mobile-optimized interface for the same capabilities.

---

## TECH STACK

Framework:    React Native + Expo
Navigation:   Expo Router (file-based routing)
Styling:      NativeWind (Tailwind for React Native)
State:        Zustand
HTTP:         Axios
Voice Input:  Expo Speech + expo-av
Storage:      AsyncStorage (connection settings)
Icons:        Lucide React Native

---

## TWO MODES

### Mode 1: Companion (Primary)
Connect to desktop Vault AI over local WiFi/LAN.
The desktop's Express server (port 3001) serves the same API.
Mobile is a thin client — all AI and file ops run on desktop.
User enters desktop IP address on first launch.

### Mode 2: Standalone (Fallback)
When desktop is not reachable (away from home network).
Uses on-device LLM via a lightweight integration.
Limited to: file search, document reading, basic Q&A.
Note: Full generation requires companion mode.

---

## PROJECT STRUCTURE

Build the mobile package at: src/mobile/

VaultAI/  (repo root)
└── src/
    └── mobile/
        └── src/
            ├── app/
            │   ├── (tabs)/
            │   │   ├── index.tsx          # Chat tab (default)
            │   │   ├── files.tsx          # File browser tab
            │   │   ├── generate.tsx       # Generation tab
            │   │   └── settings.tsx       # Settings tab
            │   ├── _layout.tsx            # Root layout
            │   └── connect.tsx            # Initial connection setup screen
            ├── components/
            │   ├── ChatInterface.tsx      # Main chat UI
            │   ├── MessageBubble.tsx      # Chat message component
            │   ├── VoiceInput.tsx         # Voice-to-text input
            │   ├── FileBrowser.tsx        # Mobile file browser
            │   ├── FileCard.tsx           # Individual file card
            │   ├── ModelBadge.tsx         # Shows active model
            │   ├── ConnectionStatus.tsx   # LAN connection indicator
            │   ├── ConfirmSheet.tsx       # Bottom sheet for confirmations
            │   └── GenerateTabs.tsx       # Create/Transform/Extract tabs
            ├── store/
            │   └── useStore.ts            # Zustand store
            ├── api/
            │   └── client.ts              # Axios client pointing to desktop
            ├── hooks/
            │   ├── useVaultConnection.ts  # Connection management
            │   └── useVoiceInput.ts       # Voice input hook
            └── constants/
                └── theme.ts               # Design tokens

---

## SCREENS

### Connect Screen (src/app/connect.tsx)
First-launch screen shown when no desktop connection is configured.

Layout:
  - Vault AI logo + "Connect to your desktop" heading
  - Input: "Desktop IP Address" (e.g., 192.168.1.100)
  - Input: "Port" (default: 3001)
  - "Test Connection" button → GET /api/models/status
  - If success: "Connected! 3 models available" in green → navigate to tabs
  - If fail: "Cannot reach Vault AI desktop — make sure it's running" in red
  - "Continue in Standalone Mode" text link (limited features)

---

### Chat Tab (src/app/(tabs)/index.tsx)
Main interface — identical to desktop but mobile-optimized.

Layout:
  - Header: connection status dot + "Vault AI" + model badge
  - Message list (ScrollView, reverse)
  - Bottom input bar:
      Text input (expandable, max 4 lines)
      Voice button (microphone icon) → expo-av recording
      Send button (arrow icon)
  - When loading: typing indicator animation

Features:
  - All chat features from desktop via API proxy to desktop
  - Voice input: tap mic → record → transcribe via Expo Speech → send
  - Long-press message to copy text
  - Swipe message to see model used + tools called
  - ConfirmSheet (bottom sheet) for destructive action confirmation

---

### Files Tab (src/app/(tabs)/files.tsx)
Mobile file browser with AI actions.

Layout:
  - Path breadcrumb bar (horizontally scrollable)
  - File list (FlatList for performance)
    Each item: icon + name + size + modified date
  - Bottom action bar: "Ask AI" button (opens chat with file context)

Features:
  - Navigate directories by tapping folders
  - Long-press file for context menu:
      "Ask AI about this file"
      "Summarize"
      "Move to..."
      "Rename"
      "Delete" (requires confirmation)
  - Pull-to-refresh
  - Search bar at top (filters current directory by filename)

---

### Generate Tab (src/app/(tabs)/generate.tsx)
Simplified generation interface for mobile.

Three sections (vertical scroll):

QUICK ACTIONS (most common, one tap):
  - "Summarize a document" → file picker → generates summary
  - "Draft from my notes" → file picker + prompt → generates doc
  - "Translate document" → file picker + language → translates
  - "Extract contacts" → file picker → extracts to list

CUSTOM GENERATE:
  - Text input: describe what to generate
  - Optional: add context files button
  - Generate button
  - Output preview (scrollable)
  - Share / Save buttons

RECENT:
  - List of last 5 generated documents
  - Tap to view, share, or regenerate

---

### Settings Tab (src/app/(tabs)/settings.tsx)

Desktop Connection:
  - Current desktop IP and port
  - Connection status
  - "Reconnect" button
  - "Change Connection" → opens connect screen

Models:
  - List of available models on connected desktop
  - Active model per task type
  - Model override for next message

Privacy:
  - "All AI runs on your desktop — no cloud" confirmation
  - Data storage location
  - Clear conversation history button

About:
  - Version
  - Link to desktop app

---

## API CLIENT (src/mobile/src/api/client.ts)

```typescript
import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'

const getBaseUrl = async () => {
  const ip = await AsyncStorage.getItem('vault_desktop_ip')
  const port = await AsyncStorage.getItem('vault_desktop_port') || '3001'
  if (!ip) throw new Error('Desktop not configured')
  return `http://${ip}:${port}`
}

// All API calls mirror the desktop server routes:
// POST /api/chat
// GET  /api/files
// GET  /api/models
// GET  /api/search
// POST /api/generate/document
// etc.
```

---

## ZUSTAND STORE (src/mobile/src/store/useStore.ts)

State:
  messages: Message[]
  workingDirectory: string
  availableModels: Model[]
  desktopConnected: boolean
  desktopUrl: string
  isLoading: boolean
  pendingAction: PendingAction | null
  mode: 'companion' | 'standalone'

---

## UI DESIGN

Colors match desktop Vault AI:
  Background:   #FFFFFF
  Surface:      #F8F9FA  
  Border:       #E5E7EB
  Primary:      #2563EB
  User bubble:  #2563EB (white text)
  AI bubble:    #F3F4F6 (gray-900 text)
  Destructive:  #DC2626
  Success:      #16A34A
  Text:         #111827
  Subtext:      #6B7280

Font: System default (San Francisco on iOS, Roboto on Android)

Safe area handling: expo-safe-area-context for all screens
Keyboard handling: KeyboardAvoidingView on chat screen

---

## VOICE INPUT (src/mobile/src/hooks/useVoiceInput.ts)

Using expo-av for recording:
  1. Request microphone permission on first use
  2. Tap mic button → start recording (visual waveform animation)
  3. Tap again or auto-stop after 30s → stop recording
  4. Send audio to Whisper via Ollama if available on desktop
  5. Fallback: use Expo Speech Recognition (on-device)
  6. Transcribed text populates the input field
  7. User can edit before sending

---

## CONNECTION MANAGEMENT (src/mobile/src/hooks/useVaultConnection.ts)

  AsyncStorage keys (initialize with defaults on first launch):
    'vault_desktop_ip'   → default: null (must be set by user)
    'vault_desktop_port' → default: '3001'
  
  - On app open: read AsyncStorage keys → if null, show connect screen
  - If keys exist: test connection → GET /api/models/status
  - If connected: set desktopConnected = true, fetch models
  - If not connected: show "Reconnect" banner (not a blocker)
  - Poll connection status every 30s while app is active
  - Auto-retry once if request fails
  - Graceful degradation: show which features need desktop connection

---

## IMPORTANT REQUIREMENTS

1. CONNECTION FIRST: App is not useful without desktop connection — 
   make the setup flow clear and fast

2. OPTIMISTIC UI: Show user message immediately, loading indicator 
   while waiting for AI response

3. PERFORMANCE: Use FlatList for file lists (not ScrollView + map) 
   to handle large directories

4. OFFLINE BANNER: If desktop disconnects mid-session, show persistent 
   red banner "Desktop disconnected — reconnect to continue"

5. SAME PRIVACY STORY: Make clear that all AI runs on desktop — 
   mobile is just the interface

6. iOS + ANDROID: Test on both — avoid iOS-only or Android-only APIs 
   without fallbacks

7. DARK MODE: Respect system dark mode preference using NativeWind 
   dark: variants
```
