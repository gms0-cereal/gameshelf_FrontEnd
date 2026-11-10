import { useEffect, useState, useCallback,useInsertionEffect } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/context/AuthContext";
import { fetchPopularNowGames, type UserGameEntry } from "@/services/Gameservice";
import { getTasteProfile } from "@/services/recommendationService";
import { getFavoriteGames } from "@/services/Userservice";
import { getMyGameList } from "@/services/Gameservice";

import HeroBanner, { type HeroGame } from "@/components/games/HeroBanner";
import RecommendedGamesSection from "@/components/games/RecommendedGamesSection";
import PlayersLikeYouSection from "@/components/games/PlayersLikeYouSection";
import SimilarGamesSection from "@/components/games/SimilarGamesSection";
import GenreBrowseSection from "@/components/games/GenreBrowseSection";
import TopRatedSection from "@/components/games/TopRatedSection";
// import FriendsActivitySection from "@/components/games/FriendsActivitySection";
import FriendsActivitySection from "@/components/games/FriendsActvitySection";
import { PlaylistCarouselCard } from "@/components/playlists/PlaylistCards";
import { getPlaylists, type Playlist } from "@/services/playlistService";

export default function Home() {
  const { user } = useAuth();
  const [userListMap, setUserListMap] = useState<Map<string, UserGameEntry>>(new Map());
  
  // Hero Banner State
  const [heroGames, setHeroGames] = useState<HeroGame[]>([]);

  // Dynamic Genre State
  const [primaryGenre, setPrimaryGenre] = useState<string>("Action");

  // Similar Games Reference State ("Because you played...")
  const [likedGameAppId, setLikedGameAppId] = useState<number | null>(730);
  const [likedGameTitle, setLikedGameTitle] = useState<string>("Counter-Strike 2");

  // Community Playlists State
  const [communityPlaylists, setCommunityPlaylists] = useState<Playlist[]>([]);

  // 1. Fetch User Game List & Taste Profile for dynamic rotation
  useEffect(() => {
    let cancelled = false;

    async function loadInitialData() {
      try {
        // Fetch User Library Statuses
        const listData = await getMyGameList();
        if (!cancelled) {
          const map = new Map<string, UserGameEntry>();
          listData.results.forEach((entry) => {
            if (entry.steam_app_id) {
              map.set(String(entry.steam_app_id), entry);
            }
          });
          setUserListMap(map);
        }

        // Fetch Taste Profile & Favorites for rotation
        const [profileRes, favRes, popularRes, playlistRes] = await Promise.allSettled([
          getTasteProfile(),
          getFavoriteGames(),
          fetchPopularNowGames(31),
          getPlaylists({ limit: 8, offset: 0 }),
        ]);

        if (cancelled) return;

        // Genre rotation
        if (profileRes.status === "fulfilled" && profileRes.value?.genres?.length) {
          const genres = profileRes.value.genres;
          const genreIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 2)) % genres.length;
          setPrimaryGenre(genres[genreIndex]);
        }

        // Liked game rotation for Similar Games shelf
        const liked = profileRes.status === "fulfilled" ? (profileRes.value?.liked_games ?? []) : [];
        const favs = favRes.status === "fulfilled" ? (favRes.value ?? []) : [];
        const combined = Array.from(
          new Map(
            [...liked, ...favs.map(f => ({ appid: f.steam_app_id!, title: f.title }))]
              .filter(g => g.appid != null)
              .map(g => [g.appid, g])
          ).values()
        );

        if (combined.length > 0) {
          const selected = combined[Math.floor(Date.now() / (1000 * 60 * 30)) % combined.length];
          setLikedGameAppId(selected.appid);
          setLikedGameTitle(selected.title);
        }

        // Hero Banner Summaries
        if (popularRes.status === "fulfilled" && popularRes.value.length > 0) {
          const popularAppIds = popularRes.value.slice(0, 10).map((i) => i.appid);
          const response = await fetch(`/api/v1/games/steam/summaries/?appids=${popularAppIds.join(",")}`);
          if (response.ok) {
            const data = await response.json();
            const summaries = (data.results || []).map((card: any) => ({
              id: card.appid,
              slug: card.appid,
              title: card.name,
              cover: card.header_image,
              score: card.community_rating ?? null,
              bio: card.short_description || "",
            }));
            setHeroGames(summaries);
          }
        }

        // Playlists
        if (playlistRes.status === "fulfilled") {
          setCommunityPlaylists(playlistRes.value.results || []);
        }
      } catch {
        // Fallbacks handled gracefully by child components
      }
    }

    void loadInitialData();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#000000]">
      <div
        className="flex min-h-screen w-full flex-col bg-[#000000] text-[#E6E1EA] antialiased"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <Navbar />
        <main className="flex flex-1 flex-col gap-10 px-5 pb-16 pt-11 md:px-8 xl:px-16">
          {/* Welcome Header */}
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
              <h1 className="text-[36px] font-semibold leading-[41px] tracking-[-0.8px] text-[#E6E1EA]">
                Home
              </h1>
            </div>
          </motion.div>

          {/* Hero Banner Carousel */}
          <HeroBanner heroGames={heroGames} />

          {/* 1. Recommended for You (K-Means) */}
          <RecommendedGamesSection />

          {/* 2. Players Like You Also Play (SVD) */}
          <PlayersLikeYouSection />

          {/* 3. Similar Games ("Because you played...") */}
          {likedGameAppId && (
            <SimilarGamesSection
              appId={likedGameAppId}
              likedGameTitle={likedGameTitle}
            />
          )}

          {/* 4. Dynamic Genre Section ("More [Genre]s for You") */}
          <GenreBrowseSection primaryGenre={primaryGenre} />

          {/* 5. All-Time Top Rated */}
          <TopRatedSection userListMap={userListMap} />

          {/* 6. Friends Also Play */}
          <FriendsActivitySection />

          {/* 7. Community Playlists Section */}
          {communityPlaylists.length > 0 && (
            <section aria-labelledby="community-playlists-title" className="flex flex-col gap-5">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2
                    id="community-playlists-title"
                    className="text-[24px] font-semibold leading-[29px] tracking-[-0.5px] text-[#E6E1EA]"
                  >
                    Community Playlists
                  </h2>
                  <p className="mt-1 text-[13px] leading-4 text-[#A0A0A8]">
                    Curated game collections built by players across the platform
                  </p>
                </div>
              </div>
              
              <div className="flex gap-5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {communityPlaylists.map((playlist) => (
                  <div key={playlist.id} className="w-[260px] sm:w-[280px] shrink-0 snap-start">
                    <PlaylistCarouselCard playlist={playlist} />
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
        <Footer />
      </div>
    </div>
  );
}