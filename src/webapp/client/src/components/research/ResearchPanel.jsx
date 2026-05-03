import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  SearchIcon, GlobeIcon, BookOpenIcon, Loader2Icon,
  ExternalLinkIcon, SaveIcon, ChevronDownIcon, ChevronUpIcon,
  FlaskConicalIcon, AlertCircleIcon, XIcon, LinkIcon, BookmarkIcon,
  BookmarkCheckIcon, DownloadIcon
} from 'lucide-react';
import { webSearch, deepResearch, summarizeUrl } from '../../api/client.js';

function ResultCard({ result, onSummarize, summarizing, summary, onSave, saved }) {
  return (
    <div className="research-result-card">
      <div className="research-result-title">
        <a href={result.url} target="_blank" rel="noopener noreferrer" className="research-result-link">
          {result.title || result.url}
          <ExternalLinkIcon size={11} style={{ marginLeft: 4, opacity: 0.6 }} />
        </a>
      </div>
      <div className="research-result-url">{result.url}</div>
      <div className="research-result-snippet">{result.snippet}</div>
      <div className="research-result-actions">
        <button className="research-btn-sm" onClick={() => onSummarize(result.url)} disabled={summarizing}>
          {summarizing ? <Loader2Icon size={11} className="spin" /> : <BookOpenIcon size={11} />}
          Summarize
        </button>
        <button
          className={`research-btn-sm ${saved ? 'research-btn-saved' : ''}`}
          onClick={() => onSave(result)}
          title={saved ? 'Saved' : 'Save result'}
        >
          {saved ? <BookmarkCheckIcon size={11} /> : <BookmarkIcon size={11} />}
          {saved ? 'Saved' : 'Save'}
        </button>
      </div>
      {summary && (
        <div className="research-summary-box">
          <div className="research-summary-label">AI Summary</div>
          <div className="research-summary-text">{summary}</div>
        </div>
      )}
    </div>
  );
}

