import React, { useState, useMemo } from 'react';
import { DashboardLayout } from '../components/layout/Dashboard';
import { 
  Gamepad2, 
  Star, 
  MessageSquare, 
  ShieldAlert, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  Plus,
  Trash2,
  Edit,
  X,
  TrendingUp
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

// Data for Spline Chart
const ANALYTICS_DATA = [
  { month: 'Jan', ratings: 1200, reviews: 180 },
  { month: 'Feb', ratings: 1900, reviews: 240 },
  { month: 'Mar', ratings: 1600, reviews: 200 },
  { month: 'Apr', ratings: 2200, reviews: 310 },
  { month: 'May', ratings: 2800, reviews: 420 },
  { month: 'Jun', ratings: 2480, reviews: 384 },
];

interface ActivityLog {
  id: string;
  gameTitle: string;
  action: string;
  admin: string;
  date: string;
  status: 'Published' | 'Draft' | 'Archived';
}

const MOCK_LOGS: ActivityLog[] = [
  { id: '1', gameTitle: 'Elden Ring: Shadow of the Erdtree', action: 'Catalogue Update', admin: 'Admin_Alex', date: 'Oct 24, 2026', status: 'Published' },
  { id: '2', gameTitle: 'Cyberpunk 2077: Phantom Liberty', action: 'Price Revision', admin: 'Admin_Sarah', date: 'Oct 23, 2026', status: 'Published' },
  { id: '3', gameTitle: 'Hollow Knight: Silksong', action: 'Metadata Draft', admin: 'Admin_Alex', date: 'Oct 22, 2026', status: 'Draft' },
  { id: '4', gameTitle: 'Starfield Expansion', action: 'Archived Listing', admin: 'Admin_Mike', date: 'Oct 20, 2026', status: 'Archived' },
  { id: '5', gameTitle: 'Hades II', action: 'Catalogue Update', admin: 'Admin_Sarah', date: 'Oct 19, 2026', status: 'Published' },
  { id: '6', gameTitle: 'Black Myth: Wukong', action: 'Review Moderation', admin: 'Admin_Alex', date: 'Oct 18, 2026', status: 'Published' },
];

export function AdminOverview() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const itemsPerPage = 4;

  const filteredLogs = useMemo(() => {
    return MOCK_LOGS.filter((log) => {
      const matchesSearch = log.gameTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            log.admin.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || log.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(start, start + itemsPerPage);
  }, [filteredLogs, currentPage]);

  return (
    <DashboardLayout pageTitle="Overview">
      <div className="space-y-6">
        
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#191627] border border-[#2a263d] rounded-xl p-5 space-y-2">
            <div className="flex items-center justify-between text-purple-400">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Catalogue Games</span>
              <Gamepad2 className="w-5 h-5" />
            </div>
            <p className="text-3xl font-bold text-white">32</p>
            <p className="text-xs text-slate-400">28 Published · 3 Drafts · 1 Archived</p>
          </div>

          <div className="bg-[#191627] border border-[#2a263d] rounded-xl p-5 space-y-2">
            <div className="flex items-center justify-between text-amber-400">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Rating Records</span>
              <Star className="w-5 h-5" />
            </div>
            <p className="text-3xl font-bold text-white">2,480</p>
            <p className="text-xs text-emerald-400">↑ 12% from last month</p>
          </div>

          <div className="bg-[#191627] border border-[#2a263d] rounded-xl p-5 space-y-2">
            <div className="flex items-center justify-between text-blue-400">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Community Reviews</span>
              <MessageSquare className="w-5 h-5" />
            </div>
            <p className="text-3xl font-bold text-white">384</p>
            <p className="text-xs text-slate-400">94.2% positive sentiment</p>
          </div>

          <div className="bg-[#191627] border border-[#2a263d] rounded-xl p-5 space-y-2">
            <div className="flex items-center justify-between text-rose-400">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Moderation Queue</span>
              <ShieldAlert className="w-5 h-5" />
            </div>
            <p className="text-3xl font-bold text-white">18</p>
            <p className="text-xs text-rose-400">Requires immediate action</p>
          </div>
        </div>

        {/* Spline Chart Analytics Card */}
        <div className="bg-[#191627] border border-[#2a263d] rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                Ratings & Engagement Analytics
              </h3>
              <p className="text-xs text-slate-400">Monthly user rating submissions and activity trends</p>
            </div>
            <span className="text-xs font-medium text-purple-400 bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-full">
              2026 Trend
            </span>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ANALYTICS_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  {/* Purple Spline Gradient */}
                  <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a263d" vertical={false} />
                <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#64748b" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#13111c',
                    borderColor: '#2a263d',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
                {/* type="monotone" makes it a Spline Curve */}
                <Area
                  type="monotone"
                  dataKey="ratings"
                  stroke="#a855f7"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#purpleGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Table Controls & Search Section */}
        <div className="bg-[#191627] border border-[#2a263d] rounded-xl p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white">Recent System Activity</h3>
              <p className="text-xs text-slate-400">Audit trail of game catalog modifications</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-[#13111c] border border-[#2a263d] rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500 w-48 md:w-64"
                />
              </div>

              <div className="flex items-center gap-2 bg-[#13111c] border border-[#2a263d] rounded-lg px-3 py-2">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="All" className="bg-[#191627]">All Status</option>
                  <option value="Published" className="bg-[#191627]">Published</option>
                  <option value="Draft" className="bg-[#191627]">Draft</option>
                  <option value="Archived" className="bg-[#191627]">Archived</option>
                </select>
              </div>

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Entry
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-[#2a263d] rounded-lg">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#13111c] text-slate-400 uppercase tracking-wider text-[11px] border-b border-[#2a263d]">
                <tr>
                  <th className="px-4 py-3">Game Title</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Admin</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a263d]">
                {paginatedLogs.length > 0 ? (
                  paginatedLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#201c33] transition-colors">
                      <td className="px-4 py-3.5 font-medium text-white">{log.gameTitle}</td>
                      <td className="px-4 py-3.5">{log.action}</td>
                      <td className="px-4 py-3.5">{log.admin}</td>
                      <td className="px-4 py-3.5 text-slate-400">{log.date}</td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                          log.status === 'Published' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          log.status === 'Draft' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right space-x-2">
                        <button className="text-slate-400 hover:text-purple-400 transition-colors p-1">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button className="text-slate-400 hover:text-rose-400 transition-colors p-1">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      No matching activity logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-400">
              Showing page {currentPage} of {totalPages} ({filteredLogs.length} results)
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-[#2a263d] bg-[#13111c] text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#201c33]"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-[#2a263d] bg-[#13111c] text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#201c33]"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Modal Form */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#191627] border border-[#2a263d] rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#2a263d] pb-3">
              <h3 className="text-base font-bold text-white">Add New Log Entry</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); setIsAddModalOpen(false); }} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Game Title</label>
                <input type="text" required placeholder="e.g. GTA VI" className="w-full bg-[#13111c] border border-[#2a263d] rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-purple-500" />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Action Performed</label>
                <input type="text" required placeholder="e.g. Added to Catalogue" className="w-full bg-[#13111c] border border-[#2a263d] rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-purple-500" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 bg-[#13111c] border border-[#2a263d] text-slate-300 py-2.5 rounded-lg font-semibold hover:bg-[#201c33]">Cancel</button>
                <button type="submit" className="flex-1 bg-purple-600 text-white py-2.5 rounded-lg font-semibold hover:bg-purple-500">Save Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}