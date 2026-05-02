# Vault AI — Multi-Agent Build Prompt

Add multi-agent orchestration to an existing Vault AI build.
Paste into Replit Agent after the base app is running.

---

```
Extend Vault AI with a multi-agent orchestration layer. The base app already 
handles single-model file operations, document Q&A, and generation. Add an 
Orchestrator Agent that decomposes complex requests into subtasks and delegates 
them to specialized agents running in parallel or sequence.

---

## REPO STRUCTURE

All new files go under: VaultAI/src/webapp/

New server directories:
  server/agents/
    orchestrator.js     # Task decomposition + workflow management
    registry.js         # Agent definitions registry
    runner.js           # Agent execution engine
    memory.js           # Shared context between agents

New route:
  server/routes/agents.js

New UI components:
  client/src/components/agents/
    AgentWorkflowPanel.jsx
    AgentStep.jsx
    WorkflowToggle.jsx

---

## SERVER — server/agents/memory.js

AgentMemory class (in-memory, scoped per workflow run):

  constructor():
    this.store = new Map()
    this.runId = generateId()
  
  set(taskId, result):
    this.store.set(taskId, { result, timestamp: Date.now() })
  
  get(taskId):
    return this.store.get(taskId)?.result || null
  
  getAll():
    return Array.from(this.store.entries())
      .map(([id, { result }]) => `[${id}]: ${JSON.stringify(result)}`)
      .join('\n')
  
  buildContext(taskIds[]):
    Filter to requested taskIds
    Concatenate results
    Truncate to 3000 chars to fit context window
    Return: formatted string
  
  clear():
    this.store.clear()

---

## SERVER — server/agents/registry.js

AGENT_DEFINITIONS array — define these agents:

1. orchestrator
   description: "Decomposes complex tasks and coordinates other agents"
   modelType: "generate"   (uses largest model)
   tools: []               (no file tools — planning only)

2. file
   description: "Performs file system operations"
   modelType: "file_op"
   tools: [all fileTools]

3. document
   description: "Reads, summarizes, and answers questions about documents"
   modelType: "doc_qa"
   tools: [read_file, list_directory]

4. search
   description: "Searches across indexed documents semantically"
   modelType: "embedding"
   tools: [search_files, list_directory]

5. generation
   description: "Generates, transforms, and synthesizes documents"
   modelType: "generate"
   tools: [read_file, list_directory]

6. connector
   description: "Queries connected data sources (Obsidian, SQLite, Git)"
   modelType: "doc_qa"
   tools: []  (connector tools injected dynamically)

AgentRegistry class:
  register(def): push to registry
  get(type): find by type
  list(): return all
  On module load: register all AGENT_DEFINITIONS

---

## SERVER — server/agents/runner.js

Import: OllamaClient, ModelRouter, fileOps, fileTools, AgentRegistry, AgentMemory

AgentRunner class:
  constructor(ollamaClient, modelRouter)

  async runAgent(agentType, instruction, memory, workingDirectory):
    1. agentDef = AgentRegistry.get(agentType)
    2. model = await modelRouter.selectModel(agentDef.modelType)
    3. context = memory.getAll()
    4. systemPrompt = buildAgentSystemPrompt(agentDef, workingDirectory, context)
    5. messages = [systemPrompt, { role: 'user', content: instruction }]
    6. response = await ollama.chat(model, messages, agentDef.tools)
    7. Handle tool_calls same as chat.js (execute via fileOps)
       Skip destructive confirmation in sub-agents — orchestrator handles this
    8. memory.set(agentType + '_' + Date.now(), response.message.content)
    9. Return { result: response.message.content, model, agentType, toolsUsed }

  async runParallel(tasks[], memory, workingDirectory):
    results = await Promise.all(
      tasks.map(t => runAgent(t.type, t.instruction, memory, workingDirectory))
    )
    Return: results[]

  async runSequential(tasks[], memory, workingDirectory):
    results = []
    for task of tasks:
      result = await runAgent(task.type, task.instruction, memory, workingDirectory)
      memory.set(task.id, result.result)
      results.push(result)
    Return: results[]

  buildAgentSystemPrompt(agentDef, workingDirectory, context):
    Return system message with:
    - Agent role and focus
    - Working directory
    - Prior agent results as context (if any)
    - "Be concise — your output feeds into a larger workflow"

---

## SERVER — server/agents/orchestrator.js

Import: OllamaClient, ModelRouter, AgentRunner, AgentMemory, fileTools

OrchestratorAgent class:
  constructor(ollamaClient, modelRouter)

  isComplexTask(message):
    Keywords indicating multi-step: "and then", "after that", "also", 
    "compare", "all files", "across", "summarize all", "organize and"
    File count heuristic: if task involves multiple files
    Return: boolean

  async decompose(message, workingDirectory):
    model = await modelRouter.selectModel('generate')
    prompt = `
      Break this task into subtasks for a file AI assistant.
      Return ONLY valid JSON:
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
      
      Working directory: ${workingDirectory}
      Task: ${message}
    `
    response = await ollama.generate(model, prompt)
    Try JSON.parse(response)
    Fallback: single task of type 'document' with original message
    Return: tasks[]

  buildExecutionPlan(tasks[]):
    Separate into:
      parallel: tasks with empty dependsOn[]
      sequential: tasks with dependsOn[] (must run after dependencies)
    Return: { parallel, sequential }

  async run(message, workingDirectory, onProgress):
    memory = new AgentMemory()
    runner = new AgentRunner(ollama, modelRouter)
    steps = []

    1. If NOT isComplexTask(message):
       Return null  (caller falls back to regular chat)

    2. tasks = await decompose(message, workingDirectory)
    3. { parallel, sequential } = buildExecutionPlan(tasks)

    4. onProgress({ phase: 'planning', tasks })

    5. If parallel.length > 0:
       onProgress({ phase: 'parallel', agents: parallel.map(t => t.type) })
       parallelResults = await runner.runParallel(parallel, memory, workingDirectory)
       steps.push(...parallelResults)

    6. For each sequential task:
       onProgress({ phase: 'running', agent: task.type })
       result = await runner.runAgent(task.type, task.instruction, memory, workingDirectory)
       steps.push(result)

    7. Synthesize final response:
       model = await modelRouter.selectModel('generate')
       context = memory.getAll()
       synthesis = await ollama.chat(model, [
         { role: 'system', content: 'Synthesize agent results into a clear final answer.' },
         { role: 'user', content: `Original request: ${message}\n\nAgent results:\n${context}` }
       ])

    8. Return {
         response: synthesis.message.content,
         workflow: { steps, agentsUsed: steps.map(s => s.agentType), parallel: parallel.length > 0 }
       }

---

## SERVER — server/routes/agents.js

Import: OrchestratorAgent, ModelRouter, OllamaClient

POST /api/agents/run
Body: { message, workingDirectory, stream }

1. orchestrator = new OrchestratorAgent(ollama, modelRouter)
2. isComplex = orchestrator.isComplexTask(message)
3. If NOT complex: return { fallback: true } (frontend uses regular chat)

4. If stream: set SSE headers
   onProgress = (update) => res.write('data: ' + JSON.stringify(update) + '\n\n')
   Else: onProgress = noop

5. result = await orchestrator.run(message, workingDirectory, onProgress)
6. If stream: res.write('data: ' + JSON.stringify({ done: true, ...result }) + '\n\n')
   Else: return result

GET /api/agents
Return: AgentRegistry.list()

---

## CLIENT — client/src/components/agents/WorkflowToggle.jsx

Simple toggle in chat header:
  State: workflowMode ('simple' | 'multi-agent') from useStore
  
  UI:
    Two buttons side by side: [Simple] [Multi-Agent]
    Active button: blue background
    Inactive: gray
    Tooltip: "Multi-Agent: Vault AI uses multiple specialized models for complex tasks"

---

## CLIENT — client/src/components/agents/AgentStep.jsx

Props: { agentType, status, result, model, toolsUsed, duration }

Status states:
  'waiting'  → gray spinner icon
  'running'  → animated blue spinner
  'done'     → green checkmark
  'error'    → red X

UI:
  Left: status icon + agent name (capitalize type)
  Right: model badge + duration (e.g. "2.3s")
  Expandable: click to show agent's output text + tools used

---

## CLIENT — client/src/components/agents/AgentWorkflowPanel.jsx

Props: { workflow, isRunning }
workflow: { steps[], parallel, agentsUsed[] }

UI:
  Header: "Running workflow..." while isRunning, "Workflow complete" when done
  
  Parallel agents section (if parallel > 0):
    "Running in parallel:" label
    Horizontal row of AgentStep cards
  
  Sequential agents section:
    Vertical stack of AgentStep cards
    Connecting line between steps
  
  Summary: "Used {N} agents • {total duration}ms"

Show this panel in chat when workflowMode = 'multi-agent' and response contains workflow data.

---

## CHAT INTEGRATION

In server/routes/chat.js, check workflowMode before regular chat:

POST /api/chat body now includes: workflowMode ('simple' | 'multi-agent')

If workflowMode === 'multi-agent':
  1. Try orchestrator.run()
  2. If orchestrator returns fallback:true → proceed with regular single-agent chat
  3. If orchestrator returns workflow result → return it

In client Chat.jsx:
  If response.workflow exists: show AgentWorkflowPanel above AI message
  Else: show regular MessageBubble

---

## STORE UPDATES

Add to useStore.js:
  workflowMode: 'simple'    // 'simple' | 'multi-agent'
  activeWorkflow: null       // current workflow progress
  setWorkflowMode: (mode) => set({ workflowMode: mode })
  setActiveWorkflow: (wf) => set({ activeWorkflow: wf })
  clearWorkflow: () => set({ activeWorkflow: null })

---

## SYSTEM PROMPTS FOR AGENTS

Orchestrator:
  "You are a task planner for a local AI file assistant. 
   Break the user's request into discrete subtasks.
   Return ONLY valid JSON — no explanation, no markdown."

File Agent:
  "You are a file operations specialist. Execute file system 
   operations using the provided tools. Be precise with paths.
   Never guess — use list_directory to verify paths exist first."

Document Agent:  
  "You are a document analysis specialist. Read documents and 
   answer questions based strictly on their content. Quote sources."

Generation Agent:
  "You are a document generation specialist. Create, transform,
   or synthesize documents as instructed. Output clean Markdown."

---

## IMPORTANT REQUIREMENTS

1. Orchestrator should bypass for simple single-intent requests
   Only engage multi-agent for genuinely complex multi-step tasks

2. Parallel agents must be truly independent — no shared state writes
   Only AgentMemory reads are safe during parallel execution

3. If any agent fails, continue with remaining agents
   Include error in memory context so synthesizer can note it

4. Agent tool calls should NOT trigger ConfirmDialog for destructive ops
   The orchestrator collects all planned destructive actions upfront
   and shows ONE confirmation to the user before execution begins

5. Workflow progress must stream via SSE for good UX
   User should see each agent activate in real time
```
