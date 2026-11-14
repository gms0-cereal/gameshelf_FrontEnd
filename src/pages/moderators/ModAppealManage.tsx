import { useCallback, useEffect, useState } from "react";
import ModLayout from "../../components/layout/Modlayout";
import { useDebounced } from "../../lib/useDebounced";
import { Avatar, BackButton, Badge, Button, Card, DataTable, Field, Notice, PageHeader, Pagination, SearchInput, RowAction, StatCard, Tabs, type Column } from "../../components/ui/Modui";
import { ModSelect, ModTextArea } from "../../components/ui/ModForm";
import {
  claimAppeal,
  decideAppeal,
  errorMessage,
  getAppeal,
  getAppealDashboard,
  getAppeals,
  type AppealDetail,
  type AppealRow,
} from "../../lib/moderationApi";

const TABS = [
  { label: "Pending", status: "pending" },
  { label: "Under review", status: "under_review" },
  { label: "Approved", status: "approved" },
  { label: "Rejected", status: "rejected" },
  { label: "All appeals", status: undefined },
] as const;

const statusTone = (s: AppealRow["rawStatus"]) =>
  s === "approved" ? "green" : s === "rejected" ? "red" : "amber";

function formatDuration(seconds: number) {
  if (!seconds) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

function AppealsList({ onOpen }: { onOpen: (id: number) => void }) {
  const [idx, setIdx] = useState(0);
  const [search, setSearch] = useState("");
  const [appeals, setAppeals] = useState<AppealRow[]>([]);
  const [stats, setStats] = useState<Awaited<ReturnType<typeof getAppealDashboard>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const debouncedSearch = useDebounced(search);

  useEffect(() => {
    getAppealDashboard().then(setStats).catch(() => {});
  }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setLoadError(null);
    getAppeals(TABS[idx].status, debouncedSearch.trim())
      .then((r) => alive && setAppeals(r))
      .catch((e) => alive && setLoadError(errorMessage(e)))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [idx, debouncedSearch]);

  const counts = [stats?.pending_appeals, stats?.under_review_appeals, stats?.approved_appeals, stats?.rejected_appeals, undefined];
  const tabLabels = TABS.map((t, i) => (counts[i] != null ? `${t.label} (${counts[i]})` : t.label));

  const columns: Column<AppealRow>[] = [
    { key: "id", header: "Appeal ID", render: (a) => <span className="text-zinc-300">{a.id}</span> },
    { key: "user", header: "Username", render: (a) => a.username },
    { key: "sanction", header: "Original sanction", render: (a) => a.sanction },
    { key: "submitted", header: "Submitted ↓", render: (a) => <span className="text-zinc-400">{a.submitted}</span> },
    { key: "reason", header: "User reason", render: (a) => <span className="text-zinc-400">{a.reason}</span>, className: "max-w-[220px]" },
    { key: "status", header: "Status", render: (a) => <Badge tone={statusTone(a.rawStatus)}>{a.status}</Badge> },
    { key: "action", header: "Action", render: () => <RowAction>Review →</RowAction> },
  ];

  return (
    <>
      <PageHeader
        title="Appeals Management"
        subtitle="Give each appeal an independent review of the decision, sanction and user explanation."
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Pending appeals" value={stats?.pending_appeals ?? "—"} hint="Awaiting an independent review" />
        <StatCard label="Under review" value={stats?.under_review_appeals ?? "—"} hint="Decision in progress" />
        <StatCard label="Decided" value={stats ? stats.approved_appeals + stats.rejected_appeals : "—"} hint="Approved or rejected" />
        <StatCard label="Average decision time" value={stats ? formatDuration(stats.average_resolution_seconds) : "—"} hint="Across decided appeals" />
      </div>

      <Card className="mb-4">
        <Tabs tabs={tabLabels} active={tabLabels[idx]} onChange={(t: string) => setIdx(Math.max(0, tabLabels.indexOf(t)))} />
        <div className="mb-3">
          <SearchInput
            placeholder="Search appeal ID or username…"
            className="w-full"
            value={search}
            onChange={setSearch}
          />
        </div>
        {loading ? (
          <p className="py-6 text-center text-[11px] text-zinc-400">Loading appeals...</p>
        ) : appeals.length === 0 && !loadError ? (
          <p className="py-6 text-center text-[11px] text-zinc-400">No appeals found.</p>
        ) : (
          <DataTable columns={columns} rows={appeals} onRowClick={(a) => onOpen(a.appealId)} />
        )}
        <Pagination summary={`Showing ${appeals.length} appeals`} />
      </Card>
      {loadError && <Notice tone="info" className="mb-4">{loadError}</Notice>}

      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Independent review" subtitle="Avoid conflicts of interest">
          <p className="text-[11px] leading-relaxed text-zinc-400">
            The moderator who issued a sanction cannot decide its appeal. Django enforces this rule.
          </p>
        </Card>
        <Card title="Decision requirements" subtitle="Every appeal needs a documented reason">
          <p className="text-[11px] leading-relaxed text-zinc-400">
            Approving an appeal revokes the sanction. Rejecting it upholds the sanction. Both require a recorded reason.
          </p>
          <Notice tone="info" className="mt-3">
            Appealing does not automatically lift an active restriction.
          </Notice>
        </Card>
      </div>
    </>
  );
}

function AppealDetails({ appealId, onBack }: { appealId: number; onBack: () => void }) {
  const [detail, setDetail] = useState<AppealDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [decision, setDecision] = useState<"" | "approved" | "rejected">("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  const load = useCallback(async () => {
    try {
      setDetail(await getAppeal(appealId));
      setLoadError(null);
    } catch (e) {
      setLoadError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [appealId]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  async function submit() {
    if (!decision) return;
    const verb = decision === "approved" ? "approve this appeal and revoke the sanction" : "reject this appeal and uphold the sanction";
    if (!window.confirm(`You are about to ${verb}. Continue?`)) return;
    setBusy(true);
    setActionError(null);
    setSuccess(null);
    try {
      await decideAppeal(appealId, {
        decision,
        decision_reason: reason.trim(),
        review_notes: notes.trim(),
      });
      await load();
      setDecision("");
      setReason("");
      setNotes("");
      setSuccess(decision === "approved" ? "Appeal approved and sanction revoked." : "Appeal rejected. Sanction upheld.");
    } catch (e) {
      setActionError(errorMessage(e, "The decision could not be saved. Nothing was changed."));
    } finally {
      setBusy(false);
    }
  }

  async function claim() {
    setBusy(true);
    setActionError(null);
    setSuccess(null);
    try {
      await claimAppeal(appealId);
      await load();
      setSuccess("Appeal claimed. It is now under review.");
    } catch (e) {
      setActionError(errorMessage(e, "Could not claim this appeal."));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="text-[11px] text-zinc-400">Loading appeal...</p>;
  if (loadError || !detail) {
    return (
      <>
        <BackButton onClick={onBack}>Appeals Management</BackButton>
        <Notice tone="info" className="mt-3">{loadError ?? "Appeal not found."}</Notice>
      </>
    );
  }

  const { appeal, sanction, actions = [] } = detail;
  const decidable = appeal.rawStatus === "pending" || appeal.rawStatus === "under_review";
  const evidence = appeal.evidence ? JSON.stringify(appeal.evidence, null, 2) : null;

  return (
    <>
      <PageHeader title="Appeal Details" subtitle={`${appeal.id} · ${appeal.username} · Submitted ${appeal.submitted}`} />
      <div className="-mt-2 mb-4 flex items-center gap-2">
        <BackButton onClick={onBack}>Appeals Management</BackButton>
        <Badge tone={statusTone(appeal.rawStatus)}>{appeal.status}</Badge>
        <span className="text-[10px] text-zinc-500">
          {sanction
            ? `Original sanction ${sanction.id} is ${sanction.status?.toLowerCase() ?? "unknown"}`
            : "No linked sanction"}
        </span>
      </div>

      {success && <Notice className="mb-3">{success}</Notice>}

      <div className="space-y-4">
        <Card title="User explanation" subtitle={`Submitted by ${appeal.username}`}>
          <p className="whitespace-pre-wrap text-[11.5px] leading-relaxed text-zinc-200">{appeal.reason}</p>
          <div className="mt-3 space-y-1 text-[10.5px]">
            <p>
              <span className="text-zinc-500">Supporting material</span>
              <span className="ml-3 text-zinc-300">{evidence ? "" : "No attachments submitted"}</span>
            </p>
            {evidence && <pre className="overflow-x-auto rounded-md bg-[#121217] p-2 text-[10px] text-zinc-300">{evidence}</pre>}
          </div>
        </Card>

        <Card title="Original sanction">
          <div className="mb-3 flex items-center gap-2">
            <Avatar initials={appeal.username?.[0]?.toUpperCase() ?? "?"} />
            <p className="text-[11px] text-zinc-200">{appeal.username}</p>
          </div>
          {sanction ? (
            <>
              <Field label="Sanction">{sanction.id} · {sanction.action}</Field>
              <Field label="Reason given">{sanction.reason}</Field>
              <Field label="Period">{sanction.window}</Field>
              <Field label="Original actor">{sanction.moderator} · Cannot adjudicate this appeal</Field>
            </>
          ) : (
            <p className="text-[11px] text-zinc-400">No sanction is linked to this appeal.</p>
          )}
          {!decidable && (
            <>
              <Field label="Decided by">{appeal.reviewer || "—"}</Field>
              <Field label="Decision reason">{appeal.decisionReason || "—"}</Field>
            </>
          )}
        </Card>

        <Card title="Related moderation actions" subtitle="From the audit trail">
          {actions.length === 0 ? (
            <p className="text-[11px] text-zinc-400">No related actions.</p>
          ) : (
            <ul className="space-y-1.5 text-[10.5px] text-zinc-300">
              {actions.map((a) => (
                <li key={a.id}>
                  <span className="text-zinc-500">{new Date(a.created_at).toLocaleString()}</span> · {a.moderator} · {a.action_type}
                  {a.reason ? ` — ${a.reason}` : ""}
                </li>
              ))}
            </ul>
          )}
        </Card>

        {decidable && (
          <Card title="Decision" subtitle="Saved to Django and recorded in Moderation History">
            {appeal.rawStatus === "pending" && (
              <div className="mb-3">
                <Button disabled={busy} onClick={claim}>Claim for review</Button>
              </div>
            )}
            <div className="space-y-3">
              <ModSelect label="Outcome *" value={decision} onChange={(e) => setDecision(e.target.value as typeof decision)}>
                <option value="">Select an outcome</option>
                <option value="approved">Approve · revoke the sanction</option>
                <option value="rejected">Reject · uphold the sanction</option>
              </ModSelect>
              <ModTextArea
                label="Decision reason *"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain the evidence considered, proportionality and decision…"
              />
              <ModTextArea
                label="Internal notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Staff-only notes…"
              />
            </div>
            {actionError && <p className="mt-2 text-[10.5px] text-amber-300">{actionError}</p>}
            <div className="mt-3 flex gap-2">
              <Button variant="danger" disabled={busy || !decision || !reason.trim()} onClick={submit}>
                {busy ? "Saving…" : "Submit decision"}
              </Button>
              <Button onClick={onBack} disabled={busy}>Cancel</Button>
            </div>
            <p className="mt-2 text-[9.5px] text-[#d9c27a]">A reason is required before the decision can be submitted.</p>
          </Card>
        )}
      </div>
    </>
  );
}

export default function ModAppealManage() {
  const [openId, setOpenId] = useState<number | null>(null);

  return (
    <ModLayout crumbs={["Moderator", "Appeals Management"]}>
      {openId != null ? <AppealDetails appealId={openId} onBack={() => setOpenId(null)} /> : <AppealsList onOpen={setOpenId} />}
    </ModLayout>
  );
}