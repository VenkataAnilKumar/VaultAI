import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  SunIcon, MoonIcon, MonitorIcon, LockIcon, ServerIcon, XIcon,
  CpuIcon, FolderIcon, KeyIcon, CheckIcon, RefreshCwIcon, AlertCircleIcon,
  ChevronDownIcon
} from 'lucide-react';
import useStore from '../store/useStore.js';
import { checkOllamaStatus, getModels } from '../api/client.js';

const isMac     = /mac/i.test(navigator.platform);
const isWindows = /win/i.test(navigator.platform);
const isLinux   = !isMac && !isWindows;
const mod       = isMac ? '⌘' : 'Ctrl';

const THEMES = [
  { value: 'light',  label: 'Light',  Icon: SunIcon     },
  { value: 'dark',   label: 'Dark',   Icon: MoonIcon    },
  { value: 'system', label: 'System', Icon: MonitorIcon },
];

const SHORTCUTS = [
  { label: 'New chat',       keys: [mod, 'K'] },
  { label: 'Toggle sidebar', keys: [mod, 'B'] },
  { label: 'Settings',       keys: [mod, ','] },
  { label: 'Send message',   keys: ['↵']      },
  { label: 'New line',       keys: ['Shift', '↵'] },
];

// Tiny copy button used in onboarding section
function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  const t = useRef(null);
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      if (t.current) clearTimeout(t.current);
      t.current = setTimeout(() => setCopied(false), 1600);
    });
  }
  useEffect(() => () => { if (t.current) clearTimeout(t.current); }, []);
  return (
    <button onClick={copy} className="sp-copy-btn" title="Copy">
      {copied ? <CheckIcon size={10} /> : '⎘'}
    </button>
  );
}

function CodeLine({ cmd }) {
  return (
    <div className="sp-code-line">
      <span className="sp-code-text">{cmd}</span>
      <CopyBtn text={cmd} />
    </div>
  );
}

