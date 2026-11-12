import type { Tone } from "../../components/ui/Modui";

export type ReportPriority = "High" | "Medium" | "Low";
export type ReportStatus = "Pending" | "Under review" | "Resolved";

export type Report = {
  id: string;
  reporter: string;
  category: string;
  content: string;
  contentSub: string;
  date: string;
  status: ReportStatus;
  priority: ReportPriority;
};

export type Appeal = {
  id: string;
  username: string;
  sanction: string;
  submitted: string;
  reason: string;
  status: string;
};

export type PriorSanction = {
  id: string;
  action: string;
  reason: string;
  moderator: string;
  window: string;
  status: string;
};

export type AuditEvent = {
  id: string;
  date: string;
  time: string;
  actor: string;
  actorRole: string;
  action: string;
  actionType: string;
  record: string;
  recordSub: string;
  reason: string;
  result: string;
  resultSub: string;
  resultTone: Tone;
  detail: string;
};

export const REPORTS: Report[] = [
  {
    id: "R-1048",
    reporter: "Hades",
    category: "Harassment",
    content: "A frustrating first run",
    contentSub: "AshRunner · Hollow Knight",
    date: "02 Nov 2026, 09:24 UTC",
    status: "Pending",
    priority: "High",
  },
  {
    id: "R-1047",
    reporter: "Nova",
    category: "Spam",
    content: "Repeated promotional replies",
    contentSub: "PixelDrift · 4 replies",
    date: "02 Nov 2026, 08:51 UTC",
    status: "Under review",
    priority: "Medium",
  },
  {
    id: "R-1046",
    reporter: "Moss",
    category: "Spoilers",
    content: "Ending disclosed in title",
    contentSub: "OrbitFall · Review RV-0524",
    date: "01 Nov 2026, 19:42 UTC",
    status: "Pending",
    priority: "Medium",
  },
  {
    id: "R-1045",
    reporter: "Kite",
    category: "Harassment",
    content: "Personal attack in discussion",
    contentSub: "AshRunner · Thread T-208",
    date: "01 Nov 2026, 16:10 UTC",
    status: "Resolved",
    priority: "Low",
  },
];

export const APPEALS: Appeal[] = [
  { id: "A-031", username: "PixelDrift", sanction: "S-0208 · Suspension", submitted: "02 Nov 2026, 08:35 UTC", reason: "Request to reduce suspension duration", status: "Pending" },
  { id: "A-030", username: "AshRunner", sanction: "S-0201 · Warning", submitted: "01 Nov 2026, 16:02 UTC", reason: "Additional context provided", status: "Under review" },
  { id: "A-029", username: "Moss", sanction: "S-0198 · Mute", submitted: "01 Nov 2026, 04:12 UTC", reason: "Requests a shorter mute", status: "Pending" },
];

export const PRIOR_SANCTIONS: PriorSanction[] = [
  { id: "S-0201", action: "Warning", reason: "Respectful discussion §2.1", moderator: "Maya Ross", window: "28 Oct 2026 · Completed", status: "Completed" },
];

export const AUDIT_EVENTS: AuditEvent[] = [
  { id: "AU-0145", date: "02 Nov 2026", time: "09:24 UTC", actor: "Maya Ross", actorRole: "Moderator", action: "Report assigned", actionType: "Assignment", record: "R-1048 · RV-0526", recordSub: "AshRunner", reason: "Self-assigned for triage", result: "Assigned", resultSub: "Pending review", resultTone: "blue", detail: "View" },
  { id: "AU-0144", date: "02 Nov 2026", time: "08:35 UTC", actor: "Intake service", actorRole: "System", action: "Appeal received", actionType: "Appeal intake", record: "A-031 · S-0208", recordSub: "PixelDrift", reason: "New appeal submitted", result: "Delivered", resultSub: "Independent review required", resultTone: "amber", detail: "View" },
];

export const CATEGORY_OVERVIEW: [string, number][] = [
  ["Harassment", 18],
  ["Spam", 13],
  ["Spoilers", 9],
  ["Other", 8],
];

export function priorityTone(priority: ReportPriority): Tone {
  return priority === "High" ? "red" : priority === "Medium" ? "amber" : "neutral";
}

export function reportStatusTone(status: ReportStatus): Tone {
  return status === "Resolved" ? "green" : status === "Under review" ? "blue" : "amber";
}
