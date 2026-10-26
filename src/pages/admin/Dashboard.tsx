import React from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Download, ArrowRight } from 'lucide-react';

export const Dashboard: React.FC = () => {
  return (
    <AdminLayout>
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold tracking-wider uppercase text-purple-400">
            GAMESHELF OPERATIONS
          </span>
          <h1 className="text-3xl font-bold text-white mt-1">Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">
            A clear view of your catalogue, community and the work that needs attention.
          </p>
        </div>

        <button className="inline-flex items-center gap-2 bg-[#1f1833] hover:bg-[#2a2145] text-slate-200 border border-[#342954] text-xs font-medium px-4 py-2 rounded-lg transition shadow-sm">
          <Download className="w-4 h-4" />
          Export snapshot
        </button>
      </div>

      {/* Metrics 4 Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#151024] border border-[#261e3b] p-5 rounded-xl">
          <p className="text-xs text-slate-400 font-medium">Catalogue games</p>
          <h2 className="text-3xl font-bold text-white mt-2">32</h2>
          <p className="text-xs text-slate-500 mt-3">28 published · 3 drafts · 1 archived</p>
        </div>

        <div className="bg-[#151024] border border-[#261e3b] p-5 rounded-xl">
          <p className="text-xs text-slate-400 font-medium">Rating records</p>
          <h2 className="text-3xl font-bold text-white mt-2">2,480</h2>
          <p className="text-xs text-slate-500 mt-3">+312 this month · 12 held for review</p>
        </div>

        <div className="bg-[#151024] border border-[#261e3b] p-5 rounded-xl">
          <p className="text-xs text-slate-400 font-medium">Community reviews</p>
          <h2 className="text-3xl font-bold text-white mt-2">384</h2>
          <p className="text-xs text-slate-500 mt-3">366 published · +54 this month</p>
        </div>

        <div className="bg-[#151024] border border-[#261e3b] p-5 rounded-xl">
          <p className="text-xs text-slate-400 font-medium">Moderation queue</p>
          <h2 className="text-3xl font-bold text-white mt-2">18</h2>
          <p className="text-xs text-slate-500 mt-3">12 pending · 4 flagged · 2 escalated</p>
        </div>
      </div>

      {/* Community Activity Graph Section */}
      <div className="bg-[#151024] border border-[#261e3b] p-6 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Community activity</h3>
            <p className="text-xs text-slate-400 mt-0.5">01–14 Oct 2026 · Daily submissions</p>
          </div>
          <button className="inline-flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 font-medium transition">
            View analytics
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
            Ratings
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            Reviews
          </div>
        </div>

        {/* Custom Curved Smooth Line Chart (SVG) */}
        <div className="w-full pt-4 overflow-hidden">
          <svg className="w-full h-48" viewBox="0 0 1000 200" preserveAspectRatio="none">
            {/* Ambient Background Gradient Glow */}
            <defs>
              <linearGradient id="purpleGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a855f7" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Filled Area below purple curve */}
            <path
              d="M 0 160 Q 250 20 500 120 T 1000 90 L 1000 200 L 0 200 Z"
              fill="url(#purpleGlow)"
            />

            {/* Main Purple Curved Line (Ratings) */}
            <path
              d="M 0 160 Q 250 20 500 120 T 1000 90"
              fill="none"
              stroke="#a855f7"
              strokeWidth="4"
              strokeLinecap="round"
            />

            {/* Secondary Amber Dashed Curved Line (Reviews) */}
            <path
              d="M 0 180 Q 250 70 500 150 T 1000 130"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2.5"
              strokeDasharray="6 6"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
    </AdminLayout>
  );
};