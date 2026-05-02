import React, { useState } from 'react';
import { PlugIcon, ChevronDownIcon } from 'lucide-react';

export default function MCPToolBadge({ tools = [] }) {
  const [open, setOpen] = useState(false);
  if (tools.length === 0) return null;

  return (
    <div className="relative">
      <button onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-purple-50 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors">
        <PlugIcon size={11} />
        {tools.length} MCP tool{tools.length !== 1 ? 's' : ''}
        <ChevronDownIcon size={10} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
            <div className="px-3 py-2 border-b border-gray-100 text-xs font-medium text-gray-500">External MCP Tools</div>
            <div className="max-h-48 overflow-y-auto">
              {tools.map(t => (
                <div key={t.namespacedName} className="px-3 py-2 hover:bg-gray-50 border-b border-gray-50">
                  <p className="text-xs font-mono text-gray-800 truncate">{t.toolName || t.namespacedName}</p>
                  <p className="text-xs text-gray-400 truncate">from {t.serverName}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
