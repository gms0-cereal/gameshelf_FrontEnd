import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import GameCard, { type GameSummary } from "@/components/games/GameCard";
import { getFriends } from "@/services/Userservice";

const CARD_WIDTH = "w-[260px] sm:w-[280px]";

export default function FriendsActivitySection() {
  const [games, setGames] = useState<GameSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const trackRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    getFriends()
      .then((friendsList) => {
        if (cancelled || !friendsList || friendsList.length === 0) {
          setGames([]);
          setLoading(false);
          return;
        }

        const gameMap = new Map<number, GameSummary>();

        for (const friend of friendsList) {
          if (friend.favorites && friend.favorites.length > 0) {
            friend.favorites.forEach((fav) => {
              const appId = fav.steam_app_id || fav.game_id;
              if (appId && !gameMap.has(appId)) {
                gameMap.set(appId, {
                  id: appId,
                  title: fav.title,
                  slug: String(appId),
                  cover: fav.cover_image_url || `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`,
                  genres: fav.genres?.length ? fav.genres : ["Steam Game"],
                  platforms: ["PC"],
                  statusLabel: "Unplayed",
                  statusClassName: "bg-[#17191E] text-[#A0A0A8] border border-[#302438]",
                  bio: fav.description || "A favorite game of your friend.",
                  reason: `Favorite of friend @${friend.username}`,
                });
              }
            });
          }
        }

        if (!cancelled) {
          setGames(Array.from(gameMap.values()));
        }
      })
      .catch(() => {
        if (!cancelled) setGames([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

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

  const handleScroll = () => {
    updateArrows();
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
    <section aria-labelledby="friends-activity-title" className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2
            id="friends-activity-title"
            className="text-[24px] font-semibold leading-[29px] tracking-[-0.5px] text-[#E6E1EA]"
          >
            Friends Also Play
          </h2>
          <p className="mt-1 text-[13px] leading-4 text-[#A0A0A8]">
            Popular titles and favorites across your added friend network
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => scrollByPage(-1)}
            disabled={!canPrev}
            aria-label="Previous friends activity games"
            className={arrowClass}
          >
            <ChevronLeft className="size-4" strokeWidth={1.7} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => scrollByPage(1)}
            disabled={!canNext}
            aria-label="Next friends activity games"
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
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {loading
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