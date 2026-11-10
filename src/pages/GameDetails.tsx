import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ChevronDown,
  Heart,
  PenLine,
  Play,
  Plus,
  X,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  LIST_STATUS_OPTIONS,
  addToMyList,
  getListStatus,
  getSteamGameDetails,
  getSteamGameReviews,
  removeListEntry,
  type ListStatus,
  type SteamGameDetail,
  type UserGameEntry,
  type SteamMovie,
  type SteamReviewsResponse,
} from "@/services/Gameservice";
import {
  apiErrorMessage,
  getGameLike,
  getGameshelfReviews,
  likeGame,
  unlikeGame,
  type GameLikeStats,
  type GameshelfReview,
} from "@/services/Reviewservice";
import ThirdPartyReviews from "@/components/reviews/ThirdPartyReviews";
import GameshelfReviewItem from "@/components/reviews/GameshelfReviewItem";
import SimilarGames from "@/components/games/SimilarGamesSection";

const REVIEWS_PER_PAGE = 10;
const DLC_LIMIT = 3;
const SCREENSHOT_LIMIT = 6;

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
function stripHtml(html: string | undefined) {
  if (!html) return "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  return (doc.body.textContent ?? "").replace(/\s+/g, " ").trim();
}

function platformLabel(platforms: SteamGameDetail["platforms"]) {
  if (!platforms) return "";
  const names: string[] = [];
  if (platforms.windows) names.push("PC");
  if (platforms.mac) names.push("Mac");
  if (platforms.linux) names.push("Linux");
  return names.join(" / ");
}

function movieSource(movie: SteamMovie) {
  return (
    movie.mp4?.max ??
    movie.mp4?.["480"] ??
    movie.webm?.max ??
    movie.webm?.["480"] ??
    null
  );
}

type RequirementRow = { label: string; value: string };

function parseRequirements(html: string | undefined): RequirementRow[] {
  if (!html) return [];
  const doc = new DOMParser().parseFromString(html, "text/html");

  return Array.from(doc.querySelectorAll("li"))
    .map((li) => {
      const clone = li.cloneNode(true) as HTMLElement;
      const strong = clone.querySelector("strong");
      const label = (strong?.textContent ?? "").replace(/:\s*$/, "").trim();
      strong?.remove();
      const value = (clone.textContent ?? "").replace(/\s+/g, " ").trim();
      return { label, value };
    })
    .filter((row) => row.value);
}

// ---------------------------------------------------------------------------
// small components
// ---------------------------------------------------------------------------
function SectionHeading({ title, note }: { title: string; note?: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <h2 className="text-[24px] font-semibold leading-[29px] tracking-[-0.5px] text-[#E6E1EA]">
        {title}
      </h2>
      {note && <p className="text-[13px] leading-4 text-[#A0A0A8]">{note}</p>}
    </div>
  );
}

