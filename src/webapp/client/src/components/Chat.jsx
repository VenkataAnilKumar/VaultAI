import React, { useEffect, useRef, useState } from 'react';
import { SendIcon, AlertCircleIcon, RefreshCwIcon } from 'lucide-react';
import useStore from '../store/useStore.js';
import { sendChat, checkOllamaStatus } from '../api/client.js';
import MessageBubble from './MessageBubble.jsx';
import ConfirmDialog from './ConfirmDialog.jsx';

export default function Chat() {
  const {
    messages, addMessage, workingDirectory, ollamaConnected, setOllamaConnected,
    isLoading, setLoading, pendingAction, setPendingAction
  } = useStore();

  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleRetryConnection() {
    try {
      const status = await checkOllamaStatus();
      setOllamaConnected(status.connected);
    } catch {
      setOllamaConnected(false);
    }
  }

  async function handleSend() {
    if (!input.trim() || isLoading) return;
    const userMessage = input.trim();
    setInput('');

    addMessage({ role: 'user', content: userMessage });
    setLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const data = await sendChat({ message: userMessage, history, workingDirectory });

      if (data.requiresConfirmation) {
        setPendingAction(data.pendingAction);
        addMessage({
          role: 'assistant',
          content: data.message,
          model: data.model
        });
      } else {
        addMessage({
          role: 'assistant',
          content: data.response,
          model: data.model,
          toolsUsed: data.toolsUsed
        });
      }
    } catch (err) {
      addMessage({
        role: 'assistant',
        content: `Error: ${err.response?.data?.error || err.message}`,
        isError: true
      });
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const showWelcome = !ollamaConnected && messages.length === 0;

  return (
    <div className="flex flex-col h-full">
      {!ollamaConnected && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-700 text-sm">
            <AlertCircleIcon size={15} />
            <span>Ollama is not running — start Ollama to use AI features</span>
          </div>
          <button onClick={handleRetryConnection} className="flex items-center gap-1 text-xs text-amber-700 hover:text-amber-900 font-medium">
            <RefreshCwIcon size={12} />
            Retry
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {showWelcome ? (
          <div className="flex items-center justify-center h-full">
            <div className="max-w-md text-center bg-gray-50 border border-gray-200 rounded-2xl p-8 shadow-sm">
              <div className="text-4xl mb-4">🔒</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Welcome to Vault AI</h2>
              <p className="text-gray-500 text-sm mb-6">Your files. Your AI. Your privacy.</p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left text-sm text-amber-800 mb-4">
                <p className="font-medium mb-2">⚠ Ollama is not running</p>
                <p className="mb-2">To use Vault AI, start Ollama:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Install Ollama from <span className="font-mono">ollama.com</span></li>
                  <li>Run: <span className="font-mono bg-amber-100 px-1 rounded">ollama serve</span></li>
                  <li>Pull a model: <span className="font-mono bg-amber-100 px-1 rounded">ollama pull llama3.2</span></li>
                  <li>For search: <span className="font-mono bg-amber-100 px-1 rounded">ollama pull nomic-embed-text</span></li>
                </ol>
              </div>
              <button onClick={handleRetryConnection} className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                Retry Connection
              </button>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-sm">
              <div className="text-4xl mb-4">🔒</div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Vault AI</h2>
              <p className="text-sm text-gray-500 mb-4">Ask me anything about your files, or ask me to manage them.</p>
              <div className="grid grid-cols-1 gap-2 text-xs text-left">
                {[
                  'List all PDFs in my Documents folder',
                  'Summarize the report in my Downloads',
                  'Find all files modified this week',
                  'Draft a meeting summary from my notes'
                ].map(suggestion => (
                  <button
                    key={suggestion}
                    onClick={() => setInput(suggestion)}
                    className="px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-600 text-left transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map(msg => <MessageBubble key={msg.id} message={msg} />)
        )}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs flex-shrink-0">AI</div>
            <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {pendingAction && <ConfirmDialog />}

      <div className="border-t border-gray-200 p-3 bg-white">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={ollamaConnected ? 'Ask about your files, or give instructions...' : 'Start Ollama to use AI chat'}
            disabled={isLoading || !ollamaConnected}
            rows={1}
            className="flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400 max-h-32 overflow-y-auto"
            style={{ minHeight: '40px' }}
            onInput={e => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading || !ollamaConnected}
            className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            <SendIcon size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
