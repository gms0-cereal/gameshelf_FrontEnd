
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {
  getRatingStats,
  type RatingStats,
} from "@/services/Reviewservice";
import {
  VisualDocumentation,
  MarketIntelligence,
  GameDescription,
  GameInformation,
  TechnicalDossier,
  Classification,
  Expansions,
  RelatedArchive,
  Community,
  ScreenshotLightbox,
} from "@/components/gd_comp";

import {
  getSteamGameDetails,
  type SteamGameDetail,
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

// ============================================================
// CONSTANTS
// ============================================================

const REVIEWS_PER_PAGE = 10;
const DLC_LIMIT = 3;
const SCREENSHOT_LIMIT = 6;

// ============================================================
// HELPERS
// ============================================================

function platformLabel(platforms: SteamGameDetail["platforms"]) {
  if (!platforms) return "";

  const names: string[] = [];

  if (platforms.windows) names.push("PC");
  if (platforms.mac) names.push("Mac");
  if (platforms.linux) names.push("Linux");

  return names.join(" / ");
}

function getStoreName(item: {
  store?: string | { name?: string };
}) {
  if (typeof item.store === "string") {
    return item.store;
  }

  return item.store?.name || "Unknown Store";
}

function getPriceNumber(price: unknown) {
  const parsed = Number(price);
  return Number.isFinite(parsed) ? parsed : null;
}

// ============================================================
// PAGE
// ============================================================

export default function GameDetails() {
  const { appid } = useParams<{ appid: string }>();

  // ----------------------------------------------------------
  // MAIN PAGE STATE
  // ----------------------------------------------------------
  const [ratingStats, setRatingStats] = useState<RatingStats | null>(null);
  const [game, setGame] = useState<SteamGameDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dlc, setDlc] = useState<SteamGameDetail[]>([]);

  const [activeScreenshot, setActiveScreenshot] =
    useState<string | null>(null);
  // ----------------------------------------------------------
  // Your reviews
  // ----------------------------------------------------------

  useEffect(() => {
    if (!appid) return;

    let cancelled = false;

    getRatingStats(Number(appid))
      .then((data) => {
        if (!cancelled) setRatingStats(data);
      })
      .catch(() => {
        if (!cancelled) setRatingStats(null);
      });

    return () => {
      cancelled = true;
    };
  }, [appid]);
  // ----------------------------------------------------------
  // REVIEW STATE
  // ----------------------------------------------------------

  const [reviewTab, setReviewTab] = useState<
    "gameshelf" | "external"
  >("gameshelf");

  const [gsReviews, setGsReviews] = useState<GameshelfReview[]>([]);
  const [gsPage, setGsPage] = useState(1);
  const [gsHasNext, setGsHasNext] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState(false);

  // ----------------------------------------------------------
  // LIKE STATE
  // ----------------------------------------------------------

  const [like, setLike] = useState<GameLikeStats>({
    liked: false,
    like_count: 0,
  });

  const [likeBusy, setLikeBusy] = useState(false);

  // ----------------------------------------------------------
  // PRICE COMPARISON
  // ----------------------------------------------------------

  const externalList = useMemo(() => {
    const offers = (game?.external_prices || [])
      .filter(
        (item) =>
          item.available === true &&
          getPriceNumber(item.price) !== null &&
          getPriceNumber(item.price)! >= 0
      )
      .sort((a, b) => Number(a.price) - Number(b.price));

    const platformBest = [
      offers.find((item) =>
        getStoreName(item).toLowerCase().includes("steam")
      ),

      offers.find((item) =>
        String(item.platform || "")
          .toLowerCase()
          .includes("xbox")
      ),

      offers.find((item) => {
        const platform = String(item.platform || "").toLowerCase();

        return (
          platform.includes("playstation") ||
          platform.includes("ps4") ||
          platform.includes("ps5")
        );
      }),

      offers.find((item) => {
        const platform = String(item.platform || "").toLowerCase();

        return (
          platform.includes("nintendo") ||
          platform.includes("switch")
        );
      }),
    ].filter(Boolean);

    const selected = [...offers.slice(0, 10)];

    for (const item of platformBest) {
      if (
        item &&
        !selected.some((existing) => existing.url === item.url)
      ) {
        selected.push(item);
      }
    }

    return selected.sort(
      (a, b) => Number(a.price) - Number(b.price)
    );
  }, [game?.external_prices]);

  const lowestExternalPrice =
    externalList.length > 0
      ? Math.min(
          ...externalList.map((item) => Number(item.price))
        )
      : null;

  const basePriceText = game?.is_free
    ? "Free to play"
    : game?.price_overview?.final_formatted ?? "—";

  // ----------------------------------------------------------
  // LOAD GAME DETAILS
  // ----------------------------------------------------------

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

  // ----------------------------------------------------------
  // LOAD GAME LIKES
  // ----------------------------------------------------------

  useEffect(() => {
    if (!appid || !/^\d+$/.test(appid)) return;

    let cancelled = false;

    setLike({
      liked: false,
      like_count: 0,
    });

    getGameLike(appid)
      .then((data) => {
        if (!cancelled) setLike(data);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [appid]);

  // ----------------------------------------------------------
  // TOGGLE LIKE
  // ----------------------------------------------------------

  async function toggleLike() {
    if (!appid || likeBusy) return;

    const previous = like;

    setLike({
      liked: !previous.liked,
      like_count: Math.max(
        0,
        previous.like_count + (previous.liked ? -1 : 1)
      ),
    });

    setLikeBusy(true);

    try {
      setLike(
        previous.liked
          ? await unlikeGame(appid)
          : await likeGame(appid)
      );
    } catch (err) {
      setLike(previous);

      toast.error(
        apiErrorMessage(
          err,
          "Couldn’t update your like. Please try again."
        )
      );
    } finally {
      setLikeBusy(false);
    }
  }

  // ----------------------------------------------------------
  // DOCUMENT TITLE
  // ----------------------------------------------------------

  useEffect(() => {
    if (game) {
      document.title = `${game.name} | GameShelf`;
    }
  }, [game]);

  // ----------------------------------------------------------
  // LOAD DLC
  // ----------------------------------------------------------

  useEffect(() => {
    if (!game?.dlc?.length) return;

    let cancelled = false;

    Promise.allSettled(
      game.dlc
        .slice(0, DLC_LIMIT)
        .map((id) => getSteamGameDetails(id))
    ).then((results) => {
      if (cancelled) return;

      setDlc(
        results
          .filter(
            (
              result
            ): result is PromiseFulfilledResult<SteamGameDetail> =>
              result.status === "fulfilled"
          )
          .map((result) => result.value)
      );
    });

    return () => {
      cancelled = true;
    };
  }, [game]);

  // ----------------------------------------------------------
  // LOAD GAMESHELF REVIEWS
  // ----------------------------------------------------------

  useEffect(() => {
    if (!appid || !/^\d+$/.test(appid)) return;

    let cancelled = false;

    setGsReviews([]);
    setGsPage(1);
    setGsHasNext(false);
    setReviewsError(false);
    setReviewsLoading(true);

    getGameshelfReviews(appid, {
      sort: "helpful",
      page: 1,
      pageSize: REVIEWS_PER_PAGE,
    })
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

  // ----------------------------------------------------------
  // REVIEW ACTIONS
  // ----------------------------------------------------------

  function loadMoreGsReviews() {
    if (!appid || reviewsLoading) return;

    const nextPage = gsPage + 1;

    setReviewsLoading(true);

    getGameshelfReviews(appid, {
      sort: "helpful",
      page: nextPage,
      pageSize: REVIEWS_PER_PAGE,
    })
      .then((data) => {
        setGsReviews((previous) => {
          const seen = new Set(previous.map((review) => review.id));

          return [
            ...previous,
            ...data.results.filter(
              (review) => !seen.has(review.id)
            ),
          ];
        });

        setGsPage(nextPage);
        setGsHasNext(data.has_next);
      })
      .catch(() => setReviewsError(true))
      .finally(() => setReviewsLoading(false));
  }

  function replaceReview(updated: GameshelfReview) {
    setGsReviews((previous) =>
      previous.map((review) =>
        review.id === updated.id ? updated : review
      )
    );
  }

  function removeReview(id: number) {
    setGsReviews((previous) =>
      previous.filter((review) => review.id !== id)
    );
  }

  // ----------------------------------------------------------
  // DERIVED GAME DATA
  // ----------------------------------------------------------

  const genres =
    game?.genres?.map((genre) => genre.description) ?? [];

  const platforms = platformLabel(game?.platforms);

  const heroImage =
    game?.screenshots?.[0]?.path_full ??
    game?.background_raw ??
    game?.header_image;

  const storeUrl =
    `https://store.steampowered.com/app/${appid}`;

  const reviewsPath =
    `/gamedetails/${appid}/reviews?write=1`;

  const communityScore =
    game?.bayesian_score ?? null;

  const totalReviews =
    game?.rating_count ?? 0;

  const screenshots =
    game?.screenshots?.slice(0, SCREENSHOT_LIMIT) ?? [];

  const trailer =
    game?.movies?.[0];

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------

  return (
    <div className="min-h-screen w-full min-w-0 overflow-x-clip bg-[#000000]">
      <div
        className="flex min-h-screen w-full min-w-0 flex-col overflow-x-clip bg-[#000000] text-[#E6E1EA] antialiased"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <Navbar />

        <main className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-10 px-5 pb-16 pt-8 md:px-8 xl:px-12">

          {/* ==================================================
              BREADCRUMB
          ================================================== */}

          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#A0A0A8]"
          >
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-1.5"
            >
              <Link
                to="/home"
                className="transition-colors hover:text-[#E6E1EA]"
              >
                Home
              </Link>

              <span aria-hidden="true">/</span>
              <span>Games</span>
              <span aria-hidden="true">/</span>

              <span className="text-[#E6E1EA]">
                {game?.name ?? "…"}
              </span>
            </nav>

            <span className="uppercase tracking-[0.16em]">
              Game Details
            </span>
          </motion.div>

          {/* ==================================================
              LOADING STATE
          ================================================== */}

          {loading && (
            <div
              role="status"
              aria-label="Loading game details"
              className="flex flex-col gap-8"
            >
              <div className="h-[320px] w-full animate-pulse rounded-2xl bg-[#17191E]" />

              <div className="grid gap-5 lg:grid-cols-2">
                <div className="h-[220px] animate-pulse rounded-2xl bg-[#17191E]" />
                <div className="h-[220px] animate-pulse rounded-2xl bg-[#17191E]" />
              </div>

              <div className="h-[260px] w-full animate-pulse rounded-2xl bg-[#17191E]" />
            </div>
          )}

          {/* ==================================================
              ERROR STATE
          ================================================== */}

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              role="alert"
              className="flex flex-col items-center gap-4 py-24"
            >
              <p className="text-sm text-[#E58B91]">
                {error}
              </p>

              <Button
                asChild
                className="h-10 rounded-xl border-0 bg-[#B39ACF] px-5 text-sm font-semibold text-[#17191E] shadow-none hover:bg-[#C2ADE0]"
              >
                <Link to="/home">
                  Back to Home
                </Link>
              </Button>
            </motion.div>
          )}

          {/* ==================================================
              GAME DETAILS DOCUMENT
          ================================================== */}

          {game && (
            <div className="flex flex-col gap-12">

              {/* ------------------------------------------------
                  01 / VISUAL DOCUMENTATION
                  02 / MARKET INTELLIGENCE
              ------------------------------------------------ */}

              <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.85fr)]">

                <VisualDocumentation
                  game={game}
                  heroImage={heroImage}
                  genres={genres}
                  platforms={platforms}
                  trailer={trailer}
                  screenshots={screenshots}
                  storeUrl={storeUrl}
                  onSelectScreenshot={setActiveScreenshot}
                />

                <MarketIntelligence
                  game={game}
                  reviewsPath={reviewsPath}
                  communityScore={communityScore}
                  totalReviews={totalReviews}
                  liked={like.liked}
                  likeCount={like.like_count}
                  likeBusy={likeBusy}
                  onToggleLike={toggleLike}
                  myScore={ratingStats?.my_score ?? null}
                />

              </div>

              {/* ------------------------------------------------
                  03 / GAME DESCRIPTION
                  03 / GAME INFORMATION
              ------------------------------------------------ */}

              <div className="grid items-stretch gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,0.85fr)]">

                <GameDescription game={game} />

                <GameInformation game={game} />

              </div>

              {/* ------------------------------------------------
                  04 / TECHNICAL DOSSIER
              ------------------------------------------------ */}

              <TechnicalDossier game={game} />

              {/* ------------------------------------------------
                  05 / CLASSIFICATION & ADDITIONAL INFORMATION
              ------------------------------------------------ */}

              <Classification
                game={game}
                externalList={externalList}
                lowestExternalPrice={lowestExternalPrice}
                basePriceText={basePriceText}
              />

              {/* ------------------------------------------------
                  06 / EXPANSIONS
                  07 / RELATED ARCHIVE
              ------------------------------------------------ */}

              <div className="grid items-start gap-5 xl:grid-cols-2">

                <Expansions dlc={dlc} />

                <RelatedArchive appId={game.steam_appid} />

              </div>

              {/* ------------------------------------------------
                  08 / COMMUNITY
              ------------------------------------------------ */}

              <Community
                appId={game.steam_appid}
                gameName={game.name}
                reviewsPath={reviewsPath}
                reviewTab={reviewTab}
                setReviewTab={setReviewTab}
                gsReviews={gsReviews}
                gsHasNext={gsHasNext}
                reviewsLoading={reviewsLoading}
                reviewsError={reviewsError}
                loadMoreGsReviews={loadMoreGsReviews}
                replaceReview={replaceReview}
                removeReview={removeReview}
              />

            </div>
          )}
        </main>

        {/* ------------------------------------------------------
            SCREENSHOT LIGHTBOX
        ------------------------------------------------------ */}

        <ScreenshotLightbox
          activeScreenshot={activeScreenshot}
          onClose={() => setActiveScreenshot(null)}
        />

        <Footer />
      </div>
    </div>
  );
}
