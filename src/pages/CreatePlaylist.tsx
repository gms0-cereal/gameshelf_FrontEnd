import { useEffect, useMemo, useRef, useState } from "react";
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
  X,
} from "lucide-react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { useAuth } from "../context/AuthContext";
import {
  PLAYLIST_GAMES_FIELD,
  createPlaylist,
  searchSteamGames,
  type PickerGame,
  type Visibility,
} from "../services/playlistService";

const MAX_GAMES = 100;

// Shown under "Suggestions for your playlist" before the user types anything.
const SUGGESTIONS: PickerGame[] = [
  {
    appid: 387290,
    title: "Ori and the Blind Forest",
    cover: "/images/games/ori-and-the-blind-forest.png",
    subtitle: "Adventure / Platformer",
  },
  {
    appid: 774361,
    title: "Blasphemous",
    cover: "/images/games/blasphemous.png",
    subtitle: "Action / Metroidvania",
  },
  {
    appid: 1244090,
    title: "Sea of Stars",
    cover: "/images/games/sea-of-stars.png",
    subtitle: "RPG",
  },
];

// Home shows the new playlist under "Community Playlists".
const AFTER_CREATE_PATH = "/home";

type FieldErrors = Partial<Record<"title" | "description" | "games", string>>;

function toText(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value.join(" ");
  return undefined;
}

/** Handles your payloads: { error }, { detail }, { title: [...] }, { <games field>: [...] }. */
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
  "w-full rounded-lg border border-[#4a4766] bg-[#1f1d2e] px-3 text-[13px] text-[#e6e3f5] placeholder:text-[#9a97b5] focus:outline-none focus:ring-2 focus:ring-[#8b6fd6]/60";

/** Cover image, with a soft gradient if it fails to load or is missing. */
function Cover({ src, className }: { src?: string | null; className: string }) {
  const [failed, setFailed] = useState(false);
  return src && !failed ? (
    <img
      src={src}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  ) : (
    <div className={`bg-gradient-to-br from-[#3b3560] to-[#1d2b33] ${className}`} aria-hidden="true" />
  );
}

