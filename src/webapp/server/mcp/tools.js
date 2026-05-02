const { FILE_TOOLS, DESTRUCTIVE_TOOLS } = require('../tools/fileTools');

const VAULT_MCP_TOOLS = FILE_TOOLS.map(t => ({
  name: 'vault_' + t.function.name,
  description: t.function.description,
  inputSchema: {
    type: 'object',
    properties: t.function.parameters?.properties || {},
    required: t.function.parameters?.required || []
  },
  internal: t.function.name,
  destructive: DESTRUCTIVE_TOOLS.includes(t.function.name)
}));

VAULT_MCP_TOOLS.push(
  {
    name: 'vault_search',
    description: 'Semantic search across indexed documents',
    inputSchema: { type: 'object', properties: { q: { type: 'string' }, dir: { type: 'string' }, limit: { type: 'number' } }, required: ['q'] },
    internal: 'search',
    destructive: false
  },
  {
    name: 'vault_generate_document',
    description: 'Generate a new document from a prompt',
    inputSchema: { type: 'object', properties: { prompt: { type: 'string' }, outputPath: { type: 'string' } }, required: ['prompt'] },
    internal: 'generate_document',
    destructive: false
  },
  {
    name: 'vault_transform_document',
    description: 'Transform an existing document',
    inputSchema: { type: 'object', properties: { inputPath: { type: 'string' }, instruction: { type: 'string' } }, required: ['inputPath', 'instruction'] },
    internal: 'transform_document',
    destructive: false
  }
);

function toMCPTool(tool) {
  return { name: tool.name, description: tool.description, inputSchema: tool.inputSchema };
}

function fromMCPResult(result) {
  if (!result) return { success: false, error: 'Empty result' };
  if (result.content) {
    const textContent = result.content.find(c => c.type === 'text');
    if (textContent) return { success: true, result: textContent.text };
    return { success: true, result: JSON.stringify(result.content) };
  }
  if (result.isError) return { success: false, error: JSON.stringify(result.content) };
  return { success: true, result };
}

module.exports = { VAULT_MCP_TOOLS, toMCPTool, fromMCPResult };
