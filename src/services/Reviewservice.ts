import api from "../lib/api";

// ---------------------------------------------------------------------------
// shared
// ---------------------------------------------------------------------------
export interface Author {
  id: number;
  username: string;
}

/** Turn a DRF / axios error into a message that's safe to show the user. */
export function apiErrorMessage(err: unknown, fallback: string): string {
  const e = err as {
    response?: { status?: number; data?: unknown };
  };

  if (e?.response?.status === 401) return "Please log in to do that.";

  const data = e?.response?.data as Record<string, unknown> | undefined;
  if (data && typeof data === "object") {
    if (typeof data.error === "string") return data.error;
    if (typeof data.detail === "string") return data.detail;

    const first = Object.values(data)[0];
    const message = Array.isArray(first) ? first[0] : first;
    if (typeof message === "string") return message;
  }

  return fallback;
}

// ---------------------------------------------------------------------------
// reports (reviews + comments)
// ---------------------------------------------------------------------------
export type ReportReason =
  | "spam"
  | "harassment"
  | "spoilers"
  | "hate"
  | "misinformation"
  | "other";

export const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: "spam", label: "Spam" },
  { value: "harassment", label: "Harassment" },
  { value: "spoilers", label: "Unmarked spoilers" },
  { value: "hate", label: "Hate speech" },
  { value: "misinformation", label: "Misinformation" },
  { value: "other", label: "Other" },
];

export interface ReportPayload {
  reason: ReportReason;
  details?: string;
}

export interface ReportResult {
  reported: boolean;
  already_reported: boolean;
}

// POST /moderation/reviews/<id>/report/
export async function reportReview(reviewId: number, payload: ReportPayload) {
  const { data } = await api.post<ReportResult>(
    `/moderation/reviews/${reviewId}/report/`,
    payload
  );
  return data;
}

// POST /moderation/comments/<id>/report/
export async function reportComment(commentId: number, payload: ReportPayload) {
  const { data } = await api.post<ReportResult>(
    `/moderation/comments/${commentId}/report/`,
    payload
  );
  return data;
}

// ---------------------------------------------------------------------------
// ratings (1-10)
// ---------------------------------------------------------------------------
export interface RatingStats {
  my_score: number | null;
  average: number | null;
  count: number;
}

// GET /reviews/ratings/<app_id>/
export async function getRatingStats(appId: number | string) {
  const { data } = await api.get<RatingStats>(`/reviews/ratings/${appId}/`);
  return data;
}

// PUT /reviews/ratings/<app_id>/
export async function setRating(appId: number | string, score: number) {
  const { data } = await api.put<RatingStats>(`/reviews/ratings/${appId}/`, {
    score,
  });
  return data;
}

// DELETE /reviews/ratings/<app_id>/
export async function clearRating(appId: number | string) {
  const { data } = await api.delete<RatingStats>(`/reviews/ratings/${appId}/`);
  return data;
}

// ---------------------------------------------------------------------------
// GameShelf reviews
// ---------------------------------------------------------------------------
export type ReviewSort = "helpful" | "recent";

export interface GameshelfReview {
  id: number;
  author: Author;
  title: string | null;
  content: string;
  contains_spoilers: boolean;
  created_at: string;
  rating: number | null; // the author's 1-10 rating, if they gave one
  like_count: number;
  comment_count: number;
  liked_by_me: boolean;
  is_mine: boolean;
  edited_at: string | null;
}

export interface GameshelfReviewList {
  count: number;
  page: number;
  has_next: boolean;
  results: GameshelfReview[];
  my_review: GameshelfReview | null;
}

export interface ReviewPayload {
  title?: string;
  content: string;
  contains_spoilers: boolean;
}

export interface LikeResult {
  liked: boolean;
  like_count: number;
}

// GET /reviews/steam/<app_id>/
export async function getGameshelfReviews(
  appId: number | string,
  params: {
    sort?: ReviewSort;
    page?: number;
    pageSize?: number;
    minScore?: number;
    maxScore?: number;
  } = {}
) {
  const { data } = await api.get<GameshelfReviewList>(
    `/reviews/steam/${appId}/`,
    {
      params: {
        sort: params.sort,
        page: params.page,
        page_size: params.pageSize,
        min_score: params.minScore,
        max_score: params.maxScore,
      },
    }
  );
  return data;
}

