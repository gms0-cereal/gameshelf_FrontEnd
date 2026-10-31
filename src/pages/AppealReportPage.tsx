import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Send, ShieldAlert, UserX, Gavel } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import api from "@/lib/api";

type TicketType = "ban_appeal" | "user_report";

export interface UserSanction {
  id: number;
  sanction_type: "warning" | "suspension" | "ban";
  reason: string;
  starts_at: string;
  ends_at: string | null;
  revoked_at: string | null;
  created_at: string;
}

const PANEL =
  "gap-6 rounded-2xl border-0 bg-[#373646] p-7 " +
  "text-[#e0deeb] shadow-none ring-1 ring-inset ring-[#55516c]";

const FIELD =
  "border-[#55516c] bg-[#29263b] text-[#e0deeb] " +
  "placeholder:text-[#8f899f] focus-visible:ring-[#8870b6]";

const LABEL = "text-xs font-semibold uppercase tracking-wider text-[#c2ade7]";

const OUTLINE_BUTTON =
  "h-11 gap-2 rounded-lg border border-[#55516c] " +
  "bg-[#373646] px-5 text-sm font-semibold text-[#e0deeb] " +
  "hover:bg-[#454256] hover:text-[#e0deeb]";

export default function AppealReportPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialType: TicketType =
    searchParams.get("type") === "report" ? "user_report" : "ban_appeal";
  const initialUser = searchParams.get("user") || "";

  const [type, setType] = useState<TicketType>(initialType);
  const [targetUser, setTargetUser] = useState(initialUser);

  // Appeal fields matching SanctionAppeal
  const [sanctions, setSanctions] = useState<UserSanction[]>([]);
  const [selectedSanctionId, setSelectedSanctionId] = useState<string>("");
  const [message, setMessage] = useState("");
  const [loadingSanctions, setLoadingSanctions] = useState(false);

  // Report fields
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Load user's active sanctions when on the appeal tab
  useEffect(() => {
    if (type !== "ban_appeal") return;

    let cancelled = false;
    setLoadingSanctions(true);

    api
      .get<UserSanction[]>("/sanctions/my/")
      .then(({ data }) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : [];
        setSanctions(list);
        if (list.length > 0) {
          setSelectedSanctionId(String(list[0].id));
        }
      })
      .catch(() => {
        // Fallback for non-sanction endpoints
      })
      .finally(() => {
        if (!cancelled) setLoadingSanctions(false);
      });

    return () => {
      cancelled = true;
    };
  }, [type]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (type === "ban_appeal") {
      if (!selectedSanctionId) {
        setError("Please select a sanction to appeal.");
        return;
      }
      if (!message.trim()) {
        setError("Please provide an appeal message explaining your case.");
        return;
      }
    } else {
      if (!targetUser.trim()) {
        setError("Please specify the username of the player you are reporting.");
        return;
      }
      if (!reportReason.trim() || !reportDetails.trim()) {
        setError("Please fill in both the reason and detailed evidence.");
        return;
      }
    }

    setSubmitting(true);

    try {
      if (type === "ban_appeal") {
        await api.post("/sanctions/appeals/", {
          sanction: Number(selectedSanctionId),
          message: message.trim(),
        });
      } else {
        await api.post("/reports/", {
          username: targetUser.trim(),
          reason: reportReason.trim(),
          details: reportDetails.trim(),
        });
      }

      setSuccess(true);
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Failed to submit ticket. Please verify your details."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#201e2f] text-[#e0deeb]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col">
        <Navbar />

        <main className="mx-auto w-full max-w-2xl flex-1 px-5 pb-16 pt-11 md:px-8">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#b4aec7]">
                Support & Conduct
              </p>
              <h1 className="text-3xl font-semibold text-white">
                {type === "ban_appeal" ? "Sanction Appeal" : "Report Misdemeanor"}
              </h1>
            </div>

            <Button asChild variant="outline" className={OUTLINE_BUTTON}>
              <Link to="/home">
                <ArrowLeft size={18} />
                Back
              </Link>
            </Button>
          </div>

          <Card className={PANEL}>
            {/* Ticket Type Switcher */}
            <div className="grid grid-cols-2 gap-2 rounded-xl border border-[#55516c] bg-[#29263b] p-1">
              <button
                type="button"
                onClick={() => {
                  setType("ban_appeal");
                  setError(null);
                }}
                className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold transition-all ${
                  type === "ban_appeal"
                    ? "bg-[#8870b6] text-white shadow"
                    : "text-[#8f899f] hover:text-white"
                }`}
              >
                <ShieldAlert className="size-4" />
                Appeal Sanction
              </button>
              <button
                type="button"
                onClick={() => {
                  setType("user_report");
                  setError(null);
                }}
                className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold transition-all ${
                  type === "user_report"
                    ? "bg-[#a8454b] text-white shadow"
                    : "text-[#8f899f] hover:text-white"
                }`}
              >
                <UserX className="size-4" />
                Report Player
              </button>
            </div>

            {success ? (
              <div className="my-10 flex flex-col items-center gap-4 text-center">
                <div className="flex size-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                  <Send className="size-7" />
                </div>
                <h2 className="text-xl font-semibold text-white">
                  {type === "ban_appeal" ? "Appeal Submitted" : "Report Filed"}
                </h2>
                <p className="max-w-md text-xs text-[#b4aec7]">
                  Your submission is now recorded under <code className="text-[#c2ade7]">Status: OPEN</code>. A moderator will review your case shortly.
                </p>
                <Button
                  onClick={() => navigate("/home")}
                  className="mt-2 bg-[#8870b6] text-white hover:bg-[#76609f]"
                >
                  Return to Home
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {type === "ban_appeal" ? (
                  <>
                    {/* Select Sanction to Appeal */}
                    <div className="flex flex-col gap-2">
                      <label className={LABEL}>Select Sanction</label>
                      {loadingSanctions ? (
                        <p className="text-xs text-[#8f899f]">Loading active sanctions...</p>
                      ) : sanctions.length > 0 ? (
                        <select
                          value={selectedSanctionId}
                          onChange={(e) => setSelectedSanctionId(e.target.value)}
                          className={`h-11 rounded-lg border px-3 text-sm ${FIELD}`}
                        >
                          {sanctions.map((s) => (
                            <option key={s.id} value={s.id}>
                              [{s.sanction_type.toUpperCase()}] {s.reason} ({new Date(s.created_at).toLocaleDateString()})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="flex items-center gap-2 rounded-xl border border-[#55516c] bg-[#29263b] p-4 text-xs text-[#b4aec7]">
                          <Gavel className="size-4 text-[#c2ade7] shrink-0" />
                          <span>No active account sanctions found registered to your profile.</span>
                        </div>
                      )}
                    </div>

                    {/* Appeal Message */}
                    <div className="flex flex-col gap-2">
                      <label className={LABEL}>Appeal Explanation Message</label>
                      <Textarea
                        maxLength={1000}
                        placeholder="State your reasons why this sanction should be reconsidered or overturned..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className={`${FIELD} min-h-36 max-h-48 resize-y`}
                      />
                      <p className="text-right text-[11px] text-[#8f899f]">{message.length}/1000</p>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Target Player Username */}
                    <div className="flex flex-col gap-2">
                      <label className={LABEL}>Offending Player's Username</label>
                      <Input
                        type="text"
                        placeholder="e.g. toxic_player123"
                        value={targetUser}
                        onChange={(e) => setTargetUser(e.target.value)}
                        className={FIELD}
                      />
                    </div>

                    {/* Brief Reason */}
                    <div className="flex flex-col gap-2">
                      <label className={LABEL}>Offense Category</label>
                      <Input
                        type="text"
                        maxLength={100}
                        placeholder="e.g. Harassment, Cheating/Exploiting, Offensive Content"
                        value={reportReason}
                        onChange={(e) => setReportReason(e.target.value)}
                        className={FIELD}
                      />
                    </div>

                    {/* Report Evidence Details */}
                    <div className="flex flex-col gap-2">
                      <label className={LABEL}>Detailed Context & Evidence</label>
                      <Textarea
                        maxLength={1000}
                        placeholder="Provide details, dates, chat log excerpts, or links to evidence..."
                        value={reportDetails}
                        onChange={(e) => setReportDetails(e.target.value)}
                        className={`${FIELD} min-h-32 max-h-48 resize-y`}
                      />
                      <p className="text-right text-[11px] text-[#8f899f]">{reportDetails.length}/1000</p>
                    </div>
                  </>
                )}

                {error && (
                  <div className="flex items-center gap-2 rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-300">
                    <AlertTriangle className="size-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="mt-2 flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(-1)}
                    className="border-[#55516c] bg-transparent text-[#d0ccdc] hover:bg-[#373646]"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className={
                      type === "ban_appeal"
                        ? "bg-[#8870b6] text-white hover:bg-[#76609f]"
                        : "bg-[#a8454b] text-white hover:bg-[#923b40]"
                    }
                  >
                    {submitting ? "Submitting..." : "Submit Appeal Ticket"}
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </main>

        <Footer />
      </div>
    </div>
  );
}