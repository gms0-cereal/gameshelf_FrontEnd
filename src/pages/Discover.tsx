import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, ChevronDown, Gamepad2, Search, Star } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { type BrowseGame } from "@/services/Gameservice";
import { Card, CardContent } from "@/components/ui/card";
import { useBrowseGamesQuery } from "@/store/apiSlice";

type Option = { value: string; label: string };

const GENRES: Option[] = [
  { value: "", label: "All genres" },
  { value: "action", label: "Action" },
  { value: "adventure", label: "Adventure" },
  { value: "casual", label: "Casual" },
  { value: "indie", label: "Indie" },
  { value: "rpg", label: "RPG" },
  { value: "simulation", label: "Simulation" },
  { value: "strategy", label: "Strategy" },
  { value: "sports", label: "Sports" },
  { value: "racing", label: "Racing" },
  { value: "puzzle", label: "Puzzle" },
  { value: "platformer", label: "Platformer" },
  { value: "roguelike", label: "Roguelike" },
  { value: "horror", label: "Horror" },
];

const PLATFORMS: Option[] = [
  { value: "", label: "All" },
  { value: "windows", label: "PC" },
  { value: "mac", label: "Mac" },
  { value: "linux", label: "Linux" },
];

const SORTS: Option[] = [
  { value: "rated", label: "Highest rated" },
  { value: "relevance", label: "Most relevant" },
  { value: "newest", label: "Newest" },
  { value: "price_low", label: "Price: low to high" },
  { value: "price_high", label: "Price: high to low" },
  { value: "name", label: "Name (A–Z)" },
];

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

function GameCard({ game }: { game: BrowseGame }) {
  const details = [
    {
      icon: Gamepad2,
      text: game.platforms.join(" / ") || "Platform unknown",
      color: "text-[#38BDF8]",
    },
    {
      icon: Calendar,
      text: game.release_year
        ? `Released ${game.release_year}`
        : "Release date unknown",
      color: "text-[#34D399]",
    },
    {
      icon: Star,
      text:
        game.score !== null
          ? `Score ${game.score.toFixed(1)}/10`
          : "No score yet",
      color: "text-[#FBBF24]",
    },
  ];

  const descriptionText =
    (game as any).description ??
    (game as any).short_description ??
    "Explore this game title and dive into immersive gameplay.";

  return (
    <Card className="group relative flex min-w-0 flex-col gap-0 overflow-hidden rounded-2xl border border-[#302438] bg-[#17191E] py-0 text-[#E6E1EA] shadow-none transition-colors duration-200 hover:border-[#554363] focus-within:border-[#B39ACF]">
      <div className="relative aspect-[3/2] w-full shrink-0 overflow-hidden bg-[#000000]">
        <img
          src={game.header_image}
          alt={game.name}
          loading="lazy"
          className="block h-full w-full object-cover object-center contrast-110 saturate-125 transition-transform duration-300 group-hover:scale-105"
        />

        {game.price && (
          <span className="absolute right-2.5 top-2.5 rounded-full border border-[#34D399]/30 bg-[#10251F]/95 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.5px] text-[#34D399]">
            {game.price}
          </span>
        )}
      </div>

      <CardContent className="flex flex-1 flex-col p-4">
        <p className="truncate text-xs leading-4 text-[#B39ACF]">
          {game.genres.slice(0, 2).join(" / ") || "—"}
        </p>

        <h3 className="mt-1 truncate text-base font-medium leading-6">
          <Link
            to={`/gamedetails/${game.appid}`}
            title={game.name}
            className="outline-none after:absolute after:inset-0 after:z-10 after:content-[''] group-hover:text-[#B39ACF] focus-visible:text-[#C2ADE0]"
          >
            {game.name}
          </Link>
        </h3>

        <p className="mt-1.5 line-clamp-2 text-[13px] leading-5 text-[#A0A0A8]">
          {descriptionText}
        </p>

        <ul className="mt-3 flex flex-col gap-1.5">
          {details.map(({ icon: Icon, text, color }, i) => (
            <li
              key={i}
              className="flex items-center gap-2.5 text-[13px] leading-5 text-[#A0A0A8]"
            >
              <Icon
                className={`size-4 shrink-0 ${color}`}
                strokeWidth={1.7}
                aria-hidden="true"
              />
              <span className="min-w-0 truncate">{text}</span>
            </li>
          ))}
        </ul>

        <div className="mt-auto pt-4">
          <span
            aria-hidden="true"
            className="inline-flex h-9 w-full items-center justify-center rounded-xl bg-[#B39ACF]/15 px-4 text-[13px] font-semibold text-[#C2ADE0] transition-colors duration-200 group-hover:bg-[#B39ACF]/25 group-hover:text-[#E6E1EA]"
          >
            View Game
          </span>
        </div>
      </CardContent>
    </Card>
  );
}


