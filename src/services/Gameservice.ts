
import { useCallback } from "react";
import api from "../lib/api";

// ---------------------------------------------------------------------------
// Core game models
// ---------------------------------------------------------------------------
export interface GameListItem {
  id: number;
  title: string;
  slug: string | null;
  cover_image_url: string | null;
  release_date: string | null;
  game_type: "base" | "dlc" | "expansion";
  genres?: string[];
}

export interface GameDetail extends GameListItem {
  description: string | null;
  banner_image_url: string | null;
  parent_game: number | null;
  genres: string[];
  tags: string[];
  developers: string[];
  publishers: string[];
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface PopularGameItem {
  appid: number;
  name: string;
  header_image: string;
  popularity_score: number;
  short_description?: string;
  bayesian_score?: number | null;
  community_rating?: number | null;
  average_rating?: number | null;
  rating_count?: number;
}

// ---------------------------------------------------------------------------
// Steam list
// ---------------------------------------------------------------------------
export interface SteamGame {
  appid: number;
  name: string;
}

export interface SteamGameListResponse {
  games: SteamGame[];
  last_appid: number | null;
  have_more_results: boolean;
}

// ---------------------------------------------------------------------------
// Steam game cards (details + GameShelf rating)
// Returned by /games/steam/summaries/ and /games/steam/?expand=1
// ---------------------------------------------------------------------------
export interface SteamGameCard {
  appid: number;
  name: string;
  header_image: string;
  genres: string[];
  platforms: string[];
  release_year: number | null;
  price: string | null;

  // Steam / external score
  score: number | null;
  metacritic_score: number | null;

  short_description: string;

  // Third-party rating (Steam), 0-10
  steam_rating: {
    score: number;
    label: string;
    total_reviews: number;
  } | null;

  // GameShelf community ratings
  community_rating: number | null;
  bayesian_score?: number | null;
  average_rating?: number | null;
  rating_count: number;

  // Logged-in user's own rating
  my_score: number | null;
}

export interface SteamGameCardListResponse {
  games: SteamGameCard[];
  last_appid: number | null;
  have_more_results: boolean;
}

// ---------------------------------------------------------------------------
// Steam details
// store.steampowered.com/api/appdetails -> data
// ---------------------------------------------------------------------------
export interface SteamScreenshot {
  id: number;
  path_thumbnail: string;
  path_full: string;
}

export interface SteamMovie {
  id: number;
  name: string;
  thumbnail: string;
  webm?: Record<string, string>;
  mp4?: Record<string, string>;
}

export interface SteamRequirements {
  minimum?: string;
  recommended?: string;
}

export interface SteamGameDetail {
  steam_appid: number;
  name: string;
  type: string;
  is_free: boolean;
  short_description: string;
  about_the_game: string;
  header_image: string;
  background_raw?: string;
  developers?: string[];
  publishers?: string[];
  genres?: { id: string; description: string }[];
  platforms?: {
    windows: boolean;
    mac: boolean;
    linux: boolean;
  };
  release_date?: {
    coming_soon: boolean;
    date: string;
  };
  price_overview?: {
    final_formatted: string;
    discount_percent: number;
  };
  metacritic?: {
    score: number;
    url: string;
  };
  screenshots?: SteamScreenshot[];
  movies?: SteamMovie[];
  dlc?: number[];
  pc_requirements?: SteamRequirements | [];
  mac_requirements?: SteamRequirements | [];
  linux_requirements?: SteamRequirements | [];

