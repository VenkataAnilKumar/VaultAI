const fs = require('fs');
const path = require('path');
const { BaseConnector } = require('./base');

class EmailConnector extends BaseConnector {
  constructor() {
    super('email', 'Email Archive', 'Search and read local email archives (.mbox, .eml)', {
      archivePath: { type: 'string', label: 'Archive Path', placeholder: '/home/user/mail/inbox.mbox' },
      format: { type: 'string', label: 'Format (mbox/eml)', default: 'mbox' }
    });
    this.messages = [];
  }

  async connect(config) {
    if (!fs.existsSync(config.archivePath)) throw new Error(`Path does not exist: ${config.archivePath}`);
    this.config = config;
    this.connected = true;
    this.messages = [];
    if (config.format === 'mbox' || config.archivePath.endsWith('.mbox')) {
      await this._parseMbox(config.archivePath);
    } else {
      await this._parseEmlDir(config.archivePath);
    }
    return { format: config.format, messageCount: this.messages.length };
  }

  async _parseMbox(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const rawMessages = content.split(/^From /m).filter(Boolean);
    const simpleMailparser = this._simpleParser();
    this.messages = rawMessages.slice(0, 200).map((raw, i) => simpleMailparser(raw, i));
  }

  async _parseEmlDir(dirPath) {
    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.eml'));
    const simpleMailparser = this._simpleParser();
    this.messages = files.slice(0, 200).map((f, i) => {
      const content = fs.readFileSync(path.join(dirPath, f), 'utf-8');
      return simpleMailparser(content, i);
    });
  }

  _simpleParser() {
    return (raw, id) => {
      const lines = raw.split('\n');
      const headers = {};
      let bodyStart = 0;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim() === '') { bodyStart = i + 1; break; }
        const match = lines[i].match(/^([^:]+):\s*(.+)/);
        if (match) headers[match[1].toLowerCase()] = match[2].trim();
      }
      const body = lines.slice(bodyStart).join('\n').slice(0, 2000);
      return {
        id: String(id),
        subject: headers.subject || '(no subject)',
        from: headers.from || '',
        to: headers.to || '',
        date: headers.date || '',
        body,
        hasAttachments: raw.includes('Content-Disposition: attachment')
      };
    };
  }

  async list(limit = 50, offset = 0) {
    return this.messages.slice(offset, offset + limit).map(m => ({
      id: m.id, subject: m.subject, from: m.from, date: m.date, hasAttachments: m.hasAttachments
    }));
  }

  async read(messageId) {
    return this.messages.find(m => m.id === messageId) || null;
  }

  async search(query) {
    const q = query.toLowerCase();
    return this.messages.filter(m =>
      m.subject.toLowerCase().includes(q) ||
      m.from.toLowerCase().includes(q) ||
      m.body.toLowerCase().includes(q)
    ).slice(0, 20).map(m => ({
      id: m.id,
      subject: m.subject,
      from: m.from,
      date: m.date,
      excerpt: m.body.slice(0, 200)
    }));
  }

  getTools() {
    return [
      { type: 'function', function: { name: 'email_list', description: 'List emails from the archive', parameters: { type: 'object', properties: { limit: { type: 'number' } } } } },
      { type: 'function', function: { name: 'email_read', description: 'Read a specific email by ID', parameters: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } } },
      { type: 'function', function: { name: 'email_search', description: 'Search emails by subject, sender, or content', parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } } }
    ];
  }
}

module.exports = { EmailConnector };
