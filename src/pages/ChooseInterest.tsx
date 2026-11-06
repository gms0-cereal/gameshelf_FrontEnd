import { useEffect, useMemo, useState, type ReactNode } from "react";
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
const MAX_TAGS = 30;
const VISIBLE_TAGS = 40;

// GameShelf palette
const COLORS = {
  background: "#000000",
  surface: "#17191E",
  surfaceRaised: "#20232B",
  border: "#302438",
  borderHover: "#554363",
  lavender: "#B39ACF",
  lavenderLight: "#C2ADE0",
  text: "#E6E1EA",
  muted: "#A0A0A8",
  cyan: "#38BDF8",
  emerald: "#34D399",
  gold: "#FBBF24",
  error: "#E58B91",
  errorSurface: "#2B171C",
} as const;

function toggleSelection(list: string[], value: string) {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

function toText(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") {
    return value.join(" ");
  }
  return undefined;
}

function errorMessage(err: unknown) {
  if (isAxiosError(err)) {
    if (!err.response) {
      return "Can't reach the server. Check your connection and try again.";
    }

    const data = err.response.data as Record<string, unknown> | undefined;
    const first =
      data && typeof data === "object"
        ? Object.values(data)[0]
        : undefined;

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
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border px-3.5 text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C2ADE0] ${
        active
          ? "border-[#B39ACF] bg-[#302438] text-[#E6E1EA]"
          : "border-[#302438] bg-[#20232B] text-[#A0A0A8] hover:border-[#554363] hover:text-[#E6E1EA]"
      }`}
    >
      {active && (
        <Check
          className="size-3.5 text-[#C2ADE0]"
          strokeWidth={1.7}
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  );
}

function Step({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[#302438] bg-[#17191E] p-6">
      <h3 className="text-base font-semibold text-[#E6E1EA]">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Cover image with a dark fallback if it is missing or fails to load. */
function Cover({
  src,
  className,
}: {
  src?: string | null;
  className: string;
}) {
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
      className={`bg-gradient-to-br from-[#302438] to-[#20232B] ${className}`}
    />
  );
}

