class BaseConnector {
  constructor(name, displayName, description, configSchema) {
    this.name = name;
    this.displayName = displayName;
    this.description = description;
    this.configSchema = configSchema;
    this.connected = false;
    this.config = null;
  }

  async connect(config) {
    throw new Error('connect() not implemented');
  }

  async disconnect() {
    this.connected = false;
    this.config = null;
  }

  async isConnected() {
    return this.connected;
  }

  async list() {
    throw new Error('list() not implemented');
  }

  async read(identifier) {
    throw new Error('read() not implemented');
  }

  async search(query) {
    throw new Error('search() not implemented');
  }

  async write(data) {
    throw new Error('write() not supported by this connector');
  }

  getTools() {
    return [];
  }
}

module.exports = { BaseConnector };
