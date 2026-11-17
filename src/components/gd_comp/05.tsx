
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

function parseLanguages(raw: string) {
  const languageLine = raw.split(/<br\s*\/?>/i)[0] ?? "";

  const languages = languageLine
    .replace(/<[^>]*>/g, "")
    .split(",")
    .map((language) => language.trim())
    .filter(Boolean);

  return {
    languages: languages.map((language) =>
      language.replace(/\*$/, "")
    ),
    fullAudioLanguages: languages
      .filter((language) => language.endsWith("*"))
      .map((language) => language.replace(/\*$/, "")),
  };
}

function Jellyfish({
  className = "",
  delay = 0,
}: {
  className?: string;
  delay?: number;
}) {
  return (
    <svg
      viewBox="0 0 100 120"
      fill="none"
      aria-hidden="true"
      className={`overflow-visible ${className}`}
      style={{
        animation: `archive-jelly-float 5s ease-in-out ${delay}s infinite`,
      }}
    >
      <defs>
        <linearGradient
          id="archive-jelly-body"
          x1="20"
          y1="15"
          x2="80"
          y2="90"
        >
          <stop stopColor="#D8C4F0" stopOpacity=".65" />
          <stop offset="1" stopColor="#8D72B6" stopOpacity=".18" />
        </linearGradient>
      </defs>

      <path
        d="M16 57C16 31 30 15 50 15C70 15 84 31 84 57C84 69 69 76 50 76C31 76 16 69 16 57Z"
        fill="url(#archive-jelly-body)"
        stroke="#B39ACF"
        strokeOpacity=".65"
        strokeWidth="1.5"
      />

      <path
        d="M28 74C27 89 35 91 31 106M43 76C43 91 49 94 45 113M58 76C57 91 66 96 61 108M72 73C75 87 69 93 76 103"
        stroke="#B39ACF"
        strokeOpacity=".55"
        strokeWidth="2"
        strokeLinecap="round"
      />

      <path
        d="M34 45C38 35 45 31 55 32"
        stroke="white"
        strokeOpacity=".35"
        strokeWidth="3"
        strokeLinecap="round"
      />

      <circle cx="39" cy="57" r="2" fill="#E6E1EA" fillOpacity=".65" />
      <circle cx="61" cy="57" r="2" fill="#E6E1EA" fillOpacity=".65" />
    </svg>
  );
}

export default function Classification({
  game,
  externalList,
  lowestExternalPrice,
  basePriceText,
}: ClassificationProps) {
  const categories = game.categories ?? [];

  const { languages, fullAudioLanguages } = parseLanguages(
    game.supported_languages ?? ""
  );

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
              {languages.length > 0 ? (
                <>
                  <div className="flex flex-wrap gap-2">
                    {languages.map((language) => (
                      <span
                        key={language}
                        className="max-w-full break-words rounded-md border border-[#302438] bg-[#17191E] px-3 py-2 text-[10px] font-medium text-[#B39ACF]"
                      >
                        {language}
                      </span>
                    ))}
                  </div>

                  {fullAudioLanguages.length > 0 && (
                    <p className="mt-3 text-[10px] leading-5 text-[#777780]">
                      <span className="font-semibold text-[#B39ACF]">
                        *
                      </span>{" "}
                      Full audio support:{" "}
                      {fullAudioLanguages.join(", ")}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-xs leading-6 text-[#777780]">
                  Language information is not currently available through the
                  game details interface.
                </p>
              )}
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

          {/* Decorative jellyfish */}
          <div className="pointer-events-none relative mt-4 flex min-h-[125px] items-end justify-around overflow-hidden pt-5">
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#24202D]/40 to-transparent" />

            <Jellyfish
              className="relative z-10 w-12 opacity-40"
              delay={0.2}
            />

            <Jellyfish
              className="relative z-10 w-[4.5rem] opacity-70"
              delay={1.3}
            />

            <Jellyfish
              className="relative z-10 w-10 opacity-30"
              delay={0.8}
            />

            <Jellyfish
              className="relative z-10 w-14 opacity-50"
              delay={2}
            />
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

      <style>{`
        @keyframes archive-jelly-float {
          0%, 100% { transform: translateY(0) rotate(-3deg); }
          50% { transform: translateY(-12px) rotate(3deg); }
        }
      `}</style>
    </section>
  );
}