export default function SettingsPanel({ theme, setTheme, onClose }) {
  const ref = useRef(null);
  const {
    availableModels, ollamaConnected, setOllamaConnected,
    workingDirectory, setWorkingDirectory, setModels,
    selectedModel, setSelectedModel, demoMode, setActiveProvider
  } = useStore();

  const [dirInput, setDirInput]   = useState(workingDirectory);
  const [apiKey, setApiKey]       = useState(() => localStorage.getItem('vault_openai_key') || '');
  const [apiKeySaved, setApiKeySaved] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const [checking, setChecking]   = useState(false);
  const [checkResult, setCheckResult] = useState(null); // 'ok' | 'fail'

  // Determine OS tab
  const [osTab, setOsTab] = useState(isMac ? 'mac' : isWindows ? 'windows' : 'linux');

  // Close on outside click
  useEffect(() => {
    function h(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);

  async function handleCheckConnection() {
    setChecking(true); setCheckResult(null);
    try {
      const status = await checkOllamaStatus();
      setOllamaConnected(status.connected);
      if (status.provider) setActiveProvider(status.provider);
      if (status.connected) {
        const data = await getModels();
        setModels(data.models || []);
        setCheckResult('ok');
      } else { setCheckResult('fail'); }
    } catch { setOllamaConnected(false); setCheckResult('fail'); }
    finally { setChecking(false); }
  }

  function saveApiKey() {
    if (apiKey.trim()) localStorage.setItem('vault_openai_key', apiKey.trim());
    else localStorage.removeItem('vault_openai_key');
    setApiKeySaved(true);
    setTimeout(() => setApiKeySaved(false), 2000);
  }

  function saveDirectory() {
    if (dirInput.trim()) setWorkingDirectory(dirInput.trim());
  }

  const OS_INSTALL = {
    mac: [
      { label: 'Install via Homebrew', cmd: 'brew install ollama' },
      { label: 'Or download the app', link: 'https://ollama.com/download/mac' },
    ],
    windows: [
      { label: 'Download installer', link: 'https://ollama.com/download/windows' },
      { label: 'Or via winget', cmd: 'winget install Ollama.Ollama' },
    ],
    linux: [
      { label: 'Install script', cmd: 'curl -fsSL https://ollama.com/install.sh | sh' },
    ],
  };

  return (
    <div ref={ref} className="settings-panel">
      <div className="settings-header">
        <span className="settings-title">Settings</span>
        <button className="icon-btn" onClick={onClose}><XIcon size={14} /></button>
      </div>

      {/* ── Appearance ── */}
      <div className="settings-section">
        <p className="settings-section-label">Appearance</p>
        <div className="theme-grid">
          {THEMES.map(({ value, label, Icon }) => (
            <button key={value} onClick={() => setTheme(value)}
              className={`theme-btn ${theme === value ? 'theme-btn-active' : ''}`}>
              <Icon size={16} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="settings-divider" />

      {/* ── Model Selection ── */}
      <div className="settings-section">
        <p className="settings-section-label">Chat Model</p>
        {availableModels.length === 0 ? (
          <p className="sp-hint">No models available — connect Ollama first.</p>
        ) : (
          <div className="sp-model-select-wrap">
            <button className="sp-model-select" onClick={() => setModelOpen(v => !v)}>
              <CpuIcon size={13} />
              <span>{selectedModel || availableModels[0]?.name || 'Auto'}</span>
              <ChevronDownIcon size={12} />
            </button>
            {modelOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setModelOpen(false)} />
                <div className="sp-model-dropdown">
                  <button className="sp-model-option" onClick={() => { setSelectedModel(''); setModelOpen(false); }}>
                    <span>Auto (recommended)</span>
                    {!selectedModel && <CheckIcon size={11} />}
                  </button>
                  {availableModels.map(m => (
                    <button key={m.name} className="sp-model-option" onClick={() => { setSelectedModel(m.name); setModelOpen(false); }}>
                      <span>{m.name}</span>
                      {selectedModel === m.name && <CheckIcon size={11} />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="settings-divider" />

      {/* ── Working Directory ── */}
      <div className="settings-section">
        <p className="settings-section-label">Working Directory</p>
        <div className="sp-input-row">
          <FolderIcon size={13} className="sp-input-icon" />
          <input
            className="sp-text-input"
            value={dirInput}
            onChange={e => setDirInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && saveDirectory()}
            placeholder="/home/user"
          />
          <button className="sp-save-btn" onClick={saveDirectory}>Save</button>
        </div>
        <p className="sp-hint">Files in this folder are accessible to the AI.</p>
      </div>

      <div className="settings-divider" />

      {/* ── API Keys ── */}
      <div className="settings-section">
        <p className="settings-section-label">OpenAI API Key <span className="sp-optional">(optional fallback)</span></p>
        <div className="sp-input-row">
          <KeyIcon size={13} className="sp-input-icon" />
          <input
            className="sp-text-input"
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && saveApiKey()}
            placeholder="sk-…"
          />
          <button className="sp-save-btn" onClick={saveApiKey}>
            {apiKeySaved ? <><CheckIcon size={11} /> Saved</> : 'Save'}
          </button>
        </div>
        <p className="sp-hint">Stored locally in your browser only. Used when Ollama is unavailable.</p>
      </div>

      <div className="settings-divider" />

      {/* ── Ollama Connection ── */}
      <div className="settings-section">
        <p className="settings-section-label">Ollama Connection</p>
        <div className="sp-connection-row">
          <span className={`status-dot ${ollamaConnected ? 'dot-green' : 'dot-red'}`} />
          <span className="sp-connection-label">
            {ollamaConnected
              ? `Connected · ${availableModels.length} model${availableModels.length !== 1 ? 's' : ''}`
              : 'Not connected'}
          </span>
          <button className="sp-check-btn" onClick={handleCheckConnection} disabled={checking}>
            {checking ? <RefreshCwIcon size={11} className="sp-spin" /> : <RefreshCwIcon size={11} />}
            {checking ? 'Checking…' : 'Recheck'}
          </button>
        </div>
        {checkResult === 'ok' && <p className="sp-success-msg"><CheckIcon size={11} /> Connected!</p>}
        {checkResult === 'fail' && <p className="sp-error-msg"><AlertCircleIcon size={11} /> Could not reach Ollama.</p>}

        {/* OS-specific setup guide */}
        {!ollamaConnected && !demoMode && (
          <div className="sp-onboarding">
            <p className="sp-onboarding-title">Install Ollama</p>
            <div className="sp-os-tabs">
              {['mac','windows','linux'].map(os => (
                <button key={os} onClick={() => setOsTab(os)}
                  className={`sp-os-tab ${osTab === os ? 'sp-os-tab-active' : ''}`}>
                  {os === 'mac' ? '🍎' : os === 'windows' ? '🪟' : '🐧'} {os.charAt(0).toUpperCase() + os.slice(1)}
                </button>
              ))}
            </div>
            <div className="sp-onboarding-steps">
              {OS_INSTALL[osTab].map((step, i) => (
                <div key={i} className="sp-onboarding-step">
                  <span className="sp-step-label">{step.label}</span>
                  {step.cmd  && <CodeLine cmd={step.cmd} />}
                  {step.link && (
                    <a href={step.link} target="_blank" rel="noopener noreferrer" className="sp-download-link">
                      Download →
                    </a>
                  )}
                </div>
              ))}
              <div className="sp-onboarding-step">
                <span className="sp-step-label">Pull a model</span>
                <CodeLine cmd="ollama pull llama3.2" />
              </div>
              <div className="sp-onboarding-step">
                <span className="sp-step-label">Pull an embedding model</span>
                <CodeLine cmd="ollama pull nomic-embed-text" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="settings-divider" />

      {/* ── Keyboard Shortcuts ── */}
      <div className="settings-section">
        <p className="settings-section-label">Keyboard Shortcuts</p>
        <div className="settings-shortcuts">
          {SHORTCUTS.map(({ label, keys }) => (
            <div key={label} className="shortcut-row">
              <span>{label}</span>
              <div className="shortcut-keys">
                {keys.map(k => <kbd key={k} className="kbd">{k}</kbd>)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="settings-divider" />

      {/* ── Privacy ── */}
      <div className="settings-section">
        <p className="settings-section-label">Privacy</p>
        <div className="settings-info-row">
          <LockIcon size={13} className="settings-info-icon" />
          <span>All data stays on your machine. No cloud, no telemetry.</span>
        </div>
        <div className="settings-info-row">
          <ServerIcon size={13} className="settings-info-icon" />
          <span>AI powered by local Ollama models by default.</span>
        </div>
      </div>

      <div className="settings-divider" />

      <div className="settings-section settings-version">
        <span>Vault AI — local-first AI</span>
        <span className="settings-ver-badge">v1.0.0</span>
      </div>
    </div>
  );
}
