import { useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { MessageCircle, PenLine, ThumbsDown, ThumbsUp } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ThirdPartyReviews from "@/components/reviews/ThirdPartyReviews";
import ReviewComposer from "@/components/reviews/ReviewComposer";
import { RatingBar } from "@/components/reviews/RatingParts";
import {
  getSteamGameDetails,
  getSteamGameReviews,
  type SteamGameDetail,
  type SteamReview,
} from "@/services/Gameservice";
import {
  getGameshelfReviews,
  getRatingStats,
  type GameshelfReview,
  type RatingStats,
} from "@/services/Reviewservice";

const REVIEWS_PER_PAGE = 5;

const GUIDELINES = [
  "Share your own experience and keep it respectful.",
  "Mark story details as spoilers.",
  "No links or personal information in comments.",
];

// ---------------------------------------------------------------------------
// helpers (copied from GameDetails)
// ---------------------------------------------------------------------------
function formatDate(unixSeconds: number) {
  return new Date(unixSeconds * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ReviewCard({ review }: { review: SteamReview }) {
  const hours = Math.round((review.author.playtime_forever ?? 0) / 60);

  return (
    <article className="flex flex-col gap-3 border-t border-[#55516c] pt-4 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-center justify-between gap-2 text-[13px] text-[#b4aec7]">
        <span>
          Steam player • {hours.toLocaleString()} h on record •{" "}
          {formatDate(review.timestamp_created)}
        </span>

        <span
          className={`inline-flex items-center gap-1.5 font-medium ${
            review.voted_up ? "text-[#86d9a0]" : "text-[#e58d91]"
          }`}
        >
          {review.voted_up ? (
            <ThumbsUp className="size-4" aria-hidden="true" />
          ) : (
            <ThumbsDown className="size-4" aria-hidden="true" />
          )}
          {review.voted_up ? "Recommended" : "Not recommended"}
        </span>
      </div>

      <p className="line-clamp-6 whitespace-pre-line text-sm leading-6 text-[#e0deeb]">
        {review.review || "No written review."}
      </p>

      <p className="text-xs text-[#b4aec7]">
        Helpful ({review.votes_up.toLocaleString()})
      </p>
    </article>
  );
}

// ---------------------------------------------------------------------------
// page
// ---------------------------------------------------------------------------
export default function GameReviews() {
  const { appid } = useParams<{ appid: string }>();
  const [searchParams] = useSearchParams();
  const wantsWrite = searchParams.has("write");

  const [game, setGame] = useState<SteamGameDetail | null>(null);
  const [gameError, setGameError] = useState<string | null>(null);

  const [stats, setStats] = useState<RatingStats | null>(null);
  const [myReview, setMyReview] = useState<GameshelfReview | null>(null);
  const [myReviewReady, setMyReviewReady] = useState(false);

  const [composerOpen, setComposerOpen] = useState(false);
  const [editing, setEditing] = useState<GameshelfReview | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Steam reviews (same as GameDetails)
  const [reviews, setReviews] = useState<SteamReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState(false);
  const [reviewCursor, setReviewCursor] = useState("*");
  const [hasMoreReviews, setHasMoreReviews] = useState(false);
  const [reviewTab, setReviewTab] = useState<"steam" | "external">("steam");

  const composerRef = useRef<HTMLDivElement>(null);
  const autoOpened = useRef(false);

  const validId = !!appid && /^\d+$/.test(appid);
  const numericId = validId ? Number(appid) : 0;

  // Game details (title, banner, ...)
  useEffect(() => {
    let cancelled = false;
    setGame(null);
    setGameError(null);
    window.scrollTo({ top: 0 });

    if (!validId) {
      setGameError("That doesn’t look like a valid game ID.");
      return;
    }

    getSteamGameDetails(appid!)
      .then((data) => {
        if (!cancelled) setGame(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setGameError(
          err?.response?.status === 404
            ? "This game couldn’t be found on Steam."
            : "Failed to load this game. Please try again."
        );
      });

    return () => {
      cancelled = true;
    };
  }, [appid, validId]);

  useEffect(() => {
    if (game) document.title = `Reviews: ${game.name} | GameShelf`;
  }, [game]);

  // Community rating (refreshed after the user rates / reviews)
  useEffect(() => {
    if (!validId) return;
    let cancelled = false;

    getRatingStats(appid!)
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch(() => {
        /* the card falls back to its empty state */
      });

    return () => {
      cancelled = true;
    };
  }, [appid, validId, reloadKey]);

  // Does the user already have a review? (so the composer opens in edit mode)
  useEffect(() => {
    if (!validId) return;
    let cancelled = false;
    setMyReviewReady(false);

    getGameshelfReviews(numericId, { sort: "helpful", page: 1 })
      .then((data) => {
        if (!cancelled) setMyReview(data?.my_review ?? null);
      })
      .catch(() => {
        if (!cancelled) setMyReview(null);
      })
      .finally(() => {
        if (!cancelled) setMyReviewReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [numericId, validId, reloadKey]);

  // First page of Steam reviews (independent so a failure doesn't break the page)
  useEffect(() => {
    if (!validId) return;
    let cancelled = false;

    setReviews([]);
    setReviewsError(false);
    setReviewsLoading(true);
    setReviewCursor("*");
    setHasMoreReviews(false);

    getSteamGameReviews(appid!, "*", REVIEWS_PER_PAGE)
      .then((data) => {
        if (cancelled) return;
        const list = data?.reviews ?? [];
        setReviews(list);
        setReviewCursor(data?.cursor ?? "*");
        setHasMoreReviews(list.length >= REVIEWS_PER_PAGE);
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
  }, [appid, validId]);

  function loadMoreReviews() {
    if (!validId) return;
    setReviewsLoading(true);

    getSteamGameReviews(appid!, reviewCursor, REVIEWS_PER_PAGE)
      .then((data) => {
        const list = data?.reviews ?? [];
        setReviews((previous) => {
          const seen = new Set(previous.map((r) => r.recommendationid));
          return [...previous, ...list.filter((r) => !seen.has(r.recommendationid))];
        });
        setReviewCursor(data?.cursor ?? reviewCursor);
        setHasMoreReviews(list.length >= REVIEWS_PER_PAGE);
      })
      .catch(() => setReviewsError(true))
      .finally(() => setReviewsLoading(false));
  }

  function openComposer(review: GameshelfReview | null) {
    setEditing(review);
    setComposerOpen(true);
  }

  // Arriving from "Rate / Write Review" (?write=1): open the form once.
  useEffect(() => {
    if (wantsWrite && game && myReviewReady && !autoOpened.current) {
      autoOpened.current = true;
      openComposer(myReview);
    }
  }, [wantsWrite, game, myReviewReady, myReview]);

  // Bring the form into view when it opens
  useEffect(() => {
    if (composerOpen) {
      composerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [composerOpen]);

  function handleDone() {
    setComposerOpen(false);
    setEditing(null);
    setReloadKey((key) => key + 1);
  }

  const detailPath = `/gamedetails/${appid}`;
  const heroImage =
    game?.screenshots?.[0]?.path_full ?? game?.background_raw ?? game?.header_image;
  const year = game?.release_date?.date.match(/\d{4}/)?.[0];
  const heroMeta = [
    game?.developers?.[0],
    year,
    game?.genres
      ?.slice(0, 2)
      .map((g) => g.description)
      .join(" / "),
  ]
    .filter(Boolean)
    .join(" • ");

  const average = stats?.average ?? null;

  return (
    <div className="min-h-screen bg-[#201e2f]">
      <div
        className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col bg-[#201e2f] text-[#e0deeb] antialiased"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <Navbar />

        <main className="flex flex-1 flex-col gap-8 px-5 pb-16 pt-8 md:px-8 xl:px-16">
          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-1.5 text-[11px] text-[#b4aec7]"
          >
            <Link to="/home" className="cursor-pointer hover:text-[#e0deeb]">
              Home
            </Link>
            <span aria-hidden="true">/</span>
            <span>Games</span>
            <span aria-hidden="true">/</span>
            <Link to={detailPath} className="cursor-pointer hover:text-[#e0deeb]">
              {game?.name ?? "…"}
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-[#c2ade7]">Community reviews</span>
          </nav>

          {gameError && (
            <div role="alert" className="flex flex-col items-center gap-4 py-24">
              <p className="text-sm text-[#e58d91]">{gameError}</p>
              <Button
                asChild
                className="h-10 rounded-lg border-0 bg-[#a8484c] px-5 text-sm font-semibold text-[#e0deeb] shadow-none hover:bg-[#ae494e]"
              >
                <Link to="/home">Back to Home</Link>
              </Button>
            </div>
          )}

          {!gameError && (
            <>
              {/* Title row */}
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex flex-col gap-2">
                  <h1 className="text-[36px] font-semibold leading-[41px] tracking-[-0.8px]">
                    Community reviews
                  </h1>
                  <p className="text-[13px] text-[#b4aec7]">
                    {game
                      ? `Player perspectives on ${game.name}.`
                      : "Player perspectives on this game."}
                  </p>
                </div>

                <Button
                  type="button"
                  onClick={() => openComposer(myReview)}
                  className="h-10 gap-2 rounded-lg border-0 bg-[#a8484c] px-4 text-[13px] font-semibold text-[#e0deeb] shadow-none hover:bg-[#ae494e]"
                >
                  <PenLine className="size-4" strokeWidth={1.7} aria-hidden="true" />
                  {myReview ? "Edit your review" : "Write a review"}
                </Button>
              </div>

              {/* Game banner */}
              <section
                aria-label="Game"
                className="relative flex min-h-[200px] items-center overflow-hidden rounded-2xl bg-[#2a2838] px-6 py-8 md:px-11"
              >
                {heroImage && (
                  <img
                    src={heroImage}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover object-center"
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

                <div className="relative flex flex-col gap-2">
                  <p className="text-[10px] leading-[12px] tracking-[2px] text-[#c2ade7]">
                    THE COMMUNITY IS PLAYING
                  </p>
                  <h2 className="text-[30px] font-semibold leading-[1.15] tracking-[-0.5px]">
                    {game?.name ?? "Loading…"}
                  </h2>
                  {heroMeta && <p className="text-[13px] text-[#b4aec7]">{heroMeta}</p>}
                  <Link
                    to={detailPath}
                    className="mt-1 w-fit cursor-pointer text-xs text-[#e0deeb] hover:text-[#c2ade7]"
                  >
                    Back to game details →
                  </Link>
                </div>
              </section>

              {/* Reviews + sidebar */}
              <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="flex min-w-0 flex-col gap-5">
                  {composerOpen && game && (
                    <div ref={composerRef} className="scroll-mt-6">
                      <ReviewComposer
                        // remount once the rating has loaded so "your score" is pre-filled
                        key={`${editing?.id ?? "new"}-${stats ? "ready" : "loading"}`}
                        appId={numericId}
                        gameName={game.name}
                        initial={editing}
                        myScore={stats?.my_score ?? null}
                        onDone={handleDone}
                        onCancel={() => {
                          setComposerOpen(false);
                          setEditing(null);
                        }}
                      />
                    </div>
                  )}

                  {/* Reviews: same as GameDetails */}
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
                                { value: "steam", label: "Steam" },
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
                          game ? (
                            <ThirdPartyReviews
                              appId={game.steam_appid}
                              gameName={game.name}
                            />
                          ) : (
                            <p role="status" className="text-sm text-[#b4aec7]">
                              Loading…
                            </p>
                          )
                        ) : (
                          <>
                            <p className="text-xs text-[#b4aec7]">
                              Most helpful reviews from Steam players
                            </p>

                            {reviews.map((review) => (
                              <ReviewCard
                                key={review.recommendationid}
                                review={review}
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

                            {!reviewsLoading &&
                              !reviewsError &&
                              reviews.length === 0 && (
                                <p className="text-sm text-[#b4aec7]">
                                  No written reviews yet.
                                </p>
                              )}

                            {hasMoreReviews && !reviewsLoading && (
                              <Button
                                type="button"
                                onClick={loadMoreReviews}
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
                </div>

                <aside className="flex flex-col gap-5">
                  {/* Community rating */}
                  <section
                    aria-labelledby="community-rating"
                    className="flex flex-col gap-4 rounded-xl border border-[#55516c] bg-[#373646] p-5"
                  >
                    <h2 id="community-rating" className="text-sm font-semibold">
                      Community rating
                    </h2>

                    <p className="flex items-baseline gap-1.5">
                      <span className="text-[44px] font-semibold leading-none text-[#c2ade7]">
                        {average !== null ? average.toFixed(1) : "—"}
                      </span>
                      <span className="text-sm text-[#b4aec7]">/ 10</span>
                    </p>

                    <RatingBar value={average} />

                    <p className="text-xs text-[#b4aec7]">
                      {stats?.count
                        ? `${stats.count.toLocaleString()} ${stats.count === 1 ? "rating" : "ratings"}`
                        : "No ratings yet"}
                    </p>

                    <div className="flex items-center justify-between border-t border-[#55516c] pt-4 text-xs">
                      <span className="text-[#b4aec7]">Your score</span>
                      <span className="font-medium">
                        {stats?.my_score ? `${stats.my_score} / 10` : "Not rated"}
                      </span>
                    </div>

                    <Button
                      type="button"
                      onClick={() => openComposer(myReview)}
                      className="h-10 gap-2 rounded-lg border-0 bg-[#a8484c] px-4 text-[13px] font-semibold text-[#e0deeb] shadow-none hover:bg-[#ae494e]"
                    >
                      <PenLine className="size-4" strokeWidth={1.7} aria-hidden="true" />
                      Rate / Write Review
                    </Button>

                    <p className="text-xs leading-5 text-[#b4aec7]">
                      Played {game?.name ?? "this game"}? Add your score and share what
                      stayed with you.
                    </p>
                  </section>

                  {/* Guidelines */}
                  <section
                    aria-labelledby="guidelines"
                    className="flex flex-col gap-2 rounded-xl border border-[#55516c] bg-[#2a2838] p-5"
                  >
                    <h2
                      id="guidelines"
                      className="flex items-center gap-2 text-sm font-semibold"
                    >
                      <MessageCircle
                        className="size-4 text-[#c2ade7]"
                        strokeWidth={1.7}
                        aria-hidden="true"
                      />
                      Good reviews help everyone
                    </h2>
                    <p className="text-xs leading-5 text-[#b4aec7]">
                      Share your own experience, respect other players, and mark story
                      details as spoilers.
                    </p>

                    <details className="group">
                      <summary className="w-fit cursor-pointer list-none text-xs text-[#c2ade7] hover:text-[#e0deeb]">
                        Community guidelines →
                      </summary>
                      <ul className="mt-2 flex list-disc flex-col gap-1 pl-4 text-xs text-[#b4aec7]">
                        {GUIDELINES.map((rule) => (
                          <li key={rule}>{rule}</li>
                        ))}
                      </ul>
                    </details>
                  </section>
                </aside>
              </div>
            </>
          )}
        </main>

        <Footer />
      </div>
    </div>
  );
}