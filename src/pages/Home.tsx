import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { ChevronLeft, ChevronRight, Info } from "lucide-react";
import {
  getSteamGames,
  getSteamGameDetails,
  getSteamGameReviews,
  getMyGameList,
  type SteamGame,
  type ListStatus,
  type UserGameEntry,
} from "@/services/Gameservice";
import { Button } from "@/components/ui/button";
import GameGrid from "@/components/games/GameGrid";
import { type GameSummary } from "@/components/games/GameCard";
import { useAuth } from "@/context/AuthContext";

const STEAM_PAGE_SIZE = 12;

const TOP_10_HERO_IDS = [
  367520, // Hollow Knight
  504230, // Celeste
  1030300, // Hollow Knight: Silksong
  620, // Portal 2
  387290, // Ori and the Blind Forest
  774361, // Blasphemous
  730, // Counter-Strike 2
  1369630, // Ender Lilies
  1245620, // Elden Ring
  1809540, // Nine Sols
];

const HOLLOW_KNIGHT_IDS = [367520, 774361, 1369630, 504230];
const RPG_IDS = [1245620, 1809540, 1244090, 1971650];

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  playing: { label: "Playing", className: "bg-[#e0e7ff] text-[#3730a3]" },
  completed: { label: "Completed", className: "bg-[#dcfce7] text-[#166534]" },
  on_hold: { label: "On Hold", className: "bg-[#fef3c7] text-[#92400e]" },
  plan_to_play: { label: "Plan to Play", className: "bg-[#ede9fe] text-[#5b21b6]" },
  dropped: { label: "Dropped", className: "bg-[#fee2e2] text-[#991b1b]" },
  unplayed: { label: "Unplayed", className: "bg-[#2a2838] text-[#b4aec7] border border-[#55516c]" },
};

