import api from "./api";
import type { Appeal, AuditEvent, PriorSanction, Report } from "../pages/moderators/modData";

export type ModerationDashboard = {
  pending_reports: number;
  under_review: number;
  resolved_reports: number;
  dismissed_reports: number;
  recent_reports: ModerationReport[];
  active_sanctions?: number;
  pending_appeals?: number;
};

export type ModerationReport = {
  id: number;
  kind: "review" | "comment" | "playlist";
  reporter: { username: string };
  target: { author: string; text: string; type: string };
  reason: string;
  status: string;
  created_at: string;
};

export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type SanctionPayload = {
  user_id: number;
  sanction_type: string;
  reason: string;
  moderator_notes: string;
  user_facing_reason: string;
  expires_at?: string | null;
  report_id?: number;
};

export type AppealDecisionPayload = {
  outcome: "uphold" | "reduce" | "lift" | "reject";
  internal_reason: string;
  user_facing_explanation: string;
  new_end_date?: string | null;
};

async function moderationRequest<T>(path: string, method: "get" | "post" | "patch" = "get", data?: unknown): Promise<T> {
  const response = await api.request<T>({
    url: `/moderation/${path}`,
    method,
    data,
  });
  return response.data;
}

function listResponse<T>(response: T[] | PaginatedResponse<T>): T[] {
  return Array.isArray(response) ? response : response.results;
}

function mapReport(report: ModerationReport): Report {
  return {
    id: `${report.kind === "review" ? "R" : report.kind === "comment" ? "C" : "P"}-${report.id}`,
    reporter: report.reporter.username,
    category: report.reason,
    content: report.target.text,
    contentSub: `${report.target.type} by ${report.target.author}`,
    date: new Date(report.created_at).toLocaleString(),
    status: report.status === "reviewing" ? "Under review" : report.status,
    priority: "Medium",
  } as Report;
}

export function getModerationDashboard() {
  return moderationRequest<ModerationDashboard>("dashboard/");
}

export async function getModerationReports(status?: string) {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  const reports = await moderationRequest<ModerationReport[] | PaginatedResponse<ModerationReport>>(`reports/${query}`);
  return listResponse(reports).map(mapReport);
}

export function updateModerationReport(
  kind: "review" | "comment" | "playlist",
  reportId: number,
  status: "open" | "reviewing" | "resolved" | "dismissed",
) {
  return moderationRequest(`reports/${kind}/${reportId}/`, "patch", { status });
}

export function reportReview(reviewId: number, reason: string) {
  return moderationRequest(`reviews/${reviewId}/report/`, "post", { reason });
}

export function reportComment(commentId: number, reason: string) {
  return moderationRequest(`comments/${commentId}/report/`, "post", { reason });
}

export function getModerationActions() {
  return moderationRequest<unknown[]>("actions/");
}

export async function getSanctionDashboard() {
  return moderationRequest<Record<string, number>>("sanctions/dashboard/");
}

export async function getSanctions() {
  const response = await moderationRequest<PriorSanction[] | PaginatedResponse<PriorSanction>>("sanctions/");
  return listResponse(response);
}

export function getSanction(sanctionId: number) {
  return moderationRequest<PriorSanction>(`sanctions/${sanctionId}/`);
}

export function createSanction(payload: SanctionPayload) {
  return moderationRequest<PriorSanction>("sanctions/", "post", payload);
}

export function updateSanction(sanctionId: number, payload: Partial<SanctionPayload>) {
  return moderationRequest<PriorSanction>(`sanctions/${sanctionId}/`, "patch", payload);
}

export function revokeSanction(sanctionId: number, reason: string) {
  return moderationRequest<PriorSanction>(`sanctions/${sanctionId}/revoke/`, "post", { reason });
}

export function getSanctionCase(reportId: number) {
  return moderationRequest<unknown>(`sanctions/cases/${reportId}/`);
}

export async function getAppeals() {
  const response = await moderationRequest<Appeal[] | PaginatedResponse<Appeal>>("appeals/");
  return listResponse(response);
}

export function getAppeal(appealId: number) {
  return moderationRequest<Appeal>(`appeals/${appealId}/`);
}

export function decideAppeal(appealId: number, payload: AppealDecisionPayload) {
  return moderationRequest<Appeal>(`appeals/${appealId}/decision/`, "post", payload);
}

export async function getAppealDashboard() {
  return moderationRequest<Record<string, number>>("appeals/dashboard/");
}

export async function getModerationHistory() {
  const response = await moderationRequest<AuditEvent[] | PaginatedResponse<AuditEvent>>("history/");
  return listResponse(response);
}

export function getModerationHistoryEntry(actionId: number) {
  return moderationRequest<AuditEvent>(`history/${actionId}/`);
}

export async function exportModerationHistory() {
  const response = await api.get<Blob>("/moderation/history/export/", { responseType: "blob" });
  return response.data;
}
