import React, { useEffect, useState } from 'react';
import {
  LockIcon, MessageSquareIcon, SearchIcon, SparklesIcon, CpuIcon,
  PlugIcon, ServerIcon, ShieldCheckIcon, ArrowRightIcon, CheckIcon,
  FolderIcon, GitBranchIcon, DatabaseIcon, BookmarkIcon,
  MailIcon, ZapIcon, UsersIcon, CodeIcon,
  ChevronRightIcon, LayersIcon, MenuIcon, XIcon, PlayIcon,
  ChevronDownIcon, FileTextIcon, SlidersIcon, GlobeIcon
} from 'lucide-react';

/* ── App URL ── */
const APP_URL = (() => {
  if (typeof window === 'undefined') return '/app';
  const { hostname, protocol, port } = window.location;
  // Dev: landing runs on port 5000, app on port 5173
  if (port === '5000' || port === '5173') return `${protocol}//${hostname}:5173`;
  // Production: everything served from one domain, app is at /app
  return '/app';
})();

/* ── Announcement bar ── */
function AnnouncementBar() {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;
  return (
    <div style={{
      background: 'linear-gradient(90deg, #1e1b4b, #2563eb, #7c3aed, #1e1b4b)',
      backgroundSize: '300% auto', animation: 'rainbowShift 6s linear infinite',
      padding: '10px 20px', display: 'flex', alignItems: 'center',
      justifyContent: 'center', gap: 12, position: 'relative', zIndex: 60,
    }}>
      <span style={{ fontSize: 14, color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        🏆 <span style={{ opacity: 0.85 }}>Hackathon 2026 Submission</span>
        <span style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 999, padding: '2px 10px', fontSize: 12 }}>
          ✅ Live demo — no Ollama, no install, no signup
        </span>
        <a href={APP_URL} target="_blank" rel="noopener noreferrer"
          style={{ background: '#fff', color: '#2563eb', borderRadius: 999, padding: '3px 12px', fontSize: 12, fontWeight: 800, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          Try it now →
        </a>
      </span>
      <button onClick={() => setVisible(false)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
    </div>
  );
}

/* ── Scroll reveal ── */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => e.isIntersecting && e.target.classList.add('visible')),
      { threshold: 0.08 }
    );
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

/* ── NAV ── */
const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How it Works', href: '#how-it-works' },
  { label: 'Privacy', href: '#privacy' },
];

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled || mobileOpen ? 'bg-white/95 backdrop-blur-xl border-b border-gray-100 shadow-sm py-3' : 'bg-transparent py-5'
      }`}>
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}>
              <LockIcon size={17} className="text-white" />
            </div>
            <span className="font-black text-gray-900 text-xl tracking-tight">
              Vault <span className="text-gradient-blue">AI</span>
            </span>
          </a>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500">
            {NAV_LINKS.map(l => (
              <a key={l.label} href={l.href} className="hover:text-gray-900 transition-colors duration-200">{l.label}</a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <a href={APP_URL} target="_blank" rel="noopener noreferrer"
              className="btn-cta text-white text-sm font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg">
              <PlayIcon size={13} /> Try Demo <ArrowRightIcon size={14} />
            </a>
            <button onClick={() => setMobileOpen(o => !o)}
              className="md:hidden w-9 h-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors">
              {mobileOpen ? <XIcon size={18} /> : <MenuIcon size={18} />}
            </button>
          </div>
        </div>
        <div className={`md:hidden overflow-hidden transition-all duration-300 ${mobileOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="max-w-6xl mx-auto px-6 pb-5 pt-3 flex flex-col gap-1 border-t border-gray-100 mt-3">
            {NAV_LINKS.map(l => (
              <a key={l.label} href={l.href} onClick={() => setMobileOpen(false)}
                className="text-gray-700 font-semibold text-base py-2.5 px-3 rounded-xl hover:bg-gray-50 hover:text-blue-600 transition-colors flex items-center justify-between">
                {l.label} <ChevronRightIcon size={15} className="text-gray-300" />
              </a>
            ))}
            <a href={APP_URL} target="_blank" rel="noopener noreferrer" onClick={() => setMobileOpen(false)}
              className="mt-2 btn-cta text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2">
              <SparklesIcon size={15} /> Launch Vault AI Free
            </a>
          </div>
        </div>
      </nav>
    </>
  );
}

/* ── TICKER ── */
const TICKER_ITEMS = [
  '🔒 100% Local Processing', '💬 Natural Language File Ops', '🔍 Web + Deep Research',
  '📄 4-Mode Document Generator', '🧠 12 Built-in Skills', '🔌 5 Local Connectors',
  '🛡️ Zero Data Egress', '🤖 Multi-Model Routing', '🔗 MCP Protocol — Both Ways',
  '🌐 URL Summarizer', '📂 Drag-Drop Document Upload', '✅ Works Fully Offline',
];
function Ticker() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div className="overflow-hidden py-3" style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}>
      <div className="flex gap-8 animate-ticker whitespace-nowrap">
        {items.map((item, i) => (
          <span key={i} className="text-white/90 text-sm font-medium flex-shrink-0">{item}</span>
        ))}
      </div>
    </div>
  );
}

