import React from 'react';
import { ovXTicks as xTicks, ovUserGrowth as userGrowth, ovActivity as activity, ovCatalogue as catalogue, ovSubmissions as submissions, ovCtrTrend as ctrTrend } from './MockData';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { ExportButton, MetricCard, MetricGrid, PageHeading, Panel, SectionHeading, WorkspaceFooter } from '../../components/admin/AdminLayout';

/* ---------------- Chart helpers ---------------- */
const PURPLE = '#c2ade7';
const AMBER = '#dfc192';
const GRID = '#38363f';
const axisTick = { fill: '#76717f', fontSize: 10 };
const kFormat = (v: number) => (v === 0 ? '0' : `${(v / 1000).toFixed(1).replace(/\.0$/, '')}k`);
const tooltipStyle = { background: '#1a1a20', border: '1px solid #38363f', borderRadius: 6, fontSize: 11 };

const ChartCard: React.FC<{ title: string; subtitle: string; range: string; legend: React.ReactNode; children: React.ReactElement }> = ({
  title,
  subtitle,
  range,
  legend,
  children,
}) => (
  <Panel className="flex min-w-0 flex-1 flex-col gap-4 p-5">
    <SectionHeading title={title} subtitle={subtitle} action={`${range} ⌄`} />
    <p className="text-[10px]">{legend}</p>
    <div className="h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  </Panel>
);

export const Dashboard: React.FC = () => (
  <AdminLayout>
    <PageHeading
      eyebrow="PLATFORM OPERATIONS"
      title="Administrator Overview"
      description="Community growth, platform reliability and the operational work that needs attention."
      actions={<ExportButton label="Export snapshot" />}
    />

    <div className="flex items-start justify-between text-[11px]">
      <p className="text-[#aaa6b5]">04 Oct–02 Nov 2026 · Snapshot at 10:30 UTC</p>
      <p className="text-[#abd2bc]">● Updated 2 minutes ago</p>
    </div>

    <MetricGrid cols={4}>
      <MetricCard label="Registered users" value="12,840" context="+1,240 · +10.7% this period" />
      <MetricCard label="Daily active users" value="1,842" context="01 Nov · Last complete day" />
      <MetricCard label="Monthly active users" value="8,760" context="Rolling 30-day unique users" />
      <MetricCard label="Games" value="38" context="34 published · 3 draft · 1 archived" />
    </MetricGrid>

    <section className="flex flex-col gap-5">
      <SectionHeading title="Analytics Overview" subtitle="Key performance indicators and operational health" action="Daily ⌄" />

      <div className="grid gap-5 xl:grid-cols-2">
        <ChartCard
          title="User Views"
          subtitle="Registered accounts · 04 Oct–02 Nov 2026"
          range="Daily"
          legend={<span className="text-[#c2ade7]">● Registered users +1,240 this period</span>}
        >
          <LineChart data={userGrowth}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="day" ticks={xTicks} tick={axisTick} tickLine={false} axisLine={false} />
            <YAxis domain={[11500, 13000]} ticks={[11500, 12250, 13000]} tickFormatter={kFormat} tick={axisTick} tickLine={false} axisLine={false} width={40} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="users" name="Registered users" stroke={PURPLE} strokeWidth={2} dot={false} />
          </LineChart>
        </ChartCard>

        <ChartCard
          title="Daily & monthly activity"
          subtitle="Active users · DAU daily, MAU rolling 30 days"
          range="Daily"
          legend={
            <>
              <span className="text-[#c2ade7]">● MAU 8,760 </span>
              <span className="text-[#dfc192]">◌ DAU 1,842</span>
            </>
          }
        >
          <LineChart data={activity}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="day" ticks={xTicks} tick={axisTick} tickLine={false} axisLine={false} />
            <YAxis domain={[0, 9000]} ticks={[0, 4500, 9000]} tickFormatter={kFormat} tick={axisTick} tickLine={false} axisLine={false} width={40} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="mau" name="MAU" stroke={PURPLE} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="dau" name="DAU" stroke={AMBER} strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
          </LineChart>
        </ChartCard>

        <ChartCard
          title="Community submissions"
          subtitle="30-day submissions · Counts include held items"
          range="Weekly"
          legend={
            <>
              <span className="text-[#c2ade7]">● Ratings 448 </span>
              <span className="text-[#dfc192]">◌ Reviews 96</span>
            </>
          }
        >
          <BarChart data={submissions} barGap={6}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="week" tick={axisTick} tickLine={false} axisLine={false} />
            <YAxis domain={[0, 160]} ticks={[0, 80, 160]} tick={axisTick} tickLine={false} axisLine={false} width={40} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#2b2a33' }} />
            <Bar dataKey="ratings" name="Ratings" fill={PURPLE} radius={[3, 3, 0, 0]} maxBarSize={29} />
            <Bar dataKey="reviews" name="Reviews" fill={AMBER} radius={[3, 3, 0, 0]} maxBarSize={29} />
          </BarChart>
        </ChartCard>

        <ChartCard
          title="Catalogue growth"
          subtitle="Published games · 31 → 34 this period"
          range="Daily"
          legend={
            <>
              <span className="text-[#c2ade7]">● Published games </span>
              <span className="text-[#dfc192]">◌ Previous period</span>
            </>
          }
        >
          <LineChart data={catalogue}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="day" ticks={xTicks} tick={axisTick} tickLine={false} axisLine={false} />
            <YAxis domain={[28, 36]} ticks={[28, 32, 36]} tick={axisTick} tickLine={false} axisLine={false} width={40} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="stepAfter" dataKey="published" name="Published games" stroke={PURPLE} strokeWidth={2} dot={false} />
            <Line type="stepAfter" dataKey="previous" name="Previous period" stroke={AMBER} strokeWidth={1.5} strokeDasharray="4 4" dot={false} connectNulls />
          </LineChart>
        </ChartCard>
      </div>
    </section>

    {/* Engagement */}
    <Panel className="flex flex-col gap-4 p-5">
      <SectionHeading title="Engagement" subtitle="Recommendation click-through rate" />
      <p className="text-[28px] font-semibold leading-normal">12.4%</p>
      <p className="text-[11px] text-[#aaa6b5]">10,540 clicks / 85,000 impressions</p>
      <div className="flex h-[52px] items-end gap-[6px]">
        {ctrTrend.map((h, i) => (
          <div key={i} className="w-[15px] rounded-sm bg-[#c2ade7]" style={{ height: h }} />
        ))}
      </div>
      <p className="text-[11px] text-[#abd2bc]">+0.4 pp vs prior period</p>
    </Panel>

    <WorkspaceFooter />
  </AdminLayout>
);