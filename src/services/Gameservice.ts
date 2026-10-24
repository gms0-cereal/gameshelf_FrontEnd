import api from "../lib/api";

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
<<<<<<< HEAD
=======
// Steam game cards (details + GameShelf rating, assembled by the backend)
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
  score: number | null;
  short_description: string;
  metacritic_score: number | null;
  // third-party rating (Steam), 0-10
  steam_rating: { score: number; label: string; total_reviews: number } | null;
  // GameShelf community
  community_rating: number | null;
  rating_count: number;
  // the logged-in user's own rating, null if not rated
  my_score: number | null;
}


export interface SteamGameCardListResponse {
  games: SteamGameCard[];
  last_appid: number | null;
  have_more_results: boolean;
}

// ---------------------------------------------------------------------------
>>>>>>> 49b12e250a4a1e7ad1e4efa2bdd01865a9f6d1e2
// Steam details (store.steampowered.com/api/appdetails -> `data`)
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
  platforms?: { windows: boolean; mac: boolean; linux: boolean };
  release_date?: { coming_soon: boolean; date: string };
  price_overview?: { final_formatted: string; discount_percent: number };
  metacritic?: { score: number; url: string };
  screenshots?: SteamScreenshot[];
  movies?: SteamMovie[];
  dlc?: number[];
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
  };
  score: number;
  rank: number;
  reason?: { shared_features?: string[] };
}

export interface SimilarGamesResponse {
  results: SimilarGameResult[];
}

// GET /similar/<app_id>/
export async function getSimilarGames(
  appId: number | string,
  signal?: AbortSignal
): Promise<SimilarGameResult[]> {
  const { data } = await api.get<SimilarGamesResponse>(`/similar/${appId}/`, {
    signal,
  });
  return data.results;
}

// ---------------------------------------------------------------------------
// Steam reviews
// ---------------------------------------------------------------------------
export interface SteamReview {
  recommendationid: string;
  author: {
    steamid: string;
    playtime_forever?: number; // minutes
  };
  review: string;
  voted_up: boolean;
  votes_up: number;
  timestamp_created: number; // unix seconds
}

<<<<<<< HEAD
=======
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

// Adjust these field names to match what your backend really returns.
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

>>>>>>> 49b12e250a4a1e7ad1e4efa2bdd01865a9f6d1e2
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

<<<<<<< HEAD
=======
// GET /reviews/<id>
export async function getGameShelfReviews(
  gameId: number | string
): Promise<GameShelfReview[]> {
  const { data } = await api.get(`/reviews/${gameId}`);
  const list = Array.isArray(data) ? data : (data?.results ?? []);
  return list.map(normalizeReview);
}

>>>>>>> 49b12e250a4a1e7ad1e4efa2bdd01865a9f6d1e2
// GET /games/?page=1
export async function getGames(page = 1): Promise<Paginated<GameListItem>> {
  const { data } = await api.get<Paginated<GameListItem>>("/games/", {
    params: { page },
  });

  return data;
}

// GET /games/<id>/
export async function getGame(id: number): Promise<GameDetail> {
  const { data } = await api.get<GameDetail>(`/games/${id}/`);
  return data;
}

// GET /games/steam/
export async function getSteamGames(
  limit = 12,
  lastAppId = 0
): Promise<SteamGameListResponse> {
  const { data } = await api.get<SteamGameListResponse>("/games/steam/", {
    params: {
      limit,
      last_appid: lastAppId,
    },
  });

  return data;
}

<<<<<<< HEAD
=======
// GET /games/steam/?expand=1
// Same catalog page, but each game already has its details and rating, so the
// page needs no extra per-game requests.
export async function getSteamGamesExpanded(
  limit = 12,
  lastAppId = 0
): Promise<SteamGameCardListResponse> {
  const { data } = await api.get<SteamGameCardListResponse>("/games/steam/", {
    params: {
      limit,
      last_appid: lastAppId,
      expand: 1,
    },
  });

  return data;
}

// GET /games/steam/summaries/?appids=1,2,3  (backend allows up to 30 ids)
export async function getSteamGameSummaries(
  appIds: number[]
): Promise<SteamGameCard[]> {
  if (appIds.length === 0) return [];

  const { data } = await api.get<{ results: SteamGameCard[] }>(
    "/games/steam/summaries/",
    { params: { appids: appIds.join(",") } }
  );

  return data.results;
}

>>>>>>> 49b12e250a4a1e7ad1e4efa2bdd01865a9f6d1e2
// GET /games/steam/<app_id>/
export async function getSteamGameDetails(
  appId: number | string
): Promise<SteamGameDetail> {
  const { data } = await api.get<SteamGameDetail>(`/games/steam/${appId}/`);
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
    { params: { cursor, num_per_page: numPerPage } }
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

export const LIST_STATUS_OPTIONS: { value: ListStatus; label: string }[] = [
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
<<<<<<< HEAD
=======
  is_favorite?: boolean;
>>>>>>> 49b12e250a4a1e7ad1e4efa2bdd01865a9f6d1e2
  started_at: string | null;
  completed_at: string | null;
  notes: string | null;
  score?: number | null; // not provided by the backend yet
}

export interface UserGameListResponse {
  counts: Record<"all" | ListStatus, number>;
  results: UserGameEntry[];
}

export type ListStatusCheck =
  | { in_list: false }
  | ({ in_list: true } & UserGameEntry);

// GET /games/list/?status=&search=
export async function getMyGameList(params: {
  status?: ListStatus | "all";
  search?: string;
} = {}): Promise<UserGameListResponse> {
  const { data } = await api.get<UserGameListResponse>("/list/", {
    params: {
      status: params.status && params.status !== "all" ? params.status : undefined,
      search: params.search || undefined,
    },
  });
  return data;
}

// POST /games/list/  (adds the game, or changes its status if already added)
export async function addToMyList(
  steamAppId: number | string,
  status: ListStatus = "plan_to_play"
): Promise<UserGameEntry> {
  const { data } = await api.post<UserGameEntry>("/list/", {
    steam_app_id: Number(steamAppId),
    status,
  });
  return data;
}

// PATCH /games/list/<id>/
export async function updateListEntry(
  entryId: number,
  changes: Partial<Pick<UserGameEntry, "status" | "progress" | "notes">>
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
<<<<<<< HEAD
=======
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
  score: number | null; // 0-10 (Metacritic / 10), when Steam has one
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

// GET /games/steam/browse/?q=&genre=&platform=&sort=&page=
export async function browseSteamGames(
  params: BrowseParams
): Promise<BrowseResponse> {
  // Build the query string by hand so spaces are sent as %20, not "+".
  const query = Object.entries({
    q: params.q,
    genre: params.genre,
    platform: params.platform,
    sort: params.sort,
    page: params.page,
  })
    .filter(([, value]) => value !== undefined && value !== "")
    .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
    .join("&");

  const { data } = await api.get<BrowseResponse>(
    `/games/steam/browse/?${query}`
  );
  return data;
>>>>>>> 49b12e250a4a1e7ad1e4efa2bdd01865a9f6d1e2
}