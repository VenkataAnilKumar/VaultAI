import React, { useEffect, useRef, useState } from 'react';
import {
  LockIcon, MessageSquareIcon, SearchIcon, SparklesIcon, CpuIcon,
  PlugIcon, ServerIcon, ShieldCheckIcon, ArrowRightIcon, CheckIcon,
  FolderIcon, FileTextIcon, GitBranchIcon, DatabaseIcon, BookmarkIcon,
  MailIcon, ZapIcon, BotIcon, ChevronDownIcon, ExternalLinkIcon,
  GlobeIcon, CodeIcon, UsersIcon, ClockIcon
} from 'lucide-react';

/* ─── Reveal on scroll ─── */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    const obs = new IntersectionObserver(
      (entries) => entries.forEach(e => e.isIntersecting && e.target.classList.add('visible')),
      { threshold: 0.12 }
    );
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

/* ─── NAV ─── */
function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'glass border-b border-white/5 py-3' : 'py-5'}`}>
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <LockIcon size={16} className="text-white" />
          </div>
          <span className="font-bold text-white text-lg tracking-tight">Vault AI</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-white/50">
          {['Features', 'How it Works', 'Privacy', 'Roadmap'].map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(/\s+/g, '-')}`}
              className="hover:text-white transition-colors duration-200">{l}</a>
          ))}
        </div>
        <a href="http://localhost:5173" target="_blank" rel="noopener noreferrer"
          className="btn-primary text-white text-sm font-semibold px-5 py-2.5 rounded-xl flex items-center gap-2">
          Open App <ArrowRightIcon size={14} />
        </a>
      </div>
    </nav>
  );
}

