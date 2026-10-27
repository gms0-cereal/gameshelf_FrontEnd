import api from "@/lib/api";

export type Visibility = "public" | "friends" | "private";
export type LibraryStatus = "playing" | "completed" | "on_hold" | "dropped" | "plan_to_play";

export interface User {
  id: number;
  username: string;
  email: string;
  email_verified: boolean;
  nickname: string | null;
  bio: string | null;
  role: "user" | "moderator" | "admin";
  avatar_url: string | null;
  banner_url: string | null;
  age: number | null;
  gender: string | null;
  pronouns: string | null;
  library_visibility: Visibility;
  friends_visibility: Visibility;
  created_at: string;
}

export interface UserProfile {
  id: number;
  username: string;
  nickname: string | null;
  bio: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  age: number | null;
  gender: string | null;
  pronouns: string | null;
  joined: string;
  friend_count: number | null;
  library: Record<"all" | "playing" | "plan_to_play" | "completed" | "on_hold" | "dropped", number> | null;
  ratings_count: number;
  favorites?: UserFavoriteGameEntry[];
  reviews_count: number;
}

export type UpdateMeBody = Partial<
  Pick<
    User,
    | "nickname"
    | "bio"
    | "avatar_url"
    | "banner_url"
    | "age"
    | "gender"
    | "pronouns"
    | "library_visibility"
    | "friends_visibility"
  >
>;

export interface SocialUser {
  id: number;
  username: string;
  nickname: string | null;
  avatar_url: string | null;
  banner_url?: string | null; 
  bio?: string | null;
  favorites?: UserFavoriteGameEntry[];
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

export interface UserFavoriteGameEntry {
  id: number;
  game_id: number;
  steam_app_id?: number | null;
  title: string;
  cover_image_url?: string | null;
  genres: string[];
  is_favorite: boolean;
  position: number;
}

export interface UserAchievement {
  id: number;
  game_id: number;
  game_title?: string;
  achievement_api_name: string;
  title: string | null;
  description: string | null;
  icon_url: string | null;
  achieved: boolean;
  unlock_time: string | null;
  updated_at: string;
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

export async function getMe(): Promise<User> {
  const { data } = await api.get<User>("/users/me/");
  return data;
}

export async function updateMe(body: UpdateMeBody): Promise<User> {
  const { data } = await api.patch<User>("/users/me/", body);
  return data;
}

export async function getUserProfile(username: string): Promise<UserProfile> {
  const { data } = await api.get<UserProfile>(`/users/${encodeURIComponent(username)}/`);
  return data;
}

export async function getSuggestedPlayers(search = ""): Promise<SocialUser[]> {
  const { data } = await api.get("/users/suggested-players/", { params: { search, limit: 50 } });
  return extractResults<SocialUser>(data);
}

export async function getFriends(search = ""): Promise<SocialUser[]> {
  const { data } = await api.get("/users/friends/", { params: { search, limit: 100 } });
  return extractResults<SocialUser>(data);
}

export async function removeFriend(username: string): Promise<void> {
  await api.delete(`/users/friends/${encodeURIComponent(username)}/`);
}

export async function getFriendRequests(direction: "incoming" | "outgoing"): Promise<FriendRequestList> {
  const { data } = await api.get("/users/friend-requests/", { params: { direction } });
  const results = extractResults<Friendship>(data);
  const count = data && typeof data === "object" && "count" in data ? Number((data as { count: unknown }).count) : results.length;
  return { count, results };
}

export async function sendFriendRequest(username: string): Promise<Friendship> {
  const { data } = await api.post<Friendship>("/users/friend-requests/", { username });
  return data;
}

export async function acceptFriendRequest(id: number): Promise<Friendship> {
  const { data } = await api.post<Friendship>(`/users/friend-requests/${id}/accept/`);
  return data;
}

export async function declineFriendRequest(id: number): Promise<void> {
  await api.post(`/users/friend-requests/${id}/decline/`);
}

export async function cancelFriendRequest(id: number): Promise<void> {
  await api.post(`/users/friend-requests/${id}/cancel/`);
}

export async function getBlockedUsers(search = ""): Promise<SocialUser[]> {
  const { data } = await api.get("/users/blocks/", { params: { search } });
  return extractResults<SocialUser>(data);
}

export async function blockUser(username: string): Promise<unknown> {
  const { data } = await api.post("/users/blocks/", { username });
  return data;
}

export async function unblockUser(username: string): Promise<void> {
  await api.delete(`/users/blocks/${encodeURIComponent(username)}/`);
}

export async function reportUser(username: string, reason: string, details?: string): Promise<unknown> {
  const { data } = await api.post("/users/reports/", { username, reason, details });
  return data;
}

export async function getFavoriteGames(): Promise<UserFavoriteGameEntry[]> {
  const response = await api.get("/users/favorites/");
  return response.data;
}

export async function addFavoriteGame(steamAppId: number): Promise<UserFavoriteGameEntry> {
  const response = await api.post("/users/favorites/", { steam_app_id: steamAppId });
  return response.data;
}

export async function removeFavoriteGame(steamAppId: number): Promise<void> {
  await api.delete("/users/favorites/", { data: { steam_app_id: steamAppId } });
}

export async function getUserAchievements(username?: string): Promise<UserAchievement[]> {
  const endpoint = username ? `/users/${username}/achievements/` : `/users/achievements/`;
  const { data } = await api.get<UserAchievement[] | { results: UserAchievement[] }>(endpoint);
  return Array.isArray(data) ? data : (data.results ?? []);
}