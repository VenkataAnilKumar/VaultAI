const { BaseConnector } = require('./base');

class NotionConnector extends BaseConnector {
  constructor() {
    super('notion', 'Notion', 'Read pages, databases, and notes from your Notion workspace', {
      apiKey: {
        type: 'password',
        label: 'Integration Token',
        placeholder: 'secret_xxxxxxxxxxxxxxxx',
        help: 'Create an integration at notion.so/my-integrations and share pages with it'
      },
      rootPageId: {
        type: 'string',
        label: 'Root Page ID (optional)',
        placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        help: 'Restrict to a specific page or database. Leave blank to search your full workspace.'
      }
    });
    this.apiKey = null;
    this.rootPageId = null;
  }

  _headers() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    };
  }

  async _fetch(path, method = 'GET', body = null) {
    const axios = require('axios');
    const url   = `https://api.notion.com/v1${path}`;
    const opts  = { method, url, headers: this._headers(), timeout: 10000 };
    if (body) opts.data = body;
    const res = await axios(opts);
    return res.data;
  }

  async connect(config) {
    const { apiKey, rootPageId } = config;
    if (!apiKey) throw new Error('Integration token required');
    this.apiKey     = apiKey;
    this.rootPageId = rootPageId || null;
    this.config     = config;
    // Validate by fetching the bot user
    const user = await this._fetch('/users/me');
    this.connected = true;
    return {
      user: user.name || user.bot?.owner?.user?.name || 'Notion user',
      type: user.type
    };
  }

  _extractTitle(page) {
    const props = page.properties || {};
    for (const key of ['Name', 'Title', 'title', 'name']) {
      const p = props[key];
      if (p?.title?.[0]?.plain_text) return p.title[0].plain_text;
      if (p?.rich_text?.[0]?.plain_text) return p.rich_text[0].plain_text;
    }
    // Fallback: any title-type property
    for (const p of Object.values(props)) {
      if (p?.type === 'title' && p.title?.[0]?.plain_text) return p.title[0].plain_text;
    }
    return 'Untitled';
  }

  _extractText(blocks) {
    const lines = [];
    for (const b of blocks) {
      const type = b.type;
      const block = b[type];
      if (!block) continue;
      const texts = block.rich_text || block.text || [];
      const line  = texts.map(t => t.plain_text || '').join('');
      if (line) lines.push(line);
    }
    return lines.join('\n');
  }

  async list() {
    const body = {
      filter: { property: 'object', value: 'page' },
      sort: { direction: 'descending', timestamp: 'last_edited_time' },
      page_size: 30
    };
    if (this.rootPageId) body.filter = { property: 'ancestor', value: this.rootPageId };
    const data = await this._fetch('/search', 'POST', { sort: body.sort, page_size: 30 });
    return (data.results || []).map(p => ({
      id:       p.id,
      title:    this._extractTitle(p),
      type:     p.object,
      url:      p.url,
      edited:   p.last_edited_time
    }));
  }

  async read(pageId) {
    const page   = await this._fetch(`/pages/${pageId}`);
    const blocks = await this._fetch(`/blocks/${pageId}/children?page_size=100`);
    const title  = this._extractTitle(page);
    const text   = this._extractText(blocks.results || []);
    return { id: pageId, title, url: page.url, content: text, edited: page.last_edited_time };
  }

  async search(query) {
    const data = await this._fetch('/search', 'POST', {
      query,
      sort: { direction: 'descending', timestamp: 'last_edited_time' },
      page_size: 10
    });
    return (data.results || []).map(p => ({
      id:    p.id,
      title: this._extractTitle(p),
      type:  p.object,
      url:   p.url
    }));
  }

  getTools() {
    return [
      {
        type: 'function',
        function: {
          name: 'notion_list',
          description: 'List recent Notion pages and databases',
          parameters: { type: 'object', properties: {} }
        }
      },
      {
        type: 'function',
        function: {
          name: 'notion_read',
          description: 'Read the full content of a Notion page by its ID',
          parameters: { type: 'object', properties: { id: { type: 'string', description: 'Page ID' } }, required: ['id'] }
        }
      },
      {
        type: 'function',
        function: {
          name: 'notion_search',
          description: 'Search Notion pages and databases by text',
          parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] }
        }
      }
    ];
  }
}

module.exports = { NotionConnector };
