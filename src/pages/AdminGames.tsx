import React from 'react';
import { DashboardLayout } from '../components/layout/Dashboard';

export function AdminGames() {
  return (
    <DashboardLayout pageTitle="Games Management">
      <div className="bg-[#191627] border border-[#2a263d] rounded-xl p-8 text-center text-slate-300">
        <h2 className="text-xl font-bold text-white mb-2">Games Catalogue</h2>
        <p className="text-xs text-slate-400">Manage all registered games, metadata, and draft publications.</p>
      </div>
    </DashboardLayout>
  );
}