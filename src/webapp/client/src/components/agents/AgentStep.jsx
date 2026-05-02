import React, { useState } from 'react';
import { CheckCircleIcon, XCircleIcon, Loader2Icon, ClockIcon, ChevronDownIcon, ChevronRightIcon, WrenchIcon } from 'lucide-react';

const AGENT_COLORS = {
  file: 'text-yellow-600 bg-yellow-50',
  document: 'text-blue-600 bg-blue-50',
  search: 'text-purple-600 bg-purple-50',
  generation: 'text-green-600 bg-green-50',
  connector: 'text-orange-600 bg-orange-50',
  orchestrator: 'text-gray-600 bg-gray-50'
};

export default function AgentStep({ agentType, status, result, model, toolsUsed = [], duration }) {
  const [expanded, setExpanded] = useState(false);
  const colorClass = AGENT_COLORS[agentType] || 'text-gray-600 bg-gray-50';

  const icon = {
    waiting: <ClockIcon size={14} className="text-gray-400" />,
    running: <Loader2Icon size={14} className="text-blue-500 animate-spin" />,
    done: <CheckCircleIcon size={14} className="text-green-500" />,
    error: <XCircleIcon size={14} className="text-red-500" />
  }[status] || <ClockIcon size={14} className="text-gray-400" />;

  return (
    <div className="border border-gray-100 rounded-lg overflow-hidden">
      <button
        onClick={() => result && setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2 bg-white hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className={`text-xs font-medium px-2 py-0.5 rounded ${colorClass}`}>
            {agentType.charAt(0).toUpperCase() + agentType.slice(1)}
          </span>
          {toolsUsed.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <WrenchIcon size={10} />
              {toolsUsed.join(', ')}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {model && <span className="text-xs text-gray-300 font-mono hidden sm:block">{model.split(':')[0]}</span>}
          {duration && <span className="text-xs text-gray-400">{(duration / 1000).toFixed(1)}s</span>}
          {result && (expanded ? <ChevronDownIcon size={12} className="text-gray-400" /> : <ChevronRightIcon size={12} className="text-gray-400" />)}
        </div>
      </button>
      {expanded && result && (
        <div className="px-3 py-2 bg-gray-50 border-t border-gray-100 text-xs text-gray-600 font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
          {result}
        </div>
      )}
    </div>
  );
}
