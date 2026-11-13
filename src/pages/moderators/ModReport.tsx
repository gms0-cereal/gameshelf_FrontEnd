import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import ModLayout from "../../components/layout/Modlayout";
import { priorityTone, reportStatusTone } from "./modeTones";
import { Badge, Button, Card, Cell, DataTable, FilterSelect, Notice, PageHeader, Pagination, RowAction, SearchInput, Tabs, type Column } from "../../components/ui/Modui";
import { errorMessage, getModerationDashboard, getModerationReports, humanize, type ReportRow } from "../../lib/moderationApi";
import { useDebounced } from "../../lib/useDebounced";

const TABS = [
  { label: "Open", status: "open", stat: "pending_reports" },
  { label: "Under review", status: "reviewing", stat: "under_review" },
  { label: "Resolved", status: "resolved", stat: "resolved_reports" },
  { label: "Dismissed", status: "dismissed", stat: null },
] as const;

const PRIORITIES = [
  { value: "", label: "All priorities" },
  { value: "high", label: "High" },
  { value: "normal", label: "Medium" },
];

function ReportsContent({ onOpen }: { onOpen: (r: ReportRow) => void }) {
  const [idx, setIdx] = useState(0);
  const [search, setSearch] = useState("");
  const [reason, setReason] = useState("");
  const [priority, setPriority] = useState("");
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [reasons, setReasons] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const debouncedSearch = useDebounced(search);

  useEffect(() => {
    getModerationDashboard()
      .then((d) => {
        setCounts({ ...d.stats });
        setReasons(d.reasons);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setLoadError(null);
    getModerationReports({
      status: TABS[idx].status,
      search: debouncedSearch.trim(),
      reason,
      priority: priority as "high" | "normal" | "",
    })
      .then((r) => alive && setRows(r))
      .catch((e) => alive && setLoadError(errorMessage(e)))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [idx, debouncedSearch, reason, priority]);

  const tabLabels = TABS.map((t) => (t.stat && counts[t.stat] != null ? `${t.label} (${counts[t.stat]})` : t.label));
  const reasonOptions = [{ value: "", label: "All categories" }, ...reasons.map((r) => ({ value: r, label: humanize(r) }))];
  const filtered = !!(search || reason || priority);

  const columns: Column<ReportRow>[] = [
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
        subtitle="Review community reports fairly. A report is an allegation, not a confirmed violation. Open a report to investigate and act."
      />

      <Card className="!p-0">
        <div className="p-4">
          <Tabs tabs={tabLabels} active={tabLabels[idx]} onChange={(t: string) => setIdx(Math.max(0, tabLabels.indexOf(t)))} />
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <SearchInput
              placeholder="Search report ID, reporter, details or content…"
              className="min-w-[260px] flex-1"
              value={search}
              onChange={setSearch}
            />
          </div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <FilterSelect options={reasonOptions} value={reason} onChange={setReason} />
            <FilterSelect options={PRIORITIES} value={priority} onChange={setPriority} />
            <Button
              variant="ghost"
              onClick={() => {
                setSearch("");
                setReason("");
                setPriority("");
              }}
            >
              Reset filters
            </Button>
          </div>
          <div className="mb-2 flex justify-between text-[10px] text-zinc-500">
            <span>{rows.length} results</span>
            <span>Date reported ↓ Newest first</span>
          </div>

          {loading ? (
            <p className="py-6 text-center text-[11px] text-zinc-400">Loading reports...</p>
          ) : rows.length === 0 && !loadError ? (
            <p className="py-6 text-center text-[11px] text-zinc-400">
              {filtered ? "No reports match these filters." : "No reports found."}
            </p>
          ) : (
            <DataTable columns={columns} rows={rows} onRowClick={onOpen} />
          )}
          <Pagination summary={`Showing ${rows.length} reports`} />
        </div>
      </Card>

      {loadError && <Notice tone="info" className="mt-3">{loadError}</Notice>}
    </>
  );
}

export default function ModReport() {
  const navigate = useNavigate();
  return (
    <ModLayout crumbs={["Moderator", "Reports Queue"]}>
      <ReportsContent onOpen={(r) => navigate(`/moderator/sanctions?kind=${r.kind}&report=${r.reportId}`)} />
    </ModLayout>
  );
}