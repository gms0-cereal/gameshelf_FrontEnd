import api from "../lib/api";

export interface GamePayload {
  id: number;
  appid?: number;
  title: string;
  slug: string | null;
  cover_image_url: string | null;
  header_image?: string;
  release_date: string | null;
  genres: string[];
}

export interface TasteRecommendationItem {
  game: GamePayload;
  score: number;
  rank: number;
  cluster_id: number;
  cluster_label: string | null;
  reason: {
    matched_genres: string[];
    matched_tags: string[];
    similar_to: string | null;
  };
}

export interface TasteResponse {
  source: string;
  count: number;
  has_more: boolean;
  preferences: {
    genres: string[];
    tags: string[];
    platforms: string[];
    favorite_games_used: number;
  };
  results: TasteRecommendationItem[];
  detail?: string;
}

// 1. K-Means Taste Recommendations ("Recommended for You")
export async function getTasteRecommendations(limit = 20, offset = 0): Promise<TasteResponse> {
  const { data } = await api.get<TasteResponse>("/taste/", {
    params: { limit, offset },
  });
  return data;
}

// 2. Cosine Similarity / Similar Games ("Because you played...")
// FIXED: Added offset parameter so infinite scrolling actually fetches subsequent pages!
export async function getSimilarGames(appId: number, limit = 20, offset = 0) {
  const { data } = await api.get(`/similar/${appId}/`, {
    params: { limit, offset },
  });
  return data;
}

// 3. User Taste Profile (Genres, tags, liked games)
export async function getTasteProfile() {
  const { data } = await api.get("/taste/profile/");
  return data;
}