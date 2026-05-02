import React, { useRef, useEffect } from 'react';
import { SunIcon, MoonIcon, MonitorIcon, LockIcon, ServerIcon, XIcon } from 'lucide-react';

const THEMES = [
  { value: 'light',  label: 'Light',  Icon: SunIcon     },
  { value: 'dark',   label: 'Dark',   Icon: MoonIcon    },
  { value: 'system', label: 'System', Icon: MonitorIcon },
];

export default function SettingsPanel({ theme, setTheme, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
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
              <Icon size={15} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="settings-divider" />

      {/* Privacy info */}
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

      {/* Version */}
      <div className="settings-section settings-version">
        <span>Vault AI</span>
        <span className="settings-ver-badge">v1.0.0</span>
      </div>
    </div>
  );
}
