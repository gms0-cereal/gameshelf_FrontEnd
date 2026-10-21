import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  EyeOff,
  Heart,
  ImagePlus,
  MessageSquare,
  Pencil,
  ThumbsUp,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  apiErrorMessage,
  createComment,
  deleteComment,
  deleteReview,
  getComments,
  getGameshelfReviews,
  likeComment,
  likeReview,
  unlikeComment,
  unlikeReview,
  updateComment,
  type GameshelfReview,
  type ReviewComment,
  type ReviewSort,
} from "@/services/Reviewservice";

const MAX_FILES = 3;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const LINK_PATTERN =
  /(https?:\/\/|www\.|\b[\w-]+\.(?:com|net|org|io|gg|tv|ly|co|me|app|xyz|dev)\b)/i;

const inputClass =
  "w-full rounded-lg border border-[#55516c] bg-[#2a2838] px-3.5 py-2.5 text-sm text-[#e0deeb] outline-none placeholder:text-[#8b86a3] focus:border-[#c2ade7]";
const ghostBtn =
  "inline-flex cursor-pointer items-center gap-1.5 text-xs text-[#b4aec7] hover:text-[#e0deeb] disabled:cursor-not-allowed disabled:opacity-50";
const primaryBtn =
  "h-9 rounded-lg border-0 bg-[#a8484c] px-4 text-[13px] font-semibold text-[#e0deeb] shadow-none hover:bg-[#ae494e] disabled:opacity-60";
const selectClass =
  "h-9 cursor-pointer rounded-lg border border-[#55516c] bg-[#2a2838] px-3 text-xs text-[#e0deeb] outline-none focus:border-[#c2ade7]";

