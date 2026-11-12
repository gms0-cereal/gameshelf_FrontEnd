import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import ModLayout from "../../components/layout/Modlayout";
import { CATEGORY_OVERVIEW, REPORTS, priorityTone, type Report } from "./modData";
import { Badge, Button, Card, DataTable, Notice, PageHeader, Pagination, RowAction, StatCard, type Column } from "./Modui";
import { getModerationDashboard, type ModerationDashboard } from "./moderationApi";

function OverviewContent({ onOpenReport }: { onOpenReport: () => void }) {
  const [dashboard, setDashboard] = useState<ModerationDashboard | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const queue = REPORTS.filter((r) => r.priority !== "Low").slice(0, 4);
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
        <StatCard label="Pending reports" value={dashboard?.pending_reports ?? 12} hint="Awaiting first review" />
        <StatCard label="Under review" value={dashboard?.under_review ?? 6} hint="Assigned moderator actions" />
        <StatCard label="Resolved reports" value={dashboard?.resolved_reports ?? 30} hint="Resolved reports" />
        <StatCard label="Active sanctions" value="—" hint="Sanction API not available yet" />
        <StatCard label="Pending appeals" value="—" hint="Appeal API not available yet" />
      </div>

      {loadError && <Notice tone="info" className="mb-4">{loadError}</Notice>}
      <Notice className="mb-4">
        1 high-priority report needs review. A-031 is awaiting an independent appeal decision.
      </Notice>

      <div className="grid gap-4 lg:grid-cols-[1.7fr_1fr]">
        <Card
          title="Prioritized work queue"
          subtitle="10 open reports · Ordered by impact, then age"
          action={<span className="text-[10px] text-zinc-400">Reports Queue →</span>}
        >
          <DataTable columns={columns} rows={queue} onRowClick={onOpenReport} />
          <Pagination summary="4 of 18 open · Oldest pending 3h 12m" />
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