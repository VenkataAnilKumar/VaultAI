import React, { useState } from 'react';
import { 
  MessageSquare, FileText, Globe, Zap, Sparkles, 
  Plug, Server, Lock, Plus, Settings, Cpu, 
  PanelLeftClose, Trash, Shield, ArrowUp
} from 'lucide-react';

const noiseTexture = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E")`;

export function DarkPremium() {
  const [activeNav, setActiveNav] = useState('chat');
  const [inputText, setInputText] = useState('');

  const navItems = [
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'research', label: 'Research', icon: Globe },
    { id: 'skills', label: 'Skills', icon: Zap },
    { id: 'generate', label: 'Generate', icon: Sparkles },
    { id: 'connectors', label: 'Connectors', icon: Plug },
    { id: 'mcp', label: 'MCP Tools', icon: Server },
  ];

  return (
    <div 
      className="flex text-zinc-300 font-sans overflow-hidden antialiased selection:bg-indigo-500/30"
      style={{ width: '100vw', height: '100vh', backgroundColor: '#0A0A0F' }}
    >
      {/* Sidebar */}
      <div 
        className="flex flex-col w-[240px] shrink-0 border-r border-white/5 relative z-10"
        style={{ 
          backgroundColor: '#0F0F13',
          backgroundImage: noiseTexture,
          backgroundBlendMode: 'overlay'
        }}
      >
        {/* Traffic Lights & Collapse */}
        <div className="flex items-center justify-between px-4 h-14 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80 border border-red-500/20 shadow-[0_0_8px_rgba(239,68,68,0.2)]" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80 border border-yellow-500/20 shadow-[0_0_8px_rgba(234,179,8,0.2)]" />
            <div className="w-3 h-3 rounded-full bg-green-500/80 border border-green-500/20 shadow-[0_0_8px_rgba(34,197,94,0.2)]" />
          </div>
          <button className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <PanelLeftClose size={16} />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="px-3 mb-6">
          <button className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 rounded-lg text-sm font-medium transition-all shadow-sm">
            <div className="flex items-center gap-2">
              <Plus size={16} className="text-zinc-400" />
              <span>New chat</span>
            </div>
            <div className="flex items-center gap-1 opacity-60">
              <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/40 border border-white/10 text-zinc-400">⌘</kbd>
              <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/40 border border-white/10 text-zinc-400">N</kbd>
            </div>
          </button>
        </div>

        {/* Nav Items */}
        <div className="flex-1 overflow-y-auto px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = activeNav === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className={\`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all relative overflow-hidden group \${
                  isActive 
                    ? 'text-white font-medium bg-indigo-500/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]' 
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
                }\`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-indigo-500 rounded-r-full shadow-[0_0_12px_rgba(99,102,241,0.8)]" />
                )}
                <Icon size={16} className={\`transition-colors \${isActive ? 'text-indigo-400' : 'group-hover:text-zinc-300'}\`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 mt-auto shrink-0 border-t border-white/5 space-y-1">
          <button className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03] transition-all group">
            <div className="flex items-center gap-3">
              <Cpu size={16} className="group-hover:text-zinc-300" />
              <span>Local Llama-3</span>
            </div>
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03] transition-all group">
            <Settings size={16} className="group-hover:text-zinc-300" />
            <span>Settings</span>
          </button>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col p-4 md:p-6 overflow-hidden relative">
        {/* Background Noise for Main Area */}
        <div 
          className="absolute inset-0 pointer-events-none" 
          style={{ backgroundImage: noiseTexture, opacity: 0.5 }}
        />
        
        {/* Floating Card */}
        <div 
          className="flex-1 flex flex-col rounded-xl border border-white/[0.08] overflow-hidden shadow-2xl relative z-10"
          style={{ backgroundColor: '#16161D' }}
        >
          {/* Header */}
          <div className="h-14 px-6 flex items-center justify-between border-b border-white/[0.06] shrink-0 bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Lock size={16} className="text-violet-400" />
                <div className="absolute inset-0 bg-violet-400/20 blur-md rounded-full" />
              </div>
              <span className="font-semibold text-white tracking-tight">Vault AI</span>
              <span className="text-zinc-600">/</span>
              <span className="text-zinc-300 font-medium">Chat</span>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-white/5 rounded-md transition-colors">
                <Shield size={16} />
              </button>
              <button className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-white/5 rounded-md transition-colors">
                <Trash size={16} />
              </button>
            </div>
          </div>

          {/* Chat Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            {/* AI Welcome */}
            <div className="flex gap-4 max-w-3xl mx-auto">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
                <Sparkles size={16} className="text-indigo-400" />
              </div>
              <div className="pt-1">
                <div className="text-xs font-mono text-indigo-400 mb-1">VAULT AI</div>
                <div className="text-zinc-300 leading-relaxed text-[15px]">
                  Welcome back. Your local vault is secure and fully indexed. What are we working on today?
                </div>
              </div>
            </div>

            {/* User Message */}
            <div className="flex gap-4 max-w-3xl mx-auto">
              <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center shrink-0 text-xs font-medium text-white">
                ME
              </div>
              <div className="pt-1 w-full">
                <div className="text-xs font-mono text-zinc-500 mb-1">YOU</div>
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl rounded-tl-sm p-4 text-zinc-200 text-[15px] shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
                  Can you summarize the security protocols from the Q3 architecture document?
                </div>
              </div>
            </div>

            {/* AI Response */}
            <div className="flex gap-4 max-w-3xl mx-auto">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
                <Sparkles size={16} className="text-indigo-400" />
              </div>
              <div className="pt-1 w-full">
                <div className="text-xs font-mono text-indigo-400 mb-1 flex items-center gap-2">
                  VAULT AI 
                  <span className="flex items-center gap-1 text-zinc-500 font-sans">
                    <FileText size={10} />
                    q3-arch-doc.pdf
                  </span>
                </div>
                <div className="bg-black/20 border border-white/[0.04] rounded-2xl rounded-tl-sm p-5 text-zinc-300 leading-relaxed text-[15px] shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
                  <p className="mb-4">Based on the <strong>Q3 architecture document</strong>, here are the key security protocols implemented:</p>
                  <ul className="space-y-3">
                    <li className="flex gap-3">
                      <div className="mt-1 w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0 shadow-[0_0_5px_rgba(167,139,250,0.5)]" />
                      <span><strong>Zero-Trust Architecture:</strong> All internal microservices require mutual TLS (mTLS) authentication.</span>
                    </li>
                    <li className="flex gap-3">
                      <div className="mt-1 w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0 shadow-[0_0_5px_rgba(167,139,250,0.5)]" />
                      <span><strong>Data at Rest:</strong> AES-256 encryption using local keychain integration. Keys are never transmitted off-device.</span>
                    </li>
                    <li className="flex gap-3">
                      <div className="mt-1 w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0 shadow-[0_0_5px_rgba(167,139,250,0.5)]" />
                      <span><strong>Local Processing:</strong> Embedding generation and LLM inference occur entirely on local silicon, bypassing cloud providers.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Input Area */}
          <div className="p-4 md:p-6 pt-0 bg-gradient-to-t from-[#16161D] via-[#16161D] to-transparent shrink-0">
            <div className="max-w-3xl mx-auto relative group">
              <div className="absolute inset-0 bg-indigo-500/5 blur-xl rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <div className="relative bg-black/40 border border-white/10 rounded-2xl overflow-hidden focus-within:border-indigo-500/50 focus-within:shadow-[0_0_20px_rgba(99,102,241,0.1)] transition-all duration-300">
                <textarea 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Ask Vault AI..." 
                  className="w-full bg-transparent text-zinc-200 placeholder:text-zinc-600 p-4 min-h-[60px] max-h-[200px] resize-none focus:outline-none text-[15px]"
                  rows={1}
                />
                <div className="flex items-center justify-between px-3 py-2 border-t border-white/[0.04] bg-white/[0.01]">
                  <div className="flex items-center gap-1">
                    <button className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-white/5 rounded-md transition-colors" title="Add context">
                      <Plus size={18} />
                    </button>
                    <button className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-white/5 rounded-md transition-colors" title="Search web">
                      <Globe size={18} />
                    </button>
                  </div>
                  <button 
                    className={\`p-1.5 rounded-md transition-all duration-300 \${
                      inputText.length > 0 
                        ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]' 
                        : 'bg-white/5 text-zinc-600'
                    }\`}
                  >
                    <ArrowUp size={18} />
                  </button>
                </div>
              </div>
              <div className="text-center mt-2">
                <span className="text-[10px] text-zinc-600 font-mono">Vault AI processes all data locally.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* CSS for custom scrollbar embedded */}
      <style>{\`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      \`}</style>
    </div>
  );
}

export default DarkPremium;
