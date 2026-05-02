const fileOps = require('../services/fileOps');
const { agentRegistry } = require('./registry');

const AGENT_SYSTEM_PROMPTS = {
  orchestrator: 'You are a task planner for a local AI file assistant. Break the user\'s request into discrete subtasks. Return ONLY valid JSON — no explanation, no markdown.',
  file: 'You are a file operations specialist. Execute file system operations using the provided tools. Be precise with paths. Never guess — use list_directory to verify paths exist first.',
  document: 'You are a document analysis specialist. Read documents and answer questions based strictly on their content. Quote sources. Be concise — your output feeds into a larger workflow.',
  search: 'You are a search specialist. Find relevant files and information across the indexed document library. Be concise — your output feeds into a larger workflow.',
  generation: 'You are a document generation specialist. Create, transform, or synthesize documents as instructed. Output clean Markdown. Be concise — your output feeds into a larger workflow.',
  connector: 'You are a data source specialist. Query the connected data sources (Obsidian, SQLite, Git, Email) to find relevant information. Be concise — your output feeds into a larger workflow.'
};

class AgentRunner {
  constructor(ollamaClient, modelRouter) {
    this.ollama = ollamaClient;
    this.modelRouter = modelRouter;
  }

  buildAgentSystemPrompt(agentDef, workingDirectory, context) {
    const base = AGENT_SYSTEM_PROMPTS[agentDef.type] || AGENT_SYSTEM_PROMPTS.document;
    let content = `${base}\n\nWorking directory: ${workingDirectory || process.env.HOME || '/tmp'}`;
    if (context && context.trim()) {
      content += `\n\nContext from previous agents:\n${context.slice(0, 2000)}`;
    }
    return { role: 'system', content };
  }

  async runAgent(agentType, instruction, memory, workingDirectory) {
    const start = Date.now();
    const agentDef = agentRegistry.get(agentType);

    let model;
    try {
      model = await this.modelRouter.selectModel(agentDef.modelType);
    } catch {
      model = null;
    }

    if (!model) {
      return {
        result: `[${agentType} agent: no model available]`,
        model: null,
        agentType,
        toolsUsed: [],
        duration: Date.now() - start,
        error: 'No model available'
      };
    }

    const context = memory.getAll();
    const systemPrompt = this.buildAgentSystemPrompt(agentDef, workingDirectory, context);
    const messages = [systemPrompt, { role: 'user', content: instruction }];

    let toolsUsed = [];

    try {
      const response = await this.ollama.chat(model, messages, agentDef.tools);

      if (response.message?.tool_calls && response.message.tool_calls.length > 0) {
        const toolCall = response.message.tool_calls[0];
        const toolName = toolCall.function.name;
        const toolArgs = typeof toolCall.function.arguments === 'string'
          ? JSON.parse(toolCall.function.arguments)
          : toolCall.function.arguments;

        toolsUsed.push(toolName);
        const toolResult = await fileOps.executeTool(toolName, toolArgs);

        const followUp = await this.ollama.chat(model, [
          ...messages,
          response.message,
          { role: 'tool', content: JSON.stringify(toolResult) }
        ]);

        const result = followUp.message?.content || '';
        memory.set(`${agentType}_${Date.now()}`, result);
        return { result, model, agentType, toolsUsed, duration: Date.now() - start };
      }

      const result = response.message?.content || '';
      memory.set(`${agentType}_${Date.now()}`, result);
      return { result, model, agentType, toolsUsed, duration: Date.now() - start };
    } catch (err) {
      return {
        result: `[${agentType} agent error: ${err.message}]`,
        model,
        agentType,
        toolsUsed,
        duration: Date.now() - start,
        error: err.message
      };
    }
  }

  async runParallel(tasks, memory, workingDirectory) {
    return Promise.all(tasks.map(t => this.runAgent(t.type, t.instruction, memory, workingDirectory)));
  }

  async runSequential(tasks, memory, workingDirectory) {
    const results = [];
    for (const task of tasks) {
      const result = await this.runAgent(task.type, task.instruction, memory, workingDirectory);
      if (task.id) memory.set(task.id, result.result);
      results.push(result);
    }
    return results;
  }
}

module.exports = { AgentRunner };
