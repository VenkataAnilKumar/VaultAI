const path   = require('path');
const os     = require('os');
const fs     = require('fs');
const { BaseConnector } = require('./base');

// Known history file locations
const HISTORY_PATHS = {
  chrome: [
    path.join(os.homedir(), '.config', 'google-chrome', 'Default', 'History'),
    path.join(os.homedir(), 'Library', 'Application Support', 'Google', 'Chrome', 'Default', 'History'),
    path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'User Data', 'Default', 'History'),
  ],
  brave: [
    path.join(os.homedir(), '.config', 'BraveSoftware', 'Brave-Browser', 'Default', 'History'),
    path.join(os.homedir(), 'Library', 'Application Support', 'BraveSoftware', 'Brave-Browser', 'Default', 'History'),
  ],
  edge: [
    path.join(os.homedir(), '.config', 'microsoft-edge', 'Default', 'History'),
    path.join(os.homedir(), 'Library', 'Application Support', 'Microsoft Edge', 'Default', 'History'),
  ],
  firefox: [
    // Firefox uses a random profile dir — we scan for places.sqlite
  ]
};

function findHistoryFile(browser) {
  const candidates = HISTORY_PATHS[browser] || [];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  // Firefox: scan profiles
  if (browser === 'firefox') {
    const profilesRoot = [
      path.join(os.homedir(), '.mozilla', 'firefox'),
      path.join(os.homedir(), 'Library', 'Application Support', 'Firefox', 'Profiles'),
    ];
    for (const root of profilesRoot) {
      if (!fs.existsSync(root)) continue;
      const dirs = fs.readdirSync(root).filter(d => d.endsWith('.default-release') || d.endsWith('.default'));
      for (const d of dirs) {
        const p = path.join(root, d, 'places.sqlite');
        if (fs.existsSync(p)) return p;
      }
    }
  }
  return null;
}

function autoDetectBrowser() {
  for (const browser of ['chrome', 'brave', 'edge', 'firefox']) {
    const p = findHistoryFile(browser);
    if (p) return { browser, path: p };
  }
  return null;
}

class BrowserHistoryConnector extends BaseConnector {
  constructor() {
    super('browserhistory', 'Browser History', 'Search and read your local browser history (Chrome, Firefox, Brave, Edge)', {
      browser: {
        type: 'select',
        label: 'Browser',
        options: ['auto', 'chrome', 'brave', 'edge', 'firefox'],
        default: 'auto',
        help: 'Choose "auto" to detect automatically'
      },
      historyPath: {
        type: 'string',
        label: 'Custom History Path (optional)',
        placeholder: '/home/user/.config/google-chrome/Default/History',
        help: 'Override automatic detection with a custom path'
      },
      limit: {
        type: 'number',
        label: 'Max entries to load',
        default: 500,
        help: 'How many recent entries to index (higher = slower)'
      }
    });
    this.dbPath  = null;
    this.browser = null;
    this.limit   = 500;
    this._cache  = null;
    this._cacheTime = 0;
  }

  async connect(config) {
    const { browser = 'auto', historyPath, limit = 500 } = config;
    this.limit = limit;

    if (historyPath && fs.existsSync(historyPath)) {
      this.dbPath  = historyPath;
      this.browser = 'custom';
    } else if (browser === 'auto') {
      const found = autoDetectBrowser();
      if (!found) throw new Error('No browser history found. Try specifying a custom path.');
      this.dbPath  = found.path;
      this.browser = found.browser;
    } else {
      const p = findHistoryFile(browser);
      if (!p) throw new Error(`No ${browser} history found. Is ${browser} installed?`);
      this.dbPath  = p;
      this.browser = browser;
    }

    this.config    = config;
    this.connected = true;

    // Quick sanity check — count entries
    const entries = await this._readHistory(5);
    return { browser: this.browser, path: this.dbPath, sample_count: entries.length };
  }

  async _readHistory(limit) {
    // Chrome/Brave/Edge history is a SQLite DB, but the file is locked while the browser is open.
    // We copy it to a temp file first to read safely.
    const tmpPath = path.join(os.tmpdir(), `vault_history_${Date.now()}.db`);
    try {
      fs.copyFileSync(this.dbPath, tmpPath);
      const Database = require('better-sqlite3');
      const db = new Database(tmpPath, { readonly: true });

      let rows;
      if (this.browser === 'firefox') {
        rows = db.prepare(`
          SELECT moz_places.url, moz_places.title,
                 datetime(moz_historyvisits.visit_date/1000000, 'unixepoch') as visit_time,
                 moz_places.visit_count
          FROM moz_historyvisits
          JOIN moz_places ON moz_historyvisits.place_id = moz_places.id
          ORDER BY moz_historyvisits.visit_date DESC
          LIMIT ?
        `).all(limit);
      } else {
        // Chrome / Brave / Edge schema
        rows = db.prepare(`
          SELECT urls.url, urls.title,
                 datetime(visits.visit_time/1000000 - 11644473600, 'unixepoch') as visit_time,
                 urls.visit_count
          FROM visits
          JOIN urls ON visits.url = urls.id
          ORDER BY visits.visit_time DESC
          LIMIT ?
        `).all(limit);
      }
      db.close();
      return rows.map(r => ({
        url:        r.url,
        title:      r.title || new URL(r.url).hostname,
        visit_time: r.visit_time,
        visits:     r.visit_count
      }));
    } finally {
      try { fs.unlinkSync(tmpPath); } catch {}
    }
  }

  async _getCache() {
    const now = Date.now();
    if (this._cache && now - this._cacheTime < 60000) return this._cache;
    this._cache     = await this._readHistory(this.limit);
    this._cacheTime = now;
    return this._cache;
  }

  async list() {
    return (await this._getCache()).slice(0, 50);
  }

  async read(url) {
    const entries = await this._getCache();
    return entries.filter(e => e.url === url || e.url.includes(url));
  }

  async search(query) {
    const q       = query.toLowerCase();
    const entries = await this._getCache();
    return entries.filter(e =>
      e.url.toLowerCase().includes(q) || (e.title || '').toLowerCase().includes(q)
    ).slice(0, 30);
  }

  async getTopSites(n = 20) {
    const entries = await this._getCache();
    const counts  = {};
    for (const e of entries) {
      try {
        const host = new URL(e.url).hostname;
        counts[host] = (counts[host] || 0) + 1;
      } catch {}
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([host, visits]) => ({ host, visits }));
  }

  getTools() {
    return [
      {
        type: 'function',
        function: {
          name: 'browserhistory_list',
          description: 'List recent browser history entries (last 50)',
          parameters: { type: 'object', properties: {} }
        }
      },
      {
        type: 'function',
        function: {
          name: 'browserhistory_search',
          description: 'Search browser history by URL or page title',
          parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] }
        }
      },
      {
        type: 'function',
        function: {
          name: 'browserhistory_top',
          description: 'Get your most visited sites from browser history',
          parameters: { type: 'object', properties: { limit: { type: 'number' } } }
        }
      }
    ];
  }
}

module.exports = { BrowserHistoryConnector };
