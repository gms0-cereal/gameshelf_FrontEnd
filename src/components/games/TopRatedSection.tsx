import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import GameCard, { type GameSummary } from "@/components/games/GameCard";
import { getTopRatedGames, type SteamGameCard, type UserGameEntry } from "@/services/Gameservice";

function steamCardToSummary(card: SteamGameCard): GameSummary {
  return {
    id: card.appid,
    title: card.name,
    slug: String(card.appid),
    cover: card.header_image,
    genres: card.genres,
    platforms: card.platforms,
    release_year: card.release_year,
    score: card.bayesian_score ?? card.score,
    bio: card.short_description || "Explore live community catalogs and add this title to your shelf.",
  };
}
const CARD_WIDTH = "w-[260px] sm:w-[280px]";
const PAGE_SIZE = 20;

interface TopRatedSectionProps {
  userListMap?: Map<string, UserGameEntry>;
}

export default function TopRatedSection({}: TopRatedSectionProps) {
  const [games, setGames] = useState<GameSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const trackRef = useRef<HTMLUListElement>(null);
  const offsetRef = useRef(0);
  const hasMoreRef = useRef(true);
  const loadingRef = useRef(false);

  const fetchPage = useCallback(async (isReset = false) => {
    if (loadingRef.current || (!hasMoreRef.current && !isReset)) return;
    loadingRef.current = true;
    if (isReset) {
      offsetRef.current = 0;
      hasMoreRef.current = true;
    }

    try {
      const data = await getTopRatedGames(PAGE_SIZE, offsetRef.current);
      const summaries = data.results.map(steamCardToSummary);

      setGames((prev) => {
        const existingIds = new Set(prev.map((g) => g.id));
        const uniqueNew = summaries.filter((g) => !existingIds.has(g.id));
        return isReset ? uniqueNew : [...prev, ...uniqueNew];
      });

      offsetRef.current += data.results.length;
      hasMoreRef.current = offsetRef.current < data.count;
    } catch {
      setError("Failed to load top-rated games.");
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPage(true);
  }, [fetchPage]);

  const updateArrows = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateArrows();
    window.addEventListener("resize", updateArrows);
    return () => window.removeEventListener("resize", updateArrows);
  }, [games, loading, updateArrows]);

  const handleScroll = (event: React.UIEvent<HTMLUListElement>) => {
    updateArrows();
    const el = event.currentTarget;
    const nearEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 400;
    if (nearEnd && hasMoreRef.current) {
      void fetchPage();
    }
  };

  function scrollByPage(direction: 1 | -1) {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.9, behavior: "smooth" });
  }

  const arrowClass =
    "flex size-9 cursor-pointer items-center justify-center rounded-xl border border-[#302438] bg-[#17191E] text-[#E6E1EA] transition-colors hover:border-[#554363] hover:bg-[#20232B] disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <section aria-labelledby="top-rated-title" className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2
            id="top-rated-title"
            className="text-[24px] font-semibold leading-[29px] tracking-[-0.5px] text-[#E6E1EA]"
          >
            Top Rated Games
          </h2>
          <p className="mt-1 text-[13px] leading-4 text-[#A0A0A8]">
            Highest-rated titles across the community and Steam metrics
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => scrollByPage(-1)}
            disabled={!canPrev}
            aria-label="Previous top rated games"
            className={arrowClass}
          >
            <ChevronLeft className="size-4" strokeWidth={1.7} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => scrollByPage(1)}
            disabled={!canNext}
            aria-label="Next top rated games"
            className={arrowClass}
          >
            <ChevronRight className="size-4" strokeWidth={1.7} aria-hidden="true" />
          </button>
        </div>
      </div>

      {error && <p className="text-xs text-[#E58B91]">{error}</p>}

      <ul
        ref={trackRef}
        onScroll={handleScroll}
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto px-1 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"

      >
        {loading && games.length === 0
          ? Array.from({ length: 5 }, (_, i) => (
              <li key={i} className={`${CARD_WIDTH} shrink-0`}>
                <div className="h-[420px] animate-pulse rounded-2xl border border-[#302438] bg-[#17191E]" />
              </li>
            ))
          : games.map((game) => (
              <li key={game.id} className={`${CARD_WIDTH} shrink-0 snap-start`}>
                <GameCard game={game} />
              </li>
            ))}
      </ul>
    </section>
  );
}