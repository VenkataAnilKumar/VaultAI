import React, { useState } from 'react';
import { ServerIcon, PlayIcon, StopCircleIcon, CopyIcon, ChevronDownIcon, ChevronRightIcon, XIcon } from 'lucide-react';
import { startMCPServer, stopMCPServer, getMCPServerConfig, disconnectMCPServer } from '../../api/client.js';

export default function MCPServerCard({ server, isVaultServer = false, onStatusChange }) {
  const [transport, setTransport] = useState('sse');
  const [port, setPort] = useState('3002');
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState(null);
  const [showTools, setShowTools] = useState(false);
  const [copied, setCopied] = useState(false);
  const [startError, setStartError] = useState(null);

  async function handleStart() {
    setLoading(true);
    setStartError(null);
    try {
      await startMCPServer(transport, parseInt(port));
      const cfg = await getMCPServerConfig(transport, port);
      setConfig(cfg.snippet);
      onStatusChange?.();
    } catch (err) {
      setStartError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleStop() {
    setLoading(true);
    try {
      await stopMCPServer();
      setConfig(null);
      onStatusChange?.();
    } finally {
      setLoading(false);
    }
  }

  async function handleDisconnect() {
    setLoading(true);
    try {
      await disconnectMCPServer(server.name);
      onStatusChange?.();
    } finally {
      setLoading(false);
    }
  }

  function copyConfig() {
    navigator.clipboard.writeText(config || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const connected = isVaultServer ? server?.running : server?.connected !== false;

  return (
    <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          <ServerIcon size={16} className="text-gray-500" />
          <div>
            <p className="text-sm font-medium text-gray-800">{isVaultServer ? 'Vault AI MCP Server' : server.name}</p>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${connected ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                {connected ? 'Running' : 'Stopped'}
              </span>
              {(server?.tools?.length || server?.toolCount) > 0 && (
                <span className="text-xs text-gray-400">{server?.tools?.length || server?.toolCount} tools</span>
              )}
            </div>
          </div>
        </div>

        {isVaultServer ? (
          <div className="flex items-center gap-2">
            {!connected ? (
              <>
                <div className="flex border border-gray-200 rounded-lg overflow-hidden text-xs">
                  {['stdio', 'sse'].map(t => (
                    <button key={t} onClick={() => setTransport(t)}
                      className={`px-2.5 py-1 ${transport === t ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                      {t}
                    </button>
                  ))}
                </div>
                {transport === 'sse' && (
                  <input value={port} onChange={e => setPort(e.target.value)} className="w-16 border border-gray-200 rounded px-2 py-1 text-xs text-center" />
                )}
                <button onClick={handleStart} disabled={loading}
                  className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  <PlayIcon size={12} />Start
                </button>
              </>
            ) : (
              <button onClick={handleStop} disabled={loading}
                className="flex items-center gap-1 px-3 py-1 bg-red-50 text-red-600 text-xs font-medium rounded-lg hover:bg-red-100 transition-colors">
                <StopCircleIcon size={12} />Stop
              </button>
            )}
          </div>
        ) : (
          <button onClick={handleDisconnect} disabled={loading}
            className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-red-500 transition-colors">
            <XIcon size={14} />
          </button>
        )}
      </div>

      {startError && (
        <div className="border-t border-gray-100 px-4 py-2 bg-red-50 text-xs text-red-600 flex items-center gap-2">
          <span>⚠️</span> {startError}
        </div>
      )}

      {isVaultServer && connected && config && (
        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-gray-600">Claude Desktop config</span>
            <button onClick={copyConfig}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
              <CopyIcon size={11} />{copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <pre className="text-xs text-gray-700 font-mono bg-white border border-gray-200 rounded-lg p-2 overflow-x-auto max-h-32">{config}</pre>
        </div>
      )}

      {!isVaultServer && server?.tools?.length > 0 && (
        <div className="border-t border-gray-100">
          <button onClick={() => setShowTools(v => !v)}
            className="w-full flex items-center justify-between px-4 py-2 text-xs text-gray-500 hover:bg-gray-50 transition-colors">
            <span>View {server.tools.length} tools</span>
            {showTools ? <ChevronDownIcon size={12} /> : <ChevronRightIcon size={12} />}
          </button>
          {showTools && (
            <div className="border-t border-gray-50 max-h-32 overflow-y-auto">
              {server.tools.map(t => (
                <div key={t.name} className="px-4 py-1.5 border-b border-gray-50 last:border-0">
                  <p className="text-xs font-mono text-gray-700">{t.name}</p>
                  {t.description && <p className="text-xs text-gray-400 truncate">{t.description}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
