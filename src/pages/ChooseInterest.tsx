import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import {
  Check,
  Gamepad2,
  Loader2,
  Plus,
  Search,
  Sparkles,
  X,
} from "lucide-react";
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
const VISIBLE_GENRES = 40;
const VISIBLE_TAGS = 40;

const GENRES = [
  "Action", "Adventure", "Casual", "Indie", "RPG", "Simulation", "Strategy",
  "Sports", "Racing", "Puzzle", "Platformer", "Roguelike", "Horror",
  "Action-Adventure", "Action RPG", "Shooter", "Point & Click", "Beat 'em Up", "Fighting",
  "JRPG", "Strategy RPG", "Visual Novel", "Party-Based RPG", "MMORPG",
  "Turn-Based Strategy", "RTS", "Tower Defense", "City Builder",
  "Arcade", "Sandbox", "Survival", "Roguelite",
  "Hentai", "Sexual Content", "Nudity", "Adult Content",
];

type Accent = "purple" | "cyan" | "emerald";

const ACCENT_STYLES: Record<Accent, { selected: string; idle: string; icon: string; focus: string; hex: string }> = {
  purple: {
    selected: "border-[#B39ACF] bg-[#302438] text-[#E6E1EA]",
    idle: "border-[#302438] bg-[#1D1D25] text-[#A0A0A8] hover:border-[#554363] hover:text-[#E6E1EA]",
    icon: "text-[#C2ADE0]",
    focus: "focus-visible:ring-[#C2ADE0]",
    hex: "#B39ACF",
  },
  cyan: {
    selected: "border-[#38BDF8]/70 bg-[#102B38] text-[#D8F3FF]",
    idle: "border-[#263B47] bg-[#1D1D25] text-[#A0A0A8] hover:border-[#38BDF8]/50 hover:text-[#D8F3FF]",
    icon: "text-[#38BDF8]",
    focus: "focus-visible:ring-[#38BDF8]",
    hex: "#38BDF8",
  },
  emerald: {
    selected: "border-[#34D399]/70 bg-[#102D25] text-[#D5F8E9]",
    idle: "border-[#263B38] bg-[#1D1D25] text-[#A0A0A8] hover:border-[#34D399]/50 hover:text-[#D5F8E9]",
    icon: "text-[#34D399]",
    focus: "focus-visible:ring-[#34D399]",
    hex: "#34D399",
  },
};

function toggleSelection(list: string[], value: string) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function toText(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value.join(" ");
  return undefined;
}

function errorMessage(err: unknown) {
  if (isAxiosError(err)) {
    if (!err.response) return "Can't reach the server. Check your connection and try again.";
    const data = err.response.data as Record<string, unknown> | undefined;
    const first = data && typeof data === "object" ? Object.values(data)[0] : undefined;
    return toText(data?.error) ?? toText(data?.detail) ?? toText(first) ?? "Something went wrong. Please try again.";
  }
  return "Something went wrong. Please try again.";
}

function Chip({ active, onClick, children, accent = "purple" }: { active: boolean; onClick: () => void; children: ReactNode; accent?: Accent }) {
  const style = ACCENT_STYLES[accent];
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 ${style.focus} ${
        active ? style.selected : style.idle
      }`}
    >
      {active && <Check className={`size-3.5 shrink-0 ${style.icon}`} strokeWidth={2} aria-hidden="true" />}
      {children}
    </button>
  );
}

function Step({ number, title, description, accent = "purple", children }: { number: string; title: string; description: string; accent?: Accent; children: ReactNode }) {
  const hex = ACCENT_STYLES[accent].hex;
  return (
    <section className="rounded-2xl border border-[#302438] bg-[#141419] p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span
          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold"
          style={{ backgroundColor: `${hex}18`, color: hex }}
        >
          {number}
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-[#E6E1EA]">{title}</h3>
          <p className="mt-1 text-xs leading-5 text-[#A0A0A8]">{description}</p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function SearchField({ id, value, onChange, placeholder, label, accent = "purple" }: { id: string; value: string; onChange: (value: string) => void; placeholder: string; label: string; accent?: Accent }) {
  const iconColor = ACCENT_STYLES[accent].icon;
  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">{label}</label>
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className="h-11 w-full rounded-xl border border-[#302438] bg-black pl-10 pr-10 text-xs text-[#E6E1EA] outline-none transition-colors placeholder:text-[#777780] focus:border-[#554363] focus:ring-1 focus:ring-[#B39ACF]/30"
      />
      <Search className={`pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 ${iconColor}`} strokeWidth={1.8} aria-hidden="true" />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label={`Clear ${label.toLowerCase()}`}
          className="absolute right-3 top-1/2 flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-[#777780] transition-colors hover:text-[#E6E1EA]"
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

function Cover({ src, className }: { src?: string | null; className: string }) {
  const [failed, setFailed] = useState(false);
  return src && !failed ? (
    <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} className={`object-cover ${className}`} />
  ) : (
    <div aria-hidden="true" className={`bg-gradient-to-br from-[#302438] via-[#20232B] to-[#101014] ${className}`} />
  );
}

