import React, { useState, useEffect } from 'react';
import { Loader2Icon, PlusIcon, TrashIcon, XIcon, ZapIcon, CheckIcon } from 'lucide-react';
import useStore from '../store/useStore.js';
import { sendChat, getCustomSkills, createCustomSkill, deleteCustomSkill } from '../api/client.js';

const BUILT_IN_SKILLS = [
  { icon: '📄', name: 'Summarize',       desc: 'Condense a document into key points',    prompt: 'Please summarize the selected document in 3–5 bullet points, highlighting the most important information.' },
  { icon: '🔍', name: 'Extract Key Info', desc: 'Pull out names, dates, and facts',       prompt: 'Extract all key information from this document: names, dates, numbers, decisions, and action items.' },
  { icon: '✍️', name: 'Draft Reply',      desc: 'Write a professional response',          prompt: 'Based on this document, draft a professional and concise reply that addresses the main points.' },
  { icon: '🔄', name: 'Find Duplicates',  desc: 'Detect duplicate or similar files',      prompt: 'Scan the current directory for duplicate or very similar files and list them with their paths.' },
  { icon: '📊', name: 'Generate Report',  desc: 'Create a structured report',             prompt: 'Analyze the files in the current directory and generate a structured report covering content, themes, and recommendations.' },
  { icon: '💡', name: 'Explain Document', desc: 'Plain-language explanation',             prompt: 'Explain this document in plain language as if you were describing it to someone unfamiliar with the topic.' },
  { icon: '🏷️', name: 'Tag & Categorize', desc: 'Auto-label files by topic',              prompt: 'Review the files in the current directory and suggest tags and categories for each one.' },
  { icon: '🔐', name: 'Privacy Audit',    desc: 'Flag sensitive data',                    prompt: 'Scan these files for any personally identifiable information (PII), sensitive data, or privacy risks and flag them.' },
  { icon: '🌐', name: 'Translate',        desc: 'Translate content to English',           prompt: 'Translate the content of this document to clear, professional English.' },
  { icon: '📝', name: 'Meeting Notes',    desc: 'Format into meeting minutes',            prompt: 'Format this content as structured meeting minutes with attendees, discussion points, decisions, and action items.' },
  { icon: '🗂️', name: 'Organize Files',   desc: 'Suggest smart folder structure',         prompt: 'Analyze the files in my working directory and suggest an intelligent folder structure to organize them better.' },
  { icon: '🕵️', name: 'Find Patterns',   desc: 'Discover trends across files',           prompt: 'Analyze the files in the current directory and identify any patterns, recurring themes, or notable trends.' },
];

function SkillCard({ skill, running, onRun, onDelete, disabled }) {
  return (
    <button
      className={`skill-card ${running ? 'skill-card-running' : ''}`}
      onClick={() => onRun(skill)}
      disabled={disabled}
      style={{ position: 'relative' }}
    >
      {skill.custom && onDelete && (
        <span
          onClick={e => { e.stopPropagation(); onDelete(skill.id); }}
          className="skill-delete-btn"
          title="Delete skill"
        >
          <XIcon size={11} />
        </span>
      )}
      <span className="skill-icon">
        {running
          ? <Loader2Icon size={18} className="spin" style={{ color: 'var(--accent)' }} />
          : skill.icon}
      </span>
      <span className="skill-name">{skill.name}</span>
      <span className="skill-desc">{skill.desc}</span>
      {skill.custom && <span className="skill-custom-badge">custom</span>}
    </button>
  );
}

