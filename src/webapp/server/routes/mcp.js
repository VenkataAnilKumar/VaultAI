const express = require('express');
const router = express.Router();
const { mcpRegistry } = require('../mcp/registry');
const { VAULT_MCP_TOOLS } = require('../mcp/tools');

router.get('/server/status', (req, res) => {
  res.json({
    running: mcpRegistry.isServerRunning(),
    port: mcpRegistry.getServerPort(),
    transport: mcpRegistry.getServerTransport()
  });
});

router.post('/server/start', async (req, res) => {
  try {
    const { transport = 'sse', port = 3002 } = req.body;
    const result = await mcpRegistry.startServer(transport, port);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/server/stop', async (req, res) => {
  try {
    await mcpRegistry.stopServer();
    res.json({ stopped: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/server/config', (req, res) => {
  const { transport = 'sse', port = 3002 } = req.query;
  const config = mcpRegistry.getServerConfig(transport, parseInt(port));
  res.json({ config, snippet: JSON.stringify(config, null, 2) });
});

router.get('/servers', (req, res) => {
  res.json({ servers: mcpRegistry.listExternal() });
});

router.post('/connect', async (req, res) => {
  try {
    const { name, command, args = [], env = {} } = req.body;
    if (!name || !command) return res.status(400).json({ error: 'name and command required' });
    const result = await mcpRegistry.connectExternal({ name, command, args, env });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/disconnect', async (req, res) => {
  try {
    await mcpRegistry.disconnectExternal(req.body.name);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/tools', (req, res) => {
  res.json({ vault: VAULT_MCP_TOOLS, external: mcpRegistry.getExternalTools() });
});

router.post('/call', async (req, res) => {
  try {
    const { toolName, args } = req.body;
    const result = await mcpRegistry.callExternalTool(toolName, args);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
