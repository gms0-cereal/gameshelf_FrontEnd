import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { ChevronLeft, ChevronRight, Info, ListMusic } from "lucide-react";
import {
  getMyGameList,
  getSimilarGames,
  type SimilarGameResult,
  type SteamGameCard,
  type UserGameEntry,
} from "@/services/Gameservice";
import { Button } from "@/components/ui/button";
import GameGrid from "@/components/games/GameGrid";
import { useAuth } from "@/context/AuthContext";
import { getPlaylists, type Playlist } from "@/services/playlistService";
import { PlaylistCarouselCard } from "@/components/playlists/PlaylistCards";

// RTK Query hooks from store
import { 
  useGetGameSummariesQuery, 
  useGetGameListQuery 
} from "@/store/apiSlice";

const STEAM_PAGE_SIZE = 12;

const TOP_10_HERO_IDS = [
  367520, 504230, 1030300, 620, 387290, 
  774361, 730, 1369630, 1245620, 1809540,
];

// const HOLLOW_KNIGHT_IDS = [367520, 774361, 1369630, 504230];
const RPG_IDS = [1245620, 1809540, 1244090, 1971650];

const CURATED_IDS_STRING = Array.from(
  new Set([...TOP_10_HERO_IDS, ...HOLLOW_KNIGHT_IDS, ...RPG_IDS])
).join(",");

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  playing: { label: "Playing", className: "bg-[#e0e7ff] text-[#3730a3]" },
  completed: { label: "Completed", className: "bg-[#dcfce7] text-[#166534]" },
  on_hold: { label: "On Hold", className: "bg-[#fef3c7] text-[#92400e]" },
  plan_to_play: { label: "Plan to Play", className: "bg-[#ede9fe] text-[#5b21b6]" },
  dropped: { label: "Dropped", className: "bg-[#fee2e2] text-[#991b1b]" },
  unplayed: { label: "Unplayed", className: "bg-[#2a2838] text-[#b4aec7] border border-[#55516c]" },
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

