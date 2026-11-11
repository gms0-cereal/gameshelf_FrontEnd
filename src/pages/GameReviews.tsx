
import { useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { MessageCircle, ThumbsDown, ThumbsUp } from "lucide-react";
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
// helpers
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
    <article className="flex flex-col gap-3 border-t border-[#302438] pt-4 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-center justify-between gap-2 text-[13px] text-[#A0A0A8]">
        <span>
          <span className="text-[#38BDF8]">Steam player</span>
          {" • "}
          {hours.toLocaleString()} h on record
          {" • "}
          {formatDate(review.timestamp_created)}
        </span>

        <span
          className={`inline-flex items-center gap-1.5 font-medium ${
            review.voted_up ? "text-[#34D399]" : "text-[#E58B91]"
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

      <p className="line-clamp-6 whitespace-pre-line text-sm leading-6 text-[#E6E1EA]">
        {review.review || "No written review."}
      </p>

      <p className="text-xs text-[#A0A0A8]">
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

  // Steam reviews
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

  // -------------------------------------------------------------------------
  // Game details
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // Community rating
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!validId) return;

    let cancelled = false;

    getRatingStats(appid!)
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch(() => {
        // The rating card falls back to its empty state.
      });

    return () => {
      cancelled = true;
    };
  }, [appid, validId, reloadKey]);

  // -------------------------------------------------------------------------
  // Existing user review
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!validId) return;

    let cancelled = false;
    setMyReviewReady(false);

    getGameshelfReviews(numericId, {
      sort: "helpful",
      page: 1,
    })
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

  // -------------------------------------------------------------------------
  // First page of Steam reviews
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // Load more Steam reviews
  // -------------------------------------------------------------------------
  function loadMoreReviews() {
    if (!validId) return;

    setReviewsLoading(true);

    getSteamGameReviews(appid!, reviewCursor, REVIEWS_PER_PAGE)
      .then((data) => {
        const list = data?.reviews ?? [];

        setReviews((previous) => {
          const seen = new Set(
            previous.map((review) => review.recommendationid)
          );

          return [
            ...previous,
            ...list.filter(
              (review) => !seen.has(review.recommendationid)
            ),
          ];
        });

        setReviewCursor(data?.cursor ?? reviewCursor);
        setHasMoreReviews(list.length >= REVIEWS_PER_PAGE);
      })
      .catch(() => setReviewsError(true))
      .finally(() => setReviewsLoading(false));
  }

  // -------------------------------------------------------------------------
  // Review composer
  // -------------------------------------------------------------------------
  function openComposer(review: GameshelfReview | null) {
    setEditing(review);
    setComposerOpen(true);
  }

  // Arriving from Rate / Write Review (?write=1)
  useEffect(() => {
    if (wantsWrite && game && myReviewReady && !autoOpened.current) {
      autoOpened.current = true;
      openComposer(myReview);
    }
  }, [wantsWrite, game, myReviewReady, myReview]);

  // Bring composer into view when opened
  useEffect(() => {
    if (composerOpen) {
      composerRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [composerOpen]);

  function handleDone() {
    setComposerOpen(false);
    setEditing(null);
    setReloadKey((key) => key + 1);
  }

  // -------------------------------------------------------------------------
  // Display data
  // -------------------------------------------------------------------------
  const detailPath = `/gamedetails/${appid}`;

  const heroImage =
    game?.screenshots?.[0]?.path_full ??
    game?.background_raw ??
    game?.header_image;

  const year = game?.release_date?.date.match(/\d{4}/)?.[0];

  const heroMeta = [
    game?.developers?.[0],
    year,
    game?.genres
      ?.slice(0, 2)
      .map((genre) => genre.description)
      .join(" / "),
  ]
    .filter(Boolean)
    .join(" • ");

  const average = stats?.average ?? null;

  // -------------------------------------------------------------------------
  // render
  // -------------------------------------------------------------------------
  return (
    <div className="min-h-screen w-full bg-[#000000]">
      <div
        className="flex min-h-screen w-full flex-col bg-[#000000] text-[#E6E1EA] antialiased"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <Navbar />

        <main className="flex flex-1 flex-col gap-10 px-5 pb-16 pt-11 md:px-8 xl:px-16">
          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-1.5 text-[11px] text-[#A0A0A8]"
          >
            <Link
              to="/home"
              className="cursor-pointer transition-colors hover:text-[#E6E1EA]"
            >
              Home
            </Link>

            <span aria-hidden="true">/</span>
            <span>Games</span>
            <span aria-hidden="true">/</span>

            <Link
              to={detailPath}
              className="cursor-pointer transition-colors hover:text-[#E6E1EA]"
            >
              {game?.name ?? "…"}
            </Link>

            <span aria-hidden="true">/</span>

            <span className="text-[#B39ACF]">
              Community reviews
            </span>
          </nav>

          {gameError && (
            <div
              role="alert"
              className="flex flex-col items-center gap-4 py-24"
            >
              <p className="text-sm text-[#E58B91]">
                {gameError}
              </p>

              <Button
                asChild
                className="h-10 rounded-xl border-0 bg-[#B39ACF] px-5 text-sm font-semibold text-[#17191E] shadow-none transition-colors hover:bg-[#C2ADE0]"
              >
                <Link to="/home">Back to Home</Link>
              </Button>
            </div>
          )}

          {!gameError && (
            <>
              {/* Page heading */}
              <div className="flex min-h-[65px] flex-wrap items-center justify-between gap-4">
                <div className="flex flex-col gap-2">
                  <p className="text-[13px] uppercase leading-4 tracking-wider text-[#B39ACF]">
                    THE COMMUNITY IS TALKING
                  </p>

                  <h1 className="text-[36px] font-semibold leading-[41px] tracking-[-0.8px] text-[#E6E1EA]">
                    Community reviews
                  </h1>

                  <p className="text-[13px] text-[#A0A0A8]">
                    {game
                      ? `Player perspectives on ${game.name}.`
                      : "Player perspectives on this game."}
                  </p>
                </div>
              </div>

              {/* Game banner */}
              <section
                aria-label="Game"
                className="relative flex min-h-[220px] items-center overflow-hidden rounded-2xl border border-[#302438] bg-[#17191E] px-6 py-8 md:px-11"
              >
                {heroImage && (
                  <img
                    src={heroImage}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover object-center opacity-75"
                  />
                )}

                <div
                  aria-hidden="true"
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(90deg, rgba(0,0,0,0.96) 0%, rgba(0,0,0,0.78) 48%, rgba(0,0,0,0.24) 100%)",
                  }}
                />

                <div className="relative flex flex-col gap-2">
                  <p className="text-[10px] leading-3 tracking-[2px] text-[#38BDF8]">
                    GAME REVIEWS
                  </p>

                  <h2 className="text-[30px] font-semibold leading-[1.15] tracking-[-0.5px] text-[#E6E1EA]">
                    {game?.name ?? "Loading…"}
                  </h2>

                  {heroMeta && (
                    <p className="text-[13px] text-[#A0A0A8]">
                      {heroMeta}
                    </p>
                  )}

                  <Link
                    to={detailPath}
                    className="mt-1 w-fit cursor-pointer text-xs text-[#B39ACF] transition-colors hover:text-[#C2ADE0]"
                  >
                    Back to game details →
                  </Link>
                </div>
              </section>

              {/* Reviews and sidebar */}
              <div className="grid w-full items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="flex min-w-0 flex-col gap-5">
                  {/* Review composer */}
                  {composerOpen && game && (
                    <div
                      ref={composerRef}
                      className="scroll-mt-6"
                    >
                      <ReviewComposer
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

                  {/* Review list */}
                  <section id="reviews" className="scroll-mt-6">
                    <Card className="gap-0 rounded-2xl border border-[#302438] bg-[#17191E] py-0 text-[#E6E1EA] shadow-none">
                      <CardContent className="flex flex-col gap-5 p-6">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <h2 className="text-[22px] font-semibold leading-7">
                              Player reviews
                            </h2>

                            <p className="mt-1 text-xs text-[#A0A0A8]">
                              Read what players think about this game.
                            </p>
                          </div>

                          <div
                            role="tablist"
                            aria-label="Review type"
                            className="flex gap-1 rounded-xl border border-[#302438] bg-[#000000] p-1"
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
                                className={`h-8 cursor-pointer rounded-lg px-4 text-xs font-medium transition-colors ${
                                  reviewTab === value
                                    ? value === "steam"
                                      ? "bg-[#38BDF8] text-[#000000]"
                                      : "bg-[#B39ACF] text-[#17191E]"
                                    : "text-[#A0A0A8] hover:text-[#E6E1EA]"
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
                            <p
                              role="status"
                              className="text-sm text-[#A0A0A8]"
                            >
                              Loading…
                            </p>
                          )
                        ) : (
                          <>
                            <p className="text-xs text-[#38BDF8]">
                              Most helpful reviews from Steam players
                            </p>

                            {reviews.map((review) => (
                              <ReviewCard
                                key={review.recommendationid}
                                review={review}
                              />
                            ))}

                            {reviewsLoading && (
                              <p
                                role="status"
                                className="text-sm text-[#A0A0A8]"
                              >
                                Loading reviews…
                              </p>
                            )}

                            {reviewsError && (
                              <p
                                role="alert"
                                className="text-sm text-[#E58B91]"
                              >
                                Couldn’t load reviews right now.
                              </p>
                            )}

                            {!reviewsLoading &&
                              !reviewsError &&
                              reviews.length === 0 && (
                                <p className="text-sm text-[#A0A0A8]">
                                  No written reviews yet.
                                </p>
                              )}

                            {hasMoreReviews && !reviewsLoading && (
                              <Button
                                type="button"
                                onClick={loadMoreReviews}
                                className="h-10 w-fit rounded-xl border border-[#302438] bg-transparent px-5 text-sm font-semibold text-[#E6E1EA] shadow-none transition-colors hover:border-[#554363] hover:bg-[#20232B]"
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

                {/* Sidebar */}
                <aside className="flex flex-col gap-5">
                  {/* Community rating */}
                  <section
                    aria-labelledby="community-rating"
                    className="flex flex-col gap-4 rounded-2xl border border-[#302438] bg-[#17191E] p-5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h2
                        id="community-rating"
                        className="text-sm font-semibold"
                      >
                        Community rating
                      </h2>

                      <span className="rounded-full border border-[#554363] bg-[#20232B] px-2.5 py-1 text-[10px] font-medium text-[#B39ACF]">
                        GAMESHELF
                      </span>
                    </div>

                    <p className="flex items-baseline gap-1.5">
                      <span className="text-[44px] font-semibold leading-none text-[#B39ACF]">
                        {average !== null ? average.toFixed(1) : "—"}
                      </span>

                      <span className="text-sm text-[#A0A0A8]">
                        / 10
                      </span>
                    </p>

                    <RatingBar value={average} />

                    <p className="text-xs text-[#A0A0A8]">
                      {stats?.count
                        ? `${stats.count.toLocaleString()} ${
                            stats.count === 1 ? "rating" : "ratings"
                          }`
                        : "No ratings yet"}
                    </p>

                    <div className="flex items-center justify-between border-t border-[#302438] pt-4 text-xs">
                      <span className="text-[#A0A0A8]">
                        Your score
                      </span>

                      <span className="font-medium text-[#34D399]">
                        {stats?.my_score
                          ? `${stats.my_score} / 10`
                          : "Not rated"}
                      </span>
                    </div>

                    <p className="text-xs leading-5 text-[#A0A0A8]">
                      Played {game?.name ?? "this game"}? Share your
                      experience with the community.
                    </p>

                    {!composerOpen && (
                      <Button
                        type="button"
                        onClick={() => openComposer(myReview)}
                        className="h-10 w-full rounded-xl border-0 bg-[#B39ACF] px-4 text-xs font-semibold text-[#17191E] shadow-none transition-colors hover:bg-[#C2ADE0]"
                      >
                        {myReview ? "Edit your review" : "Write a review"}
                      </Button>
                    )}
                  </section>

                  {/* Guidelines */}
                  <section
                    aria-labelledby="guidelines"
                    className="flex flex-col gap-3 rounded-2xl border border-[#302438] bg-[#17191E] p-5"
                  >
                    <h2
                      id="guidelines"
                      className="flex items-center gap-2 text-sm font-semibold"
                    >
                      <MessageCircle
                        className="size-4 text-[#B39ACF]"
                        strokeWidth={1.7}
                        aria-hidden="true"
                      />
                      Good reviews help everyone
                    </h2>

                    <p className="text-xs leading-5 text-[#A0A0A8]">
                      Share your own experience, respect other players,
                      and mark story details as spoilers.
                    </p>

                    <details className="group">
                      <summary className="w-fit cursor-pointer list-none text-xs text-[#38BDF8] transition-colors hover:text-[#7DD3FC]">
                        Community guidelines →
                      </summary>

                      <ul className="mt-3 flex list-disc flex-col gap-2 pl-4 text-xs leading-5 text-[#A0A0A8] marker:text-[#B39ACF]">
                        {GUIDELINES.map((rule) => (
                          <li key={rule}>{rule}</li>
                        ))}
                      </ul>
                    </details>
                  </section>

                  {/* Review status */}
                  <section className="flex flex-col gap-2 rounded-2xl border border-[#302438] bg-[#17191E] p-5">
                    <p className="text-xs font-semibold text-[#E6E1EA]">
                      Your contribution
                    </p>

                    <div className="flex items-center gap-2">
                      <span
                        className={`size-2 rounded-full ${
                          myReview
                            ? "bg-[#34D399]"
                            : "bg-[#FBBF24]"
                        }`}
                      />

                      <span className="text-xs text-[#A0A0A8]">
                        {myReview
                          ? "You've reviewed this game"
                          : "You haven't reviewed this game yet"}
                      </span>
                    </div>
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
