import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  PlusIcon, FileTextIcon, Loader2Icon, DownloadIcon, CopyIcon,
  CheckIcon, RefreshCwIcon, ArrowRightLeftIcon, LayersIcon, ScissorsIcon,
  SparklesIcon, AlertCircleIcon, WandIcon
} from 'lucide-react';
import { generateDocument, transformDocument, synthesizeDocuments, extractData } from '../api/client.js';
import useStore from '../store/useStore.js';

const TRANSFORM_ACTIONS = ['Summarize', 'Simplify', 'Translate', 'Expand', 'Rewrite', 'Shorten'];
const SYNTHESIZE_ACTIONS = ['Compare', 'Merge', 'Find Contradictions', 'Extract Themes'];
const EXTRACT_TYPES = ['Dates', 'Names & Contacts', 'Prices', 'Action Items', 'Key Terms'];
const LANGUAGES = ['Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Portuguese', 'Italian', 'Arabic'];

const TABS = [
  { id: 'create',     label: 'Create',     icon: PlusIcon,              desc: 'Generate a new document from a prompt' },
  { id: 'transform',  label: 'Transform',  icon: ArrowRightLeftIcon,    desc: 'Summarize, translate, or rewrite a file' },
  { id: 'synthesize', label: 'Synthesize', icon: LayersIcon,            desc: 'Combine or compare multiple documents' },
  { id: 'extract',    label: 'Extract',    icon: ScissorsIcon,          desc: 'Pull structured data from a file' },
];

