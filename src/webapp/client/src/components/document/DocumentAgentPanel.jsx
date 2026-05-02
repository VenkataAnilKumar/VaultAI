import React, { useState, useEffect, useRef } from 'react';
import {
  FileTextIcon, UploadIcon, MessageSquareIcon, AlignLeftIcon,
  ListIcon, SearchIcon, TagIcon, TrashIcon, SendIcon,
  CheckCircleIcon, AlertCircleIcon, ChevronRightIcon,
  FileIcon, Loader2Icon, XIcon, BookOpenIcon, ShieldAlertIcon,
  UsersIcon, FolderSyncIcon, RefreshCwIcon
} from 'lucide-react';
import {
  ingestDocument, listDocuments, deleteDocument,
  queryDocument, summarizeDocument, extractFromDocument, classifyDocument,
  indexDocumentDirectory, detectPII, multiQueryDocuments, organizeDocuments
} from '../../api/client.js';
import useStore from '../../store/useStore.js';

const EXT_COLORS = {
  pdf: '#E53E3E', docx: '#2B6CB0', doc: '#2B6CB0',
  txt: '#718096', md: '#744210', csv: '#276749',
  xlsx: '#276749', xls: '#276749', js: '#D69E2E',
  ts: '#2B6CB0', py: '#3182CE'
};

const RISK_STYLES = {
  clean:  { bg: '#F0FFF4', text: '#22543D', border: '#C6F6D5', label: 'Clean' },
  low:    { bg: '#FFFBEB', text: '#744210', border: '#FEF3C7', label: 'Low Risk' },
  medium: { bg: '#FFF7ED', text: '#9A3412', border: '#FED7AA', label: 'Medium Risk' },
  high:   { bg: '#FFF5F5', text: '#742A2A', border: '#FED7D7', label: 'High Risk' }
};