/* ── HERO MSG (dark-themed) ── */
function HeroMsg({ role, text, model, done }) {
  const isUser = role === 'user';
  return (
    <div className={`flex items-end gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #6366F1, #8b5cf6)' }}>
          <LockIcon size={14} className="text-white" />
        </div>
      )}
      <div className={`max-w-sm ${isUser ? 'ml-auto' : ''}`}>
        {isUser ? (
          <div className="px-4 py-3 rounded-2xl rounded-br-sm text-sm text-white font-medium"
            style={{ background: 'linear-gradient(135deg, #6366F1, #8b5cf6)' }}>
            {text}
          </div>
        ) : (
          <div className="px-4 py-3 rounded-2xl rounded-bl-sm border"
            style={{ background: '#1E1E28', borderColor: '#2A2A3A' }}>
            <p className="text-sm leading-relaxed" style={{ color: '#D0D0E8' }}>
              {text}{!done && <span className="cursor-blink ml-0.5" style={{ color: '#6366F1' }}>|</span>}
            </p>
            {model && (
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-xs font-mono" style={{ color: '#4E4E6A' }}>{model}</span>
                {done && <span className="text-xs font-medium" style={{ color: '#22c55e' }}>● complete</span>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── HERO ── */
function Hero() {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }} />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #2563eb, transparent)' }} />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'radial-gradient(circle, #0f0f1a 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
      </div>

      <div className="max-w-6xl mx-auto px-6 relative">
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border-2"
            style={{ background: 'linear-gradient(135deg, #ede9fe, #dbeafe)', borderColor: '#c4b5fd', color: '#5b21b6' }}>
            <SparklesIcon size={14} />
            Privacy-First Local AI · Built for 2026
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse ml-1" />
          </div>
        </div>

        <div className="text-center max-w-4xl mx-auto mb-8">
          <h1 className="font-black leading-[1] tracking-tight mb-6"
            style={{ fontSize: 'clamp(48px, 8vw, 96px)' }}>
            <span className="text-gray-900">Your Files.</span><br />
            <span className="text-gradient-rainbow">Your AI.</span><br />
            <span className="text-gray-900">Your Privacy.</span>
          </h1>
          <p className="text-gray-500 text-xl leading-relaxed max-w-2xl mx-auto">
            The AI-native file platform that runs{' '}
            <span className="font-bold text-gray-900">entirely on your machine</span>.
            Manage, search, and generate documents with local AI.{' '}
            <span className="text-gradient-blue font-bold">No cloud. No subscriptions. No compromise.</span>
          </p>
        </div>

        <div className="flex flex-col items-center justify-center gap-3 mb-16">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href={APP_URL} target="_blank" rel="noopener noreferrer"
              className="btn-cta text-white font-black px-10 py-4 rounded-2xl text-lg flex items-center gap-3 shadow-2xl"
              style={{ boxShadow: '0 20px 60px rgba(37,99,235,0.35)' }}>
              <PlayIcon size={20} /> Try Live Demo <ArrowRightIcon size={18} />
            </a>
            <a href="#features"
              className="text-gray-700 font-bold px-8 py-4 rounded-2xl text-base flex items-center gap-2 border-2 border-gray-200 hover:border-blue-300 hover:text-blue-600 transition-all duration-200 bg-white shadow-sm">
              See All Features <ChevronRightIcon size={16} />
            </a>
          </div>
          <div className="flex items-center gap-5 mt-1">
            {['No Ollama needed', 'No signup', 'Works instantly'].map((t, i) => (
              <span key={i} className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                <CheckIcon size={11} className="text-green-500" /> {t}
              </span>
            ))}
          </div>
        </div>

        {/* Hero visual — Dark Premium UI mock */}
        <div className="relative max-w-4xl mx-auto">
          {/* Floating badges — dark themed */}
          <div className="animate-float absolute -left-6 top-10 z-10 rounded-2xl px-4 py-3 flex items-center gap-2.5 border"
            style={{ background: '#16161D', borderColor: '#1E1E2A', boxShadow: '0 12px 40px rgba(0,0,0,0.45)' }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(34,197,94,0.15)' }}>
              <ShieldCheckIcon size={16} className="text-green-400" />
            </div>
            <div>
              <div className="text-xs font-bold" style={{ color: '#F0F0F8' }}>Zero Data Egress</div>
              <div className="text-xs" style={{ color: '#4E4E6A' }}>All local · verified</div>
            </div>
          </div>
          <div className="animate-float2 absolute -right-6 top-16 z-10 rounded-2xl px-4 py-3 flex items-center gap-2.5 border"
            style={{ background: '#16161D', borderColor: '#1E1E2A', boxShadow: '0 12px 40px rgba(0,0,0,0.45)' }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(99,102,241,0.15)' }}>
              <CpuIcon size={16} style={{ color: '#818CF8' }} />
            </div>
            <div>
              <div className="text-xs font-bold" style={{ color: '#F0F0F8' }}>7 Panels · 12+ Skills</div>
              <div className="text-xs" style={{ color: '#4E4E6A' }}>llama3.2 · mistral · phi3</div>
            </div>
          </div>
          <div className="animate-float absolute right-10 -bottom-5 z-10 rounded-2xl px-4 py-2.5 flex items-center gap-2 border"
            style={{ background: '#16161D', borderColor: '#1E1E2A', boxShadow: '0 12px 40px rgba(0,0,0,0.45)' }}>
            <span className="text-green-400 text-lg">✓</span>
            <div className="text-xs font-bold" style={{ color: '#F0F0F8' }}>7 files moved successfully</div>
          </div>

          {/* Main chat window — Dark Premium */}
          <div className="rounded-3xl overflow-hidden border"
            style={{
              background: '#16161D',
              borderColor: '#1E1E2A',
              boxShadow: '0 40px 100px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.1)'
            }}>
            {/* Title bar */}
            <div className="flex items-center gap-2 px-5 py-4 border-b"
              style={{ background: '#0F0F14', borderColor: '#1E1E2A' }}>
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 text-center">
                <span className="text-xs font-medium" style={{ color: '#4E4E6A' }}>Vault AI — Chat</span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ background: 'rgba(99,102,241,0.12)' }}>
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="text-xs font-medium" style={{ color: '#818CF8' }}>Local</span>
              </div>
            </div>
            {/* Messages */}
            <div className="p-6 space-y-4" style={{ background: 'rgba(255,255,255,0.01)' }}>
              <HeroMsg role="user" text='Move all invoices from Downloads to Documents/Finance/2024, rename by date' />
              <HeroMsg role="ai" text="Found 7 invoice files. I'll move them to Documents/Finance/2024 and rename each by invoice date. Ready to execute — confirm?" model="llama3.2:3b" />
              <div className="flex gap-2 pl-11">
                <button className="px-4 py-2 rounded-xl text-sm font-bold text-white flex items-center gap-1.5"
                  style={{ background: 'linear-gradient(135deg, #059669, #0891b2)' }}>
                  <CheckIcon size={13} /> Confirm & Execute
                </button>
                <button className="px-4 py-2 rounded-xl text-sm font-medium border"
                  style={{ color: '#9898B8', background: 'transparent', borderColor: '#1E1E2A' }}>
                  Cancel
                </button>
              </div>
              <HeroMsg role="ai" text="Done! ✅ Moved 7 invoices → Documents/Finance/2024. Renamed: invoice_2024-01-15.pdf, invoice_2024-02-08.pdf, invoice_2024-03-22.pdf..." model="llama3.2:3b" done />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── STATS ── */
function Stats() {
  const items = [
    { v: '7', label: 'Feature Panels', color: '#2563eb', bg: '#dbeafe' },
    { v: '12+', label: 'Built-in Skills', color: '#7c3aed', bg: '#ede9fe' },
    { v: '4', label: 'Generate Modes', color: '#ec4899', bg: '#fce7f3' },
    { v: '13', label: 'MCP Tools Exposed', color: '#059669', bg: '#d1fae5' },
    { v: '5', label: 'Local Data Connectors', color: '#ea580c', bg: '#ffedd5' },
    { v: '0', label: 'External Network Calls', color: '#0891b2', bg: '#cffafe' },
  ];
  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {items.map((s, i) => (
            <div key={i} className="card-hover reveal text-center p-5 rounded-2xl border border-gray-100 shadow-sm" style={{ transitionDelay: `${i * 60}ms` }}>
              <div className="text-3xl font-black mb-1" style={{ color: s.color }}>{s.v}</div>
              <div className="text-xs text-gray-500 font-medium leading-tight">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── APP PREVIEW ── */
function AppPreview() {
  const [activeTab, setActiveTab] = useState('chat');
  const tabs = [
    { id: 'chat',     label: '💬 Chat',      desc: 'Natural language file operations' },
    { id: 'docs',     label: '📄 Documents', desc: 'Summarize, extract, classify' },
    { id: 'research', label: '🔍 Research',  desc: 'Web search, deep research & URL summarize' },
    { id: 'skills',   label: '🧠 Skills',    desc: '12 built-in skills + custom builder' },
    { id: 'generate', label: '✨ Generate',  desc: 'Create, transform, synthesize, extract' },
    { id: 'mcp',      label: '🔗 MCP',       desc: 'Expose & consume MCP servers' },
  ];

  const sidebarItems = [
    { icon: MessageSquareIcon, label: 'Chat',       active: activeTab === 'chat'     },
    { icon: FileTextIcon,      label: 'Documents',  active: activeTab === 'docs'     },
    { icon: GlobeIcon,         label: 'Research',   active: activeTab === 'research' },
    { icon: SparklesIcon,      label: 'Skills',     active: activeTab === 'skills'   },
    { icon: SlidersIcon,       label: 'Generate',   active: activeTab === 'generate' },
    { icon: PlugIcon,          label: 'Connectors', active: false                    },
    { icon: ServerIcon,        label: 'MCP',        active: activeTab === 'mcp'      },
  ];

  return (
    <section className="py-24" style={{ background: 'linear-gradient(180deg, #fff 0%, #f0f4ff 100%)' }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12 reveal">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold mb-5"
            style={{ background: '#1C1850', color: '#818CF8' }}>
            <SparklesIcon size={13} /> Live Preview
          </div>
          <h2 className="font-black text-gray-900 tracking-tight mb-4"
            style={{ fontSize: 'clamp(32px, 5vw, 52px)' }}>
            See what you're actually getting.
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            A full-featured AI workspace for your local files — not a chatbot wrapper.
          </p>
          {/* Tab selector */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className="px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200"
                style={activeTab === t.id
                  ? { background: 'linear-gradient(135deg, #6366F1, #8b5cf6)', color: 'white', boxShadow: '0 4px 16px rgba(99,102,241,0.35)' }
                  : { background: 'white', color: '#6b7280', border: '1.5px solid #e5e7eb' }}>
                {t.label}
              </button>
            ))}
          </div>
          {activeTab && (
            <p className="text-sm text-gray-400 mt-3">{tabs.find(t => t.id === activeTab)?.desc}</p>
          )}
        </div>

        {/* Dark app window */}
        <div className="reveal rounded-3xl overflow-hidden border"
          style={{
            background: '#0A0A0F',
            borderColor: '#1E1E2A',
            boxShadow: '0 40px 80px rgba(0,0,0,0.3), 0 0 0 1px rgba(99,102,241,0.08)'
          }}>
          {/* Traffic lights + tab bar */}
          <div className="flex items-center gap-3 px-5 py-3.5 border-b"
            style={{ background: '#0F0F14', borderColor: '#1E1E2A' }}>
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ background: '#FF5F57' }} />
              <div className="w-3 h-3 rounded-full" style={{ background: '#FFBD2E' }} />
              <div className="w-3 h-3 rounded-full" style={{ background: '#28C840' }} />
            </div>
            <div className="flex-1 flex items-center justify-center gap-2">
              <div className="w-5 h-5 rounded-md flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #6366F1, #8b5cf6)' }}>
                <LockIcon size={10} className="text-white" />
              </div>
              <span className="text-xs font-semibold" style={{ color: '#9898B8' }}>Vault AI</span>
              <span style={{ color: '#2A2A3A', fontSize: 12 }}>/</span>
              <span className="text-xs" style={{ color: '#4E4E6A' }}>
                {activeTab === 'chat' ? 'Chat' : activeTab === 'docs' ? 'Documents' : 'Research'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg" style={{ background: 'rgba(99,102,241,0.1)' }}>
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-xs font-medium" style={{ color: '#818CF8' }}>2 models active</span>
            </div>
          </div>

          {/* App layout */}
          <div className="flex" style={{ minHeight: 400 }}>
            {/* Sidebar */}
            <div className="w-48 flex-shrink-0 border-r flex flex-col py-2"
              style={{ background: '#0F0F14', borderColor: '#1E1E2A' }}>
              <div className="px-3 pb-2 mb-1 border-b" style={{ borderColor: '#1E1E2A' }}>
                <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium"
                  style={{ color: '#4E4E6A' }}>
                  + New chat
                </button>
              </div>
              <div className="flex flex-col gap-0.5 px-2 py-1">
                {sidebarItems.map((item, i) => (
                  <button key={i} onClick={() => {
                    const id = item.label === 'Connectors' ? 'docs' : item.label.toLowerCase();
                    setActiveTab(id);
                  }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-left transition-all"
                    style={item.active
                      ? { background: '#1C1850', color: '#818CF8', boxShadow: 'inset 3px 0 0 #6366F1' }
                      : { color: '#6E6E8A' }}>
                    <item.icon size={14} />
                    {item.label}
                  </button>
                ))}
              </div>
              <div className="mt-auto px-2 py-3 border-t" style={{ borderColor: '#1E1E2A' }}>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <span className="text-xs" style={{ color: '#4E4E6A' }}>llama3.2 · Ollama</span>
                </div>
              </div>
            </div>

            {/* Main content area */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* Content header */}
              <div className="flex items-center justify-between px-5 py-3 border-b"
                style={{ borderColor: '#1E1E2A' }}>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold" style={{ color: '#F0F0F8' }}>
                    {activeTab === 'chat' ? '⚡ Simple'
                      : activeTab === 'docs' ? '📚 My Documents'
                      : activeTab === 'research' ? '🔍 Web Search'
                      : activeTab === 'skills' ? '🧠 Skills Library'
                      : activeTab === 'generate' ? '✨ Create Document'
                      : '🔗 MCP Server Hub'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {activeTab === 'chat' && (
                    <span className="text-xs px-2 py-1 rounded-lg font-medium" style={{ background: 'rgba(99,102,241,0.1)', color: '#818CF8' }}>Multi-Agent</span>
                  )}
                </div>
              </div>

              {/* Tab content */}
              {activeTab === 'chat' && (
                <div className="flex-1 flex flex-col">
                  <div className="flex-1 p-5 space-y-3">
                    <HeroMsg role="user" text="Find all PDFs modified this week and summarize them" />
                    <HeroMsg role="ai" text="Found 4 PDFs modified this week. Scanning contents via local embedding model..." model="nomic-embed-text" />
                    <HeroMsg role="ai" text="Summary ready ✅ — Q1 Report (revenue up 12%), NDA_Vendor.pdf (3 key clauses), Meeting_Notes_Apr.pdf (5 action items), Contract_Draft.pdf (expires Jun 30)." model="llama3.2:8b" done />
                  </div>
                  <div className="px-5 pb-4">
                    <div className="flex gap-2 p-3 rounded-2xl border" style={{ background: '#16161D', borderColor: '#1E1E2A' }}>
                      <input readOnly value="Ask about your files..." className="flex-1 bg-transparent text-sm outline-none" style={{ color: '#4E4E6A' }} />
                      <button className="px-3 py-1.5 rounded-xl text-xs font-bold text-white" style={{ background: '#6366F1' }}>Send</button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'docs' && (
                <div className="flex-1 flex">
                  <div className="w-52 border-r flex-shrink-0 p-3" style={{ borderColor: '#1E1E2A' }}>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-3 px-2" style={{ color: '#4E4E6A' }}>Library (4)</p>
                    {['NDA_Vendor.pdf', 'Q1_Report.pdf', 'Contract_Draft.pdf', 'Meeting_Notes.pdf'].map((f, i) => (
                      <div key={i} className="flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-all"
                        style={i === 0 ? { background: '#1C1850' } : {}}>
                        <FileTextIcon size={13} style={{ color: i === 0 ? '#818CF8' : '#4E4E6A' }} />
                        <span className="text-xs truncate" style={{ color: i === 0 ? '#F0F0F8' : '#6E6E8A' }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex-1 p-5">
                    <div className="flex gap-2 mb-4 flex-wrap">
                      {['Summarize', 'Extract Fields', 'Classify', 'Q&A'].map((a, i) => (
                        <button key={i} className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
                          style={i === 0 ? { background: '#6366F1', color: 'white', borderColor: '#6366F1' } : { background: 'transparent', color: '#6E6E8A', borderColor: '#1E1E2A' }}>
                          {a}
                        </button>
                      ))}
                    </div>
                    <div className="p-4 rounded-xl border" style={{ background: '#16161D', borderColor: '#1E1E2A' }}>
                      <p className="text-xs font-semibold mb-2" style={{ color: '#818CF8' }}>Summary — NDA_Vendor.pdf</p>
                      <p className="text-xs leading-relaxed" style={{ color: '#9898B8' }}>
                        Mutual NDA between Acme Corp and Vendor Inc. Key clauses: 2-year confidentiality period, no reverse engineering, jurisdiction is California. Expires March 15, 2026.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'research' && (
                <div className="flex-1 flex flex-col p-5">
                  <div className="flex gap-2 mb-3">
                    {['Web Search', 'Deep Research', 'Summarize URL'].map((m, i) => (
                      <button key={i} className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
                        style={i === 0 ? { background: '#6366F1', color: 'white', borderColor: '#6366F1' } : { background: 'transparent', color: '#6E6E8A', borderColor: '#1E1E2A' }}>
                        {m}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2 mb-4">
                    <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border" style={{ background: '#16161D', borderColor: '#1E1E2A' }}>
                      <SearchIcon size={13} style={{ color: '#4E4E6A' }} />
                      <span className="text-xs" style={{ color: '#4E4E6A' }}>local AI privacy compliance 2025</span>
                    </div>
                    <button className="px-4 py-2 rounded-xl text-xs font-bold text-white" style={{ background: '#6366F1' }}>Search</button>
                  </div>
                  <div className="space-y-3">
                    {[
                      { title: 'GDPR Compliance for AI Systems — 2025 Guide', url: 'privacyguide.eu', snippet: 'Local AI processing is inherently compliant as personal data never leaves the user\'s device...' },
                      { title: 'HIPAA & AI: On-Premise vs Cloud Processing', url: 'healthtech.io', snippet: 'Healthcare organizations increasingly prefer local LLMs to avoid Business Associate Agreements...' },
                    ].map((r, i) => (
                      <div key={i} className="p-4 rounded-xl border" style={{ background: '#16161D', borderColor: '#1E1E2A' }}>
                        <p className="text-xs font-semibold mb-1" style={{ color: '#818CF8' }}>{r.title}</p>
                        <p className="text-xs mb-1" style={{ color: '#4E4E6A' }}>{r.url}</p>
                        <p className="text-xs leading-relaxed" style={{ color: '#9898B8' }}>{r.snippet}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'skills' && (
                <div className="flex-1 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#4E4E6A' }}>12 Built-in Skills</span>
                    <button className="px-3 py-1 rounded-lg text-xs font-bold" style={{ background: 'rgba(99,102,241,0.15)', color: '#818CF8' }}>+ Custom Skill</button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { name: 'Summarize Document', icon: '📄', color: '#6366F1' },
                      { name: 'Extract Key Dates', icon: '📅', color: '#059669' },
                      { name: 'Translate File', icon: '🌐', color: '#ea580c' },
                      { name: 'Classify & Tag', icon: '🏷️', color: '#7c3aed' },
                      { name: 'Find Duplicates', icon: '🔍', color: '#2563eb' },
                      { name: 'Generate Report', icon: '📊', color: '#ec4899' },
                    ].map((s, i) => (
                      <div key={i} className="flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all"
                        style={{ background: '#16161D', borderColor: '#1E1E2A' }}>
                        <span className="text-base">{s.icon}</span>
                        <span className="text-xs font-medium" style={{ color: '#D0D0E8' }}>{s.name}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 p-3 rounded-xl border border-dashed" style={{ borderColor: '#2A2A3A' }}>
                    <p className="text-xs text-center" style={{ color: '#4E4E6A' }}>+ 6 more built-in · Build your own with custom prompts</p>
                  </div>
                </div>
              )}

              {activeTab === 'generate' && (
                <div className="flex-1 flex flex-col p-5">
                  <div className="flex gap-2 mb-4">
                    {['Create', 'Transform', 'Synthesize', 'Extract'].map((m, i) => (
                      <button key={i} className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
                        style={i === 0 ? { background: '#6366F1', color: 'white', borderColor: '#6366F1' } : { background: 'transparent', color: '#6E6E8A', borderColor: '#1E1E2A' }}>
                        {m}
                      </button>
                    ))}
                  </div>
                  <div className="mb-3">
                    <textarea readOnly rows={2}
                      className="w-full bg-transparent text-xs rounded-xl border p-3 resize-none outline-none"
                      style={{ background: '#16161D', borderColor: '#1E1E2A', color: '#9898B8' }}
                      value="Write a professional NDA between Acme Corp and a freelance contractor. Include 2-year confidentiality, IP assignment, and California jurisdiction." />
                  </div>
                  <div className="flex-1 p-4 rounded-xl border" style={{ background: '#16161D', borderColor: '#1E1E2A' }}>
                    <p className="text-xs font-semibold mb-2" style={{ color: '#818CF8' }}>Generated: NDA_Draft.md</p>
                    <p className="text-xs leading-relaxed" style={{ color: '#9898B8' }}>
                      <strong style={{ color: '#C8C8E8' }}>NON-DISCLOSURE AGREEMENT</strong><br /><br />
                      This Agreement is entered into as of [Date] between Acme Corp ("Company") and [Contractor Name] ("Contractor")...<br /><br />
                      <span style={{ color: '#4E4E6A' }}>▼ Full document · 847 words · Download ↓ Copy ⎘</span>
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'mcp' && (
                <div className="flex-1 p-5">
                  <div className="mb-4">
                    <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#4E4E6A' }}>Vault AI MCP Server</p>
                    <div className="flex items-center justify-between p-3 rounded-xl border" style={{ background: '#16161D', borderColor: '#1E1E2A' }}>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-xs font-medium" style={{ color: '#D0D0E8' }}>vault-ai · SSE · :3002/sse</span>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80' }}>13 tools</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#4E4E6A' }}>External Servers</p>
                    <div className="space-y-2">
                      {[
                        { name: 'Brave Search', status: 'connected', color: '#4ade80' },
                        { name: 'GitHub MCP', status: 'connected', color: '#4ade80' },
                        { name: 'Postgres', status: 'idle', color: '#818CF8' },
                      ].map((s, i) => (
                        <div key={i} className="flex items-center justify-between p-2.5 rounded-xl border" style={{ background: '#16161D', borderColor: '#1E1E2A' }}>
                          <span className="text-xs font-medium" style={{ color: '#D0D0E8' }}>{s.name}</span>
                          <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
                            <span className="text-xs" style={{ color: s.color }}>{s.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <a href={APP_URL} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 btn-cta text-white font-bold px-8 py-3.5 rounded-2xl text-sm shadow-xl">
            <PlayIcon size={16} /> Open the Real App — No Install Needed <ArrowRightIcon size={15} />
          </a>
        </div>
      </div>
    </section>
  );
}

/* ── FEATURES ── */
const FEATURES = [
  {
    icon: MessageSquareIcon, color: '#2563eb', bg: '#dbeafe', lightBg: '#eff6ff',
    title: 'Natural Language File Ops',
    desc: 'Move, copy, rename, delete, and organize files just by typing. "Move all invoices to Finance and rename by date" — done in seconds with multi-agent confirmation.',
    tags: ['Move · Copy · Rename', 'Bulk operations', 'Agent confirmation', 'Trash-safe deletes'],
  },
  {
    icon: FileTextIcon, color: '#7c3aed', bg: '#ede9fe', lightBg: '#f5f3ff',
    title: 'Document Intelligence',
    desc: 'Drag-and-drop upload any file. Summarize, extract fields, classify, or ask questions — all locally via your AI models with semantic search across your library.',
    tags: ['Drag-drop upload', 'Summarize · Q&A', 'Semantic search', 'Extract fields'],
  },
  {
    icon: SearchIcon, color: '#059669', bg: '#d1fae5', lightBg: '#f0fdf4',
    title: 'Research Panel',
    desc: 'Three modes: quick web search via DuckDuckGo, AI-powered deep research that synthesizes multiple sources with sub-questions, and one-click URL summarization.',
    tags: ['DuckDuckGo search', 'Deep research + AI synthesis', 'Summarize any URL', 'Save to library'],
  },
  {
    icon: SparklesIcon, color: '#ec4899', bg: '#fce7f3', lightBg: '#fdf2f8',
    title: '4-Mode Document Generator',
    desc: 'Create documents from prompts, transform existing files (translate, reformat, rewrite), synthesize multiple sources into one, or extract structured data to JSON/CSV.',
    tags: ['Create from prompt', 'Transform & translate', 'Synthesize sources', 'Extract to CSV/JSON'],
  },
  {
    icon: ZapIcon, color: '#d97706', bg: '#fef3c7', lightBg: '#fffbeb',
    title: 'Skills Library',
    desc: '12 built-in one-click skills for common tasks. Build your own custom skills with a name, prompt template, and icon. Skills appear instantly in chat and the sidebar.',
    tags: ['12 built-in skills', 'Custom skill builder', 'One-click execute', 'Context-aware prompts'],
  },
  {
    icon: PlugIcon, color: '#ea580c', bg: '#ffedd5', lightBg: '#fff7ed',
    title: '5 Local Data Connectors',
    desc: 'Query Obsidian notes, SQLite databases, Git commit history, email archives (.mbox/.eml), and browser bookmarks directly in chat. Zero cloud, fully private.',
    tags: ['Obsidian · SQLite', 'Git · Email · Bookmarks', 'Chat-native queries', '100% local'],
  },
  {
    icon: ServerIcon, color: '#0891b2', bg: '#cffafe', lightBg: '#ecfeff',
    title: 'MCP Protocol — Both Ways',
    desc: 'Expose 13 Vault AI file tools to Claude Desktop or Cursor via SSE or stdio. Or consume external MCP servers — Brave Search, GitHub, Postgres, Fetch — inside Vault AI.',
    tags: ['13 tools exposed', 'Claude Desktop · Cursor', 'SSE + stdio', 'External MCP servers'],
  },
  {
    icon: CpuIcon, color: '#6366f1', bg: '#eef2ff', lightBg: '#f5f3ff',
    title: 'Multi-Model Routing',
    desc: 'Specialized agents auto-route tasks to the right model. File ops use a fast lightweight model. Deep research and document Q&A use your most capable reasoning model.',
    tags: ['Auto model routing', 'Specialist agents', 'Ollama compatible', '1 model minimum'],
  },
];

function Features() {
  return (
    <section id="features" className="py-24"
      style={{ background: 'linear-gradient(180deg, #fff 0%, #f8faff 100%)' }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16 reveal">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold mb-5"
            style={{ background: '#ede9fe', color: '#7c3aed' }}>
            <LayersIcon size={13} /> Capabilities
          </div>
          <h2 className="font-black text-gray-900 tracking-tight mb-4"
            style={{ fontSize: 'clamp(32px, 5vw, 52px)' }}>
            Everything you need.<br />
            <span className="text-gradient-blue">Nothing in the cloud.</span>
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            7 panels: Chat · Documents · Research · Skills · Generate · Connectors · MCP — all running locally on your machine.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((f, i) => (
            <div key={i} className="card-hover reveal rounded-2xl p-7 border border-gray-100 bg-white shadow-sm hover:shadow-xl transition-all duration-300"
              style={{ transitionDelay: `${i * 80}ms` }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                style={{ background: f.bg }}>
                <f.icon size={22} style={{ color: f.color }} />
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-5">{f.desc}</p>
              <div className="flex flex-wrap gap-2">
                {f.tags.map(t => (
                  <span key={t} className="text-xs font-semibold px-3 py-1.5 rounded-xl"
                    style={{ background: f.lightBg, color: f.color }}>{t}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── PROBLEM / COMPARISON ── */
function Problem() {
  const rows = [
    { label: 'Your data goes to the cloud', before: true, after: false },
    { label: 'Monthly API subscription cost', before: true, after: false },
    { label: 'One AI model for everything', before: true, after: false },
    { label: 'Read-only AI assistants', before: true, after: false },
    { label: 'Privacy policies you can\'t audit', before: true, after: false },
    { label: '100% local processing', before: false, after: true },
    { label: 'Natural language file operations', before: false, after: true },
    { label: 'Auto-routing to best model per task', before: false, after: true },
    { label: 'Document generation in 4 modes', before: false, after: true },
    { label: '12+ one-click skills + custom builder', before: false, after: true },
    { label: 'Web research + deep AI synthesis', before: false, after: true },
    { label: 'Open, auditable architecture', before: false, after: true },
  ];
  return (
    <section className="py-24 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-14 reveal">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold mb-5"
            style={{ background: '#fce7f3', color: '#ec4899' }}>
            <ZapIcon size={13} /> The Problem
          </div>
          <h2 className="font-black text-gray-900 tracking-tight mb-4"
            style={{ fontSize: 'clamp(32px, 5vw, 52px)' }}>
            Cloud AI asks for the one thing<br />
            <span className="text-gradient-pink">you can't give it.</span>
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Attorneys, doctors, and compliance teams can't upload sensitive files to the cloud. Vault AI was purpose-built for them.
          </p>
        </div>
        <div className="reveal grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="hidden md:block" />
          <div className="rounded-2xl p-4 text-center bg-red-50 border-2 border-red-100">
            <div className="text-2xl mb-1">😰</div>
            <div className="font-bold text-red-600 text-sm">Cloud AI</div>
          </div>
          <div className="rounded-2xl p-4 text-center border-2"
            style={{ background: 'linear-gradient(135deg, #dbeafe, #ede9fe)', borderColor: '#a5b4fc' }}>
            <div className="text-2xl mb-1">🔒</div>
            <div className="font-bold text-blue-700 text-sm">Vault AI</div>
          </div>
          {rows.map((r, i) => (
            <React.Fragment key={i}>
              <div className={`flex items-center px-4 py-3 rounded-xl ${i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                <span className="text-sm text-gray-700 font-medium">{r.label}</span>
              </div>
              <div className={`flex items-center justify-center py-3 rounded-xl ${i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                {r.before
                  ? <span className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center text-red-500 text-xs font-bold">✗</span>
                  : <span className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-300 text-xs font-bold">—</span>}
              </div>
              <div className={`flex items-center justify-center py-3 rounded-xl ${i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                {r.after
                  ? <span className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xs font-bold">✓</span>
                  : <span className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-300 text-xs font-bold">—</span>}
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── HOW IT WORKS ── */
function HowItWorks() {
  const [mode, setMode] = useState('demo');

  const demoSteps = [
    {
      n: '1', color: '#6366F1', bg: '#EEF2FF',
      title: 'Click "Try Live Demo"',
      desc: 'No download, no Ollama, no signup. The live demo uses OpenAI under the hood so you can experience all features instantly in your browser.',
      code: '# Zero install required\n→ Click "Try Live Demo" above ✓',
    },
    {
      n: '2', color: '#059669', bg: '#d1fae5',
      title: 'Explore all 7 panels',
      desc: 'Chat with files, summarize documents, run deep research, use built-in skills, generate content in 4 modes, connect local data sources, and manage MCP servers.',
      code: 'Chat · Documents · Research\nSkills · Generate · Connectors · MCP ✓',
    },
    {
      n: '3', color: '#ec4899', bg: '#fce7f3',
      title: 'Go fully offline anytime',
      desc: 'When you\'re ready to use your own files with full privacy, install Ollama locally. Switch in Settings — no data ever leaves your machine.',
      code: 'ollama pull llama3.2\n# → Full privacy mode ✓',
    },
  ];

  const localSteps = [
    {
      n: '1', color: '#2563eb', bg: '#dbeafe',
      title: 'Install Ollama',
      desc: 'Download Ollama and pull any model. Works with 1 model, smarter with more. No GPU required — 8GB RAM is enough.',
      code: 'ollama pull llama3.2\nollama pull nomic-embed-text',
    },
    {
      n: '2', color: '#7c3aed', bg: '#ede9fe',
      title: 'Open Vault AI',
      desc: 'Launch the app. It auto-detects your models, sets up routing, and is ready for work in under 30 seconds.',
      code: 'npm install && npm run dev\n# → localhost:5173 ✓',
    },
    {
      n: '3', color: '#ec4899', bg: '#fce7f3',
      title: 'Talk to Your Files',
      desc: 'Type any instruction in plain English. Move files, search documents, generate content — all runs locally on your machine.',
      code: '"Summarize all contracts in /Legal"\n"Extract dates to CSV" ✓',
    },
  ];

  const steps = mode === 'demo' ? demoSteps : localSteps;

  return (
    <section id="how-it-works" className="py-24" style={{ background: 'linear-gradient(180deg, #f8faff 0%, #fff 100%)' }}>
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-10 reveal">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold mb-5"
            style={{ background: '#d1fae5', color: '#059669' }}>
            <ZapIcon size={13} /> Quick Start
          </div>
          <h2 className="font-black text-gray-900 tracking-tight mb-4"
            style={{ fontSize: 'clamp(32px, 5vw, 52px)' }}>
            Up and running in<br />
            <span className="text-gradient-green">under 2 minutes.</span>
          </h2>
          {/* Mode toggle */}
          <div className="flex items-center justify-center gap-2 mt-6 p-1.5 rounded-2xl bg-gray-100 inline-flex mx-auto w-fit">
            <button onClick={() => setMode('demo')}
              className="px-5 py-2 rounded-xl text-sm font-bold transition-all duration-200"
              style={mode === 'demo'
                ? { background: 'white', color: '#6366F1', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }
                : { background: 'transparent', color: '#6b7280' }}>
              ⚡ Try Demo Instantly
            </button>
            <button onClick={() => setMode('local')}
              className="px-5 py-2 rounded-xl text-sm font-bold transition-all duration-200"
              style={mode === 'local'
                ? { background: 'white', color: '#2563eb', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }
                : { background: 'transparent', color: '#6b7280' }}>
              🖥️ Full Local Setup
            </button>
          </div>
          {mode === 'demo' && (
            <p className="text-sm text-gray-400 mt-3">No install. Works in your browser right now.</p>
          )}
          {mode === 'local' && (
            <p className="text-sm text-gray-400 mt-3">100% offline, 100% private — your hardware, your data.</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((s, i) => (
            <div key={i} className="card-hover reveal rounded-3xl border border-gray-100 bg-white shadow-sm overflow-hidden"
              style={{ transitionDelay: `${i * 100}ms` }}>
              <div className="p-2" style={{ background: s.bg }}>
                <div className="rounded-2xl bg-white p-4">
                  <pre className="text-xs font-mono leading-relaxed" style={{ color: s.color }}>{s.code}</pre>
                </div>
              </div>
              <div className="p-6">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xl mb-4"
                  style={{ background: s.bg, color: s.color }}>{s.n}</div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── CONNECTORS ── */
const CONNECTORS = [
  { icon: FolderIcon, name: 'Obsidian', desc: 'Notes & wikilinks', color: '#7c3aed', bg: '#ede9fe' },
  { icon: DatabaseIcon, name: 'SQLite', desc: 'Natural language SQL', color: '#2563eb', bg: '#dbeafe' },
  { icon: GitBranchIcon, name: 'Git', desc: 'Commits & diffs', color: '#ea580c', bg: '#ffedd5' },
  { icon: MailIcon, name: 'Email', desc: '.mbox & .eml files', color: '#dc2626', bg: '#fee2e2' },
  { icon: BookmarkIcon, name: 'Bookmarks', desc: 'Chrome, Firefox, Safari', color: '#d97706', bg: '#fef3c7' },
  { icon: ServerIcon, name: 'MCP Servers', desc: 'External tools via MCP', color: '#0891b2', bg: '#cffafe' },
];

function Connectors() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-14 reveal">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold mb-5"
            style={{ background: '#ffedd5', color: '#ea580c' }}>
            <PlugIcon size={13} /> Local Connectors
          </div>
          <h2 className="font-black text-gray-900 tracking-tight mb-4"
            style={{ fontSize: 'clamp(32px, 5vw, 52px)' }}>
            Your AI reads<br />
            <span className="text-gradient-blue">all your data sources.</span>
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Connect local data sources and query them directly in chat — no data ever leaves your machine.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
          {CONNECTORS.map((c, i) => (
            <div key={i} className="card-hover reveal rounded-2xl p-5 border border-gray-100 bg-white shadow-sm hover:shadow-lg transition-all duration-300 flex items-center gap-4"
              style={{ transitionDelay: `${i * 70}ms` }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: c.bg }}>
                <c.icon size={22} style={{ color: c.color }} />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">{c.name}</p>
                <p className="text-gray-400 text-xs">{c.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="reveal rounded-3xl p-8 border-2 overflow-hidden relative"
          style={{ background: 'linear-gradient(135deg, #ede9fe 0%, #dbeafe 100%)', borderColor: '#c4b5fd' }}>
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }} />
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 relative">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <ServerIcon size={18} className="text-purple-600" />
                <span className="font-bold text-purple-700 text-sm uppercase tracking-wide">Model Context Protocol</span>
              </div>
              <h3 className="font-black text-gray-900 text-2xl mb-2">Vault AI speaks MCP — both ways.</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Expose your entire Vault AI toolkit (13 tools) to Claude Desktop or Cursor. Or plug in external MCP servers for web search, GitHub access, and more.
              </p>
            </div>
            <div className="md:w-72 flex-shrink-0 rounded-2xl overflow-hidden bg-gray-900 shadow-xl">
              <div className="px-4 py-2.5 border-b border-white/5">
                <span className="text-gray-500 text-xs font-mono">claude_desktop_config.json</span>
              </div>
              <pre className="px-4 py-4 text-xs font-mono text-blue-300 leading-relaxed">{`{
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

/* ── PRIVACY ── */
function Privacy() {
  const pillars = [
    { icon: ShieldCheckIcon, color: '#059669', bg: '#d1fae5', title: 'Zero Data Egress', desc: 'By architecture, not policy. No HTTP calls outside localhost. Every byte stays on your device — verifiable and auditable.' },
    { icon: CpuIcon, color: '#2563eb', bg: '#dbeafe', title: 'Local Model Execution', desc: 'Ollama runs models on your hardware. No API tokens, no usage tracking, no model provider ever seeing your queries.' },
    { icon: LockIcon, color: '#7c3aed', bg: '#ede9fe', title: 'Open & Auditable', desc: 'No black boxes. Every network call, every model invocation is visible, local, and inspectable. Privacy by design.' },
    { icon: FolderIcon, color: '#d97706', bg: '#fef3c7', title: 'Safe File Operations', desc: 'Deleted files go to OS Trash — never permanent deletion. All destructive operations require your explicit confirmation.' },
  ];
  return (
    <section id="privacy" className="py-24" style={{ background: 'linear-gradient(180deg, #fff 0%, #f0fdf4 100%)' }}>
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-14 reveal">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold mb-5"
            style={{ background: '#d1fae5', color: '#059669' }}>
            <ShieldCheckIcon size={13} /> Privacy First
          </div>
          <h2 className="font-black text-gray-900 tracking-tight mb-4"
            style={{ fontSize: 'clamp(32px, 5vw, 52px)' }}>
            Privacy isn't a feature.<br />
            <span className="text-gradient-green">It's the foundation.</span>
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Built for attorneys, healthcare teams, compliance officers, and anyone whose files are too sensitive for the cloud.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
          {pillars.map((p, i) => (
            <div key={i} className="card-hover reveal rounded-2xl p-6 border border-gray-100 bg-white shadow-sm hover:shadow-lg transition-all duration-300 flex gap-4"
              style={{ transitionDelay: `${i * 80}ms` }}>
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: p.bg }}>
                <p.icon size={20} style={{ color: p.color }} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">{p.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="reveal rounded-2xl p-5 border-2 flex flex-wrap items-center gap-4"
          style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
            <span className="font-bold text-green-800 text-sm">Privacy Status: All Systems Local</span>
          </div>
          <div className="flex flex-wrap gap-4 sm:ml-auto">
            {['Ollama: localhost only', 'External requests: 0', 'Telemetry: off', 'Files logged locally'].map(t => (
              <span key={t} className="flex items-center gap-1.5 text-xs text-green-700 font-medium">
                <CheckIcon size={11} className="text-green-600" /> {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── PERSONAS ── */
function Personas() {
  const personas = [
    {
      emoji: '⚖️', name: 'Clara', role: 'Immigration Attorney',
      color: '#2563eb', bg: '#dbeafe', ringColor: '#93c5fd',
      pain: 'Ethics rules ban cloud AI. Client files cannot leave her machine.',
      gain: 'Full AI assistance on case files, contracts, and briefs — 100% local. Finally usable.',
    },
    {
      emoji: '🏥', name: 'Marcus', role: 'HealthTech VP Engineering',
      color: '#059669', bg: '#d1fae5', ringColor: '#6ee7b7',
      pain: 'PHI compliance blocks all SaaS AI. Team wastes hours on manual document work.',
      gain: 'On-prem AI with audit logs, RBAC, and zero egress. Compliance-safe from day one.',
    },
    {
      emoji: '⚡', name: 'Priya', role: 'Indie Developer',
      color: '#7c3aed', bg: '#ede9fe', ringColor: '#c4b5fd',
      pain: 'Tired of wiring Ollama + LangChain + vector DB manually for every side project.',
      gain: 'Production-grade local AI platform with connectors, agents, and MCP built in.',
    },
  ];
  return (
    <section className="py-24 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-14 reveal">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold mb-5"
            style={{ background: '#dbeafe', color: '#2563eb' }}>
            <UsersIcon size={13} /> Who It's For
          </div>
          <h2 className="font-black text-gray-900 tracking-tight mb-4"
            style={{ fontSize: 'clamp(32px, 5vw, 52px)' }}>
            Built for people who<br />
            <span className="text-gradient-blue">can't afford to trust the cloud.</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {personas.map((p, i) => (
            <div key={i} className="card-hover reveal rounded-3xl p-7 border-2 bg-white shadow-sm hover:shadow-xl transition-all duration-300"
              style={{ borderColor: p.ringColor, transitionDelay: `${i * 100}ms` }}>
              <div className="text-4xl mb-4">{p.emoji}</div>
              <div className="mb-5">
                <p className="font-black text-gray-900 text-xl">{p.name}</p>
                <p className="text-sm font-semibold" style={{ color: p.color }}>{p.role}</p>
              </div>
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-red-50 border border-red-100">
                  <p className="text-xs text-red-600 leading-relaxed font-medium">❌ {p.pain}</p>
                </div>
                <div className="p-3.5 rounded-2xl border" style={{ background: p.bg, borderColor: p.ringColor }}>
                  <p className="text-xs leading-relaxed font-medium" style={{ color: p.color }}>✅ {p.gain}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── COMING NEXT ── */
function ComingNext() {
  const items = [
    {
      emoji: '👥', label: 'Coming soon', labelColor: '#d97706', labelBg: '#fef3c7',
      title: 'Team Workspaces',
      desc: 'Multi-user support with role-based access, audit logging, and an admin console — for teams that handle sensitive documents together.',
      pills: ['RBAC', 'Audit logs', 'Admin console', 'Docker deploy'],
      color: '#d97706', border: '#fde68a',
    },
    {
      emoji: '⏰', label: 'Coming soon', labelColor: '#7c3aed', labelBg: '#ede9fe',
      title: 'Scheduled Agents',
      desc: 'Set Vault AI to work while you sleep. Auto-organize new files, generate weekly summaries, watch folders for changes — on your schedule.',
      pills: ['Cron scheduling', 'Watch folders', 'Auto-organize', 'Email reports'],
      color: '#7c3aed', border: '#c4b5fd',
    },
    {
      emoji: '📱', label: 'Coming soon', labelColor: '#0891b2', labelBg: '#cffafe',
      title: 'Mobile Companion',
      desc: 'Access your Vault AI from your phone over local WiFi. Chat, search, and trigger file ops from anywhere in your home or office.',
      pills: ['iOS & Android', 'Local WiFi', 'Quick actions'],
      color: '#0891b2', border: '#a5f3fc',
    },
  ];
  return (
    <section className="py-20 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        <div className="reveal flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-3"
              style={{ background: '#f0fdf4', color: '#059669' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
              v4.0 shipped · What's next
            </div>
            <h2 className="font-black text-gray-900 text-2xl md:text-3xl tracking-tight">
              What's coming next in Vault AI
            </h2>
          </div>
          <p className="text-gray-400 text-sm max-w-xs leading-relaxed">
            The core platform is live. These three capabilities are next on the roadmap.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {items.map((item, i) => (
            <div key={i}
              className="card-hover reveal rounded-2xl p-6 border-2 bg-white hover:shadow-xl transition-all duration-300"
              style={{ borderColor: item.border, transitionDelay: `${i * 90}ms` }}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">{item.emoji}</span>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{ background: item.labelBg, color: item.labelColor }}>
                  {item.label}
                </span>
              </div>
              <h3 className="font-black text-gray-900 text-lg mb-2">{item.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-5">{item.desc}</p>
              <div className="flex flex-wrap gap-2">
                {item.pills.map(p => (
                  <span key={p} className="text-xs font-semibold px-2.5 py-1 rounded-xl"
                    style={{ background: item.labelBg, color: item.color }}>{p}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── FAQ ── */
function FAQ() {
  const [open, setOpen] = useState(null);
  const faqs = [
    {
      q: "Does it really work without internet?",
      a: "Yes — completely. Vault AI makes zero network calls beyond localhost when running with Ollama. Models run on your hardware, files stay on your disk. You can literally pull your ethernet cable and everything still works. The live demo uses OpenAI for convenience, but local mode has zero egress.",
    },
    {
      q: "What AI models does it support?",
      a: "Any Ollama-compatible model: llama3.2, mistral, phi3, gemma2, qwen2.5, deepseek-r1, and more. For best results we recommend llama3.2:3b for fast file ops and llama3.2:8b for document Q&A. The live demo uses OpenAI so you can test all features without any local setup.",
    },
    {
      q: "What actually happens to my files?",
      a: "Nothing leaves your machine. Files are read locally for context — they're never uploaded. Deleted files go to your OS Trash (not permanent deletion). Every destructive operation (move, rename, delete) requires your explicit confirmation before executing.",
    },
    {
      q: "Can I connect it to Claude Desktop or Cursor?",
      a: "Yes — Vault AI exposes 13 tools via MCP (Model Context Protocol). Add a single entry to your Claude Desktop config to give Claude access to your local file system, documents, and agents. Works with Cursor, Claude, and any MCP-compatible client.",
    },
    {
      q: "How is this different from ChatGPT or Copilot?",
      a: "Cloud AI tools upload your files to their servers. Vault AI runs everything on your hardware and actually executes file operations — it doesn't just answer questions about them. Beyond chat, you get a full research panel, document generator, skills library, local connectors, and MCP hub. No subscription, no data leaving your machine.",
    },
    {
      q: "Do I need a powerful computer?",
      a: "No. Vault AI runs well on any modern laptop with 8GB RAM. A MacBook Air M2 handles llama3.2:3b at excellent speed. Larger models (8B+) benefit from more RAM or Apple Silicon, but aren't required for core functionality.",
    },
  ];
  return (
    <section className="py-24" style={{ background: 'linear-gradient(180deg, #fff 0%, #f8faff 100%)' }}>
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-14 reveal">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold mb-5"
            style={{ background: '#EEF2FF', color: '#6366F1' }}>
            <MessageSquareIcon size={13} /> FAQ
          </div>
          <h2 className="font-black text-gray-900 tracking-tight mb-4"
            style={{ fontSize: 'clamp(28px, 4vw, 44px)' }}>
            Common questions,<br />
            <span className="text-gradient-blue">honest answers.</span>
          </h2>
        </div>
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <div key={i} className="reveal rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm transition-all duration-200 hover:shadow-md"
              style={{ transitionDelay: `${i * 50}ms` }}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-4 text-left">
                <span className="font-semibold text-gray-900 text-sm pr-4">{f.q}</span>
                <ChevronDownIcon size={16} className="text-gray-400 flex-shrink-0 transition-transform duration-200"
                  style={{ transform: open === i ? 'rotate(180deg)' : 'none' }} />
              </button>
              <div className={`overflow-hidden transition-all duration-300 ${open === i ? 'max-h-64' : 'max-h-0'}`}>
                <p className="px-6 pb-5 text-sm text-gray-500 leading-relaxed border-t border-gray-50 pt-3">{f.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── CTA ── */
function CTA() {
  return (
    <section className="py-24 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #1e3a8a 50%, #0c4a6e 100%)' }}>
      <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full opacity-20"
        style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }} />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full opacity-15"
        style={{ background: 'radial-gradient(circle, #ec4899, transparent)' }} />
      <div className="max-w-3xl mx-auto px-6 text-center relative">
        <div className="text-6xl mb-6 animate-float">🔒</div>
        <h2 className="font-black text-white leading-tight mb-5"
          style={{ fontSize: 'clamp(36px, 6vw, 64px)' }}>
          Your files deserve an AI<br />
          <span style={{ background: 'linear-gradient(90deg, #60a5fa, #a78bfa, #f0abfc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            that keeps secrets.
          </span>
        </h2>
        <p className="text-blue-200 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
          No cloud. No subscriptions. No data leaving your machine. Built for professionals who handle sensitive documents every day.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href={APP_URL} target="_blank" rel="noopener noreferrer"
            className="bg-white text-blue-900 font-black px-10 py-4 rounded-2xl text-lg flex items-center gap-3 hover:bg-blue-50 transition-all duration-200 shadow-2xl hover:shadow-white/20 hover:-translate-y-1">
            <SparklesIcon size={20} className="text-blue-600" />
            Launch Vault AI Free
            <ArrowRightIcon size={18} />
          </a>
          <a href="#features"
            className="text-white/70 hover:text-white font-semibold px-8 py-4 rounded-2xl text-base flex items-center gap-2 border-2 border-white/20 hover:border-white/40 transition-all duration-200">
            <CodeIcon size={16} />
            See All Features
          </a>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-sm text-blue-200/70">
          {['🔒 100% Local', '⚡ Instant Setup', '🛡️ Zero Telemetry', '🌐 Works Offline', '✅ Open Architecture'].map(b => (
            <span key={b} className="font-medium">{b}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── FOOTER ── */
function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 py-10">
      <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}>
            <LockIcon size={15} className="text-white" />
          </div>
          <span className="font-black text-gray-900">Vault AI</span>
          <span className="text-gray-300 mx-1">·</span>
          <span className="text-gray-400 text-sm">Your Files. Your AI. Your Privacy.</span>
        </div>
        <div className="flex flex-wrap items-center gap-5 text-xs text-gray-400">
          {['100% Local', 'Zero data egress', 'Open architecture', '© 2026 Vault AI'].map(t => (
            <span key={t}>{t}</span>
          ))}
        </div>
      </div>
    </footer>
  );
}

/* ── ROOT ── */
export default function App() {
  useReveal();
  return (
    <div className="min-h-screen bg-white">
      <AnnouncementBar />
      <Nav />
      <Hero />
      <Ticker />
      <Stats />
      <AppPreview />
      <Features />
      <Problem />
      <HowItWorks />
      <Connectors />
      <Privacy />
      <Personas />
      <ComingNext />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}
