const axios = require('axios');

// Simple in-memory LRU-style cache for search results
class SearchCache {
  constructor(ttlMs = 5 * 60 * 1000, maxSize = 50) {
    this._cache = new Map();
    this._ttl   = ttlMs;
    this._max   = maxSize;
  }
  get(key) {
    const entry = this._cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.ts > this._ttl) { this._cache.delete(key); return null; }
    return entry.value;
  }
  set(key, value) {
    if (this._cache.size >= this._max) {
      // evict oldest entry
      this._cache.delete(this._cache.keys().next().value);
    }
    this._cache.set(key, { value, ts: Date.now() });
  }
}

const searchCache  = new SearchCache(5 * 60 * 1000); // 5-min TTL
const instantCache = new SearchCache(10 * 60 * 1000); // 10-min TTL

class WebSearchService {
  constructor() {
    this.timeout = 8000; // reduced from 12 s — fail faster
  }

  // DuckDuckGo Instant Answer (no key, no scraping)
  async instantAnswer(query) {
    const cacheKey = `instant:${query.toLowerCase().trim()}`;
    const cached = instantCache.get(cacheKey);
    if (cached) return cached;

    try {
      const res = await axios.get('https://api.duckduckgo.com/', {
        params: { q: query, format: 'json', no_html: 1, skip_disambig: 1 },
        timeout: this.timeout,
        headers: { 'User-Agent': 'VaultAI/1.0 local-only' }
      });
      const d = res.data;
      const result = {
        abstract: d.Abstract || '',
        abstractUrl: d.AbstractURL || '',
        abstractSource: d.AbstractSource || '',
        answer: d.Answer || '',
        definition: d.Definition || '',
        relatedTopics: (d.RelatedTopics || []).slice(0, 6).map(t => ({
          text: t.Text || '',
          url: t.FirstURL || ''
        })).filter(t => t.text)
      };
      instantCache.set(cacheKey, result);
      return result;
    } catch {
      return { abstract: '', answer: '', relatedTopics: [] };
    }
  }

  // DuckDuckGo HTML search — returns organic web results
  async search(query, maxResults = 8) {
    const cacheKey = `search:${query.toLowerCase().trim()}:${maxResults}`;
    const cached = searchCache.get(cacheKey);
    if (cached) return cached;

    let results;
    try {
      const res = await axios.post('https://html.duckduckgo.com/html/', `q=${encodeURIComponent(query)}`, {
        timeout: this.timeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'text/html,application/xhtml+xml'
        }
      });
      results = this._parseHtml(res.data, maxResults);
    } catch {
      try {
        const res = await axios.get('https://html.duckduckgo.com/html/', {
          params: { q: query },
          timeout: this.timeout,
          headers: { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36' }
        });
        results = this._parseHtml(res.data, maxResults);
      } catch (err) {
        throw new Error(`Web search unavailable: ${err.message}`);
      }
    }

    if (results.length > 0) searchCache.set(cacheKey, results);
    return results;
  }

  _decodeUrl(raw) {
    let url = raw;
    if (url.startsWith('//')) url = 'https:' + url;
    if (url.includes('duckduckgo.com/l/')) {
      try {
        const uddg = new URL(url).searchParams.get('uddg');
        if (uddg) url = decodeURIComponent(uddg);
        else return null;
      } catch { return null; }
    }
    if (url.startsWith('/') || !url.startsWith('http')) return null;
    return url;
  }

  _parseHtml(html, maxResults) {
    const results = [];
    const blockRe = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
    let m;
    while ((m = blockRe.exec(html)) !== null && results.length < maxResults) {
      const url = this._decodeUrl(m[1]);
      if (!url) continue;
      const title   = m[2].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#x27;/g, "'").trim();
      const snippet = m[3].replace(/<[^>]+>/g, '').replace(/&#\d+;/g, ' ').replace(/&amp;/g, '&').trim();
      if (title && snippet) results.push({ url, title, snippet });
    }
    if (results.length === 0) {
      const titleRe = /class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
      const snipRe  = /class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
      const titles  = [], snips = [];
      while ((m = titleRe.exec(html)) !== null) {
        const url = this._decodeUrl(m[1]);
        if (url) titles.push({ url, title: m[2].replace(/<[^>]+>/g, '').trim() });
      }
      while ((m = snipRe.exec(html)) !== null) snips.push(m[1].replace(/<[^>]+>/g, '').replace(/&#\d+;/g, ' ').trim());
      for (let i = 0; i < Math.min(titles.length, snips.length, maxResults); i++) {
        if (titles[i].title && snips[i]) results.push({ ...titles[i], snippet: snips[i] });
      }
    }
    return results;
  }
}

module.exports = { WebSearchService };
