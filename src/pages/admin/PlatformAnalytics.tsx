import React, { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CalendarDays, Info } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import {
  DataTable,
  ExportButton,
  MetricCard,
  MetricGrid,
  PageHeading,
  Panel,
  SecondaryButton,
  SectionHeading,
  Tabs,
  WorkspaceFooter,
} from '../../components/admin/AdminLayout';
import type { Column } from '../../components/admin/AdminLayout';
import { anDayTicks as dayTicks, anTraffic as traffic, anSubmissions as submissions, anRegistrations as registrations, anRegTicks as regTicks, anTopPages as topPages, anSources as sources, anReviewed as reviewed } from './MockData';
import type { PageRow, SourceRow, ReviewedRow } from './MockData';

const PURPLE = '#c2ade7';
const AMBER = '#dfc192';
const GRID = '#38363f';
const axisTick = { fill: '#76717f', fontSize: 10 };
const tooltipStyle = { background: '#1a1a20', border: '1px solid #38363f', borderRadius: 6, fontSize: 11 };
const kFormat = (v: number) => (v === 0 ? '0' : `${v / 1000}k`);

/* ---------------- Tables ---------------- */
const pageCols: Column<PageRow>[] = [
  { header: 'Game', className: 'text-[#f0eef5]', cell: (r) => r.game },
  { header: 'Views ↓', className: 'text-[#aaa6b5]', cell: (r) => r.views },
  { header: 'Engagement', className: 'text-[#c2ade7]', cell: (r) => r.engagement },
];

const sourceCols: Column<SourceRow>[] = [
  { header: 'Source', className: 'text-[#f0eef5]', cell: (r) => r.source },
  { header: 'Accounts ↓', className: 'text-[#aaa6b5]', cell: (r) => r.accounts },
  { header: 'Share', className: 'text-[#c2ade7]', cell: (r) => r.share },
];

const reviewedCols: Column<ReviewedRow>[] = [
  { header: 'Game', className: 'text-[#f0eef5]', cell: (r) => r.game },
  { header: 'Reviews ↓', className: 'text-[#aaa6b5]', cell: (r) => r.reviews },
  { header: 'Library adds', className: 'text-[#c2ade7]', cell: (r) => r.adds },
];

/* ---------------- Small helpers ---------------- */
const Pager = '‹ Previous   1   2   3   Next ›';

const ChartPanel: React.FC<{ title: string; subtitle: string; legend: React.ReactNode; children: React.ReactElement }> = ({
  title,
  subtitle,
  legend,
  children,
}) => (
  <Panel className="flex min-w-0 flex-col gap-4 p-5">
    <SectionHeading title={title} subtitle={subtitle} action="Daily ⌄" />
    <p className="text-[10px]">{legend}</p>
    <div className="h-[190px]">
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  </Panel>
);

const InfoNote: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-center gap-[10px] rounded-md bg-[#1a1a20] p-[14px]">
    <Info className="h-[18px] w-[18px] shrink-0 text-[#dfc192]" />
    <p className="flex-1 text-xs leading-normal text-[#aaa6b5]">{children}</p>
  </div>
);

type TabKey = 'all' | 'traffic' | 'acquisition' | 'content';
const tabs: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'All analytics' },
  { key: 'traffic', label: 'Traffic & Engagement' },
  { key: 'acquisition', label: 'User Acquisition' },
  { key: 'content', label: 'Content Growth' },
];

