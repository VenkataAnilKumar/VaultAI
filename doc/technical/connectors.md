# Vault AI — Connectors

**Version:** 1.0  
**Date:** 2026-05-02

---

## Overview

Connectors extend Vault AI beyond the file system — letting the AI read from and write to external local data sources. All connectors are **local-first**: no OAuth, no cloud APIs, no data egress. They read from local files, local databases, or local services only.

---

## Connector Interface

Every connector implements a standard base interface:

```
BaseConnector:
  name: string                    // "obsidian", "sqlite", "git"
  displayName: string             // "Obsidian Vault"
  description: string
  configSchema: JSONSchema        // what the user needs to configure
  
  async connect(config): boolean  // verify connection, return success
  async disconnect(): void
  async isConnected(): boolean
  async read(query): ConnectorResult[]
  async write(data): boolean      // optional — not all connectors support write
  async list(): ConnectorItem[]   // list available items (files, tables, branches)
  async search(query): ConnectorResult[]
```

---

## Available Connectors

### 1. Obsidian Connector
**File:** `server/connectors/obsidian.js`

Reads notes from a local Obsidian vault directory.

**Config:**
```json
{ "vaultPath": "/Users/name/Documents/MyVault" }
```

**Capabilities:**
- List all notes with frontmatter metadata
- Read note content (Markdown)
- Search by tag, folder, or content
- Follow [[wikilinks]] between notes
- Read backlinks for a given note
- Write new notes to vault

**Example queries:**
```
"Find all Obsidian notes tagged #project-x"
"What do my notes say about the Henderson meeting?"
"Create a new note summarizing today's tasks"
```

---

### 2. SQLite Connector
**File:** `server/connectors/sqlite.js`

Query local SQLite databases using natural language.

**Config:**
```json
{ "dbPath": "/Users/name/data/myapp.db" }
```

**Capabilities:**
- List all tables and schemas
- Natural language → SQL query (via LLM)
- Execute read-only queries
- Return results as structured data
- Explain query results in plain language

**Safety:** Read-only by default. Write requires explicit `allowWrite: true` in config.

**Example queries:**
```
"How many users signed up last month?"
"Show me all orders over $500 from the orders table"
"What are the top 10 products by revenue?"
```

---

### 3. Git Connector
**File:** `server/connectors/git.js`

Read git repository history, diffs, and code.

**Config:**
```json
{ "repoPath": "/Users/name/projects/my-app" }
```

**Capabilities:**
- List recent commits with messages and authors
- Read commit diffs
- List branches and tags
- Read file content at specific commits
- Search commit messages
- List changed files between branches

**Example queries:**
```
"What changed in the last 10 commits?"
"Show me all commits that touched auth.js"
"What did we ship last week?"
"Find commits mentioning 'bug fix' in the last month"
```

---

### 4. Email Connector
**File:** `server/connectors/email.js`

Read local email archives (.mbox, .eml files).

**Config:**
```json
{ 
  "archivePath": "/Users/name/Mail/Archive.mbox",
  "format": "mbox"
}
```

**Capabilities:**
- List emails by date range, sender, or subject
- Read email body content
- Search by keyword across all emails
- Extract attachments list
- Summarize email threads

**Supported formats:** .mbox, .eml, Maildir directory

**Example queries:**
```
"Find all emails from client@company.com about the contract"
"Summarize the email thread about the Q3 project"
"What were the key action items from last week's emails?"
```

---

### 5. Browser Bookmarks Connector
**File:** `server/connectors/bookmarks.js`

Index and search saved browser bookmarks.

**Config:**
```json
{ 
  "browser": "chrome",
  "profilePath": "/Users/name/Library/Application Support/Google/Chrome/Default"
}
```

**Capabilities:**
- List all bookmarks with titles and URLs
- Search bookmarks by keyword
- Read cached page content (if available)
- Group bookmarks by folder

**Supported browsers:** Chrome, Firefox, Safari, Edge

**Example queries:**
```
"Find my bookmarks about machine learning"
"What did I save from GitHub last month?"
```

---

### 6. Calendar Connector
**File:** `server/connectors/calendar.js`

Read local .ics calendar files.

**Config:**
```json
{ "calendarPath": "/Users/name/Documents/calendar.ics" }
```

**Capabilities:**
- List upcoming events
- Read event details (attendees, location, description)
- Find events by date range or keyword
- Extract action items from event descriptions

**Example queries:**
```
"What meetings do I have next week?"
"Find all events related to Project Alpha"
"When is my next dentist appointment?"
```

---

### 7. PostgreSQL Connector (Local)
**File:** `server/connectors/postgres.js`

Connect to a locally running PostgreSQL instance.

**Config:**
```json
{
  "host": "localhost",
  "port": 5432,
  "database": "mydb",
  "user": "postgres"
}
```

**Capabilities:** Same as SQLite connector — natural language to SQL, read-only by default.

---

## Connector Registry

**File:** `server/connectors/registry.js`

```
ConnectorRegistry class:
  register(connector): add connector class
  connect(name, config): instantiate + connect
  disconnect(name): disconnect and remove
  get(name): return active connector instance
  list(): return all registered + connection status
  listActive(): return only connected connectors
  getCapabilities(): return combined tool list from all active connectors
```

---

## API Routes

### server/routes/connectors.js

| Method | Route | Description |
|---|---|---|
| GET | /api/connectors | List all available connectors + status |
| POST | /api/connectors/connect | Connect a connector with config |
| POST | /api/connectors/disconnect | Disconnect a connector |
| GET | /api/connectors/:name/list | List items in connected source |
| POST | /api/connectors/:name/query | Natural language query |
| GET | /api/connectors/:name/status | Connection health check |

**POST /api/connectors/connect body:**
```json
{
  "name": "obsidian",
  "config": { "vaultPath": "/Users/name/Documents/MyVault" }
}
```

---

## UI: Connectors Panel

### ConnectorsPanel.jsx
- List all available connectors with icons
- Status badge: Connected / Disconnected
- "Connect" button → opens config form per connector
- Each connected connector shows: item count, last synced

### ConnectorCard.jsx
- Connector icon + name + description
- Config fields rendered from configSchema
- Test Connection button
- Connected state: item count + "Query" shortcut

### ConnectorQuery.jsx
- Natural language input scoped to a specific connector
- "Ask Obsidian..." / "Query SQLite..." etc.
- Results rendered as list or table depending on connector type

---

## Connector Tool Integration

When connectors are active, they register additional tools into the agent tool set:

```
obsidian_read(noteName)
obsidian_search(query, tags[])
obsidian_write(title, content)
sqlite_query(naturalLanguageQuestion)
git_log(limit, branch)
git_diff(commitHash)
email_search(query, dateRange)
calendar_events(dateRange)
```

These tools are automatically available to all agents when the connector is connected.

---

## Privacy Guarantee

All connectors operate entirely locally:
- No data sent to external APIs
- Queries run on the user's machine
- Connector config stored in local SQLite (not cloud)
- User explicitly connects each source — no auto-discovery
