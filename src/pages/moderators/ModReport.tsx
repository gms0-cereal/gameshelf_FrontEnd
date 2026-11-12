import { useNavigate } from "react-router-dom";
import ModLayout from "../../components/layout/Modlayout";
import { useEffect, useState } from "react";
import { priorityTone, reportStatusTone, type Report } from "./modData";
import { Badge, Button, Card, Cell, DataTable, FilterSelect, Notice, PageHeader, Pagination, RowAction, SearchInput, Tabs, type Column } from "../../components/ui/Modui";
import { getModerationReports } from "../../lib/moderationApi";

const REPORT_TABS = ["Open (10)", "Pending (12)", "Under review (6)", "Resolved (30)"] as const;

function ReportsContent({ onOpen }: { onOpen: (id: string) => void }) {
  const [tab, setTab] = useState<(typeof REPORT_TABS)[number]>("Open (10)");
  const [liveReports, setLiveReports] = useState<Report[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    getModerationReports("open")
      .then(setLiveReports)
      .catch(() => setLoadError("Live reports are unavailable. Check your moderator access and try again."));
  }, []);

  const columns: Column<Report>[] = [
    { key: "id", header: "Report ID", render: (r) => <span className="text-zinc-300">{r.id}</span> },
    { key: "reporter", header: "Reporter user", render: (r) => r.reporter },
    { key: "category", header: "Category", render: (r) => r.category },
    { key: "content", header: "Reported content", render: (r) => <Cell main={r.content} sub={r.contentSub} /> },
    { key: "date", header: "Date reported", render: (r) => <span className="text-zinc-400">{r.date}</span> },
    { key: "status", header: "Status", render: (r) => <Badge tone={reportStatusTone(r.status)}>{r.status}</Badge> },
    { key: "priority", header: "Priority", render: (r) => <Badge tone={priorityTone(r.priority)}>{r.priority}</Badge> },
    { key: "action", header: "Action", render: () => <RowAction>Open →</RowAction> },
  ];

  return (
    <>
      <PageHeader
        title="Reports Queue"
        subtitle="Review community reports fairly. A report is an allegation, not a confirmed violation. Open reports in Sanctions & Enforcement."
        actions={<Button>Export queue</Button>}
      />

      <Card className="!p-0">
        <div className="p-4">
          <Tabs tabs={REPORT_TABS} active={tab} onChange={setTab} />
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <SearchInput placeholder="Search report ID, reported user or content…" className="min-w-[260px] flex-1" />
            <Button>More filters</Button>
          </div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <FilterSelect options={["All categories", "Harassment", "Spam", "Spoilers"]} />
            <FilterSelect options={["All statuses", "Pending", "Under review", "Resolved"]} />
            <FilterSelect options={["All priorities", "High", "Medium", "Low"]} />
            <FilterSelect options={["04 Oct–02 Nov"]} />
            <Button variant="ghost">Reset filters</Button>
          </div>
          <div className="mb-2 flex justify-between text-[10px] text-zinc-500">
            <span>{liveReports.length} results visible · Bulk actions unavailable until selection</span>
            <span>Date reported ↓ Newest first</span>
          </div>
          <DataTable columns={columns} rows={liveReports} selectedId="R-1048" onRowClick={(r) => onOpen(r.id)} />
          <Pagination summary={`Showing ${liveReports.length} reports returned by the API`} />
        </div>
      </Card>

      {loadError && <Notice tone="info" className="mt-3">{loadError}</Notice>}
      <Notice tone="info" className="mt-3">
        Ratings flagged for unusual patterns remain unconfirmed. Examine account and content context before taking action.
      </Notice>
    </>
  );
}

export default function ModReport() {
  const navigate = useNavigate();
  return (
    <ModLayout crumbs={["Moderator", "Reports Queue"]}>
      <ReportsContent onOpen={() => navigate("/moderator/sanctions")} />
    </ModLayout>
  );
}