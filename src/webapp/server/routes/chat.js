const express = require('express');
const router = express.Router();
const { OllamaClient, ModelRouter } = require('../services/ollama');
const fileOps = require('../services/fileOps');
const { FILE_TOOLS, DESTRUCTIVE_TOOLS } = require('../tools/fileTools');
const { OrchestratorAgent } = require('../agents/orchestrator');
const { connectorRegistry } = require('../connectors/registry');
const { mcpRegistry } = require('../mcp/registry');

const ollama = new OllamaClient();
const modelRouter = new ModelRouter(ollama);

function buildSystemPrompt(workingDirectory) {
  return {
    role: 'system',
    content: `You are Vault AI, a local AI assistant for file and document management.

Current working directory: ${workingDirectory || process.env.HOME || '/tmp'}

Rules:
- Use provided tools to perform all file operations
- For destructive operations, the system will ask for confirmation automatically
- Always confirm what you did after completing an operation
- When reading documents, quote relevant sections in your answer
- If a file path is ambiguous, use list_directory to verify it exists first
- Be concise and action-oriented
- Never make up file paths or pretend files exist
- All your operations run locally — user's data never leaves their machine
- For document generation requests: generate the content, save it to the user's working directory, and tell them the filename
- For transformation requests: transform the content and ask if they want to save it`
  };
}

router.post('/', async (req, res) => {
  try {
    const { message, history = [], workingDirectory, modelOverride, workflowMode = 'simple' } = req.body;

    // Try multi-agent orchestration first
    if (workflowMode === 'multi-agent') {
      const orchestrator = new OrchestratorAgent(ollama, modelRouter);
      if (orchestrator.isComplexTask(message)) {
        try {
          const result = await orchestrator.run(message, workingDirectory);
          if (result) return res.json(result);
        } catch (err) {
          console.warn('Orchestrator failed, falling back to single-agent:', err.message);
        }
      }
    }

    const taskType = modelRouter.classifyTask(message);
    const model = modelOverride || await modelRouter.selectModel(taskType);

    if (!model) {
      return res.status(503).json({ error: 'No AI model available. Please start Ollama and pull a model.' });
    }

    // Merge all available tools
    const connectorTools = connectorRegistry.getActiveTools();
    const externalMCPTools = mcpRegistry.getExternalTools().map(t => ({
      type: 'function',
      function: { name: t.namespacedName, description: t.description, parameters: t.schema || {} }
    }));
    const allTools = [...FILE_TOOLS, ...connectorTools, ...externalMCPTools];

    const systemPrompt = buildSystemPrompt(workingDirectory);
    const messages = [systemPrompt, ...history, { role: 'user', content: message }];

    const response = await ollama.chat(model, messages, allTools);

    if (response.message?.tool_calls && response.message.tool_calls.length > 0) {
      const toolCall = response.message.tool_calls[0];
      const toolName = toolCall.function.name;
      const toolArgs = typeof toolCall.function.arguments === 'string'
        ? JSON.parse(toolCall.function.arguments)
        : toolCall.function.arguments;

      const isDestructive = DESTRUCTIVE_TOOLS.includes(toolName);
      const isBulkMove = toolName === 'bulk_move' && toolArgs.files && toolArgs.files.length > 3;

      if (isDestructive || isBulkMove) {
        const affectedFiles = toolArgs.path ? [toolArgs.path] : (toolArgs.files || []);
        return res.json({
          requiresConfirmation: true,
          pendingAction: {
            function: { name: toolName, arguments: toolArgs },
            description: `${toolName.replace(/_/g, ' ')} on ${affectedFiles.join(', ')}`,
            affectedFiles
          },
          model,
          message: 'I need your confirmation before proceeding with this operation.'
        });
      }

      let result;
      // Route to connector tools
      const connectorPrefixes = ['obsidian_', 'sqlite_', 'git_', 'email_', 'bookmarks_'];
      const isConnectorTool = connectorPrefixes.some(p => toolName.startsWith(p));
      // Route to external MCP tools
      const isMCPTool = toolName.includes('__');

      if (isConnectorTool) {
        result = await connectorRegistry.executeConnectorTool(toolName, toolArgs);
      } else if (isMCPTool) {
        result = await mcpRegistry.callExternalTool(toolName, toolArgs);
      } else {
        result = await fileOps.executeTool(toolName, toolArgs);
      }

      const followUpMessages = [
        ...messages,
        response.message,
        { role: 'tool', content: JSON.stringify(result) }
      ];

      const followUp = await ollama.chat(model, followUpMessages);
      return res.json({
        response: followUp.message?.content || '',
        toolsUsed: [toolName],
        toolResult: result,
        model
      });
    }

    return res.json({
      response: response.message?.content || '',
      toolsUsed: [],
      model
    });
  } catch (err) {
    console.error('Chat error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post('/confirm', async (req, res) => {
  try {
    const { pendingAction } = req.body;
    const { name, arguments: args } = pendingAction.function;
    const result = await fileOps.executeTool(name, args);
    res.json({ success: result.success, result: result.result, error: result.error });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
