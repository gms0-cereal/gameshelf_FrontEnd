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
  getGameshelfReviews,
  type GameshelfReview,
} from "@/services/Reviewservice";
import ThirdPartyReviews from "@/components/reviews/ThirdPartyReviews";
import GameshelfReviewItem from "@/components/reviews/GameshelfReviewItem";
import SimilarGames from "@/components/games/SimilarGames";

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

function truncate(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
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

// ---------------------------------------------------------------------------
// small components
// ---------------------------------------------------------------------------
function SectionHeading({ title, note }: { title: string; note?: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <h2 className="text-[24px] font-semibold leading-[29px] tracking-[-0.5px]">
        {title}
      </h2>
      {note && <p className="text-[13px] leading-4 text-[#b4aec7]">{note}</p>}
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
        className="h-10 gap-2 rounded-lg border-0 bg-[#a8484c] px-4 text-[13px] font-semibold text-[#e0deeb] shadow-none hover:bg-[#ae494e]"
      >
        <Plus className="size-4" strokeWidth={1.7} aria-hidden="true" />
        {currentLabel ?? "Add to My List"}
        <ChevronDown className="size-4" strokeWidth={1.7} aria-hidden="true" />
      </Button>

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 top-12 z-30 w-[200px] overflow-hidden rounded-xl border border-[#55516c] bg-[#2a2838] p-1.5 shadow-xl"
        >
          {LIST_STATUS_OPTIONS.map(({ value, label }) => {
            const isSelected = entry?.status === value;
            return (
              <li key={value} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onClick={() => choose(value, label)}
                  className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-left text-xs ${
                    isSelected
                      ? "bg-[#4a3d73] text-[#e0deeb]"
                      : "text-[#b4aec7] hover:bg-[#373646]"
                  }`}
                >
                  {label}
                  {isSelected && (
                    <span className="rounded-full bg-[#7c5fc4] px-2 py-0.5 text-[10px] font-semibold">
                      Selected
                    </span>
                  )}
                </button>
              </li>
            );
          })}

          {entry && (
            <li role="presentation" className="mt-1 border-t border-[#55516c] pt-1">
              <button
                type="button"
                onClick={remove}
                className="w-full cursor-pointer rounded-lg px-3 py-2 text-left text-xs text-[#e58d91] hover:bg-[#373646]"
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
    "relative block aspect-video w-full overflow-hidden rounded-xl border border-[#55516c] bg-black";

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
        <span className="flex size-14 items-center justify-center rounded-full bg-[#a8484c] text-[#e0deeb]">
          <Play className="size-6" fill="currentColor" aria-hidden="true" />
        </span>
      </span>
      <span className="absolute bottom-3 left-3 rounded-full bg-black/60 px-3 py-1 text-xs text-[#e0deeb]">
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

  // Modal state for in-page screenshot lightbox
  const [activeScreenshot, setActiveScreenshot] = useState<string | null>(null);

  // GameShelf reviews
  const [reviewTab, setReviewTab] = useState<"gameshelf" | "external">("gameshelf");
  const [gsReviews, setGsReviews] = useState<GameshelfReview[]>([]);
  const [gsPage, setGsPage] = useState(1);
  const [gsHasNext, setGsHasNext] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState(false);

  const [liked, setLiked] = useState(false);

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
    <div className="min-h-screen bg-[#201e2f]">
      <div
        className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col bg-[#201e2f] text-[#e0deeb] antialiased"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <Navbar />

        <main className="flex flex-1 flex-col gap-10 px-5 pb-16 pt-8 md:px-8 xl:px-16">
          {/* Breadcrumb */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#b4aec7]">
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5">
              <Link to="/home" className="cursor-pointer hover:text-[#e0deeb]">
                Home
              </Link>
              <span aria-hidden="true">/</span>
              <span>Games</span>
              <span aria-hidden="true">/</span>
              <span className="text-[#e0deeb]">{game?.name ?? "…"}</span>
            </nav>
            <span>Game Details</span>
          </div>

          {loading && (
            <p role="status" className="py-24 text-center text-sm text-[#b4aec7]">
              Loading game…
            </p>
          )}

          {error && (
            <div role="alert" className="flex flex-col items-center gap-4 py-24">
              <p className="text-sm text-[#e58d91]">{error}</p>
              <Button
                asChild
                className="h-10 rounded-lg border-0 bg-[#a8484c] px-5 text-sm font-semibold text-[#e0deeb] shadow-none hover:bg-[#ae494e]"
              >
                <Link to="/home">Back to Home</Link>
              </Button>
            </div>
          )}

          {game && (
            <>
              {/* Hero */}
              <section
                aria-labelledby="game-title"
                className="relative z-20 flex min-h-[360px] items-center rounded-2xl px-6 py-10 md:px-11"
              >
                <div className="absolute inset-0 overflow-hidden rounded-2xl bg-[#2a2838]">
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
                        "linear-gradient(90deg, rgba(32,30,47,0.94) 0%, rgba(32,30,47,0.7) 50%, rgba(32,30,47,0.15) 100%)",
                    }}
                  />
                </div>

                <div className="relative flex w-full max-w-[600px] flex-col gap-4">
                  <p className="text-[10px] leading-[12px] tracking-[2px] text-[#c2ade7]">
                    CURATED FOR YOUR NEXT CHAPTER
                  </p>

                  <h1
                    id="game-title"
                    className="text-[36px] font-semibold leading-[1.1] tracking-[-0.8px] md:text-[48px]"
                  >
                    {game.name}
                  </h1>

                  <p className="text-[13px] text-[#b4aec7]">
                    {genres.join(" • ")}
                    {genres.length > 0 && platforms && " | "}
                    {platforms}
                  </p>

                  <p className="line-clamp-3 text-[14px] leading-6 text-[#e0deeb]">
                    {game.short_description}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <AddToListMenu appId={game.steam_appid} />

                    <Button
                      asChild
                      className="h-10 gap-2 rounded-lg border border-[#55516c] bg-[#373646]/80 px-4 text-[13px] font-semibold text-[#e0deeb] shadow-none hover:bg-[#46445a]"
                    >
                      <Link to={reviewsPath}>
                        <PenLine className="size-4" strokeWidth={1.7} aria-hidden="true" />
                        Rate / Write Review
                      </Link>
                    </Button>
                  </div>
                </div>
              </section>

              {/* About + score */}
              <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
                <Card className="gap-0 rounded-xl border border-[#55516c] bg-[#373646] py-0 text-[#e0deeb] shadow-none">
                  <CardContent className="flex flex-col gap-5 p-6">
                    <h2 className="text-[22px] font-semibold leading-7">
                      About {game.name}
                    </h2>

                    <p className="text-sm leading-6 text-[#b4aec7]">
                      {truncate(
                        stripHtml(game.about_the_game) || game.short_description,
                        700
                      )}
                    </p>

                    <dl className="grid grid-cols-2 gap-4 text-xs sm:grid-cols-4">
                      <div>
                        <dt className="mb-1 uppercase tracking-wide text-[#8b86a3]">
                          Developer
                        </dt>
                        <dd>{game.developers?.join(", ") || "—"}</dd>
                      </div>
                      <div>
                        <dt className="mb-1 uppercase tracking-wide text-[#8b86a3]">
                          Publisher
                        </dt>
                        <dd>{game.publishers?.join(", ") || "—"}</dd>
                      </div>
                      <div>
                        <dt className="mb-1 uppercase tracking-wide text-[#8b86a3]">
                          Release year
                        </dt>
                        <dd>{releaseYear}</dd>
                      </div>
                      <div>
                        <dt className="mb-1 uppercase tracking-wide text-[#8b86a3]">
                          Price
                        </dt>
                        <dd>
                          {game.is_free
                            ? "Free to play"
                            : (game.price_overview?.final_formatted ?? "—")}
                        </dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>

                <Card className="gap-0 rounded-xl border border-[#55516c] bg-[#373646] py-0 text-[#e0deeb] shadow-none">
                  <CardContent className="flex flex-col gap-3 p-6">
                    <p className="text-[20px] font-semibold leading-7">
                      {communityScore !== null
                        ? `${communityScore.toFixed(1)} / 10`
                        : "No score yet"}{" "}
                      - <span className="text-[#b4aec7]">Community score</span>
                    </p>

                    <p className="text-xs text-[#b4aec7]">
                      {totalReviews > 0
                        ? `${totalReviews.toLocaleString()} ratings • ${summary?.review_score_desc ?? "Steam reviews"}`
                        : "Not enough Steam reviews yet"}
                    </p>

                    <Button
                      asChild
                      className="h-10 w-fit gap-2 rounded-lg border-0 bg-[#a8484c] px-4 text-[13px] font-semibold text-[#e0deeb] shadow-none hover:bg-[#ae494e]"
                    >
                      <Link to={reviewsPath}>
                        <PenLine className="size-4" strokeWidth={1.7} aria-hidden="true" />
                        Rate / Write Review
                      </Link>
                    </Button>

                    <button
                      type="button"
                      onClick={() => setLiked((value) => !value)}
                      aria-pressed={liked}
                      className="flex w-fit cursor-pointer items-center gap-2 text-sm text-[#b4aec7] hover:text-[#e0deeb]"
                    >
                      <Heart
                        className={`size-4 ${liked ? "fill-[#e58d91] text-[#e58d91]" : ""}`}
                        strokeWidth={1.7}
                        aria-hidden="true"
                      />
                      {liked ? "You like this game" : "Like this game"}
                    </button>
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
                        className="group overflow-hidden rounded-xl border border-[#55516c] bg-[#373646] transition-colors hover:border-[#c2ade7]"
                      >
                        <img
                          src={item.header_image}
                          alt={item.name}
                          loading="lazy"
                          className="aspect-[460/215] w-full object-cover contrast-110 saturate-125"
                        />
                        <div className="flex flex-col gap-1 p-4">
                          <p className="truncate text-sm font-medium group-hover:text-[#c2ade7]">
                            {item.name}
                          </p>
                          <p className="text-xs text-[#b4aec7]">
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
                        className="group relative cursor-pointer overflow-hidden rounded-xl border border-[#55516c] bg-black transition-colors hover:border-[#c2ade7]"
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

              {/* Similar games */}
              <SimilarGames appId={game.steam_appid} />

              {/* Reviews */}
              <section id="reviews" className="scroll-mt-6">
                <Card className="gap-0 rounded-xl border border-[#55516c] bg-[#373646] py-0 text-[#e0deeb] shadow-none">
                  <CardContent className="flex flex-col gap-5 p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h2 className="text-[22px] font-semibold leading-7">
                        Community reviews
                      </h2>

                      <div
                        role="tablist"
                        aria-label="Review type"
                        className="flex gap-1 rounded-lg border border-[#55516c] bg-[#2a2838] p-1"
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
                            className={`h-8 cursor-pointer rounded-md px-4 text-xs font-medium transition-colors ${
                              reviewTab === value
                                ? "bg-[#4a3d73] text-[#e0deeb]"
                                : "text-[#b4aec7] hover:text-[#e0deeb]"
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {reviewTab === "external" ? (
                      <ThirdPartyReviews
                        appId={game.steam_appid}
                        gameName={game.name}
                      />
                    ) : (
                      <>
                        <p className="text-xs text-[#b4aec7]">
                          Most helpful reviews from GameShelf members
                        </p>

                        {gsReviews.map((review) => (
                          <GameshelfReviewItem
                            key={review.id}
                            review={review}
                            onUpdated={replaceReview}
                            onDeleted={removeReview}
                          />
                        ))}

                        {reviewsLoading && (
                          <p role="status" className="text-sm text-[#b4aec7]">
                            Loading reviews…
                          </p>
                        )}

                        {reviewsError && (
                          <p role="alert" className="text-sm text-[#e58d91]">
                            Couldn’t load reviews right now.
                          </p>
                        )}

                        {!reviewsLoading && !reviewsError && gsReviews.length === 0 && (
                          <p className="text-sm text-[#b4aec7]">No written reviews yet.</p>
                        )}

                        {gsHasNext && !reviewsLoading && (
                          <Button
                            type="button"
                            onClick={loadMoreGsReviews}
                            className="h-10 w-fit rounded-lg border border-[#55516c] bg-transparent px-5 text-sm font-semibold text-[#e0deeb] shadow-none hover:bg-[#46445a]"
                          >
                            Load more reviews
                          </Button>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </section>
            </>
          )}
        </main>

        <Footer />
      </div>

      {/* Screenshot Lightbox Modal */}
      {activeScreenshot && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in-0"
          onClick={() => setActiveScreenshot(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-2xl border border-[#55516c] bg-[#2a2838] shadow-2xl animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActiveScreenshot(null)}
              aria-label="Close screenshot"
              className="absolute right-3 top-3 z-10 flex size-9 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black transition-colors cursor-pointer"
            >
              <X className="size-5" />
            </button>
            <img
              src={activeScreenshot}
              alt="Enlarged game screenshot"
              className="max-h-[85vh] max-w-[85vw] object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}