  bayesian_score?: number | null;
  community_rating?: number | null;
  average_rating?: number | null;
  rating_count?: number;
  my_score?: number | null;
}

// ---------------------------------------------------------------------------
// Similar games
// ---------------------------------------------------------------------------
export interface SimilarGameResult {
  game: {
    id: number;
    appid: number;
    title: string;
    slug: string | null;
    cover_image_url: string | null;
    header_image?: string | null;
    release_date: string | null;
    genres: string[];

    // GameShelf ratings
    bayesian_score?: number | null;
    community_rating?: number | null;
    average_rating?: number | null;
    rating_count?: number;
  };
  score: number;
  rank: number;
  reason?: {
    shared_features?: string[];
  };
}

export interface SimilarGamesResponse {
  results: SimilarGameResult[];
}

// GET /similar/<app_id>/
export async function getSimilarGames(
  appId: number | string,
  signal?: AbortSignal
): Promise<SimilarGameResult[]> {
  const { data } = await api.get<SimilarGamesResponse>(
    `/similar/${appId}/`,
    { signal }
  );

  return data.results;
}

// ---------------------------------------------------------------------------
// Steam reviews
// ---------------------------------------------------------------------------
export interface SteamReview {
  recommendationid: string;
  author: {
    steamid: string;
    playtime_forever?: number;
  };
  review: string;
  voted_up: boolean;
  votes_up: number;
  timestamp_created: number;
}

// ---------------------------------------------------------------------------
// GameShelf community reviews
// ---------------------------------------------------------------------------
export interface GameShelfReview {
  id: number | string;
  username: string;
  rating: number | null;
  content: string;
  created_at: string | null;
  likes: number;
}

function normalizeReview(raw: any): GameShelfReview {
  const author = raw.author;

  return {
    id: raw.id,
    username:
      typeof author === "string"
        ? author
        : (author?.username ?? raw.username ?? "GameShelf user"),
    rating: raw.rating ?? null,
    content: raw.content ?? "",
    created_at: raw.created_at ?? null,
    likes: raw.like_count ?? 0,
  };
}

export interface SteamReviewsResponse {
  summary: {
    total_positive?: number;
    total_negative?: number;
    total_reviews?: number;
    review_score_desc?: string;
  };
  reviews: SteamReview[];
  cursor: string;
  total_matching: number;
}

// GET /reviews/<id>
export async function getGameShelfReviews(
  gameId: number | string
): Promise<GameShelfReview[]> {
  const { data } = await api.get(`/reviews/${gameId}`);
  const list = Array.isArray(data) ? data : (data?.results ?? []);

  return list.map(normalizeReview);
}

// ---------------------------------------------------------------------------
// Game catalog
// ---------------------------------------------------------------------------

// GET /games/?page=1
export async function getGames(
  page = 1
): Promise<Paginated<GameListItem>> {
  const { data } = await api.get<Paginated<GameListItem>>(
    "/games/",
    { params: { page } }
  );

  return data;
}

// GET /games/<id>/
export async function getGame(id: number): Promise<GameDetail> {
  const { data } = await api.get<GameDetail>(`/games/${id}/`);
  return data;
}

// ---------------------------------------------------------------------------
// Steam games
// ---------------------------------------------------------------------------

// GET /games/steam/
export async function getSteamGames(
  limit = 12,
  lastAppId = 0
): Promise<SteamGameListResponse> {
  const { data } = await api.get<SteamGameListResponse>(
    "/games/steam/",
    {
      params: {
        limit,
        last_appid: lastAppId,
      },
    }
  );

  return data;
}

// GET /games/steam/?expand=1
export async function getSteamGamesExpanded(
  limit = 12,
  lastAppId = 0
): Promise<SteamGameCardListResponse> {
  const { data } = await api.get<SteamGameCardListResponse>(
    "/games/steam/",
    {
      params: {
        limit,
        last_appid: lastAppId,
        expand: 1,
      },
    }
  );

  return data;
}

// GET /games/steam/summaries/?appids=1,2,3
export async function getSteamGameSummaries(
  appIds: number[]
): Promise<SteamGameCard[]> {
  if (appIds.length === 0) return [];

  const { data } = await api.get<{ results: SteamGameCard[] }>(
    "/games/steam/summaries/",
    {
      params: {
        appids: appIds.join(","),
      },
    }
  );

  return data.results;
}

// GET /games/steam/<app_id>/
export async function getSteamGameDetails(
  appId: number | string
): Promise<SteamGameDetail> {
  const { data } = await api.get<SteamGameDetail>(
    `/games/steam/${appId}/`
  );

  return data;
}

// GET /games/steam/<app_id>/reviews/
export async function getSteamGameReviews(
  appId: number | string,
  cursor = "*",
  numPerPage = 5
): Promise<SteamReviewsResponse> {
  const { data } = await api.get<SteamReviewsResponse>(
    `/games/steam/${appId}/reviews/`,
    {
      params: {
        cursor,
        num_per_page: numPerPage,
      },
    }
  );

  return data;
}

// ---------------------------------------------------------------------------
// My list (requires the user to be logged in)
// ---------------------------------------------------------------------------
export type ListStatus =
  | "playing"
  | "plan_to_play"
  | "completed"
  | "on_hold"
  | "dropped";

export const LIST_STATUS_OPTIONS: {
  value: ListStatus;
  label: string;
}[] = [
  { value: "playing", label: "Playing" },
  { value: "plan_to_play", label: "Plan to Play" },
  { value: "completed", label: "Completed" },
  { value: "on_hold", label: "On Hold" },
  { value: "dropped", label: "Dropped" },
];

export interface UserGameEntry {
  id: number;
  game_id: number;
  steam_app_id: number | null;
  title: string;
  cover_image_url: string | null;
  genres: string[];
  status: ListStatus;
  progress: number | null;
  is_favorite?: boolean;
  started_at: string | null;
  completed_at: string | null;
  notes: string | null;
  score?: number | null;
}

export interface UserGameListResponse {
  counts: Record<"all" | ListStatus, number>;
  results: UserGameEntry[];
}

export type ListStatusCheck =
  | { in_list: false }
  | ({ in_list: true } & UserGameEntry);

// GET /games/list/?status=&search=
export async function getMyGameList(
  params: {
    status?: ListStatus | "all";
    search?: string;
  } = {}
): Promise<UserGameListResponse> {
  const { data } = await api.get<UserGameListResponse>(
    "/list/",
    {
      params: {
        status:
          params.status && params.status !== "all"
            ? params.status
            : undefined,
        search: params.search || undefined,
      },
    }
  );

  return data;
}

// POST /games/list/
export async function addToMyList(
  steamAppId: number | string,
  status: ListStatus = "plan_to_play"
): Promise<UserGameEntry> {
  const { data } = await api.post<UserGameEntry>(
    "/list/",
    {
      steam_app_id: Number(steamAppId),
      status,
    }
  );

  return data;
}

// PATCH /games/list/<id>/
export async function updateListEntry(
  entryId: number,
  changes: Partial<
    Pick<UserGameEntry, "status" | "progress" | "notes">
  >
): Promise<UserGameEntry> {
  const { data } = await api.patch<UserGameEntry>(
    `/list/${entryId}/`,
    changes
  );

  return data;
}

// DELETE /games/list/<id>/
export async function removeListEntry(entryId: number): Promise<void> {
  await api.delete(`/list/${entryId}/`);
}

// GET /games/list/steam/<app_id>/
export async function getListStatus(
  appId: number | string
): Promise<ListStatusCheck> {
  const { data } = await api.get<ListStatusCheck>(
    `/list/steam/${appId}/`
  );

  return data;
}

// ---------------------------------------------------------------------------
// Browse (search + filter)
// ---------------------------------------------------------------------------
export interface BrowseGame {
  appid: number;
  name: string;
  header_image: string;
  genres: string[];
  platforms: string[];
  release_year: number | null;
  price: string | null;

