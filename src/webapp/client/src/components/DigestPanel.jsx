import React, { useState, useEffect, useCallback } from 'react';
import {
  CalendarIcon, PlayIcon, SettingsIcon, FolderIcon, ClockIcon,
  RefreshCwIcon, TrashIcon, ChevronDownIcon, ChevronUpIcon,
  CheckCircleIcon, AlertCircleIcon, ZapIcon
} from 'lucide-react';
import { useToast } from '../hooks/useToast.js';

const API = '/api/digest';

function fmt(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function relTime(iso) {
  if (!iso) return '';
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60)   return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400)return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}

function DigestCard({ digest, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="digest-card">
      <div className="digest-card-header" onClick={() => setExpanded(v => !v)}>
        <div className="digest-card-meta">
          <span className="digest-dir">{digest.dir?.split('/').pop() || digest.dir}</span>
          <span className="digest-time">{relTime(digest.created)}</span>
        </div>
        <div className="digest-card-stats">
          <span className="digest-count">{digest.file_count} file{digest.file_count !== 1 ? 's' : ''}</span>
          {expanded ? <ChevronUpIcon size={13} /> : <ChevronDownIcon size={13} />}
        </div>
      </div>
      {expanded && (
        <div className="digest-card-body">
          <div className="digest-summary">{digest.summary}</div>
          {digest.changed_files?.length > 0 && (
            <div className="digest-files">
              <div className="digest-files-label">Changed files:</div>
              <div className="digest-files-list">
                {digest.changed_files.map((f, i) => (
                  <span key={i} className="digest-file-chip">{f}</span>
                ))}
              </div>
            </div>
          )}
          <div className="digest-card-footer">
            <span className="digest-full-time">{fmt(digest.created)}</span>
            <button className="digest-delete-btn" onClick={() => onDelete(digest.id)} title="Delete">
              <TrashIcon size={11} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DigestPanel() {
  const { success, error, info } = useToast();
  const [digests,   setDigests]   = useState([]);
  const [schedule,  setSchedule]  = useState({ dirs: [], interval_hours: 24, enabled: false });
  const [loading,   setLoading]   = useState(false);
  const [running,   setRunning]   = useState(false);
  const [tab,       setTab]       = useState('digests');  // 'digests' | 'schedule'
  const [runDir,    setRunDir]    = useState('');
  const [newDir,    setNewDir]    = useState('');
  const [windowH,   setWindowH]   = useState(24);

  const loadDigests = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}?limit=30`);
      const d = await r.json();
      setDigests(d.digests || []);
    } catch { error('Failed to load digests'); }
    finally  { setLoading(false); }
  }, []);  // eslint-disable-line

  const loadSchedule = useCallback(async () => {
    try {
      const r = await fetch(`${API}/schedule`);
      const d = await r.json();
      setSchedule({ ...d, dirs: d.dirs || [] });
      if (d.dirs?.length > 0 && !runDir) setRunDir(d.dirs[0]);
    } catch {}
  }, []); // eslint-disable-line

  useEffect(() => { loadDigests(); loadSchedule(); }, []); // eslint-disable-line

  async function runNow() {
    const dir = runDir.trim();
    if (!dir) { info('Enter a directory path first'); return; }
    setRunning(true);
    try {
      const r = await fetch(`${API}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dir, window_hours: windowH }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed');
      success(`Digest generated — ${d.file_count} file${d.file_count !== 1 ? 's' : ''} scanned`);
      await loadDigests();
    } catch (err) { error(err.message || 'Digest failed'); }
    finally { setRunning(false); }
  }

  async function deleteDigest(id) {
    try {
      await fetch(`${API}/${id}`, { method: 'DELETE' });
      setDigests(d => d.filter(x => x.id !== id));
    } catch { error('Failed to delete'); }
  }

  async function addDir() {
    const d = newDir.trim();
    if (!d) return;
    const dirs = [...new Set([...schedule.dirs, d])];
    await saveSchedule({ dirs });
    setNewDir('');
    if (!runDir) setRunDir(d);
  }

  async function removeDir(dir) {
    const dirs = schedule.dirs.filter(d => d !== dir);
    await saveSchedule({ dirs });
  }

  async function saveSchedule(patch) {
    try {
      const next = { ...schedule, ...patch };
      const r = await fetch(`${API}/schedule`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dirs: next.dirs, interval_hours: next.interval_hours, enabled: next.enabled }),
      });
      const d = await r.json();
      setSchedule({ ...d, dirs: d.dirs || [] });
      success('Schedule saved');
    } catch { error('Failed to save schedule'); }
  }

  const hasScheduledDirs = schedule.dirs.length > 0;

  return (
    <div className="digest-panel">
      <div className="digest-header">
        <div className="digest-header-title">
          <CalendarIcon size={15} />
          <span>Scheduled Digests</span>
        </div>
        <div className="digest-header-tabs">
          <button className={`digest-tab ${tab === 'digests' ? 'digest-tab-active' : ''}`}
            onClick={() => setTab('digests')}>History</button>
          <button className={`digest-tab ${tab === 'schedule' ? 'digest-tab-active' : ''}`}
            onClick={() => setTab('schedule')}>
            <SettingsIcon size={11} /> Schedule
          </button>
        </div>
      </div>

      {tab === 'digests' && (
        <div className="digest-body">
          {/* Run now strip */}
          <div className="digest-run-strip">
            <input
              className="digest-run-input"
              placeholder="Directory path…"
              value={runDir}
              onChange={e => setRunDir(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && runNow()}
            />
            <select className="digest-window-select" value={windowH} onChange={e => setWindowH(Number(e.target.value))}>
              <option value={1}>1h</option>
              <option value={6}>6h</option>
              <option value={24}>24h</option>
              <option value={72}>3d</option>
              <option value={168}>7d</option>
            </select>
            <button className="digest-run-btn" onClick={runNow} disabled={running || !runDir.trim()}>
              {running ? <RefreshCwIcon size={13} className="spin" /> : <PlayIcon size={13} />}
              {running ? 'Running…' : 'Run now'}
            </button>
          </div>

          {loading ? (
            <div className="digest-loading">
              <RefreshCwIcon size={14} className="spin" />
              <span>Loading digests…</span>
            </div>
          ) : digests.length === 0 ? (
            <div className="digest-empty">
              <CalendarIcon size={28} />
              <p>No digests yet</p>
              <p className="digest-empty-sub">Enter a folder path above and click "Run now" to generate your first digest.</p>
            </div>
          ) : (
            <div className="digest-list">
              {digests.map(d => (
                <DigestCard key={d.id} digest={d} onDelete={deleteDigest} />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'schedule' && (
        <div className="digest-body">
          {/* Enable toggle */}
          <div className="digest-schedule-row">
            <div className="digest-schedule-label">
              <ZapIcon size={13} />
              <span>Auto-run digest</span>
            </div>
            <label className="digest-toggle">
              <input type="checkbox" checked={!!schedule.enabled}
                onChange={e => saveSchedule({ enabled: e.target.checked })} />
              <span className="digest-toggle-track" />
            </label>
          </div>

          {/* Interval */}
          <div className="digest-schedule-row">
            <div className="digest-schedule-label">
              <ClockIcon size={13} />
              <span>Run every</span>
            </div>
            <select className="digest-window-select" value={schedule.interval_hours}
              onChange={e => saveSchedule({ interval_hours: Number(e.target.value) })}>
              <option value={1}>1 hour</option>
              <option value={6}>6 hours</option>
              <option value={12}>12 hours</option>
              <option value={24}>24 hours</option>
              <option value={48}>48 hours</option>
              <option value={168}>1 week</option>
            </select>
          </div>

          {/* Dirs */}
          <div className="digest-dirs-section">
            <div className="digest-dirs-title">
              <FolderIcon size={12} /> Watched folders
            </div>
            {schedule.dirs.length === 0 ? (
              <div className="digest-dirs-empty">No folders added yet</div>
            ) : (
              <div className="digest-dirs-list">
                {schedule.dirs.map(d => (
                  <div key={d} className="digest-dir-row">
                    <span className="digest-dir-path">{d}</span>
                    <button className="digest-dir-remove" onClick={() => removeDir(d)} title="Remove">
                      <TrashIcon size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="digest-add-dir">
              <input
                className="digest-run-input"
                placeholder="Add folder path…"
                value={newDir}
                onChange={e => setNewDir(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addDir()}
              />
              <button className="digest-add-btn" onClick={addDir} disabled={!newDir.trim()}>Add</button>
            </div>
          </div>

          {/* Status */}
          {schedule.last_run && (
            <div className="digest-status-row">
              <CheckCircleIcon size={12} style={{ color: '#22C55E' }} />
              <span>Last run: {fmt(schedule.last_run)}</span>
            </div>
          )}
          {schedule.next_run && schedule.enabled && (
            <div className="digest-status-row">
              <ClockIcon size={12} style={{ color: '#6366F1' }} />
              <span>Next run: {fmt(schedule.next_run)}</span>
            </div>
          )}
          {!hasScheduledDirs && schedule.enabled && (
            <div className="digest-status-row" style={{ color: '#F59E0B' }}>
              <AlertCircleIcon size={12} />
              <span>Add folders above to enable auto-digest</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
