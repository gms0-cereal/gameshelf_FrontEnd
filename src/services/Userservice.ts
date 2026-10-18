import api from "../lib/api";

export type Visibility = "public" | "friends" | "private";
export type LibraryStatus = "playing" | "completed" | "on_hold" | "dropped" | "plan_to_play";

// The logged-in user (GET /users/me/ and the login response)
export interface User {
  id: number;
  username: string;
  email: string;
  email_verified: boolean;
  role: "user" | "moderator" | "admin";
  nickname: string | null;
  bio: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  library_visibility: Visibility;
  friends_visibility: Visibility;
  created_at: string;
}

// What other people see (GET /users/<username>/). null means "hidden by their privacy settings".
export interface UserProfile {
  id: number;
  username: string;
  nickname: string | null;
  bio: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  joined: string;
  friend_count: number | null;
  library: Record<LibraryStatus, number> | null;
  ratings_count: number;
  reviews_count: number;
}

export type UpdateMeBody = Partial<
  Pick<
    User,
    "nickname" | "bio" | "avatar_url" | "banner_url" | "library_visibility" | "friends_visibility"
  >
>;

// GET /users/me/  (a 403 means nobody is logged in)
export async function getMe(): Promise<User> {
  const { data } = await api.get<User>("/users/me/");
  return data;
}

// PATCH /users/me/
export async function updateMe(body: UpdateMeBody): Promise<User> {
  const { data } = await api.patch<User>("/users/me/", body);
  return data;
}

// GET /users/<username>/
export async function getUserProfile(username: string): Promise<UserProfile> {
  const { data } = await api.get<UserProfile>(`/users/${encodeURIComponent(username)}/`);
  return data;
}