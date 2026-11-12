import ModLayout from "../../components/layout/Modlayout";
import { useEffect, useState } from "react";
import type { Appeal } from "./modData";
import { getAppeals } from "../../lib/moderationApi";
import { Avatar, BackButton, Badge, Button, Card, DataTable, Field, FilterSelect, Notice, PageHeader, Pagination, RowAction, SearchInput, StatCard, Tabs, TextArea, type Column } from "../../components/ui/Modui";

const APPEAL_TABS = ["Pending (3)", "Under review (2)", "Decided (11)", "All appeals (16)"] as const;

function AppealsList({ onOpen }: { onOpen: (id: string) => void }) {
  const [tab, setTab] = useState<(typeof APPEAL_TABS)[number]>("Pending (3)");
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    getAppeals().then(setAppeals).catch(() => setLoadError("Appeals are unavailable. Check your moderator access and try again."));
  }, []);

  const columns: Column<Appeal>[] = [
    { key: "id", header: "Appeal ID", render: (a) => <span className="text-zinc-300">{a.id}</span> },
    { key: "user", header: "Username", render: (a) => a.username },
    { key: "sanction", header: "Original sanction", render: (a) => a.sanction },
    { key: "submitted", header: "Submitted ↓", render: (a) => <span className="text-zinc-400">{a.submitted}</span> },
    { key: "reason", header: "User reason", render: (a) => <span className="text-zinc-400">{a.reason}</span>, className: "max-w-[220px]" },
    { key: "status", header: "Status", render: (a) => <Badge tone="amber">{a.status}</Badge> },
    { key: "action", header: "Action", render: () => <RowAction>Review →</RowAction> },
  ];

  return (
    <>
      <PageHeader
        title="Appeals Management"
        subtitle="Give each appeal an independent review of the decision, sanction and user explanation."
        actions={<Button>Export appeals</Button>}
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Pending appeals" value={3} hint="Awaiting an independent review" />
        <StatCard label="Under review" value={2} hint="Subject appeal in decision" />
        <StatCard label="Decided this period" value={11} hint="04 Oct–02 Nov 2026" />
        <StatCard label="Median decision time" value="18h 20m" hint="Across 11 decided appeals" />
      </div>

      <Card className="mb-4">
        <Tabs tabs={APPEAL_TABS} active={tab} onChange={setTab} />
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <SearchInput placeholder="Search appeal ID, username or sanction…" className="min-w-[260px] flex-1" />
          <Button>More filters</Button>
        </div>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <FilterSelect options={["All sanctions", "Warning", "Mute", "Suspension"]} />
          <FilterSelect options={["All statuses", "Pending", "Under review", "Decided"]} />
          <FilterSelect options={["04 Oct–02 Nov"]} />
          <Button variant="ghost">Reset filters</Button>
        </div>
        <DataTable columns={columns} rows={appeals} onRowClick={(a) => onOpen(a.id)} />
        <Pagination summary={`Showing ${appeals.length} appeals returned by the API`} />
      </Card>
      {loadError && <Notice tone="info" className="mb-4">{loadError}</Notice>}

      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Independent review" subtitle="Avoid conflicts of interest">
          <p className="text-[11px] leading-relaxed text-zinc-400">
            Original decision-makers cannot adjudicate their own appeals. Maya Ross may not review A-031; Noah Kim is excluded
            from its decision.
          </p>
          <p className="mt-3 text-[10px] text-zinc-500">Oldest pending · A-029 · 28 hours</p>
        </Card>
        <Card title="Decision requirements" subtitle="Every appeal needs a documented reason">
          <p className="text-[11px] leading-relaxed text-zinc-400">
            Review the original sanction and the user's explanation. Upholding, reducing, lifting or rejecting an appeal requires a
            recorded reason and user notification.
          </p>
          <Notice tone="info" className="mt-3">
            Appealing does not automatically lift an active restriction.
          </Notice>
        </Card>
      </div>
    </>
  );
}

