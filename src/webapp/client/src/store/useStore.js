import { create } from 'zustand';

const useStore = create((set) => ({
  messages: [],
  workingDirectory: '',
  availableModels: [],
  ollamaConnected: false,
  isLoading: false,
  pendingAction: null,
  indexedDirectories: [],
  activeTab: 'chat',

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, { ...message, id: Date.now() + Math.random(), timestamp: new Date().toISOString() }]
    })),

  updateMessage: (id, updates) =>
    set((state) => ({
      messages: state.messages.map((m) => (m.id === id ? { ...m, ...updates } : m))
    })),

  clearMessages: () => set({ messages: [] }),

  setWorkingDirectory: (dir) => set({ workingDirectory: dir }),

  setModels: (models) => set({ availableModels: models }),

  setOllamaConnected: (connected) => set({ ollamaConnected: connected }),

  setLoading: (loading) => set({ isLoading: loading }),

  setPendingAction: (action) => set({ pendingAction: action }),

  clearPendingAction: () => set({ pendingAction: null }),

  setIndexedDirectories: (dirs) => set({ indexedDirectories: dirs }),

  setActiveTab: (tab) => set({ activeTab: tab })
}));

export default useStore;
