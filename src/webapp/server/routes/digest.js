const express    = require('express');
const router     = express.Router();
const fs         = require('fs');
const path       = require('path');
const Database   = require('better-sqlite3');
const { OllamaClient, ModelRouter } = require('../services/ollama');

// ── DB init ───────────────────────────────────────────────────────
const DB_PATH = path.join(__dirname, '..', '..', 'data', 'digest.db');
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

let db;
try {
  db = new Database(DB_PATH);
  db.exec(`
    CREATE TABLE IF NOT EXISTS digests (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      dir       TEXT    NOT NULL,
      created   TEXT    NOT NULL,
      summary   TEXT    NOT NULL,
      file_count INTEGER DEFAULT 0,
      changed_files TEXT DEFAULT '[]',
      model     TEXT
    );
    CREATE TABLE IF NOT EXISTS schedule (
      id        INTEGER PRIMARY KEY CHECK (id = 1),
      dirs      TEXT    DEFAULT '[]',
      interval_hours INTEGER DEFAULT 24,
      last_run  TEXT,
      next_run  TEXT,
      enabled   INTEGER DEFAULT 0
    );
    INSERT OR IGNORE INTO schedule (id, dirs, interval_hours, enabled)
    VALUES (1, '[]', 24, 0);
  `);
} catch (err) {
  console.error('[digest] DB init error:', err.message);
}

const ollama      = new OllamaClient();
const modelRouter = new ModelRouter(ollama);

// ── Helpers ───────────────────────────────────────────────────────

function getRecentFiles(dir, windowMs = 24 * 60 * 60 * 1000) {
  const results = [];
  const cutoff  = Date.now() - windowMs;
  function walk(p, depth = 0) {
    if (depth > 3) return;
    try {
      const entries = fs.readdirSync(p, { withFileTypes: true });
      for (const e of entries) {
        if (e.name.startsWith('.')) continue;
        const full = path.join(p, e.name);
        try {
          const stat = fs.statSync(full);
          if (e.isDirectory()) {
            walk(full, depth + 1);
          } else if (stat.mtimeMs > cutoff) {
            results.push({ name: e.name, path: full, size: stat.size, mtime: new Date(stat.mtimeMs).toISOString() });
          }
        } catch {}
      }
    } catch {}
  }
  walk(dir);
  return results.sort((a, b) => new Date(b.mtime) - new Date(a.mtime));
}

async function generateDigest(dir, windowHours = 24) {
  const files = getRecentFiles(dir, windowHours * 60 * 60 * 1000);

  // Read snippet of each changed text file (up to 10 files, 500 chars each)
  const TEXT_EXTS = new Set(['.txt','.md','.js','.ts','.jsx','.tsx','.py','.go','.rs','.json','.yaml','.yml','.csv','.sh','.html','.css','.java','.cpp','.c','.sql']);
  const snippets = [];
  for (const f of files.slice(0, 10)) {
    const ext = path.extname(f.name).toLowerCase();
    if (TEXT_EXTS.has(ext)) {
      try {
        const content = fs.readFileSync(f.path, 'utf8').slice(0, 500);
        snippets.push(`**${f.name}** (modified ${f.mtime.slice(0,10)})\n${content.trim()}`);
      } catch {
        snippets.push(`**${f.name}** (modified ${f.mtime.slice(0,10)}) — binary or unreadable`);
      }
    } else {
      snippets.push(`**${f.name}** (modified ${f.mtime.slice(0,10)}) — ${(f.size/1024).toFixed(1)}KB`);
    }
  }

  const dirName = path.basename(dir);
  const prompt  = files.length === 0
    ? `No files were changed in the last ${windowHours} hours in the directory "${dir}". Write a brief one-sentence digest confirming this.`
    : `You are Vault AI. Write a concise daily digest for the folder "${dirName}" covering the last ${windowHours} hours.

${files.length} file(s) changed:
${snippets.join('\n\n---\n\n')}

Write a short, scannable digest with:
1. A one-line summary
2. Key changes (bullet points, max 6 bullets)
3. Any notable patterns or action items

Keep it under 200 words. Be specific about filenames.`;

  let summary;
  try {
    const messages = [{ role: 'system', content: 'You are a helpful assistant that writes concise file activity digests.' }, { role: 'user', content: prompt }];
    const resp = await modelRouter.chat(messages);
    summary = resp?.message?.content || resp?.content || 'Digest generation failed — no AI response.';
  } catch (err) {
    summary = `Digest generated locally (AI unavailable):\n\n${files.length} file(s) changed in the last ${windowHours}h:\n${files.slice(0,8).map(f => `• ${f.name}`).join('\n') || '• (none)'}`;
  }

  const row = db.prepare(`
    INSERT INTO digests (dir, created, summary, file_count, changed_files)
    VALUES (?, ?, ?, ?, ?)
  `).run(dir, new Date().toISOString(), summary, files.length, JSON.stringify(files.slice(0,20).map(f => f.name)));

  db.prepare(`UPDATE schedule SET last_run = ?, next_run = ? WHERE id = 1`)
    .run(new Date().toISOString(), new Date(Date.now() + getSchedule().interval_hours * 3600000).toISOString());

  return { id: row.lastInsertRowid, dir, summary, file_count: files.length, created: new Date().toISOString() };
}

