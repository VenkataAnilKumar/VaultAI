import React, { useEffect, useState } from 'react';
import {
  LockIcon, MessageSquareIcon, SparklesIcon, PlugIcon, ServerIcon,
  PlusIcon, PanelLeftCloseIcon, PanelLeftOpenIcon, CpuIcon,
  TrashIcon, SettingsIcon
} from 'lucide-react';
import FileBrowser from './components/FileBrowser.jsx';
import Chat from './components/Chat.jsx';
import GeneratePanel from './components/GeneratePanel.jsx';
import ModelPanel from './components/ModelPanel.jsx';
import StatusBar from './components/StatusBar.jsx';
import ConnectorsPanel from './components/connectors/ConnectorsPanel.jsx';
import MCPPanel from './components/mcp/MCPPanel.jsx';
import SettingsPanel from './components/SettingsPanel.jsx';
import { useTheme } from './hooks/useTheme.js';
import useStore from './store/useStore.js';
import { checkOllamaStatus, getModels } from './api/client.js';

const NAV_ITEMS = [
  { id: 'chat',       label: 'Chat',       icon: MessageSquareIcon },
  { id: 'generate',   label: 'Generate',   icon: SparklesIcon      },
  { id: 'connectors', label: 'Connectors', icon: PlugIcon          },
  { id: 'mcp',        label: 'MCP Tools',  icon: ServerIcon        },
];

const TAB_LABELS = {
  chat: 'Chat', generate: 'Generate',
  connectors: 'Connectors', mcp: 'MCP Tools',
};

export default function App() {
  const {
    activeTab, setActiveTab, setOllamaConnected, setModels,
    setWorkingDirectory, ollamaConnected, availableModels, clearMessages,
  } = useStore();

  const { theme, setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);

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

  const renderPanel = () => {
    switch (activeTab) {
      case 'chat':       return <Chat />;
      case 'generate':   return <GeneratePanel />;
      case 'connectors': return <ConnectorsPanel />;
      case 'mcp':        return <MCPPanel />;
      default:           return <Chat />;
    }
  };

  const showFiles = activeTab === 'chat' || activeTab === 'generate';

  return (
    <div className="app-shell">

      {/* ── LEFT SIDEBAR ── */}
      {sidebarOpen && (
        <aside className="sidebar">

          {/* Traffic lights + collapse */}
          <div className="sidebar-traffic">
            <div className="traffic-lights">
              <span className="tl tl-red" />
              <span className="tl tl-yellow" />
              <span className="tl tl-green" />
            </div>
            <button className="icon-btn" onClick={() => setSidebarOpen(false)} title="Collapse">
              <PanelLeftCloseIcon size={15} />
            </button>
          </div>

          {/* New chat */}
          <div className="sidebar-section">
            <button className="new-thread-btn"
              onClick={() => { setActiveTab('chat'); clearMessages(); }}>
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

          {/* Files / thread list */}
          {showFiles && (
            <div className="sidebar-files">
              <FileBrowser />
            </div>
          )}

          {/* Bottom — settings + model status */}
          <div className="sidebar-footer">
            {/* Settings button */}
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

            {/* Model status */}
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

      {/* ── MAIN AREA ── */}
      <main className="main-area">
        <div className="content-card">

          {/* Card header */}
          <div className="card-header">
            <div className="card-header-left">
              {!sidebarOpen && (
                <button className="icon-btn" onClick={() => setSidebarOpen(true)} title="Open sidebar">
                  <PanelLeftOpenIcon size={15} />
                </button>
              )}
              <LockIcon size={13} className="text-indigo-500" />
              <span className="brand-name">Vault AI</span>
              <span className="header-sep">/</span>
              <span className="tab-label">{TAB_LABELS[activeTab]}</span>
            </div>
            <div className="card-header-right">
              {activeTab === 'chat' && (
                <button className="icon-btn" onClick={clearMessages} title="Clear chat">
                  <TrashIcon size={14} />
                </button>
              )}
              <ModelPanel />
            </div>
          </div>

          {/* Panel content */}
          <div className="card-body">
            {renderPanel()}
          </div>

          <StatusBar />
        </div>
      </main>
    </div>
  );
}
