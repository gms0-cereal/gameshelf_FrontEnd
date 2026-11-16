
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import GameCard, { type GameSummary } from "@/components/games/GameCard";
import {
  getSimilarGames,
  type SimilarGameResult,
} from "@/services/Gameservice";

const toGameSummary = ({
  game,
  reason,
}: SimilarGameResult): GameSummary => {
  const releaseYear = game.release_date
    ? new Date(game.release_date).getFullYear()
    : null;

  const g = game as any;
  const bayesianScore = g.bayesian_score ?? g.community_rating ?? null;

  return {
    id: game.appid,
    title: game.title,
    slug: game.slug ?? String(game.appid),
    cover: game.header_image ?? game.cover_image_url ?? null,
    genres: game.genres ?? [],
    platforms: ["PC"],
    release_year: releaseYear,
    score: bayesianScore,
    bayesian_score: bayesianScore,
    bio: reason?.shared_features?.length
      ? `Shared: ${reason.shared_features.slice(0, 5).join(", ")}`
      : undefined,
  };
};

interface RelatedArchiveProps {
  appId: number | string;
}

export default function RelatedArchive({ appId }: RelatedArchiveProps) {
  const [games, setGames] = useState<GameSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const trackRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!appId) {
      setGames([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    setLoading(true);
    setGames([]);

    getSimilarGames(appId, controller.signal)
      .then((results) => {
        if (!controller.signal.aborted) {
          setGames(results.map(toGameSummary));
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setGames([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [appId]);

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

  const scrollByPage = (direction: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;

    el.scrollBy({
      left: direction * el.clientWidth,
      behavior: "smooth",
    });
  };

  const arrowClass =
    "flex size-9 cursor-pointer items-center justify-center rounded-lg border border-[#302438] bg-[#111216] text-[#E6E1EA] transition-colors hover:border-[#554363] hover:bg-[#20232B] disabled:cursor-not-allowed disabled:opacity-30";

  return (
    <section
      aria-labelledby="related-archive-title"
      className="rounded-xl border border-[#302438] bg-[#17191E] p-6 sm:p-7"
    >
      {/* Heading and navigation */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B39ACF]">
            07 / Related Archive
          </p>

          <h2
            id="related-archive-title"
            className="text-xl font-semibold tracking-wide text-[#E6E1EA]"
          >
            Similar Games
          </h2>

          <p className="mt-1 text-xs text-[#A0A0A8]">
            Based on shared tags and features
          </p>
        </div>

        {!loading && games.length > 0 && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => scrollByPage(-1)}
              disabled={!canPrev}
              aria-label="Previous similar games"
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
              aria-label="Next similar games"
              className={arrowClass}
            >
              <ChevronRight
                className="size-4"
                strokeWidth={1.7}
                aria-hidden="true"
              />
            </button>
          </div>
        )}
      </div>

      {/* Carousel */}
      {loading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="h-[360px] animate-pulse rounded-xl border border-[#302438] bg-[#111216]"
            />
          ))}
        </div>
      ) : games.length > 0 ? (
        <ul
          ref={trackRef}
          onScroll={updateArrows}
          aria-busy={loading}
          className="flex snap-x snap-mandatory gap-5 overflow-x-auto px-1 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {games.map((game) => (
            <li
              key={game.id}
              className="w-full shrink-0 snap-start md:w-[calc((100%-1.25rem)/2)]"
            >
              <GameCard game={game} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex min-h-[180px] flex-col items-center justify-center rounded-lg border border-[#302438] bg-[#111216] px-5 py-8 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8F7BAC]">
            Related Archive / No Records
          </p>

          <h3 className="mt-3 text-lg font-medium text-[#E6E1EA]">
            Nothing in the neighboring shelves.
          </h3>

          <p className="mt-2 text-xs text-[#777780]">
            Similar games haven't been discovered for this title yet.
          </p>
        </div>
      )}

      {!loading && games.length > 0 && (
        <p className="mt-3 text-right text-[9px] uppercase tracking-[0.16em] text-[#777780]">
          {games.length} related {games.length === 1 ? "title" : "titles"} found
        </p>
      )}
    </section>
  );
}
