import React from 'react';
import { Search, Bell, HelpCircle, Menu } from 'lucide-react';

interface HeaderProps {
  onToggleSidebar: () => void;
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  return (
    <header className="h-14 bg-[#191627] border-b border-[#2a263d] px-6 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <button onClick={onToggleSidebar} className="lg:hidden text-slate-400 hover:text-white">
          <Menu className="w-5 h-5" />
        </button>
        <div className="text-xs text-slate-400">
          <span>Admin</span> <span className="mx-1">/</span> <span className="text-slate-200">Dashboard</span>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search admin..."
            className="w-56 bg-[#221e35] border border-[#2d2943] rounded-md pl-8 pr-8 py-1 text-xs text-slate-200 focus:outline-none focus:border-purple-500 placeholder-slate-500"
          />
          <span className="absolute right-2.5 top-1.5 text-[10px] text-slate-500 bg-[#191627] px-1 rounded border border-[#2a263d]">⌘ K</span>
        </div>

        <button className="text-slate-400 hover:text-white p-1">
          <Bell className="w-4 h-4" />
        </button>
        <button className="text-slate-400 hover:text-white p-1">
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};