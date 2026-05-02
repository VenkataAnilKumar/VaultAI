import React, { useEffect, useState } from 'react';
import { LockIcon, CpuIcon, FolderOpenIcon } from 'lucide-react';
import FileBrowser from './components/FileBrowser.jsx';
import Chat from './components/Chat.jsx';
import GeneratePanel from './components/GeneratePanel.jsx';
import ModelPanel from './components/ModelPanel.jsx';
import StatusBar from './components/StatusBar.jsx';
import useStore from './store/useStore.js';
import { checkOllamaStatus, getModels } from './api/client.js';

export default function App() {
  const { activeTab, setActiveTab, setOllamaConnected, setModels, setWorkingDirectory, workingDirectory } = useStore();
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

      try {
        const res = await fetch('/api/files?path=/home/runner');
        if (res.ok) {
          setWorkingDirectory('/home/runner');
        } else {
          setWorkingDirectory('/tmp');
        }
      } catch {
        setWorkingDirectory('/tmp');
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

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {showFileBrowser && (
        <div className="w-70 border-r border-gray-200 flex flex-col flex-shrink-0" style={{ width: 280 }}>
          <FileBrowser />
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFileBrowser(v => !v)}
              className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
              title="Toggle file browser"
            >
              <FolderOpenIcon size={18} />
            </button>
            <div className="flex items-center gap-2">
              <LockIcon size={18} className="text-blue-600" />
              <span className="font-semibold text-gray-900">Vault AI</span>
            </div>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full flex items-center gap-1">
              <LockIcon size={10} />
              Privacy First
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setActiveTab('chat')}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${activeTab === 'chat' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                Chat
              </button>
              <button
                onClick={() => setActiveTab('generate')}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${activeTab === 'generate' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                Generate
              </button>
            </div>
            <ModelPanel />
          </div>
        </header>

        <div className="flex-1 overflow-hidden">
          {activeTab === 'chat' ? <Chat /> : <GeneratePanel />}
        </div>

        <StatusBar />
      </div>
    </div>
  );
}
