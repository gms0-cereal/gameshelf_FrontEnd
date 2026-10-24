import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { ChevronLeft, ChevronRight, Heart, Info, ListMusic } from "lucide-react";
import {
  getSteamGamesExpanded,
  getSteamGameSummaries,
  getMyGameList,
  type SteamGameCard,
  type UserGameEntry,
} from "@/services/Gameservice";
import { Button } from "@/components/ui/button";
import GameGrid from "@/components/games/GameGrid";
import { type GameSummary } from "@/components/games/GameCard";
import { useAuth } from "@/context/AuthContext";
import { getPlaylists, type Playlist } from "@/services/playlistService";
import { getTasteRecommendations, type TasteRecommendation } from "../services/tasteService";


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

// The hero and both recommendation sections share several games,
// so every unique id is fetched only once, in a single request.
const CURATED_IDS = Array.from(
  new Set([...TOP_10_HERO_IDS, ...HOLLOW_KNIGHT_IDS, ...RPG_IDS])
);

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

// Pure conversion, no network: backend card + the user's list entry -> GameSummary.
function toGameSummary(card: SteamGameCard, userEntry?: UserGameEntry): GameSummary {
  const latestDate = userEntry?.completed_at || userEntry?.started_at || null;
  const statusKey = userEntry ? userEntry.status : "unplayed";
  const statusStyle = STATUS_STYLES[statusKey] || STATUS_STYLES.unplayed;
 
  // Your own rating, if you gave one.
  const myScore = userEntry?.score ?? card.my_score;
 
  // Third-party (Steam, or Metacritic as a fallback) + GameShelf community.
  const ratingParts: string[] = [];
  if (card.steam_rating) {
    const { score, label, total_reviews } = card.steam_rating;
    ratingParts.push(
      `Steam ★ ${score}/10${label ? ` · ${label}` : ""} (${total_reviews.toLocaleString()})`
    );
  } else if (card.metacritic_score) {
    ratingParts.push(`Metacritic ${card.metacritic_score}/100`);
  }
  if (card.community_rating !== null) {
    ratingParts.push(
      `GameShelf ★ ${card.community_rating}/10 (${card.rating_count.toLocaleString()})`
    );
  }
 
  return {
    id: card.appid,
    title: card.name || `Game ${card.appid}`,
    slug: String(card.appid),
    cover: card.header_image,
    genres: card.genres.length > 0 ? card.genres : ["Steam Game"],
    statusLabel: statusStyle.label,
    statusClassName: statusStyle.className,
    ratingText: myScore ? `${myScore}/10` : undefined,
    communityRatingText: ratingParts.length > 0 ? ratingParts.join("  ·  ") : undefined,
    lastPlayedText: formatLibraryActivity(latestDate),
    bio:
      card.short_description ||
      "Explore live community catalogs and add this title to your shelf.",
    platform: "PC",
  };
}

function pickSummaries(
  ids: number[],
  cards: Map<number, SteamGameCard>,
  userListMap: Map<string, UserGameEntry>
): GameSummary[] {
  return ids
    .map((id) => cards.get(id))
    .filter((card): card is SteamGameCard => Boolean(card))
    .map((card) => toGameSummary(card, userListMap.get(String(card.appid))));
}

function PlaylistCard({ playlist }: { playlist: Playlist }) {
  const ownerName = playlist.owner.nickname || playlist.owner.username;

  return (
    <article className="overflow-hidden rounded-xl border border-[#55516c] bg-[#373646]">
      <div className="grid aspect-[2/1] grid-cols-2 gap-px bg-[#55516c]">
        {[0, 1, 2, 3].map((index) => {
          const game = playlist.games[index];
          return game?.cover_url ? (
            <img
              key={`${game.id}-${index}`}
              src={game.cover_url}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <div
              key={`empty-${index}`}
              className="flex items-center justify-center bg-gradient-to-br from-[#3b3560] to-[#1d2b33]"
            >
              <ListMusic className="size-6 text-[#8b86a3]" aria-hidden="true" />
            </div>
          );
        })}
      </div>
      <div className="p-4">
        <h3 className="truncate font-semibold">{playlist.title}</h3>
        <p className="mt-1 truncate text-xs text-[#b4aec7]">By {ownerName}</p>
        {playlist.description && (
          <p className="mt-3 line-clamp-2 text-[13px] leading-5 text-[#b4aec7]">
            {playlist.description}
          </p>
        )}
        <div className="mt-4 flex items-center justify-between text-xs text-[#b4aec7]">
          <span>{playlist.game_count} {playlist.game_count === 1 ? "game" : "games"}</span>
          <span className="inline-flex items-center gap-1.5">
            <Heart className="size-3.5" aria-hidden="true" />
            {playlist.like_count}
          </span>
        </div>
      </div>
    </article>
  );
}

