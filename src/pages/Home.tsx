import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { type TargetAndTransition, type Variants, motion } from "framer-motion";;
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { ChevronLeft, ChevronRight, Info, ListMusic } from "lucide-react";
import {
  fetchPopularNowGames,
  getMyGameList,
  getTopRatedGames,
  type SteamGameCard,
  type UserGameEntry,
} from "@/services/Gameservice";
import { Button } from "@/components/ui/button";
import GameCard, { type GameSummary } from "@/components/games/GameCard";
import { useAuth } from "@/context/AuthContext";
import { getPlaylists, type Playlist } from "@/services/playlistService";
import { PlaylistCarouselCard } from "@/components/playlists/PlaylistCards";
import { getPlayersLikeYou, type PlayersLikeYouItem } from "@/services/playersLikeYouService";
import {
  getTasteRecommendations,
  getTasteProfile,
  getSimilarGames,
  type TasteRecommendationItem,
} from "@/services/recommendationService";

import {
  getFriends,
  getFavoriteGames,
} from "@/services/Userservice";

import api from "@/lib/api";

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  playing: { label: "Playing", className: "bg-[#20232B] text-[#B39ACF] border border-[#302438]" },
  completed: { label: "Completed", className: "bg-[#10251F] text-[#34D399] border border-[#302438]" },
  on_hold: { label: "On Hold", className: "bg-[#20232B] text-[#B39ACF] border border-[#302438]" },
  plan_to_play: { label: "Plan to Play", className: "bg-[#17191E] text-[#A0A0A8] border border-[#302438]" },
  dropped: { label: "Dropped", className: "bg-[#2B171C] text-[#E58B91] border border-[#E58B91]/40" },
  unplayed: { label: "Unplayed", className: "bg-[#17191E] text-[#A0A0A8] border border-[#302438]" },
};

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.5, ease: "easeOut" } as TargetAndTransition["transition"]
  },
};

const carouselContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const cardItemVariants: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: 0.35, ease: "easeOut" } as TargetAndTransition["transition"]
  },
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

function recommendationBio(reason?: TasteRecommendationItem["reason"]) {
  if (reason?.similar_to) return `Because you like ${reason.similar_to}.`;
  const matched = [...(reason?.matched_genres ?? []), ...(reason?.matched_tags ?? [])];
  return matched.length > 0
    ? `Matches your interests: ${matched.slice(0, 4).join(", ")}.`
    : "Recommended based on your interests.";
}

