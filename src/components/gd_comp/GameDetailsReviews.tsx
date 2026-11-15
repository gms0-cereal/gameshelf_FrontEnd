
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import ThirdPartyReviews from "@/components/reviews/ThirdPartyReviews";
import GameshelfReviewItem from "@/components/reviews/GameshelfReviewItem";

import type { GameshelfReview } from "@/services/Reviewservice";

interface GameDetailsReviewsProps {
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

export default function GameDetailsReviews({
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
}: GameDetailsReviewsProps) {
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
      <Card className="gap-0 rounded-2xl border border-[#302438] bg-[#17191E] py-0 text-[#E6E1EA] shadow-none">
        <CardContent className="flex flex-col gap-5 p-6">
          {/* REVIEW HEADER & TABS */}

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
                  {
                    value: "gameshelf",
                    label: "GameShelf",
                  },
                  {
                    value: "external",
                    label: "Other sites",
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
                    className={`relative h-8 cursor-pointer rounded-lg px-4 text-xs font-medium transition-colors ${
                      isSelected
                        ? "font-semibold text-[#17191E]"
                        : "text-[#A0A0A8] hover:text-[#E6E1EA]"
                    }`}
                  >
                    {isSelected && (
                      <motion.span
                        layoutId="review-type-active-tab"
                        transition={{
                          type: "spring",
                          stiffness: 450,
                          damping: 32,
                        }}
                        className="absolute inset-0 rounded-lg bg-[#B39ACF]"
                      />
                    )}

                    <span className="relative z-10">
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
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
                    className="text-sm text-[#E58B91]"
                  >
                    Couldn’t load reviews right now.
                  </p>
                )}

                {/* LOADING */}

                {reviewsLoading && gsReviews.length === 0 ? (
                  <div
                    role="status"
                    className="flex flex-col gap-3"
                  >
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-24 animate-pulse rounded-xl border border-[#302438] bg-[#000000]/50"
                      />
                    ))}
                  </div>
                ) : gsReviews.length === 0 ? (
                  /* EMPTY STATE */

                  <div className="flex flex-col items-center gap-3 py-8 text-center">
                    <p className="text-sm text-[#A0A0A8]">
                      No reviews on GameShelf yet. Be the first to share your thoughts!
                    </p>

                    <Button
                      asChild
                      className="h-9 rounded-xl bg-[#B39ACF] px-4 text-xs font-semibold text-[#17191E] hover:bg-[#C2ADE0]"
                    >
                      <Link to={reviewsPath}>
                        Write Review
                      </Link>
                    </Button>
                  </div>
                ) : (
                  /* REVIEW LIST */

                  <div className="flex flex-col gap-4">
                    {gsReviews.map((review) => (
                      <GameshelfReviewItem
                        key={review.id}
                        review={review}
                        onUpdate={replaceReview}
                        onDelete={removeReview}
                      />
                    ))}

                    {/* LOAD MORE */}

                    {gsHasNext && (
                      <div className="flex justify-center pt-2">
                        <Button
                          type="button"
                          onClick={loadMoreGsReviews}
                          disabled={reviewsLoading}
                          className="h-9 rounded-xl border border-[#302438] bg-[#000000] px-5 text-xs font-medium text-[#E6E1EA] hover:border-[#554363] hover:bg-[#20232B]"
                        >
                          {reviewsLoading
                            ? "Loading…"
                            : "Load more reviews"}
                        </Button>
                      </div>
                    )}
                  </div>
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
        </CardContent>
      </Card>
    </motion.section>
  );
}
