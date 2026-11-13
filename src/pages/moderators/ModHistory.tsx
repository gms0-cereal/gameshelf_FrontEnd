import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import ModLayout from "../../components/layout/Modlayout";
import { Badge, Button, Card, Cell, DataTable, FilterSelect, Label, Notice, PageHeader, Pagination, RowAction, SearchInput, type Column } from "../../components/ui/Modui";
import {
  downloadHistoryCsv,
  errorMessage,
  getModerationHistory,
  getModerationHistoryDetail,
  type HistoryRow,
} from "../../lib/moderationApi";
import { useDebounced } from "../../lib/useDebounced";

// Values match ModerationAction.ActionType in Django.
const ACTION_TYPES = [
  { value: "", label: "All actions" },
  { value: "warn", label: "Warning" },
  { value: "suspend", label: "Suspension" },
  { value: "ban", label: "Ban" },
  { value: "dismiss_report", label: "Report dismissed" },
  { value: "other", label: "Other (status, revoke, appeal)" },
];

function HistoryContent({ onOpenReport }: { onOpenReport: (e: HistoryRow) => void }) {
  const [events, setEvents] = useState<HistoryRow[]>([]);
  const [related, setRelated] = useState<HistoryRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [actionType, setActionType] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const debouncedSearch = useDebounced(search);
  const selected = events.find((e) => e.id === selectedId) ?? events[0];

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setLoadError(null);
    getModerationHistory({ search: debouncedSearch.trim(), action_type: actionType })
      .then((h) => alive && setEvents(h))
      .catch((e) => alive && setLoadError(errorMessage(e)))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [debouncedSearch, actionType]);

  useEffect(() => {
    if (!selected) {
      setRelated([]);
      return;
    }
    let alive = true;
    getModerationHistoryDetail(selected.actionId)
      .then((d) => alive && setRelated(d.related))
      .catch(() => alive && setRelated([]));
    return () => {
      alive = false;
    };
  }, [selected?.actionId]);

  async function exportCsv() {
    setExporting(true);
    try {
      await downloadHistoryCsv();
    } catch (e) {
      setLoadError(errorMessage(e, "Export failed. Please try again."));
    } finally {
      setExporting(false);
    }
  }

  const columns: Column<HistoryRow>[] = [
    { key: "id", header: "Event ID", render: (e) => <span className="text-zinc-300">{e.id}</span> },
    { key: "date", header: "Date / Time ↓", render: (e) => <Cell main={e.date} sub={e.time} /> },
    { key: "actor", header: "Actor", render: (e) => <Cell main={e.actor} sub="Moderator" /> },
    { key: "action", header: "Action", render: (e) => <Cell main={e.action} sub={e.actionType} /> },
    { key: "record", header: "Affected record", render: (e) => <Cell main={e.record} sub={e.recordSub} /> },
    { key: "reason", header: "Recorded reason", render: (e) => <span className="text-zinc-400">{e.reason}</span>, className: "max-w-[220px]" },
    { key: "result", header: "Result", render: (e) => <Badge tone={e.resultTone}>{e.result}</Badge> },
    { key: "detail", header: "Detail", render: () => <RowAction>View</RowAction> },
  ];

  return (
    <>
      <PageHeader
        title="Moderation History"
        subtitle="Audit trail of moderation activity. Inspect the actor, reason and recorded state change."
        actions={<Button onClick={exportCsv} disabled={exporting}>{exporting ? "Exporting…" : "Export audit CSV ↗"}</Button>}
      />

      <Card className="mb-4" title="Audit trail" action={<span className="text-[9.5px] text-zinc-500">Read-only · Newest first · All times UTC</span>}>
        <div className="mb-3 flex flex-wrap items-end gap-2">
          <div className="min-w-[240px] flex-1">
            <Label>Search records</Label>
            <SearchInput
              placeholder="Search moderator, target user, reason or ID…"
              className="w-full"
              value={search}
              onChange={setSearch}
            />
          </div>
          <FilterSelect label="Action type" options={ACTION_TYPES} value={actionType} onChange={setActionType} />
          <Button
            variant="ghost"
            onClick={() => {
              setSearch("");
              setActionType("");
            }}
          >
            Reset filters
          </Button>
        </div>
        {loading ? (
          <p className="py-6 text-center text-[11px] text-zinc-400">Loading history...</p>
        ) : events.length === 0 && !loadError ? (
          <p className="py-6 text-center text-[11px] text-zinc-400">No moderation history found.</p>
        ) : (
          <DataTable columns={columns} rows={events} selectedId={selected?.id} onRowClick={(e) => setSelectedId(e.id)} />
        )}
        <Pagination summary={`${events.length} history entries`} />
      </Card>
      {loadError && <Notice tone="info" className="mb-4">{loadError}</Notice>}

      {selected && (
        <Card
          title={`${selected.id} · ${selected.action}`}
          action={
            <div className="flex items-center gap-3">
              <span className="text-[9.5px] text-zinc-500">{selected.date} · {selected.time}</span>
              {selected.reportId && selected.reportKind && (
                <Button onClick={() => onOpenReport(selected)}>View report #{selected.reportId} ↗</Button>
              )}
            </div>
          }
        >
          <div className="grid gap-4 md:grid-cols-3">
            <div><Label>Responsible actor</Label><p className="text-[11px] text-zinc-200">{selected.actor}</p></div>
            <div><Label>Target</Label><p className="text-[11px] text-zinc-200">{selected.record}</p></div>
            <div><Label>Linked records</Label><p className="text-[11px] text-zinc-200">{selected.recordSub}</p></div>
          </div>
          <div className="mt-4">
            <Label>Recorded reason</Label>
            <p className="text-[11px] text-zinc-200">{selected.reason}</p>
          </div>
          <div className="mt-4">
            <Label>Related actions</Label>
            {related.length === 0 ? (
              <p className="text-[11px] text-zinc-500">None.</p>
            ) : (
              <ul className="space-y-1 text-[10.5px] text-zinc-300">
                {related.map((r) => (
                  <li key={r.id}>
                    <span className="text-zinc-500">{r.date} {r.time}</span> · {r.actor} · {r.action}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      )}
    </>
  );
}

export default function ModHistory() {
  const navigate = useNavigate();
  return (
    <ModLayout crumbs={["Moderator", "Moderation History", "Audit trail"]}>
      <HistoryContent onOpenReport={(e) => navigate(`/moderator/sanctions?kind=${e.reportKind}&report=${e.reportId}`)} />
    </ModLayout>
  );
}