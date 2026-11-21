import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, Loader2, ShieldAlert } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/context/AuthContext";
import { errorMessage, getMySanctions, submitAppeal, type MySanction } from "@/lib/moderationApi";

const STATUS_STYLES: Record<string, string> = {
  active: "border-[#E58B91]/40 bg-[#E58B91]/10 text-[#E58B91]",
  revoked: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  expired: "border-[#302438] bg-[#000000] text-[#A0A0A8]",
};

const APPEAL_STYLES: Record<string, string> = {
  pending: "border-[#B39ACF]/40 bg-[#B39ACF]/10 text-[#B39ACF]",
  under_review: "border-[#B39ACF]/40 bg-[#B39ACF]/10 text-[#B39ACF]",
  approved: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  rejected: "border-[#E58B91]/40 bg-[#E58B91]/10 text-[#E58B91]",
};

function Badge({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize ${className}`}>
      {children}
    </span>
  );
}

const primaryBtn =
  "inline-flex h-9 cursor-pointer items-center rounded-xl bg-[#B39ACF] px-4 text-xs font-bold text-[#17191E] transition-colors hover:bg-[#C2ADE0] disabled:cursor-not-allowed disabled:opacity-60";
const secondaryBtn =
  "inline-flex h-9 cursor-pointer items-center rounded-xl border border-[#302438] bg-[#17191E] px-4 text-xs font-semibold text-[#E6E1EA] transition-colors hover:border-[#554363] hover:bg-[#20232B] disabled:opacity-60";

export default function MyRestrictions() {
  const { user } = useAuth();
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

  return (
    <div className="min-h-screen w-full bg-[#000000]">
      <div
        className="flex min-h-screen w-full flex-col bg-[#000000] text-[#E6E1EA] antialiased"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <Navbar />

        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-5 pb-16 pt-11 md:px-8">
          {/* Header, same pattern as Home */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col gap-2"
          >
            <p className="text-[13px] uppercase leading-4 tracking-wider text-[#B39ACF]">
              {user?.nickname || user?.username || "Your account"}
            </p>
            <h1 className="text-[36px] font-semibold leading-[41px] tracking-[-0.8px] text-[#E6E1EA]">
              My restrictions
            </h1>
            <p className="text-[13px] leading-5 text-[#A0A0A8]">
              Review actions taken on your account and appeal if you think a mistake was made.
            </p>
          </motion.div>

          {success && (
            <div
              role="status"
              className="flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-xs text-emerald-300"
            >
              <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
              {success}
            </div>
          )}

          {/* Page-level error (hidden while an appeal form is open; it shows under the textarea) */}
          {error && openId === null && (
            <p role="alert" className="rounded-xl border border-[#E58B91]/40 bg-[#E58B91]/10 p-4 text-xs text-[#E58B91]">
              {error}
            </p>
          )}

          {loading && (
            <p role="status" className="flex items-center justify-center gap-2 py-16 text-sm text-[#A0A0A8]">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Loading…
            </p>
          )}

          {!loading && items.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[#302438] bg-[#17191E] px-6 py-10 text-center">
              <CheckCircle2 className="mx-auto size-8 text-emerald-300" strokeWidth={1.5} aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold">You have no restrictions.</p>
              <p className="mt-1 text-xs text-[#A0A0A8]">Your account is in good standing.</p>
              <Link to="/home" className={`${primaryBtn} mt-5`}>
                Back to Home
              </Link>
            </div>
          )}

          {items.map((s, i) => (
            <motion.section
              key={s.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: "easeOut", delay: i * 0.05 }}
              className="flex flex-col gap-4 rounded-2xl border border-[#302438] bg-[#17191E] p-6"
            >
              <div className="flex flex-wrap items-center gap-2">
                <ShieldAlert className="size-5 text-[#B39ACF]" aria-hidden="true" />
                <h2 className="text-[18px] font-semibold capitalize leading-6">
                  {s.sanction_type.replace(/_/g, " ")}
                </h2>
                <Badge className={STATUS_STYLES[s.status] ?? STATUS_STYLES.expired}>{s.status}</Badge>
                {s.appeal_status && (
                  <Badge className={APPEAL_STYLES[s.appeal_status] ?? APPEAL_STYLES.pending}>
                    Appeal: {s.appeal_status.replace(/_/g, " ")}
                  </Badge>
                )}
              </div>

              <p className="text-xs leading-5 text-[#C9C4CF]">{s.reason}</p>

              <p className="flex items-center gap-1.5 text-[11px] text-[#A0A0A8]">
                <Clock className="size-3.5" aria-hidden="true" />
                {new Date(s.starts_at).toLocaleString()} →{" "}
                {s.ends_at ? new Date(s.ends_at).toLocaleString() : "Permanent"}
              </p>

              {s.can_appeal && openId !== s.id && (
                <button
                  type="button"
                  className={`${primaryBtn} w-fit`}
                  onClick={() => { setOpenId(s.id); setError(null); setSuccess(null); }}
                >
                  Appeal this restriction
                </button>
              )}

              {openId === s.id && (
                <div className="flex flex-col gap-3 border-t border-[#302438] pt-4">
                  <label htmlFor={`appeal-${s.id}`} className="text-[11px] font-semibold">
                    Why should this restriction be lifted?
                  </label>
                  <textarea
                    id={`appeal-${s.id}`}
                    rows={4}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Explain your side…"
                    className="w-full rounded-xl border border-[#302438] bg-[#000000] p-3 text-xs text-[#E6E1EA] outline-none transition-colors placeholder:text-[#77717F] hover:border-[#554363] focus:border-[#B39ACF] focus:ring-1 focus:ring-[#B39ACF]/20"
                  />
                  {error && (
                    <p role="alert" className="text-[11px] text-[#E58B91]">
                      {error}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      disabled={busy || !reason.trim()}
                      onClick={() => send(s.id)}
                      className={primaryBtn}
                    >
                      {busy ? "Sending…" : "Submit appeal"}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => { setOpenId(null); setError(null); }}
                      className={secondaryBtn}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </motion.section>
          ))}
        </main>

        <Footer />
      </div>
    </div>
  );
}