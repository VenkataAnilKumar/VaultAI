import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 120000
});

export const checkOllamaStatus = () => api.get('/models/status').then(r => r.data);
export const getModels = () => api.get('/models').then(r => r.data);
export const sendChat = (data) => api.post('/chat', data).then(r => r.data);
export const confirmAction = (data) => api.post('/chat/confirm', data).then(r => r.data);
export const listFiles = (path) => api.get('/files', { params: { path } }).then(r => r.data);
export const readFile = (path) => api.get('/files/read', { params: { path } }).then(r => r.data);
export const indexDirectory = (directory) => api.post('/files/index', { directory }).then(r => r.data);
export const getIndexedFiles = () => api.get('/files/indexed').then(r => r.data);
export const searchSemantic = (q, dir, limit) => api.get('/search', { params: { q, dir, limit } }).then(r => r.data);
export const generateDocument = (data) => api.post('/generate/document', data).then(r => r.data);
export const transformDocument = (data) => api.post('/generate/transform', data).then(r => r.data);
export const synthesizeDocuments = (data) => api.post('/generate/synthesize', data).then(r => r.data);
export const extractData = (data) => api.post('/generate/extract', data).then(r => r.data);
export const autoRename = (filePath) => api.post('/generate/autorename', { filePath }).then(r => r.data);
export const suggestOrganization = (directoryPath) => api.post('/generate/suggest-organization', { directoryPath }).then(r => r.data);

export default api;
