import { useCallback, useEffect, useMemo, useRef, useState, memo } from "react";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { isAxiosError } from "axios";
import { AnimatePresence, motion, useAnimationControls } from "framer-motion";
import { Check, Copy, Heart, Info, LayoutGrid, List, Loader2, Pencil, X } from "lucide-react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { timeAgo } from "../components/playlists/PlaylistCards";
import {
  copyPlaylist,
  getPlaylist,
  toggleLikePlaylist,
  type Playlist,
  type PlaylistGame,
} from "../services/playlistService";
import MiniProfileCard from "@/components/social/MiniProfileCard";
import { getUserProfile, type UserProfile } from "../services/Userservice";
import { useAuth } from "@/context/AuthContext";

const steamCover = (appid: number) =>
  `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${appid}/header.jpg`;

const coverFor = (g: PlaylistGame) =>
  g.cover_url ?? (g.steam_appid ? steamCover(g.steam_appid) : null);

const TOP_GENRES_SHOWN = 10;

// Same toast (by key) can only appear once per this many milliseconds.
const TOAST_COOLDOWN_MS = 30_000;

// How long the copy button's success state stays visible before opening the new copy.
const COPY_SUCCESS_DELAY_MS = 1200;

const SORTS = [
  { value: "order", label: "Curated (author's order)" },
  { value: "title", label: "Title (A–Z)" },
  { value: "title_desc", label: "Title (Z–A)" },
] as const;
type Sort = (typeof SORTS)[number]["value"];

/* ----------------------------- Toasts ----------------------------- */

type ToastKind = "success" | "error" | "info";
type ToastItem = { id: number; kind: ToastKind; message: string };

const TOAST_STYLES: Record<ToastKind, string> = {
  success: "border-[#34D399] text-[#34D399]",
  error: "border-[#E58B91] text-[#E58B91]",
  info: "border-[#B39ACF] text-[#B39ACF]",
};

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div
      className="pointer-events-none fixed bottom-6 right-6 z-[100] flex w-[calc(100%-3rem)] max-w-sm flex-col gap-2"
      role="status"
      aria-live="polite"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border bg-[#17191E] px-4 py-3 text-[13px] shadow-lg ${TOAST_STYLES[t.kind]}`}
          >
            {t.kind === "success" ? (
              <Check className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            ) : (
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            )}
            <p className="flex-1 text-[#E6E1EA]">{t.message}</p>
            <button
              type="button"
              onClick={() => onDismiss(t.id)}
              aria-label="Dismiss notification"
              className="text-[#A0A0A8] hover:text-[#E6E1EA]"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* --------------------------- Small pieces -------------------------- */

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
    <div className={`bg-gradient-to-br from-[#302438] to-[#17191E] ${className}`} aria-hidden="true" />
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
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#302438] to-[#17191E] text-[11px] font-semibold text-[#B39ACF]" aria-hidden="true">
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
      title={game.title}
      aria-label={game.title}
      className={`${className} transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B39ACF]`}
    >
      {children}
    </Link>
  ) : (
    <div title={game.title} aria-label={game.title} className={className}>
      {children}
    </div>
  );
}

/* Remember (per browser) that this user already copied a playlist. */
const copiedKey = (playlistId: number) => `playlist-copied:${playlistId}`;
const readCopied = (playlistId: number) => {
  try {
    return localStorage.getItem(copiedKey(playlistId)) === "1";
  } catch {
    return false;
  }
};
const writeCopied = (playlistId: number) => {
  try {
    localStorage.setItem(copiedKey(playlistId), "1");
  } catch {
    /* storage unavailable – the server check still applies */
  }
};

/* ------------------------------ Page ------------------------------- */

