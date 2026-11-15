import React, { useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Info } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import {
  DataTable,
  ExportButton,
  MetricCard,
  MetricGrid,
  PageHeading,
  Panel,
  SectionHeading,
  Tabs,
  WorkspaceFooter,
} from '../../components/admin/AdminLayout';
import type { Column } from '../../components/admin/AdminLayout';
import { downloadDashboardExport, getErrorMessage, getPlatformData } from '../../services/Adminservice';
import type { IntervalOption, PlatformData } from '../../services/Adminservice';

const PURPLE = '#c2ade7';
const AMBER = '#dfc192';
const GRID = '#38363f';
const axisTick = { fill: '#76717f', fontSize: 10 };
const tooltipStyle = { background: '#1a1a20', border: '1px solid #38363f', borderRadius: 6, fontSize: 11 };
const compact = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1).replace(/\.0$/, '')}k` : String(v));

/* ---------------- Formatting helpers ---------------- */
// Only the YYYY-MM-DD part is parsed, so a timezone offset can never shift the day.
const toDay = (iso: string) => new Date(`${iso.slice(0, 10)}T00:00:00`);
const fmtDay = (iso: string) => toDay(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
const fmtFull = (iso: string) => toDay(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtNum = (n: number) => n.toLocaleString('en-US');
const labelize = (s: string) => s.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());
const pct = (part: number, whole: number) => (whole > 0 ? `${((part / whole) * 100).toFixed(1)}%` : '—');

const dateInput =
  'rounded-md border border-[#38363f] bg-[#222228] px-3 py-1.5 text-[11px] text-[#f0eef5] outline-none [color-scheme:dark]';

type ChartStatus = 'loading' | 'error' | 'empty' | 'ready';

type TopGame = PlatformData['engagement']['top_games'][number];
type EventType = PlatformData['engagement']['by_type'][number];
type TopReviewed = PlatformData['content']['top_reviewed'][number];

interface CountRow {
  label: string;
  count: number;
  share: string;
}

const ChartPanel: React.FC<{
  title: string;
  subtitle: string;
  range: string;
  legend: React.ReactNode;
  status: ChartStatus;
  message?: string;
  children: React.ReactElement;
}> = ({ title, subtitle, range, legend, status, message, children }) => (
  <Panel className="flex min-w-0 flex-col gap-4 p-5">
    <SectionHeading title={title} subtitle={subtitle} action={range} />
    <p className="text-[10px]">{legend}</p>
    <div className="h-[190px]">
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

const TablePanel: React.FC<{ title: string; subtitle: string; state: ChartStatus; message?: string; children: React.ReactNode }> = ({
  title,
  subtitle,
  state,
  message,
  children,
}) => (
  <Panel className="flex min-w-0 flex-col gap-4 p-5">
    <SectionHeading title={title} subtitle={subtitle} />
    {state === 'ready' ? children : <p className="py-6 text-center text-[12px] text-[#76717f]">{message}</p>}
  </Panel>
);

const InfoNote: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-center gap-[10px] rounded-md bg-[#1a1a20] p-[14px]">
    <Info className="h-[18px] w-[18px] shrink-0 text-[#dfc192]" />
    <p className="flex-1 text-xs leading-normal text-[#aaa6b5]">{children}</p>
  </div>
);

type TabKey = 'all' | 'traffic' | 'acquisition' | 'content' | 'safety';
const tabs: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'All analytics' },
  { key: 'traffic', label: 'Traffic & Engagement' },
  { key: 'acquisition', label: 'User Acquisition' },
  { key: 'content', label: 'Content Growth' },
  { key: 'safety', label: 'Community Safety' },
];

export const PlatformAnalytics: React.FC = () => {
  const [tab, setTab] = useState<TabKey>('all');
  const [interval, setIntervalOption] = useState<IntervalOption>('daily');
  const [range, setRange] = useState({ from: '', to: '' });
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const invalidRange = Boolean(range.from && range.to && range.from > range.to);

  // React Query owns fetching, caching and de-duplication. The query key contains every
  // input, so a slow response for an old selection can never overwrite a newer one, and
  // React StrictMode's double-mount in dev shares one request instead of cancel + refetch.
  // keepPreviousData keeps the last result on screen while a new selection loads.
  // The key name changed from 'platform-analytics' so cached data in the old shape
  // (which hot reload can keep alive) is never handed to this page.
  const query = useQuery<PlatformData>({
    queryKey: ['platform-data', interval, range.from, range.to],
    queryFn: () => getPlatformData({ interval, date_from: range.from, date_to: range.to }),
    enabled: !invalidRange,
    placeholderData: keepPreviousData,
    retry: false,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const data = query.data ?? null;
  const loading = !invalidRange && query.isFetching;
  const error = query.error ? getErrorMessage(query.error, 'Unable to load analytics.') : null;
  const displayError = error ?? (invalidRange ? 'The start date must be on or before the end date.' : null);

  const show = (k: Exclude<TabKey, 'all'>) => tab === 'all' || tab === k;
  const ready = !loading && !displayError && data !== null;
  const intervalLabel = interval === 'daily' ? 'Daily' : 'Weekly';
  const placeholder = loading ? 'Loading…' : 'Unavailable';
  const periodText = data ? `${fmtDay(data.reporting.date_from)}–${fmtFull(data.reporting.date_to)}` : '—';

  const chartState = (points: unknown[] | undefined, emptyMessage = 'No data for this period.') => {
    if (loading) return { status: 'loading' as ChartStatus, message: 'Loading…' };
    if (displayError || !data) return { status: 'error' as ChartStatus, message: 'Unable to load data.' };
    if (!points || points.length === 0) return { status: 'empty' as ChartStatus, message: emptyMessage };
    return { status: 'ready' as ChartStatus, message: undefined };
  };

  const tableState = (rows: unknown[] | undefined, empty: string) => {
    if (loading) return { state: 'loading' as ChartStatus, message: 'Loading…' };
    if (displayError || !data) return { state: 'error' as ChartStatus, message: 'Unable to load data.' };
    if (!rows || rows.length === 0) return { state: 'empty' as ChartStatus, message: empty };
    return { state: 'ready' as ChartStatus, message: undefined };
  };

  const traffic = data?.traffic;
  const engagement = data?.engagement;
  const acq = data?.acquisition;
  const content = data?.content;
  const safety = data?.safety;

  // Dates that only one series returned legitimately have 0 for the other.
  const submissions = useMemo(() => {
    if (!data) return [];
    const merged = new Map<string, { date: string; ratings: number; reviews: number }>();
    (data.content?.submissions?.ratings ?? []).forEach((p) =>
      merged.set(p.date.slice(0, 10), { date: p.date, ratings: p.value, reviews: 0 }),
    );
    (data.content?.submissions?.reviews ?? []).forEach((p) => {
      const key = p.date.slice(0, 10);
      const existing = merged.get(key);
      if (existing) existing.reviews = p.value;
      else merged.set(key, { date: p.date, ratings: 0, reviews: p.value });
    });
    return [...merged.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, row]) => row);
  }, [data]);

  const accountRows = useMemo<CountRow[]>(() => {
    const a = data?.acquisition?.accounts;
    if (!a) return [];
    return [
      { label: 'Verified email', count: a.verified },
      { label: 'Unverified email', count: a.unverified },
      { label: 'Active accounts', count: a.active },
      { label: 'Suspended', count: a.suspended },
      { label: 'Deactivated', count: a.inactive },
    ].map((r) => ({ ...r, share: pct(r.count, a.total) }));
  }, [data]);

  const reasonRows = useMemo<CountRow[]>(
    () =>
      (data?.safety?.by_reason ?? []).map((r) => ({
        label: labelize(r.reason),
        count: r.count,
        share: pct(r.count, data?.safety?.reports_new ?? 0),
      })),
    [data],
  );

  const ratingDist = content?.rating_distribution ?? [];
  const hasRatings = ratingDist.some((r) => r.count > 0);

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
      setExportError(getErrorMessage(err, 'Unable to export the report.'));
    } finally {
      setExporting(false);
    }
  };

  const handleRetry = () => {
    if (!invalidRange) void query.refetch();
  };

  const tooltipLabel = (label: unknown) =>
    interval === 'weekly' ? `Week of ${fmtFull(String(label))}` : fmtFull(String(label));

  /* ---------------- Tables ---------------- */
  const engagedCols: Column<TopGame>[] = [
    { header: 'Game', className: 'text-[#f0eef5]', cell: (r) => r.title },
    { header: 'Interactions ↓', className: 'text-[#aaa6b5]', cell: (r) => fmtNum(r.events) },
    { header: 'Users', className: 'text-[#c2ade7]', cell: (r) => fmtNum(r.users) },
  ];
  const typeCols: Column<EventType>[] = [
    { header: 'Event type', className: 'text-[#f0eef5]', cell: (r) => labelize(r.event_type) },
    { header: 'Events ↓', className: 'text-[#aaa6b5]', cell: (r) => fmtNum(r.count) },
    { header: 'Users', className: 'text-[#c2ade7]', cell: (r) => fmtNum(r.users) },
  ];
  const countCols = (first: string): Column<CountRow>[] => [
    { header: first, className: 'text-[#f0eef5]', cell: (r) => r.label },
    { header: 'Count ↓', className: 'text-[#aaa6b5]', cell: (r) => fmtNum(r.count) },
    { header: 'Share', className: 'text-[#c2ade7]', cell: (r) => r.share },
  ];
  const reviewedCols: Column<TopReviewed>[] = [
    { header: 'Game', className: 'text-[#f0eef5]', cell: (r) => r.title },
    { header: 'Reviews ↓', className: 'text-[#aaa6b5]', cell: (r) => fmtNum(r.reviews) },
    { header: 'Ratings', className: 'text-[#aaa6b5]', cell: (r) => fmtNum(r.ratings) },
    { header: 'Avg score', className: 'text-[#c2ade7]', cell: (r) => (r.avg_score === null ? '—' : r.avg_score.toFixed(1)) },
  ];

  return (
    <AdminLayout>
      <PageHeading
        eyebrow="PLATFORM OPERATIONS"
        title="Platform Analytics"
        description="Understand discovery, acquisition, contribution and community safety across the platform."
        actions={<ExportButton label={exporting ? 'Exporting…' : 'Export report'} onClick={handleExport} />}
      />

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-[11px] text-[#aaa6b5]">
          From
          <input
            type="date"
            className={dateInput}
            value={range.from || (data ? data.reporting.date_from.slice(0, 10) : '')}
            onChange={(e) => setRange((r) => ({ from: e.target.value, to: r.to || (data ? data.reporting.date_to.slice(0, 10) : '') }))}
          />
        </label>
        <label className="flex items-center gap-2 text-[11px] text-[#aaa6b5]">
          To
          <input
            type="date"
            className={dateInput}
            value={range.to || (data ? data.reporting.date_to.slice(0, 10) : '')}
            onChange={(e) => setRange((r) => ({ from: r.from || (data ? data.reporting.date_from.slice(0, 10) : ''), to: e.target.value }))}
          />
        </label>
        <label className="flex items-center gap-2 text-[11px] text-[#aaa6b5]">
          Interval
          <select
            aria-label="Reporting interval"
            value={interval}
            onChange={(e) => setIntervalOption(e.target.value as IntervalOption)}
            className="cursor-pointer rounded-md border border-[#38363f] bg-[#222228] px-3 py-1.5 text-[11px] text-[#c2ade7] outline-none"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
        </label>
        {(range.from || range.to) && (
          <button type="button" onClick={() => setRange({ from: '', to: '' })} className="text-xs text-[#c2ade7] hover:underline">
            Reset dates
          </button>
        )}
      </div>

      {displayError && (
        <Panel role="alert" className="flex items-center justify-between gap-4 p-4">
          <p className="text-[12px] text-[#edb1b4]">{displayError}</p>
          <button
            type="button"
            onClick={handleRetry}
            className="shrink-0 rounded-md border border-[#38363f] px-3 py-1.5 text-[11px] text-[#c2ade7] hover:bg-[#2b2a33]"
          >
            Try again
          </button>
        </Panel>
      )}
      {exportError && <p className="text-[11px] text-[#edb1b4]">{exportError}</p>}

      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {/* ---------------- Traffic & Engagement ---------------- */}
      {show('traffic') && (
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-[#f0eef5]">Traffic &amp; Engagement</h2>
          <MetricGrid cols={4}>
            <MetricCard
              label="DAU"
              value={ready && traffic ? fmtNum(traffic.dau.value) : '—'}
              context={ready && traffic ? `${fmtFull(traffic.dau.date)} · Last complete day` : placeholder}
            />
            <MetricCard
              label="MAU"
              value={ready && traffic ? fmtNum(traffic.mau.value) : '—'}
              context={ready ? 'Rolling 30-day unique active accounts' : placeholder}
            />
            <MetricCard
              label="Stickiness"
              value={ready && traffic ? (traffic.stickiness_percent === null ? '—' : `${traffic.stickiness_percent}%`) : '—'}
              context={ready ? 'DAU ÷ MAU · How often monthly users return' : placeholder}
            />
            <MetricCard
              label="Recommendation events"
              value={ready && engagement ? fmtNum(engagement.events_total) : '—'}
              context={ready ? periodText : placeholder}
            />
          </MetricGrid>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,620px)_1fr]">
            <ChartPanel
              title="Active users"
              subtitle={`Unique users with a recommendation event · ${periodText}`}
              range={intervalLabel}
              legend={<span className="text-[#dfc192]">● {interval === 'daily' ? 'Daily active users' : 'Weekly active users'}</span>}
              {...chartState(traffic?.active_users)}
            >
              <LineChart data={traffic?.active_users ?? []}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="date" tickFormatter={fmtDay} minTickGap={28} tick={axisTick} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 'auto']} allowDecimals={false} tickFormatter={compact} tick={axisTick} tickLine={false} axisLine={false} width={38} />
                <Tooltip contentStyle={tooltipStyle} labelFormatter={tooltipLabel} />
                <Line type="monotone" dataKey="value" name="Active users" stroke={AMBER} strokeWidth={2} dot={false} />
              </LineChart>
            </ChartPanel>

            <TablePanel title="Most-engaged games" subtitle="Ranked by recommendation interactions" {...tableState(engagement?.top_games, 'No interactions in this period.')}>
              <DataTable
                columns={engagedCols}
                rows={engagement?.top_games ?? []}
                rowKey={(r) => String(r.game_id)}
                footerLeft={`Top ${engagement?.top_games?.length ?? 0} by interactions`}
                footerRight=""
              />
            </TablePanel>
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,620px)_1fr]">
            <ChartPanel
              title="Recommendation interactions"
              subtitle={`Events per ${interval === 'daily' ? 'day' : 'week'} · ${periodText}`}
              range={intervalLabel}
              legend={<span className="text-[#c2ade7]">● Events</span>}
              {...chartState(engagement?.series)}
            >
              <LineChart data={engagement?.series ?? []}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="date" tickFormatter={fmtDay} minTickGap={28} tick={axisTick} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 'auto']} allowDecimals={false} tickFormatter={compact} tick={axisTick} tickLine={false} axisLine={false} width={38} />
                <Tooltip contentStyle={tooltipStyle} labelFormatter={tooltipLabel} />
                <Line type="monotone" dataKey="value" name="Events" stroke={PURPLE} strokeWidth={2} dot={false} />
              </LineChart>
            </ChartPanel>

            <TablePanel title="Interactions by type" subtitle="Recommendation event types" {...tableState(engagement?.by_type, 'No interactions in this period.')}>
              <DataTable
                columns={typeCols}
                rows={engagement?.by_type ?? []}
                rowKey={(r) => r.event_type}
                footerLeft={
                  engagement && engagement.ctr_percent !== null
                    ? `Click-through rate ${engagement.ctr_percent}%`
                    : 'Click-through rate needs impression and click events'
                }
                footerRight=""
              />
            </TablePanel>
          </div>
        </section>
      )}

      {/* ---------------- User Acquisition ---------------- */}
      {show('acquisition') && (
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-[#f0eef5]">User Acquisition</h2>
          <MetricGrid cols={4}>
            <MetricCard label="New registrations" value={ready && acq ? fmtNum(acq.new_registrations) : '—'} context={ready ? periodText : placeholder} />
            <MetricCard
              label="Registered accounts"
              value={ready && acq ? fmtNum(acq.registered_total) : '—'}
              context={ready && acq ? `${fmtNum(acq.registered_at_start)} at period start` : placeholder}
            />
            <MetricCard
              label="Active / inactive"
              value={ready && acq ? `${fmtNum(acq.active_30d)} / ${fmtNum(acq.inactive)}` : '—'}
              context={ready ? 'Active = recommendation activity in the last 30 days' : placeholder}
            />
            <MetricCard
              label="Account growth"
              value={ready && acq ? (acq.growth_percent === null ? '—' : `${acq.growth_percent}%`) : '—'}
              context={
                ready && acq
                  ? acq.growth_percent === null
                    ? 'No accounts existed at period start'
                    : `${fmtNum(acq.new_registrations)} ÷ ${fmtNum(acq.registered_at_start)}`
                  : placeholder
              }
            />
          </MetricGrid>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,620px)_1fr]">
            <ChartPanel
              title="Registration trend"
              subtitle={`New accounts per ${interval === 'daily' ? 'day' : 'week'} · ${periodText}`}
              range={intervalLabel}
              legend={<span className="text-[#c2ade7]">● Registrations{ready && acq ? `　Average ${acq.avg_per_day} / day` : ''}</span>}
              {...chartState(acq?.registrations)}
            >
              <BarChart data={acq?.registrations ?? []}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="date" tickFormatter={fmtDay} minTickGap={28} tick={axisTick} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 'auto']} allowDecimals={false} tick={axisTick} tickLine={false} axisLine={false} width={38} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#2b2a33' }} labelFormatter={tooltipLabel} />
                <Bar dataKey="value" name="Registrations" radius={[3, 3, 0, 0]}>
                  {(acq?.registrations ?? []).map((_, i, all) => (
                    <Cell key={i} fill={i === all.length - 1 ? PURPLE : '#79678f'} />
                  ))}
                </Bar>
              </BarChart>
            </ChartPanel>

            <TablePanel title="Account breakdown" subtitle="All accounts right now" {...tableState(accountRows, 'No accounts found.')}>
              <DataTable
                columns={countCols('Account type')}
                rows={accountRows}
                rowKey={(r) => r.label}
                footerLeft={`${fmtNum(acq?.accounts?.total ?? 0)} accounts in total`}
                footerRight=""
              />
            </TablePanel>
          </div>
        </section>
      )}

      {/* ---------------- Content Growth ---------------- */}
      {show('content') && (
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-[#f0eef5]">Content Growth</h2>
          <MetricGrid cols={4}>
            <MetricCard
              label="Catalogue games"
              value={ready && content ? fmtNum(content.games_total) : '—'}
              context={ready && content ? `+${fmtNum(content.games_new)} added this period` : placeholder}
            />
            <MetricCard
              label="New comments"
              value={ready && content ? fmtNum(content.comments.new) : '—'}
              context={ready && content ? `${fmtNum(content.comments.total)} comments in total` : placeholder}
            />
            <MetricCard
              label="New reviews"
              value={ready && content ? fmtNum(content.reviews.new) : '—'}
              context={ready && content ? `${fmtNum(content.reviews.total)} reviews in total` : placeholder}
            />
            <MetricCard
              label="New ratings"
              value={ready && content ? fmtNum(content.ratings.new) : '—'}
              context={ready && content ? `${fmtNum(content.ratings.total)} ratings in total` : placeholder}
            />
          </MetricGrid>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,620px)_1fr]">
            <ChartPanel
              title="Reviews & ratings"
              subtitle={`Submissions per ${interval === 'daily' ? 'day' : 'week'} · ${periodText}`}
              range={intervalLabel}
              legend={
                <>
                  <span className="text-[#c2ade7]">● Ratings　</span>
                  <span className="text-[#dfc192]">◌ Reviews</span>
                </>
              }
              {...chartState(submissions)}
            >
              <LineChart data={submissions}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="date" tickFormatter={fmtDay} minTickGap={28} tick={axisTick} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 'auto']} allowDecimals={false} tick={axisTick} tickLine={false} axisLine={false} width={38} />
                <Tooltip contentStyle={tooltipStyle} labelFormatter={tooltipLabel} />
                <Line type="monotone" dataKey="ratings" name="Ratings" stroke={PURPLE} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="reviews" name="Reviews" stroke={AMBER} strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
              </LineChart>
            </ChartPanel>

            <TablePanel title="Most-reviewed games" subtitle="Period totals · Ranked by reviews" {...tableState(content?.top_reviewed, 'No reviews in this period.')}>
              <DataTable
                columns={reviewedCols}
                rows={content?.top_reviewed ?? []}
                rowKey={(r) => String(r.game_id)}
                footerLeft={`Top ${content?.top_reviewed?.length ?? 0} by reviews in this period`}
                footerRight=""
              />
            </TablePanel>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <ChartPanel
              title="Rating distribution"
              subtitle={`Scores given · ${periodText}`}
              range="Period"
              legend={<span className="text-[#c2ade7]">● Ratings per score</span>}
              {...chartState(hasRatings ? ratingDist : [], 'No ratings in this period.')}
            >
              <BarChart data={ratingDist}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="score" tick={axisTick} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={axisTick} tickLine={false} axisLine={false} width={38} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#2b2a33' }} labelFormatter={(l) => `Score ${l}`} />
                <Bar dataKey="count" name="Ratings" fill={PURPLE} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ChartPanel>

            <ChartPanel
              title="Games by genre"
              subtitle="Catalogue breakdown · Top genres"
              range="All time"
              legend={<span className="text-[#dfc192]">● Games per genre</span>}
              {...chartState(content?.genres, 'No genres recorded.')}
            >
              <BarChart data={content?.genres ?? []} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid stroke={GRID} horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={axisTick} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" tick={axisTick} tickLine={false} axisLine={false} width={90} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#2b2a33' }} />
                <Bar dataKey="count" name="Games" fill={AMBER} radius={[0, 3, 3, 0]} maxBarSize={16} />
              </BarChart>
            </ChartPanel>
          </div>
        </section>
      )}

      {/* ---------------- Community Safety ---------------- */}
      {show('safety') && (
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-[#f0eef5]">Community Safety</h2>
          <MetricGrid cols={4}>
            <MetricCard
              label="Reports filed"
              value={ready && safety ? fmtNum(safety.reports_new) : '—'}
              context={ready && safety ? `${fmtNum(safety.open_reports)} open right now` : placeholder}
              danger={ready && !!safety && safety.open_reports > 0}
            />
            <MetricCard label="Open reports" value={ready && safety ? fmtNum(safety.open_reports) : '—'} context={ready ? 'Awaiting a moderator' : placeholder} />
            <MetricCard
              label="Sanctions issued"
              value={ready && safety ? fmtNum(safety.sanctions_new) : '—'}
              context={ready && safety ? `${fmtNum(safety.active_sanctions)} active right now` : placeholder}
            />
            <MetricCard
              label="Pending appeals"
              value={ready && safety ? fmtNum(safety.pending_appeals) : '—'}
              context={ready && safety ? `${fmtNum(safety.appeals_new)} filed this period` : placeholder}
            />
          </MetricGrid>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,620px)_1fr]">
            <ChartPanel
              title="Reports over time"
              subtitle={`Reviews, comments and playlists · ${periodText}`}
              range={intervalLabel}
              legend={<span className="text-[#dfc192]">● Reports filed</span>}
              {...chartState(safety?.series, 'No reports in this period.')}
            >
              <BarChart data={safety?.series ?? []}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="date" tickFormatter={fmtDay} minTickGap={28} tick={axisTick} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 'auto']} allowDecimals={false} tick={axisTick} tickLine={false} axisLine={false} width={38} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#2b2a33' }} labelFormatter={tooltipLabel} />
                <Bar dataKey="value" name="Reports" fill={AMBER} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ChartPanel>

            <TablePanel title="Reports by reason" subtitle="Filed in this period" {...tableState(reasonRows, 'No reports in this period.')}>
              <DataTable
                columns={countCols('Reason')}
                rows={reasonRows}
                rowKey={(r) => r.label}
                footerLeft={`${fmtNum(safety?.reports_new ?? 0)} reports in total`}
                footerRight=""
              />
            </TablePanel>
          </div>
        </section>
      )}

      <InfoNote>
        {data
          ? `Active users: ${(data.snapshot?.activity_definition ?? 'Recommendation activity').replace(/\.$/, '')}. Reviews and comments exclude deleted items. Reports combine review, comment and playlist reports.`
          : 'Reviews and comments exclude deleted items.'}
      </InfoNote>

      <WorkspaceFooter />
    </AdminLayout>
  );
};