---
description: "Scaffold a new VaultAI local data source connector (Obsidian, SQLite, Git, Email, Bookmarks, or custom). Generates the connector class, config schema, and registration."
name: "New Connector"
argument-hint: "Describe the connector: e.g. A connector for local Apple Notes export (.xml files)"
agent: "agent"
---

Create a new VaultAI connector based on this description: $input

Follow this exact pattern:

**File**: `src/webapp/server/connectors/<name>.js`

```js
import { BaseConnector } from './base.js';

export class <Name>Connector extends BaseConnector {
  constructor() {
    super({
      name: '<name>',
      displayName: '<Display Name>',
      description: '<One-line description of what this connector reads>',
      configSchema: {
        type: 'object',
        required: ['<requiredField>'],
        properties: {
          '<requiredField>': { type: 'string', description: '<what to enter>' },
        },
      },
    });
  }

  async connect(config) {
    // validate config, verify the path/file exists
    // store config on this instance
    // return true on success, throw on failure
  }

  async disconnect() {
    // clean up any open handles
  }

  async isConnected() {
    // return boolean
  }

  async list() {
    // return ConnectorItem[]: [{ id, name, type, metadata }]
  }

  async read(query) {
    // return ConnectorResult[]: [{ id, content, metadata, source }]
  }

  async search(query) {
    // return ConnectorResult[]: semantically or textually relevant items
  }

  // Only implement write() if this connector supports it
  // async write(data) { ... }
}
```

**Privacy rules**:
- Only read from local files or local processes — no HTTP calls to external services
- Never log document content to console
- Validate all paths with `path.resolve` and check they stay within configured root

**After creating the file**, also:
1. Import and register the new connector in `server/connectors/registry.js`
2. Add the connector name to the `connectorList` initial state in the Zustand store
