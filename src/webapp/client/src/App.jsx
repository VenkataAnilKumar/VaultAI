import React, { useEffect, useState, useCallback, useMemo, useRef, Suspense, lazy } from 'react';
import {
  LockIcon, MessageSquareIcon, SparklesIcon, PlugIcon, ServerIcon,
  PlusIcon, PanelLeftCloseIcon, PanelLeftOpenIcon, CpuIcon,
  TrashIcon, SettingsIcon, ZapIcon, FileTextIcon, GlobeIcon, PlayIcon,
  MenuIcon, BarChart2Icon, EyeIcon
} from 'lucide-react';
import FileBrowser from './components/FileBrowser.jsx';
import Chat from './components/Chat.jsx';
import ModelPanel from './components/ModelPanel.jsx';
import StatusBar from './components/StatusBar.jsx';
import SettingsPanel from './components/SettingsPanel.jsx';
import SessionHistory from './components/SessionHistory.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import UsageDashboard from './components/UsageDashboard.jsx';
import FileWatcher from './components/FileWatcher.jsx';
import { useTheme } from './hooks/useTheme.js';
import { useSessionHistory } from './hooks/useSessionHistory.js';
import useStore from './store/useStore.js';
import { checkOllamaStatus, getModels } from './api/client.js';

const DocumentAgentPanel = lazy(() => import('./components/document/DocumentAgentPanel.jsx'));
const ResearchPanel      = lazy(() => import('./components/research/ResearchPanel.jsx'));
const SkillsPanel        = lazy(() => import('./components/SkillsPanel.jsx'));
const GeneratePanel      = lazy(() => import('./components/GeneratePanel.jsx'));
const ConnectorsPanel    = lazy(() => import('./components/connectors/ConnectorsPanel.jsx'));
const MCPPanel           = lazy(() => import('./components/mcp/MCPPanel.jsx'));

function PanelSkeleton() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-3)', fontSize: 13 }}>
      <span style={{ opacity: 0.5 }}>Loading…</span>
    </div>
  );
}

const NAV_ITEMS = [
  { id: 'chat',       label: 'Chat',       icon: MessageSquareIcon },
  { id: 'documents',  label: 'Documents',  icon: FileTextIcon      },
  { id: 'research',   label: 'Research',   icon: GlobeIcon         },
  { id: 'skills',     label: 'Skills',     icon: ZapIcon           },
  { id: 'generate',   label: 'Generate',   icon: SparklesIcon      },
  { id: 'connectors', label: 'Connectors', icon: PlugIcon          },
  { id: 'mcp',        label: 'MCP Tools',  icon: ServerIcon        },
];

// Bottom nav shows 4 most-used tabs on mobile
const BOTTOM_NAV = [
  { id: 'chat',      label: 'Chat',      icon: MessageSquareIcon },
  { id: 'documents', label: 'Docs',      icon: FileTextIcon      },
  { id: 'research',  label: 'Research',  icon: GlobeIcon         },
  { id: 'skills',    label: 'Skills',    icon: ZapIcon           },
];

const TAB_LABELS = {
  chat: 'Chat', documents: 'Documents', research: 'Research',
  skills: 'Skills', generate: 'Generate', connectors: 'Connectors', mcp: 'MCP Tools',
};

