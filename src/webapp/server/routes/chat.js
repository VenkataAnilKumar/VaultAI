const express = require('express');
const router = express.Router();
const { OllamaClient, ModelRouter } = require('../services/ollama');
const fileOps = require('../services/fileOps');
const { FILE_TOOLS, DESTRUCTIVE_TOOLS } = require('../tools/fileTools');
const { OrchestratorAgent } = require('../agents/orchestrator');
const { connectorRegistry } = require('../connectors/registry');
const { mcpRegistry } = require('../mcp/registry');

const ollama      = new OllamaClient();
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

function getTools(connectorRegistry, mcpRegistry) {
  const connectorTools    = connectorRegistry.getActiveTools();
  const externalMCPTools  = mcpRegistry.getExternalTools().map(t => ({
    type: 'function',
    function: { name: t.namespacedName, description: t.description, parameters: t.schema || {} }
  }));
  return [...FILE_TOOLS, ...connectorTools, ...externalMCPTools];
}

const connectorPrefixes = ['obsidian_', 'sqlite_', 'git_', 'email_', 'bookmarks_'];

async function executeToolCalls(toolCalls) {
  return Promise.all(toolCalls.map(async (tc) => {
    const toolCallId = tc.id || `call_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const toolName   = tc.function.name;
    const toolArgs   = typeof tc.function.arguments === 'string'
      ? JSON.parse(tc.function.arguments)
      : tc.function.arguments;

    let result;
    try {
      if (connectorPrefixes.some(p => toolName.startsWith(p))) {
        result = await connectorRegistry.executeConnectorTool(toolName, toolArgs);
      } else if (toolName.includes('__')) {
        result = await mcpRegistry.callExternalTool(toolName, toolArgs);
      } else {
        result = await fileOps.executeTool(toolName, toolArgs);
      }
    } catch (err) {
      result = { success: false, error: err.message };
    }
    return { msg: { role: 'tool', tool_call_id: toolCallId, content: JSON.stringify(result) }, toolName, result };
  }));
}

function checkDestructive(toolCalls) {
  for (const tc of toolCalls) {
    const toolName = tc.function.name;
    const toolArgs = typeof tc.function.arguments === 'string'
      ? JSON.parse(tc.function.arguments) : tc.function.arguments;
    const isBulkMove = toolName === 'bulk_move' && toolArgs.files?.length > 3;
    if (DESTRUCTIVE_TOOLS.includes(toolName) || isBulkMove) {
      return {
        requiresConfirmation: true,
        pendingAction: {
          function: { name: toolName, arguments: toolArgs },
          description: `${toolName.replace(/_/g, ' ')} on ${(toolArgs.path ? [toolArgs.path] : (toolArgs.files || [])).join(', ')}`,
          affectedFiles: toolArgs.path ? [toolArgs.path] : (toolArgs.files || [])
        },
        message: 'I need your confirmation before proceeding with this operation.'
      };
    }
  }
  return null;
}

// ── POST /api/chat  (non-streaming, kept for workflow mode + confirm) ──────────
router.post('/', async (req, res) => {
  try {
    const { message, history = [], workingDirectory, modelOverride, workflowMode = 'simple' } = req.body;
    if (!message) return res.status(400).json({ error: 'message is required' });

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
    const model    = modelOverride || await modelRouter.selectModel(taskType);
    if (!model) return res.status(503).json({ error: 'No AI model available. Please start Ollama and pull a model.' });

    const allTools    = getTools(connectorRegistry, mcpRegistry);
    const systemPrompt = buildSystemPrompt(workingDirectory);
    const messages     = [systemPrompt, ...history, { role: 'user', content: message }];
    const response     = await ollama.chat(model, messages, allTools);

    if (response.message?.tool_calls?.length) {
      const destructive = checkDestructive(response.message.tool_calls);
      if (destructive) return res.json({ ...destructive, model });

      const toolResultMessages = await executeToolCalls(response.message.tool_calls);
      const followUp = await ollama.chat(model, [
        ...messages, response.message, ...toolResultMessages.map(t => t.msg)
      ]);
      return res.json({
        response: followUp.message?.content || '',
        toolsUsed: toolResultMessages.map(t => t.toolName),
        toolResult: toolResultMessages[0]?.result,
        model
      });
    }

    return res.json({ response: response.message?.content || '', toolsUsed: [], model });
  } catch (err) {
    console.error('Chat error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/chat/stream  (SSE streaming) ────────────────────────────────────
// Protocol:
//   data: {"type":"token","content":"..."}\n\n   — partial text token
//   data: {"type":"tool","name":"...","status":"running"}\n\n — tool executing
//   data: {"type":"done","toolsUsed":[...],"model":"..."}\n\n — finished
//   data: {"type":"error","message":"..."}\n\n  — fatal error
router.post('/stream', async (req, res) => {
  const { message, history = [], workingDirectory, modelOverride } = req.body;
  if (!message) return res.status(400).json({ error: 'message is required' });

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  function send(obj) {
    res.write(`data: ${JSON.stringify(obj)}\n\n`);
  }

  try {
    const taskType = modelRouter.classifyTask(message);
    const model    = modelOverride || await modelRouter.selectModel(taskType);
    if (!model) { send({ type: 'error', message: 'No AI model available. Please start Ollama.' }); return res.end(); }

    const allTools     = getTools(connectorRegistry, mcpRegistry);
    const systemPrompt = buildSystemPrompt(workingDirectory);
    const messages     = [systemPrompt, ...history, { role: 'user', content: message }];

    // Stream the first AI response
    const firstResponse = await ollama.chatStream(model, messages, allTools, send);

    if (firstResponse.message?.tool_calls?.length) {
      const toolCalls   = firstResponse.message.tool_calls;
      const destructive = checkDestructive(toolCalls);

      if (destructive) {
        send({ type: 'confirmation', ...destructive, model });
        return res.end();
      }

      // Notify client which tools are running
      for (const tc of toolCalls) {
        send({ type: 'tool', name: tc.function.name, status: 'running' });
      }

      const toolResultMessages = await executeToolCalls(toolCalls);

      // Notify tool completion
      for (const tr of toolResultMessages) {
        send({ type: 'tool', name: tr.toolName, status: 'done' });
      }

      // Stream the follow-up response
      const followUpMessages = [
        ...messages, firstResponse.message, ...toolResultMessages.map(t => t.msg)
      ];
      await ollama.chatStream(model, followUpMessages, [], send);

      send({ type: 'done', toolsUsed: toolResultMessages.map(t => t.toolName), model });
    } else {
      send({ type: 'done', toolsUsed: [], model });
    }
  } catch (err) {
    send({ type: 'error', message: err.message });
  }
  res.end();
});

// ── POST /api/chat/confirm ────────────────────────────────────────────────────
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
