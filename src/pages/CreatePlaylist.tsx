import { useEffect, useMemo, useRef, useState, memo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  Eye,
  GripVertical,
  Loader2,
  Plus,
  Search,
  Shuffle,
  X,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/context/AuthContext";
import {
  PLAYLIST_GAMES_FIELD,
  createPlaylist,
  searchSteamGames,
  type PickerGame,
  type Visibility,
} from "@/services/playlistService";

const MAX_GAMES = 100;
const MAX_DESCRIPTION_WORDS = 500;
const SUGGESTION_COUNT = 3;

const AFTER_CREATE_PATH = "/home";

/* ───────────── Multi-CDN Steam Image Fallback Array ───────────── */

const getSteamCoverUrls = (appid?: number, fallback?: string | null): string[] => {
  const urls: string[] = [];
  if (fallback) urls.push(fallback);
  if (appid) {
    urls.push(
      `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${appid}/header.jpg`,
      `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${appid}/capsule_616x353.jpg`,
      `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${appid}/library_600x900.jpg`,
      `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/header.jpg`
    );
  }
  return Array.from(new Set(urls));
};

/* ───────────── Random suggestions ───────────── */

const SEARCH_TERMS = [
  "adventure", "action", "puzzle", "racing", "survival", "farming", "horror",
  "space", "dungeon", "tower", "city", "pixel", "story", "battle", "magic",
  "robot", "zombie", "ninja", "cat", "dragon", "knight", "ocean", "train",
  "detective", "cooking", "football", "card", "cyber", "ghost", "island",
];

const FALLBACK_POOL: PickerGame[] = [
  { appid: 387290, title: "Ori and the Blind Forest", subtitle: "Adventure / Platformer" },
  { appid: 774361, title: "Blasphemous", subtitle: "Action / Metroidvania" },
  { appid: 1244090, title: "Sea of Stars", subtitle: "RPG" },
  { appid: 1145360, title: "Hades", subtitle: "Action / Roguelike" },
  { appid: 367520, title: "Hollow Knight", subtitle: "Metroidvania" },
  { appid: 504230, title: "Celeste", subtitle: "Platformer" },
  { appid: 413150, title: "Stardew Valley", subtitle: "Simulation / RPG" },
  { appid: 105600, title: "Terraria", subtitle: "Sandbox / Adventure" },
  { appid: 620, title: "Portal 2", subtitle: "Puzzle" },
  { appid: 391540, title: "Undertale", subtitle: "RPG" },
  { appid: 268910, title: "Cuphead", subtitle: "Run and Gun" },
  { appid: 588650, title: "Dead Cells", subtitle: "Roguelike / Metroidvania" },
  { appid: 632470, title: "Disco Elysium", subtitle: "RPG" },
  { appid: 646570, title: "Slay the Spire", subtitle: "Deckbuilder" },
  { appid: 1794680, title: "Vampire Survivors", subtitle: "Roguelike" },
].map((g) => ({ ...g, cover: getSteamCoverUrls(g.appid, g.cover)[0] }));

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const countWords = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

function limitWords(text: string, max: number) {
  const words = [...text.matchAll(/\S+/g)];
  if (words.length <= max) return text;
  const last = words[max - 1];
  return text.slice(0, (last.index ?? 0) + last[0].length);
}

type FieldErrors = Partial<Record<"title" | "description" | "games", string>>;

function toText(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value.join(" ");
  return undefined;
}

function parseApiError(err: unknown): { general?: string; fields: FieldErrors } {
  if (isAxiosError(err)) {
    if (!err.response) {
      return { general: "Can't reach the server. Check your connection and try again.", fields: {} };
    }
    const data = err.response.data as Record<string, unknown> | undefined;
    const fields: FieldErrors = {
      title: toText(data?.title),
      description: toText(data?.description),
      games: toText(data?.[PLAYLIST_GAMES_FIELD]) ?? toText(data?.games),
    };
    const hasFieldError = Object.values(fields).some(Boolean);
    const general =
      toText(data?.error) ??
      toText(data?.detail) ??
      toText(data?.non_field_errors) ??
      (hasFieldError ? undefined : "Something went wrong. Please try again.");
    return { general, fields };
  }
  return { general: "Something went wrong. Please try again.", fields: {} };
}

const inputBase =
  "w-full rounded-xl border border-[#302438] bg-[#000000] px-3 text-[13px] text-[#E6E1EA] placeholder:text-[#77717F] focus:outline-none focus:ring-2 focus:ring-[#B39ACF]/60";

/**
 * Resilient Cover component that steps down through alternative Steam CDN endpoints upon 404.
 */
const Cover = memo(
  ({ src, appid, className }: { src?: string | null; appid?: number; className: string }) => {
    const sources = useMemo(() => getSteamCoverUrls(appid, src), [appid, src]);
    const [index, setIndex] = useState(0);

    useEffect(() => {
      setIndex(0);
    }, [sources]);

    return index < sources.length ? (
      <img
        key={sources[index]}
        src={sources[index]}
        alt=""
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setIndex((i) => i + 1)}
        className={`object-cover ${className}`}
      />
    ) : (
      <div className={`bg-gradient-to-br from-[#302438] to-[#17191E] ${className}`} aria-hidden="true" />
    );
  }
);
Cover.displayName = "Cover";

