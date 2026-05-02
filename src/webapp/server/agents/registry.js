const { FILE_TOOLS } = require('../tools/fileTools');

const READ_ONLY_TOOLS = FILE_TOOLS.filter(t =>
  ['list_directory', 'read_file', 'search_files', 'get_file_info'].includes(t.function.name)
);

const AGENT_DEFINITIONS = [
  {
    type: 'orchestrator',
    description: 'Decomposes complex tasks and coordinates other agents',
    modelType: 'generate',
    tools: []
  },
  {
    type: 'file',
    description: 'Performs file system operations: move, copy, delete, rename, create folders',
    modelType: 'file_op',
    tools: FILE_TOOLS
  },
  {
    type: 'document',
    description: 'Reads, summarizes, and answers questions about documents',
    modelType: 'doc_qa',
    tools: READ_ONLY_TOOLS
  },
  {
    type: 'search',
    description: 'Searches across indexed documents semantically',
    modelType: 'embedding',
    tools: READ_ONLY_TOOLS
  },
  {
    type: 'generation',
    description: 'Generates, transforms, and synthesizes documents',
    modelType: 'generate',
    tools: READ_ONLY_TOOLS
  },
  {
    type: 'connector',
    description: 'Queries connected data sources (Obsidian, SQLite, Git)',
    modelType: 'doc_qa',
    tools: []
  }
];

class AgentRegistry {
  constructor() {
    this.agents = new Map();
    for (const def of AGENT_DEFINITIONS) {
      this.agents.set(def.type, def);
    }
  }

  register(def) {
    this.agents.set(def.type, def);
  }

  get(type) {
    return this.agents.get(type) || this.agents.get('document');
  }

  list() {
    return Array.from(this.agents.values());
  }
}

const agentRegistry = new AgentRegistry();
module.exports = { agentRegistry, AgentRegistry };
