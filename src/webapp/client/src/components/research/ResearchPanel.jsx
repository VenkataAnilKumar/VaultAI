import React, { useState, useRef } from 'react';
import {
  SearchIcon, GlobeIcon, BookOpenIcon, Loader2Icon,
  ExternalLinkIcon, SaveIcon, ChevronDownIcon, ChevronUpIcon,
  FlaskConicalIcon, AlertCircleIcon, XIcon
} from 'lucide-react';
import { webSearch, deepResearch, summarizeUrl } from '../../api/client.js';

function ResultCard({ result, onSummarize, summarizing, summary }) {
  const [expanded, setExpanded] = useState(false);
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
          Summarize page
        </button>
      </div>
      {summary && (
        <div className="research-summary-box">
          <div className="research-summary-text">{summary}</div>
        </div>
      )}
    </div>
  );
}

export default function ResearchPanel() {
  const [query, setQuery]         = useState('');
  const [mode, setMode]           = useState('search'); // 'search' | 'deep'
  const [loading, setLoading]     = useState(false);
  const [results, setResults]     = useState(null);
  const [deepResult, setDeepResult] = useState(null);
  const [error, setError]         = useState(null);
  const [summaries, setSummaries] = useState({});
  const [summarizing, setSummarizing] = useState({});
  const [saved, setSaved]         = useState([]);
  const [reportExpanded, setReportExpanded] = useState(true);
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

  function saveResult(item) {
    setSaved(s => {
      if (s.find(x => x.url === item.url)) return s;
      return [...s, item];
    });
  }

  function removeSaved(url) {
    setSaved(s => s.filter(x => x.url !== url));
  }

  function downloadReport() {
    if (!deepResult) return;
    const content = `# Research Report\n\n**Question:** ${deepResult.question}\n\n---\n\n${deepResult.report}\n\n---\n\n## Sources\n${(deepResult.searchResults || []).flatMap(sr => sr.results.map(r => `- [${r.title}](${r.url})`)).join('\n')}`;
    const blob = new Blob([content], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `research-${Date.now()}.md`;
    a.click();
  }

  const instant = results?.instant;

  return (
    <div className="research-panel">
      {/* Header */}
      <div className="research-header">
        <GlobeIcon size={16} style={{ color: 'var(--accent)' }} />
        <div>
          <div className="research-title">Web Research</div>
          <div className="research-sub">Search the web locally — no tracking, DuckDuckGo powered</div>
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
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="research-search-bar">
        <SearchIcon size={15} style={{ color: '#9ca3af', flexShrink: 0 }} />
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={mode === 'search' ? 'Search the web...' : 'Enter a research question for deep analysis...'}
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
          Deep Research breaks your question into sub-questions, searches the web for each, then uses AI to synthesize a comprehensive report. Requires Ollama.
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="research-error">
          <AlertCircleIcon size={14} />
          <span>{error}</span>
        </div>
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
            {/* Instant Answer */}
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
                  {results.results.length} web results for "{results.query}"
                </div>
                {results.results.map((r, i) => (
                  <ResultCard
                    key={i} result={r}
                    onSummarize={handleSummarizeUrl}
                    summarizing={summarizing[r.url]}
                    summary={summaries[r.url]}
                  />
                ))}
              </>
            ) : !results.error && (
              <div className="research-empty">No web results found. Try a different query.</div>
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
                  {deepResult.documentsSearched || deepResult.subQuestions?.length} sub-questions ·
                  model: {deepResult.model}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="research-btn-sm" onClick={downloadReport}>
                  <SaveIcon size={12} /> Save .md
                </button>
                <button className="research-btn-sm" onClick={() => setReportExpanded(v => !v)}>
                  {reportExpanded ? <ChevronUpIcon size={12} /> : <ChevronDownIcon size={12} />}
                  {reportExpanded ? 'Collapse' : 'Expand'}
                </button>
              </div>
            </div>

            {reportExpanded && (
              <div className="research-report">
                {deepResult.report.split('\n').map((line, i) => {
                  if (line.startsWith('## ')) return <h3 key={i} className="research-report-h2">{line.replace('## ', '')}</h3>;
                  if (line.startsWith('# ')) return <h2 key={i} className="research-report-h1">{line.replace('# ', '')}</h2>;
                  if (line.startsWith('- ')) return <li key={i} className="research-report-li">{line.replace('- ', '')}</li>;
                  if (line.trim() === '') return <div key={i} style={{ height: 8 }} />;
                  return <p key={i} className="research-report-p">{line}</p>;
                })}
              </div>
            )}

            {/* Sources */}
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
            <div className="research-empty-title">Web Research</div>
            <div className="research-empty-sub">
              {mode === 'search'
                ? 'Search the web with DuckDuckGo — private, no tracking.'
                : 'Deep Research uses AI to break down your question, search multiple angles, and write a comprehensive report.'}
            </div>
            <div className="research-suggestions">
              {['Latest AI research papers', 'How does RAG work?', 'Privacy laws in Europe'].map(s => (
                <button key={s} className="research-suggestion-chip" onClick={() => { setQuery(s); inputRef.current?.focus(); }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Saved items */}
      {saved.length > 0 && (
        <div className="research-saved">
          <div className="research-saved-title">Saved ({saved.length})</div>
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