function SelectionSummary({ label, count, accent }: { label: string; count: number; accent: Accent }) {
  const color = ACCENT_STYLES[accent].hex;
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-[#302438] bg-black/50 px-3 py-2">
      <span className="text-[11px] text-[#A0A0A8]">{label}</span>
      <span className="text-xs font-semibold tabular-nums" style={{ color }}>{count}</span>
    </div>
  );
}

export default function ChooseInterest() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [genres, setGenres] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [liked, setLiked] = useState<PickerGame[]>([]);

  const [genreQuery, setGenreQuery] = useState("");
  const [tagQuery, setTagQuery] = useState("");
  const [query, setQuery] = useState("");

  const [results, setResults] = useState<PickerGame[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [preferencesLoading, setPreferencesLoading] = useState(true);

  const [options, setOptions] = useState<TasteOptionsResponse | null>(null);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !user) return;
    let cancelled = false;

    setPreferencesLoading(true);
    setProfileError(null);

    getTasteOptions()
      .then((data) => { if (!cancelled) { setOptions(data); setOptionsError(null); } })
      .catch(() => { if (!cancelled) setOptionsError("Couldn't load genres and tags. Try again later."); });

    getTasteProfile()
      .then((profile) => {
        if (cancelled) return;
        setGenres(profile.genres ?? []);
        setTags(profile.tags ?? []);
        setPlatforms(profile.platforms ?? []);
        setLiked((profile.liked_games ?? []).map((game) => ({ appid: game.appid, title: game.title, cover: game.cover ?? null })));
      })
      .catch(() => {
        if (!cancelled) setProfileError("Couldn't load your saved preferences. Refresh the page before saving to avoid overwriting them.");
      })
      .finally(() => { if (!cancelled) setPreferencesLoading(false); });

    return () => { cancelled = true; };
  }, [authLoading, user?.id]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login", { replace: true, state: { from: "/interests" } });
    }
  }, [authLoading, user, navigate]);

  const visibleGenres = useMemo(() => {
    const search = genreQuery.trim().toLowerCase();
    const names = GENRES.filter((name) => !search || name.toLowerCase().includes(search));
    return search ? names.slice(0, 100) : names.slice(0, VISIBLE_GENRES);
  }, [genreQuery]);

  const chipGenres = useMemo(() => Array.from(new Set([...genres, ...visibleGenres])), [genres, visibleGenres]);

  const visibleTags = useMemo(() => {
    if (!options) return [];
    const search = tagQuery.trim().toLowerCase();
    const names = (options.tags ?? []).map((tag) => tag.name).filter((name) => !search || name.toLowerCase().includes(search));
    return search ? names.slice(0, 100) : names.slice(0, VISIBLE_TAGS);
  }, [options, tagQuery]);

  const chipTags = useMemo(() => Array.from(new Set([...tags, ...visibleTags])), [tags, visibleTags]);

  const likedIds = useMemo(() => new Set(liked.map((game) => game.appid)), [liked]);

  function toggleGenre(name: string) { setGenres((c) => toggleSelection(c, name)); setError(null); }
  function toggleTag(name: string) {
    if (!tags.includes(name) && tags.length >= MAX_TAGS) { toast.error(`You can pick up to ${MAX_TAGS} tags.`); return; }
    setTags((c) => toggleSelection(c, name)); setError(null);
  }
  function togglePlatform(value: string) { setPlatforms((c) => toggleSelection(c, value)); setError(null); }
  function toggleLiked(game: PickerGame) {
    const alreadyAdded = liked.some((item) => item.appid === game.appid);
    if (!alreadyAdded && liked.length >= MAX_LIKED_GAMES) { toast.error(`You can pick up to ${MAX_LIKED_GAMES} games.`); return; }
    setLiked((c) => alreadyAdded ? c.filter((item) => item.appid !== game.appid) : [...c, game]);
    setError(null);
  }

  const trimmed = query.trim();
  const isSearching = trimmed.length >= 2;

  useEffect(() => {
    if (!isSearching) { setResults([]); setSearching(false); setSearchError(null); return; }
    let cancelled = false;
    setSearching(true);
    setSearchError(null);

    const timer = setTimeout(async () => {
      try {
        const games = await searchSteamGames(trimmed);
        if (!cancelled) setResults(games);
      } catch {
        if (!cancelled) { setResults([]); setSearchError("Couldn't search Steam right now. Try again in a moment."); }
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 300);

    return () => { cancelled = true; clearTimeout(timer); };
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
      await saveTasteProfile({ genres, tags, platforms, likedGameIds: liked.map((g) => g.appid) });
      toast.success("Preferences saved");
      navigate(AFTER_SAVE_PATH);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  const saveDisabled = submitting || preferencesLoading || Boolean(profileError);
  const totalSelections = genres.length + tags.length + liked.length + platforms.length;

  return (
    <div className="min-h-screen w-full bg-[#000000]">
      <div className="flex min-h-screen w-full flex-col bg-[#000000] text-[#E6E1EA] antialiased" style={{ fontFamily: "'Inter', sans-serif" }}>
        <Navbar />

        <main className="flex flex-1 flex-col gap-8 px-5 pb-16 pt-11 md:px-8 xl:px-16">
          <div className="flex min-h-[65px] flex-wrap items-center justify-between gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[#B39ACF]">
                <Sparkles className="size-3.5" aria-hidden="true" />
                Make it yours
              </div>
              <h1 className="text-[36px] font-semibold leading-[41px] tracking-[-0.8px] text-[#E6E1EA]">
                Build your taste profile
              </h1>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-[#302438] bg-[#141419] px-3.5 py-2.5">
              <Gamepad2 className="size-4 text-[#B39ACF]" />
              <span className="text-xs text-[#A0A0A8]">Your selections</span>
              <span className="text-sm font-semibold tabular-nums text-[#E6E1EA]">{totalSelections}</span>
            </div>
          </div>

          {/* Full-width container layout */}
          <div className="flex w-full flex-col gap-5">
            {preferencesLoading && (
              <p role="status" className="flex items-center gap-2 rounded-xl border border-[#302438] bg-[#141419] px-4 py-3 text-xs text-[#A0A0A8]">
                <Loader2 className="size-4 animate-spin text-[#B39ACF]" />
                Loading your saved preferences…
              </p>
            )}

            {profileError && (
              <p role="alert" className="rounded-xl border border-[#E58B91]/30 bg-[#2B171C] px-4 py-3 text-xs leading-5 text-[#E58B91]">
                {profileError}
              </p>
            )}

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <SelectionSummary label="Genres" count={genres.length} accent="purple" />
              <SelectionSummary label="Tags" count={tags.length} accent="cyan" />
              <SelectionSummary label="Platforms" count={platforms.length} accent="emerald" />
              <SelectionSummary label="Liked games" count={liked.length} accent="purple" />
            </div>

            {/* 1. Genres */}
            <Step number="01" title="Favorite genres" description="Choose the kinds of games you usually enjoy. These help shape genre-based recommendations." accent="purple">
              {optionsError && <p role="alert" className="mb-3 text-xs text-[#E58B91]">{optionsError}</p>}
              <SearchField id="genre-search" value={genreQuery} onChange={setGenreQuery} placeholder="Search genres: RPG, Strategy, Adventure…" label="Search genres" accent="purple" />

              <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Available genres">
                {chipGenres.map((name) => (
                  <Chip key={name} active={genres.includes(name)} accent="purple" onClick={() => toggleGenre(name)}>
                    {name}
                  </Chip>
                ))}
              </div>

              {genreQuery.trim() && visibleGenres.length === 0 && (
                <p className="mt-3 text-xs text-[#A0A0A8]">No genres found. Try another search.</p>
              )}
            </Step>

            {/* 2. Tags */}
            <Step number="02" title="Favorite tags" description="Get more specific. Tags help the recommendation system understand themes and mechanics." accent="cyan">
              <SearchField id="tag-search" value={tagQuery} onChange={setTagQuery} placeholder="Search tags: Souls-like, Roguelike, Co-op…" label="Search tags" accent="cyan" />

              <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Available tags">
                {chipTags.map((name) => (
                  <Chip key={name} active={tags.includes(name)} accent="cyan" onClick={() => toggleTag(name)}>
                    {name}
                  </Chip>
                ))}
              </div>

              {tagQuery.trim() && visibleTags.length === 0 && (
                <p className="mt-3 text-xs text-[#A0A0A8]">No tags found. Try another search.</p>
              )}
            </Step>

            {/* 3. Platforms */}
            <Step number="03" title="Preferred platforms" description="Choose the platforms you play on. Recommendations will be filtered accordingly." accent="emerald">
              <div className="flex flex-wrap gap-2" role="group" aria-label="Preferred platforms">
                {options?.platforms.map(({ value, label }) => (
                  <Chip key={value} active={platforms.includes(value)} accent="emerald" onClick={() => togglePlatform(value)}>
                    {label}
                  </Chip>
                ))}
              </div>
            </Step>

            {/* 4. Liked Games */}
            <Step number="04" title="Games you like" description="Add games you've enjoyed to power similarity recommendations." accent="purple">
              <SearchField id="liked-search" value={query} onChange={setQuery} placeholder="Search Steam: Hollow Knight, Stardew Valley…" label="Search Steam games" accent="purple" />

              {searching && (
                <p role="status" className="mt-4 flex items-center gap-2 text-xs text-[#A0A0A8]">
                  <Loader2 className="size-4 animate-spin text-[#38BDF8]" />
                  Searching Steam…
                </p>
              )}

              {searchError && <p role="alert" className="mt-3 text-xs text-[#E58B91]">{searchError}</p>}

              {results.length > 0 && (
                <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3" aria-label="Steam search results">
                  {results.slice(0, 6).map((game) => {
                    const added = likedIds.has(game.appid);
                    return (
                      <li key={game.appid}>
                        <button
                          type="button"
                          onClick={() => toggleLiked(game)}
                          aria-pressed={added}
                          className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border p-2.5 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C2ADE0] ${
                            added ? "border-[#B39ACF] bg-[#302438]/60" : "border-[#302438] bg-[#1D1D25] hover:border-[#554363]"
                          }`}
                        >
                          <Cover src={game.cover} className="h-11 w-[76px] shrink-0 rounded-lg" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-xs font-medium text-[#E6E1EA]">{game.title}</span>
                            <span className="mt-1 block text-[10px] text-[#A0A0A8]">{added ? "Already selected" : "Add to liked games"}</span>
                          </span>
                          {added ? <Check className="size-4 shrink-0 text-[#B39ACF]" /> : <Plus className="size-4 shrink-0 text-[#38BDF8]" />}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}

              {liked.length > 0 && (
                <div className="mt-6 border-t border-[#302438] pt-5">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h4 className="text-xs font-semibold text-[#E6E1EA]">Your liked games</h4>
                    <span className="text-[11px] tabular-nums text-[#B39ACF]">{liked.length}/{MAX_LIKED_GAMES}</span>
                  </div>
                  <ul className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                    {liked.map((game) => (
                      <li key={game.appid} className="group relative overflow-hidden rounded-xl border border-[#302438] bg-[#1D1D25]">
                        <Cover src={game.cover} className="h-24 w-full transition-transform duration-300 group-hover:scale-[1.02]" />
                        <div className="flex min-w-0 items-center justify-between gap-2 p-3">
                          <p className="truncate text-xs font-medium text-[#E6E1EA]">{game.title}</p>
                          <button
                            type="button"
                            onClick={() => toggleLiked(game)}
                            aria-label={`Remove ${game.title}`}
                            className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-[#302438] bg-black text-[#A0A0A8] hover:border-[#E58B91]/50 hover:text-[#E58B91]"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Step>

            {error && <p role="alert" className="rounded-xl border border-[#E58B91]/30 bg-[#2B171C] px-4 py-3 text-xs text-[#E58B91]">{error}</p>}

            <div className="flex flex-wrap items-center gap-4 border-t border-[#302438] pt-5">
              <button
                type="button"
                onClick={handleSave}
                disabled={saveDisabled}
                className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl bg-[#B39ACF] px-5 text-xs font-semibold text-[#17101F] transition-colors hover:bg-[#C2ADE0] disabled:opacity-50"
              >
                {submitting ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                {submitting ? "Saving preferences…" : "Save Preferences"}
              </button>
              <Link to={AFTER_SAVE_PATH} className="text-xs text-[#A0A0A8] transition-colors hover:text-[#C2ADE0]">
                Skip for now
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}