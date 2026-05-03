const express = require('express');
const router  = express.Router();
const fs      = require('fs');
const path    = require('path');

// In-memory watcher map: dir → { watcher, events[], startTime }
const watchers = {};

// POST /api/watch/start  { dir }
router.post('/start', (req, res) => {
  const { dir } = req.body;
  if (!dir) return res.status(400).json({ error: 'dir required' });
  if (watchers[dir]) return res.json({ ok: true, already: true });

  try {
    if (!fs.existsSync(dir)) return res.status(400).json({ error: 'Directory not found' });
    const watcher = fs.watch(dir, { persistent: false }, (eventType, filename) => {
      const info = watchers[dir];
      if (!info) return;
      // Debounce: ignore duplicate events within 500ms
      const last = info.events[info.events.length - 1];
      if (last && last.file === filename && Date.now() - new Date(last.time).getTime() < 500) return;
      info.events.push({ type: eventType, file: filename, time: new Date().toISOString() });
      if (info.events.length > 100) info.events.shift();
    });
    watcher.on('error', () => {
      if (watchers[dir]) { watchers[dir].watcher.close(); delete watchers[dir]; }
    });
    watchers[dir] = { watcher, events: [], startTime: new Date().toISOString() };
    res.json({ ok: true, dir, startTime: watchers[dir].startTime });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/watch/stop  { dir }
router.post('/stop', (req, res) => {
  const { dir } = req.body;
  if (watchers[dir]) {
    try { watchers[dir].watcher.close(); } catch {}
    delete watchers[dir];
  }
  res.json({ ok: true });
});

// GET /api/watch/status
router.get('/status', (req, res) => {
  const watching = Object.entries(watchers).map(([dir, info]) => ({
    dir,
    startTime: info.startTime,
    pendingEvents: info.events.length,
  }));
  res.json({ watching });
});

// GET /api/watch/events?dir=...  (consumes events)
router.get('/events', (req, res) => {
  const { dir } = req.query;
  if (!dir || !watchers[dir]) return res.json({ events: [], watching: false });
  const events = watchers[dir].events.splice(0);
  res.json({ events, watching: true, dir });
});

// GET /api/watch/dirs  (list all watched)
router.get('/dirs', (req, res) => {
  res.json({ dirs: Object.keys(watchers) });
});

module.exports = router;
