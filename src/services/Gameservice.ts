
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

// Steam API response types
export interface SteamGame {
  appid: number;
  name: string;
}

export interface SteamGameListResponse {
  games: SteamGame[];
  last_appid: number | null;
  have_more_results: boolean;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

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
