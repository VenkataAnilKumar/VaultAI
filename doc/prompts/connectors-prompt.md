# Vault AI — Connectors Build Prompt

Add local data source connectors to an existing Vault AI build.
Paste into Replit Agent after the base app is running.

---

```
Extend Vault AI with a Connectors system — letting the AI read from and write 
to local data sources beyond the file system. All connectors are local-first: 
no OAuth, no cloud APIs, no data egress.

---

## REPO STRUCTURE

All new files go under: VaultAI/src/webapp/

New server directories:
  server/connectors/
    base.js           # Abstract connector interface
    registry.js       # Connector registration + management
    obsidian.js       # Obsidian vault connector
    sqlite.js         # SQLite database connector
    git.js            # Git repository connector
    email.js          # Local email archive connector
    bookmarks.js      # Browser bookmarks connector

New route:
  server/routes/connectors.js

New UI components:
  client/src/components/connectors/
    ConnectorsPanel.jsx
    ConnectorCard.jsx
    ConnectorConfigForm.jsx
    ConnectorQueryInput.jsx

---

## SERVER — server/connectors/base.js

BaseConnector class (abstract):

  constructor(name, displayName, description, configSchema):
    this.name = name
    this.displayName = displayName
    this.description = description
    this.configSchema = configSchema
    this.connected = false
    this.config = null
  
  async connect(config):    // MUST override
    throw new Error('connect() not implemented')
  
  async disconnect():
    this.connected = false
    this.config = null
  
  async isConnected():
    return this.connected
  
  async list():             // MUST override — list available items
    throw new Error('list() not implemented')
  
  async read(identifier):   // MUST override — read specific item
    throw new Error('read() not implemented')
  
  async search(query):      // MUST override — search across items
    throw new Error('search() not implemented')
  
  async write(data):        // OPTIONAL — not all connectors support write
    throw new Error('write() not supported by this connector')
  
  getTools():               // Returns MCP/Ollama tool definitions for this connector
    Return array of tool definitions using this.name as prefix

---

## SERVER — server/connectors/obsidian.js

Extends BaseConnector.

Config schema: { vaultPath: string }

connect(config):
  Verify vaultPath exists and is a directory
  Check for .obsidian/ folder to confirm it's a vault
  Set this.connected = true

list():
  Walk vaultPath recursively
  Find all .md files
  For each: parse YAML frontmatter (tags, aliases, created, modified)
  Return: [{ name, path, tags[], created, modified, size }]

read(notePath):
  Read file at notePath
  Parse frontmatter (js-yaml)
  Extract [[wikilinks]] from body
  Return: { title, frontmatter, body, wikilinks[], path }

search(query):
  Text search across all .md files (case-insensitive)
  Score by: title match (3x), tag match (2x), body match (1x)
  Return: top 10 [{ name, path, excerpt, score }]

write(title, content, tags[]):
  Create frontmatter: { tags, created: now }
  Write to vaultPath/title.md
  Return: { path, created: true }

getTools():
  Return tools: obsidian_list, obsidian_read, obsidian_search, obsidian_write

---

## SERVER — server/connectors/sqlite.js

Extends BaseConnector.

Config schema: { dbPath: string, allowWrite: boolean (default: false) }
Dependencies: better-sqlite3 (already installed), OllamaClient, ModelRouter

connect(config):
  Open DB with better-sqlite3
  List all tables + schemas
  Store schema summary for NL→SQL context
  Return: { tables: [{ name, columns[], rowCount }] }

list():
  Return all tables with column info and row counts

read(tableName, limit = 50):
  SELECT * FROM tableName LIMIT limit
  Return: { table: tableName, columns[], rows[], rowCount }

search(naturalLanguageQuery):
  1. Build schema context string from stored schema
  2. Ask model: "Convert to SQL for this schema: {schema}\n\nQuestion: {query}"
  3. Parse returned SQL — validate it's a SELECT (no writes unless allowWrite)
  4. Execute query via better-sqlite3
  5. Return: { sql, rows[], columns[], rowCount }

getTools():
  Return tools: sqlite_list_tables, sqlite_query, sqlite_read_table

---

## SERVER — server/connectors/git.js

Extends BaseConnector.

Config schema: { repoPath: string }
Dependencies: simple-git npm package

connect(config):
  Verify repoPath is a git repo (check .git/ exists)
  Initialize simple-git instance
  Return: { branch, lastCommit, remotes[] }

list():
  Get last 20 commits: hash, message, author, date, files changed
  Return: commits[]

read(commitHash):
  Get full commit details: message, author, date, diff, files[]
  Return: { hash, message, author, date, diff, filesChanged[] }

search(query):
  Search commit messages containing query
  Also search file names in commits
  Return: matching commits[]

getRecentActivity(days = 7):
  Get all commits from last N days
  Group by day
  Return: { days: [{ date, commits[] }] }

getDiff(fromHash, toHash):
  Get diff between two commits
  Return: { files[], additions, deletions, diff }

getTools():
  Return tools: git_log, git_read_commit, git_search, git_diff, git_recent

---

## SERVER — server/connectors/email.js

Extends BaseConnector.

Config schema: { archivePath: string, format: 'mbox' | 'eml' | 'maildir' }
Dependencies: mailparser npm package

connect(config):
  Verify archivePath exists
  Parse format from config or detect from path
  For mbox: count messages (rough count by "From " line count)
  Return: { format, messageCount (approximate) }

list(limit = 50, offset = 0):
  Parse mbox/eml headers (not full body for speed)
  Return: [{ id, subject, from, date, hasAttachments }]

read(messageId):
  Parse full message including body
  Strip HTML to plain text (use html-to-text)
  Return: { subject, from, to, date, body, attachments[] }

search(query, dateRange):
  Text search across parsed messages
  Filter by dateRange if provided
  Return: [{ id, subject, from, date, excerpt }]

getTools():
  Return tools: email_list, email_read, email_search

---

## SERVER — server/connectors/bookmarks.js

Extends BaseConnector.

Config schema: { browser: 'chrome' | 'firefox' | 'safari', profilePath: string }

connect(config):
  Locate bookmarks file based on browser + profilePath
  Chrome: Bookmarks JSON file
  Firefox: places.sqlite
  Safari: Bookmarks.plist
  Parse and cache bookmark tree
  Return: { count, folders[] }

list():
  Return flat list of all bookmarks: [{ title, url, folder, added }]

search(query):
  Search titles and URLs (case-insensitive)
  Return: matching bookmarks[]

getTools():
  Return tools: bookmarks_list, bookmarks_search

---

## SERVER — server/connectors/registry.js

ConnectorRegistry class:

  constructor():
    this.connectors = new Map()     // name → connector class
    this.active = new Map()         // name → connected instance
    registerBuiltins()              // register all 5 connectors above

  register(ConnectorClass):
    this.connectors.set(ConnectorClass.prototype.name, ConnectorClass)

  async connect(name, config):
    ConnectorClass = this.connectors.get(name)
    instance = new ConnectorClass()
    result = await instance.connect(config)
    this.active.set(name, instance)
    Return: { name, connected: true, ...result }

  async disconnect(name):
    instance = this.active.get(name)
    await instance.disconnect()
    this.active.delete(name)

  get(name): return this.active.get(name)
  
  list():
    Return all registered connectors with:
    { name, displayName, description, connected: this.active.has(name) }

  getActiveTools():
    Collect getTools() from all active connectors
    Return merged tool array

---

## SERVER — server/routes/connectors.js

Mount at /api/connectors

GET /api/connectors
  Return: registry.list()

POST /api/connectors/connect
  Body: { name, config }
  result = await registry.connect(name, config)
  Return: result

POST /api/connectors/disconnect
  Body: { name }
  await registry.disconnect(name)
  Return: { success: true }

GET /api/connectors/:name/list
  connector = registry.get(name)
  items = await connector.list()
  Return: { items }

POST /api/connectors/:name/query
  Body: { query }
  connector = registry.get(name)
  results = await connector.search(query)
  Return: { results }

GET /api/connectors/:name/status
  connector = registry.get(name)
  connected = await connector.isConnected()
  Return: { name, connected }

---

## CHAT INTEGRATION

In server/routes/chat.js, merge active connector tools into fileTools before 
calling Ollama:

  allTools = [...fileTools, ...connectorRegistry.getActiveTools()]
  response = await ollama.chat(model, messages, allTools)

Add connector tool results to the tool execution handler:
  If toolName starts with a connector prefix (obsidian_, sqlite_, git_, email_):
    Find connector from registry by prefix
    Execute tool on connector instance
    Return result

---

## CLIENT — client/src/components/connectors/ConnectorCard.jsx

Props: { name, displayName, description, connected, itemCount }

UI:
  Icon (based on connector name) + displayName
  Status badge: "Connected" (green) or "Not connected" (gray)
  If connected: item count + "Query" button
  If not connected: "Connect" button → opens ConnectorConfigForm
  "Disconnect" button (when connected)

---

## CLIENT — client/src/components/connectors/ConnectorConfigForm.jsx

Props: { connector, onConnect, onCancel }

Renders config fields dynamically from connector.configSchema:
  string fields → text input
  boolean fields → toggle
  path fields → text input with "Browse" hint

"Test Connection" button → POST /api/connectors/connect, show result
"Save" button → saves config, closes form

---

## CLIENT — client/src/components/connectors/ConnectorsPanel.jsx

Collapsible side panel or full page accessible from sidebar nav.

Header: "Connectors" + count badge of active connectors

List of ConnectorCards for all 5 built-in connectors.
Active connectors shown first with green status.

When a connector is connected:
  Show quick query input: "Ask [ConnectorName]..."
  Recent queries list

---

## STORE UPDATES

Add to useStore.js:
  connectors: []          // from GET /api/connectors on load
  activeConnectors: []    // connected connector names
  setConnectors: (list) => set({ connectors: list })
  setActiveConnectors: (names) => set({ activeConnectors: names })

---

## NEW DEPENDENCIES (add to server package.json)

  simple-git          (git connector)
  js-yaml             (obsidian frontmatter parsing)
  mailparser          (email parsing)
  html-to-text        (strip HTML from emails)

better-sqlite3 is already installed — reuse for sqlite connector.

---

## IMPORTANT REQUIREMENTS

1. All connectors are READ-ONLY by default
   Write operations require explicit allowWrite: true in config
   Write operations must show confirmation dialog

2. Connector config is stored in local SQLite (vault-ai-vectors.db)
   Not in env files or cloud — completely local

3. Connector tools are namespaced by prefix to avoid collision:
   obsidian_*, sqlite_*, git_*, email_*, bookmarks_*

4. If a connector fails during tool call, return error result
   Do not crash the whole chat request

5. No connector should auto-connect on startup
   User must explicitly connect each source
```
