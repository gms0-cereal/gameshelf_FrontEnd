import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Gamepad2, 
  Users, 
  ShieldAlert, 
  Settings, 
  LogOut 
} from 'lucide-react';

const menuItems = [
  { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { name: 'Catalogue Games', path: '/admin/games', icon: Gamepad2 },
  { name: 'Users & Roles', path: '/admin/users', icon: Users },
  { name: 'Moderation Queue', path: '/admin/moderation', icon: ShieldAlert },
  { name: 'Settings', path: '/admin/settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-[#120e21] border-r border-[#251f35] min-h-screen flex flex-col justify-between p-4">
      <div>
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-3 py-4 mb-4 border-b border-[#251f35]">
          <div className="p-2 bg-purple-600/20 text-purple-400 rounded-lg border border-purple-500/30">
            <Gamepad2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-white text-base leading-tight">GameShelf</h2>
            <span className="text-[10px] uppercase font-semibold text-purple-400 tracking-wider">Admin Suite</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                      : 'text-slate-400 hover:text-white hover:bg-[#1f1a30]'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Admin Account / Logout Footer */}
      <div className="pt-4 border-t border-[#251f35]">
        <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors">
          <LogOut className="w-4 h-4" />
          Log Out
        </button>
      </div>
    </aside>
  );
};