const PlaylistDetail = () => {
  const { id, username } = useParams<{ id: string; username?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user: currentUser } = useAuth();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liking, setLiking] = useState(false);
  const [copying, setCopying] = useState(false);
  const [alreadyCopied, setAlreadyCopied] = useState(false);

  const [sort, setSort] = useState<Sort>("order");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [genreFilter, setGenreFilter] = useState<string | null>(null);
  const [showAllGenres, setShowAllGenres] = useState(false);

  const [showMiniProfile, setShowMiniProfile] = useState(false);
  const profileCardRef = useRef<HTMLDivElement>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const dismissToast = useCallback((tid: number) => {
    setToasts((t) => t.filter((x) => x.id !== tid));
  }, []);
  const pushToast = useCallback(
    (kind: ToastKind, message: string) => {
      const tid = Date.now() + Math.random();
      setToasts((t) => [...t, { id: tid, kind, message }]);
      window.setTimeout(() => dismissToast(tid), 4000);
    },
    [dismissToast]
  );

  // Throttled toasts: the same key can only show once per TOAST_COOLDOWN_MS.
  const lastToastAt = useRef<Record<string, number>>({});
  const pushThrottledToast = useCallback(
    (key: string, kind: ToastKind, message: string) => {
      const now = Date.now();
      if (now - (lastToastAt.current[key] ?? 0) < TOAST_COOLDOWN_MS) return false;
      lastToastAt.current[key] = now;
      pushToast(kind, message);
      return true;
    },
    [pushToast]
  );

  // Copy button animation controls (used for the "already copied" shake)
  const copyControls = useAnimationControls();
  const shakeCopyButton = () =>
    copyControls.start({ x: [0, -6, 6, -4, 4, 0], transition: { duration: 0.4 } });

  // Toast handed over by another page (e.g. "Playlist updated." after editing).
  const handoffToastShown = useRef(false);
  useEffect(() => {
    const message = (location.state as { toast?: string } | null)?.toast;
    if (!message || handoffToastShown.current) return;
    handoffToastShown.current = true;
    pushToast("success", message);
    navigate(location.pathname, { replace: true, state: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  const [, setLoadingProfile] = useState(false);

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
    setPlaylist(null); // don't show the previous playlist while the new one loads
    setMiniProfileUser(null); // don't reuse the previous owner's profile card
    setShowMiniProfile(false);
    setAlreadyCopied(readCopied(playlistId));

    getPlaylist(playlistId)
      .then((data) => {
        if (cancelled) return;
        setPlaylist(data);
        // Prefer the server's answer if it provides one
        if ((data as any).has_copied) setAlreadyCopied(true);
      })
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

  // Like / unlike. Updates instantly, then syncs with the server's real count
  const handleLikeToggle = async () => {
    if (!playlist || liking) return;
    const playlistId = Number(id);
    if (!Number.isInteger(playlistId)) return;

    setLiking(true);
    const previousIsLiked = Boolean((playlist as any).is_liked);
    const previousLikeCount = playlist.like_count;

    const nextIsLiked = !previousIsLiked;
    setPlaylist({
      ...playlist,
      is_liked: nextIsLiked,
      like_count: nextIsLiked ? previousLikeCount + 1 : Math.max(0, previousLikeCount - 1),
    } as any);

    try {
      const res = await toggleLikePlaylist(playlistId);
      setPlaylist((prev) =>
        prev
          ? ({ ...prev, like_count: res.like_count, is_liked: res.is_liked } as any)
          : null
      );
    } catch {
      setPlaylist((prev) =>
        prev ? ({ ...prev, is_liked: previousIsLiked, like_count: previousLikeCount } as any) : null
      );
    } finally {
      setLiking(false);
    }
  };

  const handleCopy = async () => {
    if (!playlist || copying) return;
    const playlistId = Number(id);
    if (!Number.isInteger(playlistId)) return;

    if (alreadyCopied) {
      shakeCopyButton();
      pushThrottledToast(
        "already-copied",
        "info",
        "You can only copy a playlist once. Check your library for your copy."
      );
      return;
    }

    setCopying(true);
    try {
      const created = await copyPlaylist(playlistId);
      writeCopied(playlistId);
      setAlreadyCopied(true);
      setCopying(false);
      pushToast("success", "Playlist copied to your library!");
      const newOwner = created.owner?.username;
      if (newOwner) {
        await new Promise((resolve) => window.setTimeout(resolve, COPY_SUCCESS_DELAY_MS));
        navigate(`/playlists/${encodeURIComponent(newOwner)}/${created.id}`);
      }
    } catch (err) {
      const status = isAxiosError(err) ? err.response?.status : undefined;
      const detail: string | undefined = isAxiosError(err) ? err.response?.data?.detail : undefined;
      if (status === 409 || (detail && /already|once/i.test(detail))) {
        writeCopied(playlistId);
        setAlreadyCopied(true);
        shakeCopyButton();
        pushThrottledToast(
          "already-copied",
          "info",
          "You can only copy a playlist once. Check your library for your copy."
        );
      } else {
        pushThrottledToast("copy-error", "error", detail || "Couldn't copy this playlist. Please try again.");
      }
    } finally {
      setCopying(false);
    }
  };

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

  const ownerUsername = playlist?.owner?.username;
  const ownerName = playlist?.owner?.nickname || ownerUsername || "Player";
  const ownerAvatar = playlist?.owner?.avatar_url;
  const total = playlist?.games.length ?? 0;
  const shownGenres = showAllGenres ? genreCounts : genreCounts.slice(0, TOP_GENRES_SHOWN);
  const hiddenGenres = genreCounts.length - TOP_GENRES_SHOWN;
  const isLiked = Boolean((playlist as any)?.is_liked);
  const isOwner =
    Boolean((playlist as any)?.is_owner) ||
    (!!currentUser?.username &&
      !!ownerUsername &&
      currentUser.username.toLowerCase() === ownerUsername.toLowerCase());
  const canCopy = !isOwner;

  const editLinkProps = playlist
    ? { to: `/playlists/${playlist.id}/edit`, state: { playlist } }
    : null;

  if (
    playlist &&
    playlist.id === Number(id) &&
    ownerUsername &&
    username?.toLowerCase() !== ownerUsername.toLowerCase()
  ) {
    return <Navigate to={`/playlists/${encodeURIComponent(ownerUsername)}/${playlist.id}`} replace />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#000000] font-sans text-[#E6E1EA]">
      <Navbar />

      <main className="mx-auto w-full max-w-[1440px] flex-1 px-5 py-8 md:px-8 xl:px-16">
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 text-[#A0A0A8]">
            <Loader2 className="size-6 animate-spin text-[#B39ACF]" aria-hidden="true" />
            <p className="mt-2 text-sm">Loading playlist...</p>
          </div>
        )}

        {error && (
          <p role="alert" className="rounded-xl border border-[#E58B91] bg-[#E58B91]/15 px-4 py-3 text-sm text-[#E58B91]">
            {error}
          </p>
        )}

        {playlist && (
          <>
            {/* Header: details left, compiled genres right */}
            <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
              <div>
                <motion.div
                  initial={{ opacity: 0, y: -12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="flex items-center gap-3"
                >
                  <div className="relative inline-block" ref={profileCardRef}>
                    <button
                      type="button"
                      onClick={handleAvatarClick}
                      className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#B39ACF]/20 text-xs font-semibold overflow-hidden border border-[#554363] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B39ACF]"
                      aria-label={`View ${ownerName}'s profile card`}
                    >
                      <OwnerAvatar src={getFullUrl(ownerAvatar)} name={ownerName} />
                    </button>

                    {showMiniProfile && playlist.owner && (
                      <div className="absolute left-0 top-full z-50 mt-2">
                        <MiniProfileCard
                          user={{
                            ...playlist.owner,
                            ...(miniProfileUser ?? {}),
                            avatar_url: getFullUrl(miniProfileUser?.avatar_url || playlist.owner.avatar_url),
                            banner_url: getFullUrl(miniProfileUser?.banner_url || playlist.owner.banner_url),
                          }}
                          side="bottom"
                        />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-semibold text-[#E6E1EA]">
                      {ownerName}
                    </p>
                    <p className="text-[11px] text-[#A0A0A8]">
                      <span className="capitalize text-[#B39ACF]">
                        {playlist.visibility}
                      </span>
                      {" · "}
                      <span className="text-[#38BDF8]">
                        {total} {total === 1 ? "title" : "titles"}
                      </span>
                      {" · Created "}
                      <span className="text-[#FBBF24]">
                        {timeAgo(playlist.created_at)}
                      </span>
                      {" · Updated "}
                      <span className="text-[#34D399]">
                        {timeAgo(playlist.updated_at)}
                      </span>
                    </p>
                  </div>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.05, ease: "easeOut" }}
                  className="mt-4 text-[32px] font-semibold leading-[41px] tracking-[-0.8px] text-[#E6E1EA]"
                >
                  {playlist.title}
                </motion.h1>

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
                  className="mt-5 flex flex-wrap items-center gap-3"
                >
                  {/* Interactive Like Button */}
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={handleLikeToggle}
                    disabled={liking}
                    aria-pressed={isLiked}
                    aria-label={isLiked ? "Unlike playlist" : "Like playlist"}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-medium transition-colors border ${
                      isLiked
                        ? "border-[#E58B91] bg-[#E58B91]/20 text-[#E58B91] hover:bg-[#E58B91]/30"
                        : "border-[#302438] bg-[#17191E] text-[#E6E1EA] hover:border-[#554363]"
                    }`}
                  >
                    <Heart className={`size-4 ${isLiked ? "fill-[#E58B91] text-[#E58B91]" : "text-[#B39ACF]"}`} aria-hidden="true" />
                    <span>{playlist.like_count}</span>
                  </motion.button>

                  {/* Copy button: shown on every playlist that belongs to someone else */}
                  {canCopy && (
                    <motion.button
                      type="button"
                      onClick={handleCopy}
                      disabled={copying}
                      aria-disabled={alreadyCopied}
                      animate={copyControls}
                      whileHover={!alreadyCopied && !copying ? { scale: 1.04 } : undefined}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                      className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-[13px] font-semibold transition-colors disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B39ACF] focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
                        alreadyCopied
                          ? "border-[#554363] bg-[#17191E] text-[#A0A0A8]"
                          : "border-[#B39ACF] bg-[#B39ACF] text-[#17191E] hover:bg-[#B39ACF]/85"
                      }`}
                    >
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.span
                          key={copying ? "copying" : alreadyCopied ? "copied" : "idle"}
                          initial={{ opacity: 0, scale: 0.4, rotate: -90 }}
                          animate={{ opacity: 1, scale: 1, rotate: 0 }}
                          exit={{ opacity: 0, scale: 0.4, rotate: 90 }}
                          transition={{ type: "spring", stiffness: 180, damping: 18 }}
                          className="inline-flex"
                        >
                          {copying ? (
                            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                          ) : alreadyCopied ? (
                            <Check className="size-4" aria-hidden="true" />
                          ) : (
                            <Copy className="size-4" aria-hidden="true" />
                          )}
                        </motion.span>
                      </AnimatePresence>

                      <AnimatePresence mode="wait" initial={false}>
                        <motion.span
                          key={copying ? "copying" : alreadyCopied ? "copied" : "idle"}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.35, ease: "easeInOut" }}
                        >
                          {copying ? "Copying..." : alreadyCopied ? "Already copied" : "Make a copy"}
                        </motion.span>
                      </AnimatePresence>
                    </motion.button>
                  )}

                  {/* Owner only: opens the create page already filled in with this playlist. */}
                  {isOwner && editLinkProps && (
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }}>
                      <Link
                        {...editLinkProps}
                        className="inline-flex items-center gap-2 rounded-xl border border-[#302438] bg-[#17191E] px-4 py-2.5 text-[13px] font-semibold text-[#E6E1EA] transition-colors hover:border-[#554363] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B39ACF]"
                      >
                        <Pencil className="size-4 text-[#B39ACF]" aria-hidden="true" />
                        <span>Edit playlist</span>
                      </Link>
                    </motion.div>
                  )}
                </motion.div>
              </div>

              <motion.aside
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.12, ease: "easeOut" }}
                aria-label="Top genres"
                className="rounded-2xl border border-[#302438] bg-[#17191E] p-6 shadow-none"
              >
                <p className="font-mono text-[10px] uppercase tracking-widest text-[#77717F]">Top genres</p>
                {genreCounts.length === 0 ? (
                  <p className="mt-3 text-xs text-[#A0A0A8]">No genre info for these games yet.</p>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {shownGenres.map(([name, n]) => {
                      const active = genreFilter === name;
                      return (
                        <motion.button
                          key={name}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.95 }}
                          type="button"
                          onClick={() => setGenreFilter(active ? null : name)}
                          aria-pressed={active}
                          className={`rounded-xl border px-3 py-1.5 text-[12px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B39ACF] ${
                            active
                              ? "border-[#B39ACF] bg-[#B39ACF] font-semibold text-[#17191E]"
                              : "border-[#302438] bg-[#000000] text-[#E6E1EA] hover:border-[#554363]"
                          }`}
                        >
                          {name} <span className="ml-1 text-[11px] text-[#A0A0A8]">{n}</span>
                        </motion.button>
                      );
                    })}
                    {hiddenGenres > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowAllGenres((v) => !v)}
                        className="px-1 text-[12px] text-[#B39ACF] hover:underline"
                      >
                        {showAllGenres ? "Show less" : `+${hiddenGenres} more`}
                      </button>
                    )}
                  </div>
                )}
              </motion.aside>
            </div>

            {/* Toolbar */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.16, ease: "easeOut" }}
              className="mt-10 flex flex-wrap items-center justify-between gap-3"
            >
              <p className="text-[12px] text-[#A0A0A8]" aria-live="polite">
                <span className="font-semibold text-[#E6E1EA]">{visibleGames.length}</span> items
                {genreFilter && (
                  <>
                    {" "}in <span className="text-[#B39ACF]">{genreFilter}</span> ·{" "}
                    <button
                      type="button"
                      onClick={() => setGenreFilter(null)}
                      className="underline hover:text-[#E6E1EA]"
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
                  className="h-10 rounded-xl border border-[#302438] bg-[#17191E] px-3 text-[13px] text-[#E6E1EA] focus:outline-none focus:ring-2 focus:ring-[#B39ACF]/60"
                >
                  {SORTS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>

                <div className="flex rounded-xl border border-[#302438] bg-[#17191E] p-1" role="group" aria-label="View">
                  {([["list", List], ["grid", LayoutGrid]] as const).map(([mode, Icon]) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setView(mode)}
                      aria-pressed={view === mode}
                      aria-label={`${mode} view`}
                      className={`flex size-8 items-center justify-center rounded-lg transition-colors ${
                        view === mode ? "bg-[#B39ACF] text-[#17191E]" : "text-[#A0A0A8] hover:text-[#E6E1EA]"
                      }`}
                    >
                      <Icon className="size-4" />
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Games */}
            {view === "grid" ? (
              <motion.ul
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
              >
                {visibleGames.map((game) => (
                  <motion.li
                    key={game.id}
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.985 }}
                    transition={{ type: "spring", stiffness: 400, damping: 28 }}
                    className="flex"
                  >
                    <GameLink game={game} className="group block w-full">
                      <Cover
                        src={coverFor(game)}
                        className="aspect-[16/9] w-full rounded-2xl border border-[#302438] bg-[#17191E] transition-transform duration-200 group-hover:scale-[1.02] group-hover:border-[#554363]"
                      />
                    </GameLink>
                  </motion.li>
                ))}
              </motion.ul>
            ) : (
              <motion.ol
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="mt-6 space-y-3"
              >
                {visibleGames.map((game, i) => (
                  <motion.li
                    key={game.id}
                    whileHover={{ x: 2 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  >
                    <GameLink
                      game={game}
                      className="flex items-center gap-4 rounded-2xl border border-[#302438] bg-[#17191E] p-4 hover:border-[#554363]"
                    >
                      <span className="w-6 text-xs text-[#77717F] font-mono">{String(i + 1).padStart(2, "0")}</span>
                      <Cover src={coverFor(game)} className="h-14 w-24 shrink-0 rounded-xl border border-[#302438]" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#E6E1EA]">{game.title}</p>
                        {game.genres.length > 0 && (
                          <p className="truncate text-xs text-[#A0A0A8]">{game.genres.join(" / ")}</p>
                        )}
                        {game.note && <p className="mt-1 text-xs text-[#E6E1EA]/80">{game.note}</p>}
                      </div>
                    </GameLink>
                  </motion.li>
                ))}
              </motion.ol>
            )}

            {visibleGames.length === 0 && (
              <p className="mt-6 rounded-2xl border border-dashed border-[#302438] p-10 text-center text-xs text-[#A0A0A8]">
                {total === 0 ? "This playlist has no games yet." : "No games match this genre."}
              </p>
            )}
          </>
        )}
      </main>

      <Footer />

      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};

export default PlaylistDetail;