function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const first = Math.max(1, Math.min(page - 2, totalPages - 4));
  const last = Math.min(totalPages, first + 4);
  const pages = Array.from(
    { length: last - first + 1 },
    (_, i) => first + i
  );

  const base =
    "flex h-9 min-w-9 cursor-pointer items-center justify-center rounded-xl border px-3 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-center gap-2 pt-4"
    >
      <button
        type="button"
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
        className={`${base} border-[#302438] bg-[#17191E] text-[#B39ACF] hover:border-[#554363] hover:bg-[#20232B]`}
      >
        Previous
      </button>

      {pages.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-current={n === page ? "page" : undefined}
          className={`${base} ${
            n === page
              ? "border-[#B39ACF] bg-[#B39ACF] font-bold text-[#17101F] hover:bg-[#C2ADE0]"
              : "border-[#302438] bg-[#17191E] text-[#B39ACF] hover:border-[#554363] hover:bg-[#20232B]"
          }`}
        >
          {n}
        </button>
      ))}

      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        className={`${base} border-[#302438] bg-[#17191E] text-[#B39ACF] hover:border-[#554363] hover:bg-[#20232B]`}
      >
        Next
      </button>
    </nav>
  );
}

export default function Discover() {
  const [input, setInput] = useState("");
  const [q, setQ] = useState("");
  const [genre, setGenre] = useState("");
  const [platform, setPlatform] = useState("");
  const [sort, setSort] = useState("rated");
  const [page, setPage] = useState(1);

  useEffect(() => {
    document.title = "Discover Games | GameShelf";
  }, []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setQ(input.trim());
      setPage(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [input]);

  // RTK Query with client-side and server-side caching
  const {
    data,
    isLoading: loading,
    isError: error,
    isFetching,
  } = useBrowseGamesQuery({
    q,
    genre,
    platform,
    sort,
    page,
  });

  function changeFilter(
    setter: (value: string) => void,
    value: string
  ) {
    setter(value);
    setPage(1);
  }

  function changePage(next: number) {
    setPage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function clearFilters() {
    setInput("");
    setQ("");
    setGenre("");
    setPlatform("");
    setSort("rated");
    setPage(1);
  }

  const results = data?.results ?? [];

  const summary = data
    ? `Showing ${data.count.toLocaleString()} games`
    : "Loading games…";

  return (
    <div className="min-h-screen w-full bg-[#000000]">
      <div
        className="flex min-h-screen w-full flex-col bg-[#000000] text-[#E6E1EA] antialiased"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <Navbar />

        <main className="flex flex-1 flex-col gap-8 px-5 pb-16 pt-11 md:px-8 xl:px-16">
          {/* Page header matching Home's layout */}
          <div className="flex min-h-[65px] flex-wrap items-center justify-between gap-4">
            <div className="flex flex-col gap-2">
              <p className="text-[13px] leading-4 text-[#B39ACF] uppercase tracking-wider">
                EXPLORE & FILTER
              </p>
              <h1 className="text-[36px] font-semibold leading-[41px] tracking-[-0.8px] text-[#E6E1EA]">
                Discover Games
              </h1>
            </div>
          </div>

          {/* Filters */}
          <section
            aria-label="Search and filters"
            className="flex flex-col gap-5 rounded-2xl border border-[#302438] bg-[#17191E] p-6"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
              <label className="flex flex-col gap-2 text-[11px] font-semibold text-[#E6E1EA]">
                Find a game

                <span className="relative">
                  <input
                    type="search"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Search by title..."
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
                onChange={(v) => changeFilter(setGenre, v)}
                options={GENRES}
              />

              <FilterSelect
                label="Platform"
                value={platform}
                onChange={(v) => changeFilter(setPlatform, v)}
                options={PLATFORMS}
              />

              <FilterSelect
                label="Sort"
                value={sort}
                onChange={(v) => changeFilter(setSort, v)}
                options={SORTS}
              />
            </div>

            <div className="flex items-center justify-between gap-3 text-[11px] text-[#A0A0A8]">
              <span role="status">{summary}</span>

              <button
                type="button"
                onClick={clearFilters}
                className="cursor-pointer font-medium text-[#B39ACF] transition-colors hover:text-[#C2ADE0] hover:underline"
              >
                Clear filters
              </button>
            </div>
          </section>

          {error && (
            <p
              role="alert"
              className="py-12 text-center text-sm text-[#E58B91]"
            >
              Couldn't load games right now. Please try again.
            </p>
          )}

          {/* Results Section Shell (Always Rendered to Prevent Layout Shift) */}
          <section className="flex flex-col gap-5">
            <div className="flex items-end justify-between gap-3">
              <h2 className="text-[20px] font-semibold leading-6 text-[#E6E1EA]">
                Results
              </h2>

              <p className="text-[11px] text-[#A0A0A8]">
                {loading && !data
                  ? "Loading…"
                  : `${results.length} games on this page`}
              </p>
            </div>

            <div className="min-h-[500px]">
              {loading && !data ? (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-[320px] animate-pulse rounded-2xl border border-[#302438] bg-[#17191E]"
                      aria-hidden="true"
                    />
                  ))}
                </div>
              ) : results.length > 0 ? (
                <div
                  className={`grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 transition-opacity duration-200 ${
                    isFetching ? "opacity-60" : ""
                  }`}
                >
                  {results.map((game) => (
                    <GameCard key={game.appid} game={game} />
                  ))}
                </div>
              ) : (
                <p className="py-12 text-center text-sm text-[#A0A0A8]">
                  No games match your search. Try changing or clearing the filters.
                </p>
              )}
            </div>
          </section>

          {!error && data && (
            <Pagination
              page={page}
              totalPages={data.total_pages}
              onChange={changePage}
            />
          )}
        </main>

        <Footer />
      </div>
    </div>
  );
}