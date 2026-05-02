const { VaultMCPServer } = require('./server');
const { VaultMCPClient } = require('./client');

class MCPRegistry {
  constructor() {
    this.mcpServer = new VaultMCPServer();
    this.mcpClient = new VaultMCPClient();
  }

  async startServer(transport, port) { return this.mcpServer.start(transport, port); }
  async stopServer() { return this.mcpServer.stop(); }
  isServerRunning() { return this.mcpServer.running; }
  getServerPort() { return this.mcpServer.port; }
  getServerTransport() { return this.mcpServer.transportType; }
  getServerConfig(transport, port) { return this.mcpServer.getConfig(transport, port); }

  async connectExternal(config) { return this.mcpClient.connect(config); }
  async disconnectExternal(name) { return this.mcpClient.disconnect(name); }
  listExternal() { return this.mcpClient.list(); }
  getExternalTools() { return this.mcpClient.getAllTools(); }

  async callExternalTool(namespacedName, args) {
    const found = this.mcpClient.findServer(namespacedName);
    if (!found) throw new Error(`Cannot resolve tool: ${namespacedName}`);
    return this.mcpClient.callTool(found.serverName, found.toolName, args);
  }
}

const mcpRegistry = new MCPRegistry();
module.exports = { mcpRegistry, MCPRegistry };
