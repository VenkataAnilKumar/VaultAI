import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ChevronDownIcon, ChevronRightIcon, WrenchIcon } from 'lucide-react';

export default function MessageBubble({ message }) {
  const [showTools, setShowTools] = useState(false);
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-lg bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs flex-shrink-0 mt-0.5">
        AI
      </div>
      <div className="flex-1 min-w-0">
        <div className={`msg-bubble rounded-2xl rounded-tl-sm px-4 py-3 text-sm ${message.isError ? 'msg-bubble-error' : ''}`}>
          <div className="msg-bubble-content prose prose-sm max-w-none">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-1 ml-1">
          {message.model && (
            <span className="msg-model-badge">
              {message.model}
            </span>
          )}

          {message.toolsUsed && message.toolsUsed.length > 0 && (
            <button
              onClick={() => setShowTools(v => !v)}
              className="msg-tools-btn flex items-center gap-1"
            >
              <WrenchIcon size={11} />
              {message.toolsUsed.length} tool{message.toolsUsed.length > 1 ? 's' : ''}
              {showTools ? <ChevronDownIcon size={11} /> : <ChevronRightIcon size={11} />}
            </button>
          )}
        </div>

        {showTools && message.toolsUsed && (
          <div className="mt-1 ml-1 flex flex-wrap gap-1">
            {message.toolsUsed.map(tool => (
              <span key={tool} className="msg-tool-chip font-mono">
                {tool}
              </span>
            ))}
          </div>
        )}

        {message.timestamp && (
          <span className="msg-timestamp ml-1 mt-1 block">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
    </div>
  );
}
