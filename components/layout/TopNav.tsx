import { Search, Bell, Settings, Command } from 'lucide-react';
import Image from 'next/image';

interface TopNavProps {
  title: string;
  tabs?: string[];
  activeTab?: string;
}

export function TopNav({ title, tabs, activeTab }: TopNavProps) {
  return (
    <header className="flex justify-between items-center px-6 h-16 w-full glass-nav sticky top-0 z-40">
      <div className="flex items-center gap-6">
        <h2 className="font-bold text-on-surface hidden md:block">{title}</h2>
        
        {tabs && tabs.length > 0 && (
          <nav className="hidden md:flex items-center gap-6 text-sm ml-4">
            {tabs.map(tab => (
              <button 
                key={tab}
                className={`pb-1 border-b-2 transition-all font-mono tracking-tight ${
                  activeTab === tab 
                    ? 'text-primary border-primary' 
                    : 'text-on-surface-variant border-transparent hover:text-primary'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center bg-surface-container px-3 py-1.5 rounded border border-cyber-border">
          <Search size={14} className="text-on-surface-variant mr-2" />
          <input 
            type="text" 
            placeholder="Search system..." 
            className="bg-transparent border-none text-on-surface font-mono text-[13px] focus:ring-0 p-0 w-48 placeholder-on-surface-variant/50 outline-none" 
          />
          <div className="text-[10px] text-on-surface-variant border border-cyber-border px-1 rounded flex items-center gap-1 bg-surface-dim">
            <Command size={10} />K
          </div>
        </div>
        
        <button className="hidden md:flex text-on-surface-variant hover:text-primary transition-colors">
          <Bell size={18} />
        </button>
        <button className="text-on-surface-variant hover:text-primary transition-colors">
          <Settings size={18} />
        </button>
        
        <div className="h-4 w-px bg-cyber-border mx-2"></div>
        
        <button className="hidden md:block text-on-surface font-mono text-[13px] hover:text-primary transition-colors border border-cyber-border px-3 py-1 rounded">
          System HUD
        </button>
        <button
          className="px-4 py-1.5 rounded-md font-mono text-[13px] font-bold opacity-50 cursor-not-allowed bg-black/40 backdrop-blur-xl border border-white/10 text-on-surface shadow-none"
          disabled
          title="Coming Soon"
        >
          Deploy Agent
        </button>
      </div>
    </header>
  );
}
