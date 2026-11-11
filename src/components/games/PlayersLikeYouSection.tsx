
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import GameCard, { type GameSummary } from "@/components/games/GameCard";
import {
  getPlayersLikeYou,
  type PlayersLikeYouItem,
} from "@/services/playersLikeYouService";

function playersLikeYouToSummary(
  item: PlayersLikeYouItem
): GameSummary | null {
  const g = item.game as any;
  const appId = g?.steam_app_id || g?.appid;

  if (!appId) return null;

  return {
    id: appId,
    title: g?.title || g?.name || "Untitled Game",
    slug: String(appId),
    cover:
      g?.cover_image_url ??
      g?.header_image ??
      `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`,
    genres: g?.genres?.length ? g.genres : ["Steam Game"],
    platforms: g?.platforms?.length ? g.platforms : ["PC"],
    release_year: g?.release_year ?? null,
    score: g?.bayesian_score ?? g?.community_rating ?? null,
    bio:
      g?.short_description ||
      g?.description ||
      "Explore live community catalogs and discover your next game.",
    bayesian_score: g?.bayesian_score ?? g?.community_rating ?? null,
  };
}

const CARD_WIDTH = "w-[260px] sm:w-[280px]";
const PAGE_SIZE = 20;

export default function PlayersLikeYouSection() {
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
      const data = await getPlayersLikeYou(PAGE_SIZE, offsetRef.current);

      if (data.source !== "personalized") {
        hasMoreRef.current = false;
        if (isReset) setGames([]);
        return;
      }

      const results = data.results ?? [];

      const summaries = results
        .map(playersLikeYouToSummary)
        .filter((g): g is GameSummary => g !== null);

      setGames((prev) => {
        const existingIds = new Set(prev.map((g) => g.id));
        const uniqueNew = summaries.filter((g) => !existingIds.has(g.id));

        return isReset ? uniqueNew : [...prev, ...uniqueNew];
      });

      offsetRef.current += results.length;
      hasMoreRef.current = data.has_more ?? results.length === PAGE_SIZE;
    } catch {
      setError("Failed to load Players Like You.");
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
    const nearEnd =
      el.scrollLeft + el.clientWidth >= el.scrollWidth - 400;

    if (nearEnd && hasMoreRef.current) {
      void fetchPage();
    }
  };

  function scrollByPage(direction: 1 | -1) {
    const el = trackRef.current;
    if (!el) return;

    el.scrollBy({
      left: direction * el.clientWidth * 0.9,
      behavior: "smooth",
    });
  }

  if (!loading && games.length === 0) return null;

  const arrowClass =
    "flex size-9 cursor-pointer items-center justify-center rounded-xl border border-[#302438] bg-[#17191E] text-[#E6E1EA] transition-colors hover:border-[#554363] hover:bg-[#20232B] disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <section
      aria-labelledby="players-like-you-title"
      className="flex flex-col gap-5"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2
            id="players-like-you-title"
            className="text-[24px] font-semibold leading-[29px] tracking-[-0.5px] text-[#E6E1EA]"
          >
            Players Like You Also Play
          </h2>

          <p className="mt-1 text-[13px] leading-4 text-[#A0A0A8]">
            Collaborative recommendations from users with matching game libraries
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => scrollByPage(-1)}
            disabled={!canPrev}
            aria-label="Previous players like you games"
            className={arrowClass}
          >
            <ChevronLeft
              className="size-4"
              strokeWidth={1.7}
              aria-hidden="true"
            />
          </button>

          <button
            type="button"
            onClick={() => scrollByPage(1)}
            disabled={!canNext}
            aria-label="Next players like you games"
            className={arrowClass}
          >
            <ChevronRight
              className="size-4"
              strokeWidth={1.7}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {error && <p className="text-xs text-[#E58B91]">{error}</p>}

      <ul
        ref={trackRef}
        onScroll={handleScroll}
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {loading && games.length === 0
          ? Array.from({ length: 5 }, (_, i) => (
              <li key={i} className={`${CARD_WIDTH} shrink-0`}>
                <div className="h-[420px] animate-pulse rounded-2xl border border-[#302438] bg-[#17191E]" />
              </li>
            ))
          : games.map((game) => (
              <li
                key={game.id}
                className={`${CARD_WIDTH} shrink-0 snap-start`}
              >
                <GameCard game={game} />
              </li>
            ))}
      </ul>
    </section>
  );
}
