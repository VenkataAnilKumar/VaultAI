import React, { useRef, useEffect } from 'react';
import { SunIcon, MoonIcon, MonitorIcon, LockIcon, ServerIcon, XIcon } from 'lucide-react';

const THEMES = [
  { value: 'light',  label: 'Light',  Icon: SunIcon     },
  { value: 'dark',   label: 'Dark',   Icon: MoonIcon    },
  { value: 'system', label: 'System', Icon: MonitorIcon },
];

const isMac = navigator.platform.toUpperCase().includes('MAC');
const mod = isMac ? '⌘' : 'Ctrl';

const SHORTCUTS = [
  { label: 'New chat',       keys: [mod, 'K']     },
  { label: 'Toggle sidebar', keys: [mod, 'B']     },
  { label: 'Settings',       keys: [mod, ',']     },
  { label: 'Send message',   keys: [mod, '↵']     },
  { label: 'Close / cancel', keys: ['Esc']        },
];

export default function SettingsPanel({ theme, setTheme, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    function h(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);

  return (
    <div ref={ref} className="settings-panel">
      <div className="settings-header">
        <span className="settings-title">Settings</span>
        <button className="icon-btn" onClick={onClose}><XIcon size={14} /></button>
      </div>

      {/* Appearance */}
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

      {/* Keyboard shortcuts */}
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

      {/* Privacy */}
      <div className="settings-section">
        <p className="settings-section-label">Privacy</p>
        <div className="settings-info-row">
          <LockIcon size={13} className="settings-info-icon" />
          <span>All data stays on your machine. No cloud, no telemetry.</span>
        </div>
        <div className="settings-info-row">
          <ServerIcon size={13} className="settings-info-icon" />
          <span>AI powered by local Ollama models only.</span>
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
