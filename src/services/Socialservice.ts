import api from "@/lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────
export interface SocialUser {
  id: number;
  username: string;
  nickname: string | null;
  avatar_url: string | null;
  bio?: string | null;
  favorites?: Array<{ id?: number; title: string; image?: string | null }>;
}

export interface Friendship {
  id: number;
  user: SocialUser;
  friend?: SocialUser;
  status: string;
  created_at: string;
}

export interface FriendRequestList {
  count: number;
  results: Friendship[];
}

export interface SuggestedUser extends SocialUser {}

export interface PaginatedSocialList<T> {
  count: number;
  results: T[];
}

// Safely extracts data whether the backend returns a paginated object or raw array
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

// ─── Suggested Players ───────────────────────────────────────────────────────
export async function getSuggestedPlayers(
  search = "",
): Promise<SuggestedUser[]> {
  const { data } = await api.get(
    "/users/suggested-players/",
    { params: { search, limit: 50 } },
  );
  return extractResults<SuggestedUser>(data);
}

// ─── Friends ─────────────────────────────────────────────────────────────────
export async function getFriends(search = ""): Promise<SocialUser[]> {
  const { data } = await api.get(
    "/users/friends/",
    { params: { search, limit: 100 } },
  );
  return extractResults<SocialUser>(data);
}

export async function removeFriend(username: string): Promise<void> {
  await api.delete(`/users/friends/${encodeURIComponent(username)}/`);
}

// ─── Friend Requests ─────────────────────────────────────────────────────────
export async function getFriendRequests(
  direction: "incoming" | "outgoing",
): Promise<FriendRequestList> {
  const { data } = await api.get(
    "/users/friend-requests/",
    { params: { direction } },
  );
  const results = extractResults<Friendship>(data);
  const count =
    data && typeof data === "object" && "count" in data
      ? Number((data as { count: unknown }).count)
      : results.length;
  return { count, results };
}

export async function sendFriendRequest(
  username: string,
): Promise<Friendship> {
  const { data } = await api.post<Friendship>(
    "/users/friend-requests/",
    { username },
  );
  return data;
}

export async function acceptFriendRequest(id: number): Promise<Friendship> {
  const { data } = await api.post<Friendship>(
    `/users/friend-requests/${id}/accept/`,
  );
  return data;
}

export async function declineFriendRequest(id: number): Promise<void> {
  await api.post(`/users/friend-requests/${id}/decline/`);
}

export async function cancelFriendRequest(id: number): Promise<void> {
  await api.post(`/users/friend-requests/${id}/cancel/`);
}

// ─── Blocks ──────────────────────────────────────────────────────────────────
export async function getBlockedUsers(): Promise<SocialUser[]> {
  const { data } = await api.get("/users/blocks/");
  return extractResults<SocialUser>(data);
}

export async function blockUser(username: string): Promise<unknown> {
  const { data } = await api.post("/users/blocks/", { username });
  return data;
}

export async function unblockUser(username: string): Promise<void> {
  await api.delete(`/users/blocks/${encodeURIComponent(username)}/`);
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