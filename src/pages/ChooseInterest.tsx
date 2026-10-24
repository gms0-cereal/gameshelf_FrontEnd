import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import { Check, Loader2, Plus, Search, X } from "lucide-react";
import { toast } from "sonner";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { useAuth } from "../context/AuthContext";
import { searchSteamGames, type PickerGame } from "../services/playlistService";
import {
    getTasteOptions,
    getTasteProfile,
    saveTasteProfile,
    type TasteOptionsResponse,
} from "../services/tasteService";

const AFTER_SAVE_PATH = "/home";
const MAX_LIKED_GAMES = 20;

// Labels are what the user sees; the values are what the API receives.
// const GENRES = [
//   "Action",
//   "RPG",
//   "Adventure",
//   "Strategy",
//   "Simulation",
//   "Sports",
//   "Racing",
//   "Horror",
// ];

// const PLATFORMS: { label: string; values: string[] }[] = [
//   { label: "PC", values: ["windows", "linux"] },
//   { label: "PlayStation", values: ["playstation"] },
//   { label: "Xbox", values: ["xbox"] },
//   { label: "Switch", values: ["switch"] },
//   { label: "Mobile", values: ["mobile"] },
// ];

const MAX_TAGS = 30;
const VISIBLE_TAGS = 40;

function toText(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value.join(" ");
  return undefined;
}

function errorMessage(err: unknown) {
  if (isAxiosError(err)) {
    if (!err.response) {
      return "Can't reach the server. Check your connection and try again.";
    }
    const data = err.response.data as Record<string, unknown> | undefined;
    const first = data && typeof data === "object" ? Object.values(data)[0] : undefined;
    return (
      toText(data?.error) ??
      toText(data?.detail) ??
      toText(first) ??
      "Something went wrong. Please try again."
    );
  }
  return "Something went wrong. Please try again.";
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border px-3.5 text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c2ade7] ${
        active
          ? "border-[#7c5fc4] bg-[#4a3d73] text-[#e0deeb]"
          : "border-[#55516c] bg-[#2a2838] text-[#b4aec7] hover:text-[#e0deeb]"
      }`}
    >
      {active && <Check className="size-3.5" strokeWidth={1.7} aria-hidden="true" />}
      {children}
    </button>
  );
}

function Step({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[#55516c] bg-[#373646] p-6">
      <h3 className="text-base font-semibold">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Cover image with a soft gradient if it is missing or fails to load. */
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
    <div
      aria-hidden="true"
      className={`bg-gradient-to-br from-[#3b3560] to-[#1d2b33] ${className}`}
    />
  );
}