function recommendationToSummary(rec: TasteRecommendationItem): GameSummary | null {
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
    platforms: ["PC"],
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
  const [userListMap, setUserListMap] = useState<Map<string, UserGameEntry>>(new Map());
  const { user } = useAuth();

  // Community Playlists State
  const [communityPlaylists, setCommunityPlaylists] = useState<Playlist[]>([]);
  const [playlistsLoading, setPlaylistsLoading] = useState(true);
  const [playlistsError, setPlaylistsError] = useState<string | null>(null);

  // Dynamic Genre Section State ("More [Genre]s for You")
  const [primaryGenre, setPrimaryGenre] = useState<string>("Action");
  const [genreGames, setGenreGames] = useState<GameSummary[]>([]);
  const [genreLoading, setGenreLoading] = useState(true);

  // Similar Games Section State ("Because you played...")
  const [similarGames, setSimilarGames] = useState<GameSummary[]>([]);
  const [likedGameTitle, setLikedGameTitle] = useState<string>("");
  const [likedGameAppId, setLikedGameAppId] = useState<number | null>(null);
  const [similarLoading, setSimilarLoading] = useState(false);

  // Friends Also Play State
  const [friendsGames, setFriendsGames] = useState<GameSummary[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(true);

  // Carousel refs
  const carouselRef = useRef<HTMLDivElement>(null);
  const scrollCarousel = (dir: 1 | -1) =>
    carouselRef.current?.scrollBy({ left: dir * 380, behavior: "smooth" });

  const genreRef = useRef<HTMLDivElement>(null);
  const scrollGenre = (dir: 1 | -1) =>
    genreRef.current?.scrollBy({ left: dir * (genreRef.current.clientWidth * 0.8), behavior: "smooth" });

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

  const friendsPlayRef = useRef<HTMLDivElement>(null);
  const scrollFriendsPlay = (dir: 1 | -1) =>
    friendsPlayRef.current?.scrollBy({
      left: dir * (friendsPlayRef.current.clientWidth * 0.8),
      behavior: "smooth",
    });

  const topRatedRef = useRef<HTMLDivElement>(null);
  const scrollTopRated = (dir: 1 | -1) =>
    topRatedRef.current?.scrollBy({
      left: dir * (topRatedRef.current.clientWidth * 0.8),
      behavior: "smooth",
    });

  const similarRef = useRef<HTMLDivElement>(null);
  const scrollSimilar = (dir: 1 | -1) =>
    similarRef.current?.scrollBy({
      left: dir * (similarRef.current.clientWidth * 0.8),
      behavior: "smooth",
    });

  // Players Like You State
  const [playersGames, setPlayersGames] = useState<GameSummary[]>([]);
  const [playersLoading, setPlayersLoading] = useState(true);
  const [playersError, setPlayersError] = useState<string | null>(null);

  const [topRatedCards, setTopRatedCards] = useState<SteamGameCard[]>([]);
  const [topRatedLoading, setTopRatedLoading] = useState(true);
  const [topRatedError, setTopRatedError] = useState<string | null>(null);

  // Recommended for You State
  const [recommendedGames, setRecommendedGames] = useState<GameSummary[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(true);
  const [recommendationsError, setRecommendationsError] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const PAGE_SIZE = 20;

  // Pagination Refs for Infinite Scroll
  const tasteOffset = useRef(0);
  const playersOffset = useRef(0);
  const topRatedOffset = useRef(0);
  const genreOffset = useRef(0);
  const similarOffset = useRef(0);

  const tasteHasMore = useRef(true);
  const playersHasMore = useRef(true);
  const topRatedHasMore = useRef(true);
  const genreHasMore = useRef(true);
  const similarHasMore = useRef(true);

  const tasteLoadingRef = useRef(false);
  const playersLoadingRef = useRef(false);
  const topRatedLoadingRef = useRef(false);
  const genreLoadingRef = useRef(false);
  const similarLoadingRef = useRef(false);
  const GENRE_PAGE_SIZE = 24;

  // 1. Fetch User Taste Profile & Dynamically Rotate Genres / Liked Games by Time Slots
  useEffect(() => {
    let cancelled = false;
    let rotationInterval: ReturnType<typeof setInterval> | undefined;

    async function loadPreferences() {
      try {
        const [profileResult, favoritesResult] = await Promise.allSettled([
          getTasteProfile(),
          getFavoriteGames(),
        ]);

        if (cancelled) return;

        const profile =
          profileResult.status === "fulfilled"
            ? profileResult.value
            : null;

        const favorites =
          favoritesResult.status === "fulfilled"
            ? favoritesResult.value
            : [];

        // Rotate primary genre every 2 hours
        if (profile?.genres?.length) {
          const now = Date.now();
          const twoHours = 1000 * 60 * 60 * 2;
          const genreIndex =
            Math.floor(now / twoHours) % profile.genres.length;

          setPrimaryGenre(profile.genres[genreIndex]);
        }

        // Combine Taste Profile liked games and User Favorite Games
        const likedGames = (profile?.liked_games ?? []).map((game) => ({
          appid: game.appid,
          title: game.title,
        }));

        const favoriteGames = favorites
          .filter((game) => game.steam_app_id != null)
          .map((game) => ({
            appid: game.steam_app_id!,
            title: game.title,
          }));

        // Remove duplicates using Steam app ID
        const combinedGames = Array.from(
          new Map(
            [...likedGames, ...favoriteGames].map((game) => [
              game.appid,
              game,
            ])
          ).values()
        );

        if (combinedGames.length > 0) {
          let currentAppId: number | null = null;

          const pickRandomLikedGame = () => {
            const availableGames =
              combinedGames.length > 1
                ? combinedGames.filter(
                    (game) => game.appid !== currentAppId
                  )
                : combinedGames;

            const selected =
              availableGames[
                Math.floor(Math.random() * availableGames.length)
              ];

            currentAppId = selected.appid;

            setLikedGameTitle(selected.title);
            setLikedGameAppId(selected.appid);
          };

          // Pick immediately, then rotate every 30 minutes
          pickRandomLikedGame();

          rotationInterval = setInterval(
            pickRandomLikedGame,
            30 * 60 * 1000
          );
        } else {
          setLikedGameTitle("Counter-Strike 2");
          setLikedGameAppId(730);
        }
      } catch {
        if (!cancelled) {
          setLikedGameTitle("Counter-Strike 2");
          setLikedGameAppId(730);
        }
      }
    }

    void loadPreferences();

    return () => {
      cancelled = true;
      if (rotationInterval) clearInterval(rotationInterval);
    };
  }, [user?.id]);

  // 2. Infinite Scroll: Dynamic Genre Section ("More [Genre]s for You")
  const loadGenrePage = useCallback(async () => {
    if (genreLoadingRef.current || !genreHasMore.current) return;

    genreLoadingRef.current = true;

    try {
      const offset = genreOffset.current;
      const { data } = await api.get("/games/steam/browse/", {
        params: {
          genre: primaryGenre.trim().toLowerCase(),
          page: Math.floor(offset / GENRE_PAGE_SIZE) + 1,
        },
      });
      const results = Array.isArray(data) ? data : data.results || [];
      const summaries = results.map((card: SteamGameCard) =>
        toGameSummary(card, userListMap.get(String(card.appid)))
      );

      setGenreGames((prev) => {
        const existingIds = new Set(prev.map((game) => game.id));
        const existingTitles = new Set(prev.map((game) => game.title.trim().toLowerCase()));

        const uniqueNew = summaries.filter((game: GameSummary) => {
          const cleanTitle = game.title.trim().toLowerCase();
          if (existingIds.has(game.id) || existingTitles.has(cleanTitle)) {
            return false;
          }
          existingIds.add(game.id);
          existingTitles.add(cleanTitle);
          return true;
        });

        return [...prev, ...uniqueNew];
      });

      genreOffset.current += GENRE_PAGE_SIZE;
      genreHasMore.current = data.has_next ?? results.length === GENRE_PAGE_SIZE;
    } catch {
      // Handle error gracefully
    } finally {
      genreLoadingRef.current = false;
      setGenreLoading(false);
    }
  }, [primaryGenre, userListMap]);

  useEffect(() => {
    genreOffset.current = 0;
    genreHasMore.current = true;
    genreLoadingRef.current = false;

    setGenreGames([]);
    setGenreLoading(true);

    void loadGenrePage();
  }, [primaryGenre, loadGenrePage]);

  // 3. Infinite Scroll: Cosine Similarity Section ("Because you played...")
  const loadSimilarPage = useCallback(async () => {
    if (!likedGameAppId || similarLoadingRef.current || !similarHasMore.current) return;

    similarLoadingRef.current = true;

    try {
      const offset = similarOffset.current;
      const simData = await getSimilarGames(likedGameAppId, PAGE_SIZE, offset);
      const results = simData.results || [];

      const summaries = results
        .map((item: any) => {
          const game = item.game;
          const appId = game.appid || game.id;
          if (!appId) return null;
          return {
            id: appId,
            title: game.title,
            slug: String(appId),
            cover:
              game.header_image ||
              game.cover_image_url ||
              `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`,
            genres: game.genres?.length ? game.genres : ["Steam Game"],
            platforms: ["PC"],
            statusLabel: STATUS_STYLES.unplayed.label,
            statusClassName: STATUS_STYLES.unplayed.className,
            bio: `Similar to ${likedGameTitle}`,
          };
        })
        .filter((g: any): g is GameSummary => g !== null);

      let addedCount = 0;

      setSimilarGames((prev) => {
        const existingIds = new Set(prev.map((game) => game.id));
        const existingTitles = new Set(prev.map((game) => game.title.trim().toLowerCase()));

        const uniqueNewSummaries = summaries.filter((game: GameSummary) => {
          const cleanTitle = game.title.trim().toLowerCase();
          if (existingIds.has(game.id) || existingTitles.has(cleanTitle)) {
            return false;
          }
          existingIds.add(game.id);
          existingTitles.add(cleanTitle);
          return true;
        });

        addedCount = uniqueNewSummaries.length;
        return [...prev, ...uniqueNewSummaries];
      });

      similarOffset.current += PAGE_SIZE;
      similarHasMore.current = simData.has_more ?? results.length === PAGE_SIZE;

      if (addedCount < 5 && similarHasMore.current) {
        similarLoadingRef.current = false;
        void loadSimilarPage();
        return;
      }
    } catch {
      // Handle error gracefully
    } finally {
      similarLoadingRef.current = false;
      setSimilarLoading(false);
    }
  }, [likedGameAppId, likedGameTitle]);

  useEffect(() => {
    if (!likedGameAppId) return;

    similarOffset.current = 0;
    similarHasMore.current = true;
    similarLoadingRef.current = false;

    setSimilarGames([]);
    setSimilarLoading(true);

    void loadSimilarPage();
  }, [likedGameAppId, loadSimilarPage]);

  // 4. Infinite Scroll: Taste Recommendations (K-Means)
  const loadTastePage = useCallback(async () => {
    if (!user || tasteLoadingRef.current || !tasteHasMore.current) return;

    tasteLoadingRef.current = true;

    try {
      const offset = tasteOffset.current;
      const data = await getTasteRecommendations(PAGE_SIZE, offset);
      const results = data.results ?? [];

      const games = results
        .map(recommendationToSummary)
        .filter((game): game is GameSummary => game !== null);

      setRecommendedGames((prev) => {
        const existingIds = new Set(prev.map((g) => g.id));
        const existingTitles = new Set(prev.map((g) => g.title.trim().toLowerCase()));

        const uniqueNew = games.filter((game) => {
          const cleanTitle = game.title.trim().toLowerCase();
          if (existingIds.has(game.id) || existingTitles.has(cleanTitle)) {
            return false;
          }
          existingIds.add(game.id);
          existingTitles.add(cleanTitle);
          return true;
        });

        return [...prev, ...uniqueNew];
      });

      tasteOffset.current += results.length;
      tasteHasMore.current = data.has_more ?? results.length === PAGE_SIZE;
    } catch {
      setRecommendationsError("Failed to load recommendations.");
    } finally {
      tasteLoadingRef.current = false;
      setRecommendationsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    tasteOffset.current = 0;
    tasteHasMore.current = true;
    tasteLoadingRef.current = false;
    setRecommendedGames([]);
    setRecommendationsError(null);

    if (!user) {
      setRecommendationsLoading(false);
      return;
    }

    setRecommendationsLoading(true);
    void loadTastePage();
  }, [user?.id, loadTastePage]);

  // 5. Infinite Scroll: Players Like You (SVD)
  const loadPlayersPage = useCallback(async () => {
    if (!user || playersLoadingRef.current || !playersHasMore.current) return;

    playersLoadingRef.current = true;

    try {
      const offset = playersOffset.current;
      const data = await getPlayersLikeYou(PAGE_SIZE, offset);

      if (data.source !== "personalized") {
        playersHasMore.current = false;
        setPlayersGames([]);
        return;
      }

      const results = data.results ?? [];
      const games = results
        .map(playersLikeYouToSummary)
        .filter((game): game is GameSummary => game !== null);

      setPlayersGames((prev) => {
        const existingIds = new Set(prev.map((g) => g.id));
        const existingTitles = new Set(prev.map((g) => g.title.trim().toLowerCase()));

        const uniqueNew = games.filter((game) => {
          const cleanTitle = game.title.trim().toLowerCase();
          if (existingIds.has(game.id) || existingTitles.has(cleanTitle)) {
            return false;
          }
          existingIds.add(game.id);
          existingTitles.add(cleanTitle);
          return true;
        });

        return [...prev, ...uniqueNew];
      });

      playersOffset.current += results.length;
      playersHasMore.current = data.has_more ?? results.length === PAGE_SIZE;
    } catch {
      setPlayersError("Failed to load Players Like You.");
    } finally {
      playersLoadingRef.current = false;
      setPlayersLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    playersOffset.current = 0;
    playersHasMore.current = true;
    playersLoadingRef.current = false;
    setPlayersGames([]);
    setPlayersError(null);

    if (!user) {
      setPlayersLoading(false);
      return;
    }

    setPlayersLoading(true);
    void loadPlayersPage();
  }, [user?.id, loadPlayersPage]);

  // 6. Infinite Scroll: Top Rated Games
  const loadTopRatedPage = useCallback(async () => {
    if (topRatedLoadingRef.current || !topRatedHasMore.current) return;

    topRatedLoadingRef.current = true;

    try {
      const offset = topRatedOffset.current;
      const data = await getTopRatedGames(PAGE_SIZE, offset);
      const results = data.results ?? [];

      setTopRatedCards((prev) => {
        const existing = new Set(prev.map((game) => game.appid));
        return [...prev, ...results.filter((game) => !existing.has(game.appid))];
      });

      topRatedOffset.current += results.length;
      topRatedHasMore.current = topRatedOffset.current < data.count;
    } catch {
      setTopRatedError("Failed to load top rated games.");
    } finally {
      topRatedLoadingRef.current = false;
      setTopRatedLoading(false);
    }
  }, []);

  useEffect(() => {
    topRatedOffset.current = 0;
    topRatedHasMore.current = true;
    topRatedLoadingRef.current = false;
    setTopRatedCards([]);
    setTopRatedError(null);
    setTopRatedLoading(true);

    void loadTopRatedPage();
  }, [user?.id, loadTopRatedPage]);

  // Fetch Friends Also Play
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

 
  
// Rename state variables to avoid collisions with your useMemo
  const [heroGames, setHeroGames] = useState<any[]>([]);

  useEffect(() => {
      async function loadPageData() {
        try {
          // 1. Fetch Popular Now items for the Hero Banner
          const popularItems = await fetchPopularNowGames(31);
          const popularAppIds = popularItems.slice(0, 5).map(item => item.appid);
          
          if (popularAppIds.length > 0) {
            // Use your existing game service helper or ensure the full /api/v1/ prefix is used
            const response = await fetch(`/api/v1/games/steam/summaries/?appids=${popularAppIds.join(",")}`);
            if (!response.ok) throw new Error("Network response was not ok");
            const data = await response.json();
            const summaries = data.results || [];

            const formattedHeroGames = summaries.map((card: any) => ({
              id: card.appid,
              slug: card.appid,
              title: card.name,
              cover: card.header_image,
              score: card.community_rating ?? null,
              bio: card.short_description || "",
            }));
            setHeroGames(formattedHeroGames);
          }

          // 2. Fetch All-Time Top Rated items for the separate section
          const topRatedRes = await fetch(`/api/v1/games/steam/top-rated/?limit=20`);
          if (!topRatedRes.ok) throw new Error("Network response was not ok");
          const topRatedData = await topRatedRes.json();
          setTopRatedCards(topRatedData.results || []);
          
        } catch (err) {
          console.error("Failed to load game sections", err);
        }
      }

      loadPageData();
    }, [userListMap]);

   useEffect(() => {
    if (heroGames.length <= 1 || isHovered) return;

    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev < heroGames.length - 1 ? prev + 1 : 0));
    }, 7000);

    return () => clearInterval(timer);
  }, [heroGames.length, isHovered]);

  const handleRecommendationScroll = (
    event: React.UIEvent<HTMLDivElement>,
    loadMore: () => void
  ) => {
    const element = event.currentTarget;
    const nearEnd =
      element.scrollLeft + element.clientWidth >= element.scrollWidth - 500;

    if (nearEnd) {
      loadMore();
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#000000]">
      <div
        className="flex min-h-screen w-full flex-col bg-[#000000] text-[#E6E1EA] antialiased"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <Navbar />
        <main className="flex flex-1 flex-col gap-8 px-5 pb-16 pt-11 md:px-8 xl:px-16">
          {/* Welcome header */}
          <motion.div 
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex min-h-[65px] flex-wrap items-center justify-between gap-4"
          >
            <div className="flex flex-col gap-2">
              <p className="text-[13px] leading-4 text-[#B39ACF] uppercase tracking-wider">
                WELCOME BACK, {user?.nickname || user?.username || "Player"}
              </p>
              <h1 className="text-[36px] font-semibold leading-[41px] tracking-[-0.8px] text-[#E6E1EA]">Home</h1>
            </div>
          </motion.div>

          {/* Hero Banner */}
          {heroGames.length > 0 && (
            <motion.section
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className="relative min-h-[420px] w-full overflow-hidden rounded-2xl bg-[#17191E] border border-[#302438] xl:h-[440px]"
            >
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
                    <div className="absolute inset-0 bg-gradient-to-t from-[#17191E] via-[#17191E]/60 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#17191E]/90 via-transparent to-transparent" />

                    <div className="relative z-10 flex w-full max-w-[640px] flex-col gap-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[2px] text-[#34D399]">
                        POPULAR THIS MONTH ON GAMESHELF
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
            </motion.section>
          )}

      {/* 1. Recommended for You */}
        <motion.section 
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          aria-labelledby="taste-recommendations-title" 
          className="flex flex-col gap-5"
        >
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

          {recommendationsLoading && recommendedGames.length === 0 && (
            <p role="status" className="text-sm text-[#A0A0A8]">
              Loading recommendations…
            </p>
          )}

          {!recommendationsLoading && !recommendationsError && recommendedGames.length === 0 && (
            <p className="text-sm text-[#A0A0A8]">
              No recommendations yet. Update your interests to get personalized suggestions.
            </p>
          )}

          {recommendedGames.length > 0 && (
            <motion.div
              ref={recommendedRef}
              variants={carouselContainerVariants}
              initial="hidden"
              animate="visible"
              onScroll={(event) => handleRecommendationScroll(event, loadTastePage)}
              className="-mx-1 overflow-x-auto px-1 pt-2 pb-3 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              <div className="flex gap-5">
                {recommendedGames.map((game) => (
                  <motion.div
                    key={game.id}
                    variants={cardItemVariants}
                    className="w-[260px] shrink-0 snap-start sm:w-[280px] md:w-[300px]"
                  >
                    <GameCard game={game} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </motion.section>

        {/* 2. Top Rated on GameShelf */}
        {(topRatedLoading || topRatedError || topRatedGames.length > 0) && (
          <motion.section 
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            aria-labelledby="top-rated-title" 
            className="flex flex-col gap-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-col">
                <h2
                  id="top-rated-title"
                  className="text-[24px] font-semibold leading-[29px] tracking-[-0.5px] text-[#E6E1EA]"
                >
                  Top Rated on GameShelf
                </h2>
                <p className="mt-1 text-[13px] leading-4 text-[#A0A0A8]">
                  Highest-rated games based on Bayesian weighted community ratings.
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
            {topRatedLoading && topRatedGames.length === 0 && (
              <p role="status" className="text-sm text-[#A0A0A8]">
                Loading top rated games…
              </p>
            )}

            {topRatedGames.length > 0 && (
              <motion.div
                ref={topRatedRef}
                variants={carouselContainerVariants}
                initial="hidden"
                animate="visible"
                onScroll={(event) => handleRecommendationScroll(event, loadTopRatedPage)}
                className="-mx-1 overflow-x-auto px-1 pt-2 pb-3 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                <div className="flex gap-5">
                  {topRatedGames.map((game) => (
                    <motion.div
                      key={game.id}
                      variants={cardItemVariants}
                      className="w-[260px] h-full shrink-0 snap-start sm:w-[280px] md:w-[300px]"
                    >
                      <GameCard game={game} />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.section>
        )}

        {/* 3. Because You Played */}
        {user && (similarLoading || similarGames.length > 0) && (
          <motion.section 
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="flex flex-col gap-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-col">
                <h2 className="text-[24px] font-semibold leading-[29px] tracking-[-0.5px] text-[#E6E1EA]">
                  Because you played {likedGameTitle}
                </h2>
                <p className="mt-1 text-[13px] leading-4 text-[#A0A0A8]">
                  Titles with matching mechanics and thematic elements.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => scrollSimilar(-1)}
                  aria-label="Scroll left"
                  className="size-8 rounded-lg border-[#302438] bg-[#17191E] text-[#E6E1EA] hover:bg-[#20232B]"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => scrollSimilar(1)}
                  aria-label="Scroll right"
                  className="size-8 rounded-lg border-[#302438] bg-[#17191E] text-[#E6E1EA] hover:bg-[#20232B]"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>

            {similarLoading && similarGames.length === 0 ? (
              <p role="status" className="text-sm text-[#A0A0A8]">Loading similar games…</p>
            ) : (
              <motion.div
                ref={similarRef}
                variants={carouselContainerVariants}
                initial="hidden"
                animate="visible"
                onScroll={(event) => handleRecommendationScroll(event, loadSimilarPage)}
                className="-mx-1 overflow-x-auto px-1 pt-2 pb-3 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                <div className="flex gap-5">
                  {similarGames.map((game) => (
                    <motion.div
                      key={game.id}
                      variants={cardItemVariants}
                      className="w-[260px] h-full shrink-0 snap-start sm:w-[280px] md:w-[300px]"
                    >
                      <GameCard game={game} />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.section>
        )}

        {/* 4. More [Genre]s for You */}
        <motion.section 
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="flex flex-col gap-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-col">
              <h2 className="text-[24px] font-semibold leading-[29px] tracking-[-0.5px] text-[#E6E1EA]">
                More {primaryGenre}s for you
              </h2>
              <p className="mt-1 text-[13px] leading-4 text-[#A0A0A8]">
                Inspired by your preferred genres
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => scrollGenre(-1)}
                aria-label="Scroll left"
                className="size-8 rounded-lg border-[#302438] bg-[#17191E] text-[#E6E1EA] hover:bg-[#20232B]"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => scrollGenre(1)}
                aria-label="Scroll right"
                className="size-8 rounded-lg border-[#302438] bg-[#17191E] text-[#E6E1EA] hover:bg-[#20232B]"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>

          {genreLoading && genreGames.length === 0 ? (
            <p role="status" className="text-sm text-[#A0A0A8]">
              Loading {primaryGenre}s…
            </p>
          ) : genreGames.length === 0 ? (
            <p className="text-sm text-[#A0A0A8]">No games found for this genre.</p>
          ) : (
            <motion.div
              ref={genreRef}
              variants={carouselContainerVariants}
              initial="hidden"
              animate="visible"
              onScroll={(event) => handleRecommendationScroll(event, loadGenrePage)}
              className="-mx-1 overflow-x-auto px-1 pt-2 pb-3 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              <div className="flex gap-5">
                {genreGames.map((game) => (
                  <motion.div
                    key={game.id}
                    variants={cardItemVariants}
                    className="w-[260px] h-full shrink-0 snap-start sm:w-[280px] md:w-[300px]"
                  >
                    <GameCard game={game} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </motion.section>

        {/* 5. Players Like You */}
        {user && (
          <motion.section 
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            aria-labelledby="players-like-you-title" 
            className="flex flex-col gap-5"
          >
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

            {playersLoading && playersGames.length === 0 && (
              <p role="status" className="text-sm text-[#A0A0A8]">
                Loading Players Like You…
              </p>
            )}

            {!playersLoading && !playersError && playersGames.length === 0 && (
              <p className="text-sm text-[#A0A0A8]">
                No player suggestions yet. Rate more games to connect with players who share your tastes.
              </p>
            )}

            {playersGames.length > 0 && (
              <motion.div
                ref={playersRef}
                variants={carouselContainerVariants}
                initial="hidden"
                animate="visible"
                onScroll={(event) => handleRecommendationScroll(event, loadPlayersPage)}
                className="-mx-1 overflow-x-auto px-1 pt-2 pb-3 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                <div className="flex gap-5">
                  {playersGames.map((game) => (
                    <motion.div
                      key={game.id}
                      variants={cardItemVariants}
                      className="w-[300px] h-full sm:w-[340px] md:w-[360px] shrink-0 snap-start"
                    >
                      <GameCard game={game} />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.section>
        )}

        {/* 6. Your Friends Also Play */}
        {user && !friendsLoading && friendsGames.length > 0 && (
          <motion.section 
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            aria-labelledby="friends-also-play-title" 
            className="flex flex-col gap-5"
          >
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

            <motion.div
              ref={friendsPlayRef}
              variants={carouselContainerVariants}
              initial="hidden"
              animate="visible"
              className="-mx-1 overflow-x-auto px-1 pt-2 pb-3 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              <div className="flex gap-5">
                {friendsGames.map((game) => (
                  <motion.div
                    key={game.id}
                    variants={cardItemVariants}
                    className="w-[260px] h-full shrink-0 snap-start sm:w-[280px] md:w-[300px]"
                  >
                    <GameCard game={game} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.section>
        )}
          {/* 7. Community Playlists Section */}
          <motion.section 
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            id="community-playlists" 
            aria-labelledby="community-playlists-title" 
            className="flex flex-col gap-5"
          >
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
              <motion.div 
                ref={carouselRef} 
                variants={carouselContainerVariants}
                initial="hidden"
                animate="visible"
                className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {communityPlaylists.map((playlist) => (
                  <motion.div key={playlist.id} variants={cardItemVariants}>
                    <PlaylistCarouselCard playlist={playlist} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.section>
        </main>
        <Footer />
      </div>
    </div>
  );
}