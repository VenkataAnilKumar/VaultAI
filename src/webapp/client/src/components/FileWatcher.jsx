import React, { useState, useEffect, useRef } from 'react';
import { EyeIcon, EyeOffIcon, FolderIcon, BellIcon, XIcon, RefreshCwIcon } from 'lucide-react';

const POLL_MS = 8000;

export default function FileWatcher({ defaultDir = '' }) {
  const [dir, setDir]             = useState(defaultDir);
  const [watching, setWatching]   = useState(false);
  const [events, setEvents]       = useState([]);
  const [starting, setStarting]   = useState(false);
  const [error, setError]         = useState(null);
  const pollRef = useRef(null);

  useEffect(() => {
    // On mount, check if server is already watching
    fetch('/api/watch/status')
      .then(r => r.json())
      .then(data => {
        if (data.watching?.length > 0) {
          const first = data.watching[0];
          setDir(first.dir);
          setWatching(true);
          startPolling(first.dir);
        }
      }).catch(() => {});
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  function startPolling(watchDir) {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res  = await fetch(`/api/watch/events?dir=${encodeURIComponent(watchDir)}`);
        const data = await res.json();
        if (data.events?.length > 0) {
          setEvents(prev => [...data.events, ...prev].slice(0, 30));
        }
      } catch {}
    }, POLL_MS);
  }

  async function handleStart() {
    if (!dir.trim()) return;
    setStarting(true); setError(null);
    try {
      const res  = await fetch('/api/watch/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dir: dir.trim() }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      setWatching(true);
      startPolling(dir.trim());
    } catch (err) { setError(err.message); }
    finally { setStarting(false); }
  }

  async function handleStop() {
    if (pollRef.current) clearInterval(pollRef.current);
    try {
      await fetch('/api/watch/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dir: dir.trim() }),
      });
    } catch {}
    setWatching(false); setEvents([]);
  }

  function eventIcon(type) {
    if (type === 'rename') return '📁';
    return '✏️';
  }

  return (
    <div className="file-watcher">
      <div className="fw-header">
        <EyeIcon size={13} style={{ color: watching ? '#22C55E' : 'var(--text-3)' }} />
        <span className="fw-title">File Watcher</span>
        {watching && <span className="fw-live-badge">LIVE</span>}
      </div>

      {!watching ? (
        <div className="fw-setup">
          <div className="fw-input-row">
            <FolderIcon size={12} className="fw-input-icon" />
            <input
              className="fw-dir-input"
              value={dir}
              onChange={e => setDir(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleStart()}
              placeholder="/home/user/documents"
            />
          </div>
          {error && <p className="fw-error">{error}</p>}
          <button className="fw-start-btn" onClick={handleStart} disabled={starting || !dir.trim()}>
            {starting ? <RefreshCwIcon size={12} className="fw-spin" /> : <EyeIcon size={12} />}
            {starting ? 'Starting…' : 'Watch folder'}
          </button>
        </div>
      ) : (
        <div className="fw-active">
          <div className="fw-active-dir">
            <FolderIcon size={11} />
            <span className="fw-dir-text">{dir}</span>
            <button className="fw-stop-btn" onClick={handleStop} title="Stop watching">
              <EyeOffIcon size={11} />
            </button>
          </div>

          {events.length === 0 ? (
            <div className="fw-empty">Watching for changes…</div>
          ) : (
            <div className="fw-events">
              {events.map((ev, i) => (
                <div key={i} className="fw-event">
                  <span className="fw-event-icon">{eventIcon(ev.type)}</span>
                  <span className="fw-event-file">{ev.file || 'unknown'}</span>
                  <span className="fw-event-time">
                    {new Date(ev.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
