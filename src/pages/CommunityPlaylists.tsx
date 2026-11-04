import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Gamepad2, RotateCcw, Search } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { PlaylistListCard } from "@/components/playlists/PlaylistCards";
import { getPlaylists, type Playlist } from "@/services/playlistService";
import { getMe, type User } from "@/services/Userservice";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const PAGE_SIZE = 12;

type Option = { value: string; label: string };

const GENRES: Option[] = [
  { value: "", label: "All genres" },
  { value: "Action", label: "Action" },
  { value: "Adventure", label: "Adventure" },
  { value: "Casual", label: "Casual" },
  { value: "Indie", label: "Indie" },
  { value: "Massively Multiplayer", label: "Massively Multiplayer" },
  { value: "Racing", label: "Racing" },
  { value: "RPG", label: "RPG" },
  { value: "Simulation", label: "Simulation" },
  { value: "Sports", label: "Sports" },
  { value: "Strategy", label: "Strategy" },
  { value: "Free To Play", label: "Free To Play" },
  { value: "Early Access", label: "Early Access" },
];

const PLATFORMS: Option[] = [
  { value: "", label: "All platforms" },
  { value: "windows", label: "PC" },
  { value: "mac", label: "Mac" },
  { value: "linux", label: "Linux" },
];

const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "updated", label: "Recently updated" },
  { value: "oldest", label: "Oldest" },
  { value: "title", label: "Title (A–Z)" },
] as const;
type Sort = (typeof SORTS)[number]["value"];

function generatePageList(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push("…");
    out.push(p);
  });
  return out;
}