  // Steam / external score
  score: number | null;

  // GameShelf ratings
  bayesian_score?: number | null;
  community_rating?: number | null;
  average_rating?: number | null;
  rating_count?: number;
  my_score?: number | null;
}

export interface BrowseResponse {
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  results: BrowseGame[];
}

export interface BrowseParams {
  q?: string;
  genre?: string;
  platform?: string;
  sort?: string;
  page?: number;
}

// GET /games/steam/browse/
export async function browseSteamGames(
  params: BrowseParams
): Promise<BrowseResponse> {
  const query = Object.entries({
    q: params.q,
    genre: params.genre,
    platform: params.platform,
    sort: params.sort,
    page: params.page,
  })
    .filter(([, value]) => value !== undefined && value !== "")
    .map(
      ([key, value]) =>
        `${key}=${encodeURIComponent(String(value))}`
    )
    .join("&");

  const { data } = await api.get<BrowseResponse>(
    `/games/steam/browse/?${query}`
  );

  return data;
}

// ---------------------------------------------------------------------------
// Top rated
// ---------------------------------------------------------------------------

// GET /games/steam/top-rated/
export async function getTopRatedGames(
  limit = 20,
  offset = 0,
  signal?: AbortSignal
): Promise<{ count: number; results: SteamGameCard[] }> {
  const { data } = await api.get<{
    count: number;
    results: SteamGameCard[];
  }>("/games/steam/top-rated/", {
    params: { limit, offset },
    signal,
  });

  return data;
}

// ---------------------------------------------------------------------------
// Popular now
// ---------------------------------------------------------------------------
export async function fetchPopularNowGames(
  days = 31,
  signal?: AbortSignal
): Promise<PopularGameItem[]> {
  const response = await fetch(
    `/api/v1/games/steam/popular/?days=${days}`,
    { signal }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch popular games");
  }

  const data = await response.json();

  return data.results ?? [];
}

// ---------------------------------------------------------------------------
// Mature content (18+) gate
// ---------------------------------------------------------------------------
// export type AgeGateCode =
//   | "login_required"
//   | "birthday_required"
//   | "age_restricted";

// export const ADULT_TAGS = new Set([
//   "hentai",
//   "sexual content",
//   "nudity",
//   "adult content",
// ]);

// const ADULT_AGE = 18;

// type Named =
//   | string
//   | { description?: string; name?: string }
//   | null
//   | undefined;

// export interface MatureCheckable {
//   genres?: unknown;
//   tags?: unknown;
// }

// function tagNames(list: unknown): string[] {
//   if (!Array.isArray(list)) return [];

//   return (list as Named[])
//     .map((item) =>
//       typeof item === "string"
//         ? item
//         : item?.description ?? item?.name ?? ""
//     )
//     .map((s) => s.trim().toLowerCase())
//     .filter(Boolean);
// }

// export function isMatureGame(
//   game: MatureCheckable | null | undefined
// ): boolean {
//   if (!game) return false;

//   return [
//     ...tagNames(game.genres),
//     ...tagNames(game.tags),
//   ].some((name) => ADULT_TAGS.has(name));
// }

// export function isAdultGenreSlug(
//   slug: string | null | undefined
// ): boolean {
//   return !!slug && ADULT_TAGS.has(slug.trim().toLowerCase());
// }

// export function ageFromBirthday(
//   birth?: string | null
// ): number | null {
//   if (!birth) return null;

//   const b = new Date(birth);
//   if (Number.isNaN(b.getTime())) return null;

//   const now = new Date();

//   let age = now.getFullYear() - b.getFullYear();

//   const beforeBirthday =
//     now.getMonth() < b.getMonth() ||
//     (now.getMonth() === b.getMonth() &&
//       now.getDate() < b.getDate());

//   if (beforeBirthday) age -= 1;

//   return age;
// }

// export function getAgeGate(
//   user: AuthUser | null | undefined
// ): AgeGateCode | null {
//   if (!user) return "login_required";

//   const age = ageFromBirthday(user.birth_day);

//   if (age === null) return "birthday_required";
//   if (age < ADULT_AGE) return "age_restricted";

//   return null;
// }

// export function useMatureGate(
//   game: MatureCheckable | null | undefined
// ) {
//   const { user, loading } = useAuth();

//   if (!isMatureGame(game)) {
//     return {
//       gate: null as AgeGateCode | null,
//       checking: false,
//     };
//   }

//   if (loading) {
//     return {
//       gate: null as AgeGateCode | null,
//       checking: true,
//     };
//   }

//   return {
//     gate: getAgeGate(user),
//     checking: false,
//   };
// }

// export function useMatureFilter() {
//   const { user, loading } = useAuth();

//   const allowed = !loading && getAgeGate(user) === null;

//   return useCallback(
//     <T extends MatureCheckable>(items: T[]): T[] =>
//       allowed
//         ? items
//         : items.filter((item) => !isMatureGame(item)),
//     [allowed]
//   );
// }
