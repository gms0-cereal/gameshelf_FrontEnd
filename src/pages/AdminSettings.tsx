import React from 'react';
import { DashboardLayout } from '../components/layout/Dashboard';

export function AdminSettings() {
  return (
    <DashboardLayout pageTitle="Admin Settings">
      <div className="bg-[#191627] border border-[#2a263d] rounded-xl p-8 text-center text-slate-300">
        <h2 className="text-xl font-bold text-white mb-2">Platform Configurations</h2>
        <p className="text-xs text-slate-400">Adjust system API keys, theme settings, and admin roles.</p>
      </div>
    </DashboardLayout>
  );
}