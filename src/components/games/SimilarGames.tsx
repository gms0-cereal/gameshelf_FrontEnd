import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import GameCard, { type GameSummary } from "@/components/games/GameCard";
import { getSimilarGames, type SimilarGameResult } from "@/services/Gameservice";

const API_BASE = import.meta.env.VITE_API_URL;

type SimilarResult = {
  game: {
    id: number;
    appid: number;
    title: string;
    slug: string | null;
    cover_image_url: string | null;
    header_image?: string | null;
    release_date: string | null;
    genres: string[];
  };
  score: number;
  rank: number;
  reason?: { shared_features?: string[] };
};

const toGameSummary = ({ game, score, reason }: SimilarGameResult): GameSummary => ({
  id: game.appid,
  title: game.title,
  slug: game.slug ?? String(game.appid),
  cover: game.header_image ?? game.cover_image_url ?? null,
  genres: game.genres ?? [],
  statusLabel: `${Math.round(score * 100)}% match`,
  bio: reason?.shared_features?.length
    ? `Shared: ${reason.shared_features.slice(0, 5).join(", ")}`
    : null,
  lastPlayedText: game.release_date ? `Released ${game.release_date}` : undefined,
  platform: "PC",
});

const CARD_WIDTH = "w-[260px] sm:w-[280px]";

export default function SimilarGames({ appId }: { appId: number | string }) {
  const [games, setGames] = useState<GameSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const trackRef = useRef<HTMLUListElement>(null);

    // Fetch whenever the selected game changes
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setGames([]);

    getSimilarGames(appId, controller.signal)
      .then((results) => setGames(results.map(toGameSummary)))
      .catch(() => setGames([]))
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [appId]);

  // Enable/disable the arrows based on scroll position
  const updateArrows = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    trackRef.current?.scrollTo({ left: 0 });
    updateArrows();
    window.addEventListener("resize", updateArrows);
    return () => window.removeEventListener("resize", updateArrows);
  }, [games, loading, updateArrows]);

  function scrollByPage(direction: 1 | -1) {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.9, behavior: "smooth" });
  }

  // Nothing to show: hide the whole section
  if (!loading && games.length === 0) return null;

  const arrowClass =
    "flex size-9 cursor-pointer items-center justify-center rounded-lg border border-[#55516c] bg-[#373646] text-[#e0deeb] transition-colors hover:border-[#c2ade7] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[#55516c]";

  return (
    <section aria-labelledby="similar-games-title" className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2
            id="similar-games-title"
            className="text-[24px] font-semibold leading-[29px] tracking-[-0.5px]"
          >
            Similar games
          </h2>
          <p className="mt-1 text-[13px] leading-4 text-[#b4aec7]">
            Based on shared tags and features
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => scrollByPage(-1)}
            disabled={!canPrev}
            aria-label="Previous similar games"
            className={arrowClass}
          >
            <ChevronLeft className="size-4" strokeWidth={1.7} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => scrollByPage(1)}
            disabled={!canNext}
            aria-label="Next similar games"
            className={arrowClass}
          >
            <ChevronRight className="size-4" strokeWidth={1.7} aria-hidden="true" />
          </button>
        </div>
      </div>

      <ul
        ref={trackRef}
        onScroll={updateArrows}
        role="status"
        aria-busy={loading}
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {loading
          ? Array.from({ length: 5 }, (_, i) => (
              <li key={i} className={`${CARD_WIDTH} shrink-0`}>
                <div className="h-[360px] animate-pulse rounded-xl border border-[#55516c] bg-[#373646]" />
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