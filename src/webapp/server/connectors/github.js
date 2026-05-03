const { BaseConnector } = require('./base');

class GitHubConnector extends BaseConnector {
  constructor() {
    super('github', 'GitHub Issues', 'Read issues, pull requests, and discussions from a GitHub repository', {
      token: {
        type: 'password',
        label: 'Personal Access Token',
        placeholder: 'ghp_xxxxxxxxxxxxxxxxxxxx',
        help: 'Create at github.com/settings/tokens — needs repo:read scope'
      },
      repo: {
        type: 'string',
        label: 'Repository (owner/repo)',
        placeholder: 'octocat/hello-world',
        help: 'e.g. microsoft/vscode'
      }
    });
    this.token  = null;
    this.repo   = null;
    this.repoMeta = null;
  }

  _headers() {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    };
  }

  async _fetch(path) {
    const axios  = require('axios');
    const url    = path.startsWith('http') ? path : `https://api.github.com${path}`;
    const res    = await axios.get(url, { headers: this._headers(), timeout: 10000 });
    return res.data;
  }

  async connect(config) {
    const { token, repo } = config;
    if (!token) throw new Error('Personal access token required');
    if (!repo)  throw new Error('Repository (owner/repo) required');
    if (!repo.includes('/')) throw new Error('Repo must be in owner/repo format');
    this.token  = token;
    this.repo   = repo;
    this.config = config;
    this.repoMeta = await this._fetch(`/repos/${repo}`);
    this.connected = true;
    return {
      full_name:   this.repoMeta.full_name,
      description: this.repoMeta.description,
      stars:       this.repoMeta.stargazers_count,
      open_issues: this.repoMeta.open_issues_count,
      language:    this.repoMeta.language
    };
  }

  async list() {
    const issues = await this._fetch(`/repos/${this.repo}/issues?state=open&per_page=30&sort=updated`);
    return issues.map(i => ({
      number:    i.number,
      title:     i.title,
      state:     i.state,
      type:      i.pull_request ? 'pr' : 'issue',
      author:    i.user?.login,
      labels:    (i.labels || []).map(l => l.name),
      comments:  i.comments,
      created:   i.created_at,
      updated:   i.updated_at,
      url:       i.html_url
    }));
  }

  async read(number) {
    const issue    = await this._fetch(`/repos/${this.repo}/issues/${number}`);
    const comments = await this._fetch(`/repos/${this.repo}/issues/${number}/comments?per_page=20`);
    return {
      number:   issue.number,
      title:    issue.title,
      state:    issue.state,
      body:     issue.body || '',
      author:   issue.user?.login,
      labels:   (issue.labels || []).map(l => l.name),
      url:      issue.html_url,
      created:  issue.created_at,
      comments: comments.map(c => ({ author: c.user?.login, body: c.body, created: c.created_at }))
    };
  }

  async search(query) {
    const axios   = require('axios');
    const q       = encodeURIComponent(`${query} repo:${this.repo}`);
    const data    = await this._fetch(`https://api.github.com/search/issues?q=${q}&per_page=10`);
    return (data.items || []).map(i => ({
      number:  i.number,
      title:   i.title,
      state:   i.state,
      type:    i.pull_request ? 'pr' : 'issue',
      url:     i.html_url
    }));
  }

  async getReadme() {
    try {
      const data = await this._fetch(`/repos/${this.repo}/readme`);
      const text = Buffer.from(data.content, 'base64').toString('utf8');
      return { name: data.name, content: text.slice(0, 3000) };
    } catch { return { name: 'README', content: 'No README found' }; }
  }

  async listMilestones() {
    return this._fetch(`/repos/${this.repo}/milestones?state=open&per_page=10`);
  }

  getTools() {
    return [
      {
        type: 'function',
        function: {
          name: 'github_list',
          description: 'List open GitHub issues and pull requests',
          parameters: { type: 'object', properties: {} }
        }
      },
      {
        type: 'function',
        function: {
          name: 'github_read',
          description: 'Read a GitHub issue or PR by number (includes comments)',
          parameters: { type: 'object', properties: { number: { type: 'number', description: 'Issue or PR number' } }, required: ['number'] }
        }
      },
      {
        type: 'function',
        function: {
          name: 'github_search',
          description: 'Search issues and PRs in the repository',
          parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] }
        }
      },
      {
        type: 'function',
        function: {
          name: 'github_readme',
          description: 'Read the README of the connected repository',
          parameters: { type: 'object', properties: {} }
        }
      }
    ];
  }
}

module.exports = { GitHubConnector };
