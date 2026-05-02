# Vault AI — MCP Build Prompt

Add Model Context Protocol (MCP) support to an existing Vault AI build.
Paste into Replit Agent after the base app and connectors are running.

---

```
Extend Vault AI with full MCP (Model Context Protocol) support.
Vault AI acts as BOTH an MCP server (exposing its tools to external AI clients 
like Claude Desktop) AND an MCP client (connecting to external MCP servers to 
extend its own capabilities).

---

## REPO STRUCTURE

All new files go under: VaultAI/src/webapp/

New server directory:
  server/mcp/
    server.js       # Vault AI as MCP server (exposes vault tools)
    client.js       # Vault AI as MCP client (connects to external servers)
    tools.js        # Tool format conversion utilities
    registry.js     # MCP server connection registry

New route:
  server/routes/mcp.js

New UI components:
  client/src/components/mcp/
    MCPPanel.jsx
    MCPServerCard.jsx
    MCPAddServerForm.jsx
    MCPToolBadge.jsx

---

## DEPENDENCIES

Add to server package.json:
  @modelcontextprotocol/sdk    # Official MCP TypeScript SDK

---

## SERVER — server/mcp/tools.js

Tool format conversion utilities.

VAULT_MCP_TOOLS array — map all Vault AI tools to MCP format:

toMCPTool(internalTool):
  Returns MCP-formatted tool:
  {
    name: "vault_" + internalTool.name,
    description: internalTool.description,
    inputSchema: {
      type: "object",
      properties: { ...internalTool.parameters },
      required: internalTool.required || []
    }
  }

fromMCPResult(mcpResult):
  Normalize MCP CallToolResult to internal format
  Handle content types: text, image, error
  For text: return { success: true, result: content.text }
  For error: return { success: false, error: content.text }

VAULT_TOOL_HANDLERS map — maps vault tool names to API endpoints:
  vault_list_directory    → GET /api/files?path=
  vault_read_file         → GET /api/files/read?path=
  vault_search            → GET /api/search?q=
  vault_move_file         → POST /api/files/move (requires confirm)
  vault_copy_file         → POST /api/files/copy
  vault_delete_file       → POST /api/files/delete (requires confirm)
  vault_create_folder     → POST /api/files/folder
  vault_rename_file       → POST /api/files/rename
  vault_generate_document → POST /api/generate/document
  vault_transform_document → POST /api/generate/transform
  vault_extract_data      → POST /api/generate/extract
  vault_run_workflow      → POST /api/agents/run

---

## SERVER — server/mcp/server.js

Import: @modelcontextprotocol/sdk/server, tools.js

VaultMCPServer class:

  constructor(vaultApiBaseUrl = 'http://localhost:3001'):
    this.baseUrl = vaultApiBaseUrl
    this.server = null
    this.running = false

  start(transport = 'sse', port = 3002):
    
    If transport === 'stdio':
      Use StdioServerTransport from MCP SDK
    
    If transport === 'sse':
      Create SSE server on given port
      Use SSEServerTransport from MCP SDK
    
    Initialize MCP Server:
      new Server({ name: 'vault-ai', version: '1.0.0' }, {
        capabilities: { tools: {} }
      })
    
    Register tool handlers:
      server.setRequestHandler(ListToolsRequestSchema, () => ({
        tools: VAULT_MCP_TOOLS.map(toMCPTool)
      }))
      
      server.setRequestHandler(CallToolRequestSchema, async (req) => {
        toolName = req.params.name              // e.g. "vault_read_file"
        args = req.params.arguments
        
        internalName = toolName.replace('vault_', '')
        
        Check DESTRUCTIVE_TOOLS:
          If destructive: return confirmation_required response
          (MCP client must call vault_confirm with pendingActionId)
        
        Execute by calling Vault AI API:
          endpoint = VAULT_TOOL_HANDLERS[toolName]
          result = await axios.get/post(this.baseUrl + endpoint, args)
          Return: fromMCPResult(result.data)
      })
    
    Connect transport + start server
    this.running = true
    Return: { port, transport, toolCount: VAULT_MCP_TOOLS.length }

  stop():
    Close server connection
    this.running = false

  getConfig(transport, port):
    Return Claude Desktop config snippet:
    If stdio: { command: "node", args: ["path/to/mcp/server.js"], env: {} }
    If sse: { url: "http://localhost:{port}/sse" }

---

## SERVER — server/mcp/client.js

Import: @modelcontextprotocol/sdk/client, StdioClientTransport

VaultMCPClient class:

  constructor():
    this.servers = new Map()   // name → { client, tools[] }

  async connect(serverConfig):
    serverConfig: { name, command, args[], env{} }
    
    transport = new StdioClientTransport({
      command: serverConfig.command,
      args: serverConfig.args,
      env: { ...process.env, ...serverConfig.env }
    })
    
    client = new Client({ name: 'vault-ai-client', version: '1.0.0' }, {
      capabilities: {}
    })
    
    await client.connect(transport)
    
    Discover tools:
      response = await client.listTools()
      tools = response.tools
    
    this.servers.set(serverConfig.name, { client, tools, config: serverConfig })
    Return: { name, connected: true, toolCount: tools.length, tools }

  async disconnect(serverName):
    server = this.servers.get(serverName)
    await server.client.close()
    this.servers.delete(serverName)

  async callTool(serverName, toolName, args):
    server = this.servers.get(serverName)
    result = await server.client.callTool({ name: toolName, arguments: args })
    Return: fromMCPResult(result)

  list():
    Return Array.from(this.servers.entries()).map(([name, { tools, config }]) => ({
      name, toolCount: tools.length, tools, config
    }))

  getAllTools():
    Collect all tools from all servers
    Namespace: serverName + "__" + toolName to avoid collision
    Return: flat array of { namespacedName, description, schema, serverName }

  findServer(namespacedToolName):
    Split on "__" to get serverName + toolName
    Return: { serverName, toolName }

---

## SERVER — server/mcp/registry.js

MCPRegistry class:
  Singleton that holds both MCP server and client instances.
  
  constructor():
    this.mcpServer = new VaultMCPServer()
    this.mcpClient = new VaultMCPClient()
  
  // Server methods
  startServer(transport, port): mcpServer.start(transport, port)
  stopServer(): mcpServer.stop()
  isServerRunning(): mcpServer.running
  getServerConfig(transport, port): mcpServer.getConfig(transport, port)
  
  // Client methods
  connectExternal(config): mcpClient.connect(config)
  disconnectExternal(name): mcpClient.disconnect(name)
  listExternal(): mcpClient.list()
  getExternalTools(): mcpClient.getAllTools()
  callExternalTool(namespacedName, args):
    { serverName, toolName } = mcpClient.findServer(namespacedName)
    return mcpClient.callTool(serverName, toolName, args)

---

## SERVER — server/routes/mcp.js

Mount at /api/mcp

GET /api/mcp/server/status
  Return: { running: registry.isServerRunning(), port, transport }

POST /api/mcp/server/start
  Body: { transport: 'stdio' | 'sse', port: 3002 }
  result = await registry.startServer(transport, port)
  Return: result

POST /api/mcp/server/stop
  await registry.stopServer()
  Return: { stopped: true }

GET /api/mcp/server/config
  Query: ?transport=sse&port=3002
  Return: { config: registry.getServerConfig(transport, port), snippet: string }

GET /api/mcp/servers
  Return: registry.listExternal()

POST /api/mcp/connect
  Body: { name, command, args[], env{} }
  result = await registry.connectExternal({ name, command, args, env })
  Return: result

POST /api/mcp/disconnect
  Body: { name }
  await registry.disconnectExternal(name)
  Return: { success: true }

GET /api/mcp/tools
  Return: { 
    vault: VAULT_MCP_TOOLS,
    external: registry.getExternalTools()
  }

POST /api/mcp/call
  Body: { toolName, args }
  result = await registry.callExternalTool(toolName, args)
  Return: result

---

## CHAT INTEGRATION

In server/routes/chat.js, merge external MCP tools into available tools:

  externalTools = mcpRegistry.getExternalTools()
    .map(t => ({
      type: 'function',
      function: {
        name: t.namespacedName,
        description: t.description,
        parameters: t.schema
      }
    }))
  
  allTools = [...fileTools, ...connectorTools, ...externalTools]
  response = await ollama.chat(model, messages, allTools)

In tool execution handler, add MCP tool routing:
  If toolName contains "__":
    result = await mcpRegistry.callExternalTool(toolName, args)
  Else:
    result = await fileOps.executeTool(toolName, args)

---

## CLIENT — client/src/components/mcp/MCPServerCard.jsx

Props: { name, toolCount, tools[], connected, isVaultServer }

UI:
  Server icon + name
  Status badge: Connected (green) / Stopped (gray) / Error (red)
  Tool count badge: "14 tools"
  
  If isVaultServer:
    Transport selector: [stdio] [SSE]
    Port input (default: 3002)
    Start/Stop toggle button
    "Copy Config" button → copies Claude Desktop JSON snippet
  
  Else (external server):
    Command display: monospace, truncated
    "View Tools" → expandable tool list
    "Disconnect" button

---

## CLIENT — client/src/components/mcp/MCPAddServerForm.jsx

Form for connecting a new external MCP server:

Fields:
  Name (text): "brave-search"
  Command (text): "npx"
  Args (text, comma-separated): "-y, @modelcontextprotocol/server-brave-search"
  Environment variables (key-value pairs): 
    Add row button → key input + value input + remove button

Built-in templates (quick-select buttons):
  [Brave Search]   → fills command/args/env for brave search MCP
  [GitHub]         → fills command/args for github MCP
  [PostgreSQL]     → fills command/args for postgres MCP
  [Fetch]          → fills command/args for fetch MCP

"Test & Connect" button
"Cancel" button

---

## CLIENT — client/src/components/mcp/MCPPanel.jsx

Two-section panel:

SECTION 1 — Vault AI MCP Server
  Subheading: "Expose Vault AI tools to Claude Desktop and other AI apps"
  MCPServerCard (isVaultServer=true)
  
  When server is running:
    Show connected clients count (if detectable)
    Show Claude Desktop config code block
    "Copy config" button

SECTION 2 — External MCP Servers
  Subheading: "Add external capabilities to Vault AI"
  List of MCPServerCards for connected servers
  "Add Server" button → opens MCPAddServerForm as modal
  
  If no servers connected:
    Empty state: "Connect MCP servers to extend Vault AI with web search, 
    databases, APIs, and more"
    Quick-add buttons for popular servers

---

## CLIENT — client/src/components/mcp/MCPToolBadge.jsx

Small badge shown in chat header when external MCP tools are available:

  Icon: plug/connector icon
  Text: "{N} MCP tools"
  Click: expand list of available MCP tools with server attribution
  
  Tooltip per tool: "toolName — from serverName"

---

## STORE UPDATES

Add to useStore.js:
  mcpServerRunning: false
  externalMCPServers: []
  externalMCPTools: []
  setMCPServerRunning: (val) => set({ mcpServerRunning: val })
  setExternalMCPServers: (servers) => set({ externalMCPServers: servers })
  setExternalMCPTools: (tools) => set({ externalMCPTools: tools })

On app load: GET /api/mcp/server/status and GET /api/mcp/servers

---

## IMPORTANT REQUIREMENTS

1. MCP server must only bind to localhost — never expose to network

2. Destructive Vault AI tools (delete, bulk move) require confirmation
   even when called via MCP. Return a special MCP response indicating
   confirmation is needed, not silently execute.

3. External MCP server env vars (API keys) are stored in local config only
   Never log them, never include in API responses

4. MCP server and client are independent — either can be used without the other

5. MCP SDK uses TypeScript — if using CommonJS, import with:
   const { Server } = require('@modelcontextprotocol/sdk/server/index.js')
   const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js')

6. Handle MCP connection errors gracefully — if external server fails to start,
   show error in MCPServerCard, do not crash Vault AI

7. Tool name collision handling: external MCP tools are namespaced as
   serverName__toolName — never add bare tool names from external servers
```
