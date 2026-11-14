import { useEffect, useState } from "react";
import { errorMessage, getMySanctions, submitAppeal, type MySanction } from "../../lib/moderationApi";

export default function MyRestrictions() {
  const [items, setItems] = useState<MySanction[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function load() {
    try {
      setItems(await getMySanctions());
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  async function send(sanctionId: number) {
    setBusy(true);
    setError(null);
    try {
      await submitAppeal(sanctionId, reason.trim());
      setOpenId(null);
      setReason("");
      setSuccess("Appeal submitted. A moderator will review it.");
      await load();
    } catch (e) {
      setError(errorMessage(e, "Could not submit your appeal."));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p>Loading…</p>;

  return (
    <div className="mx-auto max-w-2xl space-y-3 p-4">
      <h1 className="text-xl font-semibold">My restrictions</h1>
      {success && <p>{success}</p>}
      {items.length === 0 && <p>You have no restrictions.</p>}

      {items.map((s) => (
        <div key={s.id} className="rounded border p-3">
          <p className="font-medium">{s.sanction_type} · {s.status}</p>
          <p>{s.reason}</p>
          <p className="text-sm opacity-70">
            {new Date(s.starts_at).toLocaleString()} → {s.ends_at ? new Date(s.ends_at).toLocaleString() : "Permanent"}
          </p>
          {s.appeal_status && <p className="text-sm">Appeal: {s.appeal_status.replace("_", " ")}</p>}

          {s.can_appeal && openId !== s.id && (
            <button onClick={() => { setOpenId(s.id); setError(null); setSuccess(null); }}>Appeal this restriction</button>
          )}

          {openId === s.id && (
            <div className="mt-2 space-y-2">
              <textarea
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why this restriction should be lifted…"
                className="w-full rounded border p-2"
              />
              {error && <p>{error}</p>}
              <button disabled={busy || !reason.trim()} onClick={() => send(s.id)}>
                {busy ? "Sending…" : "Submit appeal"}
              </button>
              <button disabled={busy} onClick={() => setOpenId(null)}>Cancel</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}