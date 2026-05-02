import React, { useState } from 'react';
import { FolderIcon, DatabaseIcon, GitBranchIcon, MailIcon, BookmarkIcon, CheckCircleIcon, Loader2Icon, XIcon } from 'lucide-react';
import { disconnectConnector, queryConnector } from '../../api/client.js';

const ICONS = {
  obsidian: <FolderIcon size={16} className="text-purple-600" />,
  sqlite: <DatabaseIcon size={16} className="text-blue-600" />,
  git: <GitBranchIcon size={16} className="text-orange-600" />,
  email: <MailIcon size={16} className="text-red-500" />,
  bookmarks: <BookmarkIcon size={16} className="text-yellow-500" />
};

export default function ConnectorCard({ connector, onConnect, onDisconnected }) {
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [querying, setQuerying] = useState(false);

  async function handleDisconnect() {
    setLoading(true);
    try {
      await disconnectConnector(connector.name);
      onDisconnected(connector.name);
    } finally {
      setLoading(false);
    }
  }

  async function handleQuery(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setQuerying(true);
    try {
      const data = await queryConnector(connector.name, query);
      setResults(data.results);
    } catch (err) {
      setResults([{ error: err.message }]);
    } finally {
      setQuerying(false);
    }
  }

  return (
    <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          {ICONS[connector.name] || <FolderIcon size={16} className="text-gray-400" />}
          <div>
            <p className="text-sm font-medium text-gray-800">{connector.displayName}</p>
            <p className="text-xs text-gray-400">{connector.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {connector.connected ? (
            <>
              <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                <CheckCircleIcon size={11} />Connected
              </span>
              <button onClick={handleDisconnect} disabled={loading}
                className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-red-500 transition-colors">
                {loading ? <Loader2Icon size={14} className="animate-spin" /> : <XIcon size={14} />}
              </button>
            </>
          ) : (
            <button onClick={() => onConnect(connector)}
              className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors">
              Connect
            </button>
          )}
        </div>
      </div>

      {connector.connected && (
        <div className="border-t border-gray-100 px-4 py-3">
          <form onSubmit={handleQuery} className="flex gap-2">
            <input value={query} onChange={e => setQuery(e.target.value)}
              placeholder={`Ask ${connector.displayName}...`}
              className="flex-1 text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <button type="submit" disabled={querying}
              className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-xs text-gray-700 rounded-lg transition-colors disabled:opacity-50">
              {querying ? <Loader2Icon size={12} className="animate-spin" /> : 'Query'}
            </button>
          </form>
          {results && (
            <div className="mt-2 max-h-32 overflow-y-auto text-xs text-gray-600 bg-gray-50 rounded-lg p-2 font-mono whitespace-pre-wrap">
              {JSON.stringify(results, null, 2).slice(0, 1000)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
