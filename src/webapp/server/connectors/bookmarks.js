const fs = require('fs');
const path = require('path');
const { BaseConnector } = require('./base');

class BookmarksConnector extends BaseConnector {
  constructor() {
    super('bookmarks', 'Browser Bookmarks', 'Search and browse your browser bookmarks', {
      browser: { type: 'string', label: 'Browser (chrome/firefox/safari)', default: 'chrome' },
      profilePath: { type: 'string', label: 'Profile Path (leave blank for default)', placeholder: '' }
    });
    this.bookmarks = [];
  }

  _getDefaultPath(browser) {
    const home = process.env.HOME || '/home/runner';
    const paths = {
      chrome: [
        path.join(home, '.config/google-chrome/Default/Bookmarks'),
        path.join(home, 'Library/Application Support/Google/Chrome/Default/Bookmarks'),
        path.join(home, 'AppData/Local/Google/Chrome/User Data/Default/Bookmarks')
      ],
      firefox: [path.join(home, '.mozilla/firefox')],
      safari: [path.join(home, 'Library/Safari/Bookmarks.plist')]
    };
    return (paths[browser] || paths.chrome).find(p => fs.existsSync(p));
  }

  async connect(config) {
    const { browser = 'chrome', profilePath } = config;
    const bookmarksPath = profilePath || this._getDefaultPath(browser);

    if (!bookmarksPath || !fs.existsSync(bookmarksPath)) {
      throw new Error(`Bookmarks file not found. Please specify the profile path manually.`);
    }

    this.config = config;
    this.bookmarks = [];

    if (browser === 'chrome' || bookmarksPath.endsWith('Bookmarks')) {
      this._parseChromeBookmarks(bookmarksPath);
    } else {
      throw new Error('Only Chrome bookmarks are currently supported. More browsers coming soon.');
    }

    this.connected = true;
    return { count: this.bookmarks.length, browser };
  }

  _parseChromeBookmarks(filePath) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const walk = (node, folder = '') => {
      if (node.type === 'url') {
        this.bookmarks.push({ title: node.name, url: node.url, folder, added: node.date_added });
      } else if (node.children) {
        for (const child of node.children) walk(child, node.name || folder);
      }
    };
    if (data.roots) {
      for (const root of Object.values(data.roots)) walk(root);
    }
  }

  async list() {
    return this.bookmarks;
  }

  async search(query) {
    const q = query.toLowerCase();
    return this.bookmarks.filter(b =>
      b.title.toLowerCase().includes(q) || b.url.toLowerCase().includes(q)
    ).slice(0, 20);
  }

  getTools() {
    return [
      { type: 'function', function: { name: 'bookmarks_list', description: 'List all browser bookmarks', parameters: { type: 'object', properties: {} } } },
      { type: 'function', function: { name: 'bookmarks_search', description: 'Search bookmarks by title or URL', parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } } }
    ];
  }
}

module.exports = { BookmarksConnector };