export default function CommunityPlaylists() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const genre = params.get("genre") ?? "";
  const platform = params.get("platform") ?? "";
  const sort = (params.get("sort") as Sort) || "newest";
  const page = Math.max(1, Number(params.get("page")) || 1);

  const [searchText, setSearchText] = useState(q);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  // Sync current user avatar profile safely mapped to UserProfile
  useEffect(() => {
    let isMounted = true;
    getMe()
      .then((meData: User) => {
        if (isMounted && meData) {
          setCurrentUser(meData);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  // Sync search input box if URL param 'q' changes externally
  useEffect(() => {
    setSearchText(q);
  }, [q]);

  const update = (next: Record<string, string | null>) => {
    const p = new URLSearchParams(params);
    Object.entries(next).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k)));
    setParams(p, { replace: true });
  };

  // Typing updates the URL 300ms after you stop
  useEffect(() => {
    if (searchText.trim() === q) return;
    const t = setTimeout(() => {
      update({ q: searchText.trim() || null, page: null });
    }, 300);
    return () => clearTimeout(t);
  }, [searchText, q]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getPlaylists({
      search: q || undefined,
      genre: genre || undefined,
      platform: platform || undefined,
      sort,
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    })
      .then((data) => {
        if (cancelled) return;
        setPlaylists(data.results);
        setCount(data.count);
      })
      .catch(() => !cancelled && setError("Couldn't load playlists. Please try again."))
      .finally(() => !cancelled && setLoading(false));

    window.scrollTo({ top: 0, behavior: "smooth" });
    return () => {
      cancelled = true;
    };
  }, [q, genre, platform, sort, page]);

  const goTo = (n: number) => update({ page: n > 1 ? String(n) : null });

  const visiblePages = useMemo(() => generatePageList(page, totalPages), [page, totalPages]);

  const field =
    "h-10 w-full rounded-xl border border-[#302438] bg-[#17191E] px-3 text-[13px] text-[#E6E1EA] placeholder:text-[#77717F] focus:outline-none focus:ring-2 focus:ring-[#B39ACF]/60";
  const label = "mb-2 block font-mono text-[10px] uppercase tracking-widest text-[#77717F]";

  const userDisplayName = currentUser?.nickname?.trim() || currentUser?.username || "Player";

  return (
    <div className="min-h-screen w-full bg-[#000000]">
      <div
        className="flex min-h-screen w-full flex-col bg-[#000000] text-[#E6E1EA] antialiased"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <Navbar />

        <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col px-5 pb-16 pt-8 md:px-8 xl:px-16">
          <nav className="font-mono text-[11px] uppercase tracking-widest text-[#77717F]" aria-label="Breadcrumb">
            <Link to="/home" className="hover:text-[#E6E1EA]">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-[#E6E1EA]">Community playlists</span>
          </nav>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-[32px] font-semibold">Community Playlists</h1>
              <p className="mt-2 text-[14px] text-[#A0A0A8]">
                Curated lists made by players. Discover new games or share your own.
              </p>
            </div>

            {/* User Profile Avatar Bar & Create Link */}
            <div className="flex items-center gap-3 rounded-2xl border border-[#302438] bg-[#17191E] p-2.5 px-4">
              <Avatar className="size-10 shrink-0 overflow-hidden border border-[#554363] bg-[#302438]">
                <AvatarImage
                  src={currentUser?.avatar_url || undefined}
                  alt={userDisplayName}
                  className="object-cover contrast-110 saturate-125"
                />
                <AvatarFallback className="bg-[#302438]">
                  <Gamepad2 className="size-5 text-[#B39ACF]" />
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col text-xs">
                <span className="font-medium text-[#E6E1EA]">{userDisplayName}</span>
                <Link to="/playlists/new" className="text-[11px] font-semibold text-[#B39ACF] hover:underline">
                  Create new playlist →
                </Link>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_180px_180px_200px_120px]">
            <div className="sm:col-span-2 lg:col-span-1">
              <label htmlFor="pl-search" className={label}>Search</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#77717F]" aria-hidden="true" />
                <input
                  id="pl-search"
                  type="search"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Search playlists…"
                  className={`${field} pl-9`}
                />
              </div>
            </div>

            <div>
              <label htmlFor="pl-genre" className={label}>Genre</label>
              <select
                id="pl-genre"
                value={genre}
                onChange={(e) => update({ genre: e.target.value || null, page: null })}
                className={field}
              >
                {GENRES.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="pl-platform" className={label}>Platform</label>
              <select
                id="pl-platform"
                value={platform}
                onChange={(e) => update({ platform: e.target.value || null, page: null })}
                className={field}
              >
                {PLATFORMS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="pl-sort" className={label}>Sort by</label>
              <select
                id="pl-sort"
                value={sort}
                onChange={(e) => update({ sort: e.target.value === "newest" ? null : e.target.value, page: null })}
                className={field}
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={() => {
                  setSearchText("");
                  setParams({}, { replace: true });
                }}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#302438] bg-[#17191E] font-mono text-[11px] uppercase tracking-widest text-[#E6E1EA] hover:bg-[#20232B] hover:border-[#554363]"
              >
                <RotateCcw className="size-3.5" aria-hidden="true" /> Reset
              </button>
            </div>
          </div>

          <p className="mt-6 font-mono text-[12px] text-[#77717F]" aria-live="polite">
            <span className="font-semibold text-[#E6E1EA]">{count.toLocaleString()}</span> playlists
          </p>

          {error && <p role="alert" className="mt-4 text-sm text-[#E58B91]">{error}</p>}

          <div className={`mt-4 grid gap-5 lg:grid-cols-2 transition-opacity ${loading ? "opacity-60" : "opacity-100"}`}>
            {playlists.map((p) => (
              <PlaylistListCard key={p.id} playlist={p} />
            ))}
          </div>

          {!loading && !error && playlists.length === 0 && (
            <p className="mt-10 rounded-2xl border border-dashed border-[#302438] p-10 text-center text-sm text-[#A0A0A8]">
              No playlists found.
            </p>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <nav aria-label="Playlist pages" className="mt-10 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => goTo(page - 1)}
                disabled={page === 1 || loading}
                aria-label="Previous page"
                className="flex size-9 items-center justify-center rounded-xl bg-[#17191E] border border-[#302438] text-[#E6E1EA] hover:bg-[#20232B] disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="size-4" />
              </button>

              {visiblePages.map((p, i) =>
                p === "…" ? (
                  <span key={`gap-${i}`} className="px-1 text-[#77717F]">…</span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    onClick={() => goTo(Number(p))}
                    disabled={loading}
                    aria-current={p === page ? "page" : undefined}
                    className={`size-9 rounded-xl text-[13px] font-semibold cursor-pointer border ${
                      p === page
                        ? "bg-[#B39ACF] border-[#B39ACF] text-[#17191E]"
                        : "bg-[#17191E] border-[#302438] text-[#E6E1EA] hover:bg-[#20232B]"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}

              <button
                type="button"
                onClick={() => goTo(page + 1)}
                disabled={page >= totalPages || loading}
                aria-label="Next page"
                className="flex size-9 items-center justify-center rounded-xl bg-[#17191E] border border-[#302438] text-[#E6E1EA] hover:bg-[#20232B] disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="size-4" />
              </button>
            </nav>
          )}
        </main>

        <Footer />
      </div>
    </div>
  );
}