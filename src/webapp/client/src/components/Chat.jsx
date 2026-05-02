import React, { useEffect, useRef, useState } from 'react';
import { SendIcon, AlertCircleIcon, RefreshCwIcon, MicIcon, MicOffIcon, PlayIcon, ZapIcon } from 'lucide-react';
import useStore from '../store/useStore.js';
import { sendChat, checkOllamaStatus, getModels } from '../api/client.js';
import MessageBubble from './MessageBubble.jsx';
import ConfirmDialog from './ConfirmDialog.jsx';
import WorkflowToggle from './agents/WorkflowToggle.jsx';
import AgentWorkflowPanel from './agents/AgentWorkflowPanel.jsx';
import MCPToolBadge from './mcp/MCPToolBadge.jsx';

export default function Chat() {
  const {
    messages, addMessage, workingDirectory, ollamaConnected, setOllamaConnected,
    isLoading, setLoading, pendingAction, setPendingAction, workflowMode, externalMCPTools,
    demoMode, setDemoMode, setModels
  } = useStore();

  const [input, setInput]         = useState('');
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Voice input (Phase 5)
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      setVoiceSupported(true);
      const rec = new SR();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = 'en-US';
      rec.onresult = (e) => {
        const t = Array.from(e.results).map(r => r[0].transcript).join('');
        setInput(t);
        if (e.results[e.results.length - 1].isFinal) setListening(false);
      };
      rec.onerror = () => setListening(false);
      rec.onend   = () => setListening(false);
      recognitionRef.current = rec;
    }
  }, []);

  function toggleVoice() {
    if (!recognitionRef.current) return;
    if (listening) { recognitionRef.current.stop(); setListening(false); }
    else { setInput(''); recognitionRef.current.start(); setListening(true); }
  }

  async function activateDemoMode() {
    setDemoMode(true);
    // Simulate Ollama connected + models in demo mode
    setOllamaConnected(true);
    setModels([{ name: 'llama3.2 (demo)', size: '2.0GB' }, { name: 'nomic-embed-text (demo)', size: '274MB' }]);
  }

  async function handleRetryConnection() {
    try {
      const status = await checkOllamaStatus();
      setOllamaConnected(status.connected);
      if (status.connected) {
        const data = await getModels();
        setModels(data.models || []);
      }
    } catch { setOllamaConnected(false); }
  }

  async function handleSend() {
    if (!input.trim() || isLoading) return;
    if (listening) { recognitionRef.current?.stop(); setListening(false); }
    const userMessage = input.trim();
    setInput('');
    if (inputRef.current) inputRef.current.style.height = '40px';

    addMessage({ role: 'user', content: userMessage });
    setLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const data = await sendChat({ message: userMessage, history, workingDirectory, workflowMode });

      if (data.requiresConfirmation) {
        setPendingAction(data.pendingAction);
        addMessage({ role: 'assistant', content: data.message, model: data.model });
      } else if (data.workflow) {
        addMessage({ role: 'assistant', content: data.response, model: data.workflow.steps?.[data.workflow.steps.length - 1]?.model, workflow: data.workflow });
      } else {
        addMessage({ role: 'assistant', content: data.response || data.error || 'No response', model: data.model, toolsUsed: data.toolsUsed });
      }
    } catch (err) {
      addMessage({ role: 'assistant', content: `Error: ${err.response?.data?.error || err.message}`, isError: true });
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  const showWelcome = !ollamaConnected && !demoMode && messages.length === 0;

  const SUGGESTIONS = [
    'List all files in my home folder',
    'Find all PDF files and summarize them',
    'Scan my documents for sensitive data',
    'Create a folder called Projects'
  ];

  const DEMO_SUGGESTIONS = [
    'List all files in my home folder',
    'Find all PDF files',
    'Scan my documents for privacy risks',
    'Summarize my documents'
  ];

  return (
    <div className="flex flex-col h-full">

      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-gray-50/50">
        <WorkflowToggle />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {demoMode && (
            <button
              onClick={() => { setDemoMode(false); setOllamaConnected(false); setModels([]); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                fontSize: 11, fontWeight: 600, padding: '3px 10px',
                borderRadius: 20, border: '1px solid #fbbf24',
                background: '#fef3c7', color: '#92400e', cursor: 'pointer'
              }}
            >
              <ZapIcon size={11} /> DEMO MODE · Exit
            </button>
          )}
          {voiceSupported && (
            <button onClick={toggleVoice} title={listening ? 'Stop' : 'Voice input'}
              style={{
                display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 500,
                padding: '3px 10px', borderRadius: 20, border: 'none', cursor: 'pointer',
                background: listening ? '#fee2e2' : '#f3f4f6',
                color: listening ? '#dc2626' : '#6b7280'
              }}>
              {listening ? <MicOffIcon size={12} /> : <MicIcon size={12} />}
              {listening ? 'Listening…' : 'Voice'}
            </button>
          )}
          <MCPToolBadge tools={externalMCPTools} />
        </div>
      </div>

      {/* Ollama offline banner (only when NOT in demo mode) */}
      {!ollamaConnected && !demoMode && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-700 text-sm">
            <AlertCircleIcon size={15} />
            <span>Ollama not running — start Ollama or <button onClick={activateDemoMode} style={{ fontWeight: 700, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', color: '#b45309' }}>try Demo Mode</button></span>
          </div>
          <button onClick={handleRetryConnection} className="flex items-center gap-1 text-xs text-amber-700 hover:text-amber-900 font-medium">
            <RefreshCwIcon size={12} />Retry
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* ── Welcome screen (Ollama offline) ── */}
        {showWelcome && (
          <div className="flex items-center justify-center h-full">
            <div className="max-w-lg text-center">
              <div className="text-5xl mb-4">🔒</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Vault AI</h2>
              <p className="text-gray-500 text-sm mb-8">Privacy-first AI for your files. Everything runs locally — no cloud, no tracking.</p>

              {/* Demo Mode CTA — prominent */}
              <div style={{ background: 'linear-gradient(135deg, #EEF2FF, #F5F3FF)', border: '2px solid #C7D2FE', borderRadius: 16, padding: '24px', marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#4338ca', marginBottom: 6 }}>Try the full product instantly</div>
                <div style={{ fontSize: 12, color: '#6366f1', marginBottom: 16 }}>No setup needed — explore every feature with realistic demo data</div>
                <button
                  onClick={activateDemoMode}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, margin: '0 auto',
                    padding: '10px 28px', borderRadius: 12, border: 'none',
                    background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                    color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(79,70,229,0.35)'
                  }}
                >
                  <PlayIcon size={16} /> Launch Demo Mode
                </button>
              </div>

              {/* Ollama setup (secondary) */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-left text-sm">
                <p className="font-semibold text-gray-700 mb-2 text-xs uppercase tracking-wide">Run with real AI (Ollama)</p>
                <ol className="list-decimal list-inside space-y-1 text-xs text-gray-500">
                  <li>Install from <span className="font-mono text-gray-700">ollama.com</span></li>
                  <li><span className="font-mono bg-gray-100 px-1 rounded">ollama serve</span></li>
                  <li><span className="font-mono bg-gray-100 px-1 rounded">ollama pull llama3.2</span></li>
                  <li><span className="font-mono bg-gray-100 px-1 rounded">ollama pull nomic-embed-text</span></li>
                </ol>
                <button onClick={handleRetryConnection} className="mt-3 w-full py-2 px-4 bg-white border border-gray-200 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors">
                  Retry Connection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Empty state (connected) ── */}
        {!showWelcome && messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-sm">
              <div className="text-3xl mb-3">🔒</div>
              <h2 className="text-base font-semibold text-gray-800 mb-1">Vault AI {demoMode && <span style={{ fontSize: 11, background: '#fef3c7', color: '#92400e', padding: '1px 7px', borderRadius: 8, fontWeight: 600, marginLeft: 4 }}>DEMO</span>}</h2>
              <p className="text-xs text-gray-400 mb-5">
                {demoMode ? 'Demo mode active — all features work with sample data.' : 'Ask about your files, or give instructions. All local.'}
              </p>
              <div className="grid grid-cols-1 gap-1.5 text-left">
                {(demoMode ? DEMO_SUGGESTIONS : SUGGESTIONS).map(s => (
                  <button key={s} onClick={() => setInput(s)}
                    className="px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-xs text-gray-600 text-left transition-colors border border-gray-100">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Messages ── */}
        {messages.map(msg => (
          <div key={msg.id}>
            {msg.workflow && <AgentWorkflowPanel workflow={msg.workflow} isRunning={false} />}
            <MessageBubble message={msg} />
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs flex-shrink-0">AI</div>
            <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
              <div className="flex gap-1">
                {[0, 150, 300].map(d => (
                  <span key={d} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {pendingAction && <ConfirmDialog />}

      {/* Input bar */}
      <div className="border-t border-gray-200 p-3 bg-white">
        {listening && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, color: '#dc2626', fontSize: 11 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#dc2626', animation: 'pulse 1s infinite' }} />
            Listening — speak now
          </div>
        )}
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              listening ? 'Listening...' :
              demoMode ? 'Try demo: "List files", "Scan for PII", "Summarize documents"...' :
              ollamaConnected ? 'Ask about your files...' : 'Launch Demo Mode or start Ollama'
            }
            disabled={isLoading || (!ollamaConnected && !demoMode)}
            rows={1}
            className="flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400 overflow-y-auto"
            style={{ minHeight: '40px', maxHeight: '128px', outline: listening ? '2px solid #dc2626' : undefined }}
            onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px'; }}
          />
          {voiceSupported && (
            <button onClick={toggleVoice} title={listening ? 'Stop' : 'Voice input'}
              style={{ padding: 8, borderRadius: 12, border: 'none', cursor: 'pointer', flexShrink: 0, background: listening ? '#fee2e2' : '#f3f4f6', color: listening ? '#dc2626' : '#6b7280' }}>
              {listening ? <MicOffIcon size={18} /> : <MicIcon size={18} />}
            </button>
          )}
          <button onClick={handleSend} disabled={!input.trim() || isLoading || (!ollamaConnected && !demoMode)}
            className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0">
            <SendIcon size={18} />
          </button>
        </div>
        {demoMode && (
          <div style={{ fontSize: 10, color: '#9ca3af', textAlign: 'center', marginTop: 5 }}>
            Demo mode · AI responses simulated · <button onClick={() => window.open('https://ollama.com', '_blank')} style={{ color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', fontSize: 10 }}>Install Ollama for real AI</button>
          </div>
        )}
      </div>
    </div>
  );
}