function AppealDetails({ onBack }: { onBack: () => void }) {
  return (
    <>
      <PageHeader
        title="Appeal Details"
        subtitle="A-031 · PixelDrift · Submitted 02 Nov 2026, 08:35 UTC"
      />
      <div className="-mt-2 mb-4 flex items-center gap-2">
        <BackButton onClick={onBack}>Appeals Management</BackButton>
        <Badge tone="amber">Pending</Badge>
        <span className="text-[10px] text-zinc-500">Original sanction S-0208 remains active</span>
      </div>

      <div className="space-y-4">
        <Card title="User explanation" subtitle="Submitted by PixelDrift · U-1088">
          <p className="text-[11.5px] leading-relaxed text-zinc-200">
            “I understand that my replies were disrespectful, and I should have stopped after the mute. I have reread the
            guidelines. A week feels long; would you consider reducing the suspension? I will keep future replies focused on the
            games.”
          </p>
          <div className="mt-3 space-y-1 text-[10.5px]">
            <p><span className="text-zinc-500">Requested outcome</span> <span className="ml-3 text-zinc-300">Reduce suspension duration</span></p>
            <p><span className="text-zinc-500">Supporting material</span> <span className="ml-3 text-zinc-300">No new attachments submitted</span></p>
          </div>
        </Card>

        <Card title="Account & review ownership">
          <div className="mb-3 flex items-center gap-2">
            <Avatar initials="P" />
            <div className="text-[11px]">
              <p className="text-zinc-200">PixelDrift</p>
              <p className="text-[9.5px] text-zinc-500">Joined 02 Apr 2026 · U-1088</p>
            </div>
          </div>
          <Field label="Current status">Suspended until 08 Nov, 14:00 UTC</Field>
          <Field label="Original actor">Noah Kim · Cannot adjudicate this appeal</Field>
          <Field label="Reviewing actor">Maya Ross · Independent reviewer</Field>
        </Card>

        <Card title="Internal notes" subtitle="Staff-only. Not yet submitted">
          <p className="mb-3 text-[10.5px] text-zinc-400">
            02 Nov · 08:32 · Intake service linked A-031 to S-0208; no duplicate appeal found.
          </p>
          <div className="overflow-hidden rounded-md border border-[#2a2a33]">
            <div className="grid grid-cols-[1fr_2.2fr] border-b border-[#2a2a33] bg-[#121217] px-3 py-2 text-[9px] uppercase tracking-[0.1em] text-zinc-500">
              <span>Field</span>
              <span>Value</span>
            </div>
            <div className="grid grid-cols-[1fr_2.2fr] items-center gap-3 border-b border-[#22222a] px-3 py-3 text-[11px]">
              <span className="text-zinc-300">Proposed outcome</span>
              <select className="rounded-md border border-[#2a2a33] bg-[#121217] px-2.5 py-1.5 text-[11px] text-zinc-400">
                <option>Select an outcome</option>
                <option>Uphold</option>
                <option>Reduce</option>
                <option>Lift</option>
                <option>Reject</option>
              </select>
            </div>
            <div className="grid grid-cols-[1fr_2.2fr] items-center gap-3 border-b border-[#22222a] px-3 py-3 text-[11px]">
              <span className="text-zinc-300">New end date (if reducing)</span>
              <span className="text-zinc-500">Not selected</span>
            </div>
            <div className="grid grid-cols-[1fr_2.2fr] gap-3 border-b border-[#22222a] px-3 py-3 text-[11px]">
              <span className="text-zinc-300">Decision / internal reason *</span>
              <TextArea rows={3} placeholder="Explain the evidence considered, proportionality and decision…" />
            </div>
            <div className="grid grid-cols-[1fr_2.2fr] gap-3 px-3 py-3 text-[11px]">
              <span className="text-zinc-300">User-facing explanation *</span>
              <TextArea rows={3} placeholder="Give a clear policy-based explanation for the outcome…" />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button variant="danger" disabled>Review decision</Button>
            <Button>Cancel</Button>
          </div>
          <p className="mt-2 text-[9.5px] text-[#d9c27a]">
            A reason is required. The next step confirms the outcome before any restriction changes.
          </p>
        </Card>
      </div>
    </>
  );
}

export default function ModAppealManage() {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <ModLayout crumbs={["Moderator", "Appeals Management"]}>
      {openId ? <AppealDetails onBack={() => setOpenId(null)} /> : <AppealsList onOpen={setOpenId} />}
    </ModLayout>
  );
}