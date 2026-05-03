import React, { useState } from 'react';
import { 
  MessageSquare, FileText, Globe, Zap, Sparkles, 
  Plug, Server, Lock, Plus, Settings, Cpu, 
  PanelLeftClose, Trash, Paperclip, Send, User, ChevronDown
} from 'lucide-react';

export function RefinedLight() {
  const [activeNav, setActiveNav] = useState('Chat');
  
  const navItems = [
    { name: 'Chat', icon: MessageSquare },
    { name: 'Documents', icon: FileText },
    { name: 'Research', icon: Globe },
    { name: 'Skills', icon: Zap },
    { name: 'Generate', icon: Sparkles },
    { name: 'Connectors', icon: Plug },
    { name: 'MCP Tools', icon: Server },
  ];

  return (
    <div className="vault-refined-light flex w-full h-full overflow-hidden text-slate-800" style={{ backgroundColor: '#EBE9F1', fontFamily: '"Inter", -apple-system, sans-serif', width: '100vw', height: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');
        
        .vault-refined-light .sidebar-bg {
          background: linear-gradient(180deg, #FDFDFE 0%, #F5F5F8 100%);
        }
        
        .vault-refined-light .nav-hover {
          position: relative;
          overflow: hidden;
        }
        
        .vault-refined-light .nav-hover::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(79, 70, 229, 0.06);
          transform: translateX(-100%);
          transition: transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
          border-radius: 8px;
          z-index: 0;
        }
        
        .vault-refined-light .nav-hover:hover::before {
          transform: translateX(0);
        }
        
        .vault-refined-light .glass-panel {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(16px);
          box-shadow: 
            0 12px 32px -12px rgba(20, 20, 40, 0.1),
            0 2px 6px -2px rgba(20, 20, 40, 0.05),
            inset 0 1px 0 rgba(255, 255, 255, 0.9);
        }
        
        .vault-refined-light .status-dot {
          box-shadow: 0 0 8px rgba(245, 158, 11, 0.5);
        }
      `}</style>

      {/* Sidebar */}
      <div className="sidebar-bg w-[260px] flex-shrink-0 flex flex-col border-r border-[#E2E0EC] shadow-[1px_0_10px_rgba(0,0,0,0.02)] z-10">
        {/* macOS traffic lights & Header */}
        <div className="h-14 px-4 flex items-center justify-between">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E] shadow-sm"></div>
            <div className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123] shadow-sm"></div>
            <div className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29] shadow-sm"></div>
          </div>
          <button className="text-slate-400 hover:text-slate-600 transition-colors">
            <PanelLeftClose size={16} strokeWidth={1.5} />
          </button>
        </div>

        {/* Brand */}
        <div className="px-5 pb-6 pt-2">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm text-white">
              <Lock size={14} strokeWidth={2.5} />
            </div>
            <span className="font-medium text-slate-800 tracking-tight text-sm">Vault AI</span>
          </div>
        </div>

        {/* New Chat Button */}
        <div className="px-4 mb-6">
          <button className="w-full flex items-center gap-2 bg-white border border-[#E2E0EC] rounded-xl px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:shadow hover:border-[#D5D2E3] transition-all group">
            <div className="bg-indigo-50 text-indigo-600 rounded-md p-1 group-hover:bg-indigo-100 transition-colors">
              <Plus size={14} strokeWidth={2.5} />
            </div>
            <span>New Chat</span>
          </button>
        </div>

        {/* Nav Items */}
        <div className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          <div className="px-3 pb-2 pt-1 text-[11px] font-medium text-slate-400 tracking-[0.08em] uppercase">Menu</div>
          {navItems.map((item) => (
            <button
              key={item.name}
              onClick={() => setActiveNav(item.name)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors relative nav-hover ${
                activeNav === item.name
                  ? 'text-indigo-700 font-medium bg-indigo-50/50'
                  : 'text-slate-600 hover:text-slate-900 font-light'
              }`}
            >
              <div className="relative z-10 flex items-center gap-3">
                <item.icon 
                  size={16} 
                  strokeWidth={activeNav === item.name ? 2 : 1.5} 
                  className={activeNav === item.name ? 'text-indigo-600' : 'text-slate-400'} 
                />
                <span className="tracking-wide">{item.name}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 mt-auto border-t border-[#E2E0EC]/60">
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
              <div className="w-2 h-2 rounded-full bg-amber-400 status-dot"></div>
              <span>Demo mode active</span>
            </div>
            <Cpu size={14} className="text-slate-400" />
          </div>
          <button className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg text-slate-600 hover:text-slate-900 nav-hover font-light">
            <div className="relative z-10 flex items-center gap-3">
              <Settings size={16} strokeWidth={1.5} className="text-slate-400" />
              <span className="tracking-wide">Settings</span>
            </div>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col p-6 pl-8">
        <div className="glass-panel flex-1 rounded-2xl border border-white/40 flex flex-col overflow-hidden relative">
          
          {/* Header */}
          <div className="h-14 border-b border-slate-200/60 flex items-center px-6 justify-between bg-white/40 backdrop-blur-md sticky top-0 z-20">
            <div className="flex items-center gap-2.5">
              <Lock size={14} className="text-slate-400" strokeWidth={2} />
              <span className="text-slate-400 font-medium text-sm">Vault AI</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-800 font-medium text-sm">Q3 Financial Report Analysis</span>
            </div>
            
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-white/60 hover:bg-white px-2.5 py-1.5 rounded-md border border-slate-200 transition-colors">
                <FileText size={12} />
                <span>1 Document Attached</span>
              </button>
              <button className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 hover:bg-black/5 rounded-md">
                <Trash size={16} strokeWidth={1.5} />
              </button>
            </div>
          </div>

          {/* Chat Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col relative z-10">
            {/* Date Separator */}
            <div className="flex justify-center">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-widest bg-slate-100/50 px-3 py-1 rounded-full border border-slate-200/50">Today</span>
            </div>

            {/* User Message */}
            <div className="flex justify-end gap-4 max-w-3xl ml-auto w-full">
              <div className="bg-indigo-600 text-white px-5 py-3.5 rounded-2xl rounded-tr-sm shadow-sm text-[15px] leading-relaxed font-light tracking-wide">
                Can you summarize the key risks mentioned in the Q3 Financial Report?
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 border border-white shadow-sm">
                <User size={16} className="text-slate-500" />
              </div>
            </div>

            {/* AI Message */}
            <div className="flex justify-start gap-4 max-w-3xl mr-auto w-full">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-sm text-white">
                <Sparkles size={14} />
              </div>
              <div className="bg-white/80 border border-slate-200/60 px-5 py-4 rounded-2xl rounded-tl-sm shadow-sm text-[15px] leading-relaxed text-slate-700 font-light tracking-wide space-y-3">
                <p>Based on the attached <strong>Q3 Financial Report</strong>, here are the key risks highlighted by the board:</p>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li><strong className="font-medium text-slate-800">Supply Chain Volatility:</strong> Increased lead times in the Asia-Pacific region have delayed hardware shipments by an average of 14 days.</li>
                  <li><strong className="font-medium text-slate-800">Currency Fluctuations:</strong> The strong USD has created a 4% headwind on European revenue realization compared to Q2.</li>
                  <li><strong className="font-medium text-slate-800">Regulatory Compliance:</strong> Upcoming changes to EU data privacy laws will require an estimated $1.2M in compliance-related engineering work in Q4.</li>
                </ul>
                <p className="pt-2 text-sm text-slate-500 flex items-center gap-1.5">
                  <FileText size={12} /> Source: Q3_Financial_Review.pdf (Pages 14-16)
                </p>
              </div>
            </div>
            
            {/* User Message 2 */}
            <div className="flex justify-end gap-4 max-w-3xl ml-auto w-full mt-4">
              <div className="bg-indigo-600 text-white px-5 py-3.5 rounded-2xl rounded-tr-sm shadow-sm text-[15px] leading-relaxed font-light tracking-wide">
                Are there any mitigation strategies mentioned for the supply chain issues?
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 border border-white shadow-sm">
                <User size={16} className="text-slate-500" />
              </div>
            </div>
            
            {/* Typing Indicator */}
            <div className="flex justify-start gap-4 max-w-3xl mr-auto w-full">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-sm text-white">
                <Sparkles size={14} />
              </div>
              <div className="bg-white/80 border border-slate-200/60 px-5 py-4 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white/60 backdrop-blur-md border-t border-slate-200/60 z-20">
            <div className="max-w-4xl mx-auto relative group">
              <div className="absolute inset-0 bg-indigo-500/5 rounded-xl blur-md transition-opacity opacity-0 group-focus-within:opacity-100"></div>
              <div className="relative bg-white border border-slate-200 rounded-xl shadow-sm flex items-end p-2 transition-all focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-500/10">
                <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors rounded-lg hover:bg-indigo-50 flex-shrink-0 mb-0.5">
                  <Paperclip size={20} strokeWidth={1.5} />
                </button>
                <textarea 
                  placeholder="Ask Vault AI about your documents..."
                  className="flex-1 max-h-32 min-h-[40px] resize-none bg-transparent border-0 focus:ring-0 p-2.5 text-[15px] text-slate-800 placeholder-slate-400 font-light tracking-wide outline-none"
                  rows={1}
                ></textarea>
                <div className="flex items-center gap-1.5 flex-shrink-0 mb-0.5 mr-0.5">
                  <button className="p-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors rounded-lg hover:bg-slate-100 flex items-center gap-1">
                    <span>Local</span>
                    <ChevronDown size={14} />
                  </button>
                  <button className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm transition-colors flex items-center justify-center">
                    <Send size={18} strokeWidth={2} className="ml-0.5" />
                  </button>
                </div>
              </div>
              <div className="text-center mt-2 text-[11px] text-slate-400 font-medium tracking-wide">
                Vault AI processes your documents locally. No data leaves your machine.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RefinedLight;