export const PlatformAnalytics: React.FC = () => {
  const [tab, setTab] = useState<TabKey>('all');
  const show = (k: Exclude<TabKey, 'all'>) => tab === 'all' || tab === k;

  return (
    <AdminLayout>
      <PageHeading
        eyebrow="PLATFORM OPERATIONS"
        title="Platform Analytics"
        description="Understand discovery, acquisition and contribution across the community."
        actions={<ExportButton label="Export report" />}
      />

      <div className="flex flex-wrap gap-3">
        <SecondaryButton>
          <CalendarDays className="h-[15px] w-[15px]" />
          04 Oct–02 Nov 2026
        </SecondaryButton>
        <SecondaryButton disabled className="opacity-40">
          Segment: All users ⌄
        </SecondaryButton>
        <SecondaryButton>All platforms ⌄</SecondaryButton>
        <SecondaryButton>Compare: Previous 30 days ⌄</SecondaryButton>
      </div>

      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {/* ---------------- Traffic & Engagement ---------------- */}
      {show('traffic') && (
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-[#f0eef5]">Traffic &amp; Engagement</h2>
          <MetricGrid cols={4}>
            <MetricCard label="DAU" value="1,842" context="01 Nov · Last complete day" />
            <MetricCard label="MAU" value="8,760" context="30-day unique active accounts" />
            <MetricCard label="Visits" value="198,400" context="+14.2% vs prior period" />
            <MetricCard label="Page views" value="462,800" context="2.33 views per visit" />
          </MetricGrid>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,620px)_1fr]">
            <ChartPanel
              title="Visits & page views"
              subtitle="Daily events · All traffic · UTC"
              legend={
                <>
                  <span className="text-[#c2ade7]">● Page views　</span>
                  <span className="text-[#dfc192]">◌ Visits</span>
                </>
              }
            >
              <LineChart data={traffic}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="day" ticks={dayTicks} tick={axisTick} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 20000]} ticks={[0, 10000, 20000]} tickFormatter={kFormat} tick={axisTick} tickLine={false} axisLine={false} width={38} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="views" name="Page views" stroke={PURPLE} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="visits" name="Visits" stroke={AMBER} strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
              </LineChart>
            </ChartPanel>

            <Panel className="flex min-w-0 flex-col gap-4 p-5">
              <SectionHeading title="Most-visited game pages" subtitle="Ranked by page views" action="Full report →" />
              <DataTable columns={pageCols} rows={topPages} rowKey={(r) => r.game} footerLeft="Top 4 of 34 published games" footerRight={Pager} />
            </Panel>
          </div>

          <InfoNote>Engagement: 12.4% recommendation CTR · 10,540 clicks / 85,000 impressions · Median session 6m 14s.</InfoNote>
        </section>
      )}

      {/* ---------------- User Acquisition ---------------- */}
      {show('acquisition') && (
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-[#f0eef5]">User Acquisition</h2>
          <MetricGrid cols={4}>
            <MetricCard label="New registrations" value="1,240" context="04 Oct–02 Nov" />
            <MetricCard label="Registered accounts" value="12,840" context="11,600 at period start" />
            <MetricCard label="Active / inactive" value="8,760 / 4,080" context="Activity within selected 30 days" />
            <MetricCard label="Account growth" value="10.7%" context="1,240 ÷ 11,600" />
          </MetricGrid>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,620px)_1fr]">
            <ChartPanel title="Registration trend" subtitle="New accounts per day · UTC" legend={<span className="text-[#c2ade7]">● Registrations　Average 41 / day</span>}>
              <BarChart data={registrations}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="day" ticks={regTicks} interval={0} tick={axisTick} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 80]} ticks={[0, 40, 80]} tick={axisTick} tickLine={false} axisLine={false} width={38} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#2b2a33' }} />
                <Bar dataKey="users" name="Registrations" radius={[3, 3, 0, 0]}>
                  {registrations.map((_, i) => (
                    <Cell key={i} fill={i === registrations.length - 1 ? PURPLE : '#79678f'} />
                  ))}
                </Bar>
              </BarChart>
            </ChartPanel>

            <Panel className="flex min-w-0 flex-col gap-4 p-5">
              <SectionHeading title="Acquisition sources" subtitle="Registrations attributed to first visit" />
              <DataTable columns={sourceCols} rows={sources} rowKey={(r) => r.source} footerLeft="1,240 new accounts · 100% attributed" footerRight={Pager} />
            </Panel>
          </div>
        </section>
      )}

      {/* ---------------- Content Growth ---------------- */}
      {show('content') && (
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-[#f0eef5]">Content Growth</h2>
          <MetricGrid cols={4}>
            <MetricCard label="Catalogue games" value="38" context="34 published · +3 this period" />
            <MetricCard label="New library additions" value="2,840" context="18,490 total additions" />
            <MetricCard label="New reviews" value="96" context="526 reviews in total" />
            <MetricCard label="New ratings" value="448" context="3,240 ratings in total" />
          </MetricGrid>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,620px)_1fr]">
            <ChartPanel
              title="Reviews & ratings"
              subtitle="Submissions per day · Includes held records"
              legend={
                <>
                  <span className="text-[#c2ade7]">● Ratings　</span>
                  <span className="text-[#dfc192]">◌ Reviews</span>
                </>
              }
            >
              <LineChart data={submissions}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="day" ticks={dayTicks} tick={axisTick} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 30]} ticks={[0, 15, 30]} tick={axisTick} tickLine={false} axisLine={false} width={38} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="ratings" name="Ratings" stroke={PURPLE} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="reviews" name="Reviews" stroke={AMBER} strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
              </LineChart>
            </ChartPanel>

            <Panel className="flex min-w-0 flex-col gap-4 p-5">
              <SectionHeading title="Most-reviewed & most-added" subtitle="Period totals · Ranked by reviews" />
              <DataTable
                columns={reviewedCols}
                rows={reviewed}
                rowKey={(r) => r.game}
                footerLeft="Most added: Hollow Knight · 620 additions"
                footerRight={Pager}
              />
            </Panel>
          </div>
        </section>
      )}

      <InfoNote>
        Daily activity ends 01 Nov; period totals include 02 Nov through 10:30 UTC. Reviews, ratings, content flags and reports are separate measures. Public scores exclude held ratings.
      </InfoNote>

      <WorkspaceFooter />
    </AdminLayout>
  );
};