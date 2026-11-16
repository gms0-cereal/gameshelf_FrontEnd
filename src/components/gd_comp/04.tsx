
import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { SteamGameDetail } from "@/services/Gameservice";

type Platform = "windows" | "mac" | "linux";

interface SystemRequirementsProps {
  game: SteamGameDetail;
}

interface RequirementEntry {
  label: string;
  value: string;
}

const PLATFORM_LABELS: Record<Platform, string> = {
  windows: "Windows",
  mac: "macOS",
  linux: "Linux",
};

function cleanText(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li[^>]*>/gi, "")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\r/g, "")
    .trim();
}

function parseRequirements(html?: string): RequirementEntry[] {
  if (!html) return [];

  const entries: RequirementEntry[] = [];
  const listItems = html.match(/<li[^>]*>[\s\S]*?<\/li>/gi);

  const lines = listItems?.length
    ? listItems
    : cleanText(html).split("\n");

  for (const line of lines) {
    const text = cleanText(line).replace(/^[-•]\s*/, "").trim();

    if (!text) continue;

    const separator = text.indexOf(":");

    if (separator > 0 && separator < 35) {
      entries.push({
        label: text.slice(0, separator).trim(),
        value: text.slice(separator + 1).trim(),
      });
    } else {
      entries.push({
        label: "",
        value: text,
      });
    }
  }

  return entries;
}

function RequirementPanel({
  title,
  html,
}: {
  title: string;
  html?: string;
}) {
  const [expanded, setExpanded] = useState(false);

  const entries = useMemo(() => parseRequirements(html), [html]);

  const contentLength = entries.reduce(
    (total, entry) => total + entry.label.length + entry.value.length,
    0
  );

  const isLong = entries.length > 4 || contentLength > 550;

  return (
    <div className="rounded-lg border border-[#302438] bg-[#111216] p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#B39ACF]">
          {title} Requirements
        </h3>

        <span className="text-[9px] uppercase tracking-wider text-[#777780]">
          System Specifications
        </span>
      </div>

      {entries.length > 0 ? (
        <>
          <div
            className={`relative overflow-hidden transition-[max-height] duration-500 ease-in-out ${
              isLong && !expanded ? "max-h-[260px]" : "max-h-[2000px]"
            }`}
          >
            <div className="space-y-3">
              {entries.map((entry, index) => (
                <div
                  key={`${entry.label}-${index}`}
                  className="border-b border-[#24232A] pb-3 last:border-0 last:pb-0"
                >
                  {entry.label ? (
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#777780]">
                      {entry.label}
                    </p>
                  ) : null}

                  <p className="whitespace-pre-line break-words text-xs leading-6 text-[#E6E1EA]">
                    {entry.value}
                  </p>
                </div>
              ))}
            </div>

            {isLong && !expanded && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#111216] to-transparent" />
            )}
          </div>

          {isLong && (
            <button
              type="button"
              onClick={() => setExpanded((previous) => !previous)}
              aria-expanded={expanded}
              className="mt-4 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#A0A0A8] transition-colors hover:text-[#C2ADE0]"
            >
              {expanded ? "Show less" : "Show all specifications"}

              {expanded ? (
                <ChevronUp size={14} />
              ) : (
                <ChevronDown size={14} />
              )}
            </button>
          )}
        </>
      ) : (
        <p className="text-xs italic text-[#777780]">
          No {title.toLowerCase()} requirements provided.
        </p>
      )}
    </div>
  );
}

export default function SystemRequirements({
  game,
}: SystemRequirementsProps) {
  const platforms = game.platforms;

  const availablePlatforms = useMemo(() => {
    const supported: Platform[] = [];

    if (platforms?.windows) supported.push("windows");
    if (platforms?.mac) supported.push("mac");
    if (platforms?.linux) supported.push("linux");

    return supported;
  }, [platforms]);

  const [activePlatform, setActivePlatform] = useState<Platform>(
    availablePlatforms[0] ?? "windows"
  );

  const selectedPlatform = availablePlatforms.includes(activePlatform)
    ? activePlatform
    : availablePlatforms[0];

  const requirements = {
    windows: game.pc_requirements,
    mac: game.mac_requirements,
    linux: game.linux_requirements,
  };

  const selectedRequirements = selectedPlatform
    ? requirements[selectedPlatform]
    : undefined;

  const validRequirements =
    selectedRequirements && !Array.isArray(selectedRequirements)
      ? selectedRequirements
      : undefined;

  if (availablePlatforms.length === 0) return null;

  return (
    <section className="rounded-xl border border-[#302438] bg-[#17191E] p-6 sm:p-7">
      {/* Section heading */}
      <div className="mb-6">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B39ACF]">
          04 / Technical Dossier
        </p>

        <h2 className="text-xl font-semibold tracking-wide text-[#E6E1EA]">
          System Requirements
        </h2>

        <div className="mt-4 h-px w-full bg-[#302438]" />
      </div>

      {/* Platform support */}
      <div className="mb-7">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#777780]">
          Platform Support
        </p>

        <div className="flex flex-wrap gap-2">
          {availablePlatforms.map((platform) => {
            const isActive = selectedPlatform === platform;

            return (
              <button
                key={platform}
                type="button"
                onClick={() => setActivePlatform(platform)}
                className={`rounded-md border px-4 py-2 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                  isActive
                    ? "border-[#554363] bg-[#29232F] text-[#C2ADE0]"
                    : "border-[#302438] bg-[#111216] text-[#A0A0A8] hover:border-[#554363] hover:text-[#E6E1EA]"
                }`}
              >
                {PLATFORM_LABELS[platform]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Requirements */}
      {validRequirements ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <RequirementPanel
            title="Minimum"
            html={validRequirements.minimum}
          />

          <RequirementPanel
            title="Recommended"
            html={validRequirements.recommended}
          />
        </div>
      ) : (
        <div className="rounded-lg border border-[#302438] bg-[#111216] px-5 py-8 text-center">
          <p className="text-sm text-[#A0A0A8]">
            System requirements for {PLATFORM_LABELS[selectedPlatform]} are
            not available.
          </p>
        </div>
      )}
    </section>
  );
}