function recommendationBio(reason?: TasteRecommendation["reason"]) {
  if (reason?.similar_to) return `Because you like ${reason.similar_to}.`;
  const matched = [...(reason?.matched_genres ?? []), ...(reason?.matched_tags ?? [])];
  return matched.length > 0
    ? `Matches your interests: ${matched.slice(0, 4).join(", ")}.`
    : "Recommended based on your interests.";
}

export default function Home() {
  // Raw cards from the backend. The user's list status is applied separately
  // (see useMemo below), so loading the list never triggers another fetch.
  const [curatedCards, setCuratedCards] = useState<Map<number, SteamGameCard>>(new Map());
  const [catalogCards, setCatalogCards] = useState<SteamGameCard[]>([]);
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
  const [communityPlaylists, setCommunityPlaylists] = useState<Playlist[]>([]);
  const [playlistsLoading, setPlaylistsLoading] = useState(true);
  const [playlistsError, setPlaylistsError] = useState<string | null>(null);

  const username = localStorage.getItem("username") || localStorage.getItem("user_name") || "Player";

  const [recommendedGames, setRecommendedGames] = useState<GameSummary[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(true);
  const [recommendationsError, setRecommendationsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getTasteRecommendations()
      .then((data) => {
        if (cancelled) return;

        const games = data.results ?? [];

        const summaries: GameSummary[] = (data.results ?? []).map(({ game, reason }) => ({
          id: game.appid,
          title: game.title,
          slug: String(game.appid),
          cover: game.header_image ?? "",
          genres: game.genres?.length ? game.genres : ["Steam Game"],
          statusLabel: "Unplayed",
          statusClassName: STATUS_STYLES.unplayed.className,
          bio: recommendationBio(reason),
          platform: "PC",
        }));

        setRecommendedGames(summaries);
      })
      .catch(() => {
        if (!cancelled) {
          setRecommendationsError("Failed to load your recommendations.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setRecommendationsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

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

  // Hero + Hollow Knight + RPG sections: ONE request for all unique games.
  useEffect(() => {
    let cancelled = false;

    getSteamGameSummaries(CURATED_IDS)
      .then((cards) => {
        if (!cancelled) setCuratedCards(new Map(cards.map((card) => [card.appid, card])));
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  // Steam catalog: ONE request per page. Depends only on the cursor.
  useEffect(() => {
    let cancelled = false;

    getSteamGamesExpanded(STEAM_PAGE_SIZE, currentCursor)
      .then((data) => {
        if (cancelled) return;
        setNextCursor(data.last_appid);
        setHasMore(Boolean(data.have_more_results && data.last_appid));
        setCatalogCards(data.games.filter((game) => game.name));
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
  }, [currentCursor]);

  // Derived data: recomputed locally (no network) when cards or the user's list change.
  const heroGames = useMemo(
    () => pickSummaries(TOP_10_HERO_IDS, curatedCards, userListMap),
    [curatedCards, userListMap]
  );
  const hollowKnightGames = useMemo(
    () => pickSummaries(HOLLOW_KNIGHT_IDS, curatedCards, userListMap),
    [curatedCards, userListMap]
  );
  const rpgGames = useMemo(
    () => pickSummaries(RPG_IDS, curatedCards, userListMap),
    [curatedCards, userListMap]
  );
  const steamSummaries = useMemo(
    () => catalogCards.map((card) => toGameSummary(card, userListMap.get(String(card.appid)))),
    [catalogCards, userListMap]
  );

  function goToNextPage() {
    if (hasMore && nextCursor !== null) {
      setLoading(true);
      setError(null);
      setCursors((previous) => [...previous, nextCursor]);
    }
  }

  function goToPreviousPage() {
    if (pageNumber > 1) {
      setLoading(true);
      setError(null);
      setCursors((previous) => previous.slice(0, -1));
    }
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

          <section
            aria-labelledby="taste-recommendations-title"
            className="flex flex-col gap-8"
          >
            <div className="flex flex-col">
              <div className="flex min-h-[29px] flex-wrap items-center justify-between gap-3">
                <h2
                  id="taste-recommendations-title"
                  className="text-[24px] font-semibold leading-[29px] tracking-[-0.5px]"
                >
                  Recommended for You
                </h2>

                <Link
                  to="/interests"
                  className="text-[13px] leading-4 text-[#c2ade7] hover:text-[#e0deeb]"
                >
                  Tune your suggestions: edit genres and liked games →
                </Link>
              </div>

              <p className="mt-1 text-[13px] leading-4 text-[#b4aec7]">
                Games selected based on your genres, platforms, and liked games.
              </p>
            </div>

            {recommendationsError && (
              <p role="alert" className="text-sm text-[#e58d91]">
                {recommendationsError}
              </p>
            )}

            <GameGrid
              games={recommendedGames}
              loading={recommendationsLoading}
            />

            {!recommendationsLoading &&
              !recommendationsError &&
              recommendedGames.length === 0 && (
                <p className="text-sm text-[#b4aec7]">
                  No recommendations yet. Update your interests to get personalized suggestions.
                </p>
              )}
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