import React, { useEffect, useState } from 'react';
import { LockIcon, FolderOpenIcon, MessageSquareIcon, SparklesIcon, PlugIcon, ServerIcon } from 'lucide-react';
import FileBrowser from './components/FileBrowser.jsx';
import Chat from './components/Chat.jsx';
import GeneratePanel from './components/GeneratePanel.jsx';
import ModelPanel from './components/ModelPanel.jsx';
import StatusBar from './components/StatusBar.jsx';
import ConnectorsPanel from './components/connectors/ConnectorsPanel.jsx';
import MCPPanel from './components/mcp/MCPPanel.jsx';
import useStore from './store/useStore.js';
import { checkOllamaStatus, getModels } from './api/client.js';

const NAV_ITEMS = [
  { id: 'chat', label: 'Chat', icon: MessageSquareIcon },
  { id: 'generate', label: 'Generate', icon: SparklesIcon },
  { id: 'connectors', label: 'Connectors', icon: PlugIcon },
  { id: 'mcp', label: 'MCP', icon: ServerIcon }
];

export default function App() {
  const { activeTab, setActiveTab, setOllamaConnected, setModels, setWorkingDirectory } = useStore();
  const [showFileBrowser, setShowFileBrowser] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const status = await checkOllamaStatus();
        setOllamaConnected(status.connected);
        if (status.connected) {
          const data = await getModels();
          setModels(data.models || []);
        }
      } catch {
        setOllamaConnected(false);
      }

      // Determine working directory
      for (const dir of ['/home/runner', process.env.HOME, '/tmp']) {
        if (!dir) continue;
        try {
          const r = await fetch(`/api/files?path=${encodeURIComponent(dir)}`);
          if (r.ok) { setWorkingDirectory(dir); break; }
        } catch {}
      }
    }
    init();

    const interval = setInterval(async () => {
      try {
        const status = await checkOllamaStatus();
        setOllamaConnected(status.connected);
      } catch {
        setOllamaConnected(false);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const renderPanel = () => {
    switch (activeTab) {
      case 'chat': return <Chat />;
      case 'generate': return <GeneratePanel />;
      case 'connectors': return <ConnectorsPanel />;
      case 'mcp': return <MCPPanel />;
      default: return <Chat />;
    }
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Left sidebar — file browser */}
      {showFileBrowser && (activeTab === 'chat' || activeTab === 'generate') && (
        <div className="border-r border-gray-200 flex flex-col flex-shrink-0" style={{ width: 260 }}>
          <FileBrowser />
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 bg-white flex-shrink-0">
          <div className="flex items-center gap-3">
            {(activeTab === 'chat' || activeTab === 'generate') && (
              <button onClick={() => setShowFileBrowser(v => !v)}
                className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                title="Toggle file browser">
                <FolderOpenIcon size={17} />
              </button>
            )}
            <div className="flex items-center gap-2">
              <LockIcon size={17} className="text-blue-600" />
              <span className="font-semibold text-gray-900 text-sm">Vault AI</span>
            </div>
          </div>

          {/* Navigation tabs */}
          <nav className="flex border border-gray-200 rounded-xl overflow-hidden">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeTab === id ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}>
                <Icon size={13} />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </nav>

          <ModelPanel />
        </header>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {renderPanel()}
        </div>

        <StatusBar />
      </div>
    </div>
  );
}
