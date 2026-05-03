import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  SendIcon, AlertCircleIcon, RefreshCwIcon, MicIcon, MicOffIcon,
  PlayIcon, ZapIcon, CopyIcon, CheckIcon, ExternalLinkIcon, WrenchIcon, XIcon
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import useStore from '../store/useStore.js';
import { sendChat, sendChatStream, checkOllamaStatus, getModels } from '../api/client.js';
import ConfirmDialog from './ConfirmDialog.jsx';
import WorkflowToggle from './agents/WorkflowToggle.jsx';
import AgentWorkflowPanel from './agents/AgentWorkflowPanel.jsx';
import MCPToolBadge from './mcp/MCPToolBadge.jsx';

// ── Copy-able terminal command ──────────────────────────────────
function CmdLine({ cmd }) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef(null);
  function copy() {
    navigator.clipboard.writeText(cmd).then(() => {
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 1800);
    });
  }
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);
  return (
    <div className="cmdline-block">
      <span style={{ flex: 1 }}>{cmd}</span>
      <button onClick={copy} title="Copy" className="cmdline-copy-btn">
        {copied ? <><CheckIcon size={12} /> copied</> : <CopyIcon size={12} />}
      </button>
    </div>
  );
}

// ── Ollama Setup Guide ──────────────────────────────────────────
function OllamaSetupGuide({ onRetry }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="ollama-guide">
      <button onClick={() => setOpen(v => !v)} className="ollama-guide-header">
        <span>⚙️ Want to use your own files with real AI?</span>
        <span className="ollama-guide-chevron" style={{ transform: open ? 'rotate(180deg)' : 'none' }}>›</span>
      </button>
      {open && (
        <div className="ollama-guide-body">
          <p className="ollama-guide-desc">
            Vault AI runs AI entirely on your machine using <strong>Ollama</strong> — free, open-source, and private.
          </p>
          <div className="ollama-guide-step">
            <div className="ollama-guide-step-title">Step 1 — Install Ollama</div>
            <a href="https://ollama.com/download" target="_blank" rel="noopener noreferrer" className="ollama-guide-link">
              <ExternalLinkIcon size={11} /> Download Ollama →
            </a>
          </div>
          <div className="ollama-guide-step">
            <div className="ollama-guide-step-title">Step 2 — Start &amp; pull models</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 6 }}>
              <CmdLine cmd="ollama serve" />
              <CmdLine cmd="ollama pull llama3.2" />
              <CmdLine cmd="ollama pull nomic-embed-text" />
            </div>
          </div>
          <div className="ollama-guide-step">
            <div className="ollama-guide-step-title">Step 3 — Reconnect</div>
            <button onClick={onRetry} className="ollama-guide-retry-btn">
              <RefreshCwIcon size={13} /> Check connection
            </button>
          </div>
          <div className="ollama-guide-tip">
            💡 Use Demo Mode right now to explore every feature — no download needed.
          </div>
        </div>
      )}
    </div>
  );
}

