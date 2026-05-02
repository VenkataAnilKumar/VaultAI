import React from 'react';
import { LockIcon, FolderIcon, CpuIcon } from 'lucide-react';
import useStore from '../store/useStore.js';

export default function StatusBar() {
  const { ollamaConnected, workingDirectory, availableModels } = useStore();

  return (
    <div className="flex items-center gap-4 px-4 py-1.5 border-t border-gray-100 bg-gray-50 text-xs text-gray-400">
      <div className="flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${ollamaConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        <CpuIcon size={11} />
        <span>{ollamaConnected ? `${availableModels.length} model${availableModels.length !== 1 ? 's' : ''} active` : 'Ollama offline'}</span>
      </div>

      {workingDirectory && (
        <div className="flex items-center gap-1 min-w-0 flex-1">
          <FolderIcon size={11} />
          <span className="truncate">{workingDirectory}</span>
        </div>
      )}

      <div className="flex items-center gap-1 ml-auto flex-shrink-0">
        <LockIcon size={11} className="text-blue-500" />
        <span className="text-blue-500">Local only</span>
      </div>
    </div>
  );
}