function getSchedule() {
  return db.prepare('SELECT * FROM schedule WHERE id = 1').get() || { dirs: '[]', interval_hours: 24, enabled: 0 };
}

// ── Scheduler ─────────────────────────────────────────────────────
let schedulerTimer = null;

function startScheduler() {
  if (schedulerTimer) return;
  schedulerTimer = setInterval(async () => {
    try {
      const sched = getSchedule();
      if (!sched.enabled) return;
      const dirs = JSON.parse(sched.dirs || '[]');
      if (dirs.length === 0) return;
      const nextRun = sched.next_run ? new Date(sched.next_run) : null;
      if (nextRun && nextRun > new Date()) return;
      console.log('[digest] Running scheduled digest for', dirs.length, 'dir(s)');
      for (const dir of dirs) {
        if (fs.existsSync(dir)) {
          await generateDigest(dir, sched.interval_hours).catch(e => console.error('[digest] Error:', e.message));
        }
      }
    } catch (e) { console.error('[digest] Scheduler error:', e.message); }
  }, 5 * 60 * 1000); // check every 5 min
}

startScheduler();

// ── Routes ────────────────────────────────────────────────────────

// GET /api/digest  — list all digests (most recent first)
router.get('/', (req, res) => {
  try {
    const limit  = parseInt(req.query.limit) || 20;
    const dir    = req.query.dir || null;
    const stmt   = dir
      ? db.prepare('SELECT * FROM digests WHERE dir = ? ORDER BY id DESC LIMIT ?')
      : db.prepare('SELECT * FROM digests ORDER BY id DESC LIMIT ?');
    const rows   = dir ? stmt.all(dir, limit) : stmt.all(limit);
    res.json({ digests: rows.map(r => ({ ...r, changed_files: JSON.parse(r.changed_files || '[]') })) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/digest/schedule
router.get('/schedule', (req, res) => {
  try {
    const s = getSchedule();
    res.json({ ...s, dirs: JSON.parse(s.dirs || '[]') });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/digest/schedule  { dirs, interval_hours, enabled }
router.put('/schedule', (req, res) => {
  try {
    const { dirs, interval_hours, enabled } = req.body;
    const update = {};
    if (Array.isArray(dirs))            update.dirs           = JSON.stringify(dirs);
    if (typeof interval_hours === 'number') update.interval_hours = interval_hours;
    if (typeof enabled === 'boolean')   update.enabled        = enabled ? 1 : 0;
    const sets  = Object.keys(update).map(k => `${k} = ?`).join(', ');
    const vals  = Object.values(update);
    if (sets) db.prepare(`UPDATE schedule SET ${sets} WHERE id = 1`).run(...vals);
    const s = getSchedule();
    res.json({ ...s, dirs: JSON.parse(s.dirs || '[]') });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/digest/run  { dir, window_hours? }
router.post('/run', async (req, res) => {
  const { dir, window_hours = 24 } = req.body;
  if (!dir) return res.status(400).json({ error: 'dir required' });
  if (!fs.existsSync(dir)) return res.status(400).json({ error: 'Directory not found' });
  try {
    const result = await generateDigest(dir, window_hours);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/digest/:id
router.get('/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM digests WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json({ ...row, changed_files: JSON.parse(row.changed_files || '[]') });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/digest/:id
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM digests WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
