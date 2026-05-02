const path = require('path');
const { BaseConnector } = require('./base');

class SQLiteConnector extends BaseConnector {
  constructor() {
    super('sqlite', 'SQLite Database', 'Query a local SQLite database with natural language', {
      dbPath: { type: 'string', label: 'Database Path', placeholder: '/home/user/mydb.sqlite' },
      allowWrite: { type: 'boolean', label: 'Allow Write Operations', default: false }
    });
    this.db = null;
    this.schema = [];
  }

  async connect(config) {
    const Database = require('better-sqlite3');
    if (!require('fs').existsSync(config.dbPath)) throw new Error(`Database not found: ${config.dbPath}`);
    this.db = new Database(config.dbPath, { readonly: !config.allowWrite });
    this.config = config;
    const tables = this.db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    this.schema = tables.map(t => {
      const cols = this.db.prepare(`PRAGMA table_info("${t.name}")`).all();
      const count = this.db.prepare(`SELECT COUNT(*) as c FROM "${t.name}"`).get();
      return { name: t.name, columns: cols.map(c => ({ name: c.name, type: c.type })), rowCount: count?.c || 0 };
    });
    this.connected = true;
    return { tables: this.schema };
  }

  async list() {
    return this.schema;
  }

  async read(tableName, limit = 50) {
    const rows = this.db.prepare(`SELECT * FROM "${tableName}" LIMIT ?`).all(limit);
    const cols = this.db.prepare(`PRAGMA table_info("${tableName}")`).all().map(c => c.name);
    return { table: tableName, columns: cols, rows, rowCount: rows.length };
  }

  async search(query) {
    const schemaContext = this.schema.map(t =>
      `Table "${t.name}": ${t.columns.map(c => `${c.name} (${c.type})`).join(', ')}`
    ).join('\n');

    return { query, schemaContext, message: 'SQL search requires AI — use natural language in chat' };
  }

  executeSQL(sql) {
    const trimmed = sql.trim().toUpperCase();
    if (!this.config.allowWrite && !trimmed.startsWith('SELECT')) {
      throw new Error('Write operations are disabled. Enable allowWrite in connector config.');
    }
    const stmt = this.db.prepare(sql);
    if (trimmed.startsWith('SELECT')) {
      return stmt.all();
    }
    const info = stmt.run();
    return { changes: info.changes, lastInsertRowid: info.lastInsertRowid };
  }

  getTools() {
    return [
      { type: 'function', function: { name: 'sqlite_list_tables', description: 'List all tables in the SQLite database with their schema', parameters: { type: 'object', properties: {} } } },
      { type: 'function', function: { name: 'sqlite_read_table', description: 'Read rows from a table', parameters: { type: 'object', properties: { table: { type: 'string' }, limit: { type: 'number' } }, required: ['table'] } } },
      { type: 'function', function: { name: 'sqlite_query', description: 'Execute a SQL SELECT query', parameters: { type: 'object', properties: { sql: { type: 'string' } }, required: ['sql'] } } }
    ];
  }
}

module.exports = { SQLiteConnector };
