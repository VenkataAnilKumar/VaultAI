const express = require('express');
const cors = require('cors');
const path = require('path');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(compression({ level: 6, threshold: 1024 }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const chatRoutes       = require('./routes/chat');
const filesRoutes      = require('./routes/files');
const modelsRoutes     = require('./routes/models');
const searchRoutes     = require('./routes/search');
const generateRoutes   = require('./routes/generate');
const documentsRoutes  = require('./routes/documents');
const agentsRoutes     = require('./routes/agents');
const connectorsRoutes = require('./routes/connectors');
const mcpRoutes        = require('./routes/mcp');
const researchRoutes   = require('./routes/research');
const skillsRoutes     = require('./routes/skills');
const watchRoutes      = require('./routes/watch');
const digestRoutes     = require('./routes/digest');

app.use('/api/chat',       chatRoutes);
app.use('/api/files',      filesRoutes);
app.use('/api/models',     modelsRoutes);
app.use('/api/search',     searchRoutes);
app.use('/api/generate',   generateRoutes);
app.use('/api/documents',  documentsRoutes);
app.use('/api/agents',     agentsRoutes);
app.use('/api/connectors', connectorsRoutes);
app.use('/api/mcp',        mcpRoutes);
app.use('/api/research',   researchRoutes);
app.use('/api/skills',     skillsRoutes);
app.use('/api/watch',      watchRoutes);
app.use('/api/digest',     digestRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

if (process.env.NODE_ENV === 'production') {
  const clientBuild  = path.join(__dirname, '..', 'client', 'dist');
  const landingBuild = path.join(__dirname, '..', '..', 'landing', 'dist');

  // Main app at /app/
  app.use('/app', express.static(clientBuild));
  app.get('/app', (req, res) => res.sendFile(path.join(clientBuild, 'index.html')));
  app.get('/app/*', (req, res) => res.sendFile(path.join(clientBuild, 'index.html')));

  // Landing page at /
  app.use(express.static(landingBuild));
  app.get('*', (req, res) => res.sendFile(path.join(landingBuild, 'index.html')));
}

const { OllamaClient } = require('./services/ollama');
const ollama = new OllamaClient();

async function startup() {
  try {
    const connected = await ollama.isConnected();
    if (connected) {
      const models = await ollama.listModels();
      console.log(`Ollama connected. Models: ${models.map(m => m.name).join(', ') || 'none'}`);
    } else {
      console.warn('Ollama not connected at startup. Start Ollama to enable AI features.');
    }
  } catch (err) {
    console.warn('Could not reach Ollama:', err.message);
  }
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Vault AI server running on port ${PORT}`);
  startup();
});
