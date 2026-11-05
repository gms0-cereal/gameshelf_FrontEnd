import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { ChevronLeft, ChevronRight, Info, ListMusic } from "lucide-react";
import {
  getMyGameList,
  getTopRatedGames,
  type SteamGameCard,
  type UserGameEntry,
} from "@/services/Gameservice";
import { Button } from "@/components/ui/button";
import GameGrid from "@/components/games/GameGrid";
import GameCard, { type GameSummary } from "@/components/games/GameCard";
import { useAuth } from "@/context/AuthContext";
import { getPlaylists, type Playlist } from "@/services/playlistService";
import { PlaylistCarouselCard } from "@/components/playlists/PlaylistCards";
import { getPlayersLikeYou, type PlayersLikeYouItem } from "@/services/playersLikeYouService";
import {
  getTasteRecommendations,
  type TasteRecommendation,
} from "@/services/tasteService";
import { getFriends } from "@/services/Userservice";
// RTK Query hooks from store
import { useGetGameSummariesQuery } from "@/store/apiSlice";

const TOP_10_HERO_IDS = [
  367520, 504230, 1030300, 620, 387290,
  774361, 730, 1369630, 1245620, 1809540,
];

const RPG_IDS = [1245620, 1809540, 1244090, 1971650];

const CURATED_IDS_STRING = Array.from(
  new Set([...TOP_10_HERO_IDS, ...RPG_IDS])
).join(",");

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  playing: { label: "Playing", className: "bg-[#20232B] text-[#B39ACF] border border-[#302438]" },
  completed: { label: "Completed", className: "bg-[#10251F] text-[#34D399] border border-[#302438]" },
  on_hold: { label: "On Hold", className: "bg-[#20232B] text-[#B39ACF] border border-[#302438]" },
  plan_to_play: { label: "Plan to Play", className: "bg-[#17191E] text-[#A0A0A8] border border-[#302438]" },
  dropped: { label: "Dropped", className: "bg-[#2B171C] text-[#E58B91] border border-[#E58B91]/40" },
  unplayed: { label: "Unplayed", className: "bg-[#17191E] text-[#A0A0A8] border border-[#302438]" },
};

function toGameSummary(card: SteamGameCard, userEntry?: UserGameEntry): GameSummary {
  const statusKey = userEntry ? userEntry.status : "unplayed";
  const statusStyle = STATUS_STYLES[statusKey] || STATUS_STYLES.unplayed;

  return {
    id: card.appid,
    title: card.name || `Game ${card.appid}`,
    slug: String(card.appid),
    cover: card.header_image,
    genres: card.genres?.length > 0 ? card.genres : ["Steam Game"],
    platforms: card.platforms || ["PC"],
    release_year: card.release_year ?? null,
    score: card.score ?? (card.community_rating !== null ? card.community_rating : null),
    price: card.price ?? null,
    statusLabel: statusStyle.label,
    statusClassName: statusStyle.className,
    bio: card.short_description || "Explore live community catalogs and add this title to your shelf.",
  };
}

function pickSummaries(
  ids: number[],
  cardsMap: Map<number, SteamGameCard>,
  userListMap: Map<string, UserGameEntry>
): GameSummary[] {
  return ids
    .map((id) => cardsMap.get(id))
    .filter((card): card is SteamGameCard => Boolean(card))
    .map((card) => toGameSummary(card, userListMap.get(String(card.appid))));
}

function recommendationBio(reason?: TasteRecommendation["reason"]) {
  if (reason?.similar_to) return `Because you like ${reason.similar_to}.`;
  const matched = [...(reason?.matched_genres ?? []), ...(reason?.matched_tags ?? [])];
  return matched.length > 0
    ? `Matches your interests: ${matched.slice(0, 4).join(", ")}.`
    : "Recommended based on your interests.";
}

