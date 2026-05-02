const { fromMCPResult } = require('./tools');

class VaultMCPClient {
  constructor() {
    this.servers = new Map();
  }

  async connect(serverConfig) {
    try {
      const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
      const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');

      const transport = new StdioClientTransport({
        command: serverConfig.command,
        args: serverConfig.args || [],
        env: { ...process.env, ...(serverConfig.env || {}) }
      });

      const client = new Client(
        { name: 'vault-ai-client', version: '1.0.0' },
        { capabilities: {} }
      );

      await client.connect(transport);

      const response = await client.listTools();
      const tools = response.tools || [];

      this.servers.set(serverConfig.name, { client, tools, config: serverConfig });
      return { name: serverConfig.name, connected: true, toolCount: tools.length, tools };
    } catch (err) {
      throw new Error(`Failed to connect to MCP server '${serverConfig.name}': ${err.message}`);
    }
  }

  async disconnect(serverName) {
    const server = this.servers.get(serverName);
    if (server) {
      try { await server.client.close(); } catch {}
      this.servers.delete(serverName);
    }
  }

  async callTool(serverName, toolName, args) {
    const server = this.servers.get(serverName);
    if (!server) throw new Error(`Server '${serverName}' not connected`);
    const result = await server.client.callTool({ name: toolName, arguments: args });
    return fromMCPResult(result);
  }

  list() {
    return Array.from(this.servers.entries()).map(([name, { tools, config }]) => ({
      name, toolCount: tools.length, tools, config: { ...config, env: undefined }
    }));
  }

  getAllTools() {
    const all = [];
    for (const [serverName, { tools }] of this.servers.entries()) {
      for (const tool of tools) {
        all.push({
          namespacedName: `${serverName}__${tool.name}`,
          description: tool.description,
          schema: tool.inputSchema,
          serverName,
          toolName: tool.name
        });
      }
    }
    return all;
  }

  findServer(namespacedName) {
    const idx = namespacedName.indexOf('__');
    if (idx < 0) return null;
    return { serverName: namespacedName.slice(0, idx), toolName: namespacedName.slice(idx + 2) };
  }
}

module.exports = { VaultMCPClient };
