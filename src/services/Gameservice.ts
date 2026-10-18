import api from "../lib/api";

export interface GameListItem {
  id: number;
  title: string;
  slug: string | null;
  cover_image_url: string | null;
  release_date: string | null;
  game_type: "base" | "dlc" | "expansion";
  genres?: string[]; // add "genres" to GameListSerializer on the backend to fill this
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

// GET /games/?page=1
export async function getGames(page = 1): Promise<Paginated<GameListItem>> {
  const { data } = await api.get<Paginated<GameListItem>>("/games/", { params: { page } });
  return data;
}

// GET /games/<id>/
export async function getGame(id: number): Promise<GameDetail> {
  const { data } = await api.get<GameDetail>(`/games/${id}/`);
  return data;
}