export default function SkillsPanel() {
  const { addMessage, setActiveTab, workingDirectory, setLoading } = useStore();
  const [runningSkill, setRunningSkill] = useState(null);
  const [customSkills, setCustomSkills] = useState([]);
  const [showForm, setShowForm]         = useState(false);
  const [formName, setFormName]         = useState('');
  const [formIcon, setFormIcon]         = useState('⚡');
  const [formDesc, setFormDesc]         = useState('');
  const [formPrompt, setFormPrompt]     = useState('');
  const [saving, setSaving]             = useState(false);
  const [saved, setSaved]               = useState(false);

  useEffect(() => { fetchCustomSkills(); }, []);

  async function fetchCustomSkills() {
    try {
      const data = await getCustomSkills();
      setCustomSkills(data.skills || []);
    } catch { setCustomSkills([]); }
  }

  async function runSkill(skill) {
    if (runningSkill) return;
    setRunningSkill(skill.name);
    setActiveTab('chat');
    addMessage({ role: 'user', content: skill.prompt });
    setLoading(true);
    try {
      const store = useStore.getState();
      const history = store.messages.map(m => ({ role: m.role, content: m.content }));
      const data = await sendChat({
        message: skill.prompt,
        history,
        workingDirectory: store.workingDirectory,
        workflowMode: store.workflowMode
      });
      if (data.requiresConfirmation) {
        addMessage({ role: 'assistant', content: data.message, model: data.model });
        useStore.getState().setPendingAction(data.pendingAction);
      } else {
        addMessage({
          role: 'assistant',
          content: data.response || data.error || 'No response',
          model: data.model,
          toolsUsed: data.toolsUsed
        });
      }
    } catch (err) {
      addMessage({ role: 'assistant', content: `Error: ${err.response?.data?.error || err.message}`, isError: true });
    } finally {
      setLoading(false);
      setRunningSkill(null);
    }
  }

  async function handleSaveSkill(e) {
    e.preventDefault();
    if (!formName.trim() || !formPrompt.trim()) return;
    setSaving(true);
    try {
      await createCustomSkill({ name: formName.trim(), icon: formIcon, desc: formDesc.trim(), prompt: formPrompt.trim() });
      await fetchCustomSkills();
      setFormName(''); setFormIcon('⚡'); setFormDesc(''); setFormPrompt('');
      setSaved(true);
      setTimeout(() => { setSaved(false); setShowForm(false); }, 1200);
    } catch { }
    finally { setSaving(false); }
  }

  async function handleDeleteSkill(id) {
    try {
      await deleteCustomSkill(id);
      setCustomSkills(s => s.filter(x => x.id !== id));
    } catch {}
  }

  const allSkills = [
    ...BUILT_IN_SKILLS,
    ...customSkills.map(s => ({ ...s, custom: true }))
  ];

  return (
    <div className="skills-panel">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <p className="skills-panel-title">Skills</p>
          <p className="skills-panel-sub">Click a skill to run it instantly in chat.</p>
        </div>
        <button
          className="skill-add-btn"
          onClick={() => setShowForm(v => !v)}
          title="Create custom skill"
        >
          <PlusIcon size={13} /> New skill
        </button>
      </div>

      {/* Custom skill form */}
      {showForm && (
        <form onSubmit={handleSaveSkill} className="skill-form">
          <div className="skill-form-title">Create Custom Skill</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={formIcon}
              onChange={e => setFormIcon(e.target.value)}
              placeholder="Icon"
              className="skill-form-icon-input"
              maxLength={4}
            />
            <input
              value={formName}
              onChange={e => setFormName(e.target.value)}
              placeholder="Skill name *"
              className="skill-form-input"
              style={{ flex: 1 }}
              required
            />
          </div>
          <input
            value={formDesc}
            onChange={e => setFormDesc(e.target.value)}
            placeholder="Short description (optional)"
            className="skill-form-input"
          />
          <textarea
            value={formPrompt}
            onChange={e => setFormPrompt(e.target.value)}
            placeholder="Prompt to send to AI when this skill is run *"
            className="skill-form-textarea"
            rows={3}
            required
          />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setShowForm(false)} className="skill-form-cancel">Cancel</button>
            <button type="submit" disabled={saving || !formName.trim() || !formPrompt.trim()} className="skill-form-save">
              {saving ? <Loader2Icon size={13} className="spin" /> : saved ? <CheckIcon size={13} /> : <ZapIcon size={13} />}
              {saved ? 'Saved!' : 'Save Skill'}
            </button>
          </div>
        </form>
      )}

      <div className="skills-grid">
        {allSkills.map(skill => (
          <SkillCard
            key={skill.name}
            skill={skill}
            running={runningSkill === skill.name}
            onRun={runSkill}
            onDelete={skill.custom ? handleDeleteSkill : null}
            disabled={!!runningSkill}
          />
        ))}
      </div>
    </div>
  );
}
