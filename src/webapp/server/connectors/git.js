const path = require('path');
const fs = require('fs');
const { BaseConnector } = require('./base');

class GitConnector extends BaseConnector {
  constructor() {
    super('git', 'Git Repository', 'Read commit history, diffs, and changes from a Git repo', {
      repoPath: { type: 'string', label: 'Repository Path', placeholder: '/home/user/my-project' }
    });
    this.git = null;
  }

  async connect(config) {
    const { repoPath } = config;
    if (!fs.existsSync(path.join(repoPath, '.git'))) throw new Error('Not a git repository');
    const simpleGit = require('simple-git');
    this.git = simpleGit(repoPath);
    this.config = config;
    this.connected = true;
    const status = await this.git.status();
    const log = await this.git.log({ maxCount: 1 });
    return {
      branch: status.current,
      lastCommit: log.latest?.hash?.slice(0, 7),
      lastMessage: log.latest?.message
    };
  }

  async list() {
    const log = await this.git.log({ maxCount: 20 });
    return log.all.map(c => ({
      hash: c.hash.slice(0, 7),
      fullHash: c.hash,
      message: c.message,
      author: c.author_name,
      date: c.date
    }));
  }

  async read(commitHash) {
    const show = await this.git.show([commitHash, '--stat']);
    const diff = await this.git.show([commitHash]);
    return { hash: commitHash, details: show, diff: diff.slice(0, 5000) };
  }

  async search(query) {
    const log = await this.git.log(['--all', `--grep=${query}`, '--max-count=10']);
    return log.all.map(c => ({
      hash: c.hash.slice(0, 7),
      message: c.message,
      author: c.author_name,
      date: c.date
    }));
  }

  async getRecentActivity(days = 7) {
    const since = new Date(Date.now() - days * 86400000).toISOString();
    const log = await this.git.log([`--since=${since}`, '--all']);
    const byDay = {};
    for (const c of log.all) {
      const day = c.date.slice(0, 10);
      if (!byDay[day]) byDay[day] = [];
      byDay[day].push({ hash: c.hash.slice(0, 7), message: c.message, author: c.author_name });
    }
    return { days: Object.entries(byDay).map(([date, commits]) => ({ date, commits })) };
  }

  async getDiff(fromHash, toHash) {
    const diff = await this.git.diff([fromHash, toHash, '--stat']);
    return { diff: diff.slice(0, 5000) };
  }

  getTools() {
    return [
      { type: 'function', function: { name: 'git_log', description: 'Get recent git commit history', parameters: { type: 'object', properties: { limit: { type: 'number' } } } } },
      { type: 'function', function: { name: 'git_read_commit', description: 'Get details of a specific commit', parameters: { type: 'object', properties: { hash: { type: 'string' } }, required: ['hash'] } } },
      { type: 'function', function: { name: 'git_search', description: 'Search commit messages', parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } } },
      { type: 'function', function: { name: 'git_recent', description: 'Get recent git activity by day', parameters: { type: 'object', properties: { days: { type: 'number' } } } } }
    ];
  }
}

module.exports = { GitConnector };