export default function ResearchPanel() {
  const [query, setQuery]           = useState('');
  const [mode, setMode]             = useState('search'); // 'search' | 'deep' | 'url'
  const [loading, setLoading]       = useState(false);
  const [results, setResults]       = useState(null);
  const [deepResult, setDeepResult] = useState(null);
  const [error, setError]           = useState(null);
  const [summaries, setSummaries]   = useState({});
  const [summarizing, setSummarizing] = useState({});
  const [saved, setSaved]           = useState([]);
  const [reportExpanded, setReportExpanded] = useState(true);
  // URL mode
  const [urlInput, setUrlInput]     = useState('');
  const [urlSummary, setUrlSummary] = useState(null);
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlError, setUrlError]     = useState(null);
  const inputRef = useRef(null);

  async function handleSearch(e) {
    e?.preventDefault();
    if (!query.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResults(null);
    setDeepResult(null);
    try {
      if (mode === 'search') {
        const data = await webSearch(query.trim(), 10);
        setResults(data);
      } else {
        const data = await deepResearch(query.trim(), 3);
        setDeepResult(data);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSummarizeUrl(url) {
    if (summarizing[url]) return;
    setSummarizing(s => ({ ...s, [url]: true }));
    try {
      const data = await summarizeUrl(url);
      setSummaries(s => ({ ...s, [url]: data.summary }));
    } catch (err) {
      setSummaries(s => ({ ...s, [url]: `Error: ${err.response?.data?.error || err.message}` }));
    } finally {
      setSummarizing(s => ({ ...s, [url]: false }));
    }
  }

  async function handleDirectUrl(e) {
    e?.preventDefault();
    if (!urlInput.trim() || urlLoading) return;
    setUrlLoading(true);
    setUrlError(null);
    setUrlSummary(null);
    try {
      let url = urlInput.trim();
      if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
      const data = await summarizeUrl(url);
      setUrlSummary({ url, summary: data.summary, model: data.model });
    } catch (err) {
      setUrlError(err.response?.data?.error || err.message);
    } finally {
      setUrlLoading(false);
    }
  }

  function saveResult(item) {
    setSaved(s => s.find(x => x.url === item.url) ? s : [...s, item]);
  }

  function removeSaved(url) {
    setSaved(s => s.filter(x => x.url !== url));
  }

  function downloadReport() {
    if (!deepResult) return;
    const sources = (deepResult.searchResults || [])
      .flatMap(sr => sr.results.map(r => `- [${r.title}](${r.url})`)).join('\n');
    const content = `# Research Report\n\n**Question:** ${deepResult.question}\n\n---\n\n${deepResult.report}\n\n---\n\n## Sources\n${sources}`;
    const blob = new Blob([content], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `research-${Date.now()}.md`;
    a.click();
  }

  const instant = results?.instant;
  const subCount = deepResult?.subQuestions?.length || 0;

  return (
    <div className="research-panel">
      {/* Header */}
      <div className="research-header">
        <GlobeIcon size={16} style={{ color: 'var(--accent)' }} />
        <div>
          <div className="research-title">Web Research</div>
          <div className="research-sub">Private search — DuckDuckGo powered, no tracking</div>
        </div>
      </div>

      {/* Mode tabs */}
      <div className="research-mode-tabs">
        <button className={`research-mode-tab ${mode === 'search' ? 'active' : ''}`} onClick={() => setMode('search')}>
          <SearchIcon size={13} /> Quick Search
        </button>
        <button className={`research-mode-tab ${mode === 'deep' ? 'active' : ''}`} onClick={() => setMode('deep')}>
          <FlaskConicalIcon size={13} /> Deep Research
          <span className="research-mode-badge">AI</span>
        </button>
        <button className={`research-mode-tab ${mode === 'url' ? 'active' : ''}`} onClick={() => setMode('url')}>
          <LinkIcon size={13} /> Summarize URL
        </button>
      </div>

      {/* ── URL Summarize mode ─────────────────────────────── */}
      {mode === 'url' ? (
        <div className="research-url-mode">
          <form onSubmit={handleDirectUrl} className="research-search-bar">
            <LinkIcon size={15} style={{ color: '#9ca3af', flexShrink: 0 }} />
            <input
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              placeholder="Paste any URL to summarize..."
              className="research-input"
              disabled={urlLoading}
              autoFocus
            />
            {urlInput && (
              <button type="button" onClick={() => { setUrlInput(''); setUrlSummary(null); setUrlError(null); }} className="research-clear">
                <XIcon size={13} />
              </button>
            )}
            <button type="submit" disabled={!urlInput.trim() || urlLoading} className="research-search-btn">
              {urlLoading ? <Loader2Icon size={14} className="spin" /> : 'Summarize'}
            </button>
          </form>

          {urlError && (
            <div className="research-error"><AlertCircleIcon size={14} /><span>{urlError}</span></div>
          )}

          {urlLoading && (
            <div className="research-loading">
              <Loader2Icon size={20} className="spin" style={{ color: 'var(--accent)' }} />
              <span>Fetching and summarizing page…</span>
            </div>
          )}

          {urlSummary && !urlLoading && (
            <div className="research-url-result">
              <div className="research-url-result-header">
                <a href={urlSummary.url} target="_blank" rel="noopener noreferrer" className="research-result-link" style={{ fontSize: 12 }}>
                  {urlSummary.url} <ExternalLinkIcon size={11} />
                </a>
                {urlSummary.model && <span className="research-model-badge">{urlSummary.model}</span>}
              </div>
              <div className="research-url-result-body">{urlSummary.summary}</div>
              <div style={{ marginTop: 10 }}>
                <button className="research-btn-sm" onClick={() => saveResult({ url: urlSummary.url, title: urlSummary.url, snippet: urlSummary.summary })}>
                  <BookmarkIcon size={11} /> Save
                </button>
              </div>
            </div>
          )}

          {!urlSummary && !urlLoading && !urlError && (
            <div className="research-empty-state">
              <LinkIcon size={32} style={{ color: '#d1d5db', marginBottom: 12 }} />
              <div className="research-empty-title">Summarize any page</div>
              <div className="research-empty-sub">Paste any URL — article, blog post, docs page — and get an AI summary instantly.</div>
              <div className="research-suggestions">
                {['https://en.wikipedia.org/wiki/Federated_learning', 'https://privacyguides.org'].map(s => (
                  <button key={s} className="research-suggestion-chip" onClick={() => setUrlInput(s)}>
                    {s.replace('https://', '')}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Search / Deep search bar */}
          <form onSubmit={handleSearch} className="research-search-bar">
            <SearchIcon size={15} style={{ color: '#9ca3af', flexShrink: 0 }} />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={mode === 'search' ? 'Search the web...' : 'Enter a research question...'}
              className="research-input"
              disabled={loading}
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} className="research-clear">
                <XIcon size={13} />
              </button>
            )}
            <button type="submit" disabled={!query.trim() || loading} className="research-search-btn">
              {loading ? <Loader2Icon size={14} className="spin" /> : mode === 'search' ? 'Search' : 'Research'}
            </button>
          </form>

          {mode === 'deep' && (
            <div className="research-deep-info">
              Breaks your question into sub-questions, searches each one, then synthesizes a full AI report. Works in Demo Mode.
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="research-error"><AlertCircleIcon size={14} /><span>{error}</span></div>
          )}

          <div className="research-body">
            {/* Loading */}
            {loading && (
              <div className="research-loading">
                <Loader2Icon size={22} className="spin" style={{ color: 'var(--accent)' }} />
                <span>{mode === 'deep' ? 'Running deep research — searching and synthesizing...' : 'Searching the web...'}</span>
              </div>
            )}

            {/* Quick Search Results */}
            {results && !loading && (
              <div className="research-results">
                {instant?.abstract && (
                  <div className="research-instant">
                    <div className="research-instant-label">Instant Answer · {instant.abstractSource}</div>
                    <div className="research-instant-text">{instant.abstract}</div>
                    {instant.abstractUrl && (
                      <a href={instant.abstractUrl} target="_blank" rel="noopener noreferrer" className="research-instant-link">
                        Read more <ExternalLinkIcon size={11} />
                      </a>
                    )}
                  </div>
                )}
                {instant?.answer && !instant?.abstract && (
                  <div className="research-instant">
                    <div className="research-instant-label">Answer</div>
                    <div className="research-instant-text">{instant.answer}</div>
                  </div>
                )}

                {results.error && (
                  <div className="research-error" style={{ marginBottom: 12 }}>
                    <AlertCircleIcon size={13} /> Web search unavailable: {results.error}
                  </div>
                )}

                {results.results?.length > 0 ? (
                  <>
                    <div className="research-results-header">
                      {results.results.length} results for "{results.query}"
                    </div>
                    {results.results.map((r, i) => (
                      <ResultCard
                        key={i} result={r}
                        onSummarize={handleSummarizeUrl}
                        summarizing={summarizing[r.url]}
                        summary={summaries[r.url]}
                        onSave={saveResult}
                        saved={!!saved.find(s => s.url === r.url)}
                      />
                    ))}
                  </>
                ) : !results.error && (
                  <div className="research-empty">No results found. Try a different query.</div>
                )}
              </div>
            )}

            {/* Deep Research Results */}
            {deepResult && !loading && (
              <div className="research-deep-results">
                <div className="research-deep-header">
                  <div>
                    <div className="research-deep-title">Research Report</div>
                    <div className="research-deep-meta">
                      {subCount} sub-question{subCount !== 1 ? 's' : ''} searched
                      {deepResult.model ? ` · ${deepResult.model}` : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="research-btn-sm" onClick={downloadReport}>
                      <DownloadIcon size={12} /> Save .md
                    </button>
                    <button className="research-btn-sm" onClick={() => setReportExpanded(v => !v)}>
                      {reportExpanded ? <ChevronUpIcon size={12} /> : <ChevronDownIcon size={12} />}
                      {reportExpanded ? 'Collapse' : 'Expand'}
                    </button>
                  </div>
                </div>

                {reportExpanded && (
                  <div className="research-report">
                    <ReactMarkdown
                      components={{
                        h1: ({children}) => <h2 className="research-report-h1">{children}</h2>,
                        h2: ({children}) => <h3 className="research-report-h2">{children}</h3>,
                        h3: ({children}) => <h4 className="research-report-h2" style={{ fontSize: 13 }}>{children}</h4>,
                        p:  ({children}) => <p className="research-report-p">{children}</p>,
                        li: ({children}) => <li className="research-report-li">{children}</li>,
                        ul: ({children}) => <ul style={{ paddingLeft: 0, margin: '4px 0' }}>{children}</ul>,
                        ol: ({children}) => <ol style={{ paddingLeft: 16, margin: '4px 0' }}>{children}</ol>,
                        strong: ({children}) => <strong style={{ fontWeight: 600, color: 'var(--text-1)' }}>{children}</strong>,
                        a: ({href, children}) => <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>{children}</a>,
                      }}
                    >
                      {deepResult.report}
                    </ReactMarkdown>
                  </div>
                )}

                {deepResult.searchResults?.length > 0 && (
                  <div className="research-sources">
                    <div className="research-sources-title">Sources searched</div>
                    {deepResult.searchResults.map((sr, si) => (
                      <div key={si} className="research-source-group">
                        <div className="research-source-q">{sr.question}</div>
                        {sr.results.map((r, ri) => (
                          <a key={ri} href={r.url} target="_blank" rel="noopener noreferrer" className="research-source-link">
                            <ExternalLinkIcon size={11} /> {r.title || r.url}
                          </a>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Empty state */}
            {!results && !deepResult && !loading && !error && (
              <div className="research-empty-state">
                <GlobeIcon size={36} style={{ color: '#d1d5db', marginBottom: 12 }} />
                <div className="research-empty-title">
                  {mode === 'search' ? 'Search the web privately' : 'Deep Research'}
                </div>
                <div className="research-empty-sub">
                  {mode === 'search'
                    ? 'Powered by DuckDuckGo — no tracking, no accounts, no data collection.'
                    : 'AI breaks down your question, searches multiple angles, and writes a comprehensive report.'}
                </div>
                <div className="research-suggestions">
                  {(mode === 'search'
                    ? ['Privacy-preserving AI techniques', 'Federated learning overview', 'Local LLM benchmarks 2025']
                    : ['How does differential privacy work?', 'What are the best practices for AI security?', 'Compare RAG vs fine-tuning']
                  ).map(s => (
                    <button key={s} className="research-suggestion-chip" onClick={() => { setQuery(s); inputRef.current?.focus(); }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Saved items */}
      {saved.length > 0 && (
        <div className="research-saved">
          <div className="research-saved-title">
            <BookmarkCheckIcon size={12} /> Saved ({saved.length})
          </div>
          {saved.map(item => (
            <div key={item.url} className="research-saved-item">
              <a href={item.url} target="_blank" rel="noopener noreferrer" className="research-saved-link">
                {item.title || item.url}
              </a>
              <button onClick={() => removeSaved(item.url)} className="research-saved-remove">
                <XIcon size={11} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
