import api from "./api";


export type ReportKind = "review" | "comment" | "playlist";
export type ReportStatus = "open" | "reviewing" | "resolved" | "dismissed";
import type { Tone } from "../components/ui/Modui";
export type { Tone };

type Page<T> = { count: number; results: T[] };
function list<T>(r: T[] | Page<T>): T[] {
  return Array.isArray(r) ? r : r.results;
}

/* ---------- raw API shapes (match apps/moderation/serializers.py) ---------- */
type ApiReport = {
  id: number;
  kind: ReportKind;
  reporter: { id: number; username: string };
  reported_user_username: string;
  target: { id: number; type: string; author: string; text: string };
  reason: string;
  details: string | null;
  status: ReportStatus;
  created_at: string;
  priority: "high" | "normal";
};
type ApiSanction = {
  id: number;
  user_id: number;
  username: string;
  moderator_username: string;
  sanction_type: string;
  reason: string;
  internal_notes: string | null;
  starts_at: string;
  ends_at: string | null;
  revoked_at: string | null;
  revocation_reason: string | null;
  status: "active" | "expired" | "permanent" | "revoked";
  created_at: string;
};
type ApiAppeal = {
  id: number;
  user_id: number;
  username: string;
  sanction_id: number;
  sanction_type: string;
  message: string;
  evidence: unknown;
  api_status: "pending" | "under_review" | "approved" | "rejected";
  reviewer_username?: string;
  review_notes: string | null;
  decision_reason: string | null;
  created_at: string;
  reviewed_at: string | null;
};
type ApiHistory = {
  id: number;
  moderator: string;
  action_type: string;
  target_user: string | null;
  report_id: number | null;
  sanction_id: number | null;
  appeal_id: number | null;
  reason: string;
  created_at: string;
  metadata: Record<string, unknown> | null;
};

/* ---------- view models used by the pages ---------- */
export type ReportRow = {
  id: string; // unique display id, e.g. "R-1" (kind prefix keeps it unique)
  reportId: number;
  kind: ReportKind;
  reporter: string;
  reportedUser: string;
  category: string;
  content: string;
  contentSub: string;
  details: string;
  date: string;
  status: string;
  rawStatus: ReportStatus;
  priority: string;
  reason: string;
};
export type SanctionRow = {
  id: string;
  sanctionId: number;
  username: string;
  action: string;
  reason: string;
  moderator: string;
  window: string;
  status: string;
  rawStatus: ApiSanction["status"];
  tone: Tone;
};
export type AppealRow = {
  id: string;
  appealId: number;
  username: string;
  sanction: string;
  sanctionId: number;
  submitted: string;
  reason: string;
  status: string;
  rawStatus: ApiAppeal["api_status"];
  evidence: unknown;
  reviewer: string;
  decisionReason: string;
  reviewNotes: string;
};
export type HistoryRow = {
  id: string;
  actionId: number;
  date: string;
  time: string;
  actor: string;
  action: string;
  actionType: string;
  record: string;
  recordSub: string;
  reason: string;
  result: string;
  resultTone: Tone;
  reportId: number | null;
  reportKind: ReportKind | null;
};
export type Dashboard = {
  stats: {
    pending_reports: number;
    under_review: number;
    resolved_reports: number;
    active_sanctions: number;
    pending_appeals: number;
  };
  categories: [string, number][];
  queue: ReportRow[];
  reasons: string[];
};

/* ---------- helpers ---------- */
export const humanize = (s: string) => s.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
const fmt = (iso: string) => new Date(iso).toLocaleString();
const PREFIX: Record<ReportKind, string> = { review: "R", comment: "C", playlist: "P" };
const REPORT_STATUS: Record<ReportStatus, string> = {
  open: "Pending",
  reviewing: "Under review",
  resolved: "Resolved",
  dismissed: "Dismissed",
};
const SANCTION_TONE: Record<ApiSanction["status"], Tone> = {
  active: "red",
  permanent: "red",
  expired: "amber",
  revoked: "green",
};
const APPEAL_STATUS: Record<ApiAppeal["api_status"], string> = {
  pending: "Pending",
  under_review: "Under review",
  approved: "Approved",
  rejected: "Rejected",
};

export function errorMessage(e: unknown, fallback = "Unable to load moderation data. Please try again."): string {
  const err = e as { response?: { status?: number; data?: any } };
  const status = err?.response?.status;
  const data = err?.response?.data;
  const detail = typeof data?.detail === "string" ? data.detail : null;
  if (status === 401) return "Your session has expired. Please log in again.";
  if (status === 403) {
    return detail && !/permission/i.test(detail) ? detail : "You do not have permission to access this section.";
  }
  if (detail) return detail;
  if (data && typeof data === "object") {
    const first = Object.values(data)[0];
    if (first) return String(Array.isArray(first) ? first[0] : first);
  }
  return fallback;
}

