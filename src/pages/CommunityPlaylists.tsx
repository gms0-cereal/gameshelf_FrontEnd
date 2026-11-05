import { useEffect, useMemo, useState, memo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Gamepad2, RotateCcw, Search } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { PlaylistListCard } from "@/components/playlists/PlaylistCards";
import { getPlaylists, type Playlist } from "@/services/playlistService";
import { useAuth } from "@/context/AuthContext";

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

const SORTS: Option[] = [
  { value: "newest", label: "Newest" },
  { value: "updated", label: "Recently updated" },
  { value: "oldest", label: "Oldest" },
  { value: "title", label: "Title (A–Z)" },
];

const getFullUrl = (url?: string | null) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `http://127.0.0.1:8000${url.startsWith("/") ? "" : "/"}${url}`;
};

/** Owner Avatar component matching PlaylistDetail design system */
const OwnerAvatar = memo(({ src, name }: { src?: string | null; name: string }) => {
  const [failed, setFailed] = useState(false);
  const initials = name ? name.slice(0, 2).toUpperCase() : "U";

  return src && !failed ? (
    <img
      src={src}
      alt={name}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className="h-full w-full object-cover"
    />
  ) : (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#302438] to-[#17191E] text-[11px] font-semibold text-[#B39ACF]" aria-hidden="true">
      {initials}
    </div>
  );
});
OwnerAvatar.displayName = "OwnerAvatar";

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
}) {
  return (
    <label className="flex flex-col gap-2 text-[11px] font-semibold text-[#E6E1EA]">
      {label}
      <span className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-full cursor-pointer appearance-none rounded-xl border border-[#302438] bg-[#17191E] px-3 pr-9 text-xs font-normal text-[#E6E1EA] outline-none transition-colors hover:border-[#554363] focus:border-[#B39ACF] focus:ring-1 focus:ring-[#B39ACF]/20"
        >
          {options.map((o) => (
            <option
              key={o.value}
              value={o.value}
              className="bg-[#17191E] text-[#E6E1EA]"
            >
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#B39ACF]"
          strokeWidth={1.7}
          aria-hidden="true"
        />
      </span>
    </label>
  );
}

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
  const { user: currentUser } = useAuth();

  const q = params.get("q") ?? "";
  const genre = params.get("genre") ?? "";
  const platform = params.get("platform") ?? "";
  const sort = params.get("sort") || "newest";
  const page = Math.max(1, Number(params.get("page")) || 1);

  const [searchText, setSearchText] = useState(q);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  useEffect(() => {
    setSearchText(q);
  }, [q]);

  // Functional update: always builds on the latest URL params, so several
  // changes in one event (e.g. set genre + reset page) can't overwrite each other.
  const update = (next: Record<string, string | null>) => {
    setParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        Object.entries(next).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k)));
        return p;
      },
      { replace: true }
    );
  };

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

  function changePage(next: number) {
    update({ page: next > 1 ? String(next) : null });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function clearFilters() {
    setSearchText("");
    setParams({}, { replace: true });
  }

  const userDisplayName = currentUser?.nickname?.trim() || currentUser?.username || "Player";
  const userAvatarUrl = getFullUrl(currentUser?.avatar_url);
  const visiblePages = useMemo(() => generatePageList(page, totalPages), [page, totalPages]);
  const summary = `Showing ${count.toLocaleString()} playlists`;

  return (
    <div className="min-h-screen w-full bg-[#000000]">
      <div
        className="flex min-h-screen w-full flex-col bg-[#000000] text-[#E6E1EA] antialiased"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <Navbar />

        <main className="flex flex-1 flex-col gap-8 px-5 pb-16 pt-11 md:px-8 xl:px-16 overflow-x-hidden">
          {/* Header */}
          <div className="flex min-h-[65px] flex-wrap items-center justify-between gap-4">
            <div className="flex flex-col gap-2">
              <p className="text-[13px] leading-4 text-[#B39ACF] uppercase tracking-wider">
                PLAYER CURATED COLLECTIONS
              </p>
              <h1 className="text-[36px] font-semibold leading-[41px] tracking-[-0.8px] text-[#E6E1EA]">
                Community Gamelist
              </h1>
            </div>

            {/* Current Logged-in User Profile Bar */}
            <div className="flex items-center gap-3 rounded-2xl border border-[#302438] bg-[#17191E] p-2.5 px-4 shadow-none">
              <div className="size-10 shrink-0 overflow-hidden rounded-full border border-[#554363] bg-[#B39ACF]/20">
                <OwnerAvatar src={userAvatarUrl} name={userDisplayName} />
              </div>
              <div className="flex flex-col text-xs">
                <span className="font-medium text-[#E6E1EA]">{userDisplayName}</span>
                <Link to="/playlists/new" className="text-[11px] font-semibold text-[#B39ACF] hover:underline">
                  Create new playlist →
                </Link>
              </div>
            </div>
          </div>

          {/* Filters section */}
          <section
            aria-label="Search and filters"
            className="flex flex-col gap-5 rounded-2xl border border-[#302438] bg-[#17191E] p-6 shadow-none"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr_120px]">
              <label className="flex flex-col gap-2 text-[11px] font-semibold text-[#E6E1EA]">
                Search
                <span className="relative">
                  <input
                    type="search"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Search playlists…"
                    maxLength={100}
                    className="h-10 w-full rounded-xl border border-[#302438] bg-[#000000] pl-3 pr-9 text-xs font-normal text-[#E6E1EA] outline-none placeholder:text-[#77717F] transition-colors hover:border-[#554363] focus:border-[#B39ACF] focus:ring-1 focus:ring-[#B39ACF]/20"
                  />
                  <Search
                    className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#B39ACF]"
                    strokeWidth={1.7}
                    aria-hidden="true"
                  />
                </span>
              </label>

              <FilterSelect
                label="Genre"
                value={genre}
                onChange={(v) => update({ genre: v || null, page: null })}
                options={GENRES}
              />

              <FilterSelect
                label="Platform"
                value={platform}
                onChange={(v) => update({ platform: v || null, page: null })}
                options={PLATFORMS}
              />

              <FilterSelect
                label="Sort by"
                value={sort}
                onChange={(v) => update({ sort: v === "newest" ? null : v, page: null })}
                options={SORTS}
              />

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#302438] bg-[#000000] text-xs font-semibold text-[#E6E1EA] transition-colors hover:border-[#554363] hover:bg-[#20232B]"
                >
                  <RotateCcw className="size-3.5" aria-hidden="true" /> Reset
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 text-[11px] text-[#A0A0A8]">
              <span role="status">{summary}</span>
            </div>
          </section>

          {error && (
            <p role="alert" className="py-12 text-center text-sm text-[#E58B91]">
              {error}
            </p>
          )}

          {/* Results Section Shell (Always Rendered to Prevent Layout Shift) */}
          <section className="flex flex-col gap-5">
            <div className="flex items-end justify-between gap-3">
              <h2 className="text-[20px] font-semibold leading-6 text-[#E6E1EA]">
                Results
              </h2>
              <p className="text-[11px] text-[#A0A0A8]">
                {loading ? "Loading…" : `${playlists.length} playlists on this page`}
              </p>
            </div>

            <div className="min-h-[500px]">
              {loading ? (
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-[240px] animate-pulse rounded-2xl border border-[#302438] bg-[#17191E]"
                      aria-hidden="true"
                    />
                  ))}
                </div>
              ) : playlists.length > 0 ? (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${page}-${genre}-${platform}-${sort}-${q}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="grid grid-cols-1 gap-5 lg:grid-cols-2"
                  >
                    {playlists.map((p) => (
                      <PlaylistListCard key={p.id} playlist={p} />
                    ))}
                  </motion.div>
                </AnimatePresence>
              ) : (
                <p className="py-12 text-center text-sm text-[#A0A0A8]">
                  No playlists found. Try changing or clearing the filters.
                </p>
              )}
            </div>
          </section>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav aria-label="Pagination" className="flex items-center justify-center gap-2 pt-4">
              <button
                type="button"
                disabled={page === 1 || loading}
                onClick={() => changePage(page - 1)}
                className="flex h-9 min-w-9 cursor-pointer items-center justify-center rounded-xl border border-[#302438] bg-[#17191E] px-3 text-xs font-medium text-[#B39ACF] transition-colors hover:border-[#554363] hover:bg-[#20232B] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              {visiblePages.map((n, i) =>
                n === "…" ? (
                  <span key={`gap-${i}`} className="px-1 text-[#77717F]">…</span>
                ) : (
                  <button
                    key={n}
                    type="button"
                    disabled={loading}
                    onClick={() => changePage(Number(n))}
                    aria-current={n === page ? "page" : undefined}
                    className={`flex h-9 min-w-9 cursor-pointer items-center justify-center rounded-xl border px-3 text-xs font-medium transition-colors ${
                      n === page
                        ? "border-[#B39ACF] bg-[#B39ACF] font-bold text-[#17101F] hover:bg-[#C2ADE0]"
                        : "border-[#302438] bg-[#17191E] text-[#B39ACF] hover:border-[#554363] hover:bg-[#20232B]"
                    }`}
                  >
                    {n}
                  </button>
                )
              )}

              <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() => changePage(page + 1)}
                className="flex h-9 min-w-9 cursor-pointer items-center justify-center rounded-xl border border-[#302438] bg-[#17191E] px-3 text-xs font-medium text-[#B39ACF] transition-colors hover:border-[#554363] hover:bg-[#20232B] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </nav>
          )}
        </main>

        <Footer />
      </div>
    </div>
  );
}