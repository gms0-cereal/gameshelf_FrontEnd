import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import GameCard, { type GameSummary } from "@/components/games/GameCard";
import api from "@/lib/api";

const CARD_WIDTH = "w-[260px] sm:w-[280px]";
const GENRE_PAGE_SIZE = 24;

interface GenreBrowseSectionProps {
  primaryGenre: string;
}

export default function GenreBrowseSection({ primaryGenre }: GenreBrowseSectionProps) {
  const [games, setGames] = useState<GameSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const trackRef = useRef<HTMLUListElement>(null);
  const offsetRef = useRef(0);
  const hasMoreRef = useRef(true);
  const loadingRef = useRef(false);

  const fetchGenrePage = useCallback(async (isReset = false) => {
    if (loadingRef.current || (!hasMoreRef.current && !isReset)) return;
    loadingRef.current = true;
    if (isReset) {
      offsetRef.current = 0;
      hasMoreRef.current = true;
    }

    try {
      const { data } = await api.get("/games/steam/browse/", {
        params: {
          genre: primaryGenre.trim().toLowerCase(),
          page: Math.floor(offsetRef.current / GENRE_PAGE_SIZE) + 1,
        },
      });
      const results = Array.isArray(data) ? data : data.results || [];
      const summaries = results.map((card: any) => ({
        id: card.appid,
        title: card.name || `Game ${card.appid}`,
        slug: String(card.appid),
        cover: card.header_image,
        genres: card.genres?.length > 0 ? card.genres : ["Steam Game"],
        platforms: card.platforms || ["PC"],
        release_year: card.release_year ?? null,
        score: card.bayesian_score ?? card.community_rating ?? null,
        bayesian_score: card.bayesian_score ?? card.community_rating ?? null,
        bio: card.short_description || "Explore live community catalogs.",
      }));

      setGames((prev) => {
        const existingIds = new Set(prev.map((g) => g.id));
        const uniqueNew = summaries.filter((g: GameSummary) => !existingIds.has(g.id));
        return isReset ? uniqueNew : [...prev, ...uniqueNew];
      });

      offsetRef.current += GENRE_PAGE_SIZE;
      hasMoreRef.current = data.has_next ?? results.length === GENRE_PAGE_SIZE;
    } catch {
      // Handle error gracefully
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [primaryGenre]);

  useEffect(() => {
    setGames([]);
    setLoading(true);
    void fetchGenrePage(true);
  }, [primaryGenre, fetchGenrePage]);

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
      void fetchGenrePage();
    }
  };

  function scrollByPage(direction: 1 | -1) {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.9, behavior: "smooth" });
  }

  if (!loading && games.length === 0) return null;

  const arrowClass =
    "flex size-9 cursor-pointer items-center justify-center rounded-xl border border-[#302438] bg-[#17191E] text-[#E6E1EA] transition-colors hover:border-[#554363] hover:bg-[#20232B] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[#302438] disabled:hover:bg-[#17191E]";

  return (
    <section aria-labelledby="genre-section-title" className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2
            id="genre-section-title"
            className="text-[24px] font-semibold leading-[29px] tracking-[-0.5px] text-[#E6E1EA]"
          >
            More {primaryGenre}s for You
          </h2>
          <p className="mt-1 text-[13px] leading-4 text-[#A0A0A8]">
            Rotates automatically based on your taste profile preferences
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => scrollByPage(-1)}
            disabled={!canPrev}
            aria-label="Previous genre games"
            className={arrowClass}
          >
            <ChevronLeft className="size-4" strokeWidth={1.7} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => scrollByPage(1)}
            disabled={!canNext}
            aria-label="Next genre games"
            className={arrowClass}
          >
            <ChevronRight className="size-4" strokeWidth={1.7} aria-hidden="true" />
          </button>
        </div>
      </div>

      <ul
        ref={trackRef}
        onScroll={handleScroll}
        role="status"
        aria-busy={loading}
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto px-1 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"

      >
        {loading && games.length === 0
          ? Array.from({ length: 5 }, (_, i) => (
              <li key={i} className={`${CARD_WIDTH} shrink-0`}>
                <div className="h-[360px] animate-pulse rounded-2xl border border-[#302438] bg-[#17191E]" />
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