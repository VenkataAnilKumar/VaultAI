import React, { useEffect, useState, useCallback } from 'react';
import {
  LockIcon, MessageSquareIcon, SparklesIcon, PlugIcon, ServerIcon,
  PlusIcon, PanelLeftCloseIcon, PanelLeftOpenIcon, CpuIcon,
  TrashIcon, SettingsIcon, ZapIcon
} from 'lucide-react';
import FileBrowser from './components/FileBrowser.jsx';
import Chat from './components/Chat.jsx';
import GeneratePanel from './components/GeneratePanel.jsx';
import ModelPanel from './components/ModelPanel.jsx';
import StatusBar from './components/StatusBar.jsx';
import ConnectorsPanel from './components/connectors/ConnectorsPanel.jsx';
import MCPPanel from './components/mcp/MCPPanel.jsx';
import SkillsPanel from './components/SkillsPanel.jsx';
import SettingsPanel from './components/SettingsPanel.jsx';
import SessionHistory from './components/SessionHistory.jsx';
import { useTheme } from './hooks/useTheme.js';
import { useSessionHistory } from './hooks/useSessionHistory.js';
import useStore from './store/useStore.js';
import { checkOllamaStatus, getModels } from './api/client.js';

const NAV_ITEMS = [
  { id: 'chat',       label: 'Chat',       icon: MessageSquareIcon },
  { id: 'skills',     label: 'Skills',     icon: ZapIcon           },
  { id: 'generate',   label: 'Generate',   icon: SparklesIcon      },
  { id: 'connectors', label: 'Connectors', icon: PlugIcon          },
  { id: 'mcp',        label: 'MCP Tools',  icon: ServerIcon        },
];

const TAB_LABELS = {
  chat: 'Chat', skills: 'Skills', generate: 'Generate',
  connectors: 'Connectors', mcp: 'MCP Tools',
};

