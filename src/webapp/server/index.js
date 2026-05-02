const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: ['http://localhost:5173', `https://${process.env.REPLIT_DEV_DOMAIN}`, /\.replit\.dev$/, /\.repl\.co$/],
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const chatRoutes = require('./routes/chat');
const filesRoutes = require('./routes/files');
const modelsRoutes = require('./routes/models');
const searchRoutes = require('./routes/search');
const generateRoutes = require('./routes/generate');

app.use('/api/chat', chatRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/models', modelsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/generate', generateRoutes);

if (process.env.NODE_ENV === 'production') {
  const clientBuild = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientBuild));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuild, 'index.html'));
  });
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const { OllamaClient } = require('./services/ollama');
const ollama = new OllamaClient();

async function startup() {
  try {
    const connected = await ollama.isConnected();
    if (connected) {
      const models = await ollama.listModels();
      console.log(`Ollama connected. Available models: ${models.map(m => m.name).join(', ') || 'none'}`);
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
