import { create } from 'zustand';

const useStore = create((set) => ({
  // Chat
  messages: [],
  workingDirectory: '',
  availableModels: [],
  ollamaConnected: false,
  activeProvider: null,     // 'ollama' | 'openai' | null
  selectedModel: '',        // user-selected chat model
  isLoading: false,
  pendingAction: null,
  indexedDirectories: [],
  activeTab: 'chat',

  // Multi-agent
  workflowMode: 'simple',
  activeWorkflow: null,

  // Connectors
  connectors: [],
  activeConnectors: [],

  // MCP
  mcpServerRunning: false,
  externalMCPServers: [],
  externalMCPTools: [],

  // Demo mode
  demoMode: false,

  // Chat actions
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, { ...message, id: Date.now() + Math.random(), timestamp: new Date().toISOString() }]
    })),
  updateMessage: (id, updates) =>
    set((state) => ({ messages: state.messages.map((m) => (m.id === id ? { ...m, ...updates } : m)) })),
  clearMessages: () => set({ messages: [] }),
  setWorkingDirectory: (dir) => set({ workingDirectory: dir }),
  setModels: (models) => set({ availableModels: models }),
  setOllamaConnected: (connected) => set({ ollamaConnected: connected }),
  setActiveProvider: (provider) => set({ activeProvider: provider }),
  setSelectedModel: (model) => set({ selectedModel: model }),
  setLoading: (loading) => set({ isLoading: loading }),
  setPendingAction: (action) => set({ pendingAction: action }),
  clearPendingAction: () => set({ pendingAction: null }),
  setIndexedDirectories: (dirs) => set({ indexedDirectories: dirs }),
  setActiveTab: (tab) => set({ activeTab: tab }),

  // Multi-agent actions
  setWorkflowMode: (mode) => set({ workflowMode: mode }),
  setActiveWorkflow: (wf) => set({ activeWorkflow: wf }),
  clearWorkflow: () => set({ activeWorkflow: null }),

  // Connector actions
  setConnectors: (list) => set({ connectors: list }),
  setActiveConnectors: (names) => set({ activeConnectors: names }),

  // MCP actions
  setMCPServerRunning: (val) => set({ mcpServerRunning: val }),
  setExternalMCPServers: (servers) => set({ externalMCPServers: servers }),
  setExternalMCPTools: (tools) => set({ externalMCPTools: tools }),

  // Demo mode actions
  setDemoMode: (on) => set({ demoMode: on }),
}));

export default useStore;
