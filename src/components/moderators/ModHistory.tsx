import { useNavigate } from "react-router-dom";
import ModLayout from "../layout/Modlayout";
import { useState } from "react";
import { AUDIT_EVENTS, type AuditEvent } from "./modData";
import { Badge, Button, Card, Cell, DataTable, FilterSelect, Label, PageHeader, Pagination, RowAction, SearchInput, type Column } from "./Modui";

function HistoryContent({ onOpenReport }: { onOpenReport: () => void }) {
  const [selectedId, setSelectedId] = useState("AU-0145");
  const selected = AUDIT_EVENTS.find((e) => e.id === selectedId) ?? AUDIT_EVENTS[0];

  const columns: Column<AuditEvent>[] = [
    { key: "id", header: "Event ID", render: (e) => <span className="text-zinc-300">{e.id}</span> },
    { key: "date", header: "Date / Time ↓", render: (e) => <Cell main={e.date} sub={e.time} /> },
    { key: "actor", header: "Actor", render: (e) => <Cell main={e.actor} sub={e.actorRole} /> },
    { key: "action", header: "Action", render: (e) => <Cell main={e.action} sub={e.actionType} /> },
    { key: "record", header: "Affected record", render: (e) => <Cell main={e.record} sub={e.recordSub} /> },
    { key: "reason", header: "Recorded reason", render: (e) => <span className="text-zinc-400">{e.reason}</span>, className: "max-w-[220px]" },
    { key: "result", header: "Result", render: (e) => <div><Badge tone={e.resultTone}>{e.result}</Badge><div className="mt-1 text-[9.5px] text-zinc-500">{e.resultSub}</div></div> },
    { key: "detail", header: "Detail", render: (e) => <RowAction>{e.detail}</RowAction> },
  ];

  return (
    <>
      <PageHeader
        title="Moderation History"
        subtitle="Audit trail of moderation activity. Inspect the actor, reason and recorded state change."
        actions={<Button>Export audit CSV ↗</Button>}
      />

      <Card className="mb-4" title="Audit trail" action={<span className="text-[9.5px] text-zinc-500">Read-only · Newest first · All times UTC</span>}>
        <div className="mb-3 flex flex-wrap items-end gap-2">
          <div className="min-w-[240px] flex-1">
            <Label>Search records</Label>
            <SearchInput placeholder="Search record, user or reason…" className="w-full" />
          </div>
          <FilterSelect label="Moderator" options={["All actors", "Maya Ross", "Noah Kim"]} />
          <FilterSelect label="Action type" options={["All actions", "Assignment", "Sanction", "Appeal intake"]} />
          <FilterSelect label="Target type" options={["All targets", "Report", "Appeal", "Sanction"]} />
          <FilterSelect label="Date range" options={["04 Oct–02 Nov"]} />
          <FilterSelect label="Result" options={["All results", "Assigned", "Applied", "Delivered"]} />
        </div>
        <DataTable columns={columns} rows={AUDIT_EVENTS} selectedId={selectedId} onRowClick={(e) => setSelectedId(e.id)} />
        <Pagination summary="1–5 of 5 events · 5 per page" />
        <p className="mt-3 text-[9.5px] text-zinc-500">
          Not completed: R-1048 review / proposed 24h mute · R-1044 review / visibility decision (RV-0524 still published) · A-031
          appeal decision. No draft is shown as an applied action.
        </p>
      </Card>

      <Card
        title={`${selected.id} · ${selected.action}`}
        action={
          <div className="flex items-center gap-3">
            <span className="text-[9.5px] text-zinc-500">{selected.date} · {selected.time.replace(" UTC", "")} UTC</span>
            <Button onClick={onOpenReport}>View report R-1048 ↗</Button>
          </div>
        }
      >
        <div className="grid gap-4 md:grid-cols-4">
          <div><Label>Responsible actor</Label><p className="text-[11px] text-zinc-200">{selected.actor} · {selected.actorRole}</p></div>
          <div><Label>Affected records</Label><p className="text-[11px] text-zinc-200">{selected.record.split(" · ")[0]} · {selected.recordSub}</p></div>
          <div><Label>Prior assignment</Label><p className="text-[11px] text-zinc-200">Unassigned</p></div>
          <div><Label>New assignment</Label><p className="text-[11px] text-zinc-200">Maya Ross</p></div>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <Label>Recorded reason</Label>
            <p className="text-[11px] text-zinc-200">
              Self-assigned for triage of the reported toxic / abusive review. Assignment is not an adjudication.
            </p>
          </div>
          <div>
            <Label>Preserved evidence reference</Label>
            <p className="text-[11px] text-violet-300">R-1048 · Reported review RV-0526 &amp; reporter explanation ↗</p>
            <p className="text-[9.5px] text-zinc-500">Staff-only evidence. Assignment does not alter source content.</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-md border border-[#2a2a33] bg-[#121217] px-3 py-2 text-[10.5px] text-zinc-400">
          <Badge tone="amber">Pending</Badge>
          No restriction change · AshRunner remains Active · RV-0526 remains published · Proposed 24h mute not confirmed or applied.
        </div>
      </Card>

      <p className="mt-4 text-[9.5px] leading-relaxed text-zinc-500">
        Read-only demo · Intended for authorized moderators. Audit records retain actor, UTC time, reason and evidence references;
        corrections should be new entries, not edits. Integrity and role access shown here are design intent, not a live
        implementation.
      </p>
    </>
  );
}

export default function ModHistory() {
  const navigate = useNavigate();
  return (
    <ModLayout crumbs={["Moderator", "Moderation History", "Audit trail"]}>
      <HistoryContent onOpenReport={() => navigate("/moderator/sanctions")} />
    </ModLayout>
  );
}