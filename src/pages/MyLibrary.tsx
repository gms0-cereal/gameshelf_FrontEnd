import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Check, LayoutGrid, List, Search, X, ChevronLeft, ChevronRight, ListMusic } from "lucide-react";
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
import { getPlaylists, type Playlist } from "@/services/playlistService";
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
      className={`inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border px-3.5 text-xs transition-colors ${
        active
          ? "border-[#7c5fc4] bg-[#4a3d73] text-[#e0deeb]"
          : "border-[#55516c] bg-[#2a2838] text-[#b4aec7] hover:text-[#e0deeb]"
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
    <div className={`${className} bg-[#2a2838]`} />
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
      getPlaylists(),
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
    <div className="min-h-screen w-full bg-[#201e2f]">
      <div
        className="flex min-h-screen w-full flex-col bg-[#201e2f] text-[#e0deeb] antialiased"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <Navbar />

        <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-8 px-5 pb-16 pt-8 md:px-8 xl:px-16">
          <h1 className="text-[36px] font-semibold leading-[41px] tracking-[-0.8px]">
            My List
          </h1>

          {/* Controls */}
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label htmlFor="list-search" className="text-xs font-semibold">
                Search your list
              </label>

              <div className="relative w-full max-w-[360px]">
                <input
                  id="list-search"
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search saved games…"
                  className="h-10 w-full rounded-lg border border-[#55516c] bg-[#2a2838] pl-3.5 pr-10 text-xs text-[#e0deeb] outline-none placeholder:text-[#8b86a3] focus:border-[#c2ade7]"
                />
                <Search
                  className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-[#8b86a3]"
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
                  className={`flex h-12 w-14 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border text-[10px] ${
                    view === value
                      ? "border-[#7c5fc4] bg-[#4a3d73] text-[#e0deeb]"
                      : "border-[#55516c] bg-[#2a2838] text-[#b4aec7] hover:text-[#e0deeb]"
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
          <Card className="gap-0 rounded-xl border border-[#55516c] bg-[#373646] py-0 text-[#e0deeb] shadow-none">
            <CardContent className="flex flex-col p-6">
              {error && (
                <p role="alert" className="py-10 text-center text-sm text-[#e58d91]">
                  {error}
                </p>
              )}

              {!error && loading && entries.length === 0 && (
                <p role="status" className="py-10 text-center text-sm text-[#b4aec7]">
                  Loading your list…
                </p>
              )}

              {!error && !loading && entries.length === 0 && (
                <div className="flex flex-col items-center gap-4 py-10 text-center">
                  <p className="text-sm text-[#b4aec7]">
                    {counts.all === 0
                      ? "Your list is empty. Find a game you like and add it."
                      : "No games match your search or filter."}
                  </p>
                  {counts.all === 0 && (
                    <Button
                      asChild
                      className="h-10 rounded-lg border-0 bg-[#a8484c] px-5 text-sm font-semibold text-[#e0deeb] shadow-none hover:bg-[#ae494e]"
                    >
                      <Link to="/home">Browse games</Link>
                    </Button>
                  )}
                </div>
              )}

              {!error && entries.length > 0 && view === "rows" && (
                <div className="flex flex-col">
                  <div className="hidden grid-cols-[minmax(0,2.2fr)_1fr_1fr_auto] gap-4 pb-4 text-[10px] uppercase tracking-wide text-[#8b86a3] md:grid">
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
                          className="grid grid-cols-1 items-center gap-3 border-t border-[#55516c] py-4 md:grid-cols-[minmax(0,2.2fr)_1fr_1fr_auto] md:gap-4"
                        >
                          <Link
                            to={gameHref(entry)}
                            className="group flex min-w-0 items-center gap-4"
                          >
                            <Cover
                              entry={entry}
                              className="h-[44px] w-[80px] shrink-0 rounded-md"
                            />
                            <span className="flex min-w-0 flex-col gap-1">
                              <span className="truncate text-sm font-semibold group-hover:text-[#c2ade7]">
                                {entry.title}
                              </span>
                              <span className="truncate text-[10px] text-[#b4aec7]">
                                {entry.genres.join(" / ") || "—"}
                              </span>
                            </span>
                          </Link>

                          <div>
                            <span
                              className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-3.5 text-xs ${
                                isEditing
                                  ? "border-[#7c5fc4] bg-[#4a3d73]"
                                  : "border-[#55516c] bg-[#2a2838] text-[#b4aec7]"
                              }`}
                            >
                              {isEditing && (
                                <Check className="size-3.5" strokeWidth={1.7} aria-hidden="true" />
                              )}
                              {labelFor(entry.status)}
                            </span>
                          </div>

                          <p className="text-xs">{scoreText(entry)}</p>

                          <div className="flex items-center gap-2 md:w-[124px]">
                            <button
                              type="button"
                              onClick={() => toggleFavorite(entry)}
                              aria-label={`Favorite ${entry.title}`}
                              className="flex size-9 cursor-pointer items-center justify-center rounded-lg border border-[#55516c] bg-[#2a2838] text-[#e0deeb] hover:bg-[#46445a] transition-colors"
                            >
                              {entry.is_favorite ? (
                                <FaHeart className="size-4 text-[#e58d91]" />
                              ) : (
                                <CiHeart className="size-5 text-[#b4aec7]" />
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => openEdit(entry)}
                              aria-label={`Edit ${entry.title}`}
                              className="flex size-9 cursor-pointer items-center justify-center rounded-lg border border-[#55516c] bg-[#2a2838] text-[#e0deeb] hover:bg-[#46445a] transition-colors"
                            >
                              <IoPencilSharp className="size-4 text-[#c2ade7]" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeleteTarget(entry)}
                              aria-label={`Remove ${entry.title}`}
                              className="flex size-9 cursor-pointer items-center justify-center rounded-lg border border-[#55516c] bg-[#2a2838] text-[#e0deeb] hover:bg-[#4a303d] transition-colors"
                            >
                              <FaTrashAlt className="size-4 text-[#e58d91]" />
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
                      className="flex flex-col overflow-hidden rounded-xl border border-[#55516c] bg-[#2a2838]"
                    >
                      <Link to={gameHref(entry)}>
                        <Cover entry={entry} className="aspect-[3/2] w-full" />
                      </Link>
                      <div className="flex flex-1 flex-col gap-3 p-3.5">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{entry.title}</p>
                          <p className="truncate text-[10px] text-[#b4aec7]">
                            {entry.genres.join(" / ") || "—"}
                          </p>
                        </div>
                        <div className="mt-auto flex items-center justify-between gap-2">
                          <span className="rounded-lg border border-[#55516c] bg-[#201e2f] px-3 py-1 text-xs text-[#b4aec7]">
                            {labelFor(entry.status)}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => toggleFavorite(entry)}
                              aria-label={`Favorite ${entry.title}`}
                              className="flex size-8 cursor-pointer items-center justify-center rounded-lg border border-[#55516c] bg-[#2a2838] text-[#e0deeb] hover:bg-[#46445a] transition-colors"
                            >
                              {entry.is_favorite ? (
                                <FaHeart className="size-3.5 text-[#e58d91]" />
                              ) : (
                                <CiHeart className="size-4 text-[#b4aec7]" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => openEdit(entry)}
                              aria-label={`Edit ${entry.title}`}
                              className="flex size-8 cursor-pointer items-center justify-center rounded-lg border border-[#55516c] bg-[#2a2838] text-[#e0deeb] hover:bg-[#46445a] transition-colors"
                            >
                              <IoPencilSharp className="size-3.5 text-[#c2ade7]" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(entry)}
                              aria-label={`Remove ${entry.title}`}
                              className="flex size-8 cursor-pointer items-center justify-center rounded-lg border border-[#55516c] bg-[#2a2838] text-[#e0deeb] hover:bg-[#4a303d] transition-colors"
                            >
                              <FaTrashAlt className="size-3.5 text-[#e58d91]" />
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
                <div className="mt-6 flex flex-wrap items-center justify-between border-t border-[#55516c] pt-4 text-xs text-[#b4aec7]">
                  <span>
                    Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, entries.length)} of {entries.length} games
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage((p) => Math.max(p - 1, 1))}
                      className="h-8 border-[#55516c] bg-[#2a2838] text-[#e0deeb] hover:bg-[#373646]"
                    >
                      <ChevronLeft className="size-4" /> Previous
                    </Button>
                    <span className="px-2 text-white">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                      className="h-8 border-[#55516c] bg-[#2a2838] text-[#e0deeb] hover:bg-[#373646]"
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
              className="rounded-xl border border-[#55516c] bg-[#373646] p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <h2 id="edit-title" className="text-[18px] font-semibold leading-6">
                  Edit {editing.title}
                </h2>

                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="inline-flex cursor-pointer items-center gap-1 text-xs text-[#b4aec7] hover:text-[#e0deeb]"
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
                  className="h-10 rounded-lg border-0 bg-[#a8484c] px-5 text-[13px] font-semibold text-[#e0deeb] shadow-none hover:bg-[#ae494e] disabled:opacity-60"
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
                  className="cursor-pointer text-xs text-[#e58d91] hover:underline"
                >
                  Remove from list
                </button>
              </div>
            </section>
          )}

          {/* My Playlists Carousel Section (Matched to Home page style) */}
          <section id="my-playlists" aria-labelledby="my-playlists-title" className="mt-8 flex flex-col gap-5">
            <div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 id="my-playlists-title" className="text-[24px] font-semibold leading-[29px] tracking-[-0.5px]">
                    My Playlists
                  </h2>
                  <p className="mt-1 text-[13px] leading-4 text-[#b4aec7]">Manage your personal collections and custom playlists</p>
                  <Link to="/playlists" className="text-[13px] text-[#b4aec7] hover:text-[#e0deeb]">
                    View more →
                  </Link>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to="/playlists/new"
                    className="mr-2 rounded-lg bg-[#9f4044] px-4 py-2.5 text-[13px] font-medium hover:bg-[#ae494e]"
                  >
                    Create playlist
                  </Link>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => scrollPlaylistCarousel(-1)}
                    aria-label="Scroll left"
                    className="size-8 rounded-lg border-[#55516c] bg-[#373646]/80 text-[#e0deeb] hover:bg-[#454256]"
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => scrollPlaylistCarousel(1)}
                    aria-label="Scroll right"
                    className="size-8 rounded-lg border-[#55516c] bg-[#373646]/80 text-[#e0deeb] hover:bg-[#454256]"
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            </div>

            {playlistsLoading && <p role="status" className="text-sm text-[#b4aec7]">Loading your playlists…</p>}

            {!playlistsLoading && playlists.length === 0 && (
              <div className="rounded-xl border border-dashed border-[#55516c] px-6 py-10 text-center">
                <ListMusic className="mx-auto size-8 text-[#8b86a3]" strokeWidth={1.5} />
                <p className="mt-3 text-sm text-[#b4aec7]">You haven't created any playlists yet.</p>
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
          <div className="w-full max-w-md rounded-2xl border border-[#514961] bg-[#2a2838] p-6 text-[#e0deeb] shadow-2xl animate-in zoom-in-95">
            <h3 className="text-lg font-semibold text-white">Remove Game</h3>
            <p className="mt-2 text-sm text-[#b4aec7]">
              Are you sure you want to remove <span className="text-white font-medium">{deleteTarget.title}</span> from your library?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setDeleteTarget(null)}
                className="border-[#514961] bg-transparent text-[#d0ccdc] hover:bg-[#373646]"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDelete}
                disabled={saving}
                className="bg-[#a8484c] text-white hover:bg-[#ae494e]"
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