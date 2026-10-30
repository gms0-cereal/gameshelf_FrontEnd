import api from "../lib/api"; // use the same import line as Socialservice.ts

// Name of the "list of games" field in your CreatePlaylistSerializer.
// If the API says this field is required/unknown, change it here.
export const PLAYLIST_GAMES_FIELD = "steam_app_ids";

export type Visibility = "public" | "unlisted" | "private";

/** A game in the picker (search results, suggestions, selected list). */
export interface PickerGame {
  appid: number;
  title: string;
  cover: string;
  subtitle?: string; // e.g. "Adventure / Platformer"
}

/** A game inside a saved playlist (used by Home's playlist cards). */
export interface PlaylistGame {
  id: number;
  title: string;
  steam_appid: number | null;
  cover_url: string | null;
  genres: string[];
  position: number;
  note: string | null;
}

export interface Playlist {
  id: number;
  title: string;
  description: string | null;
  visibility: Visibility;
  owner: {
    id: number;
    username: string;
    nickname: string | null;
    avatar_url: string | null;
  };
  game_count: number;
  like_count: number;
  liked_by_me: boolean;
  games: PlaylistGame[];
  created_at: string;
  updated_at: string;
}

export interface PaginatedPlaylists {
  count: number;
  results: Playlist[];
}

export interface CreatePlaylistInput {
  title: string;
  description: string;
  visibility: Visibility;
  steamAppIds: number[]; // order = playlist order
}

// Your list endpoints return { count, results }; this also accepts a plain array.
function extractResults<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object") {
    const payload = data as { results?: unknown; games?: unknown; data?: unknown };
    if (Array.isArray(payload.results)) return payload.results as T[];
    if (Array.isArray(payload.games)) return payload.games as T[];
    if (Array.isArray(payload.data)) return payload.data as T[];
    if (payload.data && typeof payload.data === "object") {
      return extractResults<T>(payload.data);
    }
  }
  return [];
}

function normalizePickerGame(value: unknown): PickerGame | null {
  if (!value || typeof value !== "object") return null;

  const game = value as Record<string, unknown>;
  const appid = Number(game.appid ?? game.steam_appid ?? game.id);
  const title = game.title ?? game.name;
  const cover =
    game.cover ??
    game.cover_url ??
    game.header_image ??
    (typeof game.appid === "number"
      ? `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${game.appid}/header.jpg`
      : undefined);

  if (
    !Number.isInteger(appid) ||
    appid <= 0 ||
    typeof title !== "string" ||
    !title.trim()
  ) {
    return null;
  }

  return {
    appid,
    title: title.trim(),
    cover: typeof cover === "string" ? cover : "",
    subtitle:
      typeof game.subtitle === "string"
        ? game.subtitle
        : typeof game.genre === "string"
          ? game.genre
          : undefined,
  };
}

// ─── Create (library app: POST /list/playlists/) ──────────────────────────────
export interface GameSearchFilters {
  genre?: string;
  platform?: string;
}

export async function createPlaylist(input: CreatePlaylistInput) {
  const { data } = await api.post<{ id: number; title: string }>("/list/playlists/", {
    title: input.title,
    description: input.description,
    visibility: input.visibility,
    [PLAYLIST_GAMES_FIELD]: input.steamAppIds,
  });
  return data;
}

export async function toggleLikePlaylist(id: number): Promise<{ is_liked: boolean; like_count: number }> {
  const { data } = await api.post(`/social/playlists/${id}/like/`);
  return data;
}


// ─── Steam search for the "Find games" box (social app) ───────────────────────
export async function searchSteamGames(
  q: string,
  filters: GameSearchFilters = {},
  signal?: AbortSignal
): Promise<PickerGame[]> {
  const query = q.trim();

  const { data } = await api.get("/list/playlists/games/", {
    params: {
      search: query || undefined,
      genre: filters.genre || undefined,
      platform: filters.platform || undefined,
    },
    signal,
  });
  const seen = new Set<number>();

  return extractResults<unknown>(data)
    .map(normalizePickerGame)
    .filter((game): game is PickerGame => {
      if (!game || seen.has(game.appid)) return false;
      seen.add(game.appid);
      return true;
    });
}

// ─── Reading playlists (Home page) ────────────────────────────────────────────
export async function getPlaylists(params?: {
  search?: string;
  user?: string;
  sort?: "newest" | "oldest" | "updated" | "title";
  genre?: string;
  platform?: string;
  limit?: number;
  offset?: number;
}): Promise<PaginatedPlaylists> {
  const { data } = await api.get("/social/playlists/", { params });
  const results = extractResults<Playlist>(data);
  const count =
    data && typeof data === "object" && "count" in data
      ? Number((data as { count: unknown }).count)
      : results.length;
  return { count, results };
}

export async function getPlaylist(id: number): Promise<Playlist> {
  const { data } = await api.get<Playlist>(`/social/playlists/${id}/`);
  return data;
}