export type ModerationDashboard = {
  pending_reports: number;
  under_review: number;
  resolved_reports: number;
  dismissed_reports: number;
  recent_reports: unknown[];
};

async function moderationRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/v1/moderation/${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Moderation request failed (${response.status})`);
  }

  return response.json() as Promise<T>;
}

export function getModerationDashboard() {
  return moderationRequest<ModerationDashboard>("dashboard/");
}

export function getModerationReports(status?: string) {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return moderationRequest<Array<{
    id: number;
    kind: "review" | "comment" | "playlist";
    reporter: { username: string };
    target: { author: string; text: string; type: string };
    reason: string;
    status: string;
    created_at: string;
  }>>(`reports/${query}`).then((reports): Report[] =>
    reports.map((report) => ({
      id: `${report.kind === "review" ? "R" : report.kind === "comment" ? "C" : "P"}-${report.id}`,
      reporter: report.reporter.username,
      category: report.reason,
      content: report.target.text,
      contentSub: `${report.target.type} by ${report.target.author}`,
      date: new Date(report.created_at).toLocaleString(),
      status: report.status === "reviewing" ? "Under review" : report.status,
      priority: "Medium",
    } as Report)),
  );
}

export function updateModerationReport(
  kind: "review" | "comment",
  reportId: number,
  status: "open" | "reviewing" | "resolved" | "dismissed",
) {
  return moderationRequest(`reports/${kind}/${reportId}/`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function getModerationActions() {
  return moderationRequest<unknown[]>("actions/");
}
import type { Report } from "./modData";

