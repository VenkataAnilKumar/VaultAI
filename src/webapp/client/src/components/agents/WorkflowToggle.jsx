import React from 'react';
import { BotIcon, ZapIcon } from 'lucide-react';
import useStore from '../../store/useStore.js';

export default function WorkflowToggle() {
  const { workflowMode, setWorkflowMode } = useStore();

  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5" title="Multi-Agent: Vault AI uses multiple specialized models for complex tasks">
      <button
        onClick={() => setWorkflowMode('simple')}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${workflowMode === 'simple' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
      >
        <ZapIcon size={12} />
        Simple
      </button>
      <button
        onClick={() => setWorkflowMode('multi-agent')}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${workflowMode === 'multi-agent' ? 'bg-white shadow-sm text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
      >
        <BotIcon size={12} />
        Multi-Agent
      </button>
    </div>
  );
}
