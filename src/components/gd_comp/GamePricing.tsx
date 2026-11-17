import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import type { SteamGameDetail } from "@/services/Gameservice";

type ExternalPrice = NonNullable<
  SteamGameDetail["external_prices"]
>[number];

interface GamePricingProps {
  externalList: ExternalPrice[];
  lowestExternalPrice: number | null;
  basePriceText: string;
}

function getStoreName(item: ExternalPrice) {
  if (typeof item.store === "string") {
    return item.store;
  }

  return item.store?.name || "Unknown Store";
}

function parseSteamPrice(text: string): number | null {
  if (!text) return null;
  if (/free/i.test(text)) return 0;
  const cleaned = text.replace(/[^0-9.]/g, "");
  const parsed = parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function GamePricing({
  externalList,
  lowestExternalPrice,
  basePriceText,
}: GamePricingProps) {
  const [showExternalPrices, setShowExternalPrices] = useState(false);

  const steamNumeric = parseSteamPrice(basePriceText);

  // Find the cheapest external offer object
  const bestExternalOffer =
    lowestExternalPrice !== null
      ? externalList.find((item) => Number(item.price) === lowestExternalPrice) ?? null
      : null;

  // Determine whether an external offer beats Steam's price
  const isExternalBest =
    bestExternalOffer !== null &&
    lowestExternalPrice !== null &&
    (steamNumeric === null || lowestExternalPrice < steamNumeric);

  const defaultDisplayPrice = isExternalBest
    ? `${bestExternalOffer.currency_symbol || ""}${Number(bestExternalOffer.price).toFixed(2)}`
    : basePriceText;

  const defaultStoreLabel = isExternalBest
    ? getStoreName(bestExternalOffer)
    : null;

  return (
    <div>
      <dt className="mb-1 flex items-center justify-between uppercase tracking-wide text-[#77717F]">
        <span>Price</span>

        <button
          type="button"
          onClick={() =>
            setShowExternalPrices((value) => !value)
          }
          className="flex items-center gap-1 text-[#B8A2DC] transition-colors hover:text-white focus:outline-none"
          title="Compare store prices"
          aria-expanded={showExternalPrices}
        >
          <span>
            {externalList.length > 0
              ? `${externalList.length} offers`
              : "Compare"}
          </span>

          <ChevronDown
            className={`size-3.5 transition-transform duration-200 ${
              showExternalPrices ? "rotate-180" : ""
            }`}
          />
        </button>
      </dt>

      <dd className="flex flex-wrap items-center gap-2 font-semibold text-[#34D399]">
        <span>{defaultDisplayPrice}</span>
        {defaultStoreLabel && (
          <span className="rounded bg-[#34D399]/15 px-1.5 py-0.5 text-[10px] font-medium text-[#34D399]">
            Best · {defaultStoreLabel}
          </span>
        )}
      </dd>

      <AnimatePresence>
        {showExternalPrices && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-2 overflow-hidden"
          >
            <div className="space-y-1 rounded-lg border border-[#302438] bg-[#18121C] p-2.5 text-left shadow-lg">
              <div className="border-b border-[#302438] pb-2 text-[10px] font-semibold uppercase text-[#77717F]">
                Store Comparison
              </div>

              {/* Steam reference row so user can compare against Steam's base price */}
              {basePriceText && (
                <div className="flex items-center justify-between gap-3 border-b border-[#302438]/60 py-2">
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-xs font-medium text-[#B8A2DC]">
                      Steam
                    </span>
                    <span className="text-[10px] text-[#77717F]">
                      Official Store
                    </span>
                  </div>
                  <span
                    className={`flex shrink-0 items-center gap-1 text-xs font-semibold ${
                      !isExternalBest ? "text-[#34D399]" : "text-[#B8A2DC]"
                    }`}
                  >
                    {basePriceText}
                    {!isExternalBest && (
                      <span className="ml-1 rounded bg-[#34D399]/20 px-1.5 py-0.5 text-[9px] text-[#34D399]">
                        Best
                      </span>
                    )}
                  </span>
                </div>
              )}

              {externalList.length > 0 ? (
                externalList.map((item, idx) => {
                  const itemNum = Number(item.price);

                  const isLowest =
                    isExternalBest &&
                    lowestExternalPrice !== null &&
                    itemNum === lowestExternalPrice;

                  const storeName = getStoreName(item);

                  return (
                    <div
                      key={`${item.url}-${idx}`}
                      className="flex items-center justify-between gap-3 border-b border-[#302438]/60 py-2 last:border-0"
                    >
                      <div className="flex min-w-0 flex-col">
                        <span
                          className="truncate text-xs font-medium text-[#B8A2DC]"
                          title={storeName}
                        >
                          {storeName}
                        </span>

                        <span className="text-[10px] text-[#77717F]">
                          {[
                            item.platform,
                            item.edition,
                            item.region,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </div>

                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex shrink-0 items-center gap-1 text-xs font-semibold hover:underline ${
                          isLowest
                            ? "text-[#34D399]"
                            : "text-[#B8A2DC]"
                        }`}
                      >
                        {item.currency_symbol || ""}
                        {itemNum.toFixed(2)}

                        {isLowest && (
                          <span className="ml-1 rounded bg-[#34D399]/20 px-1.5 py-0.5 text-[9px] text-[#34D399]">
                            Best
                          </span>
                        )}
                      </a>
                    </div>
                  );
                })
              ) : (
                <div className="py-2 text-center text-[11px] italic text-[#77717F]">
                  No alternative offers available.
                </div>
              )}

              <p className="pt-1 text-[9px] text-[#77717F]">
                Prices and availability are provided by external stores.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}