import React, { useEffect, useState } from 'react';
import { PlugIcon, RefreshCwIcon } from 'lucide-react';
import useStore from '../../store/useStore.js';
import { getConnectors } from '../../api/client.js';
import ConnectorCard from './ConnectorCard.jsx';
import ConnectorConfigForm from './ConnectorConfigForm.jsx';

export default function ConnectorsPanel() {
  const { connectors, setConnectors, setActiveConnectors } = useStore();
  const [configuring, setConfiguring] = useState(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await getConnectors();
      setConnectors(data.connectors || []);
      setActiveConnectors((data.connectors || []).filter(c => c.connected).map(c => c.name));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function handleConnected() {
    setConfiguring(null);
    load();
  }

  function handleDisconnected() {
    load();
  }

  const activeCount = connectors.filter(c => c.connected).length;

  return (
    <div className="flex flex-col h-full">
      <div className="panel-header flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <PlugIcon size={16} className="text-gray-500" />
          <span className="font-medium text-sm text-gray-800">Connectors</span>
          {activeCount > 0 && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{activeCount} active</span>
          )}
        </div>
        <button onClick={load} className="p-1.5 hover:bg-gray-100 rounded text-gray-400">
          <RefreshCwIcon size={13} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <p className="text-xs text-gray-400 mb-3">
          Connect local data sources — all data stays on your machine. No cloud, no uploads.
        </p>

        {connectors.map(c => (
          <ConnectorCard
            key={c.name}
            connector={c}
            onConnect={setConfiguring}
            onDisconnected={handleDisconnected}
          />
        ))}

        {connectors.length === 0 && !loading && (
          <div className="text-center py-8 text-sm text-gray-400">No connectors available</div>
        )}
      </div>

      {configuring && (
        <ConnectorConfigForm
          connector={configuring}
          onConnect={handleConnected}
          onCancel={() => setConfiguring(null)}
        />
      )}
    </div>
  );
}