export default function App() {
  const {
    activeTab, setActiveTab, setOllamaConnected, setModels, setActiveProvider,
    setWorkingDirectory, ollamaConnected, availableModels,
    clearMessages, messages, demoMode, setDemoMode
  } = useStore();

  const { theme, setTheme } = useTheme();
  const { sessions, saveSession, deleteSession } = useSessionHistory();
  const [sidebarOpen, setSidebarOpen]     = useState(true);
  const [settingsOpen, setSettingsOpen]   = useState(false);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [showUsage, setShowUsage]         = useState(false);
  const [showWatcher, setShowWatcher]     = useState(false);

  // Mobile detection
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  // Close sidebar on mobile when switching tabs
  useEffect(() => { if (isMobile) setSidebarOpen(false); }, [isMobile]);

  const demoModeRef = useRef(demoMode);
  useEffect(() => { demoModeRef.current = demoMode; }, [demoMode]);

  function activateDemoMode() {
    setDemoMode(true);
    setOllamaConnected(true);
    setActiveProvider('openai');
    setModels([{ name: 'llama3.2 (demo)' }, { name: 'nomic-embed-text (demo)' }]);
  }

  useEffect(() => {
    async function init() {
      try {
        const status = await checkOllamaStatus();
        setOllamaConnected(status.connected);
        if (status.connected) {
          setActiveProvider(status.provider || null);
          const data = await getModels();
          setModels(data.models || []);
        } else {
          activateDemoMode();
        }
      } catch {
        setOllamaConnected(false);
        activateDemoMode();
      }

      for (const dir of ['/home/runner', '/tmp']) {
        try {
          const r = await fetch(`/api/files?path=${encodeURIComponent(dir)}`);
          if (r.ok) { setWorkingDirectory(dir); break; }
        } catch {}
      }
    }
    init();

    const iv = setInterval(async () => {
      if (demoModeRef.current) return;
      try {
        const s = await checkOllamaStatus();
        setOllamaConnected(s.connected);
        if (s.provider) setActiveProvider(s.provider);
      } catch { setOllamaConnected(false); }
    }, 30000);
    return () => clearInterval(iv);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (messages.length > 0 && activeTab === 'chat') {
      const timer = setTimeout(() => saveSession(messages), 1500);
      return () => clearTimeout(timer);
    }
  }, [messages, activeTab, saveSession]);

  const handleKeyDown = useCallback((e) => {
    const mod = e.metaKey || e.ctrlKey;
    if (!mod) return;
    if (e.key === 'k' || e.key === 'K') { e.preventDefault(); setActiveTab('chat'); clearMessages(); setActiveSessionId(null); }
    if (e.key === 'b' || e.key === 'B') { e.preventDefault(); setSidebarOpen(v => !v); }
    if (e.key === ',') { e.preventDefault(); setSettingsOpen(v => !v); }
  }, [setActiveTab, clearMessages]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  function handleSelectSession(session) {
    setActiveSessionId(session.id);
    setActiveTab('chat');
    clearMessages();
    const store = useStore.getState();
    session.messages.forEach(m => store.addMessage(m));
    if (isMobile) setSidebarOpen(false);
  }

  function handleNewChat() {
    setActiveTab('chat');
    clearMessages();
    setActiveSessionId(null);
    if (isMobile) setSidebarOpen(false);
  }

  function handleNavItem(id) {
    setActiveTab(id);
    if (isMobile) setSidebarOpen(false);
  }

  const renderPanel = useMemo(() => {
    switch (activeTab) {
      case 'chat':       return <Chat />;
      case 'documents':  return <Suspense fallback={<PanelSkeleton />}><DocumentAgentPanel /></Suspense>;
      case 'research':   return <Suspense fallback={<PanelSkeleton />}><ResearchPanel /></Suspense>;
      case 'skills':     return <Suspense fallback={<PanelSkeleton />}><SkillsPanel /></Suspense>;
      case 'generate':   return <Suspense fallback={<PanelSkeleton />}><GeneratePanel /></Suspense>;
      case 'connectors': return <Suspense fallback={<PanelSkeleton />}><ConnectorsPanel /></Suspense>;
      case 'mcp':        return <Suspense fallback={<PanelSkeleton />}><MCPPanel /></Suspense>;
      default:           return <Chat />;
    }
  }, [activeTab]);

  const showFiles   = activeTab === 'chat' || activeTab === 'generate';
  const showThreads = activeTab === 'chat' && sessions.length > 0;
  const sidebarVisible = sidebarOpen && (!isMobile || sidebarOpen);

  return (
    <div className="app-shell">
      {/* Mobile backdrop */}
      {isMobile && sidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
      )}

      {sidebarVisible && (
        <aside className={`sidebar ${isMobile ? 'sidebar-mobile' : ''}`}>
          <div className="sidebar-traffic">
            <div className="traffic-lights">
              <span className="tl tl-red" /><span className="tl tl-yellow" /><span className="tl tl-green" />
            </div>
            <button className="icon-btn" onClick={() => setSidebarOpen(false)} title="Collapse (⌘B)">
              <PanelLeftCloseIcon size={15} />
            </button>
          </div>

          <div className="sidebar-section">
            <button className="new-thread-btn" onClick={handleNewChat}>
              <PlusIcon size={14} />New chat
            </button>
          </div>

          <nav className="sidebar-nav">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => handleNavItem(id)}
                className={`nav-item ${activeTab === id ? 'nav-item-active' : ''}`}>
                <Icon size={14} /><span>{label}</span>
              </button>
            ))}
          </nav>

          <div className="sidebar-divider" />

          {showThreads && (
            <div className="sidebar-files">
              <SessionHistory sessions={sessions} activeId={activeSessionId}
                onSelect={handleSelectSession} onDelete={deleteSession} />
            </div>
          )}
          {showFiles && !showThreads && (
            <div className="sidebar-files"><FileBrowser /></div>
          )}

          <div className="sidebar-footer">
            {/* File Watcher widget */}
            {showWatcher && (
              <FileWatcher defaultDir={useStore.getState().workingDirectory} />
            )}

            {/* Usage Dashboard widget */}
            {showUsage && (
              <UsageDashboard onClose={() => setShowUsage(false)} />
            )}

            {!demoMode && !ollamaConnected && (
              <button className="demo-launch-btn" onClick={activateDemoMode}>
                <PlayIcon size={12} /> Try Demo Mode
              </button>
            )}

            {/* Quick-action row: Watcher + Stats + Settings */}
            <div className="sidebar-quick-row">
              <button className={`sidebar-quick-btn ${showWatcher ? 'sidebar-quick-btn-active' : ''}`}
                onClick={() => setShowWatcher(v => !v)} title="File Watcher">
                <EyeIcon size={12} />
              </button>
              <button className={`sidebar-quick-btn ${showUsage ? 'sidebar-quick-btn-active' : ''}`}
                onClick={() => { setShowUsage(v => !v); setShowWatcher(false); }} title="Usage stats">
                <BarChart2Icon size={12} />
              </button>
              <div className="settings-anchor" style={{ flex: 1 }}>
                <button className={`nav-item ${settingsOpen ? 'nav-item-active' : ''}`}
                  onClick={() => setSettingsOpen(v => !v)}>
                  <SettingsIcon size={14} /><span>Settings</span>
                </button>
                {settingsOpen && (
                  <SettingsPanel theme={theme} setTheme={setTheme} onClose={() => setSettingsOpen(false)} />
                )}
              </div>
            </div>

            <div className="model-status">
              {demoMode
                ? <><span className="status-dot" style={{ background: '#f59e0b' }} /><ZapIcon size={12} /><span>Demo mode active</span></>
                : <><span className={`status-dot ${ollamaConnected ? 'dot-green' : 'dot-red'}`} /><CpuIcon size={12} />
                  <span>{ollamaConnected ? `${availableModels.length} model${availableModels.length !== 1 ? 's' : ''} · Ollama` : 'Ollama offline'}</span></>
              }
            </div>
          </div>
        </aside>
      )}

      <main className={`main-area ${isMobile ? 'main-area-mobile' : ''}`}>
        <div className="content-card">
          {demoMode && (
            <div style={{
              background: 'linear-gradient(90deg, #1e1b4b, #2563eb, #7c3aed)',
              borderBottom: '1px solid #4338ca',
              padding: '7px 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              fontSize: 12, gap: 8
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, flexWrap: 'wrap' }}>
                <span style={{ color: '#fff', fontWeight: 700 }}>⚡ Live Demo Mode</span>
                <div className="demo-banner-tags">
                  {['All 6 panels active', 'Sample documents loaded', 'Real AI responses simulated'].map(t => (
                    <span key={t} className="demo-banner-tag">{t}</span>
                  ))}
                </div>
              </div>
              <button onClick={() => { setDemoMode(false); setOllamaConnected(false); setModels([]); setActiveProvider(null); }}
                style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
                Exit
              </button>
            </div>
          )}

          <div className="card-header">
            <div className="card-header-left">
              {(!sidebarOpen || isMobile) && (
                <button className="icon-btn" onClick={() => setSidebarOpen(true)} title="Open sidebar (⌘B)">
                  {isMobile ? <MenuIcon size={17} /> : <PanelLeftOpenIcon size={15} />}
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
            <ErrorBoundary key={activeTab}>{renderPanel}</ErrorBoundary>
          </div>
          <StatusBar />
        </div>

        {/* Bottom nav — mobile only */}
        {isMobile && (
          <nav className="bottom-nav">
            {BOTTOM_NAV.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => handleNavItem(id)}
                className={`bottom-nav-item ${activeTab === id ? 'bottom-nav-item-active' : ''}`}>
                <Icon size={20} />
                <span>{label}</span>
              </button>
            ))}
            <button onClick={() => setSidebarOpen(v => !v)}
              className={`bottom-nav-item ${sidebarOpen ? 'bottom-nav-item-active' : ''}`}>
              <MenuIcon size={20} />
              <span>More</span>
            </button>
          </nav>
        )}
      </main>
    </div>
  );
}
