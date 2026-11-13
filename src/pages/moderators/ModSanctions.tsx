import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ModLayout from "../../components/layout/Modlayout";
import { priorityTone, reportStatusTone } from "./modeTones";
import { Avatar, BackButton, Badge, Button, Card, DataTable, Field, Notice, PageHeader, Pagination, type Column } from "../../components/ui/Modui";
import { ModInput, ModSelect, ModTextArea } from "../../components/ui/ModForm";
import {
  createSanction,
  errorMessage,
  getSanctionCase,
  revokeSanction,
  updateModerationReport,
  type ReportKind,
  type ReportStatus,
  type SanctionCase,
  type SanctionRow,
} from "../../lib/moderationApi";

// Must match UserSanction.Type.choices in Django. `temporary` = requires a duration.
const SANCTION_TYPES = [
  { value: "warning", label: "Warning", temporary: false },
  { value: "suspension", label: "Temporary suspension", temporary: true },
  { value: "restriction", label: "Temporary restriction", temporary: true },
  { value: "ban", label: "Permanent ban", temporary: false },
];

function EnforcementCase({ kind, reportId, onBack }: { kind: ReportKind; reportId: number; onBack: () => void }) {
  const [data, setData] = useState<SanctionCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [type, setType] = useState(SANCTION_TYPES[0].value);
  const [duration, setDuration] = useState("7");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await getSanctionCase(reportId, kind));
      setLoadError(null);
    } catch (e) {
      setLoadError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [reportId, kind]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  async function run(fn: () => Promise<unknown>, okMessage: string) {
    setBusy(true);
    setActionError(null);
    setSuccess(null);
    try {
      await fn();
      await load(); // refresh from Django, never from local guesses
      setSuccess(okMessage);
    } catch (e) {
      setActionError(errorMessage(e, "The action failed. Nothing was changed."));
    } finally {
      setBusy(false);
    }
  }

  const setStatus = (status: ReportStatus, msg: string) =>
    run(() => updateModerationReport(kind, reportId, status), msg);

  const selected = SANCTION_TYPES.find((t) => t.value === type)!;
  const report = data?.report;
  const target = data?.reportedUser ?? null;
  const reportOpen = report?.rawStatus === "open" || report?.rawStatus === "reviewing";
  const canSubmit = !!target && reason.trim().length > 0 && confirmed && !busy;

  function submitSanction() {
    if (!target || !report) return;
    run(async () => {
      await createSanction({
        user_id: target.id,
        report_id: reportId,
        report_kind: kind,
        sanction_type: type,
        duration: selected.temporary ? Number(duration) : null,
        reason: reason.trim(),
        internal_notes: notes.trim(),
      });
      // Django records the sanction but doesn't close the report, so we do it.
      if (report.rawStatus === "open" || report.rawStatus === "reviewing") {
        await updateModerationReport(kind, reportId, "resolved");
      }
      setReason("");
      setNotes("");
      setConfirmed(false);
    }, "Sanction issued and report resolved.");
  }

  function revoke(s: SanctionRow) {
    const why = window.prompt(`Reason for revoking ${s.id}?`);
    if (!why || !why.trim()) return;
    run(() => revokeSanction(s.sanctionId, why.trim()), `${s.id} revoked.`);
  }

  const columns: Column<SanctionRow>[] = [
    { key: "id", header: "Sanction", render: (s) => s.id },
    { key: "action", header: "Action", render: (s) => s.action },
    { key: "reason", header: "Reason", render: (s) => s.reason },
    { key: "mod", header: "Moderator", render: (s) => s.moderator },
    { key: "window", header: "Start / End", render: (s) => <span className="text-zinc-400">{s.window}</span> },
    { key: "status", header: "Status", render: (s) => <Badge tone={s.tone}>{s.status}</Badge> },
    {
      key: "revoke",
      header: "Revoke",
      render: (s) =>
        s.rawStatus === "active" || s.rawStatus === "permanent" ? (
          <button
            type="button"
            disabled={busy}
            onClick={(e) => {
              e.stopPropagation();
              revoke(s);
            }}
            className="text-[10px] text-violet-300 hover:text-white disabled:opacity-50"
          >
            Revoke
          </button>
        ) : (
          <span className="text-[10px] text-zinc-600">—</span>
        ),
    },
  ];

  if (loading) return <p className="text-[11px] text-zinc-400">Loading report...</p>;
  if (loadError || !data || !report) {
    return (
      <>
        <BackButton onClick={onBack}>Back to queue</BackButton>
        <Notice tone="info" className="mt-3">{loadError ?? "Report not found."}</Notice>
      </>
    );
  }

  const activeCount = data.sanctions.filter((s) => s.rawStatus === "active" || s.rawStatus === "permanent").length;

  return (
    <>
      <PageHeader
        title="Sanctions & Enforcement"
        subtitle="Review the report, then dismiss it or issue a proportionate sanction. Every action is saved by Django and recorded in Moderation History."
      />

      {success && <Notice className="mb-3">{success}</Notice>}
      {actionError && <p className="mb-3 text-[10.5px] text-amber-300">{actionError}</p>}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <BackButton onClick={onBack}>Back to queue</BackButton>
        <span className="text-[10px] text-zinc-500">{report.id} · {report.category} · Reported {report.date}</span>
        <Badge tone={reportStatusTone(report.status)}>{report.status}</Badge>
        <Badge tone={priorityTone(report.priority)}>{report.priority}</Badge>
      </div>

      <div className="mb-4 grid gap-4 lg:grid-cols-[1.7fr_1fr]">
        <div className="space-y-4">
          <Card title="Reported content" subtitle={report.contentSub}>
            <div className="mb-2 flex items-center gap-2">
              <Avatar initials={(report.reportedUser[0] ?? "?").toUpperCase()} />
              <p className="text-[11px] text-zinc-200">{report.reportedUser || "Unknown user"}</p>
            </div>
            <p className="text-[11.5px] leading-relaxed text-zinc-300">{report.content || "No content available."}</p>
            <Notice className="mt-3">User report only. No automated determination of a violation.</Notice>
          </Card>

          <Card title="Reporter explanation" subtitle={`Reporter: ${report.reporter}`}>
            <p className="text-[11.5px] leading-relaxed text-zinc-300">
              <span className="text-zinc-500">Reason · </span>{report.category}
            </p>
            <p className="mt-2 text-[11.5px] leading-relaxed text-zinc-300">
              {report.details || "The reporter gave no additional details."}
            </p>
            <p className="mt-2 text-[9.5px] text-zinc-500">
              Reporter identity is visible only to authorized safety staff. Do not share with the reported user.
            </p>
          </Card>
        </div>

        <div className="space-y-4">
          <Card title="Reported user">
            {target ? (
              <>
                <div className="mb-2 flex items-center gap-2">
                  <Avatar initials={target.username[0]?.toUpperCase() ?? "?"} />
                  <div className="text-[11px]">
                    <p className="text-zinc-200">{target.username}</p>
                    <p className="text-[9.5px] text-zinc-500">User #{target.id}</p>
                  </div>
                </div>
                <Field label="Active sanctions">{activeCount === 0 ? "None" : activeCount}</Field>
                <Field label="Prior record">{data.sanctions.length} sanction(s) on file</Field>
              </>
            ) : (
              <p className="text-[11px] text-zinc-400">The reported user could not be determined (content may have been removed).</p>
            )}
          </Card>

          <Card title="Report decision" subtitle="Updates the report in Django">
            <div className="flex flex-wrap gap-2">
              <Button
                variant="danger"
                disabled={busy || report.rawStatus === "reviewing"}
                onClick={() => setStatus("reviewing", "Report marked as under review.")}
              >
                Mark under review
              </Button>
              <Button
                disabled={busy || report.rawStatus === "dismissed"}
                onClick={() => setStatus("dismissed", "Report dismissed.")}
              >
                Dismiss report
              </Button>
              {(report.rawStatus === "resolved" || report.rawStatus === "dismissed") && (
                <Button disabled={busy} onClick={() => setStatus("reviewing", "Report reopened for review.")}>
                  Reopen
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>

      <Card title="Prepare enforcement" subtitle="Nothing is applied until you confirm" className="mb-4">
        <div className="mb-3 grid gap-3 md:grid-cols-2">
          <ModSelect label="Sanction type *" value={type} onChange={(e) => setType(e.target.value)}>
            {SANCTION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </ModSelect>
          {selected.temporary ? (
            <ModInput
              label="Duration (days) *"
              type="number"
              min={1}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          ) : (
            <div>
              <span className="mb-1 block text-[9px] uppercase tracking-[0.1em] text-zinc-500">Duration</span>
              <p className="pt-1.5 text-[10.5px] text-zinc-400">Not applicable for this sanction type</p>
            </div>
          )}
        </div>
        <div className="space-y-3">
          <ModTextArea
            label="User-facing reason *"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain the specific incident, the guidelines, and the appeal route…"
          />
          <ModTextArea
            label="Internal moderator notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Staff-only assessment and policy reference…"
          />
        </div>
        <label className="mt-3 flex items-start gap-2 text-[10.5px] text-zinc-300">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-0.5 accent-violet-500"
          />
          I reviewed the content and context. I understand this action will create an audit record
          {target ? ` and apply to ${target.username}` : ""}.
        </label>
        <div className="mt-3 flex gap-2">
          <Button variant="danger" disabled={!canSubmit} onClick={submitSanction}>
            {busy ? "Saving…" : "Confirm sanction"}
          </Button>
          <Button
            disabled={busy}
            onClick={() => {
              setReason("");
              setNotes("");
              setConfirmed(false);
            }}
          >
            Clear
          </Button>
        </div>
        {!reportOpen && (
          <p className="mt-2 text-[9.5px] text-zinc-500">
            This report is already {report.status.toLowerCase()}; its status won't change when a sanction is issued.
          </p>
        )}
      </Card>

      <Card title="Prior-sanctions table" subtitle={target ? `${target.username} · Complete moderation history` : undefined}>
        {data.sanctions.length === 0 ? (
          <p className="text-[11px] text-zinc-400">No active sanctions.</p>
        ) : (
          <DataTable columns={columns} rows={data.sanctions} />
        )}
        <Pagination summary={`${data.sanctions.length} sanctions on file`} />
      </Card>
    </>
  );
}

export default function ModSanctions() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const kind = params.get("kind") as ReportKind | null;
  const reportId = Number(params.get("report"));
  const valid = (kind === "review" || kind === "comment" || kind === "playlist") && Number.isInteger(reportId) && reportId > 0;

  return (
    <ModLayout crumbs={["Moderator", "Sanctions & Enforcement"]}>
      {valid ? (
        <EnforcementCase kind={kind!} reportId={reportId} onBack={() => navigate("/moderator/reports")} />
      ) : (
        <>
          <PageHeader title="Sanctions & Enforcement" subtitle="Open a report from the Reports Queue to review it and take action." />
          <Button onClick={() => navigate("/moderator/reports")}>Go to Reports Queue</Button>
        </>
      )}
    </ModLayout>
  );
}