// POST /reviews/steam/<app_id>/
export async function createReview(
  appId: number | string,
  payload: ReviewPayload
) {
  const { data } = await api.post<GameshelfReview>(
    `/reviews/steam/${appId}/`,
    payload
  );
  return data;
}


// PATCH /reviews/<id>/
export async function updateReview(
  reviewId: number,
  payload: Partial<ReviewPayload>
) {
  const { data } = await api.patch<GameshelfReview>(
    `/reviews/${reviewId}/`,
    payload
  );
  return data;
}

// DELETE /reviews/<id>/
export async function deleteReview(reviewId: number) {
  await api.delete(`/reviews/${reviewId}/`);
}

// POST /reviews/<id>/like/
export async function likeReview(reviewId: number) {
  const { data } = await api.post<LikeResult>(`/reviews/${reviewId}/like/`);
  return data;
}

// DELETE /reviews/<id>/like/
export async function unlikeReview(reviewId: number) {
  const { data } = await api.delete<LikeResult>(`/reviews/${reviewId}/like/`);
  return data;
}

// ---------------------------------------------------------------------------
// comments
// ---------------------------------------------------------------------------
export interface CommentAttachment {
  id: number;
  media_type: "image" | "gif";
  file_url: string;
  width: number | null;
  height: number | null;
}

export interface ReviewComment {
  id: number;
  author: Author;
  content: string;
  created_at: string;
  parent_comment: number | null;
  like_count: number;
  liked_by_me: boolean;
  is_mine: boolean;
  attachments: CommentAttachment[];
  edited_at: string | null;
}

// GET /reviews/<id>/comments/   (flat; replies have `parent_comment`)
export async function getComments(reviewId: number) {
  const { data } = await api.get<ReviewComment[]>(
    `/reviews/${reviewId}/comments/`
  );
  return data;
}

// POST /reviews/<id>/comments/  (multipart so images can be attached)
export async function createComment(
  reviewId: number,
  input: { content: string; parentComment?: number | null; files?: File[] }
) {
  const form = new FormData();
  form.append("content", input.content);
  if (input.parentComment) {
    form.append("parent_comment", String(input.parentComment));
  }
  (input.files ?? []).forEach((file) => form.append("attachments", file));

  const { data } = await api.post<ReviewComment>(
    `/reviews/${reviewId}/comments/`,
    form,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return data;
}

// PATCH /reviews/comments/<id>/   (edit)
export async function updateComment(commentId: number, content: string) {
  const { data } = await api.patch<ReviewComment>(
    `/reviews/comments/${commentId}/`,
    { content }
  );
  return data;
}

// DELETE /reviews/comments/<id>/
export async function deleteComment(commentId: number) {
  await api.delete(`/reviews/comments/${commentId}/`);
}

// POST /reviews/comments/<id>/like/
export async function likeComment(commentId: number) {
  const { data } = await api.post<LikeResult>(
    `/reviews/comments/${commentId}/like/`
  );
  return data;
}

// DELETE /reviews/comments/<id>/like/
export async function unlikeComment(commentId: number) {
  const { data } = await api.delete<LikeResult>(
    `/reviews/comments/${commentId}/like/`
  );
  return data;
}

// ---------------------------------------------------------------------------
// third-party reviews
// ---------------------------------------------------------------------------
/** Sources the backend can fetch. Others are link-out cards in the UI. */
export type ExternalApiSource = "steam" | "reddit" | "metacritic";

export interface ExternalReviewItem {
  id: string;
  author: string;
  title: string | null;
  body: string;
  positive: boolean | null;
  score: number | null;
  meta: string;
  url: string | null;
  created_at: string | null;
}

export interface ExternalReviewsResponse {
  source: ExternalApiSource;
  kind: "reviews" | "summary";
  summary: {
    score?: number | null; // 0-10
    label?: string | null;
    count?: number | null;
    url?: string | null;
  };
  items: ExternalReviewItem[];
  next_cursor: string | null;
}

// GET /reviews/external-reviews/<app_id>/?source=reddit&cursor=...
export async function getExternalReviews(
  appId: number | string,
  source: ExternalApiSource,
  cursor = "*",
  limit = 5
) {
  const { data } = await api.get<ExternalReviewsResponse>(
    `/reviews/external-reviews/${appId}/`,
    { params: { source, cursor, limit } }
  );
  return data;
}