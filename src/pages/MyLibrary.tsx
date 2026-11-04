import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Check, LayoutGrid, List, Search, X, ChevronLeft, ChevronRight, ListMusic, Star } from "lucide-react";
import { IoPencilSharp } from "react-icons/io5";
import { FaTrashAlt, FaHeart } from "react-icons/fa";
import { CiHeart } from "react-icons/ci";
import { toast } from "sonner";
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
import { getMyPlaylists, type Playlist} from "@/services/playlistService";
import { PlaylistCarouselCard } from "@/components/playlists/PlaylistCards";
import { getFavoriteGames, addFavoriteGame, removeFavoriteGame } from "@/services/Userservice";

type Filter = "all" | ListStatus;
type View = "rows" | "grid";

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

const PAGE_SIZE = 10;

const labelFor = (status: ListStatus) =>
  LIST_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status;

function Chip({
  active,
  onClick,
  children,
  className = "",
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-xl border px-3.5 text-xs transition-colors ${
        active
          ? "border-[#B39ACF] bg-[#B39ACF] font-bold text-[#17191E]"
          : "border-[#302438] bg-[#17191E] text-[#B39ACF] hover:border-[#554363] hover:bg-[#20232B]"
      } ${className}`}
    >
      {active && <Check className="size-3.5" strokeWidth={1.7} aria-hidden="true" />}
      {children}
    </button>
  );
}

function Cover({ entry, className }: { entry: UserGameEntry; className: string }) {
  return entry.cover_image_url ? (
    <img
      src={entry.cover_image_url}
      alt={entry.title || "Game cover"}
      loading="lazy"
      className={`${className} object-cover contrast-110 saturate-125`}
    />
  ) : (
    <div className={`${className} bg-[#17191E]`} />
  );
}

export default function MyLibrary() {
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
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

  // Carousel ref for My Playlists
  const playlistCarouselRef = useRef<HTMLDivElement>(null);
  const scrollPlaylistCarousel = (dir: 1 | -1) =>
    playlistCarouselRef.current?.scrollBy({ left: dir * 380, behavior: "smooth" });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [filter]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      getMyGameList({ status: filter, search: debouncedSearch }),
      getMyPlaylists().catch(() => ({ count: 0, results: [] as Playlist[] })),
      getFavoriteGames(),
    ])
      .then(([listData, playlistData, favoriteData]) => {
        if (cancelled) return;

        const favoriteAppIds = new Set(
          favoriteData.map((fav) => fav.steam_app_id).filter(Boolean)
        );

        const enrichedEntries = listData.results.map((entry) => ({
          ...entry,
          is_favorite: entry.steam_app_id ? favoriteAppIds.has(entry.steam_app_id) : false,
        }));

        setEntries(enrichedEntries);
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

  const totalPages = Math.ceil(entries.length / PAGE_SIZE) || 1;
  const paginatedEntries = entries.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    if (editing) {
      editRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
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
          item.id === entry.id ? { ...item, is_favorite: newFavState } : item
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
      toast.success(`${editing.title} is now “${labelFor(draftStatus)}”`);
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

  const scoreText = (entry: UserGameEntry) =>
    entry.score ? `${entry.score} / 10` : "—";

  return (
    <div className="min-h-screen w-full bg-[#000000]">
      <div
        className="flex min-h-screen w-full flex-col bg-[#000000] text-[#E6E1EA] antialiased"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <Navbar />

        <main className="flex flex-1 flex-col gap-8 px-5 pb-16 pt-11 md:px-8 xl:px-16">
          {/* Header section matching Home precisely */}
          <div className="flex min-h-[65px] flex-wrap items-center justify-between gap-4">
            <div className="flex flex-col gap-2">
          <div className="flex min-h-[65px] flex-wrap items-center justify-between gap-4">
            <div className="flex flex-col gap-2">
              <p className="text-[13px] leading-4 text-[#B39ACF] uppercase tracking-wider">
                UNE COLLECTION DE SOUVENIRS
              </p>
              <h1 className="text-[36px] font-semibold leading-[41px] tracking-[-0.8px] text-[#E6E1EA]">
                My Library
              </h1>
            </div>
          </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label htmlFor="list-search" className="text-xs font-semibold text-[#E6E1EA]">
                Search your library
              </label>

              <div className="relative w-full max-w-[360px]">
                <input
                  id="list-search"
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search saved games…"
                  className="h-10 w-full rounded-xl border border-[#302438] bg-[#000000] pl-3.5 pr-10 text-xs text-[#E6E1EA] outline-none placeholder:text-[#A0A0A8] transition-colors hover:border-[#554363] focus:border-[#B39ACF] focus:ring-1 focus:ring-[#B39ACF]/20"
                />
                <Search
                  className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-[#B39ACF]"
                  strokeWidth={1.7}
                  aria-hidden="true"
                />
              </div>
            </div>

            <div className="flex w-fit gap-2" role="group" aria-label="View">
              {(
                [
                  { value: "rows", label: "Rows", icon: List },
                  { value: "grid", label: "Grid", icon: LayoutGrid },
                ] as const
              ).map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setView(value)}
                  aria-pressed={view === value}
                  className={`flex h-12 w-14 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border text-[10px] transition-colors ${
                    view === value
                      ? "border-[#B39ACF] bg-[#B39ACF] font-bold text-[#17191E]"
                      : "border-[#302438] bg-[#17191E] text-[#B39ACF] hover:border-[#554363] hover:bg-[#20232B]"
                  }`}
                >
                  <Icon className="size-4" strokeWidth={1.7} aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
              {FILTERS.map(({ value, label }) => (
                <Chip
                  key={value}
                  active={filter === value}
                  onClick={() => setFilter(value)}
                >
                  {label} ({counts[value]})
                </Chip>
              ))}
            </div>
          </div>

          {/* List */}
          <Card className="gap-0 rounded-2xl border border-[#302438] bg-[#17191E] py-0 text-[#E6E1EA] shadow-none">
            <CardContent className="flex flex-col p-6">
              {error && (
                <p role="alert" className="py-10 text-center text-sm text-[#E58B91]">
                  {error}
                </p>
              )}

              {!error && loading && entries.length === 0 && (
                <p role="status" className="py-10 text-center text-sm text-[#A0A0A8]">
                  Loading your list…
                </p>
              )}

              {!error && !loading && entries.length === 0 && (
                <div className="flex flex-col items-center gap-4 py-10 text-center">
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
                </div>
              )}

              {!error && entries.length > 0 && view === "rows" && (
                <div className="flex flex-col">
                  <div className="hidden grid-cols-[minmax(0,2.2fr)_1fr_1fr_auto] gap-4 pb-4 text-[10px] uppercase tracking-wide text-[#A0A0A8] md:grid">
                    <span>Game</span>
                    <span>Status</span>
                    <span>Your score</span>
                    <span className="w-[124px] text-center">Actions</span>
                  </div>

                  <ul>
                    {paginatedEntries.map((entry) => {
                      const isEditing = editing?.id === entry.id;
                      return (
                        <li
                          key={entry.id}
                          className="grid grid-cols-1 items-center gap-3 border-t border-[#302438] py-4 md:grid-cols-[minmax(0,2.2fr)_1fr_1fr_auto] md:gap-4"
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
                              className={`inline-flex h-8 items-center gap-1.5 rounded-xl border px-3.5 text-xs ${
                                isEditing
                                  ? "border-[#B39ACF] bg-[#B39ACF] font-bold text-[#17191E]"
                                  : "border-[#302438] bg-[#17191E] text-[#B39ACF]"
                              }`}
                            >
                              {isEditing && (
                                <Check className="size-3.5" strokeWidth={1.7} aria-hidden="true" />
                              )}
                              {labelFor(entry.status)}
                            </span>
                          </div>

                          <p className="text-xs text-[#E6E1EA]">{scoreText(entry)}</p>

                          <div className="flex items-center gap-2 md:w-[124px]">
                            <button
                              type="button"
                              onClick={() => toggleFavorite(entry)}
                              aria-label={`Favorite ${entry.title}`}
                              className="flex size-9 cursor-pointer items-center justify-center rounded-xl border border-[#302438] bg-[#000000] text-[#E6E1EA] hover:border-[#554363] hover:bg-[#20232B] transition-colors"
                            >
                              {entry.is_favorite ? (
                                <FaHeart className="size-4 text-[#E58B91]" />
                              ) : (
                                <CiHeart className="size-5 text-[#A0A0A8]" />
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => openEdit(entry)}
                              aria-label={`Edit ${entry.title}`}
                              className="flex size-9 cursor-pointer items-center justify-center rounded-xl border border-[#302438] bg-[#000000] text-[#E6E1EA] hover:border-[#554363] hover:bg-[#20232B] transition-colors"
                            >
                              <IoPencilSharp className="size-4 text-[#B39ACF]" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeleteTarget(entry)}
                              aria-label={`Remove ${entry.title}`}
                              className="flex size-9 cursor-pointer items-center justify-center rounded-xl border border-[#302438] bg-[#000000] text-[#E6E1EA] hover:border-[#E58B91]/50 hover:bg-[#2B171C] transition-colors"
                            >
                              <FaTrashAlt className="size-4 text-[#E58B91]" />
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {!error && entries.length > 0 && view === "grid" && (
                <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {paginatedEntries.map((entry) => (
                    <li
                      key={entry.id}
                      className="flex flex-col overflow-hidden rounded-2xl border border-[#302438] bg-[#17191E]"
                    >
                      <Link to={gameHref(entry)}>
                        <Cover entry={entry} className="aspect-[3/2] w-full" />
                      </Link>
                      <div className="flex flex-1 flex-col gap-3 p-4">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#E6E1EA]">{entry.title}</p>
                          <p className="truncate text-[10px] text-[#A0A0A8]">
                            {entry.genres.join(" / ") || "—"}
                          </p>
                        </div>
                        <div className="mt-auto flex items-center justify-between gap-2">
                          <span className="rounded-xl border border-[#302438] bg-[#000000] px-3 py-1 text-xs text-[#B39ACF]">
                            {labelFor(entry.status)}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => toggleFavorite(entry)}
                              aria-label={`Favorite ${entry.title}`}
                              className="flex size-8 cursor-pointer items-center justify-center rounded-xl border border-[#302438] bg-[#000000] text-[#E6E1EA] hover:border-[#554363] hover:bg-[#20232B] transition-colors"
                            >
                              {entry.is_favorite ? (
                                <FaHeart className="size-3.5 text-[#E58B91]" />
                              ) : (
                                <CiHeart className="size-4 text-[#A0A0A8]" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => openEdit(entry)}
                              aria-label={`Edit ${entry.title}`}
                              className="flex size-8 cursor-pointer items-center justify-center rounded-xl border border-[#302438] bg-[#000000] text-[#E6E1EA] hover:border-[#554363] hover:bg-[#20232B] transition-colors"
                            >
                              <IoPencilSharp className="size-3.5 text-[#B39ACF]" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(entry)}
                              aria-label={`Remove ${entry.title}`}
                              className="flex size-8 cursor-pointer items-center justify-center rounded-xl border border-[#302438] bg-[#000000] text-[#E6E1EA] hover:border-[#E58B91]/50 hover:bg-[#2B171C] transition-colors"
                            >
                              <FaTrashAlt className="size-3.5 text-[#E58B91]" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {/* Pagination Controls Footer */}
              {!error && entries.length > 0 && (
                <div className="mt-6 flex flex-wrap items-center justify-between border-t border-[#302438] pt-4 text-xs text-[#A0A0A8]">
                  <span>
                    Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, entries.length)} of {entries.length} games
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage((p) => Math.max(p - 1, 1))}
                      className="h-8 border-[#302438] bg-[#000000] text-[#E6E1EA] hover:border-[#554363] hover:bg-[#20232B]"
                    >
                      <ChevronLeft className="size-4" /> Previous
                    </Button>
                    <span className="px-2 text-[#E6E1EA]">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                      className="h-8 border-[#302438] bg-[#000000] text-[#E6E1EA] hover:border-[#554363] hover:bg-[#20232B]"
                    >
                      Next <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Edit panel */}
          {editing && (
            <section
              ref={editRef}
              aria-labelledby="edit-title"
              className="rounded-2xl border border-[#302438] bg-[#17191E] p-6 text-[#E6E1EA]"
            >
              <div className="flex items-start justify-between gap-4">
                <h2 id="edit-title" className="text-[18px] font-semibold leading-6 text-[#E6E1EA]">
                  Edit {editing.title}
                </h2>

                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="inline-flex cursor-pointer items-center gap-1 text-xs text-[#A0A0A8] hover:text-[#E6E1EA]"
                >
                  Close
                  <X className="size-3.5" strokeWidth={1.7} aria-hidden="true" />
                </button>
              </div>

              <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Status">
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
            </section>
          )}

          {/* My Playlists Carousel Section */}
          <section id="my-playlists" aria-labelledby="my-playlists-title" className="flex flex-col gap-5">
            <div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 id="my-playlists-title" className="text-[24px] font-semibold leading-[29px] tracking-[-0.5px] text-[#E6E1EA]">
                    My Playlists
                  </h2>
                  <p className="mt-1 text-[13px] leading-4 text-[#A0A0A8]">Manage your personal collections and custom playlists</p>
                  <Link to="/playlists" className="text-[13px] text-[#B39ACF] hover:underline">
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
                    className="size-8 rounded-xl border-[#302438] bg-[#17191E] text-[#E6E1EA] hover:border-[#554363] hover:bg-[#20232B]"
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => scrollPlaylistCarousel(1)}
                    aria-label="Scroll right"
                    className="size-8 rounded-xl border-[#302438] bg-[#17191E] text-[#E6E1EA] hover:border-[#554363] hover:bg-[#20232B]"
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            </div>

            {playlistsLoading && <p role="status" className="text-sm text-[#A0A0A8]">Loading your playlists…</p>}

            {!playlistsLoading && playlists.length === 0 && (
              <div className="rounded-2xl border border-dashed border-[#302438] bg-[#17191E] px-6 py-10 text-center">
                <ListMusic className="mx-auto size-8 text-[#A0A0A8]" strokeWidth={1.5} />
                <p className="mt-3 text-sm text-[#A0A0A8]">You haven't created any playlists yet.</p>
              </div>
            )}

            {!playlistsLoading && playlists.length > 0 && (
              <div
                ref={playlistCarouselRef}
                className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {playlists.map((playlist) => (
                  <PlaylistCarouselCard key={playlist.id} playlist={playlist} />
                ))}
              </div>
            )}
          </section>
        </main>

        <Footer />
      </div>

      {/* Delete Confirmation Modal Popup */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in-0">
          <div className="w-full max-w-md rounded-2xl border border-[#302438] bg-[#17191E] p-6 text-[#E6E1EA] shadow-2xl animate-in zoom-in-95">
            <h3 className="text-lg font-semibold text-[#E6E1EA]">Remove Game</h3>
            <p className="mt-2 text-sm text-[#A0A0A8]">
              Are you sure you want to remove <span className="text-[#E6E1EA] font-medium">{deleteTarget.title}</span> from your library?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setDeleteTarget(null)}
                className="border-[#302438] bg-transparent text-[#E6E1EA] hover:bg-[#20232B]"
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
          </div>
        </div>
      )}
    </div>
  );
}