export default function CreatePlaylist() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("public");

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PickerGame[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selected, setSelected] = useState<PickerGame[]>([]);

  const [suggestions, setSuggestions] = useState<PickerGame[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);
  const suggestionRequest = useRef(0);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const dragIndex = useRef<number | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login", { replace: true, state: { from: "/playlists/new" } });
    }
  }, [authLoading, user, navigate]);

  async function loadSuggestions() {
    const requestId = ++suggestionRequest.current;
    setSuggestionsLoading(true);

    let picked: PickerGame[] = [];
    try {
      const term = SEARCH_TERMS[Math.floor(Math.random() * SEARCH_TERMS.length)];
      const games = await searchSteamGames(term);
      picked = shuffle(games).slice(0, SUGGESTION_COUNT);
    } catch {
      // fallback handles it
    }

    if (picked.length < SUGGESTION_COUNT) {
      const taken = new Set(picked.map((g) => g.appid));
      const extra = shuffle(FALLBACK_POOL).filter((g) => !taken.has(g.appid));
      picked = [...picked, ...extra].slice(0, SUGGESTION_COUNT);
    }

    if (requestId === suggestionRequest.current) {
      setSuggestions(picked);
      setSuggestionsLoading(false);
    }
  }

  useEffect(() => {
    void loadSuggestions();
  }, []);

  const trimmedQuery = query.trim();
  const isSearching = trimmedQuery.length >= 2;

  useEffect(() => {
    if (!isSearching) {
      setResults([]);
      setSearching(false);
      setSearchError(null);
      return;
    }

    let cancelled = false;
    setSearching(true);
    setSearchError(null);

    const timer = setTimeout(async () => {
      try {
        const games = await searchSteamGames(trimmedQuery);
        if (!cancelled) setResults(games);
      } catch {
        if (!cancelled) {
          setResults([]);
          setSearchError("Couldn't search Steam right now. Try again in a moment.");
        }
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [trimmedQuery, isSearching]);

  const selectedIds = useMemo(() => new Set(selected.map((g) => g.appid)), [selected]);

  const toggleGame = (game: PickerGame) => {
    setFieldErrors((f) => ({ ...f, games: undefined }));
    setSelected((prev) => {
      if (prev.some((g) => g.appid === game.appid)) {
        return prev.filter((g) => g.appid !== game.appid);
      }
      if (prev.length >= MAX_GAMES) return prev;
      return [...prev, game];
    });
  };

  const moveGame = (from: number, to: number) =>
    setSelected((prev) => {
      if (to < 0 || to >= prev.length || from === to) return prev;
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });

  const handleSubmit = async () => {
    if (submitting) return;

    const errs: FieldErrors = {};
    if (!title.trim()) errs.title = "Give your playlist a name.";
    if (selected.length === 0) errs.games = "Add at least one game.";
    if (countWords(description) > MAX_DESCRIPTION_WORDS) {
      errs.description = `Keep the description under ${MAX_DESCRIPTION_WORDS} words.`;
    }
    setFieldErrors(errs);
    setError(null);
    if (Object.keys(errs).length) return;

    setSubmitting(true);
    try {
      await createPlaylist({
        title: title.trim(),
        description: description.trim(),
        visibility,
        steamAppIds: selected.map((g) => g.appid),
      });
      navigate(AFTER_CREATE_PATH);
    } catch (err) {
      const parsed = parseApiError(err);
      setError(parsed.general ?? null);
      setFieldErrors(parsed.fields);
    } finally {
      setSubmitting(false);
    }
  };

  const ownerName = user?.nickname || user?.username || "You";
  const visibleResults = isSearching ? results.slice(0, 6) : suggestions;
  const showSkeletons = !isSearching && suggestionsLoading;
  const descriptionWords = countWords(description);

  return (
    <div className="flex min-h-screen flex-col bg-[#000000] font-sans text-[#E6E1EA]">
      <Navbar />

      <main className="mx-auto w-full flex-1 px-5 py-8 md:px-8 xl:px-16 overflow-x-hidden">
        <div className="flex min-h-[65px] flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-[13px] leading-4 text-[#B39ACF] uppercase tracking-wider">
              PLAYER CURATED COLLECTIONS
            </p>
            <h1 className="text-[36px] font-semibold leading-[41px] tracking-[-0.8px] text-[#E6E1EA]">
              Create Game Playlist
            </h1>
          </div>
        </div>
        <p className="mt-2 text-[14px] text-[#A0A0A8]">
          Great games deserve good company. Build a collection worth sharing.
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.35fr_1fr] items-start">
          <div className="space-y-6 min-w-0">
            <section className="rounded-2xl border border-[#302438] bg-[#17191E] p-6 shadow-none">
              <h2 className="text-lg font-semibold text-[#E6E1EA]">Playlist details</h2>

              <label htmlFor="playlist-title" className="mt-5 block text-xs font-semibold text-[#E6E1EA]">
                Playlist name
              </label>
              <input
                id="playlist-title"
                type="text"
                maxLength={150}
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setFieldErrors((f) => ({ ...f, title: undefined }));
                }}
                placeholder="Beyond the beaten path"
                aria-invalid={!!fieldErrors.title}
                className={`${inputBase} mt-2 h-10 ${fieldErrors.title ? "border-[#E58B91]" : ""}`}
              />
              {fieldErrors.title && (
                <p className="mt-1 text-xs text-[#E58B91]">{fieldErrors.title}</p>
              )}

              <label htmlFor="playlist-description" className="mt-5 block text-xs font-semibold text-[#E6E1EA]">
                Description
              </label>
              <textarea
                id="playlist-description"
                rows={4}
                value={description}
                onChange={(e) => {
                  setDescription(limitWords(e.target.value, MAX_DESCRIPTION_WORDS));
                  setFieldErrors((f) => ({ ...f, description: undefined }));
                }}
                placeholder="What ties these games together?"
                className={`${inputBase} mt-2 resize-none py-2 ${fieldErrors.description ? "border-[#E58B91]" : ""}`}
              />
              <div className="mt-1 flex items-start justify-between gap-3">
                <p className="text-xs text-[#E58B91]">{fieldErrors.description}</p>
                <p
                  className={`shrink-0 text-[11px] ${
                    descriptionWords >= MAX_DESCRIPTION_WORDS ? "text-[#E58B91]" : "text-[#77717F]"
                  }`}
                >
                  {descriptionWords} / {MAX_DESCRIPTION_WORDS} words
                </p>
              </div>

              <div className="mt-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-[#E6E1EA]">Visibility</p>
                  <p className="mt-1 text-xs text-[#77717F]">
                    Public playlists appear in the community.
                  </p>
                </div>
                <div className="flex gap-2" role="group" aria-label="Visibility">
                  {(["public", "private"] as Visibility[]).map((v) => {
                    const active = visibility === v;
                    return (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setVisibility(v)}
                        aria-pressed={active}
                        className={`inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-[13px] capitalize transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B39ACF] ${
                          active
                            ? "border-[#B39ACF] bg-[#B39ACF] text-[#17191E] font-semibold"
                            : "border-[#302438] bg-[#000000] text-[#77717F] hover:text-[#E6E1EA]"
                        }`}
                      >
                        {active && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                        {v}
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-[#302438] bg-[#17191E] p-6 shadow-none">
              <h2 className="text-lg font-semibold text-[#E6E1EA]">Find games</h2>

              <div className="relative mt-4">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#77717F]"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search the Steam catalogue..."
                  aria-label="Search games"
                  className={`${inputBase} h-10 pl-9`}
                />
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-[#77717F]">
                <span className="inline-flex items-center gap-3">
                  {isSearching ? "Search results" : "Suggestions for your playlist"}
                  {!isSearching && (
                    <button
                      type="button"
                      onClick={loadSuggestions}
                      disabled={suggestionsLoading}
                      className="inline-flex items-center gap-1 rounded text-[#B39ACF] hover:text-[#E6E1EA] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B39ACF] disabled:opacity-50"
                    >
                      <Shuffle className="h-3 w-3" aria-hidden="true" /> Shuffle
                    </button>
                  )}
                </span>
                <Link to="/browse" className="inline-flex items-center gap-1 hover:text-[#E6E1EA]">
                  Browse all games <ArrowRight className="h-3 w-3" aria-hidden="true" />
                </Link>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {showSkeletons &&
                  Array.from({ length: SUGGESTION_COUNT }).map((_, i) => (
                    <div
                      key={i}
                      className="h-[154px] animate-pulse rounded-xl border border-[#302438] bg-[#000000]"
                      aria-hidden="true"
                    />
                  ))}

                {!showSkeletons &&
                  visibleResults.map((game) => {
                    const added = selectedIds.has(game.appid);
                    return (
                      <button
                        key={game.appid}
                        type="button"
                        onClick={() => toggleGame(game)}
                        aria-pressed={added}
                        className={`overflow-hidden rounded-xl border text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B39ACF] ${
                          added ? "border-[#B39ACF]" : "border-[#302438] bg-[#000000] hover:border-[#554363]"
                        }`}
                      >
                        <div className="relative">
                          <Cover src={game.cover} appid={game.appid} className="h-24 w-full" />
                          <span
                            className={`absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-md ${
                              added ? "bg-[#B39ACF] text-[#17191E]" : "bg-black/60 text-white"
                            }`}
                          >
                            {added ? (
                              <Check className="h-3.5 w-3.5" aria-hidden="true" />
                            ) : (
                              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                            )}
                          </span>
                        </div>
                        <div className="p-2.5 bg-[#17191E]">
                          <p className="truncate text-[13px] font-medium text-[#E6E1EA]">{game.title}</p>
                          <p className="mt-0.5 text-[11px] text-[#77717F]">
                            {added ? "Added to playlist" : "+ Add to playlist"}
                          </p>
                        </div>
                      </button>
                    );
                  })}
              </div>

              {searching && (
                <p className="mt-3 flex items-center gap-2 text-xs text-[#77717F]">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[#B39ACF]" aria-hidden="true" /> Searching…
                </p>
              )}
              {searchError && <p className="mt-3 text-xs text-[#E58B91]">{searchError}</p>}
              {isSearching && !searching && !searchError && results.length === 0 && (
                <p className="mt-3 text-xs text-[#77717F]">No games found.</p>
              )}
            </section>

            <section className="rounded-2xl border border-[#302438] bg-[#17191E] p-6 shadow-none">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[#E6E1EA]">Selected games</h2>
                <span className="rounded-full bg-[#B39ACF]/15 px-3 py-1 text-xs text-[#B39ACF] font-medium">
                  {selected.length} {selected.length === 1 ? "game" : "games"}
                </span>
              </div>
              <p className="mt-1 text-xs text-[#77717F]">
                Drag to reorder or use the arrows. ✕ removes a game.
              </p>

              {fieldErrors.games && (
                <p className="mt-3 text-xs text-[#E58B91]">{fieldErrors.games}</p>
              )}

              <ul className="mt-4 space-y-2">
                {selected.map((game, i) => (
                  <li
                    key={game.appid}
                    draggable
                    onDragStart={() => (dragIndex.current = i)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (dragIndex.current !== null) moveGame(dragIndex.current, i);
                      dragIndex.current = null;
                    }}
                    className="flex items-center gap-3 rounded-xl border border-[#302438] bg-[#000000] p-2.5"
                  >
                    <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-[#77717F]" aria-hidden="true" />
                    <span className="w-5 text-xs text-[#77717F]">{String(i + 1).padStart(2, "0")}</span>
                    <Cover src={game.cover} appid={game.appid} className="h-10 w-16 shrink-0 rounded-md" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-[#E6E1EA]">{game.title}</p>
                      {game.subtitle && (
                        <p className="truncate text-[11px] text-[#77717F]">{game.subtitle}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => moveGame(i, i - 1)}
                      disabled={i === 0}
                      aria-label={`Move ${game.title} up`}
                      className="rounded p-1 text-[#77717F] hover:text-[#E6E1EA] disabled:opacity-30"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveGame(i, i + 1)}
                      disabled={i === selected.length - 1}
                      aria-label={`Move ${game.title} down`}
                      className="rounded p-1 text-[#77717F] hover:text-[#E6E1EA] disabled:opacity-30"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleGame(game)}
                      aria-label={`Remove ${game.title}`}
                      className="rounded p-1 text-[#77717F] hover:text-[#E58B91]"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>

              {selected.length === 0 && (
                <p className="mt-4 rounded-xl border border-dashed border-[#302438] p-6 text-center text-xs text-[#77717F]">
                  Games you add will show up here.
                </p>
              )}
            </section>

            {error && (
              <p
                role="alert"
                className="rounded-xl border border-[#E58B91] bg-[#E58B91]/15 px-3 py-2 text-[13px] text-[#E58B91]"
              >
                {error}
              </p>
            )}

            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-[#77717F]">
                {selected.length} {selected.length === 1 ? "game" : "games"} ·{" "}
                <span className="capitalize">{visibility}</span> playlist
              </span>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="h-10 rounded-xl border border-[#302438] bg-[#17191E] px-5 text-xs font-semibold text-[#E6E1EA] hover:border-[#554363] hover:bg-[#20232B] focus:outline-none"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#B39ACF] px-5 text-xs font-semibold text-[#17191E] transition-colors hover:bg-[#C2ADE0] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  {submitting ? "Creating…" : "Create playlist"}
                </button>
              </div>
            </div>
          </div>

          <aside className="h-fit rounded-2xl border border-[#302438] bg-[#17191E] p-6 shadow-none lg:sticky lg:top-6 min-w-0">
            <div className="flex items-center justify-between text-xs text-[#77717F]">
              <span className="inline-flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-[#B39ACF]" aria-hidden="true" /> Community preview
              </span>
              <span>Not published yet</span>
            </div>

            <div className="mt-5 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#B39ACF]/20 text-xs font-semibold text-[#B39ACF] overflow-hidden border border-[#554363]">
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.username}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  user?.username.slice(0, 2).toUpperCase()
                )}
              </span>
              <span className="text-xs font-medium text-[#E6E1EA] truncate">{ownerName}</span>
            </div>

            <h3 className="mt-2 text-2xl font-semibold text-[#E6E1EA] break-words">{title.trim() || "Untitled playlist"}</h3>
            <p className="mt-3 whitespace-pre-line break-words text-[13px] text-[#A0A0A8]">
              {description.trim() || "Your description will appear here."}
            </p>

            <p className="mt-5 text-[11px] uppercase tracking-wide text-[#77717F]">
              {selected.length} {selected.length === 1 ? "game" : "games"} in this playlist ·{" "}
              <span className="normal-case">{visibility === "public" ? "Public" : "Private"}</span>
            </p>

            <div className="mt-3 grid grid-cols-2 gap-3 min-w-0">
              {selected.map((game, i) => (
                <div key={game.appid} className="min-w-0">
                  <div className="relative">
                    <Cover src={game.cover} appid={game.appid} className="h-24 w-full rounded-lg" />
                    <span className="absolute left-2 top-2 flex h-5 w-5 items-center justify-center rounded bg-black/70 text-[10px] text-white font-medium">
                      {i + 1}
                    </span>
                  </div>
                  <p className="mt-1.5 truncate text-[13px] font-medium text-[#E6E1EA]">{game.title}</p>
                  {game.subtitle && (
                    <p className="truncate text-[11px] text-[#77717F]">{game.subtitle}</p>
                  )}
                </div>
              ))}
            </div>

            {selected.length === 0 && (
              <p className="mt-3 text-xs text-[#77717F]">Add games to see your preview.</p>
            )}

            <div className="mt-5 border-t border-[#302438] pt-4 text-xs text-[#77717F]">
              {visibility === "public"
                ? "Ready for the community when you create it."
                : "Only you will be able to see this playlist."}
            </div>
          </aside>
        </div>

        <p className="mt-6 text-xs text-[#77717F]">
          A collection, not a play status. Adding games here won’t change their status in My List.
        </p>
      </main>

      <Footer />
    </div>
  );
}