

import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Check,
  LayoutGrid,
  List,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  ListMusic,
  ChevronDown,
} from "lucide-react";
import { IoPencilSharp } from "react-icons/io5";
import { FaTrashAlt, FaHeart } from "react-icons/fa";
import { CiHeart } from "react-icons/ci";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion"; // or "motion/react" if on v11+
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import {
  LIST_STATUS_OPTIONS,
  getMyGameList,
  removeListEntry,
  updateListEntry,
  type ListStatus,
  type UserGameEntry,
  type UserGameListResponse,
} from "@/services/Gameservice";

import { getMyPlaylists, type Playlist } from "@/services/playlistService";
import { PlaylistCarouselCard } from "@/components/playlists/PlaylistCards";
import {
  getFavoriteGames,
  addFavoriteGame,
  removeFavoriteGame,
} from "@/services/Userservice";

type Filter = "all" | ListStatus;
type View = "rows" | "grid";
type SearchScope = "all" | "games" | "playlists";

const EMPTY_COUNTS: UserGameListResponse["counts"] = {
  all: 0,
  playing: 0,
  plan_to_play: 0,
  completed: 0,
  on_hold: 0,
  dropped: 0,
};

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  ...LIST_STATUS_OPTIONS,
];

const ROW_PAGE_SIZE = 10;
const GRID_PAGE_SIZE = 12;

const labelFor = (status: ListStatus) =>
  LIST_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status;

// Reusable filter/status chip
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
      className={`inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-xl border px-3.5 text-xs transition-colors ${
        active
          ? "border-[#B39ACF] bg-[#B39ACF] font-bold text-[#17191E]"
          : "border-[#29232F] bg-[#111114] text-[#B39ACF] hover:border-[#554363] hover:bg-[#20232B]"
      }`}
    >
      {active && (
        <Check className="size-3.5" strokeWidth={1.7} aria-hidden="true" />
      )}
      {children}
    </button>
  );
}

// Reusable game cover
function Cover({
  entry,
  className,
}: {
  entry: UserGameEntry;
  className: string;
}) {
  return entry.cover_image_url ? (
    <img
      src={entry.cover_image_url}
      alt={entry.title || "Game cover"}
      loading="lazy"
      className={`${className} object-cover contrast-110 saturate-125`}
    />
  ) : (
    <div className={`${className} bg-[#111114]`} />
  );
}

// Reusable favorite, edit, and delete buttons
function GameActions({
  entry,
  compact = false,
  onFavorite,
  onEdit,
  onDelete,
}: {
  entry: UserGameEntry;
  compact?: boolean;
  onFavorite: (entry: UserGameEntry) => void;
  onEdit: (entry: UserGameEntry) => void;
  onDelete: (entry: UserGameEntry) => void;
}) {
  const size = compact ? "size-8" : "size-9";
  const iconSize = compact ? "size-3.5" : "size-4";

  const buttonClass = `${size} flex cursor-pointer items-center justify-center rounded-xl border border-[#29232F] bg-black text-[#E6E1EA] transition-colors hover:border-[#554363] hover:bg-[#20232B]`;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onFavorite(entry)}
        aria-label={`Favorite ${entry.title}`}
        className={buttonClass}
      >
        {entry.is_favorite ? (
          <FaHeart className={`${iconSize} text-[#E58B91]`} />
        ) : (
          <CiHeart className={`${compact ? "size-4" : "size-5"} text-[#A0A0A8]`} />
        )}
      </button>

      <button
        type="button"
        onClick={() => onEdit(entry)}
        aria-label={`Edit ${entry.title}`}
        className={buttonClass}
      >
        <IoPencilSharp className={`${iconSize} text-[#B39ACF]`} />
      </button>

      <button
        type="button"
        onClick={() => onDelete(entry)}
        aria-label={`Remove ${entry.title}`}
        className={`${buttonClass} hover:border-[#E58B91]/50 hover:bg-[#2B171C]`}
      >
        <FaTrashAlt className={`${iconSize} text-[#E58B91]`} />
      </button>
    </div>
  );
}

// Search the text fields returned with a playlist without depending on one
// particular backend naming convention (title/name/description, etc.).
function playlistMatchesSearch(playlist: Playlist, query: string) {
  if (!query) return true;

  const searchableValues = Object.values(
    playlist as unknown as Record<string, unknown>
  );

  return searchableValues.some((value) => {
    if (typeof value === "string" || typeof value === "number") {
      return String(value).toLowerCase().includes(query);
    }

    if (Array.isArray(value)) {
      return value.some(
        (item) =>
          typeof item === "string" && item.toLowerCase().includes(query)
      );
    }

    return false;
  });
}