const SCORE_FILTERS = [
  { value: "all", label: "All scores" },
  { value: "9-10", label: "9 – 10" },
  { value: "7-8", label: "7 – 8" },
  { value: "5-6", label: "5 – 6" },
  { value: "1-4", label: "1 – 4" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  const letters = parts.length > 1 ? parts[0][0] + parts[1][0] : name.slice(0, 2);
  return letters.toUpperCase();
}

// ---------------------------------------------------------------------------
// Comment form (text + image attachments)
// ---------------------------------------------------------------------------
function CommentForm({
  replyingTo,
  submitting,
  onSubmit,
  onCancel,
}: {
  replyingTo?: string;
  submitting: boolean;
  onSubmit: (content: string, files: File[]) => Promise<boolean>;
  onCancel?: () => void;
}) {
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);

  // Object URLs for the thumbnails; revoked when they change.
  const previews = useMemo(
    () => files.map((file) => URL.createObjectURL(file)),
    [files]
  );
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  function addFiles(list: FileList | null) {
    if (!list) return;
    const next = [...files];

    for (const file of Array.from(list)) {
      if (!file.type.startsWith("image/")) {
        toast.error("Only images and GIFs can be attached.");
        continue;
      }
      if (file.size > MAX_FILE_BYTES) {
        toast.error(`${file.name} is larger than 5 MB.`);
        continue;
      }
      if (next.length >= MAX_FILES) {
        toast.error(`You can attach up to ${MAX_FILES} images.`);
        break;
      }
      next.push(file);
    }

    setFiles(next);
    if (fileInput.current) fileInput.current.value = "";
  }

  const hasLink = LINK_PATTERN.test(content);
  const canSend = (content.trim() || files.length > 0) && !hasLink && !submitting;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSend) return;
    const ok = await onSubmit(content.trim(), files);
    if (ok) {
      setContent("");
      setFiles([]);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      {replyingTo && (
        <p className="text-xs text-[#b4aec7]">
          Replying to <span className="text-[#e0deeb]">{replyingTo}</span>
        </p>
      )}

      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        rows={2}
        maxLength={1000}
        placeholder="Write a comment…"
        aria-label="Comment"
        className={`${inputClass} resize-y py-2`}
      />

      {hasLink && (
        <p role="alert" className="text-xs text-[#e58d91]">
          Links aren’t allowed in comments.
        </p>
      )}

      {files.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {files.map((file, index) => (
            <li key={`${file.name}-${index}`} className="relative">
              <img
                src={previews[index]}
                alt=""
                className="size-16 rounded-lg border border-[#55516c] object-cover"
              />
              <button
                type="button"
                onClick={() => setFiles((list) => list.filter((_, i) => i !== index))}
                aria-label={`Remove ${file.name}`}
                className="absolute -right-1.5 -top-1.5 flex size-5 cursor-pointer items-center justify-center rounded-full bg-[#201e2f] text-[#e0deeb] ring-1 ring-[#55516c]"
              >
                <X className="size-3" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-3">
        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          hidden
          onChange={(event) => addFiles(event.target.files)}
        />
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          disabled={files.length >= MAX_FILES}
          className={ghostBtn}
        >
          <ImagePlus className="size-4" strokeWidth={1.7} aria-hidden="true" />
          Attach image
        </button>

        <div className="ml-auto flex items-center gap-3">
          {onCancel && (
            <button type="button" onClick={onCancel} className={ghostBtn}>
              Cancel
            </button>
          )}
          <Button type="submit" disabled={!canSend} className={primaryBtn}>
            {submitting ? "Posting…" : replyingTo ? "Reply" : "Comment"}
          </Button>
        </div>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// One comment (+ like, reply, edit, delete)
// ---------------------------------------------------------------------------
function CommentItem({
  comment,
  onReply,
  onChange,
  onDeleted,
}: {
  comment: ReviewComment;
  onReply: (comment: ReviewComment) => void;
  onChange: (comment: ReviewComment) => void;
  onDeleted: (comment: ReviewComment) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.content);
  const [busy, setBusy] = useState(false);

  async function toggleLike() {
    const next = !comment.liked_by_me;
    // optimistic
    onChange({
      ...comment,
      liked_by_me: next,
      like_count: comment.like_count + (next ? 1 : -1),
    });
    try {
      const result = next ? await likeComment(comment.id) : await unlikeComment(comment.id);
      onChange({ ...comment, liked_by_me: result.liked, like_count: result.like_count });
    } catch (err) {
      onChange(comment); // roll back
      toast.error(apiErrorMessage(err, "Couldn’t update your like."));
    }
  }

  async function save() {
    if (LINK_PATTERN.test(draft)) {
      toast.error("Links aren’t allowed in comments.");
      return;
    }
    setBusy(true);
    try {
      onChange(await updateComment(comment.id, draft.trim()));
      setEditing(false);
    } catch (err) {
      toast.error(apiErrorMessage(err, "Couldn’t save your edit."));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm("Delete this comment?")) return;
    setBusy(true);
    try {
      await deleteComment(comment.id);
      onDeleted(comment);
    } catch (err) {
      toast.error(apiErrorMessage(err, "Couldn’t delete this comment."));
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs text-[#b4aec7]">
        <span className="font-semibold text-[#e0deeb]">{comment.author.username}</span>
        {" • "}
        {formatDate(comment.created_at)}
      </p>

      {editing ? (
        <div className="flex flex-col gap-2">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={2}
            maxLength={1000}
            aria-label="Edit comment"
            className={`${inputClass} py-2`}
          />
          <div className="flex gap-3">
            <Button
              type="button"
              onClick={save}
              disabled={busy || !draft.trim()}
              className={primaryBtn}
            >
              Save
            </Button>
            <button type="button" onClick={() => setEditing(false)} className={ghostBtn}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        comment.content && (
          <p className="whitespace-pre-line text-sm leading-6 text-[#e0deeb]">
            {comment.content}
          </p>
        )
      )}

      {comment.attachments.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {comment.attachments.map((file) => (
            <li key={file.id}>
              <a href={file.file_url} target="_blank" rel="noreferrer">
                <img
                  src={file.file_url}
                  alt="Attached by the commenter"
                  loading="lazy"
                  className="max-h-48 max-w-full rounded-lg border border-[#55516c] object-cover"
                />
              </a>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={toggleLike}
          aria-pressed={comment.liked_by_me}
          className={ghostBtn}
        >
          <Heart
            className={`size-3.5 ${comment.liked_by_me ? "fill-[#e58d91] text-[#e58d91]" : ""}`}
            strokeWidth={1.7}
            aria-hidden="true"
          />
          {comment.like_count > 0 ? comment.like_count : "Like"}
        </button>

        <button type="button" onClick={() => onReply(comment)} className={ghostBtn}>
          Reply
        </button>

        {comment.is_mine && !editing && (
          <>
            <button type="button" onClick={() => setEditing(true)} className={ghostBtn}>
              <Pencil className="size-3.5" strokeWidth={1.7} aria-hidden="true" />
              Edit
            </button>
            <button type="button" onClick={remove} disabled={busy} className={ghostBtn}>
              <Trash2 className="size-3.5" strokeWidth={1.7} aria-hidden="true" />
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Comments under a review
// ---------------------------------------------------------------------------
function CommentsPanel({
  reviewId,
  onCountChange,
}: {
  reviewId: number;
  onCountChange: (delta: number) => void;
}) {
  const [comments, setComments] = useState<ReviewComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<ReviewComment | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    getComments(reviewId)
      .then((data) => {
        if (!cancelled) setComments(data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reviewId]);

  const roots = comments.filter((c) => c.parent_comment === null);
  const repliesOf = (id: number) => comments.filter((c) => c.parent_comment === id);

  async function post(content: string, files: File[], parent: ReviewComment | null) {
    setSubmitting(true);
    try {
      const created = await createComment(reviewId, {
        content,
        files,
        parentComment: parent?.id ?? null,
      });
      setComments((list) => [...list, created]);
      onCountChange(1);
      if (parent) setReplyTo(null);
      return true;
    } catch (err) {
      toast.error(apiErrorMessage(err, "Couldn’t post your comment."));
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  function replaceComment(updated: ReviewComment) {
    setComments((list) => list.map((c) => (c.id === updated.id ? updated : c)));
  }

  function removeComment(removed: ReviewComment) {
    // Deleting a top-level comment hides its replies too.
    const gone = new Set([removed.id, ...repliesOf(removed.id).map((r) => r.id)]);
    setComments((list) => list.filter((c) => !gone.has(c.id)));
    onCountChange(-gone.size);
  }

  return (
    <div className="mt-1 flex flex-col gap-4 rounded-xl bg-[#2f2d3e] p-4">
      {loading && (
        <p role="status" className="text-xs text-[#b4aec7]">
          Loading comments…
        </p>
      )}
      {error && (
        <p role="alert" className="text-xs text-[#e58d91]">
          Couldn’t load comments.
        </p>
      )}
      {!loading && !error && roots.length === 0 && (
        <p className="text-xs text-[#b4aec7]">No comments yet. Start the conversation.</p>
      )}

      {roots.map((root) => (
        <div key={root.id} className="flex flex-col gap-3">
          <CommentItem
            comment={root}
            onReply={setReplyTo}
            onChange={replaceComment}
            onDeleted={removeComment}
          />

          {repliesOf(root.id).map((reply) => (
            <div key={reply.id} className="ml-6 border-l border-[#55516c] pl-4">
              <CommentItem
                comment={reply}
                onReply={() => setReplyTo(root)}
                onChange={replaceComment}
                onDeleted={removeComment}
              />
            </div>
          ))}

          {replyTo?.id === root.id && (
            <div className="ml-6 border-l border-[#55516c] pl-4">
              <CommentForm
                replyingTo={root.author.username}
                submitting={submitting}
                onSubmit={(content, files) => post(content, files, root)}
                onCancel={() => setReplyTo(null)}
              />
            </div>
          )}
        </div>
      ))}

      <div className="border-t border-[#55516c] pt-4">
        <CommentForm
          submitting={submitting}
          onSubmit={(content, files) => post(content, files, null)}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// One review
// ---------------------------------------------------------------------------
function ReviewItem({
  review,
  hideSpoilers,
  cardClassName,
  writeHref,
  onChange,
  onEdit,
  onDelete,
}: {
  review: GameshelfReview;
  hideSpoilers: boolean;
  cardClassName: string;
  writeHref?: string;
  onChange: (review: GameshelfReview) => void;
  onEdit?: () => void;
  onDelete: () => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const hidden = review.contains_spoilers && hideSpoilers && !revealed;
  const card = `rounded-xl border border-[#55516c] ${cardClassName}`;

  async function toggleLike() {
    const next = !review.liked_by_me;
    onChange({
      ...review,
      liked_by_me: next,
      like_count: review.like_count + (next ? 1 : -1),
    });
    try {
      const result = next ? await likeReview(review.id) : await unlikeReview(review.id);
      onChange({ ...review, liked_by_me: result.liked, like_count: result.like_count });
    } catch (err) {
      onChange(review);
      toast.error(apiErrorMessage(err, "Couldn’t update your like."));
    }
  }

  if (hidden) {
    return (
      <article className={`flex items-center gap-4 p-4 ${card}`}>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#4a3d73] text-[#c2ade7]">
          <EyeOff className="size-4" strokeWidth={1.7} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Spoiler review hidden</p>
          <p className="text-xs text-[#b4aec7]">
            By {review.author.username} • Reveal only when you’re ready.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="h-9 cursor-pointer rounded-lg border border-[#7c5fc4] bg-transparent px-4 text-xs font-medium text-[#e0deeb] hover:bg-[#4a3d73]"
        >
          Reveal
        </button>
      </article>
    );
  }

  const editControl = onEdit ? (
    <button type="button" onClick={onEdit} className={ghostBtn}>
      <Pencil className="size-3.5" strokeWidth={1.7} aria-hidden="true" />
      Edit
    </button>
  ) : writeHref ? (
    <Link to={writeHref} className={ghostBtn}>
      <Pencil className="size-3.5" strokeWidth={1.7} aria-hidden="true" />
      Edit
    </Link>
  ) : null;

  return (
    <article className={`flex flex-col gap-4 p-5 ${card}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#4a3d73] text-xs font-semibold text-[#e0deeb]"
          >
            {initials(review.author.username)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {review.author.username}
              {review.is_mine && (
                <span className="font-normal text-[#b4aec7]"> (you)</span>
              )}
            </p>
            <p className="text-xs text-[#b4aec7]">{formatDate(review.created_at)}</p>
          </div>
        </div>

        {review.rating !== null && (
          <span className="shrink-0 rounded-lg border border-[#55516c] bg-[#201e2f] px-3 py-2 text-sm font-semibold">
            {review.rating} / 10
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        {review.title && <h3 className="text-base font-semibold">{review.title}</h3>}
        <p className="whitespace-pre-line text-sm leading-6 text-[#e0deeb]">
          {review.content}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={toggleLike}
          aria-pressed={review.liked_by_me}
          className={`inline-flex h-8 cursor-pointer items-center gap-2 rounded-lg border px-3 text-xs ${
            review.liked_by_me
              ? "border-[#7c5fc4] bg-[#4a3d73] text-[#e0deeb]"
              : "border-[#55516c] text-[#b4aec7] hover:text-[#e0deeb]"
          }`}
        >
          <ThumbsUp className="size-3.5" strokeWidth={1.7} aria-hidden="true" />
          Helpful ({review.like_count})
        </button>

        <button
          type="button"
          onClick={() => setShowComments((value) => !value)}
          aria-expanded={showComments}
          className={ghostBtn}
        >
          <MessageSquare className="size-4" strokeWidth={1.7} aria-hidden="true" />
          Comments ({review.comment_count})
        </button>

        {review.is_mine && (
          <>
            {editControl}
            <button type="button" onClick={onDelete} className={ghostBtn}>
              <Trash2 className="size-3.5" strokeWidth={1.7} aria-hidden="true" />
              Delete
            </button>
          </>
        )}
      </div>

      {showComments && (
        <CommentsPanel
          reviewId={review.id}
          onCountChange={(delta) =>
            onChange({ ...review, comment_count: Math.max(0, review.comment_count + delta) })
          }
        />
      )}
    </article>
  );
}

// ---------------------------------------------------------------------------
// GameShelf reviews list
//
//  - On the game page pass `writeHref`: "Write a review" / "Edit" link to the
//    Community reviews page, where rating and writing happen.
//  - On the Community reviews page pass `onEdit` and bump `reloadKey` after a
//    review is saved so the list refreshes.
// ---------------------------------------------------------------------------
export default function GameshelfReviews({
  appId,
  writeHref,
  onEdit,
  onLoaded,
  reloadKey = 0,
  cardClassName = "bg-[#373646]",
}: {
  appId: number;
  writeHref?: string;
  onEdit?: (review: GameshelfReview) => void;
  onLoaded?: (info: { myReview: GameshelfReview | null; total: number }) => void;
  reloadKey?: number;
  cardClassName?: string;
}) {
  const [sort, setSort] = useState<ReviewSort>("helpful");
  const [scoreFilter, setScoreFilter] = useState("all");
  const [hideSpoilers, setHideSpoilers] = useState(true);

  const [reviews, setReviews] = useState<GameshelfReview[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [myReview, setMyReview] = useState<GameshelfReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [localReload, setLocalReload] = useState(0);

  // Always call the latest onLoaded without making it an effect dependency.
  const onLoadedRef = useRef(onLoaded);
  onLoadedRef.current = onLoaded;

  const scoreRange =
    scoreFilter === "all"
      ? {}
      : (() => {
          const [min, max] = scoreFilter.split("-").map(Number);
          return { minScore: min, maxScore: max };
        })();

  // First page (re-runs on sort / filter changes and after a write)
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    getGameshelfReviews(appId, { sort, page: 1, ...scoreRange })
      .then((data) => {
        if (cancelled) return;
        const list = data?.results ?? [];
        const mine = data?.my_review ?? null;
        const count = data?.count ?? list.length;

        setReviews(list);
        setTotal(count);
        setPage(1);
        setHasNext(Boolean(data?.has_next));
        setMyReview(mine);
        onLoadedRef.current?.({ myReview: mine, total: count });
      })
      .catch((err) => {
        console.error("GameShelf reviews failed:", err?.response?.status, err?.response?.data ?? err);
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appId, sort, scoreFilter, reloadKey, localReload]);

  async function loadMore() {
    setLoading(true);
    try {
      const data = await getGameshelfReviews(appId, {
        sort,
        page: page + 1,
        ...scoreRange,
      });
      const results = data?.results ?? [];
      setReviews((list) => {
        const seen = new Set(list.map((r) => r.id));
        return [...list, ...results.filter((r) => !seen.has(r.id))];
      });
      setPage(data?.page ?? page + 1);
      setHasNext(Boolean(data?.has_next));
    } catch {
      toast.error("Couldn’t load more reviews.");
    } finally {
      setLoading(false);
    }
  }

  function patchReview(updated: GameshelfReview) {
    setReviews((list) => list.map((r) => (r.id === updated.id ? updated : r)));
    setMyReview((mine) => (mine?.id === updated.id ? updated : mine));
  }

  async function removeReview(review: GameshelfReview) {
    if (!window.confirm("Delete your review? This can’t be undone.")) return;
    try {
      await deleteReview(review.id);
      toast.success("Review deleted");
      setLocalReload((key) => key + 1);
    } catch (err) {
      toast.error(apiErrorMessage(err, "Couldn’t delete your review."));
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-xs text-[#b4aec7]">
            <span className="sr-only">Filter by score</span>
            <select
              value={scoreFilter}
              onChange={(event) => setScoreFilter(event.target.value)}
              className={selectClass}
            >
              {SCORE_FILTERS.map((filter) => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </select>
          </label>

          {writeHref ? (
            <Button asChild className={primaryBtn}>
              <Link to={writeHref}>
                {myReview ? "Edit your review" : "Write a review"}
              </Link>
            </Button>
          ) : (
            <p className="text-xs text-[#b4aec7]">
              {total} {total === 1 ? "review" : "reviews"}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-xs text-[#b4aec7]">
            Sort
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as ReviewSort)}
              className={selectClass}
            >
              <option value="helpful">Most helpful</option>
              <option value="recent">Newest</option>
            </select>
          </label>

          <button
            type="button"
            role="switch"
            aria-checked={hideSpoilers}
            onClick={() => setHideSpoilers((value) => !value)}
            className="flex cursor-pointer items-center gap-2 text-xs text-[#b4aec7]"
          >
            Hide spoilers
            <span
              className={`flex h-5 w-9 items-center rounded-full px-0.5 transition-colors ${
                hideSpoilers ? "bg-[#7c5fc4]" : "bg-[#55516c]"
              }`}
            >
              <span
                className={`size-4 rounded-full bg-[#e0deeb] transition-transform ${
                  hideSpoilers ? "translate-x-4" : ""
                }`}
              />
            </span>
          </button>
        </div>
      </div>

      {/* List */}
      {(reviews ?? []).map((review) => (
        <ReviewItem
          key={review.id}
          review={review}
          hideSpoilers={hideSpoilers}
          cardClassName={cardClassName}
          writeHref={writeHref}
          onChange={patchReview}
          onEdit={onEdit ? () => onEdit(review) : undefined}
          onDelete={() => removeReview(review)}
        />
      ))}

      {loading && (
        <p role="status" className="text-sm text-[#b4aec7]">
          Loading reviews…
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-[#e58d91]">
          Couldn’t load GameShelf reviews right now.
        </p>
      )}
      {!loading && !error && reviews.length === 0 && (
        <p className="text-sm text-[#b4aec7]">
          {scoreFilter === "all"
            ? "No GameShelf reviews yet. Be the first to write one."
            : "No reviews with that score yet."}
        </p>
      )}

      {!loading && hasNext && (
        <Button
          type="button"
          onClick={loadMore}
          className="h-10 w-fit rounded-lg border border-[#55516c] bg-transparent px-5 text-sm font-semibold text-[#e0deeb] shadow-none hover:bg-[#46445a]"
        >
          Load more reviews
        </Button>
      )}

      {!loading && !hasNext && reviews.length > 0 && (
        <p className="text-center text-xs text-[#8b86a3]">You’re all caught up.</p>
      )}
    </div>
  );
}
