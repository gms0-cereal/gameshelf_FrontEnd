import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import ModLayout from "../../components/layout/Modlayout";
import { priorityTone } from "./modeTones";
import { Badge, Button, Card, DataTable, Notice, PageHeader, Pagination, RowAction, StatCard, type Column } from "../../components/ui/Modui";
import { errorMessage, getModerationDashboard, type Dashboard, type ReportRow } from "../../lib/moderationApi";

function OverviewContent({ onOpenReport }: { onOpenReport: (r: ReportRow) => void }) {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    getModerationDashboard()
      .then(setDashboard)
      .catch((e) => setLoadError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  const queue = (dashboard?.queue ?? []).slice(0, 6);
  const categories = dashboard?.categories ?? [];
  const max = Math.max(1, ...categories.map(([, n]) => n));
  const total = categories.reduce((sum, [, n]) => sum + n, 0);
  const s = dashboard?.stats;

  const columns: Column<ReportRow>[] = [
    { key: "report", header: "Report / user", render: (r) => <span className="text-zinc-300">{r.id} · {r.reporter}</span> },
    { key: "reason", header: "Reason", render: (r) => r.category },
    { key: "priority", header: "Priority", render: (r) => <Badge tone={priorityTone(r.priority)}>{r.priority}</Badge> },
    { key: "action", header: "Action", render: () => <RowAction>Review →</RowAction> },
  ];

  return (
    <>
      <PageHeader
        title="Moderator Overview"
        subtitle="Your safety workspace. Start with high-impact reports and time-sensitive appeals."
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Pending reports" value={s?.pending_reports ?? "—"} hint="Awaiting first review" />
        <StatCard label="Under review" value={s?.under_review ?? "—"} hint="Currently being reviewed" />
        <StatCard label="Resolved reports" value={s?.resolved_reports ?? "—"} hint="Closed with action" />
        <StatCard label="Active sanctions" value={s?.active_sanctions ?? "—"} hint="Currently in effect" />
        <StatCard label="Pending appeals" value={s?.pending_appeals ?? "—"} hint="Awaiting a decision" />
      </div>

      {loadError && <Notice tone="info" className="mb-4">{loadError}</Notice>}

      <div className="grid gap-4 lg:grid-cols-[1.7fr_1fr]">
        <Card
          title="Prioritized work queue"
          subtitle="Open and under-review reports · High priority first"
        >
          {loading ? (
            <p className="text-[11px] text-zinc-400">Loading reports...</p>
          ) : queue.length === 0 ? (
            <p className="text-[11px] text-zinc-400">No pending reports.</p>
          ) : (
            <DataTable columns={columns} rows={queue} onRowClick={onOpenReport} />
          )}
          <Pagination summary={`${queue.length} reports shown`} />
        </Card>

        <Card title="Report-category overview" subtitle={`${total} reports`}>
          {categories.length === 0 ? (
            <p className="text-[11px] text-zinc-400">No reports in this period.</p>
          ) : (
            <ul className="space-y-2.5">
              {categories.map(([label, n]) => (
                <li key={label}>
                  <div className="flex justify-between text-[10.5px] text-zinc-300">
                    <span>{label}</span>
                    <span className="text-zinc-500">{n}</span>
                  </div>
                  <div className="mt-1 h-1 rounded-full bg-white/5">
                    <div className="h-1 rounded-full bg-violet-500" style={{ width: `${(n / max) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}

export default function ModeratorDashboard() {
  const navigate = useNavigate();
  return (
    <ModLayout crumbs={["Moderator", "Overview"]}>
      <OverviewContent onOpenReport={(r) => navigate(`/moderator/sanctions?kind=${r.kind}&report=${r.reportId}`)} />
    </ModLayout>
  );
}