const CreatePlaylist = () => {
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

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const dragIndex = useRef<number | null>(null);

  // Only logged-in users can create playlists.
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login", { replace: true, state: { from: "/playlists/new" } });
    }
  }, [authLoading, user, navigate]);

  // Search Steam 300ms after typing stops. Under 2 characters shows suggestions.
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
  const visibleResults = isSearching ? results.slice(0, 6) : SUGGESTIONS;

  return (
    <div className="flex min-h-screen flex-col bg-[#282539] font-sans text-[#e6e3f5]">
      <Navbar />

      <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-8 sm:px-6 lg:px-[52px]">
        <nav className="text-xs text-[#a9a6c2]" aria-label="Breadcrumb">
          <Link to="/home#community-playlists" className="hover:underline">
            Community playlists
          </Link>
          <span className="mx-2">&gt;</span>
          <span>Create playlist</span>
        </nav>

        <h1 className="mt-6 text-[32px] font-semibold">Create game playlist</h1>
        <p className="mt-2 text-[13px] text-[#a9a6c2]">
          Great games deserve good company. Build a collection worth sharing.
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.35fr_1fr]">
          {/* ───────────── LEFT: form ───────────── */}
          <div className="space-y-6">
            {/* Playlist details */}
            <section className="rounded-2xl border border-[#3a3754] bg-[#312e45] p-6">
              <h2 className="text-lg font-semibold">Playlist details</h2>

              <label htmlFor="playlist-title" className="mt-5 block text-xs font-medium">
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
                className={`${inputBase} mt-2 h-[38px] ${fieldErrors.title ? "border-[#a8454b]" : ""}`}
              />
              {fieldErrors.title && (
                <p className="mt-1 text-xs text-[#f4b6ba]">{fieldErrors.title}</p>
              )}

              <label htmlFor="playlist-description" className="mt-5 block text-xs font-medium">
                Description
              </label>
              <textarea
                id="playlist-description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What ties these games together?"
                className={`${inputBase} mt-2 resize-none py-2 ${fieldErrors.description ? "border-[#a8454b]" : ""}`}
              />
              {fieldErrors.description && (
                <p className="mt-1 text-xs text-[#f4b6ba]">{fieldErrors.description}</p>
              )}

              <div className="mt-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-medium">Visibility</p>
                  <p className="mt-1 text-xs text-[#a9a6c2]">
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
                        className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-[13px] capitalize transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8b6fd6] ${
                          active
                            ? "border-[#8b6fd6] bg-[#8b6fd6]/25 text-[#e6e3f5]"
                            : "border-[#4a4766] text-[#a9a6c2] hover:text-[#e6e3f5]"
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

            {/* Find games */}
            <section className="rounded-2xl border border-[#3a3754] bg-[#312e45] p-6">
              <h2 className="text-lg font-semibold">Find games</h2>

              <div className="relative mt-4">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8f8ca9]"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search the Steam catalogue..."
                  aria-label="Search games"
                  className={`${inputBase} h-[38px] pl-9`}
                />
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-[#a9a6c2]">
                <span>{isSearching ? "Search results" : "Suggestions for your playlist"}</span>
                <Link to="/explore" className="inline-flex items-center gap-1 hover:text-[#e6e3f5]">
                  Browse all games <ArrowRight className="h-3 w-3" aria-hidden="true" />
                </Link>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {visibleResults.map((game) => {
                  const added = selectedIds.has(game.appid);
                  return (
                    <button
                      key={game.appid}
                      type="button"
                      onClick={() => toggleGame(game)}
                      aria-pressed={added}
                      className={`overflow-hidden rounded-xl border text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8b6fd6] ${
                        added ? "border-[#8b6fd6]" : "border-[#3a3754] hover:border-[#6b5fb0]"
                      }`}
                    >
                      <div className="relative">
                        <Cover src={game.cover} className="h-24 w-full" />
                        <span
                          className={`absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-md ${
                            added ? "bg-[#8b6fd6]" : "bg-black/50"
                          }`}
                        >
                          {added ? (
                            <Check className="h-3.5 w-3.5" aria-hidden="true" />
                          ) : (
                            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                          )}
                        </span>
                      </div>
                      <div className="p-2.5">
                        <p className="truncate text-[13px] font-medium">{game.title}</p>
                        <p className="mt-0.5 text-[11px] text-[#a9a6c2]">
                          {added ? "Added to playlist" : "+ Add to playlist"}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {searching && (
                <p className="mt-3 flex items-center gap-2 text-xs text-[#a9a6c2]">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> Searching…
                </p>
              )}
              {searchError && <p className="mt-3 text-xs text-[#f4b6ba]">{searchError}</p>}
              {isSearching && !searching && !searchError && results.length === 0 && (
                <p className="mt-3 text-xs text-[#a9a6c2]">No games found.</p>
              )}
            </section>

            {/* Selected games */}
            <section className="rounded-2xl border border-[#3a3754] bg-[#312e45] p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Selected games</h2>
                <span className="rounded-full bg-[#8b6fd6]/25 px-3 py-1 text-xs text-[#d9d0f5]">
                  {selected.length} {selected.length === 1 ? "game" : "games"}
                </span>
              </div>
              <p className="mt-1 text-xs text-[#a9a6c2]">
                Drag to reorder or use the arrows. ✕ removes a game.
              </p>

              {fieldErrors.games && (
                <p className="mt-3 text-xs text-[#f4b6ba]">{fieldErrors.games}</p>
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
                    className="flex items-center gap-3 rounded-xl border border-[#3a3754] bg-[#1f1d2e] p-2.5"
                  >
                    <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-[#8f8ca9]" aria-hidden="true" />
                    <span className="w-5 text-xs text-[#8f8ca9]">{String(i + 1).padStart(2, "0")}</span>
                    <Cover src={game.cover} className="h-10 w-16 shrink-0 rounded-md" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium">{game.title}</p>
                      {game.subtitle && (
                        <p className="truncate text-[11px] text-[#a9a6c2]">{game.subtitle}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => moveGame(i, i - 1)}
                      disabled={i === 0}
                      aria-label={`Move ${game.title} up`}
                      className="rounded p-1 text-[#a9a6c2] hover:text-[#e6e3f5] disabled:opacity-30"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveGame(i, i + 1)}
                      disabled={i === selected.length - 1}
                      aria-label={`Move ${game.title} down`}
                      className="rounded p-1 text-[#a9a6c2] hover:text-[#e6e3f5] disabled:opacity-30"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleGame(game)}
                      aria-label={`Remove ${game.title}`}
                      className="rounded p-1 text-[#a9a6c2] hover:text-[#f4b6ba]"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>

              {selected.length === 0 && (
                <p className="mt-4 rounded-xl border border-dashed border-[#4a4766] p-6 text-center text-xs text-[#a9a6c2]">
                  Games you add will show up here.
                </p>
              )}
            </section>

            {error && (
              <p
                role="alert"
                className="rounded-lg border border-[#a8454b] bg-[#a8454b]/15 px-3 py-2 text-[13px] text-[#f4b6ba]"
              >
                {error}
              </p>
            )}

            {/* Footer actions */}
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-[#a9a6c2]">
                {selected.length} {selected.length === 1 ? "game" : "games"} ·{" "}
                <span className="capitalize">{visibility}</span> playlist
              </span>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="h-[34px] rounded-md border border-[#4a4766] px-5 text-[13px] hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e6e3f5]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="inline-flex h-[34px] items-center justify-center gap-2 rounded-md bg-[#a8454b] px-5 text-[13px] font-medium text-white transition-colors hover:bg-[#b9525a] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e6e3f5] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <Plus className="h-3.5 w-3.5 text-white/70" aria-hidden="true" />
                  )}
                  {submitting ? "Creating…" : "Create playlist"}
                </button>
              </div>
            </div>
          </div>

          {/* ───────────── RIGHT: live preview ───────────── */}
          <aside className="h-fit rounded-2xl border border-[#3a3754] bg-[#312e45] p-6 lg:sticky lg:top-6">
            <div className="flex items-center justify-between text-xs text-[#a9a6c2]">
              <span className="inline-flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5" aria-hidden="true" /> Community preview
              </span>
              <span>Not published yet</span>
            </div>

            <div className="mt-5 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#8b6fd6]/40 text-xs font-semibold">
                {ownerName.slice(0, 2).toUpperCase()}
              </span>
              <span className="text-xs text-[#b6a8e8]">{ownerName}</span>
            </div>

            <h3 className="mt-2 text-2xl font-semibold">{title.trim() || "Untitled playlist"}</h3>
            <p className="mt-3 whitespace-pre-line text-[13px] text-[#c9c6e0]">
              {description.trim() || "Your description will appear here."}
            </p>

            <p className="mt-5 text-[11px] uppercase tracking-wide text-[#8f8ca9]">
              {selected.length} {selected.length === 1 ? "game" : "games"} in this playlist ·{" "}
              <span className="normal-case">{visibility === "public" ? "Public" : "Private"}</span>
            </p>

            <div className="mt-3 grid grid-cols-2 gap-3">
              {selected.map((game, i) => (
                <div key={game.appid}>
                  <div className="relative">
                    <Cover src={game.cover} className="h-24 w-full rounded-lg" />
                    <span className="absolute left-2 top-2 flex h-5 w-5 items-center justify-center rounded bg-black/60 text-[10px]">
                      {i + 1}
                    </span>
                  </div>
                  <p className="mt-1.5 truncate text-[13px] font-medium">{game.title}</p>
                  {game.subtitle && (
                    <p className="truncate text-[11px] text-[#a9a6c2]">{game.subtitle}</p>
                  )}
                </div>
              ))}
            </div>

            {selected.length === 0 && (
              <p className="mt-3 text-xs text-[#a9a6c2]">Add games to see your preview.</p>
            )}

            <div className="mt-5 border-t border-[#3a3754] pt-4 text-xs text-[#a9a6c2]">
              {visibility === "public"
                ? "Ready for the community when you create it."
                : "Only you will be able to see this playlist."}
            </div>
          </aside>
        </div>

        <p className="mt-6 text-xs text-[#a9a6c2]">
          A collection, not a play status. Adding games here won’t change their status in My List.
        </p>
      </main>

      <Footer />
    </div>
  );
};

export default CreatePlaylist;