// src/services/playersLikeYouService.ts

import api from "../lib/api";

export interface PlayersLikeYouGame {
  id: number;
  title: string;
  slug: string | null;
  cover_image_url: string | null;
  release_date: string | null;
  genres: string[];
  steam_app_id: number | null;

  // GameShelf ratings
  bayesian_score?: number | null;
  community_rating?: number | null;
  average_rating?: number | null;
  rating_count?: number;
  my_score?: number | null;
}

export interface PlayersLikeYouItem {
  game: PlayersLikeYouGame;
  score: number | null;
  rank: number;
  reason_type: string;
  reason_text: string;
  reason_game: {
    id: number;
    title: string;
    slug: string | null;
  } | null;
}

export interface PlayersLikeYouResponse {
  source: "personalized" | "popular";
  algorithm: "svd" | "popularity";
  fallback_reason?: "login_required" | "model_not_ready" | "not_enough_activity";
  count?: number;
  has_more?: boolean;
  results: PlayersLikeYouItem[];
}

export async function getPlayersLikeYou(
  limit = 20,
  offset = 0
): Promise<PlayersLikeYouResponse> {
  const { data } = await api.get<PlayersLikeYouResponse>(
    "/players-like-you/",
    {
      params: { limit, offset },
    }
  );

  return data;
}