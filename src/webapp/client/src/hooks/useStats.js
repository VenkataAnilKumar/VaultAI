import { useCallback } from 'react';

const KEY = 'vault_ai_stats';

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch { return {}; }
}

function save(data) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch {}
}

function todayKey() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

export function useStats() {
  const track = useCallback((event, meta = {}) => {
    const all  = load();
    const day  = todayKey();
    const day_data = all[day] || { messages: 0, filesAttached: 0, toolsRun: 0, exports: 0, sessions: 0 };
    switch (event) {
      case 'message_sent':  day_data.messages++;                break;
      case 'file_attached': day_data.filesAttached++;           break;
      case 'tool_run':      day_data.toolsRun += (meta.count || 1); break;
      case 'export':        day_data.exports++;                 break;
      case 'session_start': day_data.sessions++;                break;
    }
    all[day] = day_data;
    save(all);
  }, []);

  const getToday = useCallback(() => {
    const all = load();
    return all[todayKey()] || { messages: 0, filesAttached: 0, toolsRun: 0, exports: 0, sessions: 0 };
  }, []);

  const getTotal = useCallback(() => {
    const all  = load();
    const totals = { messages: 0, filesAttached: 0, toolsRun: 0, exports: 0, sessions: 0 };
    Object.values(all).forEach(d => {
      totals.messages     += d.messages     || 0;
      totals.filesAttached += d.filesAttached || 0;
      totals.toolsRun     += d.toolsRun     || 0;
      totals.exports      += d.exports      || 0;
      totals.sessions     += d.sessions     || 0;
    });
    return totals;
  }, []);

  const getLast7Days = useCallback(() => {
    const all   = load();
    const days  = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key   = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString(undefined, { weekday: 'short' });
      days.push({ date: key, label, ...(all[key] || { messages: 0 }) });
    }
    return days;
  }, []);

  const clearStats = useCallback(() => { localStorage.removeItem(KEY); }, []);

  return { track, getToday, getTotal, getLast7Days, clearStats };
}
