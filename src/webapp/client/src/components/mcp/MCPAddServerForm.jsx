import React, { useState } from 'react';
import { XIcon, Loader2Icon, PlusIcon, Trash2Icon } from 'lucide-react';
import { connectMCPServer } from '../../api/client.js';

const TEMPLATES = {
  'Brave Search': { command: 'npx', args: '-y,@modelcontextprotocol/server-brave-search', env: [{ key: 'BRAVE_API_KEY', value: '' }] },
  'GitHub': { command: 'npx', args: '-y,@modelcontextprotocol/server-github', env: [{ key: 'GITHUB_PERSONAL_ACCESS_TOKEN', value: '' }] },
  'PostgreSQL': { command: 'npx', args: '-y,@modelcontextprotocol/server-postgres', env: [{ key: 'DATABASE_URL', value: '' }] },
  'Fetch': { command: 'npx', args: '-y,@modelcontextprotocol/server-fetch', env: [] }
};

export default function MCPAddServerForm({ onConnected, onCancel }) {
  const [form, setForm] = useState({ name: '', command: '', args: '', env: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function applyTemplate(label) {
    const t = TEMPLATES[label];
    setForm(f => ({ ...f, command: t.command, args: t.args, env: [...t.env] }));
  }

  function addEnvVar() {
    setForm(f => ({ ...f, env: [...f.env, { key: '', value: '' }] }));
  }

  function updateEnv(i, field, value) {
    setForm(f => ({ ...f, env: f.env.map((e, idx) => idx === i ? { ...e, [field]: value } : e) }));
  }

  function removeEnv(i) {
    setForm(f => ({ ...f, env: f.env.filter((_, idx) => idx !== i) }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const args = form.args.split(',').map(a => a.trim()).filter(Boolean);
      const env = Object.fromEntries(form.env.filter(e => e.key).map(e => [e.key, e.value]));
      const result = await connectMCPServer({ name: form.name, command: form.command, args, env });
      onConnected(result);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 text-sm">Add MCP Server</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600"><XIcon size={16} /></button>
        </div>

        <div className="px-5 pt-4">
          <p className="text-xs text-gray-500 mb-2">Quick templates:</p>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {Object.keys(TEMPLATES).map(label => (
              <button key={label} onClick={() => applyTemplate(label)}
                className="px-2.5 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">
                {label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-5 pb-5 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Server name</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="brave-search" required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Command</label>
            <input value={form.command} onChange={e => setForm(f => ({ ...f, command: e.target.value }))}
              placeholder="npx" required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Arguments (comma-separated)</label>
            <input value={form.args} onChange={e => setForm(f => ({ ...f, args: e.target.value }))}
              placeholder="-y, @modelcontextprotocol/server-brave-search"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-gray-700">Environment variables</label>
              <button type="button" onClick={addEnvVar} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
                <PlusIcon size={11} />Add
              </button>
            </div>
            {form.env.map((e, i) => (
              <div key={i} className="flex gap-2 mb-1.5">
                <input value={e.key} onChange={ev => updateEnv(i, 'key', ev.target.value)}
                  placeholder="KEY" className="flex-1 border border-gray-200 rounded px-2 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500" />
                <input value={e.value} onChange={ev => updateEnv(i, 'value', ev.target.value)}
                  placeholder="value" className="flex-1 border border-gray-200 rounded px-2 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500" />
                <button type="button" onClick={() => removeEnv(i)} className="text-gray-400 hover:text-red-500">
                  <Trash2Icon size={13} />
                </button>
              </div>
            ))}
          </div>

          {error && <div className="text-xs text-red-600 bg-red-50 rounded-lg p-2">{error}</div>}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onCancel}
              className="flex-1 py-2 px-4 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading || !form.name || !form.command}
              className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              {loading ? <><Loader2Icon size={14} className="animate-spin" />Connecting...</> : 'Test & Connect'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
