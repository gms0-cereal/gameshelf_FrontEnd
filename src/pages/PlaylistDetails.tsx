import { useEffect, useMemo, useState, memo, useRef} from "react";
import { Link, useParams } from "react-router-dom";
import { isAxiosError } from "axios";
import { Heart, LayoutGrid, List, Loader2 } from "lucide-react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { timeAgo } from "../components/playlists/PlaylistCards";
import { getPlaylist, toggleLikePlaylist, type Playlist, type PlaylistGame } from "../services/playlistService";
import MiniProfileCard from "@/components/social/MiniProfileCard";
import { getUserProfile, type UserProfile } from "../services/Userservice";

const steamCover = (appid: number) =>
  `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${appid}/header.jpg`;

const coverFor = (g: PlaylistGame) =>
  g.cover_url ?? (g.steam_appid ? steamCover(g.steam_appid) : null);

const TOP_GENRES_SHOWN = 10;

const SORTS = [
  { value: "order", label: "Curated (author's order)" },
  { value: "title", label: "Title (A–Z)" },
  { value: "title_desc", label: "Title (Z–A)" },
] as const;
type Sort = (typeof SORTS)[number]["value"];

/** Cover image, with a soft gradient if it fails to load or is missing. */
const Cover = memo(({ src, className }: { src?: string | null; className: string }) => {
  const [failed, setFailed] = useState(false);
  return src && !failed ? (
    <img
      src={src}
      alt=""
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  ) : (
    <div className={`bg-gradient-to-br from-[#3b3560] to-[#1d2b33] ${className}`} aria-hidden="true" />
  );
});
Cover.displayName = "Cover";

const getFullUrl = (url?: string | null) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `http://127.0.0.1:8000${url.startsWith("/") ? "" : "/"}${url}`;
};

/** Owner Avatar with automatic error fallback to gradient and initials. */
const OwnerAvatar = memo(({ src, name }: { src?: string | null; name: string }) => {
  const [failed, setFailed] = useState(false);
  const initials = name ? name.slice(0, 2).toUpperCase() : "U";

  return src && !failed ? (
    <img
      src={src}
      alt={name}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className="h-full w-full object-cover"
    />
  ) : (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#3b3560] to-[#1d2b33] text-[11px] font-semibold text-[#c2ade7]" aria-hidden="true">
      {initials}
    </div>
  );
});
OwnerAvatar.displayName = "OwnerAvatar";

/** Wraps a game in a link to its details page when it has a Steam id. */
function GameLink({ game, className, children }: { game: PlaylistGame; className: string; children: React.ReactNode }) {
  return game.steam_appid ? (
    <Link
      to={`/gamedetails/${game.steam_appid}`}
      className={`${className} transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8b6fd6]`}
    >
      {children}
    </Link>
  ) : (
    <div className={className}>{children}</div>
  );
}

const PlaylistDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liking, setLiking] = useState(false);

  const [sort, setSort] = useState<Sort>("order");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [genreFilter, setGenreFilter] = useState<string | null>(null);
  const [showAllGenres, setShowAllGenres] = useState(false);

  const [showMiniProfile, setShowMiniProfile] = useState(false);
  const profileCardRef = useRef<HTMLDivElement>(null);

  // Close mini profile when clicking outside of it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileCardRef.current && !profileCardRef.current.contains(event.target as Node)) {
        setShowMiniProfile(false);
      }
    }
    if (showMiniProfile) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMiniProfile]);
  const [miniProfileUser, setMiniProfileUser] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const handleAvatarClick = async () => {
    if (showMiniProfile) {
      setShowMiniProfile(false);
      return;
    }

    setShowMiniProfile(true);

    if (playlist?.owner?.username && !miniProfileUser) {
      setLoadingProfile(true);
      try {
        const data = await getUserProfile(playlist.owner.username);
        setMiniProfileUser(data);
      } catch {
        // Gracefully fall back to owner basic info on network error
      } finally {
        setLoadingProfile(false);
      }
    }
  };
  useEffect(() => {
    const playlistId = Number(id);
    if (!Number.isInteger(playlistId)) {
      setError("Playlist not found.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    getPlaylist(playlistId)
      .then((data) => !cancelled && setPlaylist(data))
      .catch((err) => {
        if (cancelled) return;
        setError(
          isAxiosError(err) && err.response?.status === 404
            ? "This playlist doesn't exist or is private."
            : "Couldn't load this playlist. Please try again."
        );
      })
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [id]);

  // Handle like toggle functionality
  const handleLikeToggle = async () => {
    if (!playlist || liking) return;
    const playlistId = Number(id);
    if (!Number.isInteger(playlistId)) return;

    setLiking(true);
    const previousIsLiked = (playlist as any).is_liked;
    const previousLikeCount = playlist.like_count;

    // Optimistic UI Update
    const nextIsLiked = !previousIsLiked;
    setPlaylist({
      ...playlist,
      is_liked: nextIsLiked,
      like_count: nextIsLiked ? previousLikeCount + 1 : Math.max(0, previousLikeCount - 1),
    } as any);

    try {
      const res = await toggleLikePlaylist(playlistId);
      if (res && typeof res.like_count === "number") {
        setPlaylist((prev) => prev ? { ...prev, like_count: res.like_count, is_liked: res.is_liked ?? nextIsLiked } : null);
      }
    } catch {
      // Rollback on error
      setPlaylist((prev) => prev ? { ...prev, is_liked: previousIsLiked, like_count: previousLikeCount } : null);
    } finally {
      setLiking(false);
    }
  };

  // Genres compiled from every game in the playlist
  const genreCounts = useMemo(() => {
    const counts = new Map<string, number>();
    playlist?.games.forEach((g) =>
      new Set(g.genres).forEach((name) => counts.set(name, (counts.get(name) ?? 0) + 1))
    );
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [playlist]);

  const visibleGames = useMemo(() => {
    let games = [...(playlist?.games ?? [])];
    if (genreFilter) games = games.filter((g) => g.genres.includes(genreFilter));
    if (sort === "title") games.sort((a, b) => a.title.localeCompare(b.title));
    if (sort === "title_desc") games.sort((a, b) => b.title.localeCompare(a.title));
    return games;
  }, [playlist, sort, genreFilter]);

  const ownerName = playlist?.owner?.nickname || playlist?.owner?.username || "Player";
  const ownerAvatar = playlist?.owner?.avatar_url;
  const total = playlist?.games.length ?? 0;
  const shownGenres = showAllGenres ? genreCounts : genreCounts.slice(0, TOP_GENRES_SHOWN);
  const hiddenGenres = genreCounts.length - TOP_GENRES_SHOWN;
  const isLiked = Boolean((playlist as any)?.is_liked);

  return (
    <div className="flex min-h-screen flex-col bg-[#282539] font-sans text-[#e6e3f5]">
      <Navbar />

      <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-8 sm:px-6 lg:px-[52px]">
        <nav className="font-mono text-[11px] uppercase tracking-widest text-[#8f8ca9]" aria-label="Breadcrumb">
          <Link to="/home" className="hover:text-[#e6e3f5]">Home</Link>
          <span className="mx-2">/</span>
          <Link to="/playlists" className="hover:text-[#e6e3f5]">Community playlists</Link>
          <span className="mx-2">/</span>
          <span className="text-[#e6e3f5]">{playlist?.title ?? "Playlist"}</span>
        </nav>

        {loading && (
          <p className="mt-10 flex items-center gap-2 text-sm text-[#a9a6c2]">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Loading…
          </p>
        )}

        {error && (
          <p role="alert" className="mt-10 rounded-lg border border-[#a8454b] bg-[#a8454b]/15 px-3 py-2 text-[13px] text-[#f4b6ba]">
            {error}
          </p>
        )}

        {playlist && (
          <>
            {/* Header: details left, compiled genres right */}
          <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_380px]">
            <div>
              <div className="flex items-center gap-3">

          <div className="relative inline-block" ref={profileCardRef}>
            <button
              type="button"
              onClick={handleAvatarClick} // <--- Use the proper handler function here!
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#8b6fd6]/40 text-xs font-semibold overflow-hidden border border-[#8b6fd6]/30 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8b6fd6]"
              aria-label={`View ${ownerName}'s profile card`}
            >
              <OwnerAvatar src={getFullUrl(ownerAvatar)} name={ownerName} />
            </button>

            {showMiniProfile && playlist.owner && (
              <div className="absolute left-0 top-full z-50">
                <MiniProfileCard
                  user={{
                    ...playlist.owner,
                    ...(miniProfileUser ?? {}), // <--- Pulls in the full profile data (banner, bio, favorites)
                    avatar_url: getFullUrl(miniProfileUser?.avatar_url || playlist.owner.avatar_url),
                    banner_url: getFullUrl(miniProfileUser?.banner_url || playlist.owner.banner_url),
                  }}
                  side="bottom"
                />
              </div>
            )}  
          </div>

      <div className="min-w-0">
        <p className="truncate text-[14px] font-semibold">{ownerName}</p>
        <p className="font-mono text-[11px] text-[#8f8ca9]">
          <span className="capitalize">{playlist.visibility}</span> · {total}{" "}
          {total === 1 ? "title" : "titles"} · Created {timeAgo(playlist.created_at)} · Updated{" "}
          {timeAgo(playlist.updated_at)}
        </p>
      </div>
    </div>

    <h1 className="mt-4 text-[32px] font-semibold leading-tight">{playlist.title}</h1>
                {/* Interactive Like Button */}
                <button
                  type="button"
                  onClick={handleLikeToggle}
                  disabled={liking}
                  aria-label={isLiked ? "Unlike playlist" : "Like playlist"}
                  className={`mt-5 inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-[13px] transition-colors border ${
                    isLiked
                      ? "border-[#a8454b] bg-[#a8454b]/20 text-[#f4b6ba] hover:bg-[#a8454b]/30"
                      : "border-[#3a3754] bg-[#312e45] text-[#e6e3f5] hover:border-[#8b6fd6]"
                  }`}
                >
                  <Heart className={`size-4 ${isLiked ? "fill-[#f4b6ba] text-[#f4b6ba]" : ""}`} aria-hidden="true" />
                  <span>{playlist.like_count}</span>
                </button>
              </div>

              <aside aria-label="Top genres">
                <p className="font-mono text-[10px] uppercase tracking-widest text-[#8f8ca9]">Top genres</p>
                {genreCounts.length === 0 ? (
                  <p className="mt-3 text-xs text-[#a9a6c2]">No genre info for these games yet.</p>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {shownGenres.map(([name, n]) => {
                      const active = genreFilter === name;
                      return (
                        <button
                          key={name}
                          type="button"
                          onClick={() => setGenreFilter(active ? null : name)}
                          aria-pressed={active}
                          className={`rounded-md border px-2.5 py-1 text-[12px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8b6fd6] ${
                            active
                              ? "border-[#8b6fd6] bg-[#8b6fd6]/25"
                              : "border-[#3a3754] bg-[#312e45] hover:border-[#6b5fb0]"
                          }`}
                        >
                          {name} <span className="ml-1 font-mono text-[11px] text-[#8f8ca9]">{n}</span>
                        </button>
                      );
                    })}
                    {hiddenGenres > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowAllGenres((v) => !v)}
                        className="px-1 text-[12px] text-[#8f8ca9] hover:text-[#e6e3f5]"
                      >
                        {showAllGenres ? "Show less" : `+${hiddenGenres} more`}
                      </button>
                    )}
                  </div>
                )}
              </aside>
            </div>

            {/* Toolbar */}
            <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
              <p className="font-mono text-[12px] text-[#8f8ca9]" aria-live="polite">
                <span className="font-semibold text-[#e6e3f5]">{visibleGames.length}</span> items
                {genreFilter && (
                  <>
                    {" "}in <span className="text-[#c2ade7]">{genreFilter}</span> ·{" "}
                    <button
                      type="button"
                      onClick={() => setGenreFilter(null)}
                      className="underline hover:text-[#e6e3f5]"
                    >
                      clear
                    </button>
                  </>
                )}
              </p>

              <div className="flex items-center gap-2">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as Sort)}
                  aria-label="Sort games"
                  className="h-10 rounded-lg border border-[#3a3754] bg-[#312e45] px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#8b6fd6]/60"
                >
                  {SORTS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>

                <div className="flex rounded-lg bg-[#312e45] p-1" role="group" aria-label="View">
                  {([["list", List], ["grid", LayoutGrid]] as const).map(([mode, Icon]) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setView(mode)}
                      aria-pressed={view === mode}
                      aria-label={`${mode} view`}
                      className={`flex size-8 items-center justify-center rounded-md ${
                        view === mode ? "bg-[#463f66]" : "text-[#a9a6c2] hover:text-[#e6e3f5]"
                      }`}
                    >
                      <Icon className="size-4" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Games */}
            {view === "grid" ? (
              <ul className="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
                {visibleGames.map((game) => (
                  <li key={game.id}>
                    <GameLink game={game} className="group block">
                      <Cover
                        src={coverFor(game)}
                        className="aspect-[16/9] w-full rounded-xl border border-[#3a3754] group-hover:border-[#8b6fd6]"
                      />
                      <p className="mt-3 truncate text-center text-[14px] font-semibold group-hover:text-[#c2ade7]">
                        {game.title}
                      </p>
                      {game.genres.length > 0 && (
                        <p className="mt-0.5 truncate text-center font-mono text-[11px] text-[#8f8ca9]">
                          {game.genres.slice(0, 3).join(" · ")}
                        </p>
                      )}
                    </GameLink>
                  </li>
                ))}
              </ul>
            ) : (
              <ol className="mt-6 space-y-2">
                {visibleGames.map((game, i) => (
                  <li key={game.id}>
                    <GameLink
                      game={game}
                      className="flex items-center gap-4 rounded-xl border border-[#3a3754] bg-[#312e45] p-3 hover:border-[#8b6fd6]"
                    >
                      <span className="w-6 text-xs text-[#8f8ca9]">{String(i + 1).padStart(2, "0")}</span>
                      <Cover src={coverFor(game)} className="h-14 w-24 shrink-0 rounded-md" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{game.title}</p>
                        {game.genres.length > 0 && (
                          <p className="truncate text-xs text-[#a9a6c2]">{game.genres.join(" / ")}</p>
                        )}
                        {game.note && <p className="mt-1 text-xs text-[#c9c6e0]">{game.note}</p>}
                      </div>
                    </GameLink>
                  </li>
                ))}
              </ol>
            )}

            {visibleGames.length === 0 && (
              <p className="mt-6 rounded-xl border border-dashed border-[#4a4766] p-6 text-center text-xs text-[#a9a6c2]">
                {total === 0 ? "This playlist has no games yet." : "No games match this genre."}
              </p>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default PlaylistDetail;