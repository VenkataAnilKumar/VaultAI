import React, { useEffect, useState } from 'react';
import { ServerIcon, PlusIcon, RefreshCwIcon } from 'lucide-react';
import useStore from '../../store/useStore.js';
import { getMCPServerStatus, getMCPServers } from '../../api/client.js';
import MCPServerCard from './MCPServerCard.jsx';
import MCPAddServerForm from './MCPAddServerForm.jsx';

export default function MCPPanel() {
  const { mcpServerRunning, setMCPServerRunning, externalMCPServers, setExternalMCPServers, setExternalMCPTools } = useStore();
  const [serverInfo, setServerInfo] = useState({ running: false });
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [status, serversData] = await Promise.all([getMCPServerStatus(), getMCPServers()]);
      setServerInfo(status);
      setMCPServerRunning(status.running);
      setExternalMCPServers(serversData.servers || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function handleConnected() {
    setShowAddForm(false);
    load();
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <ServerIcon size={16} className="text-gray-500" />
          <span className="font-medium text-sm text-gray-800">MCP</span>
          {mcpServerRunning && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Server running</span>
          )}
        </div>
        <button onClick={load} className="p-1.5 hover:bg-gray-100 rounded text-gray-400">
          <RefreshCwIcon size={13} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Vault AI as MCP Server</p>
          <p className="text-xs text-gray-400 mb-3">Expose Vault AI tools to Claude Desktop and other AI apps</p>
          <MCPServerCard server={serverInfo} isVaultServer onStatusChange={load} />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">External MCP Servers</p>
            <button onClick={() => setShowAddForm(true)}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium">
              <PlusIcon size={12} />Add Server
            </button>
          </div>
          <p className="text-xs text-gray-400 mb-3">Add external capabilities to Vault AI</p>

          {externalMCPServers.length === 0 ? (
            <div className="border border-dashed border-gray-200 rounded-xl p-5 text-center">
              <ServerIcon size={24} className="text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-400 mb-3">Connect MCP servers to extend Vault AI with web search, databases, APIs, and more</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {['Brave Search', 'GitHub', 'PostgreSQL', 'Fetch'].map(name => (
                  <button key={name} onClick={() => setShowAddForm(true)}
                    className="px-2.5 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors">
                    + {name}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {externalMCPServers.map(s => (
                <MCPServerCard key={s.name} server={s} onStatusChange={load} />
              ))}
            </div>
          )}
        </div>
      </div>

      {showAddForm && <MCPAddServerForm onConnected={handleConnected} onCancel={() => setShowAddForm(false)} />}
    </div>
  );
}