export default function ChooseInterest() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [genres, setGenres] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<string[]>([]);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PickerGame[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [liked, setLiked] = useState<PickerGame[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [preferencesLoading, setPreferencesLoading] = useState(true);
  const [heroFailed, setHeroFailed] = useState(false);

  const [options, setOptions] = useState<TasteOptionsResponse | null>(null);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagQuery, setTagQuery] = useState("");

  // Restore the user's saved preferences and load available options.
  useEffect(() => {
    if (authLoading || !user) return;

    let cancelled = false;

    setPreferencesLoading(true);
    setProfileError(null);

    getTasteOptions()
      .then((data) => {
        if (!cancelled) {
          setOptions(data);
          setOptionsError(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setOptionsError("Couldn't load genres and tags. Try again later.");
        }
      });

    getTasteProfile()
      .then((profile) => {
        if (cancelled) return;

        setGenres(profile.genres ?? []);
        setTags(profile.tags ?? []);
        setPlatforms(profile.platforms ?? []);

        setLiked(
          (profile.liked_games ?? []).map(
            (game) =>
              ({
                appid: game.appid,
                title: game.title,
                cover: game.cover ?? null,
              }) satisfies PickerGame
          )
        );
      })
      .catch(() => {
        if (!cancelled) {
          setProfileError(
            "Couldn't load your saved preferences. Refresh the page before saving to avoid overwriting them."
          );
        }
      })
      .finally(() => {
        if (!cancelled) setPreferencesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, user?.id]);

  // Redirect unauthenticated users.
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login", {
        replace: true,
        state: { from: "/interests" },
      });
    }
  }, [authLoading, user, navigate]);

  const visibleTags = useMemo(() => {
    if (!options) return [];

    const search = tagQuery.trim().toLowerCase();

    const names = (options.tags ?? [])
      .map((tag) => tag.name)
      .filter((name) => !search || name.toLowerCase().includes(search));

    return search ? names.slice(0, 60) : names.slice(0, VISIBLE_TAGS);
  }, [options, tagQuery]);

  // Previously selected tags remain visible even when they do not match the search.
  const chipTags = useMemo(
    () => Array.from(new Set([...tags, ...visibleTags])),
    [tags, visibleTags]
  );

  const likedIds = useMemo(
    () => new Set(liked.map((game) => game.appid)),
    [liked]
  );

  function toggleTag(name: string) {
    if (!tags.includes(name) && tags.length >= MAX_TAGS) {
      toast.error(`You can pick up to ${MAX_TAGS} tags.`);
      return;
    }

    setTags((current) => toggleSelection(current, name));
    setError(null);
  }

  function toggleLiked(game: PickerGame) {
    setLiked((current) => {
      if (current.some((item) => item.appid === game.appid)) {
        return current.filter((item) => item.appid !== game.appid);
      }

      if (current.length >= MAX_LIKED_GAMES) {
        toast.error(`You can pick up to ${MAX_LIKED_GAMES} games.`);
        return current;
      }

      return [...current, game];
    });

    setError(null);
  }

  // Search Steam 300ms after typing stops.
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

        if (!cancelled) {
          setResults(games);
        }
      } catch {
        if (!cancelled) {
          setResults([]);
          setSearchError(
            "Couldn't search Steam right now. Try again in a moment."
          );
        }
      } finally {
        if (!cancelled) {
          setSearching(false);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [trimmed, isSearching]);

  async function handleSave() {
    if (submitting || preferencesLoading || profileError) return;

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
        platforms,
        likedGameIds: liked.map((game) => game.appid),
      });

      toast.success("Preferences saved");
      navigate(AFTER_SAVE_PATH);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  const saveDisabled =
    submitting || preferencesLoading || Boolean(profileError);

  return (
    <div className="min-h-screen bg-black text-[#E6E1EA]">
      <div
        className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col bg-black text-[#E6E1EA] antialiased"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <Navbar />

        <main className="flex flex-1 flex-col gap-8 px-5 pb-16 pt-9 md:px-8 xl:px-16">
          <div className="flex flex-col gap-4">
            <p className="text-[10px] uppercase tracking-[1px] text-[#B39ACF]">
              Make it yours
            </p>

            <h1 className="text-[36px] font-semibold leading-[41px] tracking-[-0.8px] text-[#E6E1EA]">
              Choose Interests
            </h1>
          </div>

          <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
            {/* Left: the form */}
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-4">
                <h2 className="text-[24px] font-semibold leading-[29px] tracking-[-0.5px] text-[#E6E1EA]">
                  Find your next favorite game.
                </h2>

                <p className="text-[13px] text-[#A0A0A8]">
                  Select genres and games you enjoy. You can change these later.
                </p>
              </div>

              {preferencesLoading && (
                <p
                  role="status"
                  className="flex items-center gap-2 text-xs text-[#A0A0A8]"
                >
                  <Loader2 className="size-3.5 animate-spin" />
                  Loading your saved preferences…
                </p>
              )}

              {profileError && (
                <p
                  role="alert"
                  className="rounded-lg border border-[#E58B91]/30 bg-[#2B171C] px-3 py-2 text-xs text-[#E58B91]"
                >
                  {profileError}
                </p>
              )}

              <Step title="1. Favorite genres">
                {optionsError && (
                  <p role="alert" className="mb-3 text-xs text-[#E58B91]">
                    {optionsError}
                  </p>
                )}

                {!options && !optionsError && (
                  <p role="status" className="text-xs text-[#A0A0A8]">
                    Loading genres from Steam…
                  </p>
                )}

                <div
                  className="flex flex-wrap gap-2"
                  role="group"
                  aria-label="Favorite genres"
                >
                  {options?.genres.map(({ name }) => (
                    <Chip
                      key={name}
                      active={genres.includes(name)}
                      onClick={() => {
                        setGenres((current) =>
                          toggleSelection(current, name)
                        );
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
                  className="h-11 w-full rounded-lg border border-[#302438] bg-black px-3.5 text-xs text-[#E6E1EA] outline-none placeholder:text-[#777780] focus:border-[#B39ACF] focus:ring-1 focus:ring-[#B39ACF]/30"
                />

                <div
                  className="mt-3 flex flex-wrap gap-2"
                  role="group"
                  aria-label="Favorite tags"
                >
                  {chipTags.map((name) => (
                    <Chip
                      key={name}
                      active={tags.includes(name)}
                      onClick={() => toggleTag(name)}
                    >
                      {name}
                    </Chip>
                  ))}
                </div>

                {tagQuery.trim() && visibleTags.length === 0 && (
                  <p className="mt-3 text-xs text-[#A0A0A8]">
                    No tags found.
                  </p>
                )}

                <p className="mt-3 text-[11px] text-[#777780]">
                  {tags.length}/{MAX_TAGS} tags selected
                </p>
              </Step>

              <Step title="3. Preferred platforms">
                <div
                  className="flex flex-wrap gap-2"
                  role="group"
                  aria-label="Preferred platforms"
                >
                  {options?.platforms.map(({ value, label }) => (
                    <Chip
                      key={value}
                      active={platforms.includes(value)}
                      onClick={() =>
                        setPlatforms((current) =>
                          toggleSelection(current, value)
                        )
                      }
                    >
                      {label}
                    </Chip>
                  ))}
                </div>
              </Step>

              <Step title="4. Games you like">
                <label
                  htmlFor="liked-search"
                  className="text-xs font-semibold text-[#E6E1EA]"
                >
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
                    className="h-11 w-full rounded-lg border border-[#302438] bg-black pl-3.5 pr-10 text-xs text-[#E6E1EA] outline-none placeholder:text-[#777780] focus:border-[#B39ACF] focus:ring-1 focus:ring-[#B39ACF]/30"
                  />

                  <Search
                    className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-[#38BDF8]"
                    strokeWidth={1.7}
                    aria-hidden="true"
                  />
                </div>

                {searching && (
                  <p
                    role="status"
                    className="mt-3 flex items-center gap-2 text-xs text-[#A0A0A8]"
                  >
                    <Loader2
                      className="size-3.5 animate-spin text-[#38BDF8]"
                      aria-hidden="true"
                    />
                    Searching…
                  </p>
                )}

                {searchError && (
                  <p role="alert" className="mt-3 text-xs text-[#E58B91]">
                    {searchError}
                  </p>
                )}

                {isSearching &&
                  !searching &&
                  !searchError &&
                  results.length === 0 && (
                    <p className="mt-3 text-xs text-[#A0A0A8]">
                      No games found.
                    </p>
                  )}

                {/* Search results */}
                {results.length > 0 && (
                  <ul
                    className="mt-3 grid gap-2 sm:grid-cols-2"
                    aria-label="Search results"
                  >
                    {results.slice(0, 6).map((game) => {
                      const added = likedIds.has(game.appid);

                      return (
                        <li key={game.appid}>
                          <button
                            type="button"
                            onClick={() => toggleLiked(game)}
                            aria-pressed={added}
                            className={`flex w-full cursor-pointer items-center gap-3 rounded-lg border p-2 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C2ADE0] ${
                              added
                                ? "border-[#B39ACF] bg-[#302438]/60"
                                : "border-[#302438] bg-[#20232B] hover:border-[#554363]"
                            }`}
                          >
                            <Cover
                              src={game.cover}
                              className="h-10 w-[72px] shrink-0 rounded-md"
                            />

                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-xs font-medium text-[#E6E1EA]">
                                {game.title}
                              </span>

                              <span className="block text-[10px] text-[#A0A0A8]">
                                {added ? "Added" : "Add to liked games"}
                              </span>
                            </span>

                            {added ? (
                              <Check
                                className="size-4 shrink-0 text-[#B39ACF]"
                                aria-hidden="true"
                              />
                            ) : (
                              <Plus
                                className="size-4 shrink-0 text-[#38BDF8]"
                                aria-hidden="true"
                              />
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}

                {/* Selected games */}
                {liked.length > 0 && (
                  <div className="mt-5">
                    <p className="text-xs text-[#A0A0A8]">
                      Your liked games ({liked.length}/{MAX_LIKED_GAMES})
                    </p>

                    <ul className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {liked.map((game) => (
                        <li
                          key={game.appid}
                          className="relative overflow-hidden rounded-lg border border-[#302438] bg-[#20232B]"
                        >
                          <Cover
                            src={game.cover}
                            className="h-20 w-full"
                          />

                          <p className="truncate p-2.5 text-xs font-medium text-[#E6E1EA]">
                            {game.title}
                          </p>

                          <button
                            type="button"
                            onClick={() => toggleLiked(game)}
                            aria-label={`Remove ${game.title}`}
                            className="absolute right-1.5 top-1.5 flex size-6 cursor-pointer items-center justify-center rounded-md border border-white/10 bg-black/75 text-[#E6E1EA] transition-colors hover:border-[#E58B91]/50 hover:bg-[#2B171C] hover:text-[#E58B91]"
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
                  className="rounded-lg border border-[#E58B91]/30 bg-[#2B171C] px-3 py-2 text-[13px] text-[#E58B91]"
                >
                  {error}
                </p>
              )}

              <div className="flex items-center gap-5">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saveDisabled}
                  className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-[#B39ACF] px-5 text-[13px] font-semibold text-[#17101F] transition-colors hover:bg-[#C2ADE0] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C2ADE0] focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting && (
                    <Loader2
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                  )}

                  {preferencesLoading
                    ? "Loading…"
                    : submitting
                      ? "Saving…"
                      : "Save Preferences"}
                </button>

                <Link
                  to={AFTER_SAVE_PATH}
                  className="text-xs text-[#A0A0A8] transition-colors hover:text-[#C2ADE0]"
                >
                  Skip for now
                </Link>
              </div>
            </div>

            {/* Right: artwork + copy */}
            <aside className="flex flex-col gap-5 lg:sticky lg:top-6">
              {heroFailed ? (
                <div
                  aria-hidden="true"
                  className="aspect-[4/3] w-full rounded-xl bg-gradient-to-br from-[#302438] via-[#20232B] to-[#17191E]"
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
                <p className="text-[9px] uppercase tracking-[1px] text-[#B39ACF]">
                  A little taste. A better shelf.
                </p>

                <h2 className="text-[24px] font-semibold leading-[29px] tracking-[-0.5px] text-[#E6E1EA]">
                  Great games, more you.
                </h2>

                <p className="text-xs leading-5 text-[#A0A0A8]">
                  Your favorite genres and liked games help us find adventures
                  worth your time.
                </p>

                <p className="text-xs leading-5 text-[#A0A0A8]">
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