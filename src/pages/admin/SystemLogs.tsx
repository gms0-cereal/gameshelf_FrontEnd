import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Info, SlidersHorizontal } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import {
  DataTable,
  ExportButton,
  FilterSelect,
  InfoLine,
  MetricCard,
  MetricGrid,
  PageHeading,
  Panel,
  SearchField,
  SecondaryButton,
  SectionHeading,
  StatusBadge,
  Tabs,
  WorkspaceFooter,
} from '../../components/admin/AdminLayout';
import type { BadgeTone, Column } from '../../components/admin/AdminLayout';
import { logs } from './MockData';
import type { Log, LogStatus } from './MockData';

const statusTone: Record<LogStatus, BadgeTone> = { Open: 'medium', Logged: 'info', Success: 'success', Blocked: 'info' };

type TabKey = 'all' | 'staff' | 'security' | 'system';
const tabs: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'All events (214)' },
  { key: 'staff', label: 'Staff actions (56)' },
  { key: 'security', label: 'Security (30)' },
  { key: 'system', label: 'System (128)' },
];

const isSecurity = (l: Log) => l.type.startsWith('auth.') || l.type.startsWith('permission.');
const isStaff = (l: Log) => /\b(AD|MOD)-\d+/.test(l.actor);

const ALL_TYPES = 'All event types';
const ALL_SEVERITIES = 'All severities';
const typePrefixes = ['auth.', 'algorithm.', 'user.', 'permission.', 'report.', 'configuration.', 'sanction.'];

const columns: Column<Log>[] = [
  { header: 'Event type', className: 'text-[#aaa6b5]', cell: (l) => l.type },
  { header: 'Description / record', className: 'text-[#aaa6b5]', cell: (l) => l.description },
  { header: 'Responsible actor', className: 'text-[#aaa6b5]', cell: (l) => l.actor },
  { header: 'Timestamp ↓', className: 'text-[#aaa6b5] whitespace-nowrap', cell: (l) => l.timestamp },
  { header: 'Status', cell: (l) => <StatusBadge tone={statusTone[l.status]}>{l.status}</StatusBadge> },
];

export const SystemLogs: React.FC = () => {
  const [query, setQuery] = useState('');
  const [type, setType] = useState(ALL_TYPES);
  const [severity, setSeverity] = useState(ALL_SEVERITIES);
  const [tab, setTab] = useState<TabKey>('all');
  const [selected, setSelected] = useState<Log>(logs[0]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return logs.filter((l) => {
      if (q && !`${l.id} ${l.type} ${l.description} ${l.actor}`.toLowerCase().includes(q)) return false;
      if (type !== ALL_TYPES && !l.type.startsWith(type)) return false;
      if (severity !== ALL_SEVERITIES && l.severity !== severity) return false;
      if (tab === 'security') return isSecurity(l);
      if (tab === 'staff') return isStaff(l);
      if (tab === 'system') return !isSecurity(l);
      return true;
    });
  }, [query, type, severity, tab]);

  const reset = () => {
    setQuery('');
    setType(ALL_TYPES);
    setSeverity(ALL_SEVERITIES);
    setTab('all');
  };

  return (
    <AdminLayout>
      <PageHeading
        eyebrow="PLATFORM OPERATIONS"
        title="System Logs"
        description="Security audits, staff actions and system errors. All events are append-only and recorded in UTC."
        actions={<ExportButton label="Export audit logs" />}
      />

      <MetricGrid cols={4}>
        <MetricCard label="Events today" value="148" context="02 Nov · Through 10:30 UTC" />
        <MetricCard label="Security events today" value="21" context="Includes 8 failed logins" danger />
        <MetricCard label="Open errors" value="1" context="INC-014 · TF-IDF worker" />
        <MetricCard label="Retention" value="365 days" context="Restricted administrator access" />
      </MetricGrid>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-3">
          <SearchField value={query} onChange={setQuery} placeholder="Search Log ID, event, actor or related record…" hint="⌘ K" />
          <SecondaryButton>
            <SlidersHorizontal className="h-[15px] w-[15px]" />
            More filters
          </SecondaryButton>
        </div>
        <div className="flex flex-wrap items-center gap-[10px]">
          <FilterSelect label="Event type" value={type} onChange={setType} options={[ALL_TYPES, ...typePrefixes]} />
          <FilterSelect label="Severity" value={severity} onChange={setSeverity} options={[ALL_SEVERITIES, 'Error', 'Warning', 'Info']} />
          <SecondaryButton>01–02 Nov 2026 ⌄</SecondaryButton>
          <SecondaryButton>All actors ⌄</SecondaryButton>
          <button type="button" onClick={reset} className="text-xs text-[#c2ade7] hover:underline">
            Reset filters
          </button>
        </div>
      </div>

      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      <div
        onClick={(e) => {
          const cells = (e.target as HTMLElement).closest('tr')?.querySelectorAll('td');
          const type = cells?.[0]?.textContent;
          const desc = cells?.[1]?.textContent;
          const hit = logs.find((l) => l.type === type && l.description === desc);
          if (hit) setSelected(hit);
        }}
      >
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(l) => l.id}
          rowClassName={(l) => `cursor-pointer ${l.id === selected.id ? 'bg-[#383044]' : 'hover:bg-[#2b2a33]'}`}
          footerLeft={`Showing 1–${rows.length} of 214 events · 01–02 Nov · Related-record context`}
          footerRight={'‹ Previous   1   2   3   Next ›'}
        />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
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
          <InfoLine label="Related records">{selected.related ?? selected.description}</InfoLine>
          <InfoLine label="Actor / source">{selected.source ?? selected.actor}</InfoLine>
          <InfoLine label="Recorded at">{selected.timestamp.replace(' ·', ' 2026,')} UTC</InfoLine>
          <InfoLine label="Outcome">{selected.outcome ?? 'Event retained in immutable audit history'}</InfoLine>
        </Panel>

        <Panel className="flex flex-col gap-4 p-5">
          <SectionHeading title="Security & audit controls" subtitle="Sanitized, immutable records" />
          <p className="text-xs leading-normal text-[#aaa6b5]">
            Role-change event EV-0908 retains before/after roles, actor and authorization AR-0041. Exports exclude credentials and private player content.
          </p>
          <div className="flex flex-wrap gap-[10px]">
            <Link to="/admin/algorithms/MR-0412">
              <SecondaryButton>Execution Details →</SecondaryButton>
            </Link>
            <Link to="/admin/health">
              <SecondaryButton>Incident INC-014 →</SecondaryButton>
            </Link>
          </div>
          <div className="flex items-center gap-[10px] rounded-md bg-[#1a1a20] p-[14px]">
            <Info className="h-[18px] w-[18px] shrink-0 text-[#dfc192]" />
            <p className="flex-1 text-xs leading-normal text-[#aaa6b5]">Acknowledging an incident appends an event; it does not remove the original error.</p>
          </div>
        </Panel>
      </div>

      <WorkspaceFooter />
    </AdminLayout>
  );
};