export default function MyLibrary() {
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [searchScope, setSearchScope] = useState<SearchScope>("all");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [view, setView] = useState<View>("rows");
  const [page, setPage] = useState(1);

  const [entries, setEntries] = useState<UserGameEntry[]>([]);
  const [counts, setCounts] = useState(EMPTY_COUNTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [editing, setEditing] = useState<UserGameEntry | null>(null);
  const [draftStatus, setDraftStatus] = useState<ListStatus>("plan_to_play");
  const [saving, setSaving] = useState(false);
  const editRef = useRef<HTMLElement>(null);

  const [deleteTarget, setDeleteTarget] = useState<UserGameEntry | null>(null);

  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [playlistsLoading, setPlaylistsLoading] = useState(true);

  const playlistCarouselRef = useRef<HTMLDivElement>(null);

  const pageSize = view === "rows" ? ROW_PAGE_SIZE : GRID_PAGE_SIZE;
  const filteredPlaylists = playlists.filter((playlist) =>
    playlistMatchesSearch(playlist, debouncedSearch.toLowerCase())
  );

  const totalPages = Math.ceil(entries.length / pageSize) || 1;
  const paginatedEntries = entries.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const scrollPlaylistCarousel = (dir: 1 | -1) =>
    playlistCarouselRef.current?.scrollBy({
      left: dir * 380,
      behavior: "smooth",
    });

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // Reset pagination when filters or view change
  useEffect(() => {
    setPage(1);
  }, [filter, view]);

  // Load library, playlists, and favorites
  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    Promise.all([
      getMyGameList({ status: filter, search: debouncedSearch }),
      getMyPlaylists().catch(() => ({
        count: 0,
        results: [] as Playlist[],
      })),
      getFavoriteGames(),
    ])
      .then(([listData, playlistData, favoriteData]) => {
        if (cancelled) return;

        const favoriteAppIds = new Set(
          favoriteData.map((fav) => fav.steam_app_id).filter(Boolean)
        );

        setEntries(
          listData.results.map((entry) => ({
            ...entry,
            is_favorite: entry.steam_app_id
              ? favoriteAppIds.has(entry.steam_app_id)
              : false,
          }))
        );

        setCounts(listData.counts);
        setPlaylists(playlistData.results || []);
      })
      .catch((err) => {
        if (cancelled) return;

        setError(
          err?.response?.status === 401
            ? "Please log in to see your list."
            : "Failed to load your list. Please try again."
        );
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          setPlaylistsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [filter, debouncedSearch, reloadKey]);

  // Scroll to the edit panel when opened
  useEffect(() => {
    if (editing) {
      editRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [editing?.id]);

  function openEdit(entry: UserGameEntry) {
    setEditing(entry);
    setDraftStatus(entry.status);
  }

  async function toggleFavorite(entry: UserGameEntry) {
    if (!entry.steam_app_id) {
      toast.error("This game cannot be favorited.");
      return;
    }

    const newFavState = !entry.is_favorite;

    try {
      if (newFavState) {
        await addFavoriteGame(entry.steam_app_id);
        toast.success(`Added ${entry.title} to your favorite games!`);
      } else {
        await removeFavoriteGame(entry.steam_app_id);
        toast.success(`Removed ${entry.title} from your favorites.`);
      }

      setEntries((prev) =>
        prev.map((item) =>
          item.id === entry.id
            ? { ...item, is_favorite: newFavState }
            : item
        )
      );
    } catch {
      toast.error("Couldn't update favorite state. Please try again.");
    }
  }

  async function saveStatus() {
    if (!editing) return;

    setSaving(true);

    try {
      await updateListEntry(editing.id, { status: draftStatus });

      toast.success(
        `${editing.title} is now “${labelFor(draftStatus)}”`
      );

      setEditing(null);
      setReloadKey((key) => key + 1);
    } catch {
      toast.error("Couldn’t save the new status. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;

    setSaving(true);

    try {
      await removeListEntry(deleteTarget.id);

      toast.success(`Removed ${deleteTarget.title} from your list`);

      setDeleteTarget(null);
      setReloadKey((key) => key + 1);
    } catch {
      toast.error("Couldn’t remove this game. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const gameHref = (entry: UserGameEntry) =>
    entry.steam_app_id ? `/gamedetails/${entry.steam_app_id}` : "#";

 return (
    <div className="min-h-screen w-full bg-black">
      <div
        className="flex min-h-screen w-full flex-col bg-black text-[#E6E1EA] antialiased"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <Navbar />

        <main className="flex flex-1 flex-col gap-8 px-5 pb-16 pt-11 md:px-8 xl:px-16">
          {/* Header */}
          <div className="flex min-h-[65px] flex-wrap items-center justify-between gap-4">
            <div className="flex flex-col gap-2">
              <p className="text-[13px] leading-4 tracking-wider text-[#B39ACF] uppercase">
                UNE COLLECTION DE SOUVENIRS
              </p>

              <h1 className="text-[36px] font-semibold leading-[41px] tracking-[-0.8px] text-[#E6E1EA]">
                My Library
              </h1>
            </div>
          </div>

          {/* Search and filters */}
          <div className="flex flex-col gap-5">
            {/* Top Row: Search Input + View Toggle */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="list-search"
                className="text-xs font-semibold text-[#E6E1EA]"
              >
                Search your library
              </label>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative w-full max-w-[420px]">
                  <input
                    id="list-search"
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search games and playlists…"
                    className="h-10 w-full rounded-xl border border-[#29232F] bg-black pl-3.5 pr-10 text-xs text-[#E6E1EA] outline-none placeholder:text-[#A0A0A8] transition-colors hover:border-[#554363] focus:border-[#B39ACF] focus:ring-1 focus:ring-[#B39ACF]/20"
                  />

                  <Search
                    className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-[#B39ACF]"
                    strokeWidth={1.7}
                    aria-hidden="true"
                  />
                </div>

                {/* Compact Segmented View Toggle with sliding pill */}
                <AnimatePresence>
                  {searchScope !== "playlists" && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.18 }}
                      className="flex items-center rounded-xl border border-[#29232F] bg-[#111114] p-1"
                      role="group"
                      aria-label="View"
                    >
                      {(
                        [
                          { value: "rows", label: "Rows", icon: List },
                          { value: "grid", label: "Grid", icon: LayoutGrid },
                        ] as const
                      ).map(({ value, label, icon: Icon }) => {
                        const isActive = view === value;
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setView(value)}
                            aria-pressed={isActive}
                            aria-label={`${label} view`}
                            title={`${label} view`}
                            className={`relative flex h-7 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 text-xs transition-colors ${
                              isActive
                                ? "font-bold text-[#17191E]"
                                : "text-[#B39ACF] hover:text-[#E6E1EA]"
                            }`}
                          >
                            {isActive && (
                              <motion.span
                                layoutId="view-toggle-pill"
                                transition={{
                                  type: "spring",
                                  stiffness: 450,
                                  damping: 32,
                                }}
                                className="absolute inset-0 rounded-lg bg-[#B39ACF]"
                              />
                            )}
                            <Icon
                              className="relative z-10 size-3.5"
                              strokeWidth={1.8}
                              aria-hidden="true"
                            />
                            <span className="relative z-10 hidden sm:inline">
                              {label}
                            </span>
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Bottom Row: Underline Tabs + Status Dropdown */}
            <div className="flex min-h-[42px] flex-wrap items-center justify-between gap-4 border-b border-[#29232F]">
              {/* Search category tabs with sliding underline */}
              <div
                className="flex gap-6"
                role="group"
                aria-label="Search category"
              >
                {(
                  [
                    { value: "all", label: "All" },
                    { value: "games", label: "Games" },
                    { value: "playlists", label: "Playlists" },
                  ] as const
                ).map(({ value, label }) => {
                  const isActive = searchScope === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        setSearchScope(value);
                        setPage(1);
                      }}
                      aria-pressed={isActive}
                      className={`relative cursor-pointer pb-3 text-xs font-semibold transition-colors ${
                        isActive
                          ? "text-[#B39ACF]"
                          : "text-[#A0A0A8] hover:text-[#E6E1EA]"
                      }`}
                    >
                      {label}
                      {isActive && (
                        <motion.span
                          layoutId="library-category-underline"
                          transition={{
                            type: "spring",
                            stiffness: 450,
                            damping: 32,
                          }}
                          className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-[#B39ACF]"
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Status dropdown */}
              <AnimatePresence>
                {searchScope !== "playlists" && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.18 }}
                    className="relative pb-2"
                  >
                    <select
                      aria-label="Filter by status"
                      value={filter}
                      onChange={(event) =>
                        setFilter(event.target.value as typeof filter)
                      }
                      className="h-8 cursor-pointer appearance-none rounded-lg border border-[#29232F] bg-[#111114] pl-3 pr-8 text-xs font-medium text-[#E6E1EA] outline-none transition-colors hover:border-[#554363] focus:border-[#B39ACF]"
                    >
                      {FILTERS.map(({ value, label }) => (
                        <option
                          key={value}
                          value={value}
                          className="bg-[#111114] text-[#E6E1EA]"
                        >
                          Status: {label} ({counts[value]})
                        </option>
                      ))}
                    </select>

                    <ChevronDown
                      className="pointer-events-none absolute right-2.5 top-[calc(50%-4px)] size-3.5 -translate-y-1/2 text-[#B39ACF]"
                      strokeWidth={1.8}
                      aria-hidden="true"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Content Sections */}
          <AnimatePresence mode="wait">
            {/* Games */}
            {searchScope !== "playlists" && (
              <motion.div
                key="games-section"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
                <Card className="min-h-[420px] gap-0 rounded-2xl border border-[#29232F] bg-[#111114] py-0 text-[#E6E1EA] shadow-none">
                  <CardContent className="flex flex-1 flex-col p-6">
                    <AnimatePresence mode="wait">
                      {error && (
                        <motion.p
                          key="error-state"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          role="alert"
                          className="my-auto py-10 text-center text-sm text-[#E58B91]"
                        >
                          {error}
                        </motion.p>
                      )}

                      {!error && loading && entries.length === 0 && (
                        <motion.p
                          key="loading-state"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          role="status"
                          className="my-auto py-10 text-center text-sm text-[#A0A0A8]"
                        >
                          Loading your list…
                        </motion.p>
                      )}

                      {!error && !loading && entries.length === 0 && (
                        <motion.div
                          key={`empty-${filter}-${search}`}
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          transition={{ duration: 0.2 }}
                          className="my-auto flex flex-col items-center gap-4 py-10 text-center"
                        >
                          <p className="text-sm text-[#A0A0A8]">
                            {counts.all === 0
                              ? "Your list is empty. Find a game you like and add it."
                              : "No games match your search or filter."}
                          </p>

                          {counts.all === 0 && (
                            <Button
                              asChild
                              className="h-10 rounded-xl bg-[#B39ACF] px-5 text-sm font-semibold text-[#17191E] shadow-none hover:bg-[#C2ADE0]"
                            >
                              <Link to="/home">Browse games</Link>
                            </Button>
                          )}
                        </motion.div>
                      )}

                      {/* Row view */}
                      {!error && entries.length > 0 && view === "rows" && (
                        <motion.div
                          key={`rows-${filter}-${page}`}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          className="flex flex-col"
                        >
                          <div className="hidden grid-cols-[minmax(0,2.2fr)_1fr_auto] gap-4 pb-4 text-[10px] uppercase tracking-wide text-[#A0A0A8] md:grid">
                            <span>Game</span>
                            <span>Status</span>
                            <span className="w-[124px] text-center">
                              Actions
                            </span>
                          </div>

                          <ul>
                            {paginatedEntries.map((entry) => {
                              const isEditing = editing?.id === entry.id;

                              return (
                                <motion.li
                                  layout
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  transition={{ duration: 0.18 }}
                                  key={entry.id}
                                  className="grid grid-cols-1 items-center gap-3 border-t border-[#29232F] py-4 md:grid-cols-[minmax(0,2.2fr)_1fr_auto] md:gap-4"
                                >
                                  <Link
                                    to={gameHref(entry)}
                                    className="group flex min-w-0 items-center gap-4"
                                  >
                                    <Cover
                                      entry={entry}
                                      className="h-[44px] w-[80px] shrink-0 rounded-lg"
                                    />

                                    <span className="flex min-w-0 flex-col gap-1">
                                      <span className="truncate text-sm font-semibold group-hover:text-[#B39ACF]">
                                        {entry.title}
                                      </span>

                                      <span className="truncate text-[10px] text-[#A0A0A8]">
                                        {entry.genres.join(" / ") || "—"}
                                      </span>
                                    </span>
                                  </Link>

                                  <div>
                                    <span
                                      className={`inline-flex h-8 items-center gap-1.5 rounded-xl border px-3.5 text-xs transition-colors ${
                                        isEditing
                                          ? "border-[#B39ACF] bg-[#B39ACF] font-bold text-[#17191E]"
                                          : "border-[#29232F] bg-[#111114] text-[#B39ACF]"
                                      }`}
                                    >
                                      {isEditing && (
                                        <Check
                                          className="size-3.5"
                                          strokeWidth={1.7}
                                          aria-hidden="true"
                                        />
                                      )}

                                      {labelFor(entry.status)}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2 md:w-[124px]">
                                    <GameActions
                                      entry={entry}
                                      onFavorite={toggleFavorite}
                                      onEdit={openEdit}
                                      onDelete={setDeleteTarget}
                                    />
                                  </div>
                                </motion.li>
                              );
                            })}
                          </ul>
                        </motion.div>
                      )}

                      {/* Grid view */}
                      {!error && entries.length > 0 && view === "grid" && (
                        <motion.ul
                          key={`grid-${filter}-${page}`}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
                        >
                          {paginatedEntries.map((entry) => (
                            <motion.li
                              layout
                              initial={{ opacity: 0, scale: 0.97 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.97 }}
                              transition={{ duration: 0.18 }}
                              key={entry.id}
                              className="flex flex-col overflow-hidden rounded-2xl border border-[#29232F] bg-[#111114] transition-colors hover:border-[#554363]"
                            >
                              <Link to={gameHref(entry)}>
                                <Cover
                                  entry={entry}
                                  className="aspect-[3/2] w-full"
                                />
                              </Link>

                              <div className="flex flex-1 flex-col gap-3 p-4">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-[#E6E1EA]">
                                    {entry.title}
                                  </p>

                                  <p className="truncate text-[10px] text-[#A0A0A8]">
                                    {entry.genres.join(" / ") || "—"}
                                  </p>
                                </div>

                                <div className="mt-auto flex items-center justify-between gap-2">
                                  <span className="rounded-xl border border-[#29232F] bg-black px-3 py-1 text-xs text-[#B39ACF]">
                                    {labelFor(entry.status)}
                                  </span>

                                  <GameActions
                                    entry={entry}
                                    compact
                                    onFavorite={toggleFavorite}
                                    onEdit={openEdit}
                                    onDelete={setDeleteTarget}
                                  />
                                </div>
                              </div>
                            </motion.li>
                          ))}
                        </motion.ul>
                      )}
                    </AnimatePresence>

                    {/* Pagination */}
                    {!error && entries.length > 0 && (
                      <div className="mt-auto pt-6">
                        <div className="flex flex-wrap items-center justify-between border-t border-[#29232F] pt-4 text-xs text-[#A0A0A8]">
                          <span>
                            Showing {(page - 1) * pageSize + 1}–
                            {Math.min(page * pageSize, entries.length)} of{" "}
                            {entries.length} games
                          </span>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={page === 1}
                              onClick={() =>
                                setPage((p) => Math.max(p - 1, 1))
                              }
                              className="h-8 border-[#29232F] bg-black text-[#E6E1EA] hover:border-[#554363] hover:bg-[#20232B]"
                            >
                              <ChevronLeft className="size-4" />
                              Previous
                            </Button>

                            <span className="px-2 text-[#E6E1EA]">
                              Page {page} of {totalPages}
                            </span>

                            <Button
                              variant="outline"
                              size="sm"
                              disabled={page >= totalPages}
                              onClick={() =>
                                setPage((p) => Math.min(p + 1, totalPages))
                              }
                              className="h-8 border-[#29232F] bg-black text-[#E6E1EA] hover:border-[#554363] hover:bg-[#20232B]"
                            >
                              Next
                              <ChevronRight className="size-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Edit panel */}
          <AnimatePresence>
            {editing && (
              <motion.section
                ref={editRef}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.2 }}
                aria-labelledby="edit-title"
                className="rounded-2xl border border-[#29232F] bg-[#111114] p-6 text-[#E6E1EA]"
              >
                <div className="flex items-start justify-between gap-4">
                  <h2
                    id="edit-title"
                    className="text-[18px] font-semibold leading-6 text-[#E6E1EA]"
                  >
                    Edit {editing.title}
                  </h2>

                  <button
                    type="button"
                    onClick={() => setEditing(null)}
                    className="inline-flex cursor-pointer items-center gap-1 text-xs text-[#A0A0A8] hover:text-[#E6E1EA]"
                  >
                    Close
                    <X
                      className="size-3.5"
                      strokeWidth={1.7}
                      aria-hidden="true"
                    />
                  </button>
                </div>

                <div
                  className="mt-5 flex flex-wrap gap-2"
                  role="group"
                  aria-label="Status"
                >
                  {LIST_STATUS_OPTIONS.map(({ value, label }) => (
                    <Chip
                      key={value}
                      active={draftStatus === value}
                      onClick={() => setDraftStatus(value)}
                    >
                      {label}
                    </Chip>
                  ))}
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                  <Button
                    type="button"
                    onClick={saveStatus}
                    disabled={saving || draftStatus === editing.status}
                    className="h-10 rounded-xl bg-[#B39ACF] px-5 text-[13px] font-semibold text-[#17191E] shadow-none hover:bg-[#C2ADE0] disabled:opacity-40"
                  >
                    {saving ? "Saving…" : "Save status"}
                  </Button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditing(null);
                      setDeleteTarget(editing);
                    }}
                    disabled={saving}
                    className="cursor-pointer text-xs text-[#E58B91] hover:underline"
                  >
                    Remove from list
                  </button>
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* My Playlists */}
          <AnimatePresence>
            {searchScope !== "games" && (
              <motion.section
                key="playlists-section"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                id="my-playlists"
                aria-labelledby="my-playlists-title"
                className="flex min-h-[260px] flex-col gap-5"
              >
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2
                      id="my-playlists-title"
                      className="text-[24px] font-semibold leading-[29px] tracking-[-0.5px] text-[#E6E1EA]"
                    >
                      My Playlists
                    </h2>

                    <p className="mt-1 text-[13px] leading-4 text-[#A0A0A8]">
                      Manage your personal collections and custom playlists
                    </p>

                    <Link
                      to="/playlists"
                      className="text-[13px] text-[#B39ACF] hover:underline"
                    >
                      View more →
                    </Link>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to="/playlists/new"
                      className="mr-2 rounded-xl bg-[#B39ACF] px-4 py-2.5 text-[13px] font-semibold text-[#17191E] hover:bg-[#C2ADE0]"
                    >
                      Create playlist
                    </Link>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => scrollPlaylistCarousel(-1)}
                      aria-label="Scroll left"
                      className="size-8 rounded-xl border-[#29232F] bg-[#111114] text-[#E6E1EA] hover:border-[#554363] hover:bg-[#20232B]"
                    >
                      <ChevronLeft className="size-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => scrollPlaylistCarousel(1)}
                      aria-label="Scroll right"
                      className="size-8 rounded-xl border-[#29232F] bg-[#111114] text-[#E6E1EA] hover:border-[#554363] hover:bg-[#20232B]"
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>

                {playlistsLoading && (
                  <p role="status" className="text-sm text-[#A0A0A8]">
                    Loading your playlists…
                  </p>
                )}

                {!playlistsLoading && filteredPlaylists.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-[#29232F] bg-[#111114] px-6 py-10 text-center">
                    <ListMusic
                      className="mx-auto size-8 text-[#A0A0A8]"
                      strokeWidth={1.5}
                    />

                    <p className="mt-3 text-sm text-[#A0A0A8]">
                      {debouncedSearch
                        ? "No playlists match your search."
                        : "You haven't created any playlists yet."}
                    </p>
                  </div>
                )}

                {!playlistsLoading && filteredPlaylists.length > 0 && (
                  <div
                    ref={playlistCarouselRef}
                    className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  >
                    {filteredPlaylists.map((playlist) => (
                      <PlaylistCarouselCard
                        key={playlist.id}
                        playlist={playlist}
                      />
                    ))}
                  </div>
                )}
              </motion.section>
            )}
          </AnimatePresence>
        </main>

        <Footer />
      </div>

      {/* Delete confirmation */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="w-full max-w-md rounded-2xl border border-[#29232F] bg-[#111114] p-6 text-[#E6E1EA] shadow-2xl"
            >
              <h3 className="text-lg font-semibold text-[#E6E1EA]">
                Remove Game
              </h3>

              <p className="mt-2 text-sm text-[#A0A0A8]">
                Are you sure you want to remove{" "}
                <span className="font-medium text-[#E6E1EA]">
                  {deleteTarget.title}
                </span>{" "}
                from your library?
              </p>

              <div className="mt-6 flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setDeleteTarget(null)}
                  className="border-[#29232F] bg-transparent text-[#E6E1EA] hover:bg-[#20232B]"
                >
                  Cancel
                </Button>

                <Button
                  onClick={confirmDelete}
                  disabled={saving}
                  className="bg-[#E58B91] text-[#17191E] hover:bg-[#eb9d8f]"
                >
                  {saving ? "Removing…" : "Remove"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );


}