function Chip({ label, active, onClick }) {
  return (
    <button
      className={`gen-chip ${active ? 'gen-chip-active' : ''}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function FieldLabel({ children }) {
  return <div className="gen-label">{children}</div>;
}

export default function GeneratePanel() {
  const [tab, setTab]       = useState('create');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError]   = useState(null);
  const [copied, setCopied] = useState(false);
  const { workingDirectory } = useStore();

  const [createForm, setCreateForm]       = useState({ prompt: '', contextFiles: '', outputPath: '' });
  const [transformForm, setTransformForm] = useState({ inputPath: '', instruction: '', action: '', language: 'Spanish', outputPath: '' });
  const [synthesizeForm, setSynthesizeForm] = useState({ inputPaths: '', instruction: '', action: '', outputPath: '' });
  const [extractForm, setExtractForm]     = useState({ inputPath: '', goal: '', type: '', outputPath: '' });

  function switchTab(id) {
    setTab(id);
    setResult(null);
    setError(null);
  }

  async function handleCreate() {
    setLoading(true); setError(null); setResult(null);
    try {
      const contextFiles = createForm.contextFiles ? createForm.contextFiles.split('\n').filter(Boolean) : [];
      const res = await generateDocument({ prompt: createForm.prompt, contextFiles, outputPath: createForm.outputPath || null });
      setResult(res);
    } catch (err) { setError(err.response?.data?.error || err.message); }
    finally { setLoading(false); }
  }

  async function handleTransform() {
    setLoading(true); setError(null); setResult(null);
    try {
      const instruction = transformForm.action === 'Translate'
        ? `Translate to ${transformForm.language}`
        : transformForm.action || transformForm.instruction;
      const res = await transformDocument({ inputPath: transformForm.inputPath, instruction, outputPath: transformForm.outputPath || null });
      setResult(res);
    } catch (err) { setError(err.response?.data?.error || err.message); }
    finally { setLoading(false); }
  }

  async function handleSynthesize() {
    setLoading(true); setError(null); setResult(null);
    try {
      const inputPaths = synthesizeForm.inputPaths.split('\n').filter(Boolean);
      const instruction = synthesizeForm.action || synthesizeForm.instruction;
      const res = await synthesizeDocuments({ inputPaths, instruction, outputPath: synthesizeForm.outputPath || null });
      setResult(res);
    } catch (err) { setError(err.response?.data?.error || err.message); }
    finally { setLoading(false); }
  }

  async function handleExtract() {
    setLoading(true); setError(null); setResult(null);
    try {
      const goal = extractForm.type || extractForm.goal;
      const res = await extractData({ inputPath: extractForm.inputPath, goal, outputPath: extractForm.outputPath || null });
      setResult(res);
    } catch (err) { setError(err.response?.data?.error || err.message); }
    finally { setLoading(false); }
  }

  const handlers = { create: handleCreate, transform: handleTransform, synthesize: handleSynthesize, extract: handleExtract };

  async function copyResult() {
    const text = result?.content || JSON.stringify(result?.data, null, 2) || '';
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadResult() {
    const content = result?.content || JSON.stringify(result?.data, null, 2) || '';
    const isJson = !result?.content && result?.data;
    const ext = isJson ? 'json' : 'md';
    const blob = new Blob([content], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vault-ai-output-${Date.now()}.${ext}`;
    a.click();
  }

  const isProseResult = !!result?.content;

  return (
    <div className="gen-panel">
      {/* Header */}
      <div className="gen-header">
        <SparklesIcon size={16} style={{ color: 'var(--accent)' }} />
        <div>
          <div className="gen-title">AI Generator</div>
          <div className="gen-sub">Create and transform documents with local AI</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="gen-tabs">
        {TABS.map(t => (
          <button key={t.id} className={`gen-tab ${tab === t.id ? 'active' : ''}`} onClick={() => switchTab(t.id)}>
            <t.icon size={12} />
            {t.label}
          </button>
        ))}
      </div>

      <div className="gen-body">
        {/* ── CREATE ─────────────────────────────────── */}
        {tab === 'create' && (
          <div className="gen-form">
            <div>
              <FieldLabel>Describe what to generate</FieldLabel>
              <textarea
                value={createForm.prompt}
                onChange={e => setCreateForm(f => ({ ...f, prompt: e.target.value }))}
                placeholder="Write a Q1 project status report summarizing milestones, blockers, and next steps..."
                rows={4}
                className="gen-textarea"
              />
            </div>
            <div>
              <FieldLabel>Context files <span className="gen-optional">optional — one path per line</span></FieldLabel>
              <textarea
                value={createForm.contextFiles}
                onChange={e => setCreateForm(f => ({ ...f, contextFiles: e.target.value }))}
                placeholder={`${workingDirectory}/notes.txt\n${workingDirectory}/data.csv`}
                rows={2}
                className="gen-textarea gen-mono"
              />
            </div>
            <div>
              <FieldLabel>Save output to <span className="gen-optional">optional</span></FieldLabel>
              <input
                value={createForm.outputPath}
                onChange={e => setCreateForm(f => ({ ...f, outputPath: e.target.value }))}
                placeholder={`${workingDirectory}/report.md`}
                className="gen-input gen-mono"
              />
            </div>
          </div>
        )}

        {/* ── TRANSFORM ─────────────────────────────── */}
        {tab === 'transform' && (
          <div className="gen-form">
            <div>
              <FieldLabel>Source file</FieldLabel>
              <input
                value={transformForm.inputPath}
                onChange={e => setTransformForm(f => ({ ...f, inputPath: e.target.value }))}
                placeholder={`${workingDirectory}/document.md`}
                className="gen-input gen-mono"
              />
            </div>
            <div>
              <FieldLabel>Quick action</FieldLabel>
              <div className="gen-chips">
                {TRANSFORM_ACTIONS.map(a => (
                  <Chip key={a} label={a} active={transformForm.action === a}
                    onClick={() => setTransformForm(f => ({ ...f, action: f.action === a ? '' : a }))} />
                ))}
              </div>
            </div>
            {transformForm.action === 'Translate' && (
              <div>
                <FieldLabel>Target language</FieldLabel>
                <select value={transformForm.language} onChange={e => setTransformForm(f => ({ ...f, language: e.target.value }))} className="gen-select">
                  {LANGUAGES.map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
            )}
            <div>
              <FieldLabel>Custom instruction <span className="gen-optional">overrides quick action</span></FieldLabel>
              <input value={transformForm.instruction} onChange={e => setTransformForm(f => ({ ...f, instruction: e.target.value }))}
                placeholder="Or write your own instruction..." className="gen-input" />
            </div>
          </div>
        )}

        {/* ── SYNTHESIZE ────────────────────────────── */}
        {tab === 'synthesize' && (
          <div className="gen-form">
            <div>
              <FieldLabel>Input files <span className="gen-optional">one path per line, 2+ files</span></FieldLabel>
              <textarea value={synthesizeForm.inputPaths} onChange={e => setSynthesizeForm(f => ({ ...f, inputPaths: e.target.value }))}
                placeholder={`${workingDirectory}/doc1.pdf\n${workingDirectory}/doc2.md`}
                rows={3} className="gen-textarea gen-mono" />
            </div>
            <div>
              <FieldLabel>Action</FieldLabel>
              <div className="gen-chips">
                {SYNTHESIZE_ACTIONS.map(a => (
                  <Chip key={a} label={a} active={synthesizeForm.action === a}
                    onClick={() => setSynthesizeForm(f => ({ ...f, action: f.action === a ? '' : a }))} />
                ))}
              </div>
            </div>
            <div>
              <FieldLabel>Custom instruction <span className="gen-optional">optional</span></FieldLabel>
              <input value={synthesizeForm.instruction} onChange={e => setSynthesizeForm(f => ({ ...f, instruction: e.target.value }))}
                placeholder="Describe what to do with these files..." className="gen-input" />
            </div>
          </div>
        )}

        {/* ── EXTRACT ───────────────────────────────── */}
        {tab === 'extract' && (
          <div className="gen-form">
            <div>
              <FieldLabel>Source document</FieldLabel>
              <input value={extractForm.inputPath} onChange={e => setExtractForm(f => ({ ...f, inputPath: e.target.value }))}
                placeholder={`${workingDirectory}/document.pdf`} className="gen-input gen-mono" />
            </div>
            <div>
              <FieldLabel>What to extract</FieldLabel>
              <div className="gen-chips">
                {EXTRACT_TYPES.map(t => (
                  <Chip key={t} label={t} active={extractForm.type === t}
                    onClick={() => setExtractForm(f => ({ ...f, type: f.type === t ? '' : t }))} />
                ))}
              </div>
            </div>
            <div>
              <FieldLabel>Custom goal <span className="gen-optional">optional</span></FieldLabel>
              <input value={extractForm.goal} onChange={e => setExtractForm(f => ({ ...f, goal: e.target.value }))}
                placeholder="Extract all company names and their revenues..." className="gen-input" />
            </div>
            <div>
              <FieldLabel>Export path <span className="gen-optional">optional, .csv or .json</span></FieldLabel>
              <input value={extractForm.outputPath} onChange={e => setExtractForm(f => ({ ...f, outputPath: e.target.value }))}
                placeholder={`${workingDirectory}/extracted.csv`} className="gen-input gen-mono" />
            </div>
          </div>
        )}

        {/* Submit button */}
        <button
          onClick={handlers[tab]}
          disabled={loading || (
            (tab === 'create'     && !createForm.prompt) ||
            (tab === 'transform'  && (!transformForm.inputPath || (!transformForm.action && !transformForm.instruction))) ||
            (tab === 'synthesize' && (!synthesizeForm.inputPaths || (!synthesizeForm.action && !synthesizeForm.instruction))) ||
            (tab === 'extract'    && (!extractForm.inputPath || (!extractForm.type && !extractForm.goal)))
          )}
          className="gen-submit-btn"
        >
          {loading
            ? <><Loader2Icon size={14} className="spin" /> {TABS.find(t => t.id === tab)?.label}ing…</>
            : <><WandIcon size={14} /> {TABS.find(t => t.id === tab)?.label}</>
          }
        </button>

        {/* Error */}
        {error && (
          <div className="gen-error">
            <AlertCircleIcon size={13} />
            <span>{error}</span>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="gen-result">
            <div className="gen-result-header">
              <div className="gen-result-meta">
                <FileTextIcon size={13} />
                <span>Result</span>
                {result.model && <span className="gen-model-badge">{result.model}</span>}
                {result.wordCount && <span className="gen-word-count">{result.wordCount} words</span>}
              </div>
              <div className="gen-result-actions">
                <button className="gen-action-btn" onClick={copyResult}>
                  {copied ? <CheckIcon size={12} /> : <CopyIcon size={12} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button className="gen-action-btn" onClick={downloadResult}>
                  <DownloadIcon size={12} /> Download
                </button>
                <button className="gen-action-btn" onClick={() => { setResult(null); setError(null); }}>
                  <RefreshCwIcon size={12} /> New
                </button>
              </div>
            </div>

            {result.outputPath && (
              <div className="gen-saved-path">Saved to {result.outputPath}</div>
            )}

            <div className={`gen-result-body ${isProseResult ? 'gen-result-prose' : 'gen-result-code'}`}>
              {isProseResult ? (
                <ReactMarkdown
                  components={{
                    h1: ({children}) => <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)', margin: '10px 0 6px' }}>{children}</h1>,
                    h2: ({children}) => <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', margin: '10px 0 5px', borderBottom: '1px solid var(--border)', paddingBottom: 3 }}>{children}</h2>,
                    h3: ({children}) => <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', margin: '8px 0 4px' }}>{children}</h3>,
                    p:  ({children}) => <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.65, marginBottom: 6 }}>{children}</p>,
                    li: ({children}) => <li style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 3 }}>{children}</li>,
                    ul: ({children}) => <ul style={{ paddingLeft: 16, margin: '4px 0' }}>{children}</ul>,
                    ol: ({children}) => <ol style={{ paddingLeft: 16, margin: '4px 0' }}>{children}</ol>,
                    strong: ({children}) => <strong style={{ fontWeight: 600, color: 'var(--text-1)' }}>{children}</strong>,
                    em: ({children}) => <em style={{ color: 'var(--text-3)', fontStyle: 'italic' }}>{children}</em>,
                    code: ({inline, children}) => inline
                      ? <code style={{ fontFamily: 'monospace', fontSize: 12, background: 'var(--surface-2)', padding: '1px 4px', borderRadius: 3 }}>{children}</code>
                      : <pre style={{ fontFamily: 'monospace', fontSize: 12, background: 'var(--surface-2)', padding: 10, borderRadius: 6, overflow: 'auto' }}><code>{children}</code></pre>,
                  }}
                >
                  {result.content}
                </ReactMarkdown>
              ) : (
                <pre>{JSON.stringify(result.data, null, 2)}</pre>
              )}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!result && !error && !loading && (
          <div className="gen-empty">
            <SparklesIcon size={32} style={{ color: '#d1d5db', marginBottom: 10 }} />
            <div className="gen-empty-title">{TABS.find(t => t.id === tab)?.desc}</div>
          </div>
        )}
      </div>
    </div>
  );
}
