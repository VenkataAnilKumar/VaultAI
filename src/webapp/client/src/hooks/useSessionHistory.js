import { useState } from 'react';

const KEY = 'vault-ai-sessions';

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
  catch { return []; }
}

function save(sessions) {
  localStorage.setItem(KEY, JSON.stringify(sessions));
}

export function useSessionHistory() {
  const [sessions, setSessions] = useState(load);

  function saveSession(messages) {
    if (!messages || messages.length === 0) return;
    const userMsg = messages.find(m => m.role === 'user');
    const title = (userMsg?.content || 'Chat').slice(0, 55);
    const session = { id: Date.now(), title, messages, ts: Date.now() };
    const updated = [session, ...sessions].slice(0, 60);
    save(updated);
    setSessions(updated);
    return session.id;
  }

  function deleteSession(id) {
    const updated = sessions.filter(s => s.id !== id);
    save(updated);
    setSessions(updated);
  }

  function getSession(id) {
    return sessions.find(s => s.id === id) || null;
  }

  return { sessions, saveSession, deleteSession, getSession };
}
