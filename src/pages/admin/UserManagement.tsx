import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { SlidersHorizontal } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import {
  DataTable,
  ExportButton,
  FilterSelect,
  MetricCard,
  MetricGrid,
  PageHeading,
  SearchField,
  SecondaryButton,
  StatusBadge,
  Tabs,
  WorkspaceFooter,
} from '../../components/admin/AdminLayout';
import type { BadgeTone, Column } from '../../components/admin/AdminLayout';
import { users } from './MockData';
import type { Role, Status, UserRow } from './MockData';

const statusTone: Record<Status, BadgeTone> = { Active: 'success', Suspended: 'high', Inactive: 'info' };

type TabKey = 'all' | 'regular' | 'moderator' | 'admin';
const tabs: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'All users (12,840)' },
  { key: 'regular', label: 'Regular Users' },
  { key: 'moderator', label: 'Moderators (12)' },
  { key: 'admin', label: 'Administrators (3)' },
];
const tabRole: Record<TabKey, Role | null> = { all: null, regular: 'Regular User', moderator: 'Moderator', admin: 'Administrator' };

const ALL_STATUS = 'All statuses';
const ALL_ROLES = 'All roles';

export const UserManagement: React.FC = () => {
  const [tab, setTab] = useState<TabKey>('all');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState(ALL_STATUS);
  const [role, setRole] = useState(ALL_ROLES);
  const [selectedId, setSelectedId] = useState('U-1140');

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      if (tabRole[tab] && u.role !== tabRole[tab]) return false;
      if (status !== ALL_STATUS && u.status !== status) return false;
      if (role !== ALL_ROLES && u.role !== role) return false;
      return !q || `${u.id} ${u.username} ${u.email}`.toLowerCase().includes(q);
    });
  }, [tab, query, status, role]);

  const reset = () => {
    setQuery('');
    setStatus(ALL_STATUS);
    setRole(ALL_ROLES);
    setTab('all');
  };

  const columns: Column<UserRow>[] = [
    { header: 'User ID', className: 'text-[#f0eef5]', cell: (u) => u.id },
    {
      header: 'User',
      cell: (u) => (
        <div className="flex items-center gap-[10px]">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#383044] text-[11px] font-semibold text-[#c2ade7]">
            {u.username[0]}
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-[#f0eef5]">{u.username}</p>
            <p className="truncate text-[10px] text-[#aaa6b5]">{u.note}</p>
          </div>
        </div>
      ),
    },
    { header: 'Email', className: 'text-[#aaa6b5]', cell: (u) => u.email },
    { header: 'Created', className: 'text-[#aaa6b5]', cell: (u) => u.created },
    { header: 'Status', cell: (u) => <StatusBadge tone={statusTone[u.status]}>{u.status}</StatusBadge> },
    { header: 'Role', className: 'text-[#aaa6b5]', cell: (u) => u.role },
    { header: 'Last activity ↓', className: 'text-[#aaa6b5] whitespace-nowrap', cell: (u) => u.lastActivity },
    {
      header: 'Actions',
      cell: (u) => (
        <Link to={`/admin/roles/${u.id}`} className="whitespace-nowrap text-[#c2ade7] hover:underline" onClick={(e) => e.stopPropagation()}>
          {u.action}
        </Link>
      ),
    },
  ];

  return (
    <AdminLayout>
      <PageHeading
        eyebrow="PLATFORM OPERATIONS"
        title="User Management"
        description="Find accounts, inspect access and manage lifecycle changes with a clear audit trail."
        actions={<ExportButton label="Export users" />}
      />

      <MetricGrid cols={4}>
        <MetricCard label="Registered accounts" value="12,840" context="All account statuses" />
        <MetricCard label="Active in 30 days" value="8,760" context="68.2% of registered accounts" />
        <MetricCard label="Moderators" value="12" context="Community safety access only" />
        <MetricCard label="Administrators" value="3" context="Site-wide operations access" />
      </MetricGrid>

      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-3">
          <SearchField value={query} onChange={setQuery} placeholder="Search user ID, username or email…" hint="⌘ K" />
          <SecondaryButton>
            <SlidersHorizontal className="h-[15px] w-[15px]" />
            More filters
          </SecondaryButton>
        </div>
        <div className="flex flex-wrap items-center gap-[10px]">
          <FilterSelect label="Status" value={status} onChange={setStatus} options={[ALL_STATUS, 'Active', 'Suspended', 'Inactive']} />
          <FilterSelect label="Role" value={role} onChange={setRole} options={[ALL_ROLES, 'Regular User', 'Moderator', 'Administrator']} />
          <SecondaryButton>Created: Any date ⌄</SecondaryButton>
          <SecondaryButton>Activity: Last 30 days ⌄</SecondaryButton>
          <button type="button" onClick={reset} className="text-xs text-[#c2ade7] hover:underline">
            Reset filters
          </button>
        </div>
      </div>

      <div
        onClick={(e) => {
          const tr = (e.target as HTMLElement).closest('tr');
          const id = tr?.querySelector('td')?.textContent;
          if (id && users.some((u) => u.id === id)) setSelectedId(id);
        }}
      >
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(u) => u.id}
          rowClassName={(u) => `cursor-pointer ${u.id === selectedId ? 'bg-[#383044]' : 'hover:bg-[#2b2a33]'}`}
          footerLeft={`Showing 1–${rows.length} of 12,840 users · 25 per page`}
          footerRight={'‹ Previous   1   2   3   Next ›'}
        />
      </div>

      <WorkspaceFooter />
    </AdminLayout>
  );
};