function ExtBadge({ ext }) {
  const color = EXT_COLORS[ext] || '#718096';
  return (
    <span style={{ background: color, color: '#fff', fontSize: 10, fontWeight: 700,
      padding: '1px 6px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {ext || 'file'}
    </span>
  );
}

function ActionButton({ icon: Icon, label, active, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`doc-action-btn ${active ? 'doc-action-btn-active' : ''}`}>
      <Icon size={14} /><span>{label}</span>
    </button>
  );
}

// ── Single-doc panel ─────────────────────────────────────────
function SingleDocPanel({ doc, onBack }) {
  const { ollamaConnected } = useStore();
  const [action, setAction]   = useState('query');
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState(null);
  const [question, setQuestion] = useState('');
  const [qHistory, setQHistory] = useState([]);
  const chatEndRef = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [qHistory]);

  async function runAction(actionType) {
    setAction(actionType);
    setResult(null);
    setError(null);
    if (actionType === 'query') return;
    setLoading(true);
    try {
      let data;
      if (actionType === 'tldr')      data = await summarizeDocument(doc.filePath, 'tldr');
      if (actionType === 'keypoints') data = await summarizeDocument(doc.filePath, 'keypoints');
      if (actionType === 'full')      data = await summarizeDocument(doc.filePath, 'full');
      if (actionType === 'extract')   data = await extractFromDocument(doc.filePath);
      if (actionType === 'classify')  data = await classifyDocument(doc.filePath);
      if (actionType === 'pii')       data = await detectPII(doc.filePath);
      setResult({ type: actionType, data });
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAsk() {
    if (!question.trim() || loading) return;
    const q = question.trim();
    setQuestion('');
    setQHistory(h => [...h, { role: 'user', content: q }]);
    setLoading(true);
    try {
      const data = await queryDocument(q, doc.filePath);
      setQHistory(h => [...h, { role: 'assistant', content: data.answer, sources: data.sources, model: data.model }]);
    } catch (err) {
      setQHistory(h => [...h, { role: 'assistant', content: `Error: ${err.response?.data?.error || err.message}`, isError: true }]);
    } finally {
      setLoading(false);
    }
  }

  function renderResult() {
    if (!result) return null;
    const { type, data } = result;

    if (type === 'tldr' || type === 'keypoints' || type === 'full') {
      return (
        <div className="doc-result">
          <div className="doc-result-header">
            <AlignLeftIcon size={14} />
            <span>{{ tldr: 'TL;DR', keypoints: 'Key Points', full: 'Full Summary' }[type]}</span>
            {data.model && <span className="doc-model-badge">{data.model}</span>}
          </div>
          <div className="doc-result-body">{data.summary}</div>
        </div>
      );
    }

    if (type === 'extract') {
      const entries = Object.entries(data.extracted || {});
      return (
        <div className="doc-result">
          <div className="doc-result-header"><ListIcon size={14} /><span>Extracted Data</span>{data.model && <span className="doc-model-badge">{data.model}</span>}</div>
          {entries.length === 0
            ? <div className="doc-result-body" style={{ color: '#9ca3af' }}>No structured data found.</div>
            : entries.map(([key, vals]) => (
              <div key={key} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'capitalize', color: '#6b7280', marginBottom: 4 }}>{key.replace(/_/g, ' ')}</div>
                {(Array.isArray(vals) ? vals : [vals]).map((v, i) => (
                  <div key={i} style={{ fontSize: 12, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 6, padding: '3px 8px', marginBottom: 3 }}>{v}</div>
                ))}
              </div>
            ))
          }
        </div>
      );
    }

    if (type === 'classify') {
      const c = data.classification || {};
      return (
        <div className="doc-result">
          <div className="doc-result-header"><TagIcon size={14} /><span>Classification</span>{data.model && <span className="doc-model-badge">{data.model}</span>}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            {c.type && <span style={{ background: '#EBF8FF', color: '#2B6CB0', fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>{c.type}</span>}
            {c.sensitivity && <span style={{ background: c.sensitivity === 'confidential' ? '#FFF5F5' : c.sensitivity === 'internal' ? '#FFFBEB' : '#F0FFF4', color: c.sensitivity === 'confidential' ? '#742A2A' : c.sensitivity === 'internal' ? '#744210' : '#22543D', fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>{c.sensitivity}</span>}
            {c.confidence !== undefined && <span style={{ background: '#F9FAFB', color: '#6b7280', fontSize: 11, padding: '2px 8px', borderRadius: 20 }}>{Math.round(c.confidence * 100)}% confidence</span>}
          </div>
          {c.tags?.length > 0 && <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
            {c.tags.map(t => <span key={t} style={{ background: '#EDE9FE', color: '#5B21B6', fontSize: 10, padding: '2px 6px', borderRadius: 10 }}>#{t}</span>)}
          </div>}
          {c.reason && <div style={{ fontSize: 12, color: '#6b7280', fontStyle: 'italic' }}>{c.reason}</div>}
        </div>
      );
    }

    if (type === 'pii') {
      const riskStyle = RISK_STYLES[data.riskLevel] || RISK_STYLES.clean;
      const regexEntries = Object.entries(data.regexFindings || {});
      return (
        <div className="doc-result">
          <div className="doc-result-header"><ShieldAlertIcon size={14} /><span>PII Scan</span>{data.model && <span className="doc-model-badge">{data.model}</span>}</div>
          <div style={{ background: riskStyle.bg, border: `1px solid ${riskStyle.border}`, borderRadius: 8, padding: '8px 12px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: riskStyle.text, fontWeight: 700, fontSize: 13 }}>{riskStyle.label}</span>
            <span style={{ color: riskStyle.text, fontSize: 12 }}>— {data.totalFindings} finding{data.totalFindings !== 1 ? 's' : ''}</span>
          </div>
          {regexEntries.length === 0 && (data.aiFindings || []).length === 0
            ? <div style={{ color: '#9ca3af', fontSize: 12 }}>No PII detected in this document.</div>
            : <>
              {regexEntries.map(([key, val]) => (
                <div key={key} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 4 }}>{val.label} ({val.count})</div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {val.matches.slice(0, 8).map((m, i) => (
                      <code key={i} style={{ background: '#FFF5F5', border: '1px solid #FED7D7', color: '#742A2A', fontSize: 10, padding: '2px 6px', borderRadius: 4 }}>{m}</code>
                    ))}
                    {val.matches.length > 8 && <span style={{ fontSize: 10, color: '#9ca3af' }}>+{val.matches.length - 8} more</span>}
                  </div>
                </div>
              ))}
              {data.aiFindings?.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>AI-detected ({data.aiFindings.length})</div>
                  {data.aiFindings.map((f, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ background: '#EDE9FE', color: '#5B21B6', fontSize: 10, padding: '2px 6px', borderRadius: 10 }}>{f.type}</span>
                      <code style={{ fontSize: 11, color: '#374151' }}>{f.value}</code>
                      {f.risk && <span style={{ fontSize: 10, color: f.risk === 'high' ? '#dc2626' : f.risk === 'medium' ? '#d97706' : '#6b7280' }}>{f.risk}</span>}
                    </div>
                  ))}
                </div>
              )}
            </>
          }
        </div>
      );
    }
    return null;
  }

  return (
    <div className="doc-single-panel">
      <div className="doc-single-header">
        <button onClick={onBack} className="doc-back-btn"><ChevronRightIcon size={14} style={{ transform: 'rotate(180deg)' }} /></button>
        <ExtBadge ext={doc.ext} />
        <span className="doc-single-name" title={doc.filePath}>{doc.fileName}</span>
      </div>

      <div className="doc-action-bar">
        <ActionButton icon={MessageSquareIcon} label="Q&A"       active={action === 'query'}     onClick={() => runAction('query')} />
        <ActionButton icon={AlignLeftIcon}     label="TL;DR"     active={action === 'tldr'}      onClick={() => runAction('tldr')} disabled={!ollamaConnected} />
        <ActionButton icon={ListIcon}          label="Key Points" active={action === 'keypoints'} onClick={() => runAction('keypoints')} disabled={!ollamaConnected} />
        <ActionButton icon={BookOpenIcon}      label="Full"       active={action === 'full'}      onClick={() => runAction('full')} disabled={!ollamaConnected} />
        <ActionButton icon={SearchIcon}        label="Extract"    active={action === 'extract'}   onClick={() => runAction('extract')} disabled={!ollamaConnected} />
        <ActionButton icon={TagIcon}           label="Classify"   active={action === 'classify'}  onClick={() => runAction('classify')} disabled={!ollamaConnected} />
        <ActionButton icon={ShieldAlertIcon}   label="PII Scan"   active={action === 'pii'}       onClick={() => runAction('pii')} disabled={!ollamaConnected} />
      </div>

      {error && (
        <div className="doc-error"><AlertCircleIcon size={14} />{error}</div>
      )}

      {loading && (
        <div className="doc-loading"><Loader2Icon size={18} className="spin" style={{ color: 'var(--accent)' }} /><span>Processing...</span></div>
      )}

      {/* Q&A chat */}
      {action === 'query' && !loading && (
        <div className="doc-chat">
          <div className="doc-chat-messages">
            {qHistory.length === 0 && (
              <div className="doc-chat-empty">
                <MessageSquareIcon size={24} style={{ color: '#d1d5db', marginBottom: 8 }} />
                <div style={{ fontSize: 12, color: '#9ca3af' }}>Ask a question about <strong>{doc.fileName}</strong></div>
              </div>
            )}
            {qHistory.map((msg, i) => (
              <div key={i} className={`doc-chat-msg ${msg.role}`}>
                <div className="doc-chat-bubble">
                  {msg.content}
                  {msg.sources?.length > 0 && (
                    <div className="doc-sources">
                      {msg.sources.map((s, si) => (
                        <div key={si} className="doc-source-chip" title={s.excerpt}>
                          [{si + 1}] {s.filePath?.split('/').pop() || 'source'}
                        </div>
                      ))}
                    </div>
                  )}
                  {msg.model && <div className="doc-msg-model">{msg.model}</div>}
                </div>
              </div>
            ))}
            {loading && (
              <div className="doc-chat-msg assistant">
                <div className="doc-chat-bubble"><Loader2Icon size={14} className="spin" /></div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="doc-chat-input">
            <input
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAsk()}
              placeholder={ollamaConnected ? `Ask about ${doc.fileName}...` : 'Start Ollama to ask questions'}
              disabled={loading || !ollamaConnected}
              className="doc-question-input"
            />
            <button onClick={handleAsk} disabled={!question.trim() || loading || !ollamaConnected} className="doc-send-btn">
              <SendIcon size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Action result */}
      {action !== 'query' && !loading && renderResult()}
    </div>
  );
}

// ── Multi-doc Q&A panel ──────────────────────────────────────
function MultiDocPanel({ documents }) {
  const { ollamaConnected } = useStore();
  const [question, setQuestion]   = useState('');
  const [loading, setLoading]     = useState(false);
  const [qHistory, setQHistory]   = useState([]);
  const [selected, setSelected]   = useState([]);
  const chatEndRef = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [qHistory]);

  function toggleDoc(fp) {
    setSelected(s => s.includes(fp) ? s.filter(x => x !== fp) : [...s, fp]);
  }

  async function handleAsk() {
    if (!question.trim() || loading) return;
    const q = question.trim();
    setQuestion('');
    setQHistory(h => [...h, { role: 'user', content: q }]);
    setLoading(true);
    try {
      const fps = selected.length > 0 ? selected : undefined;
      const data = await multiQueryDocuments(q, fps);
      setQHistory(h => [...h, {
        role: 'assistant', content: data.answer,
        sources: data.sources, model: data.model,
        docsReferenced: data.documentsReferenced, docsSearched: data.documentsSearched
      }]);
    } catch (err) {
      setQHistory(h => [...h, { role: 'assistant', content: `Error: ${err.response?.data?.error || err.message}`, isError: true }]);
    } finally {
      setLoading(false);
    }
  }

  if (documents.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
        <UsersIcon size={28} style={{ margin: '0 auto 8px', color: '#d1d5db' }} />
        <div>No documents indexed yet.</div>
        <div style={{ fontSize: 12, marginTop: 4 }}>Ingest documents first, then ask cross-document questions.</div>
      </div>
    );
  }

  return (
    <div className="doc-multi-panel">
      <div className="doc-multi-header">
        <UsersIcon size={15} style={{ color: 'var(--accent)' }} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Multi-Document Q&A</div>
          <div style={{ fontSize: 11, color: '#9ca3af' }}>
            Ask across {selected.length > 0 ? `${selected.length} selected` : `all ${documents.length}`} documents
          </div>
        </div>
      </div>

      {/* Document selector */}
      <div className="doc-multi-selector">
        <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4, fontWeight: 500 }}>Filter documents (leave empty to search all):</div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {documents.map(doc => (
            <button
              key={doc.filePath}
              onClick={() => toggleDoc(doc.filePath)}
              className={`doc-filter-chip ${selected.includes(doc.filePath) ? 'active' : ''}`}
            >
              {selected.includes(doc.filePath) && <CheckCircleIcon size={10} />}
              {doc.fileName}
            </button>
          ))}
        </div>
      </div>

      <div className="doc-chat">
        <div className="doc-chat-messages">
          {qHistory.length === 0 && (
            <div className="doc-chat-empty">
              <UsersIcon size={24} style={{ color: '#d1d5db', marginBottom: 8 }} />
              <div style={{ fontSize: 12, color: '#9ca3af' }}>Ask a question across your document library</div>
            </div>
          )}
          {qHistory.map((msg, i) => (
            <div key={i} className={`doc-chat-msg ${msg.role}`}>
              <div className="doc-chat-bubble">
                {msg.content}
                {msg.docsReferenced?.length > 0 && (
                  <div className="doc-sources">
                    {msg.docsReferenced.map((d, di) => (
                      <div key={di} className="doc-source-chip">{d}</div>
                    ))}
                  </div>
                )}
                {msg.model && <div className="doc-msg-model">{msg.model} · {msg.docsSearched} docs searched</div>}
              </div>
            </div>
          ))}
          {loading && (
            <div className="doc-chat-msg assistant">
              <div className="doc-chat-bubble"><Loader2Icon size={14} className="spin" /></div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
        <div className="doc-chat-input">
          <input
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAsk()}
            placeholder={ollamaConnected ? 'Ask across your documents...' : 'Start Ollama to ask questions'}
            disabled={loading || !ollamaConnected}
            className="doc-question-input"
          />
          <button onClick={handleAsk} disabled={!question.trim() || loading || !ollamaConnected} className="doc-send-btn">
            <SendIcon size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Organize panel ────────────────────────────────────────────
function OrganizePanel({ documents }) {
  const { ollamaConnected } = useStore();
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState(null);
  const [error, setError]         = useState(null);

  async function handleOrganize() {
    if (!ollamaConnected || !documents.length) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const fps = documents.map(d => d.filePath);
      const data = await organizeDocuments(fps);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <FolderSyncIcon size={15} style={{ color: 'var(--accent)' }} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Smart Organization</div>
          <div style={{ fontSize: 11, color: '#9ca3af' }}>AI-suggested folder structure for {documents.length} documents</div>
        </div>
      </div>

      {error && <div className="doc-error"><AlertCircleIcon size={13} />{error}</div>}

      {!result && !loading && (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <FolderSyncIcon size={36} style={{ color: '#d1d5db', margin: '0 auto 12px' }} />
          <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
            Analyze your {documents.length} indexed documents and get AI-powered folder organization suggestions.
          </div>
          <button
            onClick={handleOrganize}
            disabled={!ollamaConnected || !documents.length || loading}
            className="doc-action-primary"
          >
            <FolderSyncIcon size={14} /> Suggest Organization
          </button>
          {!ollamaConnected && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 8 }}>Requires Ollama</div>}
        </div>
      )}

      {loading && <div className="doc-loading"><Loader2Icon size={18} className="spin" style={{ color: 'var(--accent)' }} /><span>Analyzing documents...</span></div>}

      {result && (
        <div>
          <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 12 }}>Suggested folder structure for {result.fileCount} files:</div>
          {Object.entries(result.suggestions).map(([folder, files]) => (
            <div key={folder} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                <span>📁</span> {folder}
              </div>
              {files.map((f, i) => (
                <div key={i} style={{ fontSize: 11, color: '#6b7280', paddingLeft: 24, marginBottom: 2 }}>
                  📄 {f}
                </div>
              ))}
            </div>
          ))}
          <button onClick={handleOrganize} className="doc-action-secondary" style={{ marginTop: 8 }}>
            <RefreshCwIcon size={12} /> Re-analyze
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main panel ───────────────────────────────────────────────
export default function DocumentAgentPanel() {
  const { ollamaConnected } = useStore();

  const [documents, setDocuments]       = useState([]);
  const [selectedDoc, setSelectedDoc]   = useState(null);
  const [view, setView]                 = useState('library'); // 'library' | 'single' | 'multi' | 'organize'
  const [loading, setLoading]           = useState(false);
  const [ingestLoading, setIngestLoading] = useState(false);
  const [error, setError]               = useState(null);
  const [filePath, setFilePath]         = useState('');
  const [dirPath, setDirPath]           = useState('');
  const [showPathInput, setShowPathInput] = useState(false);
  const [showDirInput, setShowDirInput] = useState(false);
  const [dirResult, setDirResult]       = useState(null);

  useEffect(() => { fetchDocuments(); }, []);

  async function fetchDocuments() {
    try {
      const data = await listDocuments();
      setDocuments(data.documents || []);
    } catch { setDocuments([]); }
  }

  function selectDoc(doc) {
    setSelectedDoc(doc);
    setView('single');
    setError(null);
  }

  async function handleIngest() {
    if (!filePath.trim()) return;
    setIngestLoading(true);
    setError(null);
    try {
      await ingestDocument(filePath.trim());
      await fetchDocuments();
      setFilePath('');
      setShowPathInput(false);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setIngestLoading(false);
    }
  }

  async function handleIndexDir() {
    if (!dirPath.trim()) return;
    setLoading(true);
    setError(null);
    setDirResult(null);
    try {
      const data = await indexDocumentDirectory(dirPath.trim());
      setDirResult(data);
      await fetchDocuments();
      setDirPath('');
      setShowDirInput(false);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(doc, e) {
    e.stopPropagation();
    try {
      await deleteDocument(doc.filePath);
      if (selectedDoc?.filePath === doc.filePath) { setSelectedDoc(null); setView('library'); }
      await fetchDocuments();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  }

  // ── Single doc view ──────────────────────────────────────────
  if (view === 'single' && selectedDoc) {
    return <SingleDocPanel doc={selectedDoc} onBack={() => { setView('library'); setSelectedDoc(null); }} />;
  }

  // ── Multi-doc view ───────────────────────────────────────────
  if (view === 'multi') {
    return (
      <div className="doc-agent-panel">
        <div className="doc-top-bar">
          <button className="doc-back-btn" onClick={() => setView('library')}>
            <ChevronRightIcon size={14} style={{ transform: 'rotate(180deg)' }} /> Back
          </button>
        </div>
        <MultiDocPanel documents={documents} />
      </div>
    );
  }

  // ── Organize view ────────────────────────────────────────────
  if (view === 'organize') {
    return (
      <div className="doc-agent-panel">
        <div className="doc-top-bar">
          <button className="doc-back-btn" onClick={() => setView('library')}>
            <ChevronRightIcon size={14} style={{ transform: 'rotate(180deg)' }} /> Back
          </button>
        </div>
        <OrganizePanel documents={documents} />
      </div>
    );
  }

  // ── Library view ─────────────────────────────────────────────
  return (
    <div className="doc-agent-panel">
      {/* Header */}
      <div className="doc-agent-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileTextIcon size={16} style={{ color: 'var(--accent)' }} />
          <div>
            <div className="doc-agent-title">Document Agent</div>
            <div className="doc-agent-sub">{documents.length} document{documents.length !== 1 ? 's' : ''} indexed</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {documents.length > 0 && (
            <>
              <button className="doc-header-btn" onClick={() => setView('multi')} title="Multi-doc Q&A">
                <UsersIcon size={13} /> Multi Q&A
              </button>
              <button className="doc-header-btn" onClick={() => setView('organize')} title="Smart organization">
                <FolderSyncIcon size={13} /> Organize
              </button>
            </>
          )}
          <button className="doc-header-btn" onClick={() => setShowDirInput(v => !v)} title="Index directory">
            <FolderSyncIcon size={13} />
          </button>
          <button className="doc-add-btn" onClick={() => setShowPathInput(v => !v)}>
            <UploadIcon size={13} /> Add file
          </button>
        </div>
      </div>

      {/* Error */}
      {error && <div className="doc-error"><AlertCircleIcon size={14} />{error}<button onClick={() => setError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}><XIcon size={12} /></button></div>}

      {/* Dir result */}
      {dirResult && (
        <div className="doc-success">
          <CheckCircleIcon size={14} />
          Indexed {dirResult.indexed} of {dirResult.total} files
          <button onClick={() => setDirResult(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}><XIcon size={12} /></button>
        </div>
      )}

      {/* File ingest input */}
      {showPathInput && (
        <div className="doc-ingest-row">
          <FileIcon size={13} style={{ color: '#9ca3af', flexShrink: 0 }} />
          <input
            value={filePath}
            onChange={e => setFilePath(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleIngest()}
            placeholder="/path/to/file.pdf"
            className="doc-path-input"
            autoFocus
          />
          <button onClick={handleIngest} disabled={!filePath.trim() || ingestLoading} className="doc-ingest-btn">
            {ingestLoading ? <Loader2Icon size={13} className="spin" /> : 'Ingest'}
          </button>
          <button onClick={() => setShowPathInput(false)} className="doc-cancel-btn"><XIcon size={13} /></button>
        </div>
      )}

      {/* Dir index input */}
      {showDirInput && (
        <div className="doc-ingest-row">
          <FolderSyncIcon size={13} style={{ color: '#9ca3af', flexShrink: 0 }} />
          <input
            value={dirPath}
            onChange={e => setDirPath(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleIndexDir()}
            placeholder="/path/to/directory"
            className="doc-path-input"
            autoFocus
          />
          <button onClick={handleIndexDir} disabled={!dirPath.trim() || loading} className="doc-ingest-btn">
            {loading ? <Loader2Icon size={13} className="spin" /> : 'Index'}
          </button>
          <button onClick={() => setShowDirInput(false)} className="doc-cancel-btn"><XIcon size={13} /></button>
        </div>
      )}

      {/* Document library */}
      <div className="doc-library">
        {documents.length === 0 ? (
          <div className="doc-empty">
            <FileTextIcon size={36} style={{ color: '#d1d5db', margin: '0 auto 12px' }} />
            <div style={{ fontSize: 13, fontWeight: 500, color: '#6b7280', marginBottom: 4 }}>No documents indexed</div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 16 }}>Add files to start asking questions, summarizing, and extracting data.</div>
            <button className="doc-action-primary" onClick={() => setShowPathInput(true)}>
              <UploadIcon size={14} /> Add first document
            </button>
          </div>
        ) : (
          <div className="doc-list">
            {documents.map(doc => (
              <button key={doc.filePath} className="doc-list-item" onClick={() => selectDoc(doc)}>
                <ExtBadge ext={doc.ext} />
                <div className="doc-list-info">
                  <div className="doc-list-name">{doc.fileName}</div>
                  <div className="doc-list-meta">{doc.chunkCount} chunks · {doc.filePath}</div>
                </div>
                <ChevronRightIcon size={14} style={{ color: '#d1d5db', flexShrink: 0 }} />
                <button
                  onClick={(e) => handleDelete(doc, e)}
                  className="doc-delete-btn"
                  title="Remove from index"
                >
                  <TrashIcon size={12} />
                </button>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
