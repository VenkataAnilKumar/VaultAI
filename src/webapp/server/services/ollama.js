const axios = require('axios');
const { OpenAIClient, OpenAIModelRouter } = require('./openaiClient');

class OllamaClient {
  constructor(baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434') {
    this.baseUrl = baseUrl;
    this.client = axios.create({ baseURL: baseUrl, timeout: 120000 });
    this._cloud = new OpenAIClient();
    this._ollamaAvailable = null;
    this._lastCheck = 0;
    this.CHECK_TTL = 30000;
  }

  async _checkOllama() {
    const now = Date.now();
    if (now - this._lastCheck < this.CHECK_TTL && this._ollamaAvailable !== null) {
      return this._ollamaAvailable;
    }
    try {
      await this.client.get('/', { timeout: 2000 });
      this._ollamaAvailable = true;
    } catch {
      this._ollamaAvailable = false;
    }
    this._lastCheck = now;
    return this._ollamaAvailable;
  }

  async chat(model, messages, tools = [], stream = false) {
    if (await this._checkOllama()) {
      const body = { model, messages, stream };
      if (tools && tools.length > 0) body.tools = tools;
      const response = await this.client.post('/api/chat', body);
      return response.data;
    }
    if (this._cloud.isConnected()) {
      return this._cloud.chat(model, messages, tools, stream);
    }
    throw new Error('No AI model available. Please start Ollama and pull a model.');
  }

  async generate(model, prompt, stream = false) {
    if (await this._checkOllama()) {
      const response = await this.client.post('/api/generate', { model, prompt, stream });
      return response.data;
    }
    if (this._cloud.isConnected()) {
      return this._cloud.generate(model, prompt, stream);
    }
    throw new Error('No AI model available. Please start Ollama and pull a model.');
  }

  async embeddings(model, text) {
    if (await this._checkOllama()) {
      const response = await this.client.post('/api/embeddings', { model, input: text });
      return response.data.embeddings?.[0] || response.data.embedding || [];
    }
    if (this._cloud.isConnected()) {
      return this._cloud.embeddings(model, text);
    }
    throw new Error('No embedding model available. Start Ollama with nomic-embed-text or enable cloud AI.');
  }

  async listModels() {
    if (await this._checkOllama()) {
      const response = await this.client.get('/api/tags');
      return (response.data.models || []).map(m => ({
        name: m.name, size: m.size, modified: m.modified_at
      }));
    }
    if (this._cloud.isConnected()) {
      return this._cloud.listModels();
    }
    return [];
  }

  async isConnected() {
    if (await this._checkOllama()) return true;
    return this._cloud.isConnected();
  }

  async getProviderInfo() {
    const ollamaUp = await this._checkOllama();
    return {
      ollama: ollamaUp,
      cloud: this._cloud.isConnected(),
      activeProvider: ollamaUp ? 'ollama' : (this._cloud.isConnected() ? 'openai' : null)
    };
  }
}

class ModelRouter {
  constructor(ollamaClient) {
    this.ollama = ollamaClient;
    this._cache = null;
    this._cacheTime = 0;
    this.CACHE_TTL = 60000;
    this._cloudRouter = new OpenAIModelRouter();
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

    const ollamaModels = models.filter(m => !['gpt-5-mini', 'gpt-5.4'].includes(m.name));

    if (ollamaModels.length > 0) {
      const names = ollamaModels.map(m => m.name);
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
        const sizeA = ollamaModels.find(m => m.name === a)?.size || 0;
        const sizeB = ollamaModels.find(m => m.name === b)?.size || 0;
        return sizeB - sizeA;
      })[0] || null;
    }

    if (taskType === 'vision') return null;
    return this._cloudRouter.selectModel(taskType);
  }
}

module.exports = { OllamaClient, ModelRouter };
