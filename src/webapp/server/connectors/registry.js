const { ObsidianConnector } = require('./obsidian');
const { SQLiteConnector } = require('./sqlite');
const { GitConnector } = require('./git');
const { EmailConnector } = require('./email');
const { BookmarksConnector } = require('./bookmarks');
const { NotionConnector } = require('./notion');
const { GitHubConnector } = require('./github');
const { BrowserHistoryConnector } = require('./browserhistory');

class ConnectorRegistry {
  constructor() {
    this.connectors = new Map();
    this.active = new Map();
    this._registerBuiltins();
  }

  _registerBuiltins() {
    for (const Cls of [ObsidianConnector, SQLiteConnector, GitConnector, EmailConnector, BookmarksConnector, NotionConnector, GitHubConnector, BrowserHistoryConnector]) {
      const instance = new Cls();
      this.connectors.set(instance.name, Cls);
    }
  }

  async connect(name, config) {
    const ConnectorClass = this.connectors.get(name);
    if (!ConnectorClass) throw new Error(`Unknown connector: ${name}`);
    const instance = new ConnectorClass();
    const result = await instance.connect(config);
    this.active.set(name, instance);
    return { name, connected: true, ...result };
  }

  async disconnect(name) {
    const instance = this.active.get(name);
    if (instance) {
      await instance.disconnect();
      this.active.delete(name);
    }
  }

  get(name) {
    return this.active.get(name);
  }

  list() {
    return Array.from(this.connectors.keys()).map(name => {
      const instance = new (this.connectors.get(name))();
      const active = this.active.get(name);
      return {
        name: instance.name,
        displayName: instance.displayName,
        description: instance.description,
        configSchema: instance.configSchema,
        connected: this.active.has(name)
      };
    });
  }

  getActiveTools() {
    const tools = [];
    for (const instance of this.active.values()) {
      tools.push(...instance.getTools());
    }
    return tools;
  }

  async executeConnectorTool(toolName, args) {
    const prefix = toolName.split('_')[0];
    const connector = this.active.get(prefix);
    if (!connector) return { success: false, error: `Connector '${prefix}' is not connected` };

    try {
      if (toolName === `${prefix}_list`) return { success: true, result: await connector.list() };
      if (toolName === `${prefix}_read`) return { success: true, result: await connector.read(args.path || args.id || args.hash) };
      if (toolName === `${prefix}_search`) return { success: true, result: await connector.search(args.query) };
      if (toolName === `${prefix}_write`) return { success: true, result: await connector.write(args.title, args.content, args.tags) };
      if (toolName === 'sqlite_query') return { success: true, result: connector.executeSQL(args.sql) };
      if (toolName === 'sqlite_read_table') return { success: true, result: await connector.read(args.table, args.limit) };
      if (toolName === 'sqlite_list_tables') return { success: true, result: await connector.list() };
      if (toolName === 'git_log') return { success: true, result: await connector.list() };
      if (toolName === 'git_read_commit') return { success: true, result: await connector.read(args.hash) };
      if (toolName === 'git_recent') return { success: true, result: await connector.getRecentActivity(args.days) };
      if (toolName === 'email_list') return { success: true, result: await connector.list(args.limit) };
      if (toolName === 'email_read') return { success: true, result: await connector.read(args.id) };
      if (toolName === 'email_search') return { success: true, result: await connector.search(args.query) };
      if (toolName === 'bookmarks_list') return { success: true, result: await connector.list() };
      if (toolName === 'bookmarks_search') return { success: true, result: await connector.search(args.query) };
      // Notion
      if (toolName === 'notion_list')   return { success: true, result: await connector.list() };
      if (toolName === 'notion_read')   return { success: true, result: await connector.read(args.id) };
      if (toolName === 'notion_search') return { success: true, result: await connector.search(args.query) };
      // GitHub
      if (toolName === 'github_list')   return { success: true, result: await connector.list() };
      if (toolName === 'github_read')   return { success: true, result: await connector.read(args.number) };
      if (toolName === 'github_search') return { success: true, result: await connector.search(args.query) };
      if (toolName === 'github_readme') return { success: true, result: await connector.getReadme() };
      // Browser History
      if (toolName === 'browserhistory_list')   return { success: true, result: await connector.list() };
      if (toolName === 'browserhistory_search') return { success: true, result: await connector.search(args.query) };
      if (toolName === 'browserhistory_top')    return { success: true, result: await connector.getTopSites(args.limit || 20) };
      return { success: false, error: `Unknown tool: ${toolName}` };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}

const connectorRegistry = new ConnectorRegistry();
module.exports = { connectorRegistry, ConnectorRegistry };