export default function App() {
  const {
    activeTab, setActiveTab, setOllamaConnected, setModels,
    setWorkingDirectory, ollamaConnected, availableModels,
    clearMessages, messages,
  } = useStore();

  const { theme, setTheme } = useTheme();
  const { sessions, saveSession, deleteSession, getSession } = useSessionHistory();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState(null);

  // ── Init ──────────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      try {
        const status = await checkOllamaStatus();
        setOllamaConnected(status.connected);
        if (status.connected) {
          const data = await getModels();
          setModels(data.models || []);
        }
      } catch { setOllamaConnected(false); }

      for (const dir of ['/home/runner', '/tmp']) {
        if (!dir) continue;
        try {
          const r = await fetch(`/api/files?path=${encodeURIComponent(dir)}`);
          if (r.ok) { setWorkingDirectory(dir); break; }
        } catch {}
      }
    }
    init();
    const iv = setInterval(async () => {
      try { const s = await checkOllamaStatus(); setOllamaConnected(s.connected); }
      catch { setOllamaConnected(false); }
    }, 30000);
    return () => clearInterval(iv);
  }, []);

  // ── Auto-save session when chat messages change ───────────────
  useEffect(() => {
    if (messages.length > 0 && activeTab === 'chat') {
      const timer = setTimeout(() => saveSession(messages), 1500);
      return () => clearTimeout(timer);
    }
  }, [messages]);

  // ── Keyboard shortcuts ────────────────────────────────────────
  const handleKeyDown = useCallback((e) => {
    const mod = e.metaKey || e.ctrlKey;
    if (!mod) return;

    if (e.key === 'k' || e.key === 'K') {
      e.preventDefault();
      setActiveTab('chat');
      clearMessages();
      setActiveSessionId(null);
    }
    if (e.key === 'b' || e.key === 'B') {
      e.preventDefault();
      setSidebarOpen(v => !v);
    }
    if (e.key === ',') {
      e.preventDefault();
      setSettingsOpen(v => !v);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // ── Session restore ───────────────────────────────────────────
  function handleSelectSession(session) {
    setActiveSessionId(session.id);
    setActiveTab('chat');
    // Restore messages via store — clear first then re-add
    clearMessages();
    const store = useStore.getState();
    session.messages.forEach(m => store.addMessage(m));
  }

  function handleNewChat() {
    setActiveTab('chat');
    clearMessages();
    setActiveSessionId(null);
  }

  // ── Panel render ──────────────────────────────────────────────
  const renderPanel = () => {
    switch (activeTab) {
      case 'chat':       return <Chat />;
      case 'skills':     return <SkillsPanel />;
      case 'generate':   return <GeneratePanel />;
      case 'connectors': return <ConnectorsPanel />;
      case 'mcp':        return <MCPPanel />;
      default:           return <Chat />;
    }
  };

  const showFiles   = activeTab === 'chat' || activeTab === 'generate';
  const showThreads = activeTab === 'chat' && sessions.length > 0;

  return (
    <div className="app-shell">

      {/* ══ LEFT SIDEBAR ══ */}
      {sidebarOpen && (
        <aside className="sidebar">

          {/* Traffic lights */}
          <div className="sidebar-traffic">
            <div className="traffic-lights">
              <span className="tl tl-red" />
              <span className="tl tl-yellow" />
              <span className="tl tl-green" />
            </div>
            <button className="icon-btn" onClick={() => setSidebarOpen(false)} title="Collapse (⌘B)">
              <PanelLeftCloseIcon size={15} />
            </button>
          </div>

          {/* New chat */}
          <div className="sidebar-section">
            <button className="new-thread-btn" onClick={handleNewChat}>
              <PlusIcon size={14} />
              New chat
            </button>
          </div>

          {/* Nav */}
          <nav className="sidebar-nav">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className={`nav-item ${activeTab === id ? 'nav-item-active' : ''}`}>
                <Icon size={14} />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          <div className="sidebar-divider" />

          {/* Thread history (Chat tab) */}
          {showThreads && (
            <div className="sidebar-files">
              <SessionHistory
                sessions={sessions}
                activeId={activeSessionId}
                onSelect={handleSelectSession}
                onDelete={deleteSession}
              />
            </div>
          )}

          {/* File browser (Chat/Generate) */}
          {showFiles && !showThreads && (
            <div className="sidebar-files">
              <FileBrowser />
            </div>
          )}

          {/* Bottom: Settings + model status */}
          <div className="sidebar-footer">
            <div className="settings-anchor">
              <button
                className={`nav-item ${settingsOpen ? 'nav-item-active' : ''}`}
                onClick={() => setSettingsOpen(v => !v)}
              >
                <SettingsIcon size={14} />
                <span>Settings</span>
              </button>
              {settingsOpen && (
                <SettingsPanel
                  theme={theme}
                  setTheme={setTheme}
                  onClose={() => setSettingsOpen(false)}
                />
              )}
            </div>

            <div className="model-status">
              <span className={`status-dot ${ollamaConnected ? 'dot-green' : 'dot-red'}`} />
              <CpuIcon size={12} />
              <span>
                {ollamaConnected
                  ? `${availableModels.length} model${availableModels.length !== 1 ? 's' : ''} · Ollama`
                  : 'Ollama offline'}
              </span>
            </div>
          </div>
        </aside>
      )}

      {/* ══ MAIN AREA ══ */}
      <main className="main-area">
        <div className="content-card">

          <div className="card-header">
            <div className="card-header-left">
              {!sidebarOpen && (
                <button className="icon-btn" onClick={() => setSidebarOpen(true)} title="Open sidebar (⌘B)">
                  <PanelLeftOpenIcon size={15} />
                </button>
              )}
              <LockIcon size={13} style={{ color: 'var(--accent)' }} />
              <span className="brand-name">Vault AI</span>
              <span className="header-sep">/</span>
              <span className="tab-label">{TAB_LABELS[activeTab]}</span>
            </div>
            <div className="card-header-right">
              {activeTab === 'chat' && (
                <button className="icon-btn" onClick={handleNewChat} title="New chat (⌘K)">
                  <TrashIcon size={14} />
                </button>
              )}
              <ModelPanel />
            </div>
          </div>

          <div className="card-body">
            {renderPanel()}
          </div>

          <StatusBar />
        </div>
      </main>
    </div>
  );
}
