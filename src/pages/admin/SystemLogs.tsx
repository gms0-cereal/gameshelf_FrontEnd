import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  DataTable,
  FilterSelect,
  InfoLine,
  MetricCard,
  MetricGrid,
  PageHeading,
  Panel,
  SearchField,
  SectionHeading,
  StatusBadge,
  Tabs,
  WorkspaceFooter,
} from '../../components/admin/AdminLayout';
import { AdminLayout } from '../../components/admin/AdminLayout';
import type { BadgeTone, Column } from '../../components/admin/AdminLayout';
import { getAdminLogs, getErrorMessage } from '../../services/Adminservice';
import type { AdminLog, AdminLogList, LogSeverity, LogTab } from '../../services/Adminservice';

const PAGE_SIZE = 25;

const severityTone: Record<LogSeverity, BadgeTone> = { Info: 'info', Warning: 'medium', Error: 'high' };

const tabs: { key: LogTab; label: string }[] = [
  { key: 'all', label: 'All events' },
  { key: 'staff', label: 'Staff actions' },
  { key: 'security', label: 'Security' },
];

const ALL_TYPES = 'All event types';
const ALL_SEVERITIES = 'All severities';
const typePrefixes = ['auth.', 'permission.', 'users.', 'settings.', 'moderation.'];

const fmtNum = (n: number) => n.toLocaleString('en-US');
const fmtStamp = (iso: string) =>
  `${new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', timeZone: 'UTC' })} · ${new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })} UTC`;

const pagerButton =
  'rounded-md border border-[#38363f] px-3 py-1.5 text-[11px] text-[#c2ade7] hover:bg-[#2b2a33] disabled:cursor-not-allowed disabled:opacity-40';

const columns: Column<AdminLog>[] = [
  { header: 'Log ID', className: 'text-[#f0eef5] whitespace-nowrap', cell: (l) => l.id },
  { header: 'Event type', className: 'text-[#aaa6b5]', cell: (l) => l.type },
  { header: 'Description / record', className: 'text-[#aaa6b5]', cell: (l) => l.description },
  { header: 'Responsible actor', className: 'text-[#aaa6b5]', cell: (l) => l.actor },
  { header: 'Timestamp ↓', className: 'text-[#aaa6b5] whitespace-nowrap', cell: (l) => fmtStamp(l.timestamp) },
  { header: 'Severity', cell: (l) => <StatusBadge tone={severityTone[l.severity]}>{l.severity}</StatusBadge> },
];

