
import type { SteamGameDetail } from "@/services/Gameservice";
import AgeRatingsSection from "./AgeRatingSection";
import GamePricing from "./GamePricing";

interface ClassificationProps {
  game: SteamGameDetail;
  externalList: NonNullable<SteamGameDetail["external_prices"]>;
  lowestExternalPrice: number | null;
  basePriceText: string;
}

function formatCategory(description: string): string {
  const specialLabels: Record<string, string> = {
    "#category_playable_at_your_own_pace":
      "Playable at Your Own Pace",
  };

  return specialLabels[description] ?? description;
}

export default function Classification({
  game,
  externalList,
  lowestExternalPrice,
  basePriceText,
}: ClassificationProps) {
  const categories = game.categories ?? [];

  return (
    <section className="rounded-xl border border-[#302438] bg-[#17191E] p-6 sm:p-7">
      {/* Section heading */}
      <div className="mb-7">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B39ACF]">
          05 / Classification & Additional Information
        </p>

        <h2 className="text-xl font-semibold tracking-wide text-[#E6E1EA]">
          Game Classification
        </h2>

        <div className="mt-4 h-px w-full bg-[#302438]" />
      </div>

      {/* Age ratings and additional metadata */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="min-w-0">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#E6E1EA]">
              Age Ratings
            </p>

            <p className="mt-1 text-[11px] text-[#777780]">
              Official regional content classifications
            </p>
          </div>

          <AgeRatingsSection game={game} />
        </div>

        <div className="min-w-0 space-y-6">
          {/* Languages */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-[#E6E1EA]">
              Languages
            </p>

            <div className="rounded-lg border border-[#302438] bg-[#111216] p-4">
              <p className="text-xs leading-6 text-[#777780]">
                Language information is not currently available through the
                game details interface.
              </p>
            </div>
          </div>

          {/* Features */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-[#E6E1EA]">
              Features
            </p>

            {categories.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <span
                    key={category.id}
                    className="rounded-md border border-[#302438] bg-[#111216] px-3 py-2 text-[10px] font-medium tracking-wide text-[#B39ACF]"
                  >
                    {formatCategory(category.description)}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#777780]">
                No Steam features or categories available.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="mt-7 border-t border-[#302438] pt-6">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#E6E1EA]">
            Price & Availability
          </p>

          <p className="mt-1 text-[11px] text-[#777780]">
            Available storefront offers and regional pricing
          </p>
        </div>

        <GamePricing
          externalList={externalList}
          lowestExternalPrice={lowestExternalPrice}
          basePriceText={basePriceText}
        />
      </div>
    </section>
  );
}