async function request<T>(
  path: string,
  method: "get" | "post" | "patch" = "get",
  data?: unknown,
  params?: Record<string, unknown>,
): Promise<T> {
  const response = await api.request<T>({ url: `/moderation/${path}`, method, data, params });
  return response.data;
}

/* ---------- mappers ---------- */
function mapReport(r: ApiReport): ReportRow {
  return {
    id: `${PREFIX[r.kind]}-${r.id}`,
    reportId: r.id,
    kind: r.kind,
    reporter: r.reporter.username,
    reportedUser: r.reported_user_username || r.target.author,
    category: humanize(r.reason),
    reason: r.reason,
    content: r.target.text,
    contentSub: `${humanize(r.target.type)} by ${r.target.author}`,
    details: r.details ?? "",
    date: fmt(r.created_at),
    status: REPORT_STATUS[r.status] ?? r.status,
    rawStatus: r.status,
    priority: r.priority === "high" ? "High" : "Medium",
  };
}

function mapSanction(s: ApiSanction): SanctionRow {
  return {
    id: `S-${s.id}`,
    sanctionId: s.id,
    username: s.username,
    action: humanize(s.sanction_type),
    reason: s.reason,
    moderator: s.moderator_username,
    window: `${fmt(s.starts_at)} → ${s.ends_at ? fmt(s.ends_at) : "Permanent"}`,
    status: humanize(s.status),
    rawStatus: s.status,
    tone: SANCTION_TONE[s.status] ?? "amber",
  };
}

function mapAppeal(a: ApiAppeal): AppealRow {
  return {
    id: `A-${a.id}`,
    appealId: a.id,
    username: a.username,
    sanction: `${humanize(a.sanction_type)} · S-${a.sanction_id}`,
    sanctionId: a.sanction_id,
    submitted: fmt(a.created_at),
    reason: a.message,
    status: APPEAL_STATUS[a.api_status] ?? a.api_status,
    rawStatus: a.api_status,
    evidence: a.evidence,
    reviewer: a.reviewer_username ?? "",
    decisionReason: a.decision_reason ?? "",
    reviewNotes: a.review_notes ?? "",
  };
}

function historyLabel(a: ApiHistory): string {
  const m = a.metadata ?? {};
  if (m.event === "sanction_revoked") return "Sanction revoked";
  if (m.appeal_decision) return `Appeal ${m.appeal_decision}`;
  if (a.action_type === "dismiss_report") return "Report dismissed";
  if (m.status) return `Report marked ${m.status}`;
  if (a.action_type === "warn") return "Warning issued";
  if (a.action_type === "suspend") return "Suspension issued";
  if (a.action_type === "ban") return "Ban issued";
  return humanize(a.action_type);
}

function mapHistory(a: ApiHistory): HistoryRow {
  const iso = new Date(a.created_at).toISOString();
  const label = historyLabel(a);
  const refs = [
    a.report_id ? `Report #${a.report_id}` : null,
    a.sanction_id ? `S-${a.sanction_id}` : null,
    a.appeal_id ? `A-${a.appeal_id}` : null,
  ].filter(Boolean);
  const kind = a.metadata?.report_kind as ReportKind | undefined;
  return {
    id: `H-${a.id}`,
    actionId: a.id,
    date: iso.slice(0, 10),
    time: `${iso.slice(11, 16)} UTC`,
    actor: a.moderator,
    action: label,
    actionType: a.action_type,
    record: a.target_user ?? (a.report_id ? `Report #${a.report_id}` : "—"),
    recordSub: refs.join(" · ") || "—",
    reason: a.reason || "—",
    result: "Recorded",
    resultTone: /revoked|rejected|dismissed/i.test(label) ? "amber" : "green",
    reportId: a.report_id,
    reportKind: kind ?? null,
  };
}

/* ---------- dashboard ---------- */
export async function getModerationDashboard(): Promise<Dashboard> {
  const d = await request<{
    statistics: Dashboard["stats"];
    report_categories: { reason: string; count: number }[];
    prioritized_reports: ApiReport[];
  }>("dashboard/");
  return {
    stats: d.statistics,
    categories: d.report_categories.map((c) => [humanize(c.reason), c.count] as [string, number]),
    queue: d.prioritized_reports.map(mapReport),
    reasons: d.report_categories.map((c) => c.reason),
  };
}

/* ---------- reports ---------- */
export type ReportFilters = {
  status?: ReportStatus;
  search?: string;
  reason?: string;
  priority?: "high" | "normal" | "";
};

export async function getModerationReports(f: ReportFilters = {}): Promise<ReportRow[]> {
  const r = await request<ApiReport[] | Page<ApiReport>>("reports/", "get", undefined, {
    status: f.status || undefined,
    search: f.search || undefined,
    reason: f.reason || undefined,
    priority: f.priority || undefined,
    page_size: 100,
  });
  return list(r).map(mapReport);
}

