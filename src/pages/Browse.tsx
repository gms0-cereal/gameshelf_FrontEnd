import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, ChevronDown, Gamepad2, Search, Star } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {
  browseSteamGames,
  type BrowseGame,
  type BrowseResponse,
} from "@/services/Gameservice";
import { Card, CardContent } from "@/components/ui/card";
type Option = { value: string; label: string };

// Slugs must match GENRE_TAGS in the backend.
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

// Slugs must match PLATFORM_OS in the backend.
const PLATFORMS: Option[] = [
  { value: "", label: "All" },
  { value: "windows", label: "PC" },
  { value: "mac", label: "Mac" },
  { value: "linux", label: "Linux" },
];

// Slugs must match SORT_BY in the backend.
const SORTS: Option[] = [
  { value: "rated", label: "Highest rated" },
  { value: "relevance", label: "Most relevant" },
  { value: "newest", label: "Newest" },
  { value: "price_low", label: "Price: low to high" },
  { value: "price_high", label: "Price: high to low" },
  { value: "name", label: "Name (A–Z)" },
];

// ---------------------------------------------------------------------------
// small components
// ---------------------------------------------------------------------------
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
    <label className="flex flex-col gap-2 text-[11px] font-semibold text-[#e0deeb]">
      {label}
      <span className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-full cursor-pointer appearance-none rounded-lg border border-[#55516c] bg-[#2a2838] px-3 pr-9 text-xs font-normal text-[#b4aec7] outline-none focus:border-[#c2ade7]"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#b4aec7]"
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
    },
    {
      icon: Calendar,
      text: game.release_year
        ? `Released ${game.release_year}`
        : "Release date unknown",
    },
    {
      icon: Star,
      text:
        game.score !== null
          ? `Score ${game.score.toFixed(1)}/10`
          : "No score yet",
    },
  ];

  return (
    <Card className="group relative flex min-w-0 flex-col gap-0 overflow-hidden rounded-xl border border-[#55516c] bg-[#373646] py-0 text-[#e0deeb] shadow-none transition-colors hover:border-[#c2ade7] focus-within:border-[#c2ade7]">
      <div className="relative aspect-[3/2] w-full shrink-0 overflow-hidden bg-[#2a2838]">
        <img
          src={game.header_image}
          alt=""
          loading="lazy"
          className="block h-full w-full object-cover object-center"
        />

        {game.price && (
          <span className="absolute right-2.5 top-2.5 rounded-full bg-[#ede9fe] px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.5px] text-[#5b21b6]">
            {game.price}
          </span>
        )}
      </div>

      <CardContent className="flex flex-1 flex-col p-3.5">
        <p className="truncate text-xs leading-4 text-[#b4aec7]">
          {game.genres.slice(0, 2).join(" / ") || "—"}
        </p>

        <h3 className="mt-1 truncate text-base font-medium leading-6">
          <Link
            to={`/gamedetails/${game.appid}`}
            title={game.name}
            className="outline-none after:absolute after:inset-0 after:z-10 after:content-[''] group-hover:text-[#c2ade7]"
          >
            {game.name}
          </Link>
        </h3>

        <ul className="mt-2.5 flex flex-col gap-1.5">
          {details.map(({ icon: Icon, text }, i) => (
            <li
              key={i}
              className="flex items-center gap-2.5 text-[13px] leading-5 text-[#b4aec7]"
            >
              <Icon
                className="size-4 shrink-0 text-[#8b86a3]"
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
            className="inline-flex h-9 w-full items-center justify-center rounded-lg bg-[#a8484c] px-4 text-[13px] font-medium text-[#e0deeb] transition-colors group-hover:bg-[#ae494e]"
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
  const pages = Array.from({ length: last - first + 1 }, (_, i) => first + i);

  const base =
    "flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-md border px-3 text-xs disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-2">
      <button
        type="button"
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
        className={`${base} border-[#55516c] bg-[#373646] text-[#e0deeb] hover:bg-[#46445a]`}
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
              ? "border-[#a8484c] bg-[#a8484c] text-[#e0deeb]"
              : "border-[#55516c] bg-[#373646] text-[#e0deeb] hover:bg-[#46445a]"
          }`}
        >
          {n}
        </button>
      ))}

      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        className={`${base} border-[#55516c] bg-[#373646] text-[#e0deeb] hover:bg-[#46445a]`}
      >
        Next
      </button>
    </nav>
  );
}

// ---------------------------------------------------------------------------
// page
// ---------------------------------------------------------------------------
export default function Browse() {
  const [input, setInput] = useState("");
  const [q, setQ] = useState("");
  const [genre, setGenre] = useState("");
  const [platform, setPlatform] = useState("");
  const [sort, setSort] = useState("rated");
  const [page, setPage] = useState(1);

  const [data, setData] = useState<BrowseResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    document.title = "Browse Games | GameShelf";
  }, []);

  // Debounce the search box
  useEffect(() => {
    const timer = setTimeout(() => {
      setQ(input.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [input]);

  // Fetch whenever a filter or the page changes
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    browseSteamGames({ q, genre, platform, sort, page })
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [q, genre, platform, sort, page]);

  function changeFilter(setter: (value: string) => void, value: string) {
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
    <div className="min-h-screen bg-[#201e2f]">
      <div
        className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col bg-[#201e2f] text-[#e0deeb] antialiased"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <Navbar />

        <main className="flex flex-1 flex-col gap-8 px-5 pb-16 pt-8 md:px-8 xl:px-16">
          {/* Heading */}
          <header className="flex flex-col gap-3">
            <h1 className="text-[32px] font-semibold leading-10 tracking-[-0.5px]">
              Browse Games
            </h1>
            <p className="text-[13px] text-[#b4aec7]">
              A whole world of games. Find the one that stays with you.
            </p>
          </header>

          {/* Filters */}
          <section
            aria-label="Search and filters"
            className="flex flex-col gap-5 rounded-2xl border border-[#55516c] bg-[#373646] p-6"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
              <label className="flex flex-col gap-2 text-[11px] font-semibold text-[#e0deeb]">
                Find a game
                <span className="relative">
                  <input
                    type="search"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Search by title..."
                    maxLength={100}
                    className="h-10 w-full rounded-lg border border-[#55516c] bg-[#2a2838] pl-3 pr-9 text-xs font-normal text-[#e0deeb] outline-none placeholder:text-[#8b86a3] focus:border-[#c2ade7]"
                  />
                  <Search
                    className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#b4aec7]"
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

            <div className="flex items-center justify-between gap-3 text-[11px] text-[#b4aec7]">
              <span role="status">{summary}</span>
              <button
                type="button"
                onClick={clearFilters}
                className="cursor-pointer text-[#c2ade7] hover:text-[#e0deeb]"
              >
                Clear filters
              </button>
            </div>
          </section>

          {error && (
            <p role="alert" className="py-12 text-center text-sm text-[#e58d91]">
              Couldn’t load games right now. Please try again.
            </p>
          )}

          {loading && !data && (
            <p role="status" className="py-12 text-center text-sm text-[#b4aec7]">
              Loading games…
            </p>
          )}

          {!error && data && results.length === 0 && !loading && (
            <p className="py-12 text-center text-sm text-[#b4aec7]">
              No games match your search. Try changing or clearing the filters.
            </p>
          )}

          {/* Results */}
          {!error && results.length > 0 && (
            <section
              className={`flex flex-col gap-5 transition-opacity ${
                loading ? "opacity-60" : ""
              }`}
            >
              <div className="flex items-end justify-between gap-3">
                <h2 className="text-[20px] font-semibold leading-6">Results</h2>
                <p className="text-[11px] text-[#b4aec7]">
                  {results.length} games
                </p>
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {results.map((game) => (
                  <GameCard key={game.appid} game={game} />
                ))}
              </div>
            </section>
          )}

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