export default function ChooseInterest() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [genres, setGenres] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<string[]>([]); // labels, e.g. "PC"

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PickerGame[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [liked, setLiked] = useState<PickerGame[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [heroFailed, setHeroFailed] = useState(false);

  const [options, setOptions] = useState<TasteOptionsResponse | null>(null);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagQuery, setTagQuery] = useState("");

  // Genres, tags and platforms come from the Steam data; saved choices are restored.
  useEffect(() => {
    if (authLoading || !user) return;
    let cancelled = false;

    getTasteOptions()
      .then((data) => {
        if (!cancelled) setOptions(data);
      })
      .catch(() => {
        if (!cancelled) setOptionsError("Couldn't load genres and tags. Try again later.");
      });

    getTasteProfile()
      .then((profile) => {
        if (cancelled) return;
        setGenres(profile.genres ?? []);
        setTags(profile.tags ?? []);
        setPlatforms(profile.platforms ?? []);
        setLiked(
          (profile.liked_games ?? []).map(
            (g) => ({ appid: g.appid, title: g.title, cover: g.cover ?? null }) as PickerGame
          )
        );
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  const visibleTags = useMemo(() => {
    if (!options) return [];
    const q = tagQuery.trim().toLowerCase();
    const names = options.tags
      .map((t) => t.name)
      .filter((name) => !q || name.toLowerCase().includes(q));
    return q ? names.slice(0, 60) : names.slice(0, VISIBLE_TAGS);
  }, [options, tagQuery]);
  // picked tags always stay visible
  const chipTags = useMemo(() => Array.from(new Set([...tags, ...visibleTags])), [tags, visibleTags]);

  function toggleTag(name: string) {
    if (!tags.includes(name) && tags.length >= MAX_TAGS) {
      toast.error(`You can pick up to ${MAX_TAGS} tags.`);
      return;
    }
    setTags((list) => toggle(list, name));
    setError(null);
  }

  // Only logged-in users have a taste profile.
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login", { replace: true, state: { from: "/interests" } });
    }
  }, [authLoading, user, navigate]);

  // Search Steam 300ms after typing stops (2+ characters).
  const trimmed = query.trim();
  const isSearching = trimmed.length >= 2;

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
        const games = await searchSteamGames(trimmed);
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
  }, [trimmed, isSearching]);

  const likedIds = useMemo(() => new Set(liked.map((g) => g.appid)), [liked]);

  const toggle = (list: string[], value: string) =>
    list.includes(value) ? list.filter((item) => item !== value) : [...list, value];

  function toggleLiked(game: PickerGame) {
    setLiked((current) => {
      if (current.some((g) => g.appid === game.appid)) {
        return current.filter((g) => g.appid !== game.appid);
      }
      if (current.length >= MAX_LIKED_GAMES) {
        toast.error(`You can pick up to ${MAX_LIKED_GAMES} games.`);
        return current;
      }
      return [...current, game];
    });
  }

  async function handleSave() {
    if (submitting) return;

    if (genres.length === 0 && tags.length === 0 && liked.length === 0) {
      setError("Pick at least one genre, tag or game you like.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await saveTasteProfile({
        genres,
        tags,
        platforms, // already windows / mac / linux
        likedGameIds: liked.map((g) => g.appid),
      });
      toast.success("Preferences saved");
      navigate(AFTER_SAVE_PATH);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#201e2f]">
      <div
        className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col bg-[#201e2f] text-[#e0deeb] antialiased"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <Navbar />

        <main className="flex flex-1 flex-col gap-8 px-5 pb-16 pt-9 md:px-8 xl:px-16">
          <div className="flex flex-col gap-4">
            <p className="text-[10px] uppercase tracking-[1px] text-[#c2ade7]">
              Make it yours
            </p>
            <h1 className="text-[36px] font-semibold leading-[41px] tracking-[-0.8px]">
              Choose Interests
            </h1>
          </div>

          <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
            {/* ───────── Left: the form ───────── */}
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-4">
                <h2 className="text-[24px] font-semibold leading-[29px] tracking-[-0.5px]">
                  Find your next favorite game.
                </h2>
                <p className="text-[13px] text-[#b4aec7]">
                  Select genres and games you enjoy. You can change these later.
                </p>
              </div>

              <Step title="1. Favorite genres">
                {optionsError && (
                  <p role="alert" className="text-xs text-[#e58d91]">{optionsError}</p>
                )}
                {!options && !optionsError && (
                  <p role="status" className="text-xs text-[#b4aec7]">Loading genres from Steam…</p>
                )}
                <div className="flex flex-wrap gap-2" role="group" aria-label="Favorite genres">
                  {options?.genres.map(({ name }) => (
                    <Chip
                      key={name}
                      active={genres.includes(name)}
                      onClick={() => {
                        setGenres((list) => toggle(list, name));
                        setError(null);
                      }}
                    >
                      {name}
                    </Chip>
                  ))}
                </div>
              </Step>

              <Step title="2. Favorite tags">
                <input
                  type="search"
                  value={tagQuery}
                  onChange={(event) => setTagQuery(event.target.value)}
                  placeholder="Search tags: Souls-like, Roguelike, Co-op…"
                  aria-label="Search tags"
                  autoComplete="off"
                  className="h-11 w-full rounded-lg border border-[#55516c] bg-[#2a2838] px-3.5 text-xs text-[#e0deeb] outline-none placeholder:text-[#8b86a3] focus:border-[#c2ade7]"
                />
                <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Favorite tags">
                  {chipTags.map((name) => (
                    <Chip key={name} active={tags.includes(name)} onClick={() => toggleTag(name)}>
                      {name}
                    </Chip>
                  ))}
                </div>
                {tagQuery.trim() && visibleTags.length === 0 && (
                  <p className="mt-3 text-xs text-[#b4aec7]">No tags found.</p>
                )}
              </Step>

              <Step title="3. Preferred platforms">
                <div className="flex flex-wrap gap-2" role="group" aria-label="Preferred platforms">
                  {options?.platforms.map(({ value, label }) => (
                    <Chip
                      key={value}
                      active={platforms.includes(value)}
                      onClick={() => setPlatforms((list) => toggle(list, value))}
                    >
                      {label}
                    </Chip>
                  ))}
                </div>
              </Step>

              <Step title="3. Games you like">
                <label htmlFor="liked-search" className="text-xs font-semibold">
                  Search and select games
                </label>

                <div className="relative mt-2">
                  <input
                    id="liked-search"
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Hollow Knight, Stardew Valley…"
                    autoComplete="off"
                    className="h-11 w-full rounded-lg border border-[#55516c] bg-[#2a2838] pl-3.5 pr-10 text-xs text-[#e0deeb] outline-none placeholder:text-[#8b86a3] focus:border-[#c2ade7]"
                  />
                  <Search
                    className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-[#8b86a3]"
                    strokeWidth={1.7}
                    aria-hidden="true"
                  />
                </div>

                {/* Search results */}
                {searching && (
                  <p role="status" className="mt-3 flex items-center gap-2 text-xs text-[#b4aec7]">
                    <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                    Searching…
                  </p>
                )}
                {searchError && (
                  <p role="alert" className="mt-3 text-xs text-[#e58d91]">
                    {searchError}
                  </p>
                )}
                {isSearching && !searching && !searchError && results.length === 0 && (
                  <p className="mt-3 text-xs text-[#b4aec7]">No games found.</p>
                )}

                {results.length > 0 && (
                  <ul className="mt-3 grid gap-2 sm:grid-cols-2" aria-label="Search results">
                    {results.slice(0, 6).map((game) => {
                      const added = likedIds.has(game.appid);
                      return (
                        <li key={game.appid}>
                          <button
                            type="button"
                            onClick={() => toggleLiked(game)}
                            aria-pressed={added}
                            className={`flex w-full cursor-pointer items-center gap-3 rounded-lg border p-2 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c2ade7] ${
                              added
                                ? "border-[#7c5fc4] bg-[#4a3d73]/40"
                                : "border-[#55516c] bg-[#2a2838] hover:border-[#8b6fd6]"
                            }`}
                          >
                            <Cover src={game.cover} className="h-10 w-[72px] shrink-0 rounded-md" />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-xs font-medium">
                                {game.title}
                              </span>
                              <span className="block text-[10px] text-[#b4aec7]">
                                {added ? "Added" : "Add to liked games"}
                              </span>
                            </span>
                            {added ? (
                              <Check className="size-4 shrink-0 text-[#c2ade7]" aria-hidden="true" />
                            ) : (
                              <Plus className="size-4 shrink-0 text-[#8b86a3]" aria-hidden="true" />
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}

                {/* What the user picked */}
                {liked.length > 0 && (
                  <div className="mt-5">
                    <p className="text-xs text-[#b4aec7]">
                      Your liked games ({liked.length})
                    </p>
                    <ul className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {liked.map((game) => (
                        <li
                          key={game.appid}
                          className="relative overflow-hidden rounded-lg border border-[#55516c] bg-[#2a2838]"
                        >
                          <Cover src={game.cover} className="h-20 w-full" />
                          <p className="truncate p-2.5 text-xs font-medium">{game.title}</p>
                          <button
                            type="button"
                            onClick={() => toggleLiked(game)}
                            aria-label={`Remove ${game.title}`}
                            className="absolute right-1.5 top-1.5 flex size-6 cursor-pointer items-center justify-center rounded-md bg-black/60 text-[#e0deeb] hover:bg-[#a8484c]"
                          >
                            <X className="size-3.5" aria-hidden="true" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Step>

              {error && (
                <p
                  role="alert"
                  className="rounded-lg border border-[#a8454b] bg-[#a8454b]/15 px-3 py-2 text-[13px] text-[#f4b6ba]"
                >
                  {error}
                </p>
              )}

              <div className="flex items-center gap-5">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={submitting}
                  className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-[#a8484c] px-5 text-[13px] font-semibold text-[#e0deeb] transition-colors hover:bg-[#ae494e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e0deeb] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                  {submitting ? "Saving…" : "Save Preferences"}
                </button>

                <Link
                  to={AFTER_SAVE_PATH}
                  className="text-xs text-[#b4aec7] hover:text-[#e0deeb]"
                >
                  Skip for now
                </Link>
              </div>
            </div>

            {/* ───────── Right: artwork + copy ───────── */}
            <aside className="flex flex-col gap-5 lg:sticky lg:top-6">
              {heroFailed ? (
                <div
                  aria-hidden="true"
                  className="aspect-[4/3] w-full rounded-xl bg-gradient-to-br from-[#3b3560] via-[#2a2b52] to-[#1d4b55]"
                />
              ) : (
                <img
                  src="/images/choose-interests.png"
                  alt=""
                  onError={() => setHeroFailed(true)}
                  className="aspect-[4/3] w-full rounded-xl object-cover"
                />
              )}

              <div className="flex flex-col gap-3">
                <p className="text-[9px] uppercase tracking-[1px] text-[#b4aec7]">
                  A little taste. A better shelf.
                </p>
                <h2 className="text-[24px] font-semibold leading-[29px] tracking-[-0.5px]">
                  Great games, more you.
                </h2>
                <p className="text-xs leading-5 text-[#b4aec7]">
                  Your favorite genres and liked games help us find adventures worth
                  your time.
                </p>
                <p className="text-xs leading-5 text-[#b4aec7]">
                  Your preferences can always evolve with you.
                </p>
              </div>
            </aside>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}