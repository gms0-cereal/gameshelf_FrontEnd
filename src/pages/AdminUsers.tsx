import React from 'react';
import { DashboardLayout } from '../components/layout/Dashboard';

export function AdminUsers() {
  return (
    <DashboardLayout pageTitle="Users Management">
      <div className="bg-[#191627] border border-[#2a263d] rounded-xl p-8 text-center text-slate-300">
        <h2 className="text-xl font-bold text-white mb-2">User Accounts</h2>
        <p className="text-xs text-slate-400">View registered members, user permissions, and ban list.</p>
      </div>
    </DashboardLayout>
  );
}