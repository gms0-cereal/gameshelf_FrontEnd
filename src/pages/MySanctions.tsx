import { useCallback, useEffect, useState } from "react";
import { errorMessage, getMySanctions, humanize, submitAppeal, type MySanction } from "../lib/moderationApi";

const APPEAL_LABEL: Record<string, string> = {
  pending: "Appeal pending",
  under_review: "Appeal under review",
  approved: "Appeal approved",
  rejected: "Appeal rejected",
};

export default function MySanctions() {
  const [items, setItems] = useState<MySanction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setItems(await getMySanctions());
      setLoadError(null);
    } catch (e) {
      setLoadError(errorMessage(e, "Unable to load your sanctions. Please try again."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function send(id: number) {
    setBusy(true);
    setActionError(null);
    setMessage(null);
    try {
      await submitAppeal(id, reason.trim());
      setOpenId(null);
      setReason("");
      setMessage("Your appeal was submitted. A moderator who did not issue the sanction will review it.");
      await load();
    } catch (e) {
      setActionError(errorMessage(e, "Your appeal could not be submitted."));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="p-6 text-sm text-slate-400">Loading your sanctions...</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-6">
      <h1 className="text-2xl font-bold text-white">My sanctions</h1>
      <p className="text-sm text-slate-400">
        If you believe a sanction was a mistake, you can appeal it. A moderator who did not issue it will review your appeal.
      </p>

      {message && <p className="rounded-md border border-green-700 bg-green-950 px-3 py-2 text-sm text-green-300">{message}</p>}
      {loadError && <p className="rounded-md border border-amber-700 bg-amber-950 px-3 py-2 text-sm text-amber-300">{loadError}</p>}
      {!loadError && items.length === 0 && <p className="text-sm text-slate-400">You have no sanctions on your account.</p>}

      {items.map((s) => (
        <section key={s.id} className="rounded-xl border border-slate-700 bg-slate-900 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-white">{humanize(s.sanction_type)}</h2>
            <span className="text-xs uppercase tracking-wide text-slate-400">{humanize(s.status)}</span>
          </div>
          <p className="mt-2 text-sm text-slate-300">{s.reason}</p>
          <p className="mt-2 text-xs text-slate-500">
            {new Date(s.starts_at).toLocaleString()} → {s.ends_at ? new Date(s.ends_at).toLocaleString() : "No end date"}
          </p>

          {s.appeal_status && (
            <p className="mt-3 text-sm text-violet-300">{APPEAL_LABEL[s.appeal_status]}</p>
          )}

          {s.can_appeal && openId !== s.id && (
            <button
              type="button"
              onClick={() => {
                setOpenId(s.id);
                setReason("");
                setActionError(null);
              }}
              className="mt-3 rounded-md border border-slate-600 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800"
            >
              Appeal this sanction
            </button>
          )}

          {openId === s.id && (
            <div className="mt-3 space-y-2">
              <textarea
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why you believe this sanction should be reviewed..."
                className="w-full rounded-md border border-slate-600 bg-slate-950 p-2 text-sm text-slate-200"
              />
              {actionError && <p className="text-sm text-amber-300">{actionError}</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busy || !reason.trim()}
                  onClick={() => send(s.id)}
                  className="rounded-md bg-violet-600 px-3 py-1.5 text-sm text-white disabled:opacity-40"
                >
                  {busy ? "Submitting…" : "Submit appeal"}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setOpenId(null)}
                  className="rounded-md border border-slate-600 px-3 py-1.5 text-sm text-slate-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}