/* ─── HERO ─── */
function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="animate-orb-1 absolute top-1/4 left-1/4 w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 70%)' }} />
        <div className="animate-orb-2 absolute bottom-1/4 right-1/3 w-80 h-80 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.16) 0%, transparent 70%)' }} />
        <div className="animate-orb-3 absolute top-1/3 right-1/4 w-64 h-64 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)' }} />
        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '64px 64px' }} />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 glass px-4 py-1.5 rounded-full mb-8 text-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse-slow" />
          <span className="text-white/60">100% Local · Zero Data Egress · Open Architecture</span>
        </div>

        {/* Headline */}
        <h1 className="font-black leading-[0.95] tracking-tight mb-6"
          style={{ fontSize: 'clamp(52px, 9vw, 104px)' }}>
          <span className="text-white block">Your Files.</span>
          <span className="text-gradient block">Your AI.</span>
          <span className="text-white block">Your Privacy.</span>
        </h1>

        <p className="text-white/50 text-xl max-w-2xl mx-auto leading-relaxed mb-12"
          style={{ fontSize: 'clamp(16px, 2.5vw, 20px)' }}>
          The AI-native file platform that runs entirely on your machine.
          Natural language file management, semantic search, document generation — 
          powered by local models. <span className="text-white/80 font-medium">No cloud. No subscriptions. No compromise.</span>
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <a href="http://localhost:5173" target="_blank" rel="noopener noreferrer"
            className="btn-primary text-white font-bold px-8 py-4 rounded-2xl text-base flex items-center gap-2.5 glow-blue">
            <SparklesIcon size={18} />
            Launch Vault AI
            <ArrowRightIcon size={16} />
          </a>
          <a href="#features"
            className="glass text-white/70 hover:text-white font-semibold px-8 py-4 rounded-2xl text-base flex items-center gap-2.5 transition-all duration-200 hover:border-white/15">
            See Features
            <ChevronDownIcon size={16} />
          </a>
        </div>

        {/* Mock terminal UI */}
        <div className="animate-float max-w-2xl mx-auto">
          <div className="glass rounded-2xl overflow-hidden border border-white/10"
            style={{ boxShadow: '0 48px 120px rgba(0,0,0,0.6), 0 0 0 1px rgba(59,130,246,0.1), inset 0 1px 0 rgba(255,255,255,0.06)' }}>
            {/* Window chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/[0.02]">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <div className="w-3 h-3 rounded-full bg-green-500/70" />
              </div>
              <div className="flex-1 text-center">
                <span className="text-white/30 text-xs font-mono">vault-ai — chat</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                <span className="text-xs text-white/30">Local</span>
              </div>
            </div>
            {/* Chat messages */}
            <div className="p-5 space-y-4 text-left">
              <ChatLine role="user" text="Move all invoices from Downloads to Documents/Finance/2024 and rename them by date" />
              <ChatLine role="ai" text="Found 7 invoice files in Downloads. I'll move them to Documents/Finance/2024 and rename each by its invoice date. This will affect 7 files — confirm?" model="llama3.2:3b" />
              <div className="flex gap-2 pl-10">
                <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500/15 text-green-400 border border-green-500/20 cursor-pointer hover:bg-green-500/25 transition-colors">✓ Confirm</span>
                <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-white/40 border border-white/10">Cancel</span>
              </div>
              <ChatLine role="ai" text="Done. Moved 7 files → Documents/Finance/2024. Renamed: invoice_2024-01-15.pdf, invoice_2024-02-03.pdf..." model="llama3.2:3b" done />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ChatLine({ role, text, model, done }) {
  const isUser = role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'items-start gap-2.5'}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
          <LockIcon size={13} className="text-white" />
        </div>
      )}
      <div className={`max-w-sm ${isUser ? 'bg-blue-600/80 rounded-2xl rounded-tr-sm px-4 py-2.5' : 'flex-1'}`}>
        {isUser ? (
          <p className="text-sm text-white">{text}</p>
        ) : (
          <div className="glass rounded-2xl rounded-tl-sm px-4 py-3">
            <p className="text-sm text-white/80 leading-relaxed">{text}
              {!done && <span className="cursor text-blue-400 ml-0.5">|</span>}
            </p>
            {model && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-white/25 font-mono">{model}</span>
                {done && <span className="text-xs text-green-400/70">✓ complete</span>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── STATS ─── */
function Stats() {
  const stats = [
    { value: '100%', label: 'Local Processing', sub: 'Zero data leaves your device' },
    { value: '6', label: 'Specialized AI Agents', sub: 'Right model for every task' },
    { value: '5+', label: 'Data Connectors', sub: 'Obsidian, SQLite, Git & more' },
  ];
  return (
    <section className="py-12 border-y border-white/[0.04]">
      <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-3 gap-8">
        {stats.map(s => (
          <div key={s.label} className="text-center reveal">
            <div className="text-gradient font-black text-4xl mb-1">{s.value}</div>
            <div className="text-white font-semibold text-sm mb-0.5">{s.label}</div>
            <div className="text-white/35 text-xs">{s.sub}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── PROBLEM ─── */
function Problem() {
  const before = [
    'Upload sensitive files to ChatGPT or Claude',
    'Your documents stored on foreign servers',
    'Monthly API fees for every token you send',
    'One model for everything — wrong tool for the job',
    'No file operations — read-only AI assistants',
    'Privacy "policies" you can\'t audit or verify',
  ];
  const after = [
    'AI runs entirely on localhost via Ollama',
    'Your files never leave your machine — ever',
    'One-time setup, no ongoing cloud costs',
    'Auto-routing: best model per task type',
    'Full file management: move, rename, generate',
    'Open architecture — fully auditable by design',
  ];

  return (
    <section id="how-it-works" className="py-28 relative">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-16 reveal">
          <div className="text-blue-400 text-sm font-semibold uppercase tracking-widest mb-4">The Problem</div>
          <h2 className="font-black text-white text-4xl md:text-5xl tracking-tight mb-4">
            Cloud AI asks for<br /><span className="text-gradient">the one thing you can't give.</span>
          </h2>
          <p className="text-white/45 text-lg max-w-xl mx-auto">
            Attorneys, doctors, engineers, and compliance teams cannot upload confidential documents to cloud AI. Vault AI was built for them.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 reveal">
          {/* Before */}
          <div className="glass rounded-2xl p-7 border border-red-500/10">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-red-400 font-semibold text-sm uppercase tracking-wider">Cloud AI</span>
            </div>
            <div className="space-y-3">
              {before.map(item => (
                <div key={item} className="flex items-start gap-3">
                  <span className="text-red-500/60 mt-0.5 flex-shrink-0">✗</span>
                  <span className="text-white/45 text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* After */}
          <div className="rounded-2xl p-7 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(124,58,237,0.06) 100%)', border: '1px solid rgba(59,130,246,0.2)' }}>
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-20"
              style={{ background: 'radial-gradient(circle, #3b82f6, transparent)' }} />
            <div className="flex items-center gap-2 mb-6">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              <span className="text-blue-400 font-semibold text-sm uppercase tracking-wider">Vault AI</span>
            </div>
            <div className="space-y-3">
              {after.map(item => (
                <div key={item} className="flex items-start gap-3">
                  <span className="text-blue-400 mt-0.5 flex-shrink-0">✓</span>
                  <span className="text-white/80 text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── FEATURES ─── */
const FEATURES = [
  {
    icon: MessageSquareIcon,
    color: '#3b82f6',
    title: 'Natural Language File Management',
    desc: 'Move, copy, rename, delete, and organize files by typing instructions. "Move all invoices to Finance/2024 and rename by date" — done.',
    examples: ['Move 500 files in seconds', 'Bulk rename by content', 'Smart folder organization'],
  },
  {
    icon: SearchIcon,
    color: '#7c3aed',
    title: 'Semantic Search',
    desc: 'Search across all your documents by meaning — not just keywords. Find "termination clauses" across 1,000 contracts without remembering exact words.',
    examples: ['Vector embeddings, local only', 'Cross-document search', 'Source-cited results'],
  },
  {
    icon: SparklesIcon,
    color: '#06b6d4',
    title: 'Document Generation',
    desc: 'Create, transform, synthesize, and extract from documents. Generate a proposal from your notes. Translate a contract. Extract all dates to CSV.',
    examples: ['Create from prompt', 'Transform & translate', 'Extract structured data'],
  },
  {
    icon: CpuIcon,
    color: '#10b981',
    title: 'Multi-Model Intelligence',
    desc: 'Multiple specialized models via Ollama, auto-routed per task. File ops use a fast 3B model. Document Q&A uses your biggest reasoning model.',
    examples: ['Auto model routing', '6 specialized agents', 'Works with 1 model installed'],
  },
  {
    icon: PlugIcon,
    color: '#f59e0b',
    title: 'Local Connectors',
    desc: 'Query Obsidian notes, SQLite databases, Git repos, email archives, and browser bookmarks — all local, all private. No OAuth, no cloud.',
    examples: ['Obsidian vault notes', 'NL → SQL queries', 'Git commit analysis'],
  },
  {
    icon: ServerIcon,
    color: '#ec4899',
    title: 'MCP Protocol',
    desc: 'Vault AI exposes its tools via MCP so Claude Desktop can call your vault. Or connect external MCP servers to extend Vault AI with web search & APIs.',
    examples: ['Claude Desktop integration', 'SSE & stdio transports', 'External tool namespacing'],
  },
];

function Features() {
  return (
    <section id="features" className="py-28 relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }} />
      </div>
      <div className="max-w-6xl mx-auto px-6 relative">
        <div className="text-center mb-16 reveal">
          <div className="text-purple-400 text-sm font-semibold uppercase tracking-widest mb-4">Capabilities</div>
          <h2 className="font-black text-white text-4xl md:text-5xl tracking-tight mb-4">
            Everything you need.<br /><span className="text-gradient">Nothing in the cloud.</span>
          </h2>
          <p className="text-white/45 text-lg max-w-xl mx-auto">
            A complete AI file intelligence platform — file management, search, generation, agents, connectors, and MCP — all running on localhost.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <div key={f.title} className="feature-card glass rounded-2xl p-7 reveal" style={{ transitionDelay: `${i * 80}ms` }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 flex-shrink-0"
                style={{ background: `${f.color}18`, border: `1px solid ${f.color}30` }}>
                <f.icon size={20} style={{ color: f.color }} />
              </div>
              <h3 className="font-bold text-white text-base mb-2">{f.title}</h3>
              <p className="text-white/45 text-sm leading-relaxed mb-4">{f.desc}</p>
              <div className="space-y-1.5">
                {f.examples.map(ex => (
                  <div key={ex} className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: f.color }} />
                    <span className="text-xs text-white/40">{ex}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── HOW IT WORKS ─── */
function HowItWorks() {
  const steps = [
    {
      n: '01', title: 'Install Ollama', color: '#3b82f6',
      desc: 'Download Ollama from ollama.com. Pull any model — llama3.2, mistral, qwen2.5-coder. Works with 1 model, optimizes with more.',
      code: 'ollama serve\nollama pull llama3.2\nollama pull nomic-embed-text',
    },
    {
      n: '02', title: 'Open Vault AI', color: '#7c3aed',
      desc: 'Launch the app. It detects your models automatically and routes each task to the right one. No configuration required.',
      code: 'cd VaultAI && npm install\nnpm run dev\n# → http://localhost:5173',
    },
    {
      n: '03', title: 'Talk to Your Files', color: '#06b6d4',
      desc: 'Type natural language instructions. Manage files, search across documents, generate content — all processed locally by your models.',
      code: '"Move all PDFs to Archive/"\n"Summarize contract.pdf"\n"Extract all dates to CSV"',
    },
  ];

  return (
    <section className="py-28">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-16 reveal">
          <div className="text-cyan-400 text-sm font-semibold uppercase tracking-widest mb-4">Setup</div>
          <h2 className="font-black text-white text-4xl md:text-5xl tracking-tight mb-4">
            Up and running in <span className="text-gradient">under 2 minutes.</span>
          </h2>
        </div>

        <div className="space-y-8">
          {steps.map((step, i) => (
            <div key={step.n} className="reveal relative pl-12 timeline-item" style={{ transitionDelay: `${i * 120}ms` }}>
              <div className="absolute left-0 top-0 w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black"
                style={{ background: `${step.color}18`, border: `1px solid ${step.color}30`, color: step.color }}>
                {step.n}
              </div>
              <div className="glass rounded-2xl p-6 flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <h3 className="font-bold text-white text-lg mb-2">{step.title}</h3>
                  <p className="text-white/45 text-sm leading-relaxed">{step.desc}</p>
                </div>
                <div className="md:w-64 flex-shrink-0">
                  <div className="rounded-xl overflow-hidden" style={{ background: '#0a0a12', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/5">
                      <div className="w-2 h-2 rounded-full" style={{ background: step.color, opacity: 0.7 }} />
                      <span className="text-white/25 text-xs font-mono">terminal</span>
                    </div>
                    <pre className="px-4 py-3 text-xs font-mono leading-relaxed" style={{ color: step.color }}>
                      {step.code}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── CONNECTORS ─── */
const CONNECTORS = [
  { icon: FolderIcon, name: 'Obsidian', desc: 'Notes, tags & wikilinks', color: '#7c3aed' },
  { icon: DatabaseIcon, name: 'SQLite', desc: 'Natural language → SQL', color: '#3b82f6' },
  { icon: GitBranchIcon, name: 'Git', desc: 'Commits, diffs & history', color: '#f97316' },
  { icon: MailIcon, name: 'Email', desc: '.mbox & .eml archives', color: '#ef4444' },
  { icon: BookmarkIcon, name: 'Bookmarks', desc: 'Chrome, Firefox, Safari', color: '#eab308' },
  { icon: ServerIcon, name: 'MCP Servers', desc: 'External tools via MCP', color: '#ec4899' },
];

function Connectors() {
  return (
    <section className="py-28 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-1/4 w-96 h-64 rounded-full opacity-10"
          style={{ background: 'radial-gradient(ellipse, #f59e0b, transparent)' }} />
      </div>
      <div className="max-w-5xl mx-auto px-6 relative">
        <div className="text-center mb-14 reveal">
          <div className="text-amber-400 text-sm font-semibold uppercase tracking-widest mb-4">Connectors</div>
          <h2 className="font-black text-white text-4xl md:text-5xl tracking-tight mb-4">
            Your AI reads<br /><span className="text-gradient">all your data sources.</span>
          </h2>
          <p className="text-white/45 text-lg max-w-xl mx-auto">
            Connect local data sources and Vault AI can query them directly in chat — no data leaves your machine.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 reveal">
          {CONNECTORS.map(c => (
            <div key={c.name} className="connector-badge glass rounded-2xl p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${c.color}18`, border: `1px solid ${c.color}25` }}>
                <c.icon size={18} style={{ color: c.color }} />
              </div>
              <div>
                <p className="font-semibold text-white text-sm">{c.name}</p>
                <p className="text-white/35 text-xs">{c.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* MCP detail */}
        <div className="mt-10 glass rounded-2xl p-7 reveal"
          style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.06) 0%, rgba(124,58,237,0.06) 100%)', borderColor: 'rgba(236,72,153,0.15)' }}>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <ServerIcon size={16} className="text-pink-400" />
                <span className="text-pink-400 font-semibold text-sm">Model Context Protocol</span>
              </div>
              <h3 className="font-bold text-white text-xl mb-2">Vault AI speaks MCP — both ways.</h3>
              <p className="text-white/45 text-sm leading-relaxed">
                Expose Vault AI tools to Claude Desktop, Cursor, or any MCP client. Or connect external MCP servers — Brave Search, GitHub, PostgreSQL — and use their tools directly in your chat.
              </p>
            </div>
            <div className="md:w-72 flex-shrink-0 rounded-xl overflow-hidden" style={{ background: '#070710', border: '1px solid rgba(236,72,153,0.15)' }}>
              <div className="px-3 py-2 border-b border-white/5 text-xs text-white/25 font-mono">claude_desktop_config.json</div>
              <pre className="px-4 py-3 text-xs font-mono text-white/50 leading-relaxed">{`{
  "mcpServers": {
    "vault-ai": {
      "url": "http://localhost:3002/sse"
    }
  }
}`}</pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── PRIVACY ─── */
function Privacy() {
  const pillars = [
    { icon: ShieldCheckIcon, color: '#10b981', title: 'Zero Data Egress', desc: 'By architecture, not policy. Every byte stays on your machine. Verifiable: no outbound connections except localhost.' },
    { icon: CpuIcon, color: '#3b82f6', title: 'Local Model Execution', desc: 'Ollama runs models on your hardware. No API tokens, no usage tracking, no model provider seeing your data.' },
    { icon: LockIcon, color: '#7c3aed', title: 'Open & Auditable', desc: 'No black boxes. The entire stack is inspectable. Every network call, every model invocation — visible and local.' },
    { icon: FolderIcon, color: '#f59e0b', title: 'Safe File Ops', desc: 'Deleted files go to OS Trash — never permanent deletion. All destructive operations require explicit confirmation.' },
  ];

  return (
    <section id="privacy" className="py-28 relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 right-0 w-96 h-96 -translate-y-1/2 opacity-10"
          style={{ background: 'radial-gradient(circle, #10b981, transparent)' }} />
      </div>
      <div className="max-w-5xl mx-auto px-6 relative">
        <div className="text-center mb-16 reveal">
          <div className="text-green-400 text-sm font-semibold uppercase tracking-widest mb-4">Privacy</div>
          <h2 className="font-black text-white text-4xl md:text-5xl tracking-tight mb-4">
            Privacy isn't a feature.<br /><span className="text-gradient">It's the foundation.</span>
          </h2>
          <p className="text-white/45 text-lg max-w-xl mx-auto">
            Built for attorneys, healthcare teams, compliance officers, and anyone whose files are too sensitive for the cloud.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-10">
          {pillars.map((p, i) => (
            <div key={p.title} className="feature-card glass rounded-2xl p-6 flex gap-4 reveal" style={{ transitionDelay: `${i * 80}ms` }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${p.color}15`, border: `1px solid ${p.color}25` }}>
                <p.icon size={18} style={{ color: p.color }} />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm mb-1">{p.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Privacy status bar */}
        <div className="reveal glass rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4"
          style={{ background: 'rgba(16,185,129,0.05)', borderColor: 'rgba(16,185,129,0.15)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse-slow" />
            <span className="text-green-400 font-semibold text-sm">Privacy Status: All Clear</span>
          </div>
          <div className="flex flex-wrap gap-4 sm:ml-auto text-xs text-white/35">
            <span className="flex items-center gap-1.5"><CheckIcon size={11} className="text-green-400" />Ollama: localhost:11434</span>
            <span className="flex items-center gap-1.5"><CheckIcon size={11} className="text-green-400" />External requests: 0</span>
            <span className="flex items-center gap-1.5"><CheckIcon size={11} className="text-green-400" />Telemetry: disabled</span>
            <span className="flex items-center gap-1.5"><CheckIcon size={11} className="text-green-400" />File ops: logged locally</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── PERSONAS ─── */
function Personas() {
  const personas = [
    {
      emoji: '⚖️',
      name: 'Clara',
      role: 'Immigration Attorney',
      pain: 'Ethics rules ban cloud AI. Client files cannot leave her machine.',
      gain: 'Full AI assistance on case files, contracts, and briefs — 100% local.',
      color: '#3b82f6',
    },
    {
      emoji: '🏥',
      name: 'Marcus',
      role: 'HealthTech VP Engineering',
      pain: 'PHI compliance blocks all SaaS AI. Team wastes hours on manual document work.',
      gain: 'On-prem AI for his whole team — audit logs, RBAC, zero egress.',
      color: '#10b981',
    },
    {
      emoji: '⚡',
      name: 'Priya',
      role: 'Indie Developer',
      pain: 'Tired of wiring Ollama + LangChain + vector DB manually for every project.',
      gain: 'Production-grade local AI platform with connectors, MCP, and agents built-in.',
      color: '#7c3aed',
    },
  ];

  return (
    <section className="py-28">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-16 reveal">
          <div className="text-blue-400 text-sm font-semibold uppercase tracking-widest mb-4">Who It's For</div>
          <h2 className="font-black text-white text-4xl md:text-5xl tracking-tight">
            Built for people who<br /><span className="text-gradient">can't afford to trust the cloud.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {personas.map((p, i) => (
            <div key={p.name} className="feature-card glass rounded-2xl p-7 reveal" style={{ transitionDelay: `${i * 100}ms` }}>
              <div className="text-3xl mb-4">{p.emoji}</div>
              <div className="mb-4">
                <p className="font-bold text-white text-base">{p.name}</p>
                <p className="text-xs font-mono" style={{ color: p.color }}>{p.role}</p>
              </div>
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                  <p className="text-xs text-white/35 leading-relaxed">❌ {p.pain}</p>
                </div>
                <div className="p-3 rounded-xl" style={{ background: `${p.color}08`, border: `1px solid ${p.color}18` }}>
                  <p className="text-xs text-white/65 leading-relaxed">✓ {p.gain}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── ROADMAP ─── */
const ROADMAP = [
  { version: 'v1.0', label: 'Core', color: '#10b981', status: 'live', items: ['Chat + file browser', 'Ollama multi-model routing', 'File ops + confirmation dialogs', 'PDF, DOCX, TXT, MD support'] },
  { version: 'v1.5', label: 'Intelligence', color: '#3b82f6', status: 'live', items: ['Semantic search (local embeddings)', 'Document Q&A with citations', 'Multi-document synthesis', 'Auto-rename from content'] },
  { version: 'v2.0', label: 'Generation', color: '#7c3aed', status: 'live', items: ['Document generation + streaming', 'Transform, translate, simplify', 'Structured data extraction → CSV', 'Generate panel (4 tabs)'] },
  { version: 'v3.0', label: 'Connectors', color: '#f59e0b', status: 'live', items: ['Obsidian, SQLite, Git, Email', 'Browser bookmarks', 'Connector tools in chat', 'NL → SQL queries'] },
  { version: 'v3.5', label: 'Multi-Agent', color: '#ec4899', status: 'live', items: ['Orchestrator + 5 specialist agents', 'Parallel + sequential execution', 'Simple / Multi-Agent toggle', 'Workflow progress panel'] },
  { version: 'v4.0', label: 'MCP', color: '#06b6d4', status: 'live', items: ['Vault AI as MCP server', 'External MCP client', 'Claude Desktop integration', 'stdio + SSE transport'] },
  { version: 'v4.5', label: 'Team', color: '#a855f7', status: 'next', items: ['Multi-user + RBAC', 'Audit logging', 'Admin console', 'Docker deployment'] },
  { version: 'v5.0', label: 'Automation', color: '#f97316', status: 'future', items: ['Scheduled agents (cron)', 'Watch folders', 'Visual workflow builder', 'Email report generation'] },
];

function Roadmap() {
  return (
    <section id="roadmap" className="py-28 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full opacity-5"
          style={{ background: 'linear-gradient(to bottom, transparent, #3b82f6, transparent)' }} />
      </div>
      <div className="max-w-5xl mx-auto px-6 relative">
        <div className="text-center mb-16 reveal">
          <div className="text-purple-400 text-sm font-semibold uppercase tracking-widest mb-4">Roadmap</div>
          <h2 className="font-black text-white text-4xl md:text-5xl tracking-tight mb-4">
            From MVP to platform.<br /><span className="text-gradient">The full vision.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ROADMAP.map((r, i) => (
            <div key={r.version} className="feature-card glass rounded-2xl p-5 reveal" style={{ transitionDelay: `${i * 60}ms` }}>
              <div className="flex items-center justify-between mb-3">
                <span className="font-black text-sm font-mono" style={{ color: r.color }}>{r.version}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  r.status === 'live' ? 'bg-green-500/15 text-green-400' :
                  r.status === 'next' ? 'bg-blue-500/15 text-blue-400' : 'bg-white/5 text-white/30'
                }`}>
                  {r.status === 'live' ? '✓ shipped' : r.status === 'next' ? 'next' : 'planned'}
                </span>
              </div>
              <p className="font-bold text-white text-sm mb-3">{r.label}</p>
              <div className="space-y-1.5">
                {r.items.map(item => (
                  <div key={item} className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0" style={{ background: r.color }} />
                    <span className="text-xs text-white/40 leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── COMPETITIVE ─── */
function Competitive() {
  const cols = ['Product', 'File Ops', 'Gen AI', 'Multi-Agent', 'Connectors', 'MCP', '100% Local'];
  const rows = [
    { name: 'Vault AI', logo: '🔒', vals: [true, true, true, true, true, true], highlight: true },
    { name: 'AnythingLLM', logo: '🦙', vals: [false, false, false, false, false, true] },
    { name: 'Open WebUI', logo: '🌐', vals: [false, false, false, false, false, true] },
    { name: 'LM Studio', logo: '🖥', vals: [false, false, false, false, false, true] },
    { name: 'ChatGPT', logo: '🤖', vals: [false, true, false, false, false, false] },
  ];

  return (
    <section className="py-28">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-14 reveal">
          <div className="text-blue-400 text-sm font-semibold uppercase tracking-widest mb-4">Positioning</div>
          <h2 className="font-black text-white text-4xl md:text-5xl tracking-tight">
            The only product that<br /><span className="text-gradient">does all of this locally.</span>
          </h2>
        </div>

        <div className="reveal overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {cols.map((c, i) => (
                  <th key={c} className={`text-left pb-4 ${i === 0 ? 'pr-6 text-white/50 text-sm font-medium' : 'px-4 text-center text-xs text-white/35 font-medium uppercase tracking-wider'}`}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.name} className={`border-b border-white/[0.03] ${row.highlight ? 'rounded-xl' : ''}`}>
                  <td className="py-4 pr-6">
                    <div className={`flex items-center gap-3 ${row.highlight ? 'rounded-xl px-3 py-2 -mx-3' : ''}`}
                      style={row.highlight ? { background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)' } : {}}>
                      <span className="text-lg">{row.logo}</span>
                      <span className={`font-semibold text-sm ${row.highlight ? 'text-white' : 'text-white/40'}`}>{row.name}</span>
                      {row.highlight && <span className="ml-auto text-xs text-blue-400 font-mono">← you are here</span>}
                    </div>
                  </td>
                  {row.vals.map((v, i) => (
                    <td key={i} className="px-4 py-4 text-center">
                      {v ? (
                        <span className={`text-base ${row.highlight ? 'text-blue-400' : 'text-green-500/50'}`}>✓</span>
                      ) : (
                        <span className="text-white/15 text-base">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

/* ─── CTA ─── */
function CTA() {
  return (
    <section className="py-28 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(59,130,246,0.1) 0%, rgba(124,58,237,0.06) 50%, transparent 100%)' }} />
      </div>
      <div className="max-w-3xl mx-auto px-6 text-center relative">
        <div className="text-6xl mb-8">🔒</div>
        <h2 className="font-black text-white leading-tight mb-6" style={{ fontSize: 'clamp(36px, 6vw, 64px)' }}>
          Your files deserve<br /><span className="text-gradient">an AI that keeps secrets.</span>
        </h2>
        <p className="text-white/45 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
          No cloud. No subscriptions. No data leaving your machine. Start using Vault AI in under 2 minutes.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href="http://localhost:5173" target="_blank" rel="noopener noreferrer"
            className="btn-primary text-white font-bold px-10 py-4 rounded-2xl text-base flex items-center gap-3 glow-blue">
            <SparklesIcon size={18} />
            Launch Vault AI
            <ArrowRightIcon size={16} />
          </a>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer"
            className="glass text-white/60 hover:text-white font-semibold px-8 py-4 rounded-2xl text-base flex items-center gap-2 transition-all duration-200">
            <CodeIcon size={16} />
            View on GitHub
          </a>
        </div>
      </div>
    </section>
  );
}

/* ─── FOOTER ─── */
function Footer() {
  return (
    <footer className="border-t border-white/[0.04] py-12">
      <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <LockIcon size={14} className="text-white" />
          </div>
          <span className="font-bold text-white/60 text-sm">Vault AI</span>
          <span className="text-white/20 text-sm">·</span>
          <span className="text-white/25 text-xs">Your Files. Your AI. Your Privacy.</span>
        </div>
        <div className="flex items-center gap-6 text-xs text-white/25">
          <span className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
            100% Local
          </span>
          <span>Zero data egress</span>
          <span>Open architecture</span>
          <span>© 2026 Vault AI</span>
        </div>
      </div>
    </footer>
  );
}

/* ─── ROOT ─── */
export default function App() {
  useReveal();
  return (
    <div className="min-h-screen bg-vault-black">
      <Nav />
      <Hero />
      <Stats />
      <Problem />
      <Features />
      <HowItWorks />
      <Connectors />
      <Privacy />
      <Personas />
      <Competitive />
      <Roadmap />
      <CTA />
      <Footer />
    </div>
  );
}
