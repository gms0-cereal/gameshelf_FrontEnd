import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import ModLayout from "../../components/layout/Modlayout";
import { CATEGORY_OVERVIEW, priorityTone, type Report } from "./modData";
import { Badge, Button, Card, DataTable, Notice, PageHeader, Pagination, RowAction, StatCard, type Column } from "../../components/ui/Modui";
import { getModerationDashboard, type ModerationDashboard } from "../../lib/moderationApi";

function OverviewContent({ onOpenReport }: { onOpenReport: () => void }) {
  const [dashboard, setDashboard] = useState<ModerationDashboard | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const queue = (dashboard?.recent_reports ?? []).slice(0, 4).map((report) => ({
    id: `${report.kind === "review" ? "R" : report.kind === "comment" ? "C" : "P"}-${report.id}`,
    reporter: report.reporter.username,
    category: report.reason,
    content: report.target.text,
    contentSub: `${report.target.type} by ${report.target.author}`,
    date: new Date(report.created_at).toLocaleString(),
    status: report.status === "reviewing" ? "Under review" : report.status,
    priority: "Medium",
  } as Report));
  const max = Math.max(...CATEGORY_OVERVIEW.map(([, n]) => n));

  useEffect(() => {
    getModerationDashboard()
      .then(setDashboard)
      .catch(() => setLoadError("Live moderation data is unavailable. Showing the saved queue snapshot."));
  }, []);

  const columns: Column<Report>[] = [
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
        meta="04 Oct–02 Nov · Rolling 30 days"
        actions={
          <>
            <Button>Assigned to me ▾</Button>
            <Button>Export snapshot</Button>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Pending reports" value={dashboard?.pending_reports ?? "—"} hint="Awaiting first review" />
        <StatCard label="Under review" value={dashboard?.under_review ?? "—"} hint="Assigned moderator actions" />
        <StatCard label="Resolved reports" value={dashboard?.resolved_reports ?? "—"} hint="Resolved reports" />
        <StatCard label="Active sanctions" value={dashboard?.active_sanctions ?? "—"} hint="Unavailable if not returned by the API" />
        <StatCard label="Pending appeals" value={dashboard?.pending_appeals ?? "—"} hint="Unavailable if not returned by the API" />
      </div>

      {loadError && <Notice tone="info" className="mb-4">{loadError}</Notice>}
      <Notice className="mb-4">
        Live counts and assignments come from the moderation API. Review the queue for the latest records.
      </Notice>

      <div className="grid gap-4 lg:grid-cols-[1.7fr_1fr]">
        <Card
          title="Prioritized work queue"
          subtitle={`${queue.length} recent reports · Ordered by the moderation API`}
          action={<span className="text-[10px] text-zinc-400">Reports Queue →</span>}
        >
          <DataTable columns={columns} rows={queue} onRowClick={onOpenReport} />
          <Pagination summary={`${queue.length} recent reports returned`} />
        </Card>

        <Card title="Report-category overview" subtitle="48 reports · 04 Oct–02 Nov">
          <ul className="space-y-2.5">
            {CATEGORY_OVERVIEW.map(([label, n]) => (
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
        </Card>
      </div>
    </>
  );
}

export default function ModeratorDashboard() {
  const navigate = useNavigate();
  return (
    <ModLayout crumbs={["Moderator", "Overview"]}>
      <OverviewContent onOpenReport={() => navigate("/moderator/sanctions")} />
    </ModLayout>
  );
}