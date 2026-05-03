const OpenAI = require('openai');
const { embed: localEmbed } = require('./localEmbeddings');

function getClient() {
  return new OpenAI({
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || 'placeholder',
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  });
}

const MODEL_MAP = {
  file_op:    'gpt-5-mini',
  doc_qa:     'gpt-5-mini',
  generate:   'gpt-5.4',
  transform:  'gpt-5-mini',
  synthesize: 'gpt-5.4',
  extract:    'gpt-5-mini',
  embedding:  'text-embedding-3-small',
  vision:     'gpt-5.4',
  code:       'gpt-5.4',
};

function normalizeTools(tools) {
  return tools.map(t => {
    if (t.type === 'function') return t;
    return {
      type: 'function',
      function: {
        name:        t.function?.name        || t.name,
        description: t.function?.description || t.description || '',
        parameters:  t.function?.parameters  || t.parameters  || { type: 'object', properties: {} },
      }
    };
  });
}

class OpenAIClient {
  isConnected() {
    return !!(process.env.AI_INTEGRATIONS_OPENAI_BASE_URL && process.env.AI_INTEGRATIONS_OPENAI_API_KEY);
  }

  async chat(model, messages, tools = []) {
    const openai = getClient();
    const openaiModel = MODEL_MAP[model] || model || 'gpt-5-mini';
    const params = { model: openaiModel, messages };
    if (tools && tools.length > 0) {
      params.tools = normalizeTools(tools);
      params.tool_choice = 'auto';
    }
    const response = await openai.chat.completions.create(params);
    const msg = response.choices[0].message;
    const toolCalls = msg.tool_calls?.map(tc => ({
      id: tc.id, type: 'function',
      function: { name: tc.function.name, arguments: tc.function.arguments }
    }));
    return { message: { role: 'assistant', content: msg.content || '', tool_calls: toolCalls || undefined } };
  }

  // Streaming chat — calls onToken({ type, content }) for each token chunk.
  // Returns the fully-assembled message (with tool_calls if any) when the stream ends.
  async chatStream(model, messages, tools = [], onToken) {
    const openai = getClient();
    const openaiModel = MODEL_MAP[model] || model || 'gpt-5-mini';
    const params = { model: openaiModel, messages, stream: true };
    if (tools && tools.length > 0) {
      params.tools = normalizeTools(tools);
      params.tool_choice = 'auto';
    }

    const stream = await openai.chat.completions.create(params);

    let content = '';
    const tcAccum = {}; // tool call accumulator keyed by index

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (!delta) continue;

      if (delta.content) {
        content += delta.content;
        onToken({ type: 'token', content: delta.content });
      }

      if (delta.tool_calls) {
        for (const tc of delta.tool_calls) {
          const idx = tc.index ?? 0;
          if (!tcAccum[idx]) {
            tcAccum[idx] = { id: '', type: 'function', function: { name: '', arguments: '' } };
          }
          if (tc.id)                tcAccum[idx].id = tc.id;
          if (tc.function?.name)    tcAccum[idx].function.name += tc.function.name;
          if (tc.function?.arguments) tcAccum[idx].function.arguments += tc.function.arguments;
        }
      }
    }

    const toolCalls = Object.values(tcAccum);
    return {
      message: {
        role: 'assistant',
        content,
        tool_calls: toolCalls.length > 0 ? toolCalls : undefined
      }
    };
  }

  async generate(model, prompt) {
    const openai = getClient();
    const openaiModel = MODEL_MAP[model] || 'gpt-5-mini';
    const response = await openai.chat.completions.create({
      model: openaiModel,
      messages: [{ role: 'user', content: prompt }],
    });
    return { response: response.choices[0]?.message?.content || '' };
  }

  async embeddings(model, text) { return localEmbed(text); }

  async listModels() {
    return [
      { name: 'gpt-5-mini', size: 0, modified: new Date().toISOString() },
      { name: 'gpt-5.4',    size: 0, modified: new Date().toISOString() },
    ];
  }
}

class OpenAIModelRouter {
  classifyTask(message, fileType = null) {
    if (fileType) {
      if (fileType.startsWith('image/')) return 'vision';
      const codeExts = ['.js','.ts','.py','.go','.rs','.java','.cpp','.cs','.rb','.php','.sh'];
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
  async selectModel(taskType) { return MODEL_MAP[taskType] || 'gpt-5-mini'; }
  async getAvailableModels() {
    return [{ name: 'gpt-5-mini', size: 0 }, { name: 'gpt-5.4', size: 0 }];
  }
}

module.exports = { OpenAIClient, OpenAIModelRouter };
