import api from "../lib/api";

export const LIKED_GAMES_FIELD = "liked_game_ids";

export interface TasteOption {
  name: string;
  count: number;
}

export interface TasteOptionsResponse {
  genres: TasteOption[];
  tags: TasteOption[];
  platforms: { value: string; label: string }[];
}

export interface TasteProfilePayload {
  genres: string[];
  tags?: string[];
  platforms: string[];
  likedGameIds?: number[]; // Steam app IDs
}

export interface TasteProfileResponse {
  genres: string[];
  tags: string[];
  platforms: string[];
  liked_game_ids: number[];
  liked_games: { appid: number; title: string; cover?: string | null }[];
}

export interface RecommendedGame {
  id: number;
  appid: number;
  title: string;
  slug?: string | null;
  cover_image_url?: string | null;
  header_image?: string | null;
  release_date?: string;
  genres?: string[];
  platforms?: string[];
}

export interface TasteRecommendation {
  game: RecommendedGame;
  score: number;
  rank: number;
  cluster_id: number | null;
  cluster_label?: string | null;
  reason?: {
    matched_genres: string[];
    matched_tags: string[];
    similar_to: string | null;
  };
}

export interface TasteRecommendationResponse {
  results: TasteRecommendation[];
  source?: string;
  count?: number;
  detail?: string;
  [key: string]: unknown;
}

// GET /api/v1/taste/options/  -> genres, tags and platforms from the Steam data
export async function getTasteOptions() {
  const { data } = await api.get<TasteOptionsResponse>("/taste/options/");
  return data;
}

// PUT /api/v1/taste/profile/
export async function saveTasteProfile({ genres, tags, platforms, likedGameIds }: TasteProfilePayload) {
  const body: Record<string, unknown> = { genres, platforms };
  if (tags !== undefined) body.tags = tags;
  if (likedGameIds !== undefined) body[LIKED_GAMES_FIELD] = likedGameIds;

  const { data } = await api.put<TasteProfileResponse>("/taste/profile/", body);
  return data;
}

// GET /api/v1/taste/profile/
export async function getTasteProfile() {
  const { data } = await api.get<TasteProfileResponse>("/taste/profile/");
  return data;
}

// GET /api/v1/taste/  -> K-Means recommendations
export async function getTasteRecommendations() {
  const { data } = await api.get<TasteRecommendationResponse>("/taste/");
  return data;
}