export function updateModerationReport(kind: ReportKind, reportId: number, status: ReportStatus) {
  return request(`reports/${kind}/${reportId}/`, "patch", { status });
}

export function reportReview(reviewId: number, reason: string, details?: string) {
  return request(`reviews/${reviewId}/report/`, "post", { reason, details });
}
export function reportComment(commentId: number, reason: string, details?: string) {
  return request(`comments/${commentId}/report/`, "post", { reason, details });
}
export function reportPlaylist(playlistId: number, reason: string, details?: string) {
  return request(`playlists/${playlistId}/report/`, "post", { reason, details });
}

/* ---------- sanctions ---------- */
export type SanctionPayload = {
  user_id: number;
  report_id?: number;
  report_kind?: ReportKind;
  sanction_type: string;
  duration?: number | null; // days; required for temporary types, omitted otherwise
  reason: string;
  internal_notes?: string;
  metadata?: Record<string, unknown>;
};

export type SanctionCase = {
  report: ReportRow;
  kind: ReportKind;
  reportedUser: { id: number; username: string } | null;
  sanctions: SanctionRow[];
};

export async function getSanctionCase(reportId: number, kind: ReportKind): Promise<SanctionCase> {
  const c = await request<{
    report: ApiReport;
    report_kind: ReportKind;
    reported_user: { id: number; username: string } | null;
    sanctions: ApiSanction[];
  }>(`sanctions/cases/${reportId}/`, "get", undefined, { kind });
  return {
    report: mapReport(c.report),
    kind: c.report_kind,
    reportedUser: c.reported_user,
    sanctions: c.sanctions.map(mapSanction),
  };
}

export async function getSanctions(): Promise<SanctionRow[]> {
  const r = await request<ApiSanction[] | Page<ApiSanction>>("sanctions/", "get", undefined, { page_size: 100 });
  return list(r).map(mapSanction);
}

export async function createSanction(payload: SanctionPayload) {
  return mapSanction(await request<ApiSanction>("sanctions/", "post", payload));
}

export async function revokeSanction(sanctionId: number, reason: string) {
  return mapSanction(await request<ApiSanction>(`sanctions/${sanctionId}/revoke/`, "post", { reason }));
}

export function getSanctionDashboard() {
  return request<{ statistics: Record<string, number> }>("sanctions/dashboard/");
}

/* ---------- appeals ---------- */
export type AppealDecisionPayload = {
  decision: "approved" | "rejected";
  decision_reason: string;
  review_notes?: string;
};

export type AppealDetail = {
  appeal: AppealRow;
  sanction: SanctionRow;
  actions: { id: number; action_type: string; moderator: string; reason: string; created_at: string }[];
};

export async function getAppeals(status?: string, search?: string): Promise<AppealRow[]> {
  const r = await request<ApiAppeal[] | Page<ApiAppeal>>("appeals/", "get", undefined, {
    status: status || undefined,
    search: search || undefined,
    page_size: 100,
  });
  return list(r).map(mapAppeal);
}

export async function getAppeal(appealId: number): Promise<AppealDetail> {
  const d = await request<{
    appeal: ApiAppeal;
    sanction: ApiSanction;
    actions: AppealDetail["actions"];
  }>(`appeals/${appealId}/`);
  return { appeal: mapAppeal(d.appeal), sanction: mapSanction(d.sanction), actions: d.actions };
}

export async function decideAppeal(appealId: number, payload: AppealDecisionPayload) {
  return mapAppeal(await request<ApiAppeal>(`appeals/${appealId}/decision/`, "post", payload));
}

export function getAppealDashboard() {
  return request<{
    pending_appeals: number;
    under_review_appeals: number;
    approved_appeals: number;
    rejected_appeals: number;
    average_resolution_seconds: number;
  }>("appeals/dashboard/");
}

/* ---------- history ---------- */
export async function getModerationHistory(
  f: { search?: string; action_type?: string } = {},
): Promise<HistoryRow[]> {
  const r = await request<ApiHistory[] | Page<ApiHistory>>("history/", "get", undefined, {
    search: f.search || undefined,
    action_type: f.action_type || undefined,
    page_size: 100,
  });
  return list(r).map(mapHistory);
}

export async function getModerationHistoryDetail(actionId: number) {
  const d = await request<{ action: ApiHistory; related_actions: ApiHistory[] }>(`history/${actionId}/`);
  return { action: mapHistory(d.action), related: d.related_actions.map(mapHistory) };
}

export async function downloadHistoryCsv() {
  const r = await api.get<Blob>("/moderation/history/export/", { responseType: "blob" });
  const url = URL.createObjectURL(r.data);
  const a = document.createElement("a");
  a.href = url;
  a.download = "moderation-history.csv";
  a.click();
  URL.revokeObjectURL(url);
}