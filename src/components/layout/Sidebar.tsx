import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Star, 
  ShieldAlert, 
  Tags, 
  Gamepad2, 
  Sparkles, 
  Settings, 
  BarChart3,
  ExternalLink
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { label: 'Audit / Activity Logs', path: '/admin/logs', icon: FileText },
  { label: 'Rating Management', path: '/admin/ratings', icon: Star },
  { label: 'Review Moderation', path: '/admin/moderation', icon: ShieldAlert, badge: '18' },
  { label: 'Genre & Platform Management', path: '/admin/genres', icon: Tags },
  { label: 'Game Management', path: '/admin/games', icon: Gamepad2 },
  { label: 'Recommendation Management', path: '/admin/recommendations', icon: Sparkles },
  { label: 'Website Settings', path: '/admin/settings', icon: Settings },
  { label: 'Reports & Analytics', path: '/admin/reports', icon: BarChart3 },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#191627] text-slate-300 border-r border-[#2a263d] flex flex-col justify-between transform transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div>
          <div className="p-5 flex items-center space-x-2 text-purple-400 font-bold tracking-wider text-base">
            <span>||\ GAMESHELF</span>
          </div>

          <div className="mx-4 mb-4 p-3 rounded-lg bg-[#221e35] border border-[#2d2943]">
            <p className="text-xs font-semibold text-slate-200">Administration</p>
            <p className="text-[10px] text-slate-400 tracking-wider mt-0.5">DEMO WORKSPACE</p>
          </div>

          <div className="px-3">
            <p className="px-3 text-[10px] font-bold text-slate-500 tracking-wider uppercase mb-2">WORKSPACE</p>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/admin'}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-[#5b4396] text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-[#221e35]'
                      }`
                    }
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] bg-purple-900/60 text-purple-200 px-1.5 py-0.5 rounded font-bold">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="p-4 border-t border-[#2a263d] space-y-3">
          <div className="bg-[#221e35] p-3 rounded-lg border border-[#2d2943] text-xs">
            <div className="flex items-center space-x-2 text-emerald-400 font-medium text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>All systems operational</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Last sync 10:30 UTC</p>
          </div>

          <a href="/home" className="flex items-center space-x-2 text-xs text-slate-400 hover:text-white px-1">
            <ExternalLink className="w-3.5 h-3.5" />
            <span>View GameShelf</span>
          </a>

          <div className="flex items-center space-x-2 pt-2 border-t border-[#2a263d] text-xs text-slate-300">
            <div className="w-6 h-6 rounded-full bg-purple-600/30 text-purple-300 flex items-center justify-center font-semibold text-[10px]">
              AC
            </div>
            <span className="text-xs font-medium text-slate-300">Alex Chen</span>
          </div>
        </div>
      </aside>
    </>
  );
};