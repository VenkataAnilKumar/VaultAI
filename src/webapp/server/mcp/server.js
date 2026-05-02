const { VAULT_MCP_TOOLS, toMCPTool } = require('./tools');
const fileOps = require('../services/fileOps');

class VaultMCPServer {
  constructor(vaultApiBaseUrl = 'http://localhost:3001') {
    this.baseUrl = vaultApiBaseUrl;
    this.server = null;
    this.transport = null;
    this.running = false;
    this.port = null;
    this.transportType = null;
  }

  async start(transport = 'sse', port = 3002) {
    if (this.running) await this.stop();

    try {
      const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
      const { ListToolsRequestSchema, CallToolRequestSchema } = require('@modelcontextprotocol/sdk/types.js');

      this.server = new Server(
        { name: 'vault-ai', version: '1.0.0' },
        { capabilities: { tools: {} } }
      );

      this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
        tools: VAULT_MCP_TOOLS.map(toMCPTool)
      }));

      this.server.setRequestHandler(CallToolRequestSchema, async (req) => {
        const { name, arguments: args } = req.params;
        const toolDef = VAULT_MCP_TOOLS.find(t => t.name === name);

        if (!toolDef) {
          return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
        }

        if (toolDef.destructive) {
          return {
            content: [{ type: 'text', text: JSON.stringify({ confirmation_required: true, tool: name, args }) }],
            isError: false
          };
        }

        try {
          const result = await fileOps.executeTool(toolDef.internal, args);
          return { content: [{ type: 'text', text: JSON.stringify(result.result || result) }] };
        } catch (err) {
          return { content: [{ type: 'text', text: err.message }], isError: true };
        }
      });

      if (transport === 'sse') {
        const http = require('http');
        const { SSEServerTransport } = require('@modelcontextprotocol/sdk/server/sse.js');

        const httpServer = http.createServer(async (req, res) => {
          res.setHeader('Access-Control-Allow-Origin', '*');
          if (req.url === '/sse' && req.method === 'GET') {
            const sseTransport = new SSEServerTransport('/messages', res);
            await this.server.connect(sseTransport);
          } else if (req.url === '/messages' && req.method === 'POST') {
            const body = await new Promise(resolve => {
              let data = '';
              req.on('data', c => data += c);
              req.on('end', () => resolve(data));
            });
            res.writeHead(200);
            res.end();
          } else {
            res.writeHead(404);
            res.end('Not found');
          }
        });

        await new Promise((resolve, reject) => {
          httpServer.listen(port, '127.0.0.1', resolve);
          httpServer.on('error', reject);
        });

        this.httpServer = httpServer;
      } else {
        const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
        const stdioTransport = new StdioServerTransport();
        await this.server.connect(stdioTransport);
      }

      this.running = true;
      this.port = port;
      this.transportType = transport;
      return { port, transport, toolCount: VAULT_MCP_TOOLS.length };
    } catch (err) {
      throw new Error(`Failed to start MCP server: ${err.message}`);
    }
  }

  async stop() {
    try {
      if (this.httpServer) {
        await new Promise(resolve => this.httpServer.close(resolve));
        this.httpServer = null;
      }
      if (this.server) {
        await this.server.close().catch(() => {});
        this.server = null;
      }
    } catch {}
    this.running = false;
  }

  getConfig(transport = 'sse', port = 3002) {
    if (transport === 'stdio') {
      return {
        mcpServers: {
          'vault-ai': {
            command: 'node',
            args: [require('path').resolve(__dirname, 'server.js')],
            env: {}
          }
        }
      };
    }
    return {
      mcpServers: {
        'vault-ai': { url: `http://localhost:${port}/sse` }
      }
    };
  }
}

module.exports = { VaultMCPServer };
