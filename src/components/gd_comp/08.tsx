
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

import ThirdPartyReviews from "@/components/reviews/ThirdPartyReviews";
import GameshelfReviewItem from "@/components/reviews/GameshelfReviewItem";

import type { GameshelfReview } from "@/services/Reviewservice";

interface CommunityProps {
  appId: number;
  gameName: string;
  reviewsPath: string;

  reviewTab: "gameshelf" | "external";
  setReviewTab: (tab: "gameshelf" | "external") => void;

  gsReviews: GameshelfReview[];
  gsHasNext: boolean;
  reviewsLoading: boolean;
  reviewsError: boolean;

  loadMoreGsReviews: () => void;
  replaceReview: (updated: GameshelfReview) => void;
  removeReview: (id: number) => void;
}

const REVIEWS_PER_PAGE = 10;

export default function Community({
  appId,
  gameName,
  reviewsPath,
  reviewTab,
  setReviewTab,
  gsReviews,
  gsHasNext,
  reviewsLoading,
  reviewsError,
  loadMoreGsReviews,
  replaceReview,
  removeReview,
}: CommunityProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pendingNextPage, setPendingNextPage] = useState(false);

  const totalLoadedPages = Math.ceil(
    gsReviews.length / REVIEWS_PER_PAGE,
  );

  const startIndex = (currentPage - 1) * REVIEWS_PER_PAGE;
  const endIndex = startIndex + REVIEWS_PER_PAGE;

  const currentReviews = gsReviews.slice(startIndex, endIndex);

  const canGoPrevious = currentPage > 1;
  const canGoNext =
    currentPage < totalLoadedPages || gsHasNext;

  // Advance only after the next batch has actually arrived.
  useEffect(() => {
    if (
      pendingNextPage &&
      !reviewsLoading &&
      gsReviews.length > currentPage * REVIEWS_PER_PAGE
    ) {
      setCurrentPage((page) => page + 1);
      setPendingNextPage(false);
    }
  }, [
    pendingNextPage,
    reviewsLoading,
    gsReviews.length,
    currentPage,
  ]);

  // Reset pagination when navigating to another game.
  useEffect(() => {
    setCurrentPage(1);
    setPendingNextPage(false);
  }, [appId]);

  const handleNextPage = () => {
    if (currentPage < totalLoadedPages) {
      setCurrentPage((page) => page + 1);
      return;
    }

    if (gsHasNext && !reviewsLoading) {
      setPendingNextPage(true);
      loadMoreGsReviews();
    }
  };

  const handlePreviousPage = () => {
    if (canGoPrevious) {
      setCurrentPage((page) => page - 1);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: 0.18,
        ease: "easeOut",
      }}
      id="reviews"
      className="scroll-mt-6"
    >
      <div className="rounded-xl border border-[#302438] bg-[#17191E] p-6 sm:p-7">
        {/* SECTION HEADER */}
        <div className="mb-6">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B39ACF]">
            08 / Community
          </p>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold tracking-wide text-[#E6E1EA]">
                Player Reviews
              </h2>

              <p className="mt-1 text-xs text-[#A0A0A8]">
                Opinions and experiences from across the gaming community
              </p>
            </div>

            <Button
              asChild
              className="h-9 rounded-lg bg-[#B39ACF] px-4 text-xs font-semibold text-[#17191E] hover:bg-[#C2ADE0]"
            >
              <Link to={reviewsPath}>
                Write a Review
              </Link>
            </Button>
          </div>

          <div className="mt-5 h-px w-full bg-[#302438]" />
        </div>

        {/* REVIEW TABS */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div
            role="tablist"
            aria-label="Review type"
            className="flex gap-1 rounded-lg border border-[#302438] bg-[#000000] p-1"
          >
            {(
              [
                {
                  value: "gameshelf",
                  label: "GameShelf Reviews",
                },
                {
                  value: "external",
                  label: "Other Reviews",
                },
              ] as const
            ).map(({ value, label }) => {
              const isSelected = reviewTab === value;

              return (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setReviewTab(value)}
                  className={`relative h-8 cursor-pointer rounded-md px-4 text-xs font-medium transition-colors ${
                    isSelected
                      ? "font-semibold text-[#17191E]"
                      : "text-[#A0A0A8] hover:text-[#E6E1EA]"
                  }`}
                >
                  {isSelected && (
                    <motion.span
                      layoutId="community-review-active-tab"
                      transition={{
                        type: "spring",
                        stiffness: 450,
                        damping: 32,
                      }}
                      className="absolute inset-0 rounded-md bg-[#B39ACF]"
                    />
                  )}

                  <span className="relative z-10">
                    {label}
                  </span>
                </button>
              );
            })}
          </div>

          {reviewTab === "gameshelf" && gsReviews.length > 0 && (
            <span className="text-[10px] uppercase tracking-wider text-[#777780]">
              Showing {startIndex + 1}–
              {Math.min(endIndex, gsReviews.length)} of{" "}
              {gsReviews.length}
              {gsHasNext ? "+" : ""} loaded
            </span>
          )}
        </div>

        {/* REVIEW CONTENT */}
        <AnimatePresence mode="wait">
          {reviewTab === "gameshelf" ? (
            <motion.div
              key="gameshelf-reviews"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="flex flex-col gap-4"
            >
              {/* ERROR */}
              {reviewsError && (
                <p
                  role="alert"
                  className="rounded-lg border border-[#E58B91]/20 bg-[#E58B91]/5 px-4 py-3 text-sm text-[#E58B91]"
                >
                  Couldn't load reviews right now.
                </p>
              )}

              {/* LOADING */}
              {reviewsLoading && gsReviews.length === 0 ? (
                <div
                  role="status"
                  aria-label="Loading reviews"
                  className="flex flex-col gap-3"
                >
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-28 animate-pulse rounded-lg border border-[#302438] bg-[#000000]/50"
                    />
                  ))}
                </div>
              ) : gsReviews.length === 0 ? (
                /* EMPTY STATE */
                <div className="flex min-h-[220px] flex-col items-center justify-center rounded-lg border border-[#302438] bg-[#111216] px-5 py-10 text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8F7BAC]">
                    Community Archive / No Records
                  </p>

                  <h3 className="mt-3 text-lg font-medium text-[#E6E1EA]">
                    The conversation starts with you.
                  </h3>

                  <p className="mt-2 max-w-md text-xs leading-6 text-[#777780]">
                    No GameShelf reviews have been submitted for this title
                    yet. Share your experience and leave the first record.
                  </p>

                  <Button
                    asChild
                    className="mt-5 h-9 rounded-lg bg-[#B39ACF] px-5 text-xs font-semibold text-[#17191E] hover:bg-[#C2ADE0]"
                  >
                    <Link to={reviewsPath}>
                      Write the First Review
                    </Link>
                  </Button>
                </div>
              ) : (
                <>
                  {/* REVIEW LIST */}
                  <div className="flex flex-col gap-4">
                    {currentReviews.map((review) => (
                    <GameshelfReviewItem
                      key={review.id}
                      review={review}
                      onUpdated={replaceReview}
                      onDeleted={removeReview}
                    />
                    ))}
                  </div>

                  {/* PAGINATION */}
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[#302438] pt-5">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePreviousPage}
                      disabled={!canGoPrevious}
                      className="h-9 rounded-lg border-[#302438] bg-[#000000] px-4 text-xs text-[#E6E1EA] hover:border-[#554363] hover:bg-[#20232B] disabled:opacity-30"
                    >
                      <ChevronLeft className="mr-1 h-4 w-4" />
                      Previous
                    </Button>

                    <span className="text-xs tabular-nums text-[#A0A0A8]">
                      Page {currentPage}
                      {gsHasNext || currentPage < totalLoadedPages
                        ? ` of ${gsHasNext ? "…" : totalLoadedPages}`
                        : ""}
                    </span>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleNextPage}
                      disabled={!canGoNext || reviewsLoading}
                      className="h-9 rounded-lg border-[#302438] bg-[#000000] px-4 text-xs text-[#E6E1EA] hover:border-[#554363] hover:bg-[#20232B] disabled:opacity-30"
                    >
                      {reviewsLoading && pendingNextPage
                        ? "Loading…"
                        : "Next"}
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          ) : (
            /* THIRD-PARTY REVIEWS */
            <motion.div
              key="external-reviews"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              <ThirdPartyReviews
                appId={appId}
                gameName={gameName}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}
