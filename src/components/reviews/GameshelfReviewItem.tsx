import { useState,useMemo, } from "react";
import { Heart, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import CommentItem from "@/components/reviews/CommentItem";
import ItemMenu from "@/components/ItemMenu";
import {
  REPORT_REASONS,
  apiErrorMessage,
  createComment,
  deleteReview,
  getComments,
  likeReview,
  reportReview,
  unlikeReview,
  updateReview,
  type GameshelfReview,
  type ReportReason,
  type ReviewComment,
} from "@/services/Reviewservice";


interface Props {
  review: GameshelfReview;
  onUpdated: (review: GameshelfReview) => void;
  onDeleted: (reviewId: number) => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function GameshelfReviewItem({ review, onUpdated, onDeleted }: Props) {
  const [likeBusy, setLikeBusy] = useState(false);

  // edit
  const [editing, setEditing] = useState(false);
  const [draftContent, setDraftContent] = useState(review.content);
  const [saving, setSaving] = useState(false);

  // report
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState<ReportReason>("spam");
  const [details, setDetails] = useState("");

  // comments
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<ReviewComment[] | null>(null);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentDraft, setCommentDraft] = useState("");
  const [posting, setPosting] = useState(false);

  // --- like ----------------------------------------------------------------
  async function toggleLike() {
    if (likeBusy) return;
    setLikeBusy(true);
    const wasLiked = review.liked_by_me;

    onUpdated({
      ...review,
      liked_by_me: !wasLiked,
      like_count: review.like_count + (wasLiked ? -1 : 1),
    });

    try {
      const result = wasLiked
        ? await unlikeReview(review.id)
        : await likeReview(review.id);
      onUpdated({ ...review, liked_by_me: result.liked, like_count: result.like_count });
    } catch (err) {
      onUpdated(review); // rollback
      toast.error(apiErrorMessage(err, "Couldn’t update your like."));
    } finally {
      setLikeBusy(false);
    }
  }

  // --- edit ----------------------------------------------------------------
  function startEdit() {
    setDraftContent(review.content);
    setReporting(false);
    setEditing(true);
  }

  async function saveEdit() {
    const content = draftContent.trim();
    if (!content) {
      toast.error("Review can’t be empty.");
      return;
    }
    if (content === review.content) {
      setEditing(false);
      return;
    }

    setSaving(true);
    try {
      const updated = await updateReview(review.id, { content });
      onUpdated(updated);
      setEditing(false);
      toast.success("Review updated");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Couldn’t save your changes."));
    } finally {
      setSaving(false);
    }
  }

  // --- delete --------------------------------------------------------------
  async function remove() {
    if (!window.confirm("Delete this review? This can’t be undone.")) return;
    try {
      await deleteReview(review.id);
      onDeleted(review.id);
      toast.success("Review deleted");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Couldn’t delete this review."));
    }
  }

  // --- report --------------------------------------------------------------
  async function submitReport() {
    try {
      const result = await reportReview(review.id, { reason, details });
      toast.success(
        result.already_reported
          ? "You’ve already reported this review."
          : "Thanks, we’ll review this."
      );
      setReporting(false);
      setDetails("");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Couldn’t send your report."));
    }
  }

  // --- comments ------------------------------------------------------------
  async function toggleComments() {
    const next = !open;
    setOpen(next);

    if (next && comments === null) {
      setLoadingComments(true);
      try {
        setComments(await getComments(review.id));
      } catch (err) {
        setOpen(false);
        toast.error(apiErrorMessage(err, "Couldn’t load comments."));
      } finally {
        setLoadingComments(false);
      }
    }
  }

  async function postComment() {
    const content = commentDraft.trim();
    if (!content) return;

    setPosting(true);
    try {
      const created = await createComment(review.id, { content });
      setComments((prev) => [...(prev ?? []), created]);
      onUpdated({ ...review, comment_count: review.comment_count + 1 });
      setCommentDraft("");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Couldn’t post your comment."));
    } finally {
      setPosting(false);
    }
  }

  async function postReply(parentId: number, content: string) {
    const created = await createComment(review.id, {
        content,
        parentComment: parentId,
    });
    setComments((prev) => [...(prev ?? []), created]);
    onUpdated({ ...review, comment_count: review.comment_count + 1 });
    }

  const replaceComment = (updated: ReviewComment) =>
    setComments((prev) => (prev ?? []).map((c) => (c.id === updated.id ? updated : c)));

    const removeComment = (id: number) => {
    const before = comments ?? [];

    const gone = new Set<number>([id]);
    let grew = true;
    while (grew) {
        grew = false;
        for (const c of before) {
        if (c.parent_comment !== null && gone.has(c.parent_comment) && !gone.has(c.id)) {
            gone.add(c.id);
            grew = true;
        }
        }
    }

    const after = before.filter((c) => !gone.has(c.id));
    setComments(after);
    onUpdated({
        ...review,
        comment_count: Math.max(0, review.comment_count - gone.size),
    });
    };
  const topLevel = (comments ?? []).filter((c) => c.parent_comment === null);
  const repliesOf = (id: number) => (comments ?? []).filter((c) => c.parent_comment === id);

  return (
    <article className="flex flex-col gap-3 border-t border-[#55516c] pt-4 first:border-t-0 first:pt-0">
      {/* top: author + rating + 3-dot menu */}
      <div className="flex items-center justify-between gap-2 text-[13px] text-[#b4aec7]">
        <span>
          {review.author.username} • {formatDate(review.created_at)}
        </span>

        <div className="flex items-center gap-2">
          {review.rating !== null && (
            <span className="font-medium text-[#c2ade7]">★ {review.rating} / 10</span>
          )}
          <ItemMenu
            isMine={review.is_mine}
            onEdit={startEdit}
            onDelete={remove}
            onReport={() => {
              setEditing(false);
              setReporting(true);
            }}
          />
        </div>
      </div>

      {review.title && <h3 className="text-sm font-semibold">{review.title}</h3>}

      {/* body */}
      {editing ? (
        <div className="flex flex-col gap-2">
          <textarea
            value={draftContent}
            onChange={(e) => setDraftContent(e.target.value)}
            rows={5}
            className="w-full rounded-lg border border-[#55516c] bg-[#2a2838] p-3 text-sm text-[#e0deeb] outline-none focus:border-[#c2ade7]"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={saveEdit}
              disabled={saving}
              className="h-8 rounded-lg border-0 bg-[#a8484c] px-4 text-xs font-semibold text-[#e0deeb] shadow-none hover:bg-[#ae494e]"
            >
              {saving ? "Saving…" : "Save"}
            </Button>
            <Button
              type="button"
              onClick={() => setEditing(false)}
              className="h-8 rounded-lg border border-[#55516c] bg-transparent px-4 text-xs text-[#e0deeb] shadow-none hover:bg-[#46445a]"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <p className="line-clamp-6 whitespace-pre-line text-sm leading-6 text-[#e0deeb]">
          {review.content || "No written review."}
        </p>
      )}

      {/* report form (opened from the 3-dot menu) */}
      {reporting && (
        <div className="flex flex-col gap-2 rounded-lg border border-[#55516c] bg-[#2a2838] p-3">
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value as ReportReason)}
            className="h-9 rounded-md border border-[#55516c] bg-[#201e2f] px-2 text-xs text-[#e0deeb]"
          >
            {REPORT_REASONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            maxLength={500}
            rows={2}
            placeholder="Add details (optional)"
            className="rounded-md border border-[#55516c] bg-[#201e2f] p-2 text-xs text-[#e0deeb] outline-none focus:border-[#c2ade7]"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={submitReport}
              className="h-8 rounded-lg border-0 bg-[#a8484c] px-4 text-xs font-semibold text-[#e0deeb] shadow-none hover:bg-[#ae494e]"
            >
              Submit report
            </Button>
            <Button
              type="button"
              onClick={() => setReporting(false)}
              className="h-8 rounded-lg border border-[#55516c] bg-transparent px-4 text-xs text-[#e0deeb] shadow-none hover:bg-[#46445a]"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* bottom: like + comments */}
      <div className="flex items-center gap-4 text-xs text-[#b4aec7]">
        <button
          type="button"
          onClick={toggleLike}
          disabled={likeBusy}
          aria-pressed={review.liked_by_me}
          className="flex cursor-pointer items-center gap-1.5 hover:text-[#e0deeb]"
        >
          <Heart
            className={`size-3.5 ${review.liked_by_me ? "fill-[#e58d91] text-[#e58d91]" : ""}`}
            strokeWidth={1.7}
            aria-hidden="true"
          />
          Helpful ({review.like_count.toLocaleString()})
        </button>

        <button
          type="button"
          onClick={toggleComments}
          aria-expanded={open}
          className="flex cursor-pointer items-center gap-1.5 hover:text-[#e0deeb]"
        >
          <MessageSquare className="size-3.5" strokeWidth={1.7} aria-hidden="true" />
          Comments ({review.comment_count.toLocaleString()})
        </button>
      </div>

      {open && (
        <div className="ml-2 flex flex-col gap-4 border-l border-[#55516c] pl-4">
          {loadingComments && (
            <p role="status" className="text-xs text-[#b4aec7]">
              Loading comments…
            </p>
          )}

          {topLevel.map((c) => (
            <div key={c.id} className="flex flex-col gap-3">
                <CommentItem
                comment={c}
                onUpdated={replaceComment}
                onDeleted={removeComment}
                onReply={postReply}
                />
                {repliesOf(c.id).map((r) => (
                <div key={r.id} className="ml-6">
                    <CommentItem
                    comment={r}
                    onUpdated={replaceComment}
                    onDeleted={removeComment}
                    onReply={postReply}
                    />
                </div>
                ))}
            </div>
            ))}

          {!loadingComments && comments?.length === 0 && (
            <p className="text-xs text-[#b4aec7]">No comments yet.</p>
          )}

          <div className="flex flex-col gap-2">
            <textarea
              value={commentDraft}
              onChange={(e) => setCommentDraft(e.target.value)}
              rows={2}
              maxLength={2000}
              placeholder="Write a comment…"
              className="w-full rounded-lg border border-[#55516c] bg-[#2a2838] p-3 text-sm text-[#e0deeb] outline-none focus:border-[#c2ade7]"
            />
            <Button
              type="button"
              onClick={postComment}
              disabled={posting || !commentDraft.trim()}
              className="h-8 w-fit rounded-lg border-0 bg-[#a8484c] px-4 text-xs font-semibold text-[#e0deeb] shadow-none hover:bg-[#ae494e]"
            >
              {posting ? "Posting…" : "Comment"}
            </Button>
          </div>
        </div>
      )}
    </article>
  );
}