const { randomUUID } = require('crypto');

class AgentMemory {
  constructor() {
    this.store = new Map();
    this.runId = randomUUID();
  }

  set(taskId, result) {
    this.store.set(taskId, { result, timestamp: Date.now() });
  }

  get(taskId) {
    return this.store.get(taskId)?.result || null;
  }

  getAll() {
    const entries = Array.from(this.store.entries());
    return entries
      .map(([id, { result }]) => `[${id}]: ${JSON.stringify(result).slice(0, 500)}`)
      .join('\n');
  }

  buildContext(taskIds) {
    const parts = taskIds
      .map(id => this.store.get(id))
      .filter(Boolean)
      .map(({ result }) => JSON.stringify(result));
    return parts.join('\n').slice(0, 3000);
  }

  clear() {
    this.store.clear();
  }
}

module.exports = { AgentMemory };
