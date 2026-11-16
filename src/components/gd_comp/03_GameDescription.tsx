
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { SteamGameDetail } from "@/services/Gameservice";

interface GameDescriptionProps {
  game: SteamGameDetail;
}

function formatDescription(html?: string): string {
  if (!html) return "";

  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export default function GameDescription({ game }: GameDescriptionProps) {
  const [expanded, setExpanded] = useState(false);

  const description = formatDescription(
    game.about_the_game || game.short_description
  );

  const isLong = description.length > 650;

  return (
    <section className="h-full rounded-xl border border-[#302438] bg-[#17191E] p-6 sm:p-7">
      <div className="mb-6">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B39ACF]">
          03 / Game Description
        </p>

        <h2 className="text-xl font-semibold tracking-wide text-[#E6E1EA]">
          About this game
        </h2>

        <div className="mt-4 h-px w-full bg-[#302438]" />
      </div>

      {description ? (
        <>
          <div
            className={`relative overflow-hidden transition-[max-height] duration-500 ease-in-out ${
              isLong && !expanded ? "max-h-[280px]" : "max-h-[10000px]"
            }`}
          >
            <p className="whitespace-pre-line text-sm leading-7 text-[#A0A0A8]">
              {description}
            </p>

            {isLong && !expanded && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#17191E] to-transparent" />
            )}
          </div>

          {isLong && (
            <button
              type="button"
              onClick={() => setExpanded((previous) => !previous)}
              aria-expanded={expanded}
              className="mt-3 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#A0A0A8] transition-colors hover:text-[#C2ADE0]"
            >
              {expanded ? "Show less" : "Read more"}

              {expanded ? (
                <ChevronUp size={14} />
              ) : (
                <ChevronDown size={14} />
              )}
            </button>
          )}
        </>
      ) : (
        <p className="text-sm italic text-[#777780]">
          No game description is currently available.
        </p>
      )}
    </section>
  );
}