export default function Home() {
  const [heroIndex, setHeroIndex] = useState(0);
  const [userListMap, setUserListMap] = useState<Map<string, UserGameEntry>>(new Map());

  // 1. Fetch User's Game List to map statuses (Fixes unused 'setUserListMap')
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
  const [cursors, setCursors] = useState<number[]>([0]);
  const currentCursor = cursors[cursors.length - 1];
  const pageNumber = cursors.length;

  const { user } = useAuth();
  
  // Community Playlists State
  const [communityPlaylists, setCommunityPlaylists] = useState<Playlist[]>([]);
  const [playlistsLoading, setPlaylistsLoading] = useState(true);
  const [playlistsError, setPlaylistsError] = useState<string | null>(null);

  const carouselRef = useRef<HTMLDivElement>(null);
  const scrollCarousel = (dir: 1 | -1) =>
    carouselRef.current?.scrollBy({ left: dir * 380, behavior: "smooth" });

  // Fetch Community Playlists with lazy-loading support
  useEffect(() => {
    let cancelled = false;

    getPlaylists({ limit: 4, offset: 0 })
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

  // 1. RTK Query: Fetch Curated Hero/Section Games in 1 Cached Request
  const { data: curatedData } = useGetGameSummariesQuery(CURATED_IDS_STRING);
  
  const curatedCardsMap = useMemo(() => {
    const map = new Map<number, SteamGameCard>();
    curatedData?.results?.forEach((card: SteamGameCard) => map.set(card.appid, card));
    return map;
  }, [curatedData]);

  // 2. RTK Query: Fetch Steam Catalog List with Pagination & Expansion
  const { data: catalogData, isLoading: catalogLoading, error: catalogError } = useGetGameListQuery({
    limit: STEAM_PAGE_SIZE,
    last_appid: currentCursor,
    expand: "1",
  });

  const catalogGames: SteamGameCard[] = catalogData?.games || [];
  const nextCursor = catalogData?.last_appid || null;
  const hasMore = Boolean(catalogData?.have_more_results && nextCursor);

  // Derived memoized summaries
  const heroGames = useMemo(
    () => pickSummaries(TOP_10_HERO_IDS, curatedCardsMap, userListMap),
    [curatedCardsMap, userListMap]
  );
  const hollowKnightGames = useMemo(
    () => pickSummaries(HOLLOW_KNIGHT_IDS, curatedCardsMap, userListMap),
    [curatedCardsMap, userListMap]
  );
  const rpgGames = useMemo(
    () => pickSummaries(RPG_IDS, curatedCardsMap, userListMap),
    [curatedCardsMap, userListMap]
  );
  const steamSummaries = useMemo(
    () => catalogGames.map((card) => toGameSummary(card, userListMap.get(String(card.appid)))),
    [catalogGames, userListMap]
  );

  function goToNextPage() {
    if (hasMore && nextCursor !== null) {
      setCursors((previous) => [...previous, nextCursor]);
    }
  }

  function goToPreviousPage() {
    if (pageNumber > 1) {
      setCursors((previous) => previous.slice(0, -1));
    }
  }

  const currentHero = heroGames[heroIndex] || null;

  return (
    <div className="min-h-screen bg-[#201e2f]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col bg-[#201e2f] text-[#e0deeb] antialiased">
        <Navbar />
        <main className="flex flex-1 flex-col gap-8 px-5 pb-16 pt-11 md:px-8 xl:px-16">
          {/* Welcome header */}
          <div className="flex min-h-[65px] flex-wrap items-center justify-between gap-4">
            <div className="flex flex-col gap-2">
              <p className="text-[13px] leading-4 text-[#b4aec7] uppercase tracking-wider">
                WELCOME BACK, {user?.nickname || user?.username || "Player"}
              </p>
              <h1 className="text-[36px] font-semibold leading-[41px] tracking-[-0.8px]">Home</h1>
            </div>
          </div>

          {/* Hero Banner (Above-the-fold: fetchPriority high) */}
          <section className="relative flex min-h-[420px] items-end overflow-hidden rounded-2xl bg-[#201e2f] px-6 py-10 md:px-11 xl:h-[440px]">
            {currentHero && (
              <img
                src={currentHero.cover || ""}
                alt={currentHero.title}
                fetchPriority="high"
                loading="eager"
                className="absolute inset-0 h-full w-full object-cover object-center filter brightness-95"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#201e2f] via-[#201e2f]/50 to-transparent" />
            <div className="absolute right-6 top-6 z-20 flex items-center gap-3">
              <span className="text-xs font-medium text-[#e0deeb]">
                {heroIndex + 1} / {Math.max(heroGames.length, 1)}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setHeroIndex((prev) => (prev > 0 ? prev - 1 : heroGames.length - 1))}
                  className="size-8 rounded-lg border-[#55516c] bg-[#373646]/80 text-[#e0deeb] hover:bg-[#454256]"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setHeroIndex((prev) => (prev < heroGames.length - 1 ? prev + 1 : 0))}
                  className="size-8 rounded-lg border-[#55516c] bg-[#373646]/80 text-[#e0deeb] hover:bg-[#454256]"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
            <div className="relative z-10 flex w-full max-w-[640px] flex-col gap-4">
              <p className="text-[11px] leading-[13px] tracking-[2px] text-[#c2ade7] font-semibold">
                TOP RATED THIS MONTH
              </p>
              <h2 className="text-[32px] font-bold leading-tight tracking-[-0.5px] md:text-[46px]">
                {currentHero ? currentHero.title : "Loading featured games..."}
              </h2>
              <p className="line-clamp-2 text-[14px] leading-relaxed text-[#b4aec7]">
                {currentHero ? currentHero.bio : "Explore top-tier titles trending across the community."}
              </p>
              {currentHero && (
                <Button asChild className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#a8484c] px-6 text-[14px] font-semibold text-[#e0deeb] hover:bg-[#ae494e]">
                  <Link to={`/gamedetails/${currentHero.slug}`}>
                    <Info className="size-4" /> Details
                  </Link>
                </Button>
              )}
            </div>
          </section>

          {/* Hollow Knight Section */}
          <section className="flex flex-col gap-8">
            <h2 className="text-[24px] font-semibold leading-[29px] tracking-[-0.5px]">Because you played Hollow Knight</h2>
            <GameGrid games={hollowKnightGames} loading={hollowKnightGames.length === 0} />
          </section> */}

          {/* Because you completed ... */}
          {(similarLoading || completedEntry) && (
            <section aria-labelledby="because-completed-title" className="flex flex-col gap-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-col">
                  <h2
                    id="because-completed-title"
                    className="text-[24px] font-semibold leading-[29px] tracking-[-0.5px]"
                  >
                    {completedEntry ? (
                      <>
                        Because you completed{" "}
                        <Link
                          to={`/gamedetails/${completedEntry.steam_app_id}`}
                          className="text-[#c2ade7] hover:text-[#e0deeb]"
                        >
                          {completedEntry.title}
                        </Link>
                      </>
                    ) : (
                      "Because you completed a game"
                    )}
                  </h2>
                  <p className="mt-1 text-[13px] leading-4 text-[#b4aec7]">
                    Similar games based on your finished library
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => scrollSimilar(-1)}
                    aria-label="Scroll left"
                    className="size-8 rounded-lg border-[#55516c] bg-[#373646]/80 text-[#e0deeb] hover:bg-[#454256]"
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => scrollSimilar(1)}
                    aria-label="Scroll right"
                    className="size-8 rounded-lg border-[#55516c] bg-[#373646]/80 text-[#e0deeb] hover:bg-[#454256]"
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>

              {similarError && (
                <p role="alert" className="text-sm text-[#e58d91]">{similarError}</p>
              )}

              {similarLoading && (
                <p role="status" className="text-sm text-[#b4aec7]">Loading similar games…</p>
              )}

              {!similarLoading && !similarError && becauseCompletedGames.length > 0 && (
                <div
                  ref={similarRef}
                  className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                  {becauseCompletedGames.map((game) => (
                    <div key={game.id} className="w-[260px] shrink-0 snap-start">
                      <GameCard game={game} />
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* RPGs Section */}
          <section className="flex flex-col gap-8">
            <h2 className="text-[24px] font-semibold leading-[29px] tracking-[-0.5px]">More RPGs for you</h2>
            <GameGrid games={rpgGames} loading={rpgGames.length === 0} />
          </section>

          {/* Discover on Steam Section */}
          <section className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
              <h2 className="text-[24px] font-semibold leading-[29px] tracking-[-0.5px]">Discover on Steam</h2>
            </div>
            {catalogError && <p className="text-sm text-[#e58d91]">Failed to load catalog games.</p>}
            <GameGrid games={steamSummaries} loading={catalogLoading} />
            <nav className="flex items-center justify-center gap-4 pt-4">
              <Button onClick={goToPreviousPage} disabled={pageNumber === 1 || catalogLoading} className="bg-[#373646] text-[#e0deeb]">
                Previous
              </Button>
              <span className="text-[13px] text-[#b4aec7]">Page {pageNumber}</span>
              <Button onClick={goToNextPage} disabled={!hasMore || catalogLoading} className="bg-[#9f4044] text-[#e0deeb]">
                Next
              </Button>
            </nav>
          </section>

          {/* Community Playlists Section (Restored & Lazy-loaded) */}
          <section id="community-playlists" aria-labelledby="community-playlists-title" className="flex flex-col gap-5">
            <div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 id="community-playlists-title" className="text-[24px] font-semibold leading-[29px] tracking-[-0.5px]">
                    Community Playlists
                  </h2>
                  <p className="mt-1 text-[13px] leading-4 text-[#b4aec7]">Discover what other players are curating</p>
                  <Link to="/playlists" className="text-[13px] text-[#b4aec7] hover:text-[#e0deeb]">
                    View more →
                  </Link>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to="/playlists/new"
                    className="mr-2 rounded-lg bg-[#9f4044] px-4 py-2.5 text-[13px] font-medium hover:bg-[#ae494e]"
                  >
                    Create playlist
                  </Link>
                  <Button variant="outline" size="icon" onClick={() => scrollCarousel(-1)} aria-label="Scroll left"
                    className="size-8 rounded-lg border-[#55516c] bg-[#373646]/80 text-[#e0deeb] hover:bg-[#454256]">
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => scrollCarousel(1)} aria-label="Scroll right"
                    className="size-8 rounded-lg border-[#55516c] bg-[#373646]/80 text-[#e0deeb] hover:bg-[#454256]">
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            </div>

            {playlistsLoading && <p role="status" className="text-sm text-[#b4aec7]">Loading community playlists…</p>}
            {playlistsError && <p role="alert" className="text-sm text-[#e58d91]">{playlistsError}</p>}

            {!playlistsLoading && !playlistsError && communityPlaylists.length === 0 && (
              <div className="rounded-xl border border-dashed border-[#55516c] px-6 py-10 text-center">
                <ListMusic className="mx-auto size-8 text-[#8b86a3]" strokeWidth={1.5} />
                <p className="mt-3 text-sm text-[#b4aec7]">No public playlists yet. Be the first to share one.</p>
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