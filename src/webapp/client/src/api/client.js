import axios from 'axios';

const api = axios.create({ baseURL: '/api', timeout: 120000 });

// Health & Models
export const checkOllamaStatus = () => api.get('/models/status').then(r => r.data);
export const getModels = () => api.get('/models').then(r => r.data);

// Chat
export const sendChat = (data) => api.post('/chat', data).then(r => r.data);
export const confirmAction = (data) => api.post('/chat/confirm', data).then(r => r.data);

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

// Agents
export const getAgents = () => api.get('/agents').then(r => r.data);
export const runAgentWorkflow = (data) => api.post('/agents/run', data).then(r => r.data);

// Connectors
export const getConnectors = () => api.get('/connectors').then(r => r.data);
export const connectConnector = (name, config) => api.post('/connectors/connect', { name, config }).then(r => r.data);
export const disconnectConnector = (name) => api.post('/connectors/disconnect', { name }).then(r => r.data);
export const listConnectorItems = (name) => api.get(`/connectors/${name}/list`).then(r => r.data);
export const queryConnector = (name, query) => api.post(`/connectors/${name}/query`, { query }).then(r => r.data);
export const getConnectorStatus = (name) => api.get(`/connectors/${name}/status`).then(r => r.data);

// MCP
export const getMCPServerStatus = () => api.get('/mcp/server/status').then(r => r.data);
export const startMCPServer = (transport, port) => api.post('/mcp/server/start', { transport, port }).then(r => r.data);
export const stopMCPServer = () => api.post('/mcp/server/stop').then(r => r.data);
export const getMCPServerConfig = (transport, port) => api.get('/mcp/server/config', { params: { transport, port } }).then(r => r.data);
export const getMCPServers = () => api.get('/mcp/servers').then(r => r.data);
export const connectMCPServer = (data) => api.post('/mcp/connect', data).then(r => r.data);
export const disconnectMCPServer = (name) => api.post('/mcp/disconnect', { name }).then(r => r.data);
export const getMCPTools = () => api.get('/mcp/tools').then(r => r.data);
export const callMCPTool = (toolName, args) => api.post('/mcp/call', { toolName, args }).then(r => r.data);

export default api;
