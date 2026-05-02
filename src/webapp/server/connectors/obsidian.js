const fs = require('fs');
const path = require('path');
const { BaseConnector } = require('./base');

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return { frontmatter: {}, body: content };
  try {
    const yaml = require('js-yaml');
    return { frontmatter: yaml.load(match[1]) || {}, body: content.slice(match[0].length).trim() };
  } catch {
    return { frontmatter: {}, body: content };
  }
}

function extractWikilinks(text) {
  const matches = text.match(/\[\[([^\]]+)\]\]/g) || [];
  return matches.map(m => m.slice(2, -2));
}

class ObsidianConnector extends BaseConnector {
  constructor() {
    super('obsidian', 'Obsidian', 'Read notes from an Obsidian vault', {
      vaultPath: { type: 'string', label: 'Vault Path', placeholder: '/home/user/MyVault' }
    });
  }

  async connect(config) {
    const { vaultPath } = config;
    if (!fs.existsSync(vaultPath)) throw new Error(`Path does not exist: ${vaultPath}`);
    if (!fs.statSync(vaultPath).isDirectory()) throw new Error('Path must be a directory');
    this.config = config;
    this.connected = true;
    const notes = this._walkNotes(vaultPath);
    return { vaultPath, noteCount: notes.length };
  }

  _walkNotes(dir) {
    const results = [];
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const e of entries) {
        const full = path.join(dir, e.name);
        if (e.isDirectory() && !e.name.startsWith('.')) results.push(...this._walkNotes(full));
        else if (e.name.endsWith('.md')) results.push(full);
      }
    } catch {}
    return results;
  }

  async list() {
    const notes = this._walkNotes(this.config.vaultPath);
    return notes.map(p => {
      const stat = fs.statSync(p);
      const content = fs.readFileSync(p, 'utf-8');
      const { frontmatter } = parseFrontmatter(content);
      return {
        name: path.basename(p, '.md'),
        path: p,
        tags: frontmatter.tags || [],
        created: frontmatter.created || stat.birthtime.toISOString(),
        modified: stat.mtime.toISOString(),
        size: stat.size
      };
    });
  }

  async read(notePath) {
    const content = fs.readFileSync(notePath, 'utf-8');
    const { frontmatter, body } = parseFrontmatter(content);
    return {
      title: path.basename(notePath, '.md'),
      frontmatter,
      body,
      wikilinks: extractWikilinks(body),
      path: notePath
    };
  }

  async search(query) {
    const notes = this._walkNotes(this.config.vaultPath);
    const q = query.toLowerCase();
    const results = [];
    for (const p of notes) {
      try {
        const content = fs.readFileSync(p, 'utf-8');
        const { frontmatter, body } = parseFrontmatter(content);
        const name = path.basename(p, '.md').toLowerCase();
        const tags = (frontmatter.tags || []).join(' ').toLowerCase();
        let score = 0;
        if (name.includes(q)) score += 3;
        if (tags.includes(q)) score += 2;
        if (body.toLowerCase().includes(q)) score += 1;
        if (score > 0) {
          const idx = body.toLowerCase().indexOf(q);
          const excerpt = idx >= 0 ? body.slice(Math.max(0, idx - 50), idx + 150) : body.slice(0, 200);
          results.push({ name: path.basename(p, '.md'), path: p, excerpt, score });
        }
      } catch {}
    }
    return results.sort((a, b) => b.score - a.score).slice(0, 10);
  }

  async write(title, content, tags = []) {
    if (!this.config?.vaultPath) throw new Error('Not connected');
    let yaml;
    try { yaml = require('js-yaml'); } catch { yaml = null; }
    const fm = yaml ? `---\ntags: ${JSON.stringify(tags)}\ncreated: ${new Date().toISOString()}\n---\n\n` : '';
    const filePath = path.join(this.config.vaultPath, `${title}.md`);
    fs.writeFileSync(filePath, fm + content);
    return { path: filePath, created: true };
  }

  getTools() {
    return [
      { type: 'function', function: { name: 'obsidian_list', description: 'List all notes in the Obsidian vault', parameters: { type: 'object', properties: {} } } },
      { type: 'function', function: { name: 'obsidian_read', description: 'Read a specific Obsidian note', parameters: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] } } },
      { type: 'function', function: { name: 'obsidian_search', description: 'Search notes in the Obsidian vault', parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } } },
      { type: 'function', function: { name: 'obsidian_write', description: 'Create a new note in the Obsidian vault', parameters: { type: 'object', properties: { title: { type: 'string' }, content: { type: 'string' }, tags: { type: 'array', items: { type: 'string' } } }, required: ['title', 'content'] } } }
    ];
  }
}

module.exports = { ObsidianConnector };