function formatLibraryActivity(date: string | null) {
  if (!date) return "Never played";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Never played";
  return `Last updated ${parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}

export default function Home() {
  const [steamSummaries, setSteamSummaries] = useState<GameSummary[]>([]);
  const [hollowKnightGames, setHollowKnightGames] = useState<GameSummary[]>([]);
  const [rpgGames, setRpgGames] = useState<GameSummary[]>([]);
  const [heroGames, setHeroGames] = useState<GameSummary[]>([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [userListMap, setUserListMap] = useState<Map<string, UserGameEntry>>(new Map());

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [cursors, setCursors] = useState<number[]>([0]);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const pageNumber = cursors.length;
  const currentCursor = cursors[cursors.length - 1];
  const { user } = useAuth();

  const username = localStorage.getItem("username") || localStorage.getItem("user_name") || "Player";

  // Helper to convert Steam data into GameSummary format with batched data
  async function buildGameSummary(appid: number, userEntry?: UserGameEntry): Promise<GameSummary> {
    const [detail, reviews] = await Promise.all([
      getSteamGameDetails(appid).catch(() => null),
      getSteamGameReviews(appid, "*", 1).catch(() => null),
    ]);

    const totalReviews = reviews?.summary?.total_reviews || 0;
    const positiveReviews = reviews?.summary?.total_positive || 0;
    const calcAvgScore = totalReviews > 0 ? Number(((positiveReviews / totalReviews) * 10).toFixed(1)) : null;

    const latestDate = userEntry?.completed_at || userEntry?.started_at || null;
    const statusKey = userEntry ? userEntry.status : "unplayed";
    const statusStyle = STATUS_STYLES[statusKey] || STATUS_STYLES.unplayed;

    return {
      id: appid,
      title: detail?.name || `Game ${appid}`,
      slug: String(appid),
      cover: detail?.header_image || detail?.background_raw || `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${appid}/header.jpg`,
      genres: detail?.genres?.map((g) => g.description) ?? ["Steam Game"],
      statusLabel: statusStyle.label,
      statusClassName: statusStyle.className,
      ratingText: userEntry?.score ? `${userEntry.score}/10` : undefined,
      communityRatingText: calcAvgScore ? `★ ${calcAvgScore} / 10 (${totalReviews.toLocaleString()} user ratings)` : undefined,
      lastPlayedText: formatLibraryActivity(latestDate),
      bio: detail?.short_description || "Explore live community catalogs and add this title to your shelf.",
      platform: "PC",
    };
  }

  // Fetch User's List
  useEffect(() => {
    getMyGameList()
      .then((data) => {
        const map = new Map<string, UserGameEntry>();
        data.results.forEach((entry) => {
          if (entry.steam_app_id) {
            map.set(String(entry.steam_app_id), entry);
          }
        });
        setUserListMap(map);
      })
      .catch(() => {});
  }, []);

  // Fetch Hero Carousel Games in Parallel
  useEffect(() => {
    let cancelled = false;
    Promise.all(TOP_10_HERO_IDS.map((id) => buildGameSummary(id, userListMap.get(String(id)))))
      .then((res) => {
        if (!cancelled) setHeroGames(res);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [userListMap]);

  // Fetch Curated Recommendation Lists in Parallel
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      Promise.all(HOLLOW_KNIGHT_IDS.map((id) => buildGameSummary(id, userListMap.get(String(id))))),
      Promise.all(RPG_IDS.map((id) => buildGameSummary(id, userListMap.get(String(id))))),
    ])
      .then(([hk, rpg]) => {
        if (!cancelled) {
          setHollowKnightGames(hk);
          setRpgGames(rpg);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [userListMap]);

  // Fetch Steam Catalog pagination with batched details loading (Instant Grid Rendering)
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getSteamGames(STEAM_PAGE_SIZE, currentCursor)
      .then(async (data) => {
        if (cancelled) return;
        setNextCursor(data.last_appid);
        setHasMore(Boolean(data.have_more_results && data.last_appid));

        const validGames = data.games.filter((g) => g.name);
        const summaries = await Promise.all(
          validGames.map((g) => buildGameSummary(g.appid, userListMap.get(String(g.appid))))
        );

        if (!cancelled) {
          setSteamSummaries(summaries);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load games. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentCursor, userListMap]);

  function goToNextPage() {
    if (hasMore && nextCursor !== null) {
      setCursors((previous) => [...previous, nextCursor]);
    }
  }

  function goToPreviousPage() {
    setCursors((previous) => (previous.length > 1 ? previous.slice(0, -1) : previous));
  }

  const currentHero = heroGames[heroIndex] || null;

  return (
    <div className="min-h-screen bg-[#201e2f]">
      <div
        className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col bg-[#201e2f] text-[#e0deeb] antialiased"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <Navbar />

        <main className="flex flex-1 flex-col gap-8 px-5 pb-16 pt-11 md:px-8 xl:px-16">
          <div className="flex min-h-[65px] flex-wrap items-center justify-between gap-4">
            <div className="flex flex-col gap-2">
              <p className="text-[13px] leading-4 text-[#b4aec7] uppercase tracking-wider">
                WELCOME BACK, {user?.username || username}
              </p>
              <h1 className="text-[36px] font-semibold leading-[41px] tracking-[-0.8px]">Home</h1>
            </div>

            <Link
              to="/interests"
              className="text-[13px] leading-4 text-[#c2ade7] hover:text-[#e0deeb]"
            >
              Tune your suggestions: edit genres and liked games →
            </Link>
          </div>

          {/* Hero Carousel Banner */}
          <section
            aria-labelledby="hero-title"
            className="relative flex min-h-[420px] items-end overflow-hidden rounded-2xl bg-[#201e2f] px-6 py-10 md:px-11 xl:h-[440px]"
          >
            {currentHero && (
              <img
                src={currentHero.cover || ""}
                alt={currentHero.title}
                fetchPriority="high"
                className="absolute inset-0 h-full w-full object-cover object-center filter brightness-95"
              />
            )}

            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#201e2f] via-[#201e2f]/50 to-transparent" />
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-[#201e2f] via-[#201e2f]/60 to-transparent" />

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
              <h2 id="hero-title" className="text-[32px] font-bold leading-tight tracking-[-0.5px] md:text-[46px]">
                {currentHero ? currentHero.title : "Loading featured games..."}
              </h2>
              <p className="line-clamp-2 text-[14px] leading-relaxed text-[#b4aec7]">
                {currentHero ? currentHero.bio : "Explore top-tier titles trending across the community."}
              </p>
              <div className="flex items-center gap-4 pt-2">
                {currentHero && (
                  <Button
                    asChild
                    className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#a8484c] px-6 text-[14px] font-semibold text-[#e0deeb] shadow-none hover:bg-[#ae494e]"
                  >
                    <Link to={`/gamedetails/${currentHero.slug}`}>
                      <Info className="size-4" />
                      Details
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </section>

          {/* Hollow Knight Section */}
          <section aria-labelledby="hollow-knight-title" className="flex flex-col gap-8">
            <div className="flex flex-col">
              <h2 id="hollow-knight-title" className="text-[24px] font-semibold leading-[29px] tracking-[-0.5px]">
                Because you played Hollow Knight
              </h2>
              <p className="text-[13px] leading-4 text-[#b4aec7] mt-1">EXPLORATION • CHALLENGE • DISCOVERY</p>
            </div>
            <GameGrid games={hollowKnightGames} loading={hollowKnightGames.length === 0} />
          </section>

          {/* RPGs Section */}
          <section aria-labelledby="rpg-title" className="flex flex-col gap-8">
            <div className="flex flex-col">
              <h2 id="rpg-title" className="text-[24px] font-semibold leading-[29px] tracking-[-0.5px]">
                More RPGs for you
              </h2>
              <p className="text-[13px] leading-4 text-[#b4aec7] mt-1">Inspired by your favorite genre</p>
            </div>
            <GameGrid games={rpgGames} loading={rpgGames.length === 0} />
          </section>

          {/* Discover on Steam Section */}
          <section aria-labelledby="steam-title" className="flex flex-col gap-8">
            <div className="flex min-h-[29px] flex-wrap items-center justify-between gap-3">
              <div className="flex flex-col">
                <h2 id="steam-title" className="text-[24px] font-semibold leading-[29px] tracking-[-0.5px]">
                  Discover on Steam
                </h2>
                <p className="text-[13px] leading-4 text-[#b4aec7] mt-1">Pulled live from the Steam catalog</p>
              </div>
            </div>

            {error && <p role="alert" className="text-sm text-[#e58d91]">{error}</p>}

            <GameGrid games={steamSummaries} loading={loading} />

            <nav aria-label="Steam games pagination" className="flex items-center justify-center gap-4 pt-4">
              <Button
                type="button"
                onClick={goToPreviousPage}
                disabled={pageNumber === 1 || loading}
                className="h-10 rounded-lg border-0 bg-[#373646] px-5 text-sm font-semibold text-[#e0deeb] shadow-none hover:bg-[#46445a] disabled:opacity-50"
              >
                Previous
              </Button>
              <span className="text-[13px] text-[#b4aec7]" aria-live="polite">
                Page {pageNumber}
              </span>
              <Button
                type="button"
                onClick={goToNextPage}
                disabled={!hasMore || loading}
                className="h-10 rounded-lg border-0 bg-[#9f4044] px-5 text-sm font-semibold text-[#e0deeb] shadow-none hover:bg-[#ae494e] disabled:opacity-50"
              >
                Next
              </Button>
            </nav>
          </section>

          <section
            id="community-playlists"
            aria-labelledby="community-playlists-title"
            className="flex flex-col gap-8"
          >
            <div className="flex min-h-[29px] flex-wrap items-center justify-between gap-3">
              <div>
                <h2
                  id="community-playlists-title"
                  className="text-[24px] font-semibold leading-[29px] tracking-[-0.5px]"
                >
                  Community Playlists
                </h2>
                <p className="mt-1 text-[13px] leading-4 text-[#b4aec7]">
                  Discover what other players are curating
                </p>
              </div>

              <Link
                to="/playlists/new"
                className="rounded-lg bg-[#9f4044] px-4 py-2.5 text-[13px] font-medium text-[#e0deeb] transition-colors hover:bg-[#ae494e]"
              >
                Create playlist
              </Link>
            </div>

            {playlistsLoading && (
              <p role="status" className="text-sm text-[#b4aec7]">
                Loading community playlists…
              </p>
            )}

            {playlistsError && (
              <p role="alert" className="text-sm text-[#e58d91]">
                {playlistsError}
              </p>
            )}

            {!playlistsLoading && !playlistsError && communityPlaylists.length === 0 && (
              <div className="rounded-xl border border-dashed border-[#55516c] px-6 py-10 text-center">
                <ListMusic className="mx-auto size-8 text-[#8b86a3]" strokeWidth={1.5} />
                <p className="mt-3 text-sm text-[#b4aec7]">
                  No public playlists yet. Be the first to share one.
                </p>
              </div>
            )}

            {!playlistsLoading && !playlistsError && communityPlaylists.length > 0 && (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {communityPlaylists.map((playlist) => (
                  <PlaylistCard key={playlist.id} playlist={playlist} />
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