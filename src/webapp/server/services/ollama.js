const axios = require('axios');

class OllamaClient {
  constructor(baseUrl = 'http://localhost:11434') {
    this.baseUrl = baseUrl;
    this.client = axios.create({ baseURL: baseUrl, timeout: 120000 });
  }

  async chat(model, messages, tools = [], stream = false) {
    const body = { model, messages, stream };
    if (tools && tools.length > 0) body.tools = tools;
    const response = await this.client.post('/api/chat', body);
    return response.data;
  }

  async generate(model, prompt, stream = false) {
    const response = await this.client.post('/api/generate', { model, prompt, stream });
    return response.data;
  }

  async embeddings(model, text) {
    const response = await this.client.post('/api/embeddings', { model, input: text });
    return response.data.embeddings?.[0] || response.data.embedding || [];
  }

  async listModels() {
    const response = await this.client.get('/api/tags');
    return (response.data.models || []).map(m => ({
      name: m.name,
      size: m.size,
      modified: m.modified_at
    }));
  }

  async isConnected() {
    try {
      await this.client.get('/');
      return true;
    } catch {
      return false;
    }
  }
}

class ModelRouter {
  constructor(ollamaClient) {
    this.ollama = ollamaClient;
    this._cache = null;
    this._cacheTime = 0;
    this.CACHE_TTL = 60000;
  }

  async getAvailableModels() {
    if (this._cache && Date.now() - this._cacheTime < this.CACHE_TTL) {
      return this._cache;
    }
    try {
      this._cache = await this.ollama.listModels();
      this._cacheTime = Date.now();
      return this._cache;
    } catch {
      return this._cache || [];
    }
  }

  classifyTask(message, fileType = null) {
    if (fileType) {
      if (fileType.startsWith('image/')) return 'vision';
      const codeExts = ['.js', '.ts', '.py', '.go', '.rs', '.java', '.cpp', '.cs', '.rb', '.php', '.sh'];
      if (codeExts.some(ext => fileType.endsWith(ext))) return 'code';
    }
    const msg = message.toLowerCase();
    if (/\b(move|copy|delete|rename|create folder|organize|list files|find file|mkdir)\b/.test(msg)) return 'file_op';
    if (/\b(write|draft|generate|create (a |the )?(document|report|email|letter|essay))\b/.test(msg)) return 'generate';
    if (/\b(rewrite|translate|simplify|shorten|expand|improve|convert|transform)\b/.test(msg)) return 'transform';
    if (/\b(compare|combine|merge|synthesize|contrast|across files)\b/.test(msg)) return 'synthesize';
    if (/\b(extract|pull out|list all (dates|names|prices|contacts)|get all)\b/.test(msg)) return 'extract';
    return 'doc_qa';
  }

  async selectModel(taskType) {
    const models = await this.getAvailableModels();
    const names = models.map(m => m.name);

    const priorities = {
      file_op:    ['llama3.2:3b', 'llama3.2', 'phi3:mini'],
      doc_qa:     ['mistral:7b', 'llama3.1:8b', 'llama3:8b', 'llama3.2'],
      generate:   ['llama3.1:8b', 'mistral:7b', 'llama3:8b', 'llama3.2'],
      transform:  ['mistral:7b', 'llama3.1:8b', 'llama3.2'],
      synthesize: ['llama3.1:8b', 'mistral:7b', 'llama3.2'],
      extract:    ['mistral:7b', 'llama3.1:8b', 'llama3.2'],
      embedding:  ['nomic-embed-text', 'mxbai-embed-large'],
      vision:     ['llava:7b', 'llava', 'moondream'],
      code:       ['qwen2.5-coder:7b', 'codellama:7b', 'mistral:7b', 'llama3.2']
    };

    const list = priorities[taskType] || priorities.doc_qa;
    for (const preferred of list) {
      if (names.includes(preferred)) return preferred;
      const partial = names.find(n => n.startsWith(preferred.split(':')[0]));
      if (partial) return partial;
    }

    if (taskType === 'vision') return null;
    if (taskType === 'embedding') return names[0] || null;

    return names.sort((a, b) => {
      const sizeA = models.find(m => m.name === a)?.size || 0;
      const sizeB = models.find(m => m.name === b)?.size || 0;
      return sizeB - sizeA;
    })[0] || null;
  }
}

module.exports = { OllamaClient, ModelRouter };
