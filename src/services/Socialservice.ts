import api from "@/lib/api";

export interface PaginatedSocialList<T> {
  count: number;
  results: T[];
}

function extractResults<T>(data: unknown): T[] {
  if (Array.isArray(data)) {
    return data as T[];
  }
  if (
    data &&
    typeof data === "object" &&
    "results" in data &&
    Array.isArray((data as { results: unknown }).results)
  ) {
    return (data as { results: T[] }).results;
  }
  return [];
}

// ─── Notifications ───────────────────────────────────────────────────────────
export async function getNotifications(
  unreadOnly = false,
): Promise<PaginatedSocialList<Record<string, unknown>>> {
  const { data } = await api.get(
    "/social/notifications/",
    { params: unreadOnly ? { unread: 1 } : {} },
  );
  const results = extractResults<Record<string, unknown>>(data);
  const count =
    data && typeof data === "object" && "count" in data
      ? Number((data as { count: unknown }).count)
      : results.length;
  return { count, results };
}

export async function markNotificationRead(id: number): Promise<unknown> {
  const { data } = await api.post(`/social/notifications/${id}/read/`);
  return data;
}

export async function markAllNotificationsRead(): Promise<unknown> {
  const { data } = await api.post("/social/notifications/read-all/");
  return data;
}