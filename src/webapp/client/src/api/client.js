import axios from 'axios';
import { getDemoResponse } from './demoData.js';
import useStore from '../store/useStore.js';

const api = axios.create({ baseURL: '/api', timeout: 120000 });

// ── Demo Mode Adapter ─────────────────────────────────────────
// When demo mode is on, intercept every request and return
// realistic pre-written responses so judges can explore the
// full product without a local Ollama install.
api.interceptors.request.use((config) => {
  if (useStore.getState().demoMode) {
    config.adapter = async () => {
      // Tiny delay so it feels like a real network call
      await new Promise(r => setTimeout(r, 280 + Math.random() * 400));
      const demoData = getDemoResponse(
        config.method,
        config.url,
        config.data
      );
      return { data: demoData, status: 200, statusText: 'OK', headers: {}, config };
    };
  }
  return config;
});

// Health & Models
export const checkOllamaStatus = () => api.get('/models/status').then(r => r.data);
export const getModels = () => api.get('/models').then(r => r.data);

// Chat
export const sendChat = (data) => api.post('/chat', data).then(r => r.data);
export const confirmAction = (data) => api.post('/chat/confirm', data).then(r => r.data);

// Streaming chat — uses fetch + ReadableStream to receive SSE tokens in real time.
// In demo mode it simulates token-by-token streaming from the pre-written demo response.
// Returns an abort function.
export function sendChatStream(data, { onToken, onTool, onDone, onError }) {
  const demoMode = useStore.getState().demoMode;

  if (demoMode) {
    // Simulate streaming with demo data
    let cancelled = false;
    (async () => {
      try {
        await new Promise(r => setTimeout(r, 180 + Math.random() * 200));
        const demoData = getDemoResponse('post', '/chat', JSON.stringify(data));
        const fullText = demoData?.response || demoData?.error || 'Demo response';

        // Emit word-by-word with a small delay to simulate streaming
        const words = fullText.split(' ');
        for (let i = 0; i < words.length; i++) {
          if (cancelled) return;
          const chunk = (i === 0 ? '' : ' ') + words[i];
          onToken(chunk);
          await new Promise(r => setTimeout(r, 18 + Math.random() * 22));
        }
        onDone({ toolsUsed: [], model: 'llama3.2 (demo)' });
      } catch (err) {
        if (!cancelled) onError(err);
      }
    })();
    return () => { cancelled = true; };
  }

  const ctrl = new AbortController();
  (async () => {
    try {
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep incomplete trailing line
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === 'token')        onToken(event.content);
            else if (event.type === 'tool')    onTool(event);
            else if (event.type === 'done')    onDone(event);
            else if (event.type === 'confirmation') onDone({ ...event, isConfirmation: true });
            else if (event.type === 'error')   onError(new Error(event.message));
          } catch { /* skip malformed event */ }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') onError(err);
    }
  })();
  return () => ctrl.abort();
}

// Files
export const listFiles = (path) => api.get('/files', { params: { path } }).then(r => r.data);
export const readFile = (path) => api.get('/files/read', { params: { path } }).then(r => r.data);
export const indexDirectory = (directory) => api.post('/files/index', { directory }).then(r => r.data);
export const getIndexedFiles = () => api.get('/files/indexed').then(r => r.data);

// Search
export const searchSemantic = (q, dir, limit) => api.get('/search', { params: { q, dir, limit } }).then(r => r.data);

// Generate
export const generateDocument = (data) => api.post('/generate/document', data).then(r => r.data);
export const transformDocument = (data) => api.post('/generate/transform', data).then(r => r.data);
export const synthesizeDocuments = (data) => api.post('/generate/synthesize', data).then(r => r.data);
export const extractData = (data) => api.post('/generate/extract', data).then(r => r.data);
export const autoRename = (filePath) => api.post('/generate/autorename', { filePath }).then(r => r.data);
export const suggestOrganization = (directoryPath) => api.post('/generate/suggest-organization', { directoryPath }).then(r => r.data);