export const SystemLogs: React.FC = () => {
  const [tab, setTab] = useState<LogTab>('all');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [type, setType] = useState(ALL_TYPES);
  const [severity, setSeverity] = useState(ALL_SEVERITIES);
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [data, setData] = useState<AdminLogList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    getAdminLogs(
      {
        tab,
        search: debouncedQuery,
        type: type === ALL_TYPES ? undefined : type,
        severity: severity === ALL_SEVERITIES ? null : (severity as LogSeverity),
        page,
        page_size: PAGE_SIZE,
      },
      controller.signal,
    )
      .then((res) => setData(res))
      .catch((err) => {
        if (axios.isCancel(err)) return;
        setData(null);
        setError(getErrorMessage(err, 'Unable to load logs.'));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [tab, debouncedQuery, type, severity, page, reloadKey]);

  const reset = () => {
    setQuery('');
    setDebouncedQuery('');
    setType(ALL_TYPES);
    setSeverity(ALL_SEVERITIES);
    setTab('all');
    setPage(1);
  };

  const rows = data?.results ?? [];
  const selected = rows.find((l) => l.id === selectedId) ?? rows[0] ?? null;
  const pages = data ? Math.max(Math.ceil(data.count / data.page_size), 1) : 1;
  const from = data && data.count > 0 ? (data.page - 1) * data.page_size + 1 : 0;
  const to = data ? from + rows.length - (rows.length ? 1 : 0) : 0;

  const summary = data?.summary;
  const placeholder = loading ? 'Loading…' : 'Unavailable';
  const val = (n: number | undefined) => (summary && n !== undefined ? fmtNum(n) : '—');

  return (
    <AdminLayout>
      <PageHeading
        eyebrow="PLATFORM OPERATIONS"
        title="System Logs"
        description="Administrator and moderator actions plus security events, newest first. Times are shown in UTC."
      />

      <MetricGrid cols={4}>
        <MetricCard label="Events today" value={val(summary?.events_today)} context={summary ? 'Staff actions and security events' : placeholder} />
        <MetricCard
          label="Security events today"
          value={val(summary?.security_today)}
          context={summary ? `Includes ${fmtNum(summary.failed_logins_today)} failed login${summary.failed_logins_today === 1 ? '' : 's'}` : placeholder}
          danger
        />
        <MetricCard label="Staff actions today" value={val(summary?.staff_today)} context={summary ? 'Admin and moderation actions' : placeholder} />
        <MetricCard label="Recorded events" value={val(summary?.total)} context={summary ? 'All time' : placeholder} />
      </MetricGrid>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-3">
          <SearchField value={query} onChange={setQuery} placeholder="Search log ID, event, actor or record…" hint="⌘ K" />
        </div>
        <div className="flex flex-wrap items-center gap-[10px]">
          <FilterSelect
            label="Event type"
            value={type}
            onChange={(v) => {
              setType(v);
              setPage(1);
            }}
            options={[ALL_TYPES, ...typePrefixes]}
          />
          <FilterSelect
            label="Severity"
            value={severity}
            onChange={(v) => {
              setSeverity(v);
              setPage(1);
            }}
            options={[ALL_SEVERITIES, 'Info', 'Warning', 'Error']}
          />
          <button type="button" onClick={reset} className="text-xs text-[#c2ade7] hover:underline">
            Reset filters
          </button>
        </div>
      </div>

      <Tabs
        tabs={tabs}
        active={tab}
        onChange={(t) => {
          setTab(t);
          setPage(1);
        }}
      />

      {error ? (
        <Panel role="alert" className="flex items-center justify-between gap-4 p-4">
          <p className="text-[12px] text-[#edb1b4]">{error}</p>
          <button type="button" onClick={() => setReloadKey((k) => k + 1)} className={pagerButton}>
            Try again
          </button>
        </Panel>
      ) : !data ? (
        <Panel className="p-6 text-center text-[12px] text-[#76717f]">Loading logs…</Panel>
      ) : rows.length === 0 ? (
        <Panel className="p-6 text-center text-[12px] text-[#76717f]">No activity recorded.</Panel>
      ) : (
        <>
          <div
            className={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}
            onClick={(e) => {
              const id = (e.target as HTMLElement).closest('tr')?.querySelector('td')?.textContent;
              if (id && rows.some((l) => l.id === id)) setSelectedId(id);
            }}
          >
            <DataTable
              columns={columns}
              rows={rows}
              rowKey={(l) => l.id}
              rowClassName={(l) => `cursor-pointer ${l.id === selected?.id ? 'bg-[#383044]' : 'hover:bg-[#2b2a33]'}`}
              footerLeft={`Showing ${from}–${to} of ${fmtNum(data.count)} events · ${data.page_size} per page`}
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

      {selected && (
        <Panel className="flex flex-col gap-4 p-5">
          <SectionHeading
            title={`Selected log · ${selected.id}`}
            subtitle={selected.type}
            action={
              <button type="button" onClick={() => navigator.clipboard?.writeText(selected.id)} className="hover:underline">
                Copy Log ID
              </button>
            }
          />
          <InfoLine label="Related record">{selected.related ?? selected.description}</InfoLine>
          <InfoLine label="Actor / source">{`${selected.actor}${selected.source ? ` · ${selected.source}` : ''}`}</InfoLine>
          <InfoLine label="Recorded at">{fmtStamp(selected.timestamp)}</InfoLine>
          <InfoLine label="Details">{selected.outcome ?? 'No additional details recorded'}</InfoLine>
        </Panel>
      )}

      <WorkspaceFooter />
    </AdminLayout>
  );
};