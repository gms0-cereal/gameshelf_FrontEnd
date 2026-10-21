import { useState } from "react";
import { Heart, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import ItemMenu from "@/components/ItemMenu";
import {
  REPORT_REASONS,
  apiErrorMessage,
  deleteComment,
  likeComment,
  reportComment,
  unlikeComment,
  updateComment,
  type ReportReason,
  type ReviewComment,
} from "@/services/Reviewservice";

interface Props {
  comment: ReviewComment;
  onUpdated: (comment: ReviewComment) => void;
  onDeleted: (commentId: number) => void;
  /** Post a reply to this comment. Should throw on failure. */
  onReply?: (parentId: number, content: string) => Promise<void>;
}

export default function CommentItem({
  comment,
  onUpdated,
  onDeleted,
  onReply,
}: Props) {
  const [likeBusy, setLikeBusy] = useState(false);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.content);
  const [saving, setSaving] = useState(false);

  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState<ReportReason>("spam");
  const [details, setDetails] = useState("");

  const [replying, setReplying] = useState(false);
  const [replyDraft, setReplyDraft] = useState("");
  const [replyBusy, setReplyBusy] = useState(false);

  // Only top-level (parent) comments can be replied to.
  const canReply = Boolean(onReply) && comment.parent_comment === null;

  

  // --- like / unlike (optimistic, rolls back on failure) -------------------
  async function toggleLike() {
    if (likeBusy) return;
    setLikeBusy(true);

    const wasLiked = comment.liked_by_me;
    onUpdated({
      ...comment,
      liked_by_me: !wasLiked,
      like_count: comment.like_count + (wasLiked ? -1 : 1),
    });

    try {
      const result = wasLiked
        ? await unlikeComment(comment.id)
        : await likeComment(comment.id);
      onUpdated({
        ...comment,
        liked_by_me: result.liked,
        like_count: result.like_count,
      });
    } catch (err) {
      onUpdated(comment); // rollback
      toast.error(apiErrorMessage(err, "Couldn’t update your like."));
    } finally {
      setLikeBusy(false);
    }
  }

  // --- edit ----------------------------------------------------------------
  function startEdit() {
    setDraft(comment.content);
    setReporting(false);
    setReplying(false);
    setEditing(true);
  }

  function cancelEdit() {
    setDraft(comment.content);
    setEditing(false);
  }

  async function saveEdit() {
    const content = draft.trim();
    if (!content) {
      toast.error("Comment can’t be empty.");
      return;
    }
    if (content === comment.content) {
      setEditing(false);
      return;
    }

    setSaving(true);
    try {
      const updated = await updateComment(comment.id, content);
      onUpdated(updated);
      setEditing(false);
      toast.success("Comment updated");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Couldn’t save your changes."));
    } finally {
      setSaving(false);
    }
  }

  // --- delete --------------------------------------------------------------
  async function remove() {
    if (!window.confirm("Delete this comment? This can’t be undone.")) return;
    try {
      await deleteComment(comment.id);
      onDeleted(comment.id);
      toast.success("Comment deleted");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Couldn’t delete this comment."));
    }
  }

  // --- report --------------------------------------------------------------
  async function submitReport() {
    try {
      const result = await reportComment(comment.id, { reason, details });
      toast.success(
        result.already_reported
          ? "You’ve already reported this comment."
          : "Thanks, we’ll review this comment."
      );
      setReporting(false);
      setDetails("");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Couldn’t send your report."));
    }
  }

  // --- reply ---------------------------------------------------------------
  function startReply() {
    setEditing(false);
    setReporting(false);
    setReplyDraft("");
    setReplying(true);
  }

  async function submitReply() {
    const content = replyDraft.trim();
    if (!content || !onReply) return;

    setReplyBusy(true);
    try {
      await onReply(comment.id, content);
      setReplying(false);
      setReplyDraft("");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Couldn’t post your reply."));
    } finally {
      setReplyBusy(false);
    }
  }

  return (
    <article className="flex flex-col gap-2 border-t border-[#55516c] pt-3 first:border-t-0 first:pt-0">
      {/* top: author + 3-dot menu */}
      <div className="flex items-center justify-between gap-2 text-[13px] text-[#b4aec7]">
        <span>
          {comment.author.username} •{" "}
          {new Date(comment.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
          {comment.edited_at && (
            <span title={new Date(comment.edited_at).toLocaleString()}>
              {" "}
              • edited
            </span>
          )}
        </span>

        <ItemMenu
          isMine={comment.is_mine}
          onEdit={startEdit}
          onDelete={remove}
          onReport={() => {
            setEditing(false);
            setReplying(false);
            setReporting(true);
          }}
        />
      </div>

      {/* body */}
      {editing ? (
        <div className="flex flex-col gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            maxLength={1000}
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
              onClick={cancelEdit}
              className="h-8 rounded-lg border border-[#55516c] bg-transparent px-4 text-xs text-[#e0deeb] shadow-none hover:bg-[#46445a]"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <p className="whitespace-pre-line text-sm leading-6 text-[#e0deeb]">
          {comment.content}
        </p>
      )}

      {comment.attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {comment.attachments.map((a) => (
            <img
              key={a.id}
              src={a.file_url}
              alt=""
              loading="lazy"
              className="max-h-40 rounded-lg border border-[#55516c]"
            />
          ))}
        </div>
      )}

      {/* report form */}
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

      {/* bottom: like (+ reply on parent comments only) */}
      <div className="flex items-center gap-4 text-xs text-[#b4aec7]">
        <button
          type="button"
          onClick={toggleLike}
          disabled={likeBusy}
          aria-pressed={comment.liked_by_me}
          className="flex cursor-pointer items-center gap-1.5 hover:text-[#e0deeb]"
        >
          <Heart
            className={`size-3.5 ${
              comment.liked_by_me ? "fill-[#e58d91] text-[#e58d91]" : ""
            }`}
            strokeWidth={1.7}
            aria-hidden="true"
          />
          {comment.liked_by_me ? "Liked" : "Like"} (
          {comment.like_count.toLocaleString()})
        </button>

        {canReply && (
          <button
            type="button"
            onClick={() => (replying ? setReplying(false) : startReply())}
            aria-expanded={replying}
            className="flex cursor-pointer items-center gap-1.5 hover:text-[#e0deeb]"
          >
            <MessageSquare
              className="size-3.5"
              strokeWidth={1.7}
              aria-hidden="true"
            />
            Reply
          </button>
        )}
      </div>

      {/* reply form (parent comments only) */}
      {canReply && replying && (
        <div className="flex flex-col gap-2">
          <textarea
            value={replyDraft}
            onChange={(e) => setReplyDraft(e.target.value)}
            rows={2}
            maxLength={1000}
            autoFocus
            placeholder="Write a reply…"
            className="w-full rounded-lg border border-[#55516c] bg-[#2a2838] p-3 text-sm text-[#e0deeb] outline-none focus:border-[#c2ade7]"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={submitReply}
              disabled={replyBusy || !replyDraft.trim()}
              className="h-8 rounded-lg border-0 bg-[#a8484c] px-4 text-xs font-semibold text-[#e0deeb] shadow-none hover:bg-[#ae494e]"
            >
              {replyBusy ? "Posting…" : "Reply"}
            </Button>
            <Button
              type="button"
              onClick={() => setReplying(false)}
              className="h-8 rounded-lg border border-[#55516c] bg-transparent px-4 text-xs text-[#e0deeb] shadow-none hover:bg-[#46445a]"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </article>
  );
}