// Documents — Phase 1
export const ingestDocument         = (filePath)         => api.post('/documents/ingest',    { filePath }).then(r => r.data);
export const listDocuments          = ()                  => api.get('/documents').then(r => r.data);
export const deleteDocument         = (filePath)          => api.delete('/documents', { data: { filePath } }).then(r => r.data);
export const queryDocument          = (question, filePath, topK = 5) => api.post('/documents/query', { question, filePath, topK }).then(r => r.data);
export const summarizeDocument      = (filePath, type)    => api.post('/documents/summarize', { filePath, type }).then(r => r.data);
export const extractFromDocument    = (filePath, fields)  => api.post('/documents/extract',   { filePath, fields }).then(r => r.data);
export const classifyDocument       = (filePath)          => api.post('/documents/classify',  { filePath }).then(r => r.data);
export const indexDocumentDirectory = (directoryPath)     => api.post('/documents/index-directory', { directoryPath }).then(r => r.data);

// Documents — Phase 2
export const detectPII              = (filePath)          => api.post('/documents/pii',         { filePath }).then(r => r.data);
export const multiQueryDocuments    = (question, filePaths, topK = 6) => api.post('/documents/multi-query', { question, filePaths, topK }).then(r => r.data);
export const organizeDocuments      = (filePaths)         => api.post('/documents/organize',    { filePaths }).then(r => r.data);

// Research — Phase 3
export const webSearch              = (q, limit = 8)      => api.get('/research/search', { params: { q, limit } }).then(r => r.data);
export const deepResearch           = (question, maxSteps) => api.post('/research/deep',  { question, maxSteps }).then(r => r.data);
export const summarizeUrl           = (url)               => api.post('/research/summarize-url', { url }).then(r => r.data);

// Custom Skills — Phase 4
export const getCustomSkills        = ()                  => api.get('/skills').then(r => r.data);
export const createCustomSkill      = (data)              => api.post('/skills', data).then(r => r.data);
export const deleteCustomSkill      = (id)                => api.delete(`/skills/${id}`).then(r => r.data);

// Agents
export const getAgents = () => api.get('/agents').then(r => r.data);
export const runAgentWorkflow = (data) => api.post('/agents/run', data).then(r => r.data);

// Connectors
export const getConnectors       = () => api.get('/connectors').then(r => r.data);
export const connectConnector    = (name, config) => api.post('/connectors/connect', { name, config }).then(r => r.data);
export const disconnectConnector = (name) => api.post('/connectors/disconnect', { name }).then(r => r.data);
export const listConnectorItems  = (name) => api.get(`/connectors/${name}/list`).then(r => r.data);
export const queryConnector      = (name, query) => api.post(`/connectors/${name}/query`, { query }).then(r => r.data);
export const getConnectorStatus  = (name) => api.get(`/connectors/${name}/status`).then(r => r.data);

// MCP
export const getMCPServerStatus  = () => api.get('/mcp/server/status').then(r => r.data);
export const startMCPServer      = (transport, port) => api.post('/mcp/server/start', { transport, port }).then(r => r.data);
export const stopMCPServer       = () => api.post('/mcp/server/stop').then(r => r.data);
export const getMCPServerConfig  = (transport, port) => api.get('/mcp/server/config', { params: { transport, port } }).then(r => r.data);
export const getMCPServers       = () => api.get('/mcp/servers').then(r => r.data);
export const connectMCPServer    = (data) => api.post('/mcp/connect', data).then(r => r.data);
export const disconnectMCPServer = (name) => api.post('/mcp/disconnect', { name }).then(r => r.data);
export const getMCPTools         = () => api.get('/mcp/tools').then(r => r.data);
export const callMCPTool         = (toolName, args) => api.post('/mcp/call', { toolName, args }).then(r => r.data);

export default api;
