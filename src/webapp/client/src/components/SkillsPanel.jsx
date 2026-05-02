import React from 'react';
import useStore from '../store/useStore.js';

const SKILLS = [
  {
    icon: '📄',
    name: 'Summarize',
    desc: 'Condense a document into key points',
    prompt: 'Please summarize the selected document in 3–5 bullet points, highlighting the most important information.',
  },
  {
    icon: '🔍',
    name: 'Extract Key Info',
    desc: 'Pull out names, dates, and facts',
    prompt: 'Extract all key information from this document: names, dates, numbers, decisions, and action items.',
  },
  {
    icon: '✍️',
    name: 'Draft Reply',
    desc: 'Write a professional response',
    prompt: 'Based on this document, draft a professional and concise reply that addresses the main points.',
  },
  {
    icon: '🔄',
    name: 'Find Duplicates',
    desc: 'Detect duplicate or similar files',
    prompt: 'Scan the current directory for duplicate or very similar files and list them with their paths.',
  },
  {
    icon: '📊',
    name: 'Generate Report',
    desc: 'Create a structured report',
    prompt: 'Analyze the files in the current directory and generate a structured report covering content, themes, and recommendations.',
  },
  {
    icon: '💡',
    name: 'Explain Document',
    desc: 'Plain-language explanation',
    prompt: 'Explain this document in plain language as if you were describing it to someone unfamiliar with the topic.',
  },
  {
    icon: '🏷️',
    name: 'Tag & Categorize',
    desc: 'Auto-label files by topic',
    prompt: 'Review the files in the current directory and suggest tags and categories for each one.',
  },
  {
    icon: '🔐',
    name: 'Privacy Audit',
    desc: 'Flag sensitive data',
    prompt: 'Scan these files for any personally identifiable information (PII), sensitive data, or privacy risks and flag them.',
  },
  {
    icon: '🌐',
    name: 'Translate',
    desc: 'Translate content to English',
    prompt: 'Translate the content of this document to clear, professional English.',
  },
  {
    icon: '📝',
    name: 'Meeting Notes',
    desc: 'Format into meeting minutes',
    prompt: 'Format this content as structured meeting minutes with attendees, discussion points, decisions, and action items.',
  },
];

export default function SkillsPanel() {
  const { addMessage, setActiveTab } = useStore();

  function runSkill(skill) {
    addMessage({ role: 'user', content: skill.prompt });
    setActiveTab('chat');
  }

  return (
    <div className="skills-panel">
      <p className="skills-panel-title">Skills</p>
      <p className="skills-panel-sub">Click a skill to run it in your chat. Works on selected files.</p>
      <div className="skills-grid">
        {SKILLS.map(skill => (
          <button key={skill.name} className="skill-card" onClick={() => runSkill(skill)}>
            <span className="skill-icon">{skill.icon}</span>
            <span className="skill-name">{skill.name}</span>
            <span className="skill-desc">{skill.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