// ── Live streaming message bubble ──────────────────────────────
function StreamingBubble({ content, toolsRunning }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs flex-shrink-0 mt-0.5">AI</div>
      <div className="flex-1 min-w-0">
        {toolsRunning.length > 0 && (
          <div className="stream-tool-row">
            {toolsRunning.map(t => (
              <span key={t} className="stream-tool-chip">
                <WrenchIcon size={10} className="stream-tool-spin" />
                {t.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        )}
        {content ? (
          <div className="msg-bubble rounded-2xl rounded-tl-sm px-4 py-3 text-sm">
            <div className="msg-bubble-content prose prose-sm max-w-none">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
            <span className="stream-cursor" />
          </div>
        ) : (
          <div className="chat-typing-bubble rounded-2xl px-4 py-3">
            <div className="flex gap-1">
              {[0, 150, 300].map(d => (
                <span key={d} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── MessageBubble (imported inline to avoid circular dep on streaming state) ──
function MessageBubble({ message }) {
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
      <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs flex-shrink-0 mt-0.5">AI</div>
      <div className="flex-1 min-w-0">
        <div className={`msg-bubble rounded-2xl rounded-tl-sm px-4 py-3 text-sm ${message.isError ? 'msg-bubble-error' : ''}`}>
          <div className="msg-bubble-content prose prose-sm max-w-none">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-1 ml-1">
          {message.model && <span className="msg-model-badge">{message.model}</span>}
          {message.toolsUsed?.length > 0 && (
            <button onClick={() => setShowTools(v => !v)} className="msg-tools-btn flex items-center gap-1">
              <WrenchIcon size={11} />
              {message.toolsUsed.length} tool{message.toolsUsed.length > 1 ? 's' : ''}
            </button>
          )}
        </div>
        {showTools && message.toolsUsed && (
          <div className="mt-1 ml-1 flex flex-wrap gap-1">
            {message.toolsUsed.map(tool => (
              <span key={tool} className="msg-tool-chip font-mono">{tool}</span>
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

// ── Main Chat component ─────────────────────────────────────────
export default function Chat() {
  const {
    messages, addMessage, workingDirectory, ollamaConnected, setOllamaConnected,
    isLoading, setLoading, pendingAction, setPendingAction, workflowMode, externalMCPTools,
    demoMode, setDemoMode, setModels, setActiveTab
  } = useStore();

  const [input, setInput]           = useState('');
  const [listening, setListening]   = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);

  // Streaming state
  const [streamContent, setStreamContent] = useState('');
  const [streamTools, setStreamTools]     = useState([]);   // tool names currently running
  const [isStreaming, setIsStreaming]      = useState(false);
  const abortStreamRef = useRef(null);

  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);
  const recognitionRef = useRef(null);

  // Auto-scroll on new content
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamContent]);

  // Voice input
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    setVoiceSupported(true);
    const rec = new SR();
    rec.continuous = false; rec.interimResults = true; rec.lang = 'en-US';
    rec.onresult = (e) => {
      const t = Array.from(e.results).map(r => r[0].transcript).join('');
      setInput(t);
      if (e.results[e.results.length - 1].isFinal) setListening(false);
    };
    rec.onerror = () => setListening(false);
    rec.onend   = () => setListening(false);
    recognitionRef.current = rec;
    return () => {
      try { rec.abort(); } catch {}
      rec.onresult = rec.onerror = rec.onend = null;
      recognitionRef.current = null;
    };
  }, []);

  function toggleVoice() {
    if (!recognitionRef.current) return;
    if (listening) { recognitionRef.current.stop(); setListening(false); }
    else { setInput(''); recognitionRef.current.start(); setListening(true); }
  }

  async function activateDemoMode() {
    setDemoMode(true); setOllamaConnected(true);
    setModels([{ name: 'llama3.2 (demo)', size: '2.0GB' }, { name: 'nomic-embed-text (demo)', size: '274MB' }]);
  }

  async function handleRetryConnection() {
    try {
      const status = await checkOllamaStatus();
      setOllamaConnected(status.connected);
      if (status.connected) { const data = await getModels(); setModels(data.models || []); }
    } catch { setOllamaConnected(false); }
  }

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading || isStreaming) return;
    if (listening) { recognitionRef.current?.stop(); setListening(false); }

    const userMessage = input.trim();
    setInput('');
    if (inputRef.current) inputRef.current.style.height = '40px';
    addMessage({ role: 'user', content: userMessage });

    const history = messages.map(m => ({ role: m.role, content: m.content }));

    // Multi-agent workflow uses the non-streaming route (orchestrator needs full response)
    if (workflowMode === 'multi-agent') {
      setLoading(true);
      try {
        const data = await sendChat({ message: userMessage, history, workingDirectory, workflowMode });
        if (data.requiresConfirmation) {
          setPendingAction(data.pendingAction);
          addMessage({ role: 'assistant', content: data.message, model: data.model });
        } else if (data.workflow) {
          addMessage({ role: 'assistant', content: data.response, model: data.workflow.steps?.at(-1)?.model, workflow: data.workflow });
        } else {
          addMessage({ role: 'assistant', content: data.response || data.error || 'No response', model: data.model, toolsUsed: data.toolsUsed });
        }
      } catch (err) {
        addMessage({ role: 'assistant', content: `Error: ${err.response?.data?.error || err.message}`, isError: true });
      } finally { setLoading(false); }
      return;
    }

    // Streaming path
    setIsStreaming(true);
    setStreamContent('');
    setStreamTools([]);
    let accumulated = '';
    let finalToolsUsed = [];
    let finalModel = '';

    abortStreamRef.current = sendChatStream(
      { message: userMessage, history, workingDirectory },
      {
        onToken: (token) => {
          accumulated += token;
          setStreamContent(accumulated);
        },
        onTool: (event) => {
          if (event.status === 'running') {
            setStreamTools(prev => [...new Set([...prev, event.name])]);
          } else if (event.status === 'done') {
            finalToolsUsed.push(event.name);
          }
        },
        onDone: (event) => {
          if (event.isConfirmation) {
            // Destructive action needs confirmation
            setPendingAction(event.pendingAction);
            if (accumulated) {
              addMessage({ role: 'assistant', content: accumulated, model: event.model });
            } else {
              addMessage({ role: 'assistant', content: event.message || 'Please confirm this action.', model: event.model });
            }
          } else {
            finalToolsUsed = event.toolsUsed || finalToolsUsed;
            finalModel     = event.model || finalModel;
            addMessage({
              role: 'assistant',
              content: accumulated || 'No response',
              model: finalModel,
              toolsUsed: finalToolsUsed.length > 0 ? finalToolsUsed : undefined,
            });
          }
          setStreamContent('');
          setStreamTools([]);
          setIsStreaming(false);
          abortStreamRef.current = null;
        },
        onError: (err) => {
          addMessage({ role: 'assistant', content: `Error: ${err.message}`, isError: true });
          setStreamContent('');
          setStreamTools([]);
          setIsStreaming(false);
          abortStreamRef.current = null;
        },
      }
    );
  }, [input, isLoading, isStreaming, listening, messages, workingDirectory, workflowMode,
      addMessage, setLoading, setPendingAction, setOllamaConnected, setDemoMode, setModels]);

  // Abort in-flight stream on unmount
  useEffect(() => () => { abortStreamRef.current?.(); }, []);

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  const isDisabled  = isLoading || isStreaming || (!ollamaConnected && !demoMode);
  const showWelcome = !ollamaConnected && !demoMode && messages.length === 0;

  const SUGGESTIONS = [
    'List all files in my home folder', 'Find all PDF files and summarize them',
    'Scan my documents for sensitive data', 'Create a folder called Projects'
  ];
  const DEMO_SUGGESTIONS = [
    'List all files in my home folder', 'Find all PDF files',
    'Scan my documents for privacy risks', 'Summarize my documents'
  ];

  return (
    <div className="flex flex-col h-full">

      {/* Toolbar */}
      <div className="chat-toolbar flex items-center justify-between px-4 py-2 border-b">
        <WorkflowToggle />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {demoMode && (
            <button onClick={() => { setDemoMode(false); setOllamaConnected(false); setModels([]); }} className="demo-exit-btn">
              <ZapIcon size={11} /> DEMO MODE · Exit
            </button>
          )}
          {voiceSupported && (
            <button onClick={toggleVoice} title={listening ? 'Stop' : 'Voice input'}
              className={`voice-btn ${listening ? 'voice-btn-active' : ''}`}>
              {listening ? <MicOffIcon size={12} /> : <MicIcon size={12} />}
              {listening ? 'Listening…' : 'Voice'}
            </button>
          )}
          {isStreaming && (
            <button onClick={() => { abortStreamRef.current?.(); setStreamContent(''); setStreamTools([]); setIsStreaming(false); }}
              className="voice-btn" title="Stop generation">
              <XIcon size={12} /> Stop
            </button>
          )}
          <MCPToolBadge tools={externalMCPTools} />
        </div>
      </div>

      {/* Ollama offline banner */}
      {!ollamaConnected && !demoMode && (
        <div className="ollama-offline-banner">
          <div className="ollama-offline-inner">
            <AlertCircleIcon size={15} />
            <span>Ollama not running — start Ollama or <button onClick={activateDemoMode} className="ollama-offline-demo-link">try Demo Mode</button></span>
          </div>
          <button onClick={handleRetryConnection} className="ollama-offline-retry"><RefreshCwIcon size={12} />Retry</button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-3">

        {/* Welcome screen */}
        {showWelcome && (
          <div className="flex items-center justify-center h-full">
            <div className="max-w-lg text-center">
              <div className="text-5xl mb-4">🔒</div>
              <h2 className="welcome-title">Vault AI</h2>
              <p className="welcome-subtitle">Privacy-first AI for your files. Everything runs locally — no cloud, no tracking.</p>
              <div className="demo-cta-card">
                <div className="demo-cta-heading">Try the full product instantly</div>
                <div className="demo-cta-sub">No setup needed — explore every feature with realistic demo data</div>
                <button onClick={activateDemoMode} className="demo-cta-btn"><PlayIcon size={16} /> Launch Demo Mode</button>
              </div>
              <OllamaSetupGuide onRetry={handleRetryConnection} />
            </div>
          </div>
        )}

        {/* Empty state home */}
        {!showWelcome && messages.length === 0 && !isStreaming && (
          <div style={{ padding: '24px 20px', overflowY: 'auto', height: '100%' }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🔒</div>
              <h2 className="welcome-home-title">
                Welcome to Vault AI
                {demoMode && <span className="demo-badge">⚡ DEMO</span>}
              </h2>
              <p className="welcome-home-sub">
                {demoMode ? 'All features are live with sample data — explore everything below.' : 'Your privacy-first AI file platform. All local.'}
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              {[
                { tab: 'documents', emoji: '📄', title: 'Document Agent',   desc: 'Summarize NDA, extract key points, detect PII',  color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
                { tab: 'research',  emoji: '🌐', title: 'Research Panel',   desc: 'Web search + local docs, privately',             color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
                { tab: 'generate',  emoji: '✨', title: 'Doc Generator',    desc: 'Create memos, reports, contracts from scratch',  color: '#059669', bg: '#f0fdf4', border: '#bbf7d0' },
                { tab: 'connectors',emoji: '🔌', title: 'Local Connectors', desc: 'Obsidian, SQLite, Git, email, bookmarks',        color: '#ea580c', bg: '#fff7ed', border: '#fed7aa' },
              ].map(({ tab, emoji, title, desc, color, bg, border }) => (
                <button key={tab} onClick={() => setActiveTab(tab)} className="feature-card"
                  style={{ '--card-bg': bg, '--card-border': border, '--card-glow': color + '22' }}>
                  <div style={{ fontSize: 20, marginBottom: 5 }}>{emoji}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 3 }}>{title}</div>
                  <div className="feature-card-desc">{desc}</div>
                </button>
              ))}
            </div>
            <div style={{ marginBottom: 8 }}>
              <div className="suggestions-label">Or try in chat →</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {(demoMode ? DEMO_SUGGESTIONS : SUGGESTIONS).map(s => (
                  <button key={s} onClick={() => setInput(s)} className="suggestion-chip">{s}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map(msg => (
          <div key={msg.id}>
            {msg.workflow && <AgentWorkflowPanel workflow={msg.workflow} isRunning={false} />}
            <MessageBubble message={msg} />
          </div>
        ))}

        {/* Live streaming bubble */}
        {isStreaming && <StreamingBubble content={streamContent} toolsRunning={streamTools} />}

        <div ref={messagesEndRef} />
      </div>

      {pendingAction && <ConfirmDialog />}

      {/* Input bar */}
      <div className="chat-input-bar border-t p-3">
        {listening && (
          <div className="listening-indicator"><span className="listening-dot" />Listening — speak now</div>
        )}
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              listening      ? 'Listening...' :
              isStreaming    ? 'Generating…'  :
              demoMode       ? 'Try demo: "List files", "Scan for PII", "Summarize documents"...' :
              ollamaConnected ? 'Ask about your files...' : 'Launch Demo Mode or start Ollama'
            }
            disabled={isDisabled}
            rows={1}
            className="flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400 overflow-y-auto"
            style={{ minHeight: '40px', maxHeight: '128px', outline: listening ? '2px solid #dc2626' : undefined }}
            onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px'; }}
          />
          {voiceSupported && (
            <button onClick={toggleVoice} title={listening ? 'Stop' : 'Voice input'}
              className={`voice-icon-btn ${listening ? 'voice-icon-btn-active' : ''}`}>
              {listening ? <MicOffIcon size={18} /> : <MicIcon size={18} />}
            </button>
          )}
          <button onClick={handleSend} disabled={!input.trim() || isDisabled}
            className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0">
            <SendIcon size={18} />
          </button>
        </div>
        {demoMode && (
          <div className="demo-footer-note">
            Demo mode · AI responses simulated · <button onClick={() => window.open('https://ollama.com', '_blank')} className="demo-footer-link">Install Ollama for real AI</button>
          </div>
        )}
      </div>
    </div>
  );
}
