import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Check, LayoutGrid, List, Pencil, Search, X } from "lucide-react";
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

const labelFor = (status: ListStatus) =>
  LIST_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status;

// ---------------------------------------------------------------------------
// small pieces
// ---------------------------------------------------------------------------
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
      alt=""
      loading="lazy"
      className={`${className} object-cover`}
    />
  ) : (
    <div className={`${className} bg-[#2a2838]`} />
  );
}

function EditButton({ onClick, title }: { onClick: () => void; title: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Edit ${title}`}
      className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-[#55516c] bg-[#2a2838] px-4 text-xs font-semibold text-[#e0deeb] hover:bg-[#46445a]"
    >
      <Pencil className="size-3.5 text-[#8b86a3]" strokeWidth={1.7} aria-hidden="true" />
      Edit
    </button>
  );
}

// ---------------------------------------------------------------------------
// page
// ---------------------------------------------------------------------------
export default function MyLibrary() {
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [view, setView] = useState<View>("rows");

  const [entries, setEntries] = useState<UserGameEntry[]>([]);
  const [counts, setCounts] = useState(EMPTY_COUNTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [editing, setEditing] = useState<UserGameEntry | null>(null);
  const [draftStatus, setDraftStatus] = useState<ListStatus>("plan_to_play");
  const [saving, setSaving] = useState(false);
  const editRef = useRef<HTMLElement>(null);

  // Debounce the search box
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Load the list
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getMyGameList({ status: filter, search: debouncedSearch })
      .then((data) => {
        if (cancelled) return;
        setEntries(data.results);
        setCounts(data.counts);
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
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [filter, debouncedSearch, reloadKey]);

  // Bring the edit panel into view when it opens
  useEffect(() => {
    if (editing) {
      editRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [editing?.id]);

  function openEdit(entry: UserGameEntry) {
    setEditing(entry);
    setDraftStatus(entry.status);
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

  async function removeEntry() {
    if (!editing) return;
    if (!window.confirm(`Remove “${editing.title}” from your list?`)) return;

    setSaving(true);
    try {
      await removeListEntry(editing.id);
      toast.success(`Removed ${editing.title} from your list`);
      setEditing(null);
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
    <div className="min-h-screen bg-[#201e2f]">
      <div
        className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col bg-[#201e2f] text-[#e0deeb] antialiased"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <Navbar />

        <main className="flex flex-1 flex-col gap-8 px-5 pb-16 pt-8 md:px-8 xl:px-16">
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
                    <span className="w-[88px]">Action</span>
                  </div>

                  <ul>
                    {entries.map((entry) => {
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

                          <div className="md:w-[88px]">
                            <EditButton onClick={() => openEdit(entry)} title={entry.title} />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {!error && entries.length > 0 && view === "grid" && (
                <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {entries.map((entry) => (
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
                          <EditButton onClick={() => openEdit(entry)} title={entry.title} />
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {!error && entries.length > 0 && (
                <p className="mt-4 text-[10px] text-[#b4aec7]">
                  Showing {entries.length} {entries.length === 1 ? "entry" : "entries"} from
                  your {counts.all}-game collection.
                </p>
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

                <p className="text-[11px] text-[#b4aec7]">
                  You’ll be asked to confirm before removing a game.{" "}
                  <button
                    type="button"
                    onClick={removeEntry}
                    disabled={saving}
                    className="cursor-pointer text-[#e58d91] hover:underline"
                  >
                    Remove from list
                  </button>
                </p>
              </div>
            </section>
          )}
        </main>

        <Footer />
      </div>
    </div>
  );
}