const { AgentRunner } = require('./runner');
const { AgentMemory } = require('./memory');

const COMPLEX_KEYWORDS = [
  'and then', 'after that', 'also', 'compare', 'all files', 'across', 'summarize all',
  'organize and', 'multiple', 'each file', 'for all', 'then save', 'then rename',
  'find and', 'read and', 'search and'
];

class OrchestratorAgent {
  constructor(ollamaClient, modelRouter) {
    this.ollama = ollamaClient;
    this.modelRouter = modelRouter;
  }

  isComplexTask(message) {
    if (!message || typeof message !== 'string') return false;
    const lower = message.toLowerCase();
    return COMPLEX_KEYWORDS.some(kw => lower.includes(kw));
  }

  async decompose(message, workingDirectory) {
    let model;
    try {
      model = await this.modelRouter.selectModel('generate');
    } catch {
      model = null;
    }

    if (!model) {
      return [{ id: 't1', type: 'document', instruction: message, dependsOn: [] }];
    }

    const prompt = `Break this task into subtasks for a local AI file assistant.
Return ONLY valid JSON with no explanation or markdown:
{
  "tasks": [
    {
      "id": "t1",
      "type": "file|document|search|generation|connector",
      "instruction": "specific instruction for this agent",
      "dependsOn": []
    }
  ]
}

Working directory: ${workingDirectory || process.env.HOME || '/tmp'}
Task: ${message}`;

    try {
      const response = await this.ollama.generate(model, prompt);
      const text = response.response || response.text || '';
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        if (parsed.tasks && Array.isArray(parsed.tasks)) {
          return parsed.tasks;
        }
      }
    } catch {
      // fallback below
    }

    return [{ id: 't1', type: 'document', instruction: message, dependsOn: [] }];
  }

  buildExecutionPlan(tasks) {
    const parallel = tasks.filter(t => !t.dependsOn || t.dependsOn.length === 0);
    const sequential = tasks.filter(t => t.dependsOn && t.dependsOn.length > 0);
    return { parallel, sequential };
  }

  async run(message, workingDirectory, onProgress = () => {}) {
    if (!this.isComplexTask(message)) return null;

    const memory = new AgentMemory();
    const runner = new AgentRunner(this.ollama, this.modelRouter);
    const steps = [];

    const tasks = await this.decompose(message, workingDirectory);
    const { parallel, sequential } = this.buildExecutionPlan(tasks);

    onProgress({ phase: 'planning', tasks });

    if (parallel.length > 0) {
      onProgress({ phase: 'parallel', agents: parallel.map(t => t.type) });
      const parallelResults = await runner.runParallel(parallel, memory, workingDirectory);
      steps.push(...parallelResults);
    }

    if (sequential.length > 0) {
      for (const task of sequential) {
        onProgress({ phase: 'running', agent: task.type });
        const result = await runner.runAgent(task.type, task.instruction, memory, workingDirectory);
        if (task.id) memory.set(task.id, result.result);
        steps.push(result);
      }
    }

    let finalResponse = steps.map(s => s.result).filter(Boolean).join('\n\n');

    try {
      const model = await this.modelRouter.selectModel('generate');
      if (model) {
        const context = memory.getAll();
        const synthesis = await this.ollama.chat(model, [
          { role: 'system', content: 'Synthesize agent results into a clear, concise final answer for the user.' },
          { role: 'user', content: `Original request: ${message}\n\nAgent results:\n${context}` }
        ]);
        finalResponse = synthesis.message?.content || finalResponse;
      }
    } catch {
      // use concatenated results
    }

    return {
      response: finalResponse,
      workflow: {
        steps,
        agentsUsed: steps.map(s => s.agentType),
        parallel: parallel.length > 0,
        parallelCount: parallel.length
      }
    };
  }
}

module.exports = { OrchestratorAgent };
