import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../../components/admin/AdminLayout';
import {
  DataTable,
  ExportButton,
  FilterSelect,
  MetricCard,
  MetricGrid,
  PageHeading,
  Panel,
  SearchField,
  StatusBadge,
  Tabs,
  WorkspaceFooter,
} from '../../components/admin/AdminLayout';
import type { BadgeTone, Column } from '../../components/admin/AdminLayout';
import { ROLE_LABEL, STATUS_LABEL, getAdminUsers, getErrorMessage, updateAdminUser } from '../../services/Adminservice';
import type { AdminUser, AdminUserList, UserRole, UserStatus } from '../../services/Adminservice';

const PAGE_SIZE = 25;

const statusTone: Record<UserStatus, BadgeTone> = { active: 'success', suspended: 'high', inactive: 'info' };

type TabKey = 'all' | 'regular' | 'moderator' | 'admin';
const tabRole: Record<TabKey, UserRole | null> = { all: null, regular: 'user', moderator: 'moderator', admin: 'admin' };

const ALL_STATUS = 'All statuses';
const ALL_ROLES = 'All roles';

const findByLabel = <K extends string>(labels: Record<K, string>, label: string): K | null =>
  (Object.keys(labels) as K[]).find((k) => labels[k] === label) ?? null;

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtLogin = (iso: string | null) =>
  iso
    ? `${new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} · ${new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
    : 'Never';
const fmtNum = (n: number) => n.toLocaleString('en-US');

const pagerButton =
  'rounded-md border border-[#38363f] px-3 py-1.5 text-[11px] text-[#c2ade7] hover:bg-[#2b2a33] disabled:cursor-not-allowed disabled:opacity-40';

export const UserManagement: React.FC = () => {
  const [tab, setTab] = useState<TabKey>('all');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [status, setStatus] = useState(ALL_STATUS);
  const [role, setRole] = useState(ALL_ROLES);
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [data, setData] = useState<AdminUserList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [busyId, setBusyId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // A tab and the Role dropdown both filter by role, so choosing one resets the other.
  const effectiveRole = tabRole[tab] ?? findByLabel(ROLE_LABEL, role);
  const effectiveStatus = findByLabel(STATUS_LABEL, status);

  // Wait for typing to pause before asking the server.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Aborting in the cleanup means a slow response for an old filter can never
  // overwrite the result of a newer one.
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    getAdminUsers(
      { search: debouncedQuery, role: effectiveRole, status: effectiveStatus, page, page_size: PAGE_SIZE },
      controller.signal,
    )
      .then((res) => setData(res))
      .catch((err) => {
        if (axios.isCancel(err)) return;
        setData(null);
        setError(getErrorMessage(err, 'Unable to load users.'));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [debouncedQuery, effectiveRole, effectiveStatus, page, reloadKey]);

  const changeTab = (next: TabKey) => {
    setTab(next);
    setRole(ALL_ROLES);
    setPage(1);
  };
  const changeRole = (next: string) => {
    setRole(next);
    setTab('all');
    setPage(1);
  };
  const changeStatus = (next: string) => {
    setStatus(next);
    setPage(1);
  };
  const reset = () => {
    setQuery('');
    setDebouncedQuery('');
    setStatus(ALL_STATUS);
    setRole(ALL_ROLES);
    setTab('all');
    setPage(1);
  };

  const toggleActive = async (u: AdminUser) => {
    const verb = u.is_active ? 'Deactivate' : 'Reactivate';
    if (!window.confirm(`${verb} ${u.username}?`)) return;
    setBusyId(u.id);
    setActionError(null);
    setNotice(null);
    try {
      await updateAdminUser(u.id, { is_active: !u.is_active });
      setNotice(`${u.username} ${u.is_active ? 'deactivated' : 'reactivated'} successfully.`);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setActionError(getErrorMessage(err, 'Unable to update this user.'));
    } finally {
      setBusyId(null);
    }
  };

  const counts = data?.counts;
  const placeholder = loading ? 'Loading…' : 'Unavailable';
  const val = (n: number | undefined) => (counts && n !== undefined ? fmtNum(n) : '—');

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'all', label: `All users${counts ? ` (${fmtNum(counts.total)})` : ''}` },
    { key: 'regular', label: `Regular Users${counts ? ` (${fmtNum(counts.regular)})` : ''}` },
    { key: 'moderator', label: `Moderators${counts ? ` (${fmtNum(counts.moderators)})` : ''}` },
    { key: 'admin', label: `Administrators${counts ? ` (${fmtNum(counts.admins)})` : ''}` },
  ];

  const rows = data?.results ?? [];
  const pages = data ? Math.max(Math.ceil(data.count / data.page_size), 1) : 1;
  const from = data && data.count > 0 ? (data.page - 1) * data.page_size + 1 : 0;
  const to = data ? from + rows.length - (rows.length ? 1 : 0) : 0;

  const loggedInContext = useMemo(() => {
    if (!counts) return placeholder;
    if (counts.total === 0) return 'No registered accounts';
    return `${((counts.logged_in_30d / counts.total) * 100).toFixed(1)}% of registered accounts`;
  }, [counts, placeholder]);

  const columns: Column<AdminUser>[] = [
    { header: 'User ID', className: 'text-[#f0eef5]', cell: (u) => `U-${u.id}` },
    {
      header: 'User',
      cell: (u) => (
        <div className="flex items-center gap-[10px]">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#383044] text-[11px] font-semibold text-[#c2ade7]">
            {u.username[0]?.toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-[#f0eef5]">{u.username}</p>
            <p className="truncate text-[10px] text-[#aaa6b5]">{u.note}</p>
          </div>
        </div>
      ),
    },
    { header: 'Email', className: 'text-[#aaa6b5]', cell: (u) => u.email },
    { header: 'Created', className: 'text-[#aaa6b5]', cell: (u) => fmtDate(u.joined) },
    { header: 'Status', cell: (u) => <StatusBadge tone={statusTone[u.status]}>{STATUS_LABEL[u.status]}</StatusBadge> },
    { header: 'Role', className: 'text-[#aaa6b5]', cell: (u) => ROLE_LABEL[u.role] },
    { header: 'Last login', className: 'text-[#aaa6b5] whitespace-nowrap', cell: (u) => fmtLogin(u.last_login) },
    {
      header: 'Actions',
      cell: (u) => (
        <div className="flex items-center gap-3 whitespace-nowrap">
          <Link to={`/admin/roles/${u.id}`} className="text-[#c2ade7] hover:underline" onClick={(e) => e.stopPropagation()}>
            Profile / Role →
          </Link>
          <button
            type="button"
            disabled={u.is_self || busyId === u.id}
            title={u.is_self ? 'You cannot deactivate your own account' : undefined}
            onClick={(e) => {
              e.stopPropagation();
              void toggleActive(u);
            }}
            className="text-[#c2ade7] hover:underline disabled:cursor-not-allowed disabled:opacity-40 disabled:no-underline"
          >
            {busyId === u.id ? 'Saving…' : u.is_active ? 'Deactivate…' : 'Reactivate…'}
          </button>
        </div>
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
        <MetricCard label="Registered accounts" value={val(counts?.total)} context={counts ? 'All account statuses' : placeholder} />
        <MetricCard label="Logged in, last 30 days" value={val(counts?.logged_in_30d)} context={loggedInContext} />
        <MetricCard label="Moderators" value={val(counts?.moderators)} context="Community safety access only" />
        <MetricCard label="Administrators" value={val(counts?.admins)} context="Site-wide operations access" />
      </MetricGrid>

      <Tabs tabs={tabs} active={tab} onChange={changeTab} />

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-3">
          <SearchField value={query} onChange={setQuery} placeholder="Search user ID, username or email…" hint="⌘ K" />
        </div>
        <div className="flex flex-wrap items-center gap-[10px]">
          <FilterSelect label="Status" value={status} onChange={changeStatus} options={[ALL_STATUS, ...Object.values(STATUS_LABEL)]} />
          <FilterSelect label="Role" value={role} onChange={changeRole} options={[ALL_ROLES, ...Object.values(ROLE_LABEL)]} />
          <button type="button" onClick={reset} className="text-xs text-[#c2ade7] hover:underline">
            Reset filters
          </button>
        </div>
      </div>

      {notice && <p role="status" className="text-[11px] text-[#abd2bc]">{notice}</p>}
      {actionError && <p role="alert" className="text-[11px] text-[#edb1b4]">{actionError}</p>}

      {error ? (
        <Panel role="alert" className="flex items-center justify-between gap-4 p-4">
          <p className="text-[12px] text-[#edb1b4]">{error}</p>
          <button type="button" onClick={() => setReloadKey((k) => k + 1)} className={pagerButton}>
            Try again
          </button>
        </Panel>
      ) : !data ? (
        <Panel className="p-6 text-center text-[12px] text-[#76717f]">Loading users…</Panel>
      ) : rows.length === 0 ? (
        <Panel className="p-6 text-center text-[12px] text-[#76717f]">No users found.</Panel>
      ) : (
        <>
          <div
            className={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}
            onClick={(e) => {
              const tr = (e.target as HTMLElement).closest('tr');
              const text = tr?.querySelector('td')?.textContent ?? '';
              const id = Number(text.replace(/^U-/, ''));
              if (Number.isInteger(id) && rows.some((u) => u.id === id)) setSelectedId(id);
            }}
          >
            <DataTable
              columns={columns}
              rows={rows}
              rowKey={(u) => String(u.id)}
              rowClassName={(u) => `cursor-pointer ${u.id === selectedId ? 'bg-[#383044]' : 'hover:bg-[#2b2a33]'}`}
              footerLeft={`Showing ${from}–${to} of ${fmtNum(data.count)} users · ${data.page_size} per page`}
              footerRight={`Page ${data.page} of ${pages}`}
            />
          </div>
          <div className="flex items-center justify-end gap-2">
            <button type="button" className={pagerButton} disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>
              ‹ Previous
            </button>
            <button type="button" className={pagerButton} disabled={page >= pages || loading} onClick={() => setPage((p) => p + 1)}>
              Next ›
            </button>
          </div>
        </>
      )}

      <WorkspaceFooter />
    </AdminLayout>
  );
};