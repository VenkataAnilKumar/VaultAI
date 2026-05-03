import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  SendIcon, AlertCircleIcon, RefreshCwIcon, MicIcon, MicOffIcon,
  PlayIcon, ZapIcon, WrenchIcon, XIcon, PaperclipIcon, FileTextIcon,
  ShieldCheckIcon, CloudIcon, DownloadIcon, ChevronDownIcon
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import useStore from '../store/useStore.js';
import { sendChat, sendChatStream, checkOllamaStatus, getModels } from '../api/client.js';
import ConfirmDialog from './ConfirmDialog.jsx';
import WorkflowToggle from './agents/WorkflowToggle.jsx';
import AgentWorkflowPanel from './agents/AgentWorkflowPanel.jsx';
import MCPToolBadge from './mcp/MCPToolBadge.jsx';
import { useToast } from '../hooks/useToast.js';
import { useStats } from '../hooks/useStats.js';

// ── Text file extensions handled client-side ────────────────────
const TEXT_EXTS = new Set([
  '.txt','.md','.js','.ts','.jsx','.tsx','.py','.go','.rs','.java',
  '.cpp','.c','.h','.css','.html','.json','.yaml','.yml','.xml',
  '.csv','.sh','.rb','.php','.sql','.toml','.ini','.env',
]);

// ── Privacy badge ───────────────────────────────────────────────
function PrivacyBadge({ provider, demoMode }) {
  if (demoMode) return null;
  if (!provider) return null;
  const isLocal = provider === 'ollama';
  return (
    <span className={`privacy-badge ${isLocal ? 'privacy-badge-local' : 'privacy-badge-cloud'}`}>
      {isLocal
        ? <><ShieldCheckIcon size={10} /> Local</>
        : <><CloudIcon size={10} /> Cloud</>}
    </span>
  );
}

// ── Ollama Setup Guide ──────────────────────────────────────────
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
        {copied ? 'copied ✓' : '⎘'}
      </button>
    </div>
  );
}

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
              Download Ollama →
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

