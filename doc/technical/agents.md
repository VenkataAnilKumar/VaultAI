# Vault AI — Multi-Agent Architecture

**Version:** 1.0  
**Date:** 2026-05-02

---

## Overview

Multi-agent enables Vault AI to decompose complex requests into subtasks and delegate them to specialized agents running in parallel or sequence. An Orchestrator Agent manages the workflow — breaking down the user's intent, assigning subtasks, collecting results, and synthesizing a final response.

---

## Why Multi-Agent

Single-model requests work well for simple tasks. But complex operations spanning multiple files, multiple operations, and multiple document types exceed what a single prompt can handle reliably.

**Example:**
```
User: "Summarize all contracts in /Legal, extract key dates 
       from each, and create a consolidated report"

Single model: struggles with context length, loses accuracy
Multi-agent:
  Agent A → reads + summarizes each contract (parallel)
  Agent B → extracts dates from each contract (parallel)
  Agent C → synthesizes A + B into final report (after A+B)
```

---

## Agent Types

| Agent | Role | Model |
|---|---|---|
| **Orchestrator** | Decomposes task, assigns subtasks, synthesizes results | Largest available |
| **File Agent** | File operations — move, copy, organize, rename | llama3.2:3b (fast) |
| **Document Agent** | Read, summarize, Q&A on document content | mistral:7b |
| **Search Agent** | Semantic + keyword search across indexed files | nomic-embed-text |
| **Generation Agent** | Draft, transform, synthesize, extract | mistral:7b / llama3.1:8b |
| **Connector Agent** | Query connectors (Obsidian, SQLite, Git, etc.) | mistral:7b |
| **MCP Agent** | Invoke external MCP server tools | Largest available |

---

## Architecture

```
User Message
     │
     ▼
┌────────────────────────────────────────────┐
│           Orchestrator Agent               │
│  1. Classify: simple or multi-step?        │
│  2. Decompose into subtasks                │
│  3. Build agent graph (parallel/sequence)  │
│  4. Dispatch subtasks to agents            │
│  5. Collect results + synthesize           │
└──┬──────────────────────────────────┬──────┘
   │                                  │
   ▼ parallel                         ▼ parallel
┌──────────┐  ┌──────────┐  ┌──────────────────┐
│   File   │  │ Document │  │    Generation    │
│  Agent   │  │  Agent   │  │     Agent        │
└──────────┘  └──────────┘  └──────────────────┘
   │                │                │
   └────────────────┴────────────────┘
                    │
                    ▼
           Shared Agent Memory
           (context passed between agents)
                    │
                    ▼
          Final synthesized response
```

---

## Components

### server/agents/orchestrator.js

```
OrchestratorAgent class:

  async run(userMessage, context):
    1. Classify: is this a multi-step task?
       Simple (single intent): bypass orchestrator → direct to correct agent
       Complex (multiple intents): proceed to decompose
    
    2. decompose(userMessage):
       Ask planning model: "Break this into ordered subtasks. 
       Return JSON: { tasks: [{ id, type, instruction, dependsOn[] }] }"
       Returns: task graph
    
    3. buildGraph(tasks):
       Identify parallel tasks (no dependencies)
       Identify sequential tasks (has dependsOn)
       Returns: { parallel: Task[][], sequential: Task[] }
    
    4. execute(graph):
       For each parallel group: run agents concurrently (Promise.all)
       For sequential tasks: run in order, pass prior results as context
       Collect all results into agentMemory
    
    5. synthesize(results, userMessage):
       Ask generation model to combine all agent results into final response
       Return: { response, agentsUsed, steps, duration }
```

### server/agents/registry.js

```
AgentRegistry class:
  Stores all available agent definitions:
  { name, type, description, modelType, tools[], maxTokens }
  
  register(agentDef): add agent to registry
  get(type): return agent definition by type
  list(): return all registered agents
  getCapabilities(): return { agentCount, types[], models[] }
```

### server/agents/runner.js

```
AgentRunner class:

  async runAgent(agentType, instruction, context, memory):
    1. Get agent def from registry
    2. Select model via ModelRouter
    3. Build agent system prompt (role + tools + context from memory)
    4. Call Ollama with agent's allowed tools
    5. Handle tool calls (same flow as chat.js)
    6. Store result in shared memory
    7. Return { result, toolsUsed, model, duration }
  
  async runParallel(tasks, memory):
    Promise.all(tasks.map(t => runAgent(t.type, t.instruction, t.context, memory)))
  
  async runSequential(tasks, memory):
    for task of tasks:
      result = await runAgent(task.type, task.instruction, task.context, memory)
      memory.store(task.id, result)
```

### server/agents/memory.js

```
AgentMemory class:
  In-memory store scoped to a single workflow run.
  
  store(taskId, result): save agent result
  get(taskId): retrieve result
  getAll(): return all results as context string
  clear(): reset for new run
  
  buildContext(taskIds[]):
    Concatenate results from specified task IDs
    Truncate to fit model context window
    Return: formatted context string
```

---

## API Routes

### server/routes/agents.js

| Method | Route | Description |
|---|---|---|
| POST | /api/agents/run | Run a multi-agent workflow |
| GET | /api/agents | List all registered agents |
| GET | /api/agents/status | Current workflow status |
| POST | /api/agents/cancel | Cancel running workflow |

**POST /api/agents/run body:**
```json
{
  "message": "Summarize all contracts and extract key dates",
  "workingDirectory": "/Documents/Legal",
  "stream": true
}
```

**Response:**
```json
{
  "response": "...",
  "workflow": {
    "steps": 3,
    "agentsUsed": ["document", "extract", "generation"],
    "duration": 12400,
    "parallel": true
  }
}
```

---

## UI: Agent Workflows Panel

### Components

**AgentWorkflowPanel.jsx**
- Shows workflow progress in real time
- Each agent as a card: name + status (waiting / running / done)
- Parallel agents shown side-by-side
- Sequential agents shown top-to-bottom
- Each card shows: model used, tools called, duration

**AgentStep.jsx**
- Individual step card
- Status indicator: spinner / checkmark / error
- Collapsible: shows agent's output when expanded

**WorkflowToggle.jsx**
- Toggle in chat header: "Simple" / "Multi-Agent"
- Simple: single model (current behavior)
- Multi-Agent: routes through orchestrator

---

## Workflow Examples

### Example 1: Research + Report
```
"Read all files in /Research and write a summary report"

Orchestrator plan:
  [parallel] Document Agent × N files → summaries
  [sequential] Generation Agent → final report from summaries
```

### Example 2: Organize + Rename
```
"Find all duplicate files in Downloads and organize by type"

Orchestrator plan:
  [parallel] File Agent → list all files
  [parallel] Search Agent → find duplicates
  [sequential] File Agent → organize (after above)
```

### Example 3: Cross-Source Analysis
```
"Compare my Obsidian notes on Project X with git commits from last week"

Orchestrator plan:
  [parallel] Connector Agent (Obsidian) → Project X notes
  [parallel] Connector Agent (Git) → last week's commits
  [sequential] Document Agent → comparison report
```

---

## Agent System Prompts

Each agent has a focused system prompt. See `doc/prompts/system-prompts.md` for full prompt text.

| Agent | Prompt Focus |
|---|---|
| Orchestrator | Task decomposition, JSON plan output |
| File Agent | File operations only, use tools, confirm destructive |
| Document Agent | Read and answer from document content only |
| Search Agent | Return ranked results with excerpts |
| Generation Agent | Generate/transform documents, save to disk |
| Connector Agent | Query external sources, return structured data |
