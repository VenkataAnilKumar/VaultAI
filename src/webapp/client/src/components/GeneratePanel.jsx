import React, { useState } from 'react';
import { PlusIcon, FileTextIcon, Loader2Icon, DownloadIcon, CopyIcon } from 'lucide-react';
import { generateDocument, transformDocument, synthesizeDocuments, extractData } from '../api/client.js';
import useStore from '../store/useStore.js';

const TRANSFORM_ACTIONS = ['Summarize', 'Simplify', 'Translate', 'Expand', 'Rewrite', 'Shorten'];
const SYNTHESIZE_ACTIONS = ['Compare', 'Merge', 'Find Contradictions', 'Extract Themes'];
const EXTRACT_TYPES = ['Dates', 'Names & Contacts', 'Prices', 'Action Items', 'Key Terms'];
const LANGUAGES = ['Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Portuguese', 'Italian', 'Arabic'];

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${active ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
    >
      {children}
    </button>
  );
}

export default function GeneratePanel() {
  const [tab, setTab] = useState('create');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const { workingDirectory } = useStore();

  const [createForm, setCreateForm] = useState({ prompt: '', contextFiles: '', outputPath: '' });
  const [transformForm, setTransformForm] = useState({ inputPath: '', instruction: '', action: '', language: 'Spanish', outputPath: '' });
  const [synthesizeForm, setSynthesizeForm] = useState({ inputPaths: '', instruction: '', action: '', outputPath: '' });
  const [extractForm, setExtractForm] = useState({ inputPath: '', goal: '', type: '', outputPath: '' });

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

  function copyResult() {
    const text = result?.content || JSON.stringify(result?.data, null, 2) || '';
    navigator.clipboard.writeText(text);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="panel-tab-bar border-b flex px-4">
        <TabButton active={tab === 'create'} onClick={() => { setTab('create'); setResult(null); setError(null); }}>Create</TabButton>
        <TabButton active={tab === 'transform'} onClick={() => { setTab('transform'); setResult(null); setError(null); }}>Transform</TabButton>
        <TabButton active={tab === 'synthesize'} onClick={() => { setTab('synthesize'); setResult(null); setError(null); }}>Synthesize</TabButton>
        <TabButton active={tab === 'extract'} onClick={() => { setTab('extract'); setResult(null); setError(null); }}>Extract</TabButton>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {tab === 'create' && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Describe what to generate</label>
              <textarea
                value={createForm.prompt}
                onChange={e => setCreateForm(f => ({ ...f, prompt: e.target.value }))}
                placeholder="Write a project status report for Q1..."
                rows={3}
                className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Context files (one path per line, optional)</label>
              <textarea
                value={createForm.contextFiles}
                onChange={e => setCreateForm(f => ({ ...f, contextFiles: e.target.value }))}
                placeholder={`${workingDirectory}/notes.txt`}
                rows={2}
                className="w-full border border-gray-200 rounded-lg p-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Output path (optional)</label>
              <input
                value={createForm.outputPath}
                onChange={e => setCreateForm(f => ({ ...f, outputPath: e.target.value }))}
                placeholder={`${workingDirectory}/output.md`}
                className="w-full border border-gray-200 rounded-lg p-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button onClick={handleCreate} disabled={!createForm.prompt || loading} className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40 transition-colors flex items-center justify-center gap-2">
              {loading ? <><Loader2Icon size={15} className="animate-spin" />Generating...</> : <><PlusIcon size={15} />Generate Document</>}
            </button>
          </div>
        )}

        {tab === 'transform' && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Source file</label>
              <input
                value={transformForm.inputPath}
                onChange={e => setTransformForm(f => ({ ...f, inputPath: e.target.value }))}
                placeholder={`${workingDirectory}/document.md`}
                className="w-full border border-gray-200 rounded-lg p-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Quick actions</label>
              <div className="flex flex-wrap gap-1.5">
                {TRANSFORM_ACTIONS.map(a => (
                  <button key={a} onClick={() => setTransformForm(f => ({ ...f, action: a }))}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${transformForm.action === a ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {a}
                  </button>
                ))}
              </div>
            </div>
            {transformForm.action === 'Translate' && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Target language</label>
                <select value={transformForm.language} onChange={e => setTransformForm(f => ({ ...f, language: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {LANGUAGES.map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Custom instruction (optional)</label>
              <input value={transformForm.instruction} onChange={e => setTransformForm(f => ({ ...f, instruction: e.target.value }))}
                placeholder="Or write your own instruction..." className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button onClick={handleTransform} disabled={!transformForm.inputPath || (!transformForm.action && !transformForm.instruction) || loading}
              className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40 transition-colors flex items-center justify-center gap-2">
              {loading ? <><Loader2Icon size={15} className="animate-spin" />Transforming...</> : 'Transform Document'}
            </button>
          </div>
        )}

        {tab === 'synthesize' && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Input files (one path per line, 2+ files)</label>
              <textarea value={synthesizeForm.inputPaths} onChange={e => setSynthesizeForm(f => ({ ...f, inputPaths: e.target.value }))}
                placeholder={`${workingDirectory}/doc1.pdf\n${workingDirectory}/doc2.md`}
                rows={3} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Quick actions</label>
              <div className="flex flex-wrap gap-1.5">
                {SYNTHESIZE_ACTIONS.map(a => (
                  <button key={a} onClick={() => setSynthesizeForm(f => ({ ...f, action: a }))}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${synthesizeForm.action === a ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {a}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Custom instruction</label>
              <input value={synthesizeForm.instruction} onChange={e => setSynthesizeForm(f => ({ ...f, instruction: e.target.value }))}
                placeholder="Or describe what to do with these files..." className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button onClick={handleSynthesize} disabled={!synthesizeForm.inputPaths || (!synthesizeForm.action && !synthesizeForm.instruction) || loading}
              className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40 transition-colors flex items-center justify-center gap-2">
              {loading ? <><Loader2Icon size={15} className="animate-spin" />Synthesizing...</> : 'Synthesize Documents'}
            </button>
          </div>
        )}

        {tab === 'extract' && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Source document</label>
              <input value={extractForm.inputPath} onChange={e => setExtractForm(f => ({ ...f, inputPath: e.target.value }))}
                placeholder={`${workingDirectory}/document.pdf`} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Extract type</label>
              <div className="flex flex-wrap gap-1.5">
                {EXTRACT_TYPES.map(t => (
                  <button key={t} onClick={() => setExtractForm(f => ({ ...f, type: t }))}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${extractForm.type === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Custom goal</label>
              <input value={extractForm.goal} onChange={e => setExtractForm(f => ({ ...f, goal: e.target.value }))}
                placeholder="Extract all company names and their revenues..." className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Export path (optional, .csv or .json)</label>
              <input value={extractForm.outputPath} onChange={e => setExtractForm(f => ({ ...f, outputPath: e.target.value }))}
                placeholder={`${workingDirectory}/extracted.csv`} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button onClick={handleExtract} disabled={!extractForm.inputPath || (!extractForm.type && !extractForm.goal) || loading}
              className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40 transition-colors flex items-center justify-center gap-2">
              {loading ? <><Loader2Icon size={15} className="animate-spin" />Extracting...</> : 'Extract Data'}
            </button>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-700">Result</span>
              <div className="flex gap-2">
                <button onClick={copyResult} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
                  <CopyIcon size={12} />Copy
                </button>
              </div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs font-mono max-h-64 overflow-y-auto whitespace-pre-wrap">
              {result.content || JSON.stringify(result.data, null, 2)}
            </div>
            {result.outputPath && (
              <p className="mt-2 text-xs text-green-600">Saved to: {result.outputPath}</p>
            )}
            {result.model && (
              <p className="mt-1 text-xs text-gray-400">Model: {result.model}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
