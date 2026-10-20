import api from "@/lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SocialUser {
id: number;
username: string;
nickname: string | null;
avatar_url: string | null;
}

export interface Friendship {
id: number;
user: SocialUser;
friend: SocialUser;
status: string;
created_at: string;
}

export interface FriendRequestList {
count: number;
results: Friendship[];
}

export interface SuggestedUser extends SocialUser {
// Add extra fields here if SuggestedUserSerializer returns them.
}

export interface Notification {
id: number;
// Match these fields to your actual NotificationSerializer.
[key: string]: unknown;
}

export interface PaginatedSocialList<T> {
count: number;
results: T[];
}

// ─── Suggested Players ───────────────────────────────────────────────────────

export async function getSuggestedPlayers(
search = "",
): Promise<SuggestedUser[]> {
const { data } = await api.get<PaginatedSocialList<SuggestedUser>>(
"/social/suggested-players/",
{ params: { search, limit: 50 } },
);

return data.results ?? [];
}

// ─── Friends ─────────────────────────────────────────────────────────────────

export async function getFriends(search = ""): Promise<SocialUser[]> {
const { data } = await api.get<PaginatedSocialList<SocialUser>>(
"/social/friends/",
{ params: { search, limit: 100 } },
);

return data.results ?? [];
}

export async function removeFriend(username: string): Promise<void> {
await api.delete(`/social/friends/${encodeURIComponent(username)}/`);
}

// ─── Friend Requests ─────────────────────────────────────────────────────────

export async function getFriendRequests(
direction: "incoming" | "outgoing",
): Promise<FriendRequestList> {
const { data } = await api.get<FriendRequestList>(
"/social/friend-requests/",
{ params: { direction } },
);

return data;
}

export async function sendFriendRequest(
username: string,
): Promise<Friendship> {
const { data } = await api.post<Friendship>(
"/social/friend-requests/",
{ username },
);

return data;
}

export async function acceptFriendRequest(id: number): Promise<Friendship> {
const { data } = await api.post<Friendship>(
`/social/friend-requests/${id}/accept/`,
);

return data;
}

export async function declineFriendRequest(id: number): Promise<void> {
await api.post(`/social/friend-requests/${id}/decline/`);
}

export async function cancelFriendRequest(id: number): Promise<void> {
await api.post(`/social/friend-requests/${id}/cancel/`);
}

// ─── Blocks ──────────────────────────────────────────────────────────────────

export async function getBlockedUsers(): Promise<SocialUser[]> {
const { data } = await api.get<PaginatedSocialList<SocialUser>>(
"/social/blocks/",
);

return data.results ?? [];
}

export async function blockUser(username: string): Promise<unknown> {
const { data } = await api.post("/social/blocks/", { username });
return data;
}

export async function unblockUser(username: string): Promise<void> {
await api.delete(`/social/blocks/${encodeURIComponent(username)}/`);
}

// ─── Notifications ───────────────────────────────────────────────────────────

export async function getNotifications(
unreadOnly = false,
): Promise<PaginatedSocialList<Notification>> {
const { data } = await api.get<PaginatedSocialList<Notification>>(
"/social/notifications/",
{ params: unreadOnly ? { unread: 1 } : {} },
);

return data;
}

export async function markNotificationRead(id: number): Promise<unknown> {
const { data } = await api.post(`/social/notifications/${id}/read/`);
return data;
}

export async function markAllNotificationsRead(): Promise<unknown> {
const { data } = await api.post("/social/notifications/read-all/");
return data;
}