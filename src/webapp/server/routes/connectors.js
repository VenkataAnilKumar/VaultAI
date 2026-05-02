const express = require('express');
const router = express.Router();
const { connectorRegistry } = require('../connectors/registry');

router.get('/', (req, res) => {
  res.json({ connectors: connectorRegistry.list() });
});

router.post('/connect', async (req, res) => {
  try {
    const { name, config } = req.body;
    if (!name || !config) return res.status(400).json({ error: 'name and config are required' });
    const result = await connectorRegistry.connect(name, config);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/disconnect', async (req, res) => {
  try {
    const { name } = req.body;
    await connectorRegistry.disconnect(name);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:name/list', async (req, res) => {
  try {
    const connector = connectorRegistry.get(req.params.name);
    if (!connector) return res.status(404).json({ error: 'Connector not connected' });
    const items = await connector.list();
    res.json({ items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:name/query', async (req, res) => {
  try {
    const connector = connectorRegistry.get(req.params.name);
    if (!connector) return res.status(404).json({ error: 'Connector not connected' });
    const results = await connector.search(req.body.query);
    res.json({ results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:name/status', async (req, res) => {
  const connector = connectorRegistry.get(req.params.name);
  res.json({ name: req.params.name, connected: !!connector });
});

module.exports = router;
