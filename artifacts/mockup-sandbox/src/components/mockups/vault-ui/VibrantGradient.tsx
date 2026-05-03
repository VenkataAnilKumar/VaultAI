import React, { useState } from 'react';
import { 
  MessageSquare, FileText, Globe, Zap, Sparkles, 
  Plug, Server, Lock, Plus, Settings, Cpu, 
  PanelLeftClose, Trash, Shield, Bot, Search,
  ChevronDown, Send, User, MoreHorizontal, Maximize2
} from 'lucide-react';

export function VibrantGradient() {
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
    <div 
      className="flex overflow-hidden font-sans text-slate-100 relative bg-slate-950" 
      style={{ width: '100vw', height: '100vh' }}
    >
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]" 
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0V0zm1 1h38v38H1V1z' fill='%23ffffff' fill-rule='evenodd'/%3E%3C/svg%3E")`,
            backgroundSize: '40px 40px'
          }}
        />
        
        {/* Floating blur circles */}
        <div className="absolute top-[-10%] left-[20%] w-[40vw] h-[40vw] rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-600/10 blur-[150px]" />
        <div className="absolute top-[40%] left-[60%] w-[30vw] h-[30vw] rounded-full bg-fuchsia-600/10 blur-[100px]" />
      </div>

      {/* Sidebar */}
      <div 
        className="relative z-10 w-[240px] flex-shrink-0 flex flex-col border-r border-white/10 shadow-2xl"
        style={{
          background: 'linear-gradient(170deg, #1e1040 0%, #0f1629 50%, #0a0f2e 100%)'
        }}
      >
        {/* macOS Traffic Lights & Sidebar Toggle */}
        <div className="flex items-center justify-between p-4 pl-5">
          <div className="flex space-x-2">
            <div className="w-3 h-3 rounded-full bg-[#FF5F56] border border-black/10 shadow-sm" />
            <div className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-black/10 shadow-sm" />
            <div className="w-3 h-3 rounded-full bg-[#27C93F] border border-black/10 shadow-sm" />
          </div>
          <button className="text-white/50 hover:text-white transition-colors">
            <PanelLeftClose size={16} />
          </button>
        </div>

        {/* Brand */}
        <div className="px-5 py-2 mb-4 flex items-center gap-2.5">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-blue-600 shadow-lg shadow-violet-500/20">
            <Shield size={18} className="text-white" />
            <div className="absolute inset-0 bg-white/20 rounded-lg opacity-0 hover:opacity-100 transition-opacity" />
          </div>
          <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
            Vault AI
          </span>
        </div>

        {/* New Chat Button */}
        <div className="px-4 mb-6">
          <button className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium transition-all group overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600/0 via-violet-600/10 to-violet-600/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            <Plus size={16} className="text-violet-400 group-hover:text-violet-300 transition-colors" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => (
            <button
              key={item.name}
              onClick={() => setActiveNav(item.name)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative
                ${activeNav === item.name 
                  ? 'text-white' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'}`}
            >
              {activeNav === item.name && (
                <div 
                  className="absolute inset-0 rounded-lg z-0 shadow-[0_0_15px_rgba(139,92,246,0.2)]"
                  style={{
                    background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.8) 0%, rgba(59, 130, 246, 0.8) 100%)'
                  }}
                />
              )}
              <item.icon size={18} className={`relative z-10 ${activeNav === item.name ? 'text-white' : ''}`} />
              <span className="relative z-10">{item.name}</span>
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 mt-auto border-t border-white/10 space-y-2">
          <div className="flex items-center justify-between px-2 py-1">
            <div className="flex items-center gap-2 text-xs text-white/50">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
              <span>Llama-3-8B-Instruct</span>
            </div>
            <button className="text-white/40 hover:text-white transition-colors">
              <Cpu size={14} />
            </button>
          </div>
          
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-all">
            <Settings size={18} />
            <span>Settings</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 flex flex-col p-6 h-full overflow-hidden">
        
        {/* Floating Header Badge */}
        <div className="absolute top-6 right-6 z-30 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-lg">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
          <span className="text-xs font-medium text-white/70">Local Network</span>
        </div>

        {/* Main Floating Card */}
        <div className="flex-1 flex flex-col relative w-full max-w-5xl mx-auto mt-8 mb-4">
          
          {/* Card Gradient Border Wrapper */}
          <div className="absolute inset-0 rounded-2xl p-[1px] bg-gradient-to-b from-white/20 via-white/5 to-transparent pointer-events-none z-20" />
          
          {/* Card Glow */}
          <div className="absolute inset-0 bg-violet-500/5 blur-xl rounded-2xl pointer-events-none z-0" />

          {/* Card Content */}
          <div className="relative z-10 flex-1 flex flex-col bg-[#0f172a]/80 backdrop-blur-2xl rounded-2xl border border-white/5 shadow-2xl overflow-hidden">
            
            {/* Card Header */}
            <div className="flex flex-col relative">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-900/40 to-blue-900/40 backdrop-blur-xl z-0 border-b border-white/10" />
              <div className="h-14 px-5 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-md bg-white/10 text-violet-300">
                    <Lock size={16} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-white flex items-center gap-2">
                      Vault AI <span className="text-white/30 text-xs">/</span> Chat
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 text-white/50">
                  <button className="hover:text-white transition-colors"><Search size={16} /></button>
                  <button className="hover:text-white transition-colors"><Maximize2 size={16} /></button>
                  <button className="hover:text-white transition-colors"><MoreHorizontal size={16} /></button>
                </div>
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              
              {/* Timestamp */}
              <div className="flex justify-center">
                <span className="text-xs text-white/30 font-medium tracking-wider uppercase">Today, 10:43 AM</span>
              </div>

              {/* User Message */}
              <div className="flex justify-end group">
                <div className="max-w-[75%] flex gap-3 flex-row-reverse">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-fuchsia-600 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-600/20">
                    <User size={16} className="text-white" />
                  </div>
                  <div className="px-5 py-3 rounded-2xl rounded-tr-sm text-sm text-white shadow-md relative overflow-hidden group-hover:shadow-violet-500/20 transition-shadow"
                    style={{
                      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                    }}
                  >
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Can you summarize the Q3 financial report from my documents and identify the key growth areas?
                  </div>
                </div>
              </div>

              {/* AI Response */}
              <div className="flex justify-start">
                <div className="max-w-[85%] flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#1e293b] border border-white/10 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Bot size={16} className="text-blue-400" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="px-5 py-4 rounded-2xl rounded-tl-sm text-sm text-slate-300 bg-[#1e293b]/80 border border-white/5 shadow-sm leading-relaxed">
                      <p className="mb-3">I've analyzed the <span className="text-violet-400 font-medium">Q3_Financial_Report_Final.pdf</span> from your local vault. Here is a summary of the key findings and growth areas:</p>
                      
                      <p className="mb-2 text-white font-medium">Overview</p>
                      <p className="mb-3">Q3 revenue hit $4.2M, which is a 15% increase quarter-over-quarter. Gross margins improved from 68% to 72% due to optimized cloud infrastructure costs.</p>

                      <p className="mb-2 text-white font-medium">Key Growth Areas</p>
                      <ul className="space-y-2 mb-3 list-disc pl-4 marker:text-violet-500">
                        <li><strong className="text-slate-200">Enterprise Subscriptions:</strong> Up 28% YoY, largely driven by the new compliance features introduced in August.</li>
                        <li><strong className="text-slate-200">API Usage:</strong> Spiked by 42%, correlating with the developer portal launch.</li>
                        <li><strong className="text-slate-200">EMEA Region:</strong> Showed the fastest regional growth at 35%, though still a smaller overall share of revenue.</li>
                      </ul>
                      
                      <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2 text-xs">
                        <span className="text-white/40 flex items-center gap-1"><Zap size={12}/> Generated in 1.2s</span>
                        <span className="text-white/20">•</span>
                        <button className="text-violet-400 hover:text-violet-300 transition-colors">View Source Document</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Input Area */}
            <div className="p-4 bg-[#0f172a]/95 border-t border-white/10">
              <div className="relative flex items-end gap-2 bg-[#1e293b] rounded-xl border border-white/10 focus-within:border-violet-500/50 focus-within:ring-1 focus-within:ring-violet-500/50 transition-all shadow-inner">
                <button className="p-3 text-white/40 hover:text-white transition-colors">
                  <Plus size={20} />
                </button>
                
                <textarea 
                  placeholder="Ask anything about your local files..."
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 py-3.5 focus:outline-none resize-none min-h-[48px] max-h-[120px] custom-scrollbar"
                  rows={1}
                />
                
                <div className="p-2">
                  <button className="p-2 rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-lg shadow-violet-600/30 hover:shadow-violet-600/50 hover:scale-105 transition-all">
                    <Send size={16} className="ml-0.5" />
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center mt-2 px-2">
                <div className="text-[10px] text-white/30 font-medium flex items-center gap-1">
                  <Lock size={10} /> Local Processing Only
                </div>
                <div className="text-[10px] text-white/30">
                  <span className="mr-2">Press ⇧ + ↵ for new line</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.5);
        }
      `}} />
    </div>
  );
}
