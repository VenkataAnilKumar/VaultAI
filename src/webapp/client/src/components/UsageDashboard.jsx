import React, { useState, useEffect } from 'react';
import { MessageSquareIcon, PaperclipIcon, WrenchIcon, DownloadIcon, BarChart2Icon, XIcon } from 'lucide-react';
import { useStats } from '../hooks/useStats.js';

export default function UsageDashboard({ onClose }) {
  const { getToday, getTotal, getLast7Days, clearStats } = useStats();
  const [today, setToday]   = useState(getToday());
  const [total, setTotal]   = useState(getTotal());
  const [week, setWeek]     = useState(getLast7Days());
  const [tab, setTab]       = useState('today');

  useEffect(() => {
    setToday(getToday());
    setTotal(getTotal());
    setWeek(getLast7Days());
  }, []);

  const maxMessages = Math.max(...week.map(d => d.messages || 0), 1);

  function handleClear() {
    if (window.confirm('Clear all usage stats?')) { clearStats(); setToday(getToday()); setTotal(getTotal()); setWeek(getLast7Days()); }
  }

  const stats = tab === 'today' ? today : total;
  const label  = tab === 'today' ? 'Today' : 'All time';

  return (
    <div className="usage-dashboard">
      <div className="usage-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BarChart2Icon size={14} style={{ color: 'var(--accent)' }} />
          <span className="usage-title">Usage</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <div className="usage-tabs">
            <button onClick={() => setTab('today')} className={`usage-tab ${tab === 'today' ? 'usage-tab-active' : ''}`}>Today</button>
            <button onClick={() => setTab('total')} className={`usage-tab ${tab === 'total' ? 'usage-tab-active' : ''}`}>All time</button>
          </div>
          <button className="icon-btn" onClick={onClose}><XIcon size={13} /></button>
        </div>
      </div>

      {/* Stat tiles */}
      <div className="usage-tiles">
        {[
          { icon: <MessageSquareIcon size={14} />, label: 'Messages',     value: stats.messages     || 0, color: '#4F46E5' },
          { icon: <PaperclipIcon    size={14} />, label: 'Files',         value: stats.filesAttached || 0, color: '#059669' },
          { icon: <WrenchIcon       size={14} />, label: 'Tools run',     value: stats.toolsRun     || 0, color: '#D97706' },
          { icon: <DownloadIcon     size={14} />, label: 'Exports',       value: stats.exports      || 0, color: '#7C3AED' },
        ].map(({ icon, label, value, color }) => (
          <div key={label} className="usage-tile">
            <div className="usage-tile-icon" style={{ color }}>{icon}</div>
            <div className="usage-tile-value">{value.toLocaleString()}</div>
            <div className="usage-tile-label">{label}</div>
          </div>
        ))}
      </div>

      {/* 7-day bar chart */}
      <div className="usage-chart-section">
        <div className="usage-chart-label">Messages · last 7 days</div>
        <div className="usage-chart">
          {week.map(day => (
            <div key={day.date} className="usage-bar-col">
              <div className="usage-bar-wrap">
                <div className="usage-bar" style={{ height: `${Math.round((day.messages / maxMessages) * 100)}%` }} />
              </div>
              <div className="usage-bar-label">{day.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="usage-footer">
        <span className="usage-footer-note">Stats are stored locally and never shared.</span>
        <button className="usage-clear-btn" onClick={handleClear}>Clear stats</button>
      </div>
    </div>
  );
}
