import React from 'react';
import { Sidebar } from './Sidebar';
import { useLocation } from 'react-router-dom';
import { Search, Bell, HelpCircle, Menu } from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const location = useLocation();
  const pageTitle = location.pathname.includes('/analytics') ? 'Platform Analytics' : location.pathname.includes('/logs') ? 'System Logs' : location.pathname.includes('/games') ? 'Catalogue Games' : 'Dashboard';
  return (
    <div className="min-h-screen bg-[#141417] text-slate-100 font-sans flex">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-14 border-b border-[#33333b] bg-[#141417] px-6 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <button className="p-1.5 hover:bg-[#383044] rounded-lg text-slate-300 transition lg:hidden">
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs">
              <span>Admin</span>
              <span>/</span>
              <span className="text-white font-medium">{pageTitle}</span>
            </div>
          </div>

          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search admin..."
              className="w-full bg-[#1a1a20] text-xs text-slate-200 pl-9 pr-12 py-2 rounded-lg border border-[#454650] focus:outline-none focus:border-[#bda6e4] transition"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 bg-[#222228] text-[10px] text-slate-400 px-1.5 py-0.5 rounded border border-[#454650]">
              ⌘K
            </kbd>
          </div>

          <div className="flex items-center gap-2 text-slate-400">
            <button className="p-2 hover:bg-[#383044] hover:text-white rounded-lg transition">
              <Bell className="w-4 h-4" />
            </button>
            <button className="p-2 hover:bg-[#383044] hover:text-white rounded-lg transition">
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="p-8 flex-1 overflow-y-auto max-w-[1600px] w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
};