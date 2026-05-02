import React from 'react';
import { MessageSquareIcon, Trash2Icon } from 'lucide-react';

function groupSessions(sessions) {
  const now = Date.now();
  const today = [], yesterday = [], older = [];
  sessions.forEach(s => {
    const age = now - s.ts;
    if (age < 86400000)       today.push(s);
    else if (age < 172800000) yesterday.push(s);
    else                      older.push(s);
  });
  return { today, yesterday, older };
}

function formatTime(ts) {
  const d = new Date(ts);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function Group({ label, items, activeId, onSelect, onDelete }) {
  if (!items.length) return null;
  return (
    <>
      <div className="sessions-group-label">{label}</div>
      {items.map(s => (
        <div key={s.id}
          className={`session-item ${s.id === activeId ? 'session-item-active' : ''}`}
          onClick={() => onSelect(s)}>
          <MessageSquareIcon size={12} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
          <span className="session-title">{s.title}</span>
          <span className="session-time">{formatTime(s.ts)}</span>
          <button className="session-del"
            onClick={e => { e.stopPropagation(); onDelete(s.id); }}
            title="Delete">
            <Trash2Icon size={11} />
          </button>
        </div>
      ))}
    </>
  );
}

export default function SessionHistory({ sessions, activeId, onSelect, onDelete }) {
  const { today, yesterday, older } = groupSessions(sessions);

  if (!sessions.length) return (
    <div style={{ padding: '12px 14px', fontSize: 12, color: 'var(--text-3)' }}>
      No saved sessions yet. Start chatting!
    </div>
  );

  return (
    <div className="sessions-root">
      <div className="sessions-header">
        <span className="sessions-label">Threads</span>
      </div>
      <div className="sessions-list">
        <Group label="Today"     items={today}     activeId={activeId} onSelect={onSelect} onDelete={onDelete} />
        <Group label="Yesterday" items={yesterday} activeId={activeId} onSelect={onSelect} onDelete={onDelete} />
        <Group label="Older"     items={older}     activeId={activeId} onSelect={onSelect} onDelete={onDelete} />
      </div>
    </div>
  );
}
