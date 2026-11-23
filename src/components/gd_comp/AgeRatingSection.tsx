import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, ExternalLink, ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

import type { SteamGameDetail } from "@/services/Gameservice";
import {
  RATING_SYSTEM_NAMES,
  formatRating,
  getRatingDescriptors,
} from "./GameRatings";

interface AgeRatingsSectionProps {
  game: SteamGameDetail;
}

const INITIAL_VISIBLE_RATINGS = 6; // 2 columns x 3 rows

export default function AgeRatingsSection({
  game,
}: AgeRatingsSectionProps) {
  const [showAllRatings, setShowAllRatings] = useState(false);

  const ratings = Object.entries(game.ratings || {}).filter(
    ([, rating]) => rating?.rating
  );

  const requiredAge =
    game.required_age && Number(game.required_age) > 0
      ? Number(game.required_age)
      : null;

  const hasMoreRatings = ratings.length > INITIAL_VISIBLE_RATINGS;
  const visibleRatings = showAllRatings
    ? ratings
    : ratings.slice(0, INITIAL_VISIBLE_RATINGS);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col gap-5"
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-[#E6E1EA]">
          Age rating & content
        </h2>
        <p className="text-sm text-[#A0A0A8]">
          Regional classifications and content information
        </p>
      </div>

      <Card className="gap-0 rounded-2xl border border-[#302438] bg-[#17191E] py-0 text-[#E6E1EA] shadow-none">
        <CardContent className="flex flex-col gap-5 p-6">
          {/* Steam required age */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#302438] pb-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-[#B39ACF]/10 text-[#B39ACF]">
                <ShieldAlert className="size-5" />
              </div>

              <div>
                <p className="text-sm font-semibold text-[#E6E1EA]">
                  Steam required age
                </p>
                <p className="text-xs text-[#A0A0A8]">
                  Age gate reported by Steam
                </p>
              </div>
            </div>

            <span className="rounded-lg border border-[#B39ACF]/30 bg-[#B39ACF]/10 px-4 py-2 text-sm font-bold text-[#C2ADE0]">
              {requiredAge !== null
                ? `${requiredAge}+`
                : "Not specified"}
            </span>
          </div>

          {/* Regional ratings (2 columns x 3 rows max before expanding) */}
          {ratings.length > 0 ? (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {visibleRatings.map(([region, rating]) => {
                  const descriptors = getRatingDescriptors(
                    rating.descriptors
                  );

                  return (
                    <div
                      key={region}
                      className="min-w-0 rounded-xl border border-[#302438] bg-[#20232B] p-4"
                    >
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <span className="truncate text-xs font-semibold text-[#A0A0A8]">
                          {RATING_SYSTEM_NAMES[region] ||
                            region.toUpperCase()}
                        </span>

                        <span className="shrink-0 rounded-md bg-[#B39ACF]/15 px-2.5 py-1 text-xs font-bold text-[#C2ADE0]">
                          {formatRating(rating.rating ?? "")}
                        </span>
                      </div>

                      {rating.required_age && (
                        <p className="mb-3 text-[11px] text-[#A0A0A8]">
                          Minimum age: {rating.required_age}+
                        </p>
                      )}

                      {descriptors.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {descriptors.map((descriptor) => (
                            <span
                              key={descriptor}
                              className="max-w-full break-words rounded-md border border-[#554363]/50 bg-[#17191E] px-2 py-1 text-[10px] text-[#D0C8D8]"
                            >
                              {descriptor}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] text-[#77717F]">
                          No content descriptors provided.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {hasMoreRatings && (
                <button
                  type="button"
                  onClick={() => setShowAllRatings((prev) => !prev)}
                  className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-[#302438] bg-[#20232B]/60 py-2.5 text-xs font-semibold text-[#B39ACF] transition-colors hover:border-[#806B99] hover:text-[#E6E1EA]"
                >
                  <span>
                    {showAllRatings
                      ? "Show less"
                      : `View all (${ratings.length})`}
                  </span>
                  <ChevronDown
                    className={`size-4 transition-transform duration-200 ${
                      showAllRatings ? "rotate-180" : ""
                    }`}
                  />
                </button>
              )}
            </div>
          ) : (
            <p className="text-sm text-[#A0A0A8]">
              No regional age ratings are available for this game.
            </p>
          )}

          {/* Official website */}
          {game.website && (
            <div className="border-t border-[#302438] pt-4">
              <a
                href={game.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-[#B39ACF] transition-colors hover:text-[#C2ADE0]"
              >
                Official Game Website
                <ExternalLink className="size-4" />
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.section>
  );
}