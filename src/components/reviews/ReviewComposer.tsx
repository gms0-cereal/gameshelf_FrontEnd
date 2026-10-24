import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ScoreStars } from "@/components/reviews/RatingParts";
import {
  apiErrorMessage,
  clearRating,
  createReview,
  setRating,
  updateReview,
  type GameshelfReview,
} from "@/services/Reviewservice";

const inputClass =
  "w-full rounded-lg border border-[#55516c] bg-[#2a2838] px-3.5 py-2.5 text-sm text-[#e0deeb] outline-none placeholder:text-[#8b86a3] focus:border-[#c2ade7]";

/** Rate a game (1-10) and/or write a review. Used on the Community reviews page. */
export default function ReviewComposer({
  appId,
  gameName,
  initial,
  myScore,
  onDone,
  onCancel,
}: {
  appId: number;
  gameName: string;
  initial?: GameshelfReview | null;
  myScore: number | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [score, setScore] = useState<number | null>(myScore);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [spoilers, setSpoilers] = useState(initial?.contains_spoilers ?? false);
  const [busy, setBusy] = useState(false);

  const scoreChanged = score !== null && score !== myScore;
  const textOk = content.trim().length >= 10;

  async function saveScore() {
    if (scoreChanged && score !== null) await setRating(appId, score);
  }

  async function postReview(event: React.FormEvent) {
    event.preventDefault();
    if (!textOk || busy) return;
    setBusy(true);
    try {
      await saveScore();
      const payload = {
        title: title.trim(),
        content: content.trim(),
        contains_spoilers: spoilers,
      };
      if (initial) await updateReview(initial.id, payload);
      else await createReview(appId, payload);

      toast.success(initial ? "Review updated" : "Review posted");
      onDone();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Couldn’t save your review."));
    } finally {
      setBusy(false);
    }
  }

  async function saveRatingOnly() {
    if (!scoreChanged || busy) return;
    setBusy(true);
    try {
      await saveScore();
      toast.success(`You rated ${gameName} ${score} / 10`);
      onDone();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Couldn’t save your rating."));
    } finally {
      setBusy(false);
    }
  }

  async function removeRating() {
    if (busy) return;
    setBusy(true);
    try {
      await clearRating(appId);
      setScore(null);
      toast.success("Rating removed");
      onDone();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Couldn’t remove your rating."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={postReview}
      aria-label={initial ? "Edit your review" : "Rate and review"}
      className="flex flex-col gap-4 rounded-xl border border-[#55516c] bg-[#373646] p-5"
    >
      <h3 className="text-base font-semibold">
        {initial ? "Edit your review" : `Rate & review ${gameName}`}
      </h3>

      <div className="flex flex-col gap-1.5">
        <p className="text-sm text-[#b4aec7]">
          Your score: {score !== null ? `${score} / 10` : "Not rated"}
        </p>
        <ScoreStars value={score} onChange={setScore} disabled={busy} />
        {myScore !== null && (
          <button
            type="button"
            onClick={removeRating}
            disabled={busy}
            className="w-fit cursor-pointer text-xs text-[#b4aec7] hover:text-[#e0deeb] disabled:opacity-50"
          >
            Clear my rating
          </button>
        )}
      </div>

      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        maxLength={255}
        placeholder="Headline (optional)"
        aria-label="Review headline"
        className={inputClass}
      />

      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        rows={5}
        maxLength={5000}
        placeholder="What stayed with you? (at least 10 characters)"
        aria-label="Review text"
        className={`${inputClass} resize-y`}
      />

      <label className="flex w-fit cursor-pointer items-center gap-2 text-xs text-[#b4aec7]">
        <input
          type="checkbox"
          checked={spoilers}
          onChange={(event) => setSpoilers(event.target.checked)}
          className="size-4 accent-[#7c5fc4]"
        />
        This review contains spoilers
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="submit"
          disabled={busy || !textOk}
          className="h-10 rounded-lg border-0 bg-[#a8484c] px-5 text-[13px] font-semibold text-[#e0deeb] shadow-none hover:bg-[#ae494e] disabled:opacity-60"
        >
          {busy ? "Saving…" : initial ? "Save changes" : "Post review"}
        </Button>

        {!initial && (
          <Button
            type="button"
            onClick={saveRatingOnly}
            disabled={busy || !scoreChanged}
            className="h-10 rounded-lg border border-[#55516c] bg-transparent px-5 text-[13px] font-semibold text-[#e0deeb] shadow-none hover:bg-[#46445a] disabled:opacity-50"
          >
            Save rating only
          </Button>
        )}

        <button
          type="button"
          onClick={onCancel}
          className="cursor-pointer text-xs text-[#b4aec7] hover:text-[#e0deeb]"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
