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