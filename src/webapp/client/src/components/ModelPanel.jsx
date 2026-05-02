import React, { useState } from 'react';
import { CpuIcon, ChevronDownIcon } from 'lucide-react';
import useStore from '../store/useStore.js';

const ROLE_LABELS = {
  file_op: 'File Ops',
  doc_qa: 'Document',
  generate: 'Generation',
  transform: 'Transform',
  synthesize: 'Synthesize',
  extract: 'Extract',
  embedding: 'Embedding',
  vision: 'Vision',
  code: 'Code'
};

const ROLE_COLORS = {
  file_op: 'bg-yellow-100 text-yellow-700',
  doc_qa: 'bg-blue-100 text-blue-700',
  generate: 'bg-green-100 text-green-700',
  transform: 'bg-purple-100 text-purple-700',
  synthesize: 'bg-pink-100 text-pink-700',
  extract: 'bg-orange-100 text-orange-700',
  embedding: 'bg-cyan-100 text-cyan-700',
  vision: 'bg-indigo-100 text-indigo-700',
  code: 'bg-gray-100 text-gray-700'
};

export default function ModelPanel() {
  const { availableModels, ollamaConnected } = useStore();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm transition-colors"
      >
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${ollamaConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        <CpuIcon size={14} className="text-gray-500" />
        <span className="text-gray-700 text-xs">
          {ollamaConnected ? `${availableModels.length} model${availableModels.length !== 1 ? 's' : ''}` : 'Disconnected'}
        </span>
        <ChevronDownIcon size={12} className="text-gray-400" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
            <div className="px-3 py-2 border-b border-gray-100 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${ollamaConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-xs font-medium text-gray-700">
                {ollamaConnected ? 'Ollama Connected' : 'Ollama Disconnected'}
              </span>
              <span className="text-xs text-gray-400 ml-auto">localhost:11434</span>
            </div>

            {availableModels.length === 0 ? (
              <div className="px-3 py-4 text-xs text-gray-400 text-center">
                {ollamaConnected ? 'No models found. Pull a model with: ollama pull llama3.2' : 'Start Ollama to see available models'}
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto">
                {availableModels.map(model => (
                  <div key={model.name} className="px-3 py-2.5 hover:bg-gray-50 border-b border-gray-50 last:border-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-800 truncate">{model.name}</span>
                      <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded flex-shrink-0">available</span>
                    </div>
                    {model.roles && model.roles.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {model.roles.map(role => (
                          <span key={role} className={`text-xs px-1.5 py-0.5 rounded ${ROLE_COLORS[role] || 'bg-gray-100 text-gray-600'}`}>
                            {ROLE_LABELS[role] || role}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