function AddToListMenu({ appId }: { appId: number }) {
  const [open, setOpen] = useState(false);
  const [entry, setEntry] = useState<UserGameEntry | null>(null);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setEntry(null);

    getListStatus(appId)
      .then((data) => {
        if (!cancelled && data.in_list) setEntry(data);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [appId]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  async function choose(value: ListStatus, label: string) {
    setOpen(false);
    setBusy(true);
    try {
      const saved = await addToMyList(appId, value);
      setEntry(saved);
      toast.success(`Saved to your list as “${label}”`);
    } catch {
      toast.error("Couldn’t update your list. Please make sure you’re logged in.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!entry) return;
    setOpen(false);
    setBusy(true);
    try {
      await removeListEntry(entry.id);
      setEntry(null);
      toast.success("Removed from your list");
    } catch {
      toast.error("Couldn’t remove this game. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const currentLabel = LIST_STATUS_OPTIONS.find(
    (option) => option.value === entry?.status
  )?.label;

  return (
    <div ref={ref} className="relative">
      <Button
        type="button"
        onClick={() => setOpen((value) => !value)}
        disabled={busy}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="h-10 gap-2 rounded-xl border-0 bg-[#B39ACF] px-4 text-[13px] font-semibold text-[#17191E] shadow-none hover:bg-[#C2ADE0]"
      >
        <Plus className="size-4" strokeWidth={1.7} aria-hidden="true" />
        {currentLabel ?? "Add to My List"}
        <ChevronDown className="size-4" strokeWidth={1.7} aria-hidden="true" />
      </Button>

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 top-12 z-30 w-[200px] overflow-hidden rounded-xl border border-[#302438] bg-[#17191E] p-1.5 shadow-xl"
        >
          {LIST_STATUS_OPTIONS.map(({ value, label }) => {
            const isSelected = entry?.status === value;
            return (
              <li key={value} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onClick={() => choose(value, label)}
                  className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                    isSelected
                      ? "bg-[#B39ACF]/20 text-[#E6E1EA]"
                      : "text-[#A0A0A8] hover:bg-[#20232B] hover:text-[#E6E1EA]"
                  }`}
                >
                  {label}
                  {isSelected && (
                    <span className="rounded-full bg-[#B39ACF] px-2 py-0.5 text-[10px] font-semibold text-[#17191E]">
                      Selected
                    </span>
                  )}
                </button>
              </li>
            );
          })}

          {entry && (
            <li role="presentation" className="mt-1 border-t border-[#302438] pt-1">
              <button
                type="button"
                onClick={remove}
                className="w-full cursor-pointer rounded-lg px-3 py-2 text-left text-xs text-[#E58B91] hover:bg-[#2B171C]"
              >
                Remove from list
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

function TrailerTile({
  movie,
  fallbackUrl,
}: {
  movie: SteamMovie;
  fallbackUrl: string;
}) {
  const [playing, setPlaying] = useState(false);
  const source = movieSource(movie);

  const frame =
    "relative block aspect-video w-full overflow-hidden rounded-2xl border border-[#302438] bg-black";

  if (playing && source) {
    return (
      <video
        className={frame}
        src={source}
        poster={movie.thumbnail}
        controls
        autoPlay
      />
    );
  }

  const overlay = (
    <>
      <img
        src={movie.thumbnail}
        alt=""
        loading="lazy"
        className="h-full w-full object-cover contrast-110 saturate-125"
      />
      <span className="absolute inset-0 flex items-center justify-center bg-black/30">
        <span className="flex size-14 items-center justify-center rounded-full bg-[#B39ACF] text-[#17191E]">
          <Play className="size-6" fill="currentColor" aria-hidden="true" />
        </span>
      </span>
      <span className="absolute bottom-3 left-3 rounded-full bg-black/60 px-3 py-1 text-xs text-[#E6E1EA]">
        Watch trailer
      </span>
    </>
  );

  if (!source) {
    return (
      <a href={fallbackUrl} target="_blank" rel="noreferrer" className={frame}>
        {overlay}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={`Play ${movie.name}`}
      className={`${frame} cursor-pointer`}
    >
      {overlay}
    </button>
  );
}

function RequirementColumn({
  title,
  rows,
}: {
  title: string;
  rows: RequirementRow[];
}) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-[#B39ACF]">{title}</h3>

      {rows.length === 0 ? (
        <p className="text-xs text-[#A0A0A8]">Not specified.</p>
      ) : (
        <dl className="flex flex-col gap-3 text-xs">
          {rows.map((row, index) =>
            row.label ? (
              <div key={`${row.label}-${index}`}>
                <dt className="mb-0.5 uppercase tracking-wide text-[#77717F]">
                  {row.label}
                </dt>
                <dd className="leading-5 text-[#E6E1EA]">{row.value}</dd>
              </div>
            ) : (
              <p key={index} className="leading-5 text-[#A0A0A8]">
                {row.value}
              </p>
            )
          )}
        </dl>
      )}
    </div>
  );
}

function SystemRequirements({ game }: { game: SteamGameDetail }) {
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const sources = [
    { key: "pc", label: "PC", supported: game.platforms?.windows, data: game.pc_requirements },
    { key: "mac", label: "Mac", supported: game.platforms?.mac, data: game.mac_requirements },
    { key: "linux", label: "Linux", supported: game.platforms?.linux, data: game.linux_requirements },
  ].map(({ key, label, supported, data }) => {
    const reqs = data && !Array.isArray(data) ? data : undefined;
    const minimum = parseRequirements(reqs?.minimum);
    const recommended = parseRequirements(reqs?.recommended);
    return {
      key,
      label,
      supported: Boolean(supported),
      minimum,
      recommended,
      hasData: minimum.length > 0 || recommended.length > 0,
    };
  });

  if (!sources.some((s) => s.hasData || s.supported)) return null;

  const active =
    sources.find((s) => s.key === activeKey) ??
    sources.find((s) => s.hasData) ??
    sources[0];

  return (
    <section className="flex flex-col gap-5">
      <SectionHeading title="System requirements" note="From the Steam store page" />

      <Card className="gap-0 rounded-2xl border border-[#302438] bg-[#17191E] py-0 text-[#E6E1EA] shadow-none">
        <CardContent className="flex flex-col gap-5 p-6">
          <div
            role="tablist"
            aria-label="Platform"
            className="flex w-fit gap-1 rounded-xl border border-[#302438] bg-[#000000] p-1"
          >
            {sources.map((s) => (
              <button
                key={s.key}
                type="button"
                role="tab"
                aria-selected={active.key === s.key}
                onClick={() => setActiveKey(s.key)}
                className={`h-8 cursor-pointer rounded-lg px-4 text-xs font-medium transition-colors ${
                  active.key === s.key
                    ? "bg-[#B39ACF] text-[#17191E] font-semibold"
                    : s.hasData || s.supported
                    ? "text-[#A0A0A8] hover:text-[#E6E1EA]"
                    : "text-[#554363] hover:text-[#A0A0A8]"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {active.hasData ? (
            <div className="grid gap-8 md:grid-cols-2">
              <RequirementColumn title="Minimum" rows={active.minimum} />
              <RequirementColumn title="Recommended" rows={active.recommended} />
            </div>
          ) : (
            <p className="text-sm text-[#A0A0A8]">
              {active.supported
                ? `The publisher hasn’t listed ${active.label} requirements for this game.`
                : `This game isn’t available on ${active.label}.`}
            </p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

// ---------------------------------------------------------------------------
// page
// ---------------------------------------------------------------------------
export default function GameDetails() {
  const { appid } = useParams<{ appid: string }>();

  const [game, setGame] = useState<SteamGameDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dlc, setDlc] = useState<SteamGameDetail[]>([]);
  const [reviewData, setReviewData] = useState<SteamReviewsResponse | null>(null);

  const [activeScreenshot, setActiveScreenshot] = useState<string | null>(null);

  const [reviewTab, setReviewTab] = useState<"gameshelf" | "external">("gameshelf");
  const [gsReviews, setGsReviews] = useState<GameshelfReview[]>([]);
  const [gsPage, setGsPage] = useState(1);
  const [gsHasNext, setGsHasNext] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState(false);

  const [like, setLike] = useState<GameLikeStats>({ liked: false, like_count: 0 });
  const [likeBusy, setLikeBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    setGame(null);
    setDlc([]);
    setLoading(true);
    setError(null);
    window.scrollTo({ top: 0 });

    if (!appid || !/^\d+$/.test(appid)) {
      setError("That doesn't look like a valid game ID.");
      setLoading(false);
      return;
    }

    getSteamGameDetails(appid)
      .then((data) => {
        if (!cancelled) setGame(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err?.response?.status === 404
            ? "This game couldn't be found on Steam."
            : "Failed to load this game. Please try again."
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [appid]);

  useEffect(() => {
    if (!appid || !/^\d+$/.test(appid)) return;
    let cancelled = false;
    setLike({ liked: false, like_count: 0 });

    getGameLike(appid)
      .then((data) => {
        if (!cancelled) setLike(data);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [appid]);

  async function toggleLike() {
    if (!appid || likeBusy) return;
    const previous = like;

    setLike({
      liked: !previous.liked,
      like_count: Math.max(0, previous.like_count + (previous.liked ? -1 : 1)),
    });
    setLikeBusy(true);

    try {
      setLike(previous.liked ? await unlikeGame(appid) : await likeGame(appid));
    } catch (err) {
      setLike(previous);
      toast.error(apiErrorMessage(err, "Couldn’t update your like. Please try again."));
    } finally {
      setLikeBusy(false);
    }
  }

  useEffect(() => {
    if (game) document.title = `${game.name} | GameShelf`;
  }, [game]);

  useEffect(() => {
    if (!game?.dlc?.length) return;
    let cancelled = false;

    Promise.allSettled(
      game.dlc.slice(0, DLC_LIMIT).map((id) => getSteamGameDetails(id))
    ).then((results) => {
      if (cancelled) return;
      setDlc(
        results
          .filter(
            (r): r is PromiseFulfilledResult<SteamGameDetail> =>
              r.status === "fulfilled"
          )
          .map((r) => r.value)
      );
    });

    return () => {
      cancelled = true;
    };
  }, [game]);

  useEffect(() => {
    if (!appid || !/^\d+$/.test(appid)) return;
    let cancelled = false;
    setReviewData(null);

    getSteamGameReviews(appid, "*", 1)
      .then((data) => {
        if (!cancelled) setReviewData(data);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [appid]);

  useEffect(() => {
    if (!appid || !/^\d+$/.test(appid)) return;
    let cancelled = false;

    setGsReviews([]);
    setGsPage(1);
    setGsHasNext(false);
    setReviewsError(false);
    setReviewsLoading(true);

    getGameshelfReviews(appid, { sort: "helpful", page: 1, pageSize: REVIEWS_PER_PAGE })
      .then((data) => {
        if (cancelled) return;
        setGsReviews(data.results);
        setGsHasNext(data.has_next);
      })
      .catch(() => {
        if (!cancelled) setReviewsError(true);
      })
      .finally(() => {
        if (!cancelled) setReviewsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [appid]);

  function loadMoreGsReviews() {
    if (!appid) return;
    const nextPage = gsPage + 1;
    setReviewsLoading(true);

    getGameshelfReviews(appid, {
      sort: "helpful",
      page: nextPage,
      pageSize: REVIEWS_PER_PAGE,
    })
      .then((data) => {
        setGsReviews((prev) => {
          const seen = new Set(prev.map((r) => r.id));
          return [...prev, ...data.results.filter((r) => !seen.has(r.id))];
        });
        setGsPage(nextPage);
        setGsHasNext(data.has_next);
      })
      .catch(() => setReviewsError(true))
      .finally(() => setReviewsLoading(false));
  }

  const replaceReview = (updated: GameshelfReview) =>
    setGsReviews((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));

  const removeReview = (id: number) =>
    setGsReviews((prev) => prev.filter((r) => r.id !== id));

  const genres = game?.genres?.map((g) => g.description) ?? [];
  const platforms = platformLabel(game?.platforms);
  const heroImage =
    game?.screenshots?.[0]?.path_full ?? game?.background_raw ?? game?.header_image;
  const releaseYear = game?.release_date?.date.match(/\d{4}/)?.[0] ?? "—";
  const storeUrl = `https://store.steampowered.com/app/${appid}`;
  const reviewsPath = `/gamedetails/${appid}/reviews?write=1`;

  const summary = reviewData?.summary;
  const totalReviews = summary?.total_reviews ?? 0;
  const communityScore =
    totalReviews > 0
      ? ((summary?.total_positive ?? 0) / totalReviews) * 10
      : game?.metacritic
        ? game.metacritic.score / 10
        : null;

  const screenshots = game?.screenshots?.slice(0, SCREENSHOT_LIMIT) ?? [];
  const trailer = game?.movies?.[0];

  return (
    <div className="min-h-screen w-full bg-[#000000]">
      <div
        className="flex min-h-screen w-full flex-col bg-[#000000] text-[#E6E1EA] antialiased"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <Navbar />

         <main className="flex flex-1 flex-col gap-10 px-5 pb-16 pt-8 md:px-8 xl:px-16">
          {/* Breadcrumb */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#A0A0A8]">
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5">
              <Link to="/home" className="cursor-pointer hover:text-[#E6E1EA]">
                Home
              </Link>
              <span aria-hidden="true">/</span>
              <span>Games</span>
              <span aria-hidden="true">/</span>
              <span className="text-[#E6E1EA]">{game?.name ?? "…"}</span>
            </nav>
            <span>Game Details</span>
          </div>

          {loading && (
            <p role="status" className="py-24 text-center text-sm text-[#A0A0A8]">
              Loading game…
            </p>
          )}

          {error && (
            <div role="alert" className="flex flex-col items-center gap-4 py-24">
              <p className="text-sm text-[#E58B91]">{error}</p>
              <Button
                asChild
                className="h-10 rounded-xl border-0 bg-[#B39ACF] px-5 text-sm font-semibold text-[#17191E] shadow-none hover:bg-[#C2ADE0]"
              >
                <Link to="/home">Back to Home</Link>
              </Button>
            </div>
          )}

          {game && (
            <>
              {/* Hero Banner */}
              <section
                aria-labelledby="game-title"
                className="relative z-20 flex min-h-[320px] items-center rounded-2xl px-6 py-10 md:px-11"
              >
                <div className="absolute inset-0 overflow-hidden rounded-2xl bg-[#17191E]">
                  {heroImage && (
                    <img
                      src={heroImage}
                      alt={game.name}
                      fetchPriority="high"
                      loading="eager"
                      className="h-full w-full object-cover object-center contrast-110 saturate-125 brightness-105"
                    />
                  )}
                  <div
                    aria-hidden="true"
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(90deg, rgba(0,0,0,0.94) 0%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,0.15) 100%)",
                    }}
                  />
                </div>

                <div className="relative flex w-full max-w-[600px] flex-col gap-3">
                  <h1
                    id="game-title"
                    className="text-[36px] font-semibold leading-[1.1] tracking-[-0.8px] text-[#E6E1EA] md:text-[48px]"
                  >
                    {game.name}
                  </h1>

                  <p className="text-[13px] text-[#A0A0A8]">
                    {genres.join(" • ")}
                    {genres.length > 0 && platforms && " | "}
                    {platforms}
                  </p>
                </div>
              </section>

              {/* Unified Single-Container Layout */}
              <section className="flex flex-col gap-5">
                <Card className="gap-0 rounded-2xl border border-[#302438] bg-[#17191E] py-0 text-[#E6E1EA] shadow-none">
                  <CardContent className="flex flex-col gap-6 p-6">
                    {/* Top Row: List Status & Review Button (Left) | Community Score & Like (Right) */}
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#302438] pb-5">
                      <div className="flex flex-wrap items-center gap-3">
                        <AddToListMenu appId={game.steam_appid} />

                        <Button
                          asChild
                          className="h-10 gap-2 rounded-xl border border-[#302438] bg-[#000000] px-4 text-[13px] font-semibold text-[#E6E1EA] shadow-none hover:border-[#554363] hover:bg-[#20232B]"
                        >
                          <Link to={reviewsPath}>
                            <PenLine className="size-4 text-[#B39ACF]" strokeWidth={1.7} aria-hidden="true" />
                            Rate / Write Review
                          </Link>
                        </Button>
                      </div>

                      <div className="flex flex-wrap items-center gap-6">
                        <div className="flex items-baseline gap-2">
                          <span className="text-[20px] font-semibold leading-7">
                            {communityScore !== null
                              ? `${communityScore.toFixed(1)} / 10`
                              : "No score yet"}
                          </span>
                          <span className="text-sm text-[#A0A0A8]">
                            • Community score ({totalReviews > 0 ? `${totalReviews.toLocaleString()} ratings` : "Not enough reviews"})
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={toggleLike}
                          disabled={likeBusy}
                          aria-pressed={like.liked}
                          className={`flex cursor-pointer items-center gap-2 text-sm transition-colors ${
                            like.liked ? "text-[#E58B91]" : "text-[#A0A0A8] hover:text-[#E6E1EA]"
                          }`}
                        >
                          <Heart
                            className={`size-4 ${like.liked ? "fill-[#E58B91] text-[#E58B91]" : ""}`}
                            strokeWidth={1.7}
                            aria-hidden="true"
                          />
                          {like.liked ? "Liked" : "Like"}
                          {like.like_count > 0 && (
                            <span className="text-xs text-[#77717F]">
                              ({like.like_count.toLocaleString()})
                            </span>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Middle: About Section */}
                    <div className="flex flex-col gap-2">
                      <h2 className="text-[22px] font-semibold leading-7">
                        About {game.name}
                      </h2>

                      <p className="min-h-[120px] text-sm leading-6 text-[#A0A0A8]">
                        {stripHtml(game.about_the_game) || game.short_description || "No description available."}
                      </p>
                    </div>

                    {/* Bottom Metadata Grid */}
                    <dl className="grid grid-cols-2 gap-4 border-t border-[#302438] pt-5 text-xs sm:grid-cols-4">
                      <div>
                        <dt className="mb-1 uppercase tracking-wide text-[#77717F]">
                          Developer
                        </dt>
                        <dd className="font-medium text-[#38BDF8]">
                          {game.developers?.join(", ") || "—"}
                        </dd>
                      </div>
                      <div>
                        <dt className="mb-1 uppercase tracking-wide text-[#77717F]">
                          Publisher
                        </dt>
                        <dd className="font-medium text-[#B39ACF]">
                          {game.publishers?.join(", ") || "—"}
                        </dd>
                      </div>
                      <div>
                        <dt className="mb-1 uppercase tracking-wide text-[#77717F]">
                          Release year
                        </dt>
                        <dd className="font-medium text-[#34D399]">
                          {releaseYear}
                        </dd>
                      </div>
                      <div>
                        <dt className="mb-1 uppercase tracking-wide text-[#77717F]">
                          Price
                        </dt>
                        <dd className="font-semibold text-[#34D399]">
                          {game.is_free
                            ? "Free to play"
                            : (game.price_overview?.final_formatted ?? "—")}
                        </dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>
              </section>

              {/* Trailer */}
              {trailer && (
                <section className="flex flex-col gap-5">
                  <SectionHeading title="Trailer" note="From the Steam store page" />
                  <div className="max-w-[760px]">
                    <TrailerTile movie={trailer} fallbackUrl={storeUrl} />
                  </div>
                </section>
              )}

              {/* DLC */}
              {dlc.length > 0 && (
                <section className="flex flex-col gap-5">
                  <SectionHeading title="DLC" note="Extra content for this game" />
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {dlc.map((item) => (
                      <Link
                        key={item.steam_appid}
                        to={`/gamedetails/${item.steam_appid}`}
                        className="group overflow-hidden rounded-2xl border border-[#302438] bg-[#17191E] transition-colors hover:border-[#554363]"
                      >
                        <img
                          src={item.header_image}
                          alt={item.name}
                          loading="lazy"
                          className="aspect-[460/215] w-full object-cover contrast-110 saturate-125"
                        />
                        <div className="flex flex-col gap-1 p-4">
                          <p className="truncate text-sm font-medium group-hover:text-[#B39ACF]">
                            {item.name}
                          </p>
                          <p className="text-xs text-[#A0A0A8]">
                            {item.is_free
                              ? "Free"
                              : (item.price_overview?.final_formatted ?? "DLC")}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Screenshots (In-page Modal Lightbox) */}
              {screenshots.length > 0 && (
                <section className="flex flex-col gap-5">
                  <SectionHeading
                    title="Pictures from the game"
                    note="Click any screenshot to view in full size"
                  />
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {screenshots.map((shot) => (
                      <button
                        key={shot.id}
                        type="button"
                        onClick={() => setActiveScreenshot(shot.path_full)}
                        aria-label="Enlarge screenshot"
                        className="group relative cursor-pointer overflow-hidden rounded-2xl border border-[#302438] bg-black transition-colors hover:border-[#554363]"
                      >
                        <img
                          src={shot.path_thumbnail}
                          alt="Game screenshot"
                          loading="lazy"
                          className="aspect-video w-full object-cover contrast-110 saturate-125 transition-transform duration-300 group-hover:scale-105"
                        />
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {/* System requirements */}
              <SystemRequirements game={game} />

              {/* Similar games */}
              <SimilarGames appId={game.steam_appid} />

              {/* Reviews */}
              <section id="reviews" className="scroll-mt-6">
                <Card className="gap-0 rounded-2xl border border-[#302438] bg-[#17191E] py-0 text-[#E6E1EA] shadow-none">
                  <CardContent className="flex flex-col gap-5 p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h2 className="text-[22px] font-semibold leading-7">
                        Community reviews
                      </h2>

                      <div
                        role="tablist"
                        aria-label="Review type"
                        className="flex gap-1 rounded-xl border border-[#302438] bg-[#000000] p-1"
                      >
                        {(
                          [
                            { value: "gameshelf", label: "GameShelf" },
                            { value: "external", label: "Other sites" },
                          ] as const
                        ).map(({ value, label }) => (
                          <button
                            key={value}
                            type="button"
                            role="tab"
                            aria-selected={reviewTab === value}
                            onClick={() => setReviewTab(value)}
                            className={`h-8 cursor-pointer rounded-lg px-4 text-xs font-medium transition-colors ${
                              reviewTab === value
                                ? "bg-[#B39ACF] text-[#17191E] font-semibold"
                                : "text-[#A0A0A8] hover:text-[#E6E1EA]"
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {reviewTab === "gameshelf" ? (
                      <div className="flex flex-col gap-4">
                        {reviewsError && (
                          <p role="alert" className="text-sm text-[#E58B91]">
                            Couldn’t load reviews right now.
                          </p>
                        )}
                        {reviewsLoading && gsReviews.length === 0 ? (
                          <p role="status" className="text-sm text-[#A0A0A8]">
                            Loading reviews…
                          </p>
                        ) : gsReviews.length === 0 ? (
                          <div className="flex flex-col items-center gap-3 py-8 text-center">
                            <p className="text-sm text-[#A0A0A8]">
                              No reviews on GameShelf yet. Be the first to share your thoughts!
                            </p>
                            <Button
                              asChild
                              className="h-9 rounded-xl bg-[#B39ACF] px-4 text-xs font-semibold text-[#17191E] hover:bg-[#C2ADE0]"
                            >
                              <Link to={reviewsPath}>Write Review</Link>
                            </Button>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-4">
                            {gsReviews.map((review) => (
                              <GameshelfReviewItem
                                key={review.id}
                                review={review}
                                onUpdate={replaceReview}
                                onDelete={removeReview}
                              />
                            ))}

                            {gsHasNext && (
                              <div className="flex justify-center pt-2">
                                <Button
                                  type="button"
                                  onClick={loadMoreGsReviews}
                                  disabled={reviewsLoading}
                                  className="h-9 rounded-xl border border-[#302438] bg-[#000000] px-5 text-xs font-medium text-[#E6E1EA] hover:border-[#554363] hover:bg-[#20232B]"
                                >
                                  {reviewsLoading ? "Loading…" : "Load more reviews"}
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                       <ThirdPartyReviews
                      appId={game.steam_appid}
                      gameName={game.name}
                    />

                    )}
                  </CardContent>
                </Card>
              </section>
            </>
          )}
        </main>

        {activeScreenshot && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Enlarged screenshot"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            onClick={() => setActiveScreenshot(null)}
          >
            <button
              type="button"
              onClick={() => setActiveScreenshot(null)}
              aria-label="Close lightbox"
              className="absolute right-6 top-6 flex size-10 cursor-pointer items-center justify-center rounded-xl border border-[#302438] bg-[#17191E] text-[#E6E1EA] hover:bg-[#20232B]"
            >
              <X className="size-5" />
            </button>
            <img
              src={activeScreenshot}
              alt="Enlarged game screenshot"
              className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        <Footer />
      </div>
    </div>
  );
}