function recommendationToSummary(rec: TasteRecommendation): GameSummary | null {
  const appId = rec.game.appid;
  if (!appId) return null;

  return {
    id: appId,
    title: rec.game.title,
    slug: String(appId),
    cover:
      rec.game.header_image ??
      rec.game.cover_image_url ??
      `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`,
    genres: rec.game.genres?.length ? rec.game.genres : ["Steam Game"],
    platforms: rec.game.platforms?.length ? rec.game.platforms : ["PC"],
    statusLabel: STATUS_STYLES.unplayed.label,
    statusClassName: STATUS_STYLES.unplayed.className,
    bio: recommendationBio(rec.reason),
  };
}

function playersLikeYouToSummary(item: PlayersLikeYouItem): GameSummary | null {
  const appId = item.game.steam_app_id;
  if (!appId) return null;

  return {
    id: appId,
    title: item.game.title,
    slug: String(appId),
    cover:
      item.game.cover_image_url ??
      `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`,
    genres: item.game.genres?.length ? item.game.genres : ["Steam Game"],
    platforms: ["PC"],
    statusLabel: "Unplayed",
    statusClassName: STATUS_STYLES.unplayed.className,
    bio: item.reason_text || "Players with similar taste liked this",
  };
}

export default function Home() {
  const [heroIndex, setHeroIndex] = useState(0);
  //const [userListMap, setUserListMap] = useState>(new Map());
  const [userListMap, setUserListMap] = useState<Map<string, UserGameEntry>>(new Map());
  const { user } = useAuth();

  // Community Playlists State
  const [communityPlaylists, setCommunityPlaylists] = useState<Playlist[]>([]);
  const [playlistsLoading, setPlaylistsLoading] = useState(true);
  const [playlistsError, setPlaylistsError] = useState<string | null>(null);

  // Carousel refs
  const carouselRef = useRef<HTMLDivElement>(null);
  const scrollCarousel = (dir: 1 | -1) =>
    carouselRef.current?.scrollBy({ left: dir * 380, behavior: "smooth" });

  const recommendedRef = useRef<HTMLDivElement>(null);
  const scrollRecommended = (dir: 1 | -1) =>
    recommendedRef.current?.scrollBy({
      left: dir * (recommendedRef.current.clientWidth * 0.8),
      behavior: "smooth",
    });

  const playersRef = useRef<HTMLDivElement>(null);
  const scrollPlayers = (dir: 1 | -1) =>
    playersRef.current?.scrollBy({
      left: dir * (playersRef.current.clientWidth * 0.8),
      behavior: "smooth",
    });

  // Friends Also Play refs and states
  const friendsPlayRef = useRef<HTMLDivElement>(null);
  const scrollFriendsPlay = (dir: 1 | -1) =>
    friendsPlayRef.current?.scrollBy({
      left: dir * (friendsPlayRef.current.clientWidth * 0.8),
      behavior: "smooth",
    });
  const [friendsGames, setFriendsGames] = useState<GameSummary[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(true);

  // Players Like You State
  const [playersGames, setPlayersGames] = useState<GameSummary[]>([]);
  const [playersLoading, setPlayersLoading] = useState(true);
  const [playersError, setPlayersError] = useState<string | null>(null);

  const topRatedRef = useRef<HTMLDivElement>(null);
  const scrollTopRated = (dir: 1 | -1) =>
    topRatedRef.current?.scrollBy({
      left: dir * (topRatedRef.current.clientWidth * 0.8),
      behavior: "smooth",
    });

  const [topRatedCards, setTopRatedCards] = useState<SteamGameCard[]>([]);
  const [topRatedLoading, setTopRatedLoading] = useState(true);
  const [topRatedError, setTopRatedError] = useState<string | null>(null);

  // Recommended for You State
  const [recommendedGames, setRecommendedGames] = useState<GameSummary[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(true);
  const [recommendationsError, setRecommendationsError] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Fetch taste-based recommendations
  useEffect(() => {
    if (!user) {
      setRecommendedGames([]);
      setRecommendationsLoading(false);
      return;
    }

    let cancelled = false;
    setRecommendationsLoading(true);
    setRecommendationsError(null);

    getTasteRecommendations()
      .then((data) => {
        if (cancelled) return;
        setRecommendedGames(
          (data.results ?? [])
            .map(recommendationToSummary)
            .filter((g): g is GameSummary => g !== null)
        );
      })
      .catch(() => {
        if (!cancelled) setRecommendationsError("Failed to load recommendations.");
      })
      .finally(() => {
        if (!cancelled) setRecommendationsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // Fetch Players Like You
  useEffect(() => {
    if (!user) {
      setPlayersGames([]);
      setPlayersLoading(false);
      return;
    }

    const controller = new AbortController();
    setPlayersLoading(true);
    setPlayersError(null);

    getPlayersLikeYou(20, controller.signal)
      .then((data) => {
        if (data.source !== "personalized") {
          setPlayersGames([]);
          return;
        }
        setPlayersGames(
          data.results
            .map(playersLikeYouToSummary)
            .filter((g): g is GameSummary => g !== null)
        );
      })
      .catch(() => {
        if (!controller.signal.aborted) setPlayersError("Failed to load Players Like You.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setPlayersLoading(false);
      });

    return () => controller.abort();
  }, [user?.id]);

  // Fetch Friends Also Play (Friends' favorite games)
  useEffect(() => {
    if (!user) {
      setFriendsGames([]);
      setFriendsLoading(false);
      return;
    }

    let cancelled = false;
    setFriendsLoading(true);

    getFriends()
      .then(async (friendsList) => {
        if (cancelled || !friendsList || friendsList.length === 0) {
          setFriendsGames([]);
          setFriendsLoading(false);
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
                  statusLabel: STATUS_STYLES.unplayed.label,
                  statusClassName: STATUS_STYLES.unplayed.className,
                  bio: `Favorite of friend @${friend.username}`,
                });
              }
            });
          }
        }

        if (!cancelled) {
          setFriendsGames(Array.from(gameMap.values()));
        }
      })
      .catch(() => {
        if (!cancelled) setFriendsGames([]);
      })
      .finally(() => {
        if (!cancelled) setFriendsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // Fetch top rated games
  useEffect(() => {
    const controller = new AbortController();
    setTopRatedLoading(true);
    setTopRatedError(null);

    getTopRatedGames(20, controller.signal)
      .then(setTopRatedCards)
      .catch(() => {
        if (!controller.signal.aborted) setTopRatedError("Failed to load top rated games.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setTopRatedLoading(false);
      });

    return () => controller.abort();
  }, [user?.id]);

  // Fetch User's Game List to map statuses
  useEffect(() => {
    let cancelled = false;

    getMyGameList()
      .then((data) => {
        if (cancelled) return;
        const map = new Map<string, UserGameEntry>();
        data.results.forEach((entry) => {
          if (entry.steam_app_id) {
            map.set(String(entry.steam_app_id), entry);
          }
        });
        setUserListMap(map);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch Community Playlists
  useEffect(() => {
    let cancelled = false;

    getPlaylists({ limit: 8, offset: 0 })
      .then(({ results }) => {
        if (!cancelled) setCommunityPlaylists(results);
      })
      .catch(() => {
        if (!cancelled) setPlaylistsError("Failed to load community playlists.");
      })
      .finally(() => {
        if (!cancelled) setPlaylistsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // RTK Query: Fetch Curated Hero & Section Games
  const { data: curatedData } = useGetGameSummariesQuery(CURATED_IDS_STRING);

  const curatedCardsMap = useMemo(() => {
    const map = new Map<number, SteamGameCard>();
    curatedData?.results?.forEach((card: SteamGameCard) => map.set(card.appid, card));
    return map;
  }, [curatedData]);

  // Derived memoized summaries
  const heroGames = useMemo(
    () => pickSummaries(TOP_10_HERO_IDS, curatedCardsMap, userListMap),
    [curatedCardsMap, userListMap]
  );
  const rpgGames = useMemo(
    () => pickSummaries(RPG_IDS, curatedCardsMap, userListMap),
    [curatedCardsMap, userListMap]
  );

  const topRatedGames = useMemo(
    () =>
      topRatedCards.map((card) => {
        const summary = toGameSummary(card, userListMap.get(String(card.appid)));
        return {
          ...summary,
          score: card.bayesian_score ?? card.community_rating ?? null,
          bio:
            card.rating_count > 0
              ? `${card.community_rating?.toFixed(1)} average from ${card.rating_count} ${
                  card.rating_count === 1 ? "rating" : "ratings"
                }.`
              : summary.bio,
        };
      }),
    [topRatedCards, userListMap]
  );

  useEffect(() => {
    if (heroGames.length <= 1 || isHovered) return;

    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev < heroGames.length - 1 ? prev + 1 : 0));
    }, 7000);

    return () => clearInterval(timer);
  }, [heroGames.length, isHovered]);

  return (
    <div className="min-h-screen w-full bg-[#000000]">
      <div
        className="flex min-h-screen w-full flex-col bg-[#000000] text-[#E6E1EA] antialiased"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <Navbar />
        <main className="flex flex-1 flex-col gap-8 px-5 pb-16 pt-11 md:px-8 xl:px-16">
          {/* Welcome header */}
          <div className="flex min-h-[65px] flex-wrap items-center justify-between gap-4">
            <div className="flex flex-col gap-2">
              <p className="text-[13px] leading-4 text-[#B39ACF] uppercase tracking-wider">
                WELCOME BACK, {user?.nickname || user?.username || "Player"}
              </p>
              <h1 className="text-[36px] font-semibold leading-[41px] tracking-[-0.8px] text-[#E6E1EA]">Home</h1>
            </div>
          </div>

          {/* Hero Banner */}
          <section
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="relative min-h-[420px] w-full overflow-hidden rounded-2xl bg-[#17191E] border border-[#302438] xl:h-[440px]"
          >
            {/* Horizontal Sliding Track */}
            <div
              className="flex h-full w-full transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(-${heroIndex * 100}%)` }}
            >
              {heroGames.map((hero) => (
                <div
                  key={hero.id}
                  className="relative flex min-h-[420px] w-full flex-shrink-0 items-end px-6 py-10 md:px-11 xl:h-[440px]"
                >
                  <img
                    src={hero.cover || ""}
                    alt={hero.title}
                    fetchPriority="high"
                    loading="eager"
                    className="absolute inset-0 h-full w-full object-cover object-center contrast-110 saturate-125 brightness-105"
                  />
                  {/* Gradient overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#17191E] via-[#17191E]/60 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#17191E]/90 via-transparent to-transparent" />

                  {/* Hero Card Text Content */}
                  <div className="relative z-10 flex w-full max-w-[640px] flex-col gap-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[2px] text-[#34D399]">
                      TOP RATED THIS MONTH
                    </p>
                    <h2 className="text-[32px] font-bold leading-tight tracking-[-0.5px] text-[#E6E1EA] drop-shadow-md md:text-[46px]">
                      {hero.title}
                    </h2>
                    <p className="line-clamp-2 text-[14px] leading-relaxed text-[#A0A0A8] drop-shadow">
                      {hero.bio}
                    </p>
                    <div className="flex items-center gap-4 pt-2">
                      <Button
                        asChild
                        className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#B39ACF] px-6 text-[14px] font-semibold text-[#17191E] hover:bg-[#C2ADE0]"
                      >
                        <Link to={`/gamedetails/${hero.slug}`}>
                          <Info className="size-4 text-[#17191E]" /> Details
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Top Right Controls & Slide Indicators */}
            <div className="absolute right-6 top-6 z-20 flex items-center gap-3">
              <span className="text-xs font-medium text-[#E6E1EA]">
                {heroIndex + 1} / {Math.max(heroGames.length, 1)}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setHeroIndex((prev) => (prev > 0 ? prev - 1 : heroGames.length - 1))
                  }
                  className="size-8 rounded-lg border-[#302438] bg-[#17191E]/80 text-[#E6E1EA] hover:bg-[#20232B]"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setHeroIndex((prev) =>
                      prev < heroGames.length - 1 ? prev + 1 : 0
                    )
                  }
                  className="size-8 rounded-lg border-[#302438] bg-[#17191E]/80 text-[#E6E1EA] hover:bg-[#20232B]"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          </section>

{/* RPGs Section */}
          <section className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-col">
                <h2 className="text-[24px] font-semibold leading-[29px] tracking-[-0.5px] text-[#E6E1EA]">
                  More RPGs for you
                </h2>
                <p className="mt-1 text-[13px] leading-4 text-[#A0A0A8]">
                  Inspired by your favorite genre
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const el = document.getElementById("rpg-scroll-track");
                    el?.scrollBy({ left: -el.clientWidth * 0.8, behavior: "smooth" });
                  }}
                  aria-label="Scroll left"
                  className="size-8 rounded-lg border-[#302438] bg-[#17191E] text-[#E6E1EA] hover:bg-[#20232B]"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const el = document.getElementById("rpg-scroll-track");
                    el?.scrollBy({ left: el.clientWidth * 0.8, behavior: "smooth" });
                  }}
                  aria-label="Scroll right"
                  className="size-8 rounded-lg border-[#302438] bg-[#17191E] text-[#E6E1EA] hover:bg-[#20232B]"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>

            {rpgGames.length === 0 ? (
              <p role="status" className="text-sm text-[#A0A0A8]">
                Loading RPGs…
              </p>
            ) : (
              <div
                id="rpg-scroll-track"
                className="-mx-1 overflow-x-auto px-1 pt-2 pb-3 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                <div className="flex gap-5">
                  {rpgGames.map((game) => (
                   <div
                      key={game.id}
                      className="w-[260px] shrink-0 snap-start sm:w-[280px] md:w-[300px]"
                    >
                      <GameCard game={game} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Top Rated */}
          {(topRatedLoading || topRatedError || topRatedGames.length > 0) && (
            <section aria-labelledby="top-rated-title" className="flex flex-col gap-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-col">
                  <h2
                    id="top-rated-title"
                    className="text-[24px] font-semibold leading-[29px] tracking-[-0.5px] text-[#E6E1EA]"
                  >
                    Top Rated on GameShelf Players
                  </h2>
                  <p className="mt-1 text-[13px] leading-4 text-[#A0A0A8]">
                    Highest-rated games based on ratings from GameShelf players.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => scrollTopRated(-1)}
                    aria-label="Scroll left"
                    className="size-8 rounded-lg border-[#302438] bg-[#17191E] text-[#E6E1EA] hover:bg-[#20232B]"
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => scrollTopRated(1)}
                    aria-label="Scroll right"
                    className="size-8 rounded-lg border-[#302438] bg-[#17191E] text-[#E6E1EA] hover:bg-[#20232B]"
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>

              {topRatedError && (
                <p role="alert" className="text-sm text-[#E58B91]">
                  {topRatedError}
                </p>
              )}
              {topRatedLoading && (
                <p role="status" className="text-sm text-[#A0A0A8]">
                  Loading top rated games…
                </p>
              )}

              {!topRatedLoading && !topRatedError && topRatedGames.length > 0 && (
                <div
                  ref={topRatedRef}
                  className="-mx-1 overflow-x-auto px-1 pt-2 pb-3 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                  <div className="flex gap-5">
                    {topRatedGames.map((game) => (
                     <div
                        key={game.id}
                        className="w-[260px] shrink-0 snap-start sm:w-[280px] md:w-[300px]"
                      >
                        <GameCard game={game} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Recommended for You */}
          <section aria-labelledby="taste-recommendations-title" className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-col">
                <h2
                  id="taste-recommendations-title"
                  className="text-[24px] font-semibold leading-[29px] tracking-[-0.5px] text-[#E6E1EA]"
                >
                  Recommended for You
                </h2>
                <p className="mt-1 text-[13px] leading-4 text-[#A0A0A8]">
                  Games selected based on your genres, platforms, and liked games.
                </p>
                <Link
                  to="/interests"
                  className="mt-1 text-[13px] leading-4 text-[#B39ACF] hover:underline"
                >
                  Tune your suggestions: edit genres and liked games →
                </Link>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => scrollRecommended(-1)}
                  aria-label="Scroll left"
                  className="size-8 rounded-lg border-[#302438] bg-[#17191E] text-[#E6E1EA] hover:bg-[#20232B]"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => scrollRecommended(1)}
                  aria-label="Scroll right"
                  className="size-8 rounded-lg border-[#302438] bg-[#17191E] text-[#E6E1EA] hover:bg-[#20232B]"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>

            {recommendationsError && (
              <p role="alert" className="text-sm text-[#E58B91]">
                {recommendationsError}
              </p>
            )}

            {recommendationsLoading && (
              <p role="status" className="text-sm text-[#A0A0A8]">
                Loading recommendations…
              </p>
            )}

            {!recommendationsLoading && !recommendationsError && recommendedGames.length === 0 && (
              <p className="text-sm text-[#A0A0A8]">
                No recommendations yet. Update your interests to get personalized suggestions.
              </p>
            )}

            {!recommendationsLoading && !recommendationsError && recommendedGames.length > 0 && (
              <div
                ref={recommendedRef}
                className="-mx-1 overflow-x-auto px-1 pt-2 pb-3 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                <div className="flex gap-5">
                  {recommendedGames.map((game) => (
                   <div
                      key={game.id}
                      className="w-[260px] shrink-0 snap-start sm:w-[280px] md:w-[300px]"
                    >
                      <GameCard game={game} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

{/* Players Like You */}
          {user && (
            <section aria-labelledby="players-like-you-title" className="flex flex-col gap-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-col">
                  <h2
                    id="players-like-you-title"
                    className="text-[24px] font-semibold leading-[29px] tracking-[-0.5px] text-[#E6E1EA]"
                  >
                    Players Like You
                  </h2>
                  <p className="mt-1 text-[13px] leading-4 text-[#A0A0A8]">
                    Discover games you may enjoy based on the preferences and ratings of players with
                    similar gaming tastes.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => scrollPlayers(-1)}
                    aria-label="Scroll left"
                    className="size-8 rounded-lg border-[#302438] bg-[#17191E] text-[#E6E1EA] hover:bg-[#20232B]"
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => scrollPlayers(1)}
                    aria-label="Scroll right"
                    className="size-8 rounded-lg border-[#302438] bg-[#17191E] text-[#E6E1EA] hover:bg-[#20232B]"
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>

              {playersError && (
                <p role="alert" className="text-sm text-[#E58B91]">
                  {playersError}
                </p>
              )}

              {playersLoading && (
                <p role="status" className="text-sm text-[#A0A0A8]">
                  Loading Players Like You…
                </p>
              )}

              {!playersLoading && !playersError && playersGames.length === 0 && (
                <p className="text-sm text-[#A0A0A8]">
                  No player suggestions yet. Rate more games to connect with players who share your tastes.
                </p>
              )}

              {!playersLoading && !playersError && playersGames.length > 0 && (
                <div
                  ref={playersRef}
                  className="-mx-1 overflow-x-auto px-1 pt-2 pb-3 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                  <div className="flex gap-5">
                    {playersGames.map((game) => (
                      <div
                        key={game.id}
                        className="w-[300px] sm:w-[340px] md:w-[360px] shrink-0 snap-start"
                      >
                        <GameCard game={game} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Your Friends Also Play */}
          {user && !friendsLoading && friendsGames.length > 0 && (
            <section aria-labelledby="friends-also-play-title" className="flex flex-col gap-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-col">
                  <h2
                    id="friends-also-play-title"
                    className="text-[24px] font-semibold leading-[29px] tracking-[-0.5px] text-[#E6E1EA]"
                  >
                    Your Friends Also Play
                  </h2>
                  <p className="mt-1 text-[13px] leading-4 text-[#A0A0A8]">
                    Explore the favorite games of the players on your friends list.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => scrollFriendsPlay(-1)}
                    aria-label="Scroll left"
                    className="size-8 rounded-lg border-[#302438] bg-[#17191E] text-[#E6E1EA] hover:bg-[#20232B]"
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => scrollFriendsPlay(1)}
                    aria-label="Scroll right"
                    className="size-8 rounded-lg border-[#302438] bg-[#17191E] text-[#E6E1EA] hover:bg-[#20232B]"
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>

              <div
                ref={friendsPlayRef}
                className="-mx-1 overflow-x-auto px-1 pt-2 pb-3 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                <div className="flex gap-5">
                  {friendsGames.map((game) => (
                    <div
                      key={game.id}
                      className="w-[260px] shrink-0 snap-start sm:w-[280px] md:w-[300px]"
                    >
                      <GameCard game={game} />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Community Playlists Section */}
          <section id="community-playlists" aria-labelledby="community-playlists-title" className="flex flex-col gap-5">
            <div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 id="community-playlists-title" className="text-[24px] font-semibold leading-[29px] tracking-[-0.5px] text-[#E6E1EA]">
                    Community Playlists
                  </h2>
                  <p className="mt-1 text-[13px] leading-4 text-[#A0A0A8]">Discover what other players are curating</p>
                  <Link to="/playlists" className="text-[13px] text-[#B39ACF] hover:underline">
                    View more →
                  </Link>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to="/playlists/new"
                    className="mr-2 rounded-xl bg-[#B39ACF] px-4 py-2.5 text-[13px] font-semibold text-[#17191E] hover:bg-[#C2ADE0]"
                  >
                    Create playlist
                  </Link>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => scrollCarousel(-1)}
                    aria-label="Scroll left"
                    className="size-8 rounded-lg border-[#302438] bg-[#17191E] text-[#E6E1EA] hover:border-[#554363] hover:bg-[#20232B]"
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => scrollCarousel(1)}
                    aria-label="Scroll right"
                    className="size-8 rounded-lg border-[#302438] bg-[#17191E] text-[#E6E1EA] hover:border-[#554363] hover:bg-[#20232B]"
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            </div>

            {playlistsLoading && <p role="status" className="text-sm text-[#A0A0A8]">Loading community playlists…</p>}
            {playlistsError && <p role="alert" className="text-sm text-[#E58B91]">{playlistsError}</p>}

            {!playlistsLoading && !playlistsError && communityPlaylists.length === 0 && (
              <div className="rounded-2xl border border-dashed border-[#302438] bg-[#17191E] px-6 py-10 text-center">
                <ListMusic className="mx-auto size-8 text-[#A0A0A8]" strokeWidth={1.5} />
                <p className="mt-3 text-sm text-[#A0A0A8]">No public playlists yet. Be the first to share one.</p>
              </div>
            )}

            {!playlistsLoading && !playlistsError && communityPlaylists.length > 0 && (
              <div ref={carouselRef} className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {communityPlaylists.map((playlist) => (
                  <PlaylistCarouselCard key={playlist.id} playlist={playlist} />
                ))}
              </div>
            )}
          </section>
        </main>
        <Footer />
      </div>
    </div>
  );
}