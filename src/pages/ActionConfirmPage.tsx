import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ShieldAlert, Ban, ArrowLeft } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { blockUser, reportUser, removeFriend } from "@/services/Userservice";
import { toast } from "sonner";

export default function ActionConfirmPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const actionType = searchParams.get("type") || "block"; // block, report, unfriend
  const username = searchParams.get("username") || "";
  const displayName = searchParams.get("name") || username;

  const [reason, setReason] = useState("harassment");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!username) return;
    setLoading(true);

    try {
      if (actionType === "block") {
        await blockUser(username);
        toast.success(`Successfully blocked @${username}`);
      } else if (actionType === "report") {
        await reportUser(username, reason, details);
        toast.success(`Report submitted for @${username}`);
      } else if (actionType === "unfriend") {
        await removeFriend(username);
        toast.success(`Removed @${username} from your friends`);
      }
      navigate(-1);
    } catch {
      toast.error("Action failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#201e2f] text-[#e0deeb]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col">
        <Navbar />

        <main className="flex flex-1 items-center justify-center px-5 py-12">
          <div className="w-full max-w-lg rounded-2xl border border-[#55516c] bg-[#373646] p-8 shadow-xl">
            <button
              onClick={() => navigate(-1)}
              className="mb-6 flex items-center gap-2 text-xs font-medium text-[#b4aec7] hover:text-white"
            >
              <ArrowLeft className="size-4" /> Back
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex size-12 items-center justify-center rounded-xl bg-[#4a303d] text-[#e58d91]">
                {actionType === "report" ? <ShieldAlert className="size-6" /> : <Ban className="size-6" />}
              </div>
              <div>
                <h1 className="text-xl font-bold capitalize text-white">
                  {actionType} @{username}
                </h1>
                <p className="text-xs text-[#b4aec7]">Please confirm your action regarding {displayName}</p>
              </div>
            </div>

            {actionType === "report" && (
              <div className="my-6 flex flex-col gap-4">
                <div>
                  <label className="text-xs font-medium text-[#b4aec7]">Reason for report</label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="mt-1 h-11 w-full rounded-xl border border-[#55516c] bg-[#2a2838] px-4 text-xs text-[#e0deeb] outline-none focus:border-[#c2ade7]"
                  >
                    <option value="harassment">Harassment or Bullying</option>
                    <option value="spam">Spam or Scams</option>
                    <option value="inappropriate_profile">Inappropriate Profile Content</option>
                    <option value="cheating">Cheating / Fair Play Violation</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-[#b4aec7]">Additional Details</label>
                  <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Provide additional context..."
                    rows={4}
                    className="mt-1 w-full rounded-xl border border-[#55516c] bg-[#2a2838] p-4 text-xs text-[#e0deeb] outline-none placeholder:text-[#8b86a3] focus:border-[#c2ade7]"
                  />
                </div>
              </div>
            )}

            {actionType !== "report" && (
              <p className="my-6 text-sm text-[#b4aec7] leading-relaxed">
                Are you sure you want to {actionType} <span className="text-white font-semibold">{displayName}</span>? This action can be managed later from your account settings.
              </p>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-[#55516c]">
              <Button
                variant="outline"
                onClick={() => navigate(-1)}
                className="h-11 border-[#55516c] bg-transparent text-[#e0deeb] hover:bg-[#454256]"
              >
                Cancel
              </Button>
              <Button
                disabled={loading}
                onClick={handleConfirm}
                className="h-11 bg-[#a8484c] text-white hover:bg-[#b8565a]"
              >
                {loading ? "Processing..." : `Confirm ${actionType}`}
              </Button>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}