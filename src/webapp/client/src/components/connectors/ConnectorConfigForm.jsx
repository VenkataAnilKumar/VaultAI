import React, { useState } from 'react';
import { XIcon, Loader2Icon, CheckCircleIcon } from 'lucide-react';
import { connectConnector } from '../../api/client.js';

export default function ConnectorConfigForm({ connector, onConnect, onCancel }) {
  const [config, setConfig] = useState(
    Object.fromEntries(Object.entries(connector.configSchema || {}).map(([k, v]) => [k, v.default ?? '']))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await connectConnector(connector.name, config);
      setSuccess(result);
      setTimeout(() => onConnect(result), 800);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }

  function renderField(key, schema) {
    const base = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
    if (schema.type === 'boolean') {
      return (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={!!config[key]}
            onChange={e => setConfig(c => ({ ...c, [key]: e.target.checked }))}
            className="rounded"
          />
          <span className="text-sm text-gray-600">Enable</span>
        </label>
      );
    }
    if (schema.type === 'select' && Array.isArray(schema.options)) {
      return (
        <select
          value={config[key] || ''}
          onChange={e => setConfig(c => ({ ...c, [key]: e.target.value }))}
          className={base}
        >
          {schema.options.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    }
    return (
      <input
        type={schema.type === 'password' ? 'password' : schema.type === 'number' ? 'number' : 'text'}
        value={config[key] || ''}
        onChange={e => setConfig(c => ({ ...c, [key]: e.target.value }))}
        placeholder={schema.placeholder || ''}
        className={`${base} font-mono`}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 text-sm">Connect {connector.displayName}</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600"><XIcon size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {Object.entries(connector.configSchema || {}).map(([key, schema]) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-700 mb-1">{schema.label || key}</label>
              {renderField(key, schema)}
              {schema.help && (
                <p className="mt-1 text-xs text-gray-400">{schema.help}</p>
              )}
            </div>
          ))}

          {error && <div className="text-xs text-red-600 bg-red-50 rounded-lg p-3">{error}</div>}
          {success && (
            <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 rounded-lg p-3">
              <CheckCircleIcon size={14} />Connected successfully!
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onCancel}
              className="flex-1 py-2 px-4 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              {loading ? <><Loader2Icon size={14} className="animate-spin" />Connecting...</> : 'Connect'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
