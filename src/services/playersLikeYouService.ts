// src/services/playersLikeYouService.ts
//
// ADAPT ONE LINE: API_BASE must be the same base URL your tasteService.ts uses
// (copy its request helper if it has one, e.g. an axios instance or apiFetch).

const API_BASE: string = (import.meta.env.VITE_API_URL as string | undefined) ?? "/api";

export interface PlayersLikeYouGame {
  id: number;
  title: string;
  slug: string | null;
  cover_image_url: string | null;
  release_date: string | null;
  genres: string[];
  steam_app_id: number | null;
}

export interface PlayersLikeYouItem {
  game: PlayersLikeYouGame;
  score: number | null;
  rank: number;
  reason_type: string;
  reason_text: string;
  reason_game: { id: number; title: string; slug: string | null } | null;
}

export interface PlayersLikeYouResponse {
  // "personalized" = real SVD picks. "popular" = labelled fallback (do not show as SVD).
  source: "personalized" | "popular";
  algorithm: "svd" | "popularity";
  fallback_reason?: "login_required" | "model_not_ready" | "not_enough_activity";
  results: PlayersLikeYouItem[];
}

export async function getPlayersLikeYou(
  limit = 20,
  signal?: AbortSignal
): Promise<PlayersLikeYouResponse> {
  const response = await fetch(`${API_BASE}/players-like-you/?limit=${limit}`, {
    credentials: "include",
    headers: { Accept: "application/json" },
    signal,
  });
  if (!response.ok) throw new Error(`players-like-you failed: ${response.status}`);
  return response.json();
}