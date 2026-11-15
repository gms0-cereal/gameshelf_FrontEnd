import React, { useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { ExportButton, MetricCard, MetricGrid, PageHeading, Panel, SectionHeading, WorkspaceFooter } from '../../components/admin/AdminLayout';
import { downloadDashboardExport, getAdminLogs, getDashboardFull, getErrorMessage } from '../../services/Adminservice';
import type { DashboardFull, IntervalOption } from '../../services/Adminservice';

/* ---------------- Chart helpers ---------------- */
const PURPLE = '#c2ade7';
const AMBER = '#dfc192';
const GRID = '#38363f';
const axisTick = { fill: '#76717f', fontSize: 10 };
const tooltipStyle = { background: '#1a1a20', border: '1px solid #38363f', borderRadius: 6, fontSize: 11 };
const compact = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1).replace(/\.0$/, '')}k` : String(v));

/* ---------------- Formatting helpers ---------------- */
// Parse only the YYYY-MM-DD part so a timezone offset can never shift the day.
const toDay = (iso: string) => new Date(`${iso.slice(0, 10)}T00:00:00`);
const fmtDay = (iso: string) => toDay(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
const fmtFull = (iso: string) => toDay(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtTimeUtc = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
const fmtStamp = (iso: string) =>
  `${new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', timeZone: 'UTC' })} · ${fmtTimeUtc(iso)} UTC`;
const fmtNum = (n: number) => n.toLocaleString('en-US');
const fmtAgo = (iso: string) => {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  return fmtFull(iso);
};

type ChartStatus = 'loading' | 'error' | 'empty' | 'ready';

const ChartCard: React.FC<{
  title: string;
  subtitle: string;
  range: string;
  legend: React.ReactNode;
  status: ChartStatus;
  message?: string;
  children: React.ReactElement;
}> = ({ title, subtitle, range, legend, status, message, children }) => (
  <Panel className="flex min-w-0 flex-1 flex-col gap-4 p-5">
    <SectionHeading title={title} subtitle={subtitle} action={range} />
    <p className="text-[10px]">{legend}</p>
    <div className="h-[200px]">
      {status === 'ready' ? (
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      ) : (
        <div className="flex h-full items-center justify-center px-6 text-center text-[11px] text-[#76717f]">{message}</div>
      )}
    </div>
  </Panel>
);

export const Dashboard: React.FC = () => {
  const [interval, setIntervalOption] = useState<IntervalOption>('daily');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // React Query owns fetching, caching and de-duplication. The query key contains the
  // interval, so a slow response for an old selection can never overwrite a newer one.
  // keepPreviousData keeps the last result on screen while a new interval loads.
  const query = useQuery<DashboardFull>({
    queryKey: ['dashboard-full', interval],
    queryFn: () => getDashboardFull(interval),
    placeholderData: keepPreviousData,
    retry: false,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
  const recent = useQuery({
    queryKey: ['dashboard-recent-activity'],
    queryFn: () => getAdminLogs({ page_size: 6 }),
    retry: false,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const data = query.data ?? null;
  const loading = query.isPending;
  const error = query.error ? getErrorMessage(query.error) : null;
  const ready = data !== null;
  const shown = data?.reporting.interval ?? interval;
  const intervalLabel = shown === 'daily' ? 'Daily' : 'Weekly';

  const chartState = (points: unknown[] | undefined, emptyMessage = 'No data for this period.') => {
    if (loading) return { status: 'loading' as ChartStatus, message: 'Loading…' };
    if (!data) return { status: 'error' as ChartStatus, message: 'Unable to load data.' };
    if (!points || points.length === 0) return { status: 'empty' as ChartStatus, message: emptyMessage };
    return { status: 'ready' as ChartStatus, message: undefined };
  };

  /* ---------- Chart data (straight from the API, chronological) ---------- */
  const userViews = useMemo(() => {
    if (!data) return [];
    const { points, baseline } = data.charts.user_views;
    return points.map((p) => ({ date: p.date, users: baseline + (p.cumulative ?? 0) }));
  }, [data]);

  // A date present in only one series legitimately has 0 for the other.
const operations = useMemo(() => {
  const staff = data?.charts.operations?.staff;
  const security = data?.charts.operations?.security;
  if (!staff || !security) return [];
  const merged = new Map<string, { date: string; staff: number; security: number }>();
  staff.forEach((p) => merged.set(p.date.slice(0, 10), { date: p.date, staff: p.value, security: 0 }));
  security.forEach((p) => {
    const key = p.date.slice(0, 10);
    const existing = merged.get(key);
    if (existing) existing.security = p.value;
    else merged.set(key, { date: p.date, staff: 0, security: p.value });
  });
  return [...merged.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, row]) => row);
}, [data]);

  const submissions = useMemo(() => {
    if (!data) return [];
    const { ratings, reviews } = data.charts.community_submissions;
    const merged = new Map<string, { date: string; ratings: number; reviews: number }>();
    ratings.forEach((p) => merged.set(p.date.slice(0, 10), { date: p.date, ratings: p.value, reviews: 0 }));
    reviews.forEach((p) => {
      const key = p.date.slice(0, 10);
      const existing = merged.get(key);
      if (existing) existing.reviews = p.value;
      else merged.set(key, { date: p.date, ratings: 0, reviews: p.value });
    });
    return [...merged.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, row]) => row);
  }, [data]);

  const ratingsTotal = submissions.reduce((sum, r) => sum + r.ratings, 0);
  const reviewsTotal = submissions.reduce((sum, r) => sum + r.reviews, 0);

  /* ---------- Header text ---------- */
  const periodText = data ? `${fmtDay(data.reporting.date_from)}–${fmtFull(data.reporting.date_to)}` : '—';
  const snapshotText = data ? `Snapshot at ${fmtTimeUtc(data.snapshot.generated_at)} UTC` : '';

  /* ---------- Summary cards ---------- */
  const placeholder = loading ? 'Loading…' : 'Unavailable';
  const registered = data?.summary.registered_users;
  const registeredContext = (() => {
    if (!ready || !registered) return placeholder;
    const parts = [`+${fmtNum(registered.new)}`];
    if (registered.change_percent !== null) {
      const pct = Number(registered.change_percent);
      parts.push(`${pct >= 0 ? '+' : ''}${pct}%`);
    }
    return `${parts.join(' · ')} this period`;
  })();

  const mod = data?.charts.moderation;
  const cat = data?.charts.catalogue;
  const genres = data?.charts.genres ?? [];
  const accounts = data?.charts.accounts;
  const ops = data?.charts.operations;

  const gamesContext = (() => {
    if (!ready || !cat) return placeholder;
    const parts = [`+${fmtNum(cat.new)} added this period`];
    if (genres.length > 0) parts.push(`top genre ${genres[0].name}`);
    return parts.join(' · ');
  })();

  const accountRows = accounts
    ? [
        { label: 'Verified email', count: accounts.verified },
        { label: 'Unverified email', count: accounts.unverified },
        { label: 'Active accounts', count: accounts.active },
        { label: 'Suspended', count: accounts.suspended },
        { label: 'Deactivated', count: accounts.inactive },
      ]
    : [];

  /* ---------- Export ---------- */
  const handleExport = async () => {
    if (!data || exporting) return;
    setExporting(true);
    setExportError(null);
    try {
      await downloadDashboardExport({
        interval,
        date_from: data.reporting.date_from.slice(0, 10),
        date_to: data.reporting.date_to.slice(0, 10),
      });
    } catch (err) {
      setExportError(getErrorMessage(err, 'Unable to export the snapshot.'));
    } finally {
      setExporting(false);
    }
  };

  const tooltipLabel = (label: unknown) =>
    shown === 'weekly' ? `Week of ${fmtFull(String(label))}` : fmtFull(String(label));

  const recentRows = recent.data?.results ?? [];

  return (
    <AdminLayout>
      <PageHeading
        eyebrow="PLATFORM OPERATIONS"
        title="Administrator Overview"
        description="Community growth, platform reliability and the operational work that needs attention."
        actions={<ExportButton label={exporting ? 'Exporting…' : 'Export snapshot'} onClick={handleExport} />}
      />

      <div className="flex items-start justify-between text-[11px]">
        <p className="text-[#aaa6b5]">{ready ? `${periodText} · ${snapshotText}` : loading ? 'Loading…' : 'Data unavailable'}</p>
        {ready && data ? (
          <p className="text-[#abd2bc]">● Updated {fmtAgo(data.snapshot.generated_at)}</p>
        ) : error ? (
          <p className="text-[#edb1b4]">● Not updated</p>
        ) : null}
      </div>

      {error && (
        <Panel role="alert" className="flex items-center justify-between gap-4 p-4">
          <p className="text-[12px] text-[#edb1b4]">{error}</p>
          <button
            type="button"
            onClick={() => void query.refetch()}
            className="shrink-0 rounded-md border border-[#38363f] px-3 py-1.5 text-[11px] text-[#c2ade7] hover:bg-[#2b2a33]"
          >
            Try again
          </button>
        </Panel>
      )}
      {exportError && <p className="text-[11px] text-[#edb1b4]">{exportError}</p>}

      <MetricGrid cols={4}>
        <MetricCard label="Registered users" value={ready && registered ? fmtNum(registered.value) : '—'} context={registeredContext} />
        <MetricCard
          label="Open reports"
          value={ready && mod ? fmtNum(mod.open_reports) : '—'}
          context={ready && mod ? `${fmtNum(mod.reports_new)} filed this period` : placeholder}
          danger={ready && !!mod && mod.open_reports > 0}
        />
        <MetricCard
          label="Active sanctions"
          value={ready && mod ? fmtNum(mod.active_sanctions) : '—'}
          context={ready && mod ? `${fmtNum(mod.pending_appeals)} pending appeal${mod.pending_appeals === 1 ? '' : 's'}` : placeholder}
        />
        <MetricCard label="Games" value={ready && data ? fmtNum(data.summary.games.total) : '—'} context={gamesContext} />
      </MetricGrid>

      <section className="flex flex-col gap-5">
        <SectionHeading
          title="Analytics Overview"
          subtitle="Key performance indicators and operational health"
          action={
            <select
              aria-label="Reporting interval"
              value={interval}
              onChange={(e) => setIntervalOption(e.target.value as IntervalOption)}
              className="cursor-pointer bg-transparent text-[11px] text-[#c2ade7] outline-none [&>option]:bg-[#222228]"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          }
        />

        <div className="grid gap-5 xl:grid-cols-2">
          <ChartCard
            title="User Views"
            subtitle={`Registered accounts · ${periodText}`}
            range={intervalLabel}
            legend={<span className="text-[#c2ade7]">● Registered users{ready && registered ? ` +${fmtNum(registered.new)} this period` : ''}</span>}
            {...chartState(data?.charts.user_views.points)}
          >
            <LineChart data={userViews}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="date" tickFormatter={fmtDay} minTickGap={28} tick={axisTick} tickLine={false} axisLine={false} />
              <YAxis domain={['auto', 'auto']} allowDecimals={false} tickFormatter={compact} tick={axisTick} tickLine={false} axisLine={false} width={40} />
              <Tooltip contentStyle={tooltipStyle} labelFormatter={tooltipLabel} />
              <Line type="monotone" dataKey="users" name="Registered users" stroke={PURPLE} strokeWidth={2} dot={false} />
            </LineChart>
          </ChartCard>

          <ChartCard
            title="Staff & security activity"
            subtitle="Admin and moderator actions, and security events"
            range={intervalLabel}
            legend={
              <>
                <span className="text-[#c2ade7]">● Staff actions {ready && ops ? fmtNum(ops.staff_total) : '—'} </span>
                <span className="text-[#dfc192]">◌ Security events {ready && ops ? fmtNum(ops.security_total) : '—'}</span>
              </>
            }
            {...chartState(operations, 'No staff or security activity in this period.')}
          >
            <LineChart data={operations}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="date" tickFormatter={fmtDay} minTickGap={28} tick={axisTick} tickLine={false} axisLine={false} />
              <YAxis domain={[0, 'auto']} allowDecimals={false} tickFormatter={compact} tick={axisTick} tickLine={false} axisLine={false} width={40} />
              <Tooltip contentStyle={tooltipStyle} labelFormatter={tooltipLabel} />
              <Line type="monotone" dataKey="staff" name="Staff actions" stroke={PURPLE} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="security" name="Security events" stroke={AMBER} strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
            </LineChart>
          </ChartCard>

          <ChartCard
            title="Community submissions"
            subtitle={`Submissions · ${periodText}`}
            range={intervalLabel}
            legend={
              <>
                <span className="text-[#c2ade7]">● Ratings {ready ? fmtNum(ratingsTotal) : '—'} </span>
                <span className="text-[#dfc192]">◌ Reviews {ready ? fmtNum(reviewsTotal) : '—'}</span>
              </>
            }
            {...chartState(submissions)}
          >
            <BarChart data={submissions} barGap={6}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="date" tickFormatter={fmtDay} minTickGap={28} tick={axisTick} tickLine={false} axisLine={false} />
              <YAxis domain={[0, 'auto']} allowDecimals={false} tick={axisTick} tickLine={false} axisLine={false} width={40} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#2b2a33' }} labelFormatter={tooltipLabel} />
              <Bar dataKey="ratings" name="Ratings" fill={PURPLE} radius={[3, 3, 0, 0]} maxBarSize={29} />
              <Bar dataKey="reviews" name="Reviews" fill={AMBER} radius={[3, 3, 0, 0]} maxBarSize={29} />
            </BarChart>
          </ChartCard>

          <ChartCard
            title="Catalogue by genre"
            subtitle="Games per genre · Top genres"
            range="All time"
            legend={<span className="text-[#dfc192]">● Games per genre</span>}
            {...chartState(genres, 'No genres recorded yet.')}
          >
            <BarChart data={genres} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid stroke={GRID} horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={axisTick} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" tick={axisTick} tickLine={false} axisLine={false} width={90} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#2b2a33' }} />
              <Bar dataKey="count" name="Games" fill={AMBER} radius={[0, 3, 3, 0]} maxBarSize={16} />
            </BarChart>
          </ChartCard>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        {/* Recent activity: the latest rows from the System Logs feed */}
        <Panel className="flex flex-col gap-4 p-5">
          <SectionHeading title="Recent activity" subtitle="Latest admin, moderator and security events" />
          {recent.isPending ? (
            <p className="py-6 text-center text-[12px] text-[#76717f]">Loading…</p>
          ) : recent.isError ? (
            <div className="flex items-center justify-between gap-4">
              <p className="text-[12px] text-[#edb1b4]">{getErrorMessage(recent.error, 'Unable to load activity.')}</p>
              <button
                type="button"
                onClick={() => void recent.refetch()}
                className="shrink-0 rounded-md border border-[#38363f] px-3 py-1.5 text-[11px] text-[#c2ade7] hover:bg-[#2b2a33]"
              >
                Try again
              </button>
            </div>
          ) : recentRows.length === 0 ? (
            <p className="py-6 text-center text-[12px] text-[#76717f]">No activity recorded.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {recentRows.map((l) => (
                <li key={l.id} className="flex items-start justify-between gap-4 border-t border-[#38363f] pt-3 first:border-t-0 first:pt-0">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-[#f0eef5]">{l.description}</p>
                    <p className="truncate text-[10px] text-[#aaa6b5]">
                      {l.actor} · {l.type}
                    </p>
                  </div>
                  <p className="shrink-0 whitespace-nowrap text-[10px] text-[#aaa6b5]">{fmtStamp(l.timestamp)}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {/* Accounts: how the user base breaks down right now */}
        <Panel className="flex flex-col gap-4 p-5">
          <SectionHeading title="Accounts" subtitle="How the user base looks right now" />
          {ready && accounts ? (
            <div className="flex flex-col gap-3">
              {accountRows.map((r) => (
                <div key={r.label} className="flex items-center gap-3 text-[11px]">
                  <span className="w-32 shrink-0 text-[#f0eef5]">{r.label}</span>
                  <div className="h-2 flex-1 rounded-sm bg-[#1a1a20]">
                    <div
                      className="h-2 rounded-sm bg-[#c2ade7]"
                      style={{ width: `${accounts.total > 0 ? (r.count / accounts.total) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="w-24 shrink-0 text-right text-[#aaa6b5]">
                    {fmtNum(r.count)}
                    {accounts.total > 0 ? ` · ${((r.count / accounts.total) * 100).toFixed(1)}%` : ''}
                  </span>
                </div>
              ))}
              <p className="text-[11px] text-[#aaa6b5]">{fmtNum(accounts.total)} accounts in total</p>
            </div>
          ) : (
            <p className="py-6 text-center text-[12px] text-[#76717f]">{loading ? 'Loading…' : 'Unable to load data.'}</p>
          )}
        </Panel>
      </div>

      <WorkspaceFooter />
    </AdminLayout>
  );
};