// ── Streaming bubble ────────────────────────────────────────────
function StreamingBubble({ content, toolsRunning }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs flex-shrink-0 mt-0.5">AI</div>
      <div className="flex-1 min-w-0">
        {toolsRunning.length > 0 && (
          <div className="stream-tool-row">
            {toolsRunning.map(t => (
              <span key={t} className="stream-tool-chip">
                <WrenchIcon size={10} className="stream-tool-spin" />{t.replace(/_/g, ' ')}
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

// ── TTS helper ─────────────────────────────────────────────────
const ttsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

function useTTS() {
  const [speakingId, setSpeakingId] = useState(null);

  function speak(id, text) {
    if (!ttsSupported) return;
    if (speakingId === id) { window.speechSynthesis.cancel(); setSpeakingId(null); return; }
    window.speechSynthesis.cancel();
    const plain = text.replace(/#{1,6}\s/g,'').replace(/[*_`~>]/g,'').replace(/\[([^\]]+)\]\([^)]+\)/g,'$1');
    const utt = new SpeechSynthesisUtterance(plain);
    utt.rate = 0.95; utt.pitch = 1;
    utt.onstart = () => setSpeakingId(id);
    utt.onend   = () => setSpeakingId(null);
    utt.onerror = () => setSpeakingId(null);
    window.speechSynthesis.speak(utt);
  }
  function stop() { window.speechSynthesis.cancel(); setSpeakingId(null); }
  return { speakingId, speak, stop };
}

// ── MessageBubble ───────────────────────────────────────────────
function MessageBubble({ message, speakingId, onSpeak }) {
  const [showTools, setShowTools] = useState(false);
  const isSpeaking = speakingId === message.id;

  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-lg bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm whitespace-pre-wrap break-words">
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
              <WrenchIcon size={11} />{message.toolsUsed.length} tool{message.toolsUsed.length !== 1 ? 's' : ''}
            </button>
          )}
          {ttsSupported && (
            <button onClick={() => onSpeak(message.id, message.content)}
              className={`msg-tts-btn ${isSpeaking ? 'msg-tts-btn-active' : ''}`}
              title={isSpeaking ? 'Stop speaking' : 'Read aloud'}>
              {isSpeaking
                ? <><span className="tts-pulse" />Stop</>
                : <><span style={{ fontSize: 11 }}>🔊</span> Read</>}
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

// ── Main Chat ───────────────────────────────────────────────────
export default function Chat() {
  const {
    messages, addMessage, workingDirectory, ollamaConnected, setOllamaConnected,
    isLoading, setLoading, pendingAction, setPendingAction, workflowMode, externalMCPTools,
    demoMode, setDemoMode, setModels, setActiveTab, activeProvider, setActiveProvider
  } = useStore();

  const [input, setInput]         = useState('');
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);

  // Streaming state
  const [streamContent, setStreamContent] = useState('');
  const [streamTools, setStreamTools]     = useState([]);
  const [isStreaming, setIsStreaming]      = useState(false);
  const abortStreamRef = useRef(null);

  // TTS
  const { speakingId, speak } = useTTS();

  // Toast
  const { success, info, warn } = useToast();

  // Usage stats tracking
  const { track } = useStats();

  // Drag-and-drop state
  const [isDragging, setIsDragging]       = useState(false);
  const [attachedFile, setAttachedFile]   = useState(null);
  const dragCountRef  = useRef(0);
  const chatAreaRef   = useRef(null);

  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);
  const recognitionRef = useRef(null);

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

  // ── Drag-and-drop handlers ──────────────────────────────────
  function handleDragEnter(e) {
    e.preventDefault();
    dragCountRef.current++;
    setIsDragging(true);
  }
  function handleDragLeave(e) {
    e.preventDefault();
    dragCountRef.current--;
    if (dragCountRef.current <= 0) { dragCountRef.current = 0; setIsDragging(false); }
  }
  function handleDragOver(e) { e.preventDefault(); }
  function handleDrop(e) {
    e.preventDefault();
    dragCountRef.current = 0;
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (TEXT_EXTS.has(ext)) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setAttachedFile({ name: file.name, content: ev.target.result, size: file.size, isText: true });
        track('file_attached');
        success(`Attached ${file.name}`);
      };
      reader.readAsText(file);
    } else {
      setAttachedFile({ name: file.name, content: null, size: file.size, isText: false });
      track('file_attached');
      warn(`${file.name} — binary file. Open it in Documents for full analysis.`);
    }
  }

  async function activateDemoMode() {
    setDemoMode(true); setOllamaConnected(true); setActiveProvider('openai');
    setModels([{ name: 'llama3.2 (demo)', size: '2.0GB' }, { name: 'nomic-embed-text (demo)', size: '274MB' }]);
  }

  async function handleRetryConnection() {
    try {
      const status = await checkOllamaStatus();
      setOllamaConnected(status.connected);
      if (status.connected) {
        setActiveProvider(status.provider || null);
        const data = await getModels();
        setModels(data.models || []);
      }
    } catch { setOllamaConnected(false); }
  }

  const handleSend = useCallback(async () => {
    if (!input.trim() && !attachedFile || isLoading || isStreaming) return;
    if (!input.trim() && attachedFile && !attachedFile.isText) {
      // Binary file with no message — prompt user
      addMessage({ role: 'assistant', content: `To analyse **${attachedFile.name}**, use the Documents panel → ingest the file there, then ask me questions about it.`, isError: false });
      setAttachedFile(null);
      return;
    }
    if (listening) { recognitionRef.current?.stop(); setListening(false); }

    let userMessage = input.trim();

    // Prepend file context if attached
    if (attachedFile?.isText && attachedFile.content) {
      const preview = attachedFile.content.length > 8000
        ? attachedFile.content.slice(0, 8000) + '\n… [truncated]'
        : attachedFile.content;
      userMessage = `📎 **${attachedFile.name}**\n\`\`\`\n${preview}\n\`\`\`\n\n${userMessage || 'Please analyse this file.'}`;
    } else if (attachedFile && !attachedFile.isText) {
      userMessage = `[Attached: ${attachedFile.name}] ${userMessage}`;
    }

    setInput('');
    setAttachedFile(null);
    if (inputRef.current) inputRef.current.style.height = '40px';

    addMessage({ role: 'user', content: userMessage });
    track('message_sent');
    const history = messages.map(m => ({ role: m.role, content: m.content }));

    // Multi-agent: non-streaming
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
        onToken: (token) => { accumulated += token; setStreamContent(accumulated); },
        onTool: (event) => {
          if (event.status === 'running') setStreamTools(prev => [...new Set([...prev, event.name])]);
          else if (event.status === 'done') finalToolsUsed.push(event.name);
        },
        onDone: (event) => {
          if (event.isConfirmation) {
            setPendingAction(event.pendingAction);
            addMessage({ role: 'assistant', content: accumulated || event.message || 'Please confirm this action.', model: event.model });
          } else {
            finalToolsUsed = event.toolsUsed || finalToolsUsed;
            finalModel     = event.model || finalModel;
            if (finalModel) setActiveProvider(finalModel.startsWith('gpt') ? 'openai' : 'ollama');
            if (finalToolsUsed.length > 0) track('tool_run', { count: finalToolsUsed.length });
            addMessage({ role: 'assistant', content: accumulated || 'No response', model: finalModel, toolsUsed: finalToolsUsed.length > 0 ? finalToolsUsed : undefined });
          }
          setStreamContent(''); setStreamTools([]); setIsStreaming(false); abortStreamRef.current = null;
        },
        onError: (err) => {
          addMessage({ role: 'assistant', content: `Error: ${err.message}`, isError: true });
          setStreamContent(''); setStreamTools([]); setIsStreaming(false); abortStreamRef.current = null;
        },
      }
    );
  }, [input, attachedFile, isLoading, isStreaming, listening, messages, workingDirectory, workflowMode,
      addMessage, setLoading, setPendingAction, setActiveProvider]);

  useEffect(() => () => { abortStreamRef.current?.(); }, []);
  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  const isDisabled  = isLoading || isStreaming || (!ollamaConnected && !demoMode);
  const showWelcome = !ollamaConnected && !demoMode && messages.length === 0;

  // ── Export handlers ──────────────────────────────────────────
  const [exportOpen, setExportOpen] = useState(false);

  // ⌘E export shortcut
  useEffect(() => {
    function onExportShortcut() {
      if (messages.length > 0) setExportOpen(v => !v);
    }
    window.addEventListener('vault:export-chat', onExportShortcut);
    return () => window.removeEventListener('vault:export-chat', onExportShortcut);
  }, [messages.length]);

  function exportMarkdown() {
    const lines = messages.map(m => {
      const role = m.role === 'user' ? '**You**' : '**Vault AI**';
      const time = m.timestamp ? new Date(m.timestamp).toLocaleString() : '';
      return `### ${role}${time ? ` · ${time}` : ''}\n\n${m.content}\n`;
    });
    const md = `# Vault AI Chat Export\n_Exported ${new Date().toLocaleString()}_\n\n---\n\n${lines.join('\n---\n\n')}`;
    const blob = new Blob([md], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vault-chat-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
    track('export');
    setExportOpen(false);
    success('Chat downloaded as Markdown');
  }

  function exportHtmlPrint() {
    const rows = messages.map(m => {
      const isUser = m.role === 'user';
      const time = m.timestamp ? new Date(m.timestamp).toLocaleString() : '';
      return `<div class="msg ${isUser ? 'user' : 'ai'}">
  <div class="role">${isUser ? 'You' : 'Vault AI'}${time ? `<span class="time">${time}</span>` : ''}</div>
  <div class="body">${m.content.replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br/>')}</div>
</div>`;
    }).join('\n');
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Vault AI Chat</title>
<style>body{font-family:-apple-system,sans-serif;max-width:720px;margin:40px auto;padding:0 20px;color:#111}
h1{font-size:18px;color:#4F46E5;margin-bottom:4px}.meta{font-size:12px;color:#9CA3AF;margin-bottom:24px}
.msg{margin-bottom:20px;padding:14px 16px;border-radius:12px}.user{background:#EFF6FF;border:1px solid #BFDBFE}
.ai{background:#F9FAFB;border:1px solid #E5E7EB}.role{font-size:12px;font-weight:700;margin-bottom:6px;color:#374151}
.time{font-weight:400;color:#9CA3AF;margin-left:8px}.body{font-size:14px;line-height:1.6;white-space:pre-wrap}
@media print{body{max-width:100%;margin:20px}}</style></head>
<body><h1>🔒 Vault AI Chat Export</h1><p class="meta">Exported ${new Date().toLocaleString()}</p>${rows}</body></html>`;
    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 400);
    track('export');
    setExportOpen(false);
    info('Print dialog opened');
  }

  const SUGGESTIONS = [
    'List all files in my home folder', 'Find all PDF files and summarize them',
    'Scan my documents for sensitive data', 'Create a folder called Projects'
  ];
  const DEMO_SUGGESTIONS = [
    'List all files in my home folder', 'Find all PDF files',
    'Scan my documents for privacy risks', 'Summarize my documents'
  ];

  return (
    <div
      ref={chatAreaRef}
      className={`flex flex-col h-full chat-drop-zone ${isDragging ? 'chat-drop-active' : ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragging && (
        <div className="drop-overlay">
          <div className="drop-overlay-inner">
            <PaperclipIcon size={32} />
            <div className="drop-overlay-title">Drop file to attach</div>
            <div className="drop-overlay-sub">Text, code, CSV, JSON and more</div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="chat-toolbar flex items-center justify-between px-4 py-2 border-b">
        <div className="flex items-center gap-2">
          <WorkflowToggle />
          <PrivacyBadge provider={activeProvider} demoMode={demoMode} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {demoMode && (
            <button onClick={() => { setDemoMode(false); setOllamaConnected(false); setModels([]); setActiveProvider(null); }} className="demo-exit-btn">
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
          {/* Export dropdown */}
          {messages.length > 0 && (
            <div className="export-wrap">
              <button className="voice-btn" onClick={() => setExportOpen(v => !v)} title="Export chat (⌘E)">
                <DownloadIcon size={12} /> Export
              </button>
              {exportOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setExportOpen(false)} />
                  <div className="export-dropdown">
                    <button className="export-option" onClick={exportMarkdown}>
                      <FileTextIcon size={13} /> Download as Markdown
                    </button>
                    <button className="export-option" onClick={exportHtmlPrint}>
                      <DownloadIcon size={13} /> Print / Save as PDF
                    </button>
                  </div>
                </>
              )}
            </div>
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

        {messages.map(msg => (
          <div key={msg.id}>
            {msg.workflow && <AgentWorkflowPanel workflow={msg.workflow} isRunning={false} />}
            <MessageBubble message={msg} speakingId={speakingId} onSpeak={speak} />
          </div>
        ))}

        {isStreaming && <StreamingBubble content={streamContent} toolsRunning={streamTools} />}
        <div ref={messagesEndRef} />
      </div>

      {pendingAction && <ConfirmDialog />}

      {/* Input bar */}
      <div className="chat-input-bar border-t p-3">
        {listening && (
          <div className="listening-indicator"><span className="listening-dot" />Listening — speak now</div>
        )}

        {/* Attached file chip */}
        {attachedFile && (
          <div className="attached-file-row">
            <div className={`attached-file-chip ${attachedFile.isText ? '' : 'attached-file-chip-binary'}`}>
              <FileTextIcon size={12} />
              <span className="attached-file-name">{attachedFile.name}</span>
              <span className="attached-file-size">{(attachedFile.size / 1024).toFixed(1)} KB</span>
              {!attachedFile.isText && <span className="attached-file-warn">use Documents panel for binary files</span>}
              <button onClick={() => setAttachedFile(null)} className="attached-file-remove">
                <XIcon size={11} />
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-2 items-end">
          {/* File attach button */}
          <label className="attach-btn" title="Attach file (or drag & drop)">
            <input type="file" style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files[0];
                if (!file) return;
                const ext = '.' + file.name.split('.').pop().toLowerCase();
                if (TEXT_EXTS.has(ext)) {
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    setAttachedFile({ name: file.name, content: ev.target.result, size: file.size, isText: true });
                    success(`Attached ${file.name}`);
                  };
                  reader.readAsText(file);
                } else {
                  setAttachedFile({ name: file.name, content: null, size: file.size, isText: false });
                  warn(`${file.name} — binary file. Open it in Documents for full analysis.`);
                }
                e.target.value = '';
              }}
            />
            <PaperclipIcon size={17} />
          </label>

          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              listening      ? 'Listening...' :
              isStreaming    ? 'Generating…'  :
              attachedFile   ? `Ask about ${attachedFile.name}…` :
              demoMode       ? 'Try: "List files", "Scan for PII", "Summarize"… or drop a file' :
              ollamaConnected ? 'Ask about your files… or drop a file here' : 'Launch Demo Mode or start Ollama'
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
          <button onClick={handleSend} disabled={(!input.trim() && !attachedFile) || isDisabled}
            className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0">
            <SendIcon size={18} />
          </button>
        </div>

        {demoMode && (
          <div className="demo-footer-note">
            Demo mode · Live AI via OpenAI · <button onClick={() => window.open('https://ollama.com', '_blank')} className="demo-footer-link">Install Ollama for local-only AI</button>
          </div>
        )}
      </div>
    </div>
  );
}
