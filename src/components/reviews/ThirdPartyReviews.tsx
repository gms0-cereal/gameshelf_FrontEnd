import { useEffect, useRef, useState } from "react";
import { ExternalLink, SlidersHorizontal, ThumbsDown, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getExternalReviews,
  type ExternalApiSource,
  type ExternalReviewItem,
  type ExternalReviewsResponse,
} from "@/services/Reviewservice";

// ---------------------------------------------------------------------------
// Sources
// "api" sources are fetched through our backend (`external_sources.py`).
// "link" sources have no public reviews API, so we send the user to the site.
// ---------------------------------------------------------------------------
type Source =
  | { key: ExternalApiSource; label: string; kind: "api"; scoreLabel?: string }
  | { key: string; label: string; kind: "link"; url: (gameName: string) => string };

const encode = encodeURIComponent;

const SOURCES: Source[] = [
  { key: "steam", label: "Steam", kind: "api", scoreLabel: "Helpful" },
  { key: "reddit", label: "Reddit", kind: "api", scoreLabel: "Upvotes" },
  { key: "metacritic", label: "Metacritic", kind: "api" },
  {
    key: "xbox",
    label: "Xbox",
    kind: "link",
    url: (name) => `https://www.xbox.com/en-US/search?q=${encode(name)}`,
  },
  {
    key: "opencritic",
    label: "OpenCritic",
    kind: "link",
    url: (name) => `https://opencritic.com/search/${encode(name)}`,
  },
  {
    key: "ign",
    label: "IGN",
    kind: "link",
    url: (name) => `https://www.ign.com/search?q=${encode(name)}`,
  },
];

const ENABLED_KEY = "gameshelf:review-sources";
const ACTIVE_KEY = "gameshelf:review-source-active";
const ALL_KEYS = SOURCES.map((source) => source.key);

function readEnabled(): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(ENABLED_KEY) ?? "null");
    if (Array.isArray(parsed)) {
      const valid = parsed.filter((key) => ALL_KEYS.includes(key));
      if (valid.length > 0) return valid;
    }
  } catch {
    /* ignore corrupt storage */
  }
  return ALL_KEYS;
}

function readActive(enabled: string[]): string {
  try {
    const saved = localStorage.getItem(ACTIVE_KEY);
    if (saved && enabled.includes(saved)) return saved;
  } catch {
    /* ignore */
  }
  return enabled[0];
}

function formatDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// One third-party review / post
// ---------------------------------------------------------------------------
function ExternalItem({
  item,
  scoreLabel,
}: {
  item: ExternalReviewItem;
  scoreLabel?: string;
}) {
  return (
    <article className="flex flex-col gap-2 border-t border-[#55516c] pt-5 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-center justify-between gap-2 text-[13px] text-[#b4aec7]">
        <span>
          <span className="font-semibold text-[#e0deeb]">{item.author}</span>
          {item.meta && ` • ${item.meta}`}
          {item.created_at && ` • ${formatDate(item.created_at)}`}
        </span>

        {item.positive !== null && (
          <span
            className={`inline-flex items-center gap-1.5 font-medium ${
              item.positive ? "text-[#86d9a0]" : "text-[#e58d91]"
            }`}
          >
            {item.positive ? (
              <ThumbsUp className="size-4" aria-hidden="true" />
            ) : (
              <ThumbsDown className="size-4" aria-hidden="true" />
            )}
            {item.positive ? "Recommended" : "Not recommended"}
          </span>
        )}
      </div>

      {item.title && <h3 className="text-base font-semibold">{item.title}</h3>}

      {item.body && (
        <p className="line-clamp-6 whitespace-pre-line text-sm leading-6 text-[#e0deeb]">
          {item.body}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-4 text-xs text-[#b4aec7]">
        {item.score !== null && scoreLabel && (
          <span>
            {scoreLabel} ({item.score.toLocaleString()})
          </span>
        )}
        {item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[#c2ade7] hover:text-[#e0deeb]"
          >
            Read on site
            <ExternalLink className="size-3" aria-hidden="true" />
          </a>
        )}
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Third-party reviews with a "pick your sources" control
// ---------------------------------------------------------------------------
export default function ThirdPartyReviews({
  appId,
  gameName,
}: {
  appId: number;
  gameName: string;
}) {
  const [enabled, setEnabled] = useState<string[]>(readEnabled);
  const [activeKey, setActiveKey] = useState<string>(() => readActive(readEnabled()));
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const [data, setData] = useState<ExternalReviewsResponse | null>(null);
  const [items, setItems] = useState<ExternalReviewItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visible = SOURCES.filter((source) => enabled.includes(source.key));
  const active = SOURCES.find((source) => source.key === activeKey) ?? visible[0];

  // Remember the user's choices
  useEffect(() => {
    try {
      localStorage.setItem(ENABLED_KEY, JSON.stringify(enabled));
      localStorage.setItem(ACTIVE_KEY, activeKey);
    } catch {
      /* storage can be unavailable (private mode); the choice just won't persist */
    }
  }, [enabled, activeKey]);

  // Close the picker when clicking elsewhere
  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setPickerOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  // Load the selected source (only the ones our backend can fetch)
  useEffect(() => {
    setData(null);
    setItems([]);
    setCursor(null);
    setError(null);

    if (!active || active.kind !== "api") return;

    let cancelled = false;
    setLoading(true);

    getExternalReviews(appId, active.key)
      .then((response) => {
        if (cancelled) return;
        setData(response);
        setItems(response.items);
        setCursor(response.next_cursor);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err?.response?.data?.error ?? `Couldn’t load ${active.label} right now.`
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [appId, active?.key]);

  function toggleSource(key: string) {
    const isOn = enabled.includes(key);
    if (isOn && enabled.length === 1) return; // keep at least one source

    const next = isOn
      ? enabled.filter((k) => k !== key)
      : ALL_KEYS.filter((k) => k === key || enabled.includes(k)); // keep original order

    setEnabled(next);
    if (isOn && key === activeKey) setActiveKey(next[0]);
  }

  async function loadMore() {
    if (!active || active.kind !== "api" || !cursor) return;
    setLoading(true);
    try {
      const response = await getExternalReviews(appId, active.key, cursor);
      setItems((list) => {
        const seen = new Set(list.map((item) => item.id));
        return [...list, ...response.items.filter((item) => !seen.has(item.id))];
      });
      setCursor(response.next_cursor);
    } catch {
      setError(`Couldn’t load more from ${active.label}.`);
    } finally {
      setLoading(false);
    }
  }

  if (!active) return null;

  const summary = data?.summary;
  const scoreLabel = active.kind === "api" ? active.scoreLabel : undefined;

  return (
    <div className="flex flex-col gap-5">
      {/* Source tabs + picker */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Review sources" className="flex flex-wrap gap-2">
          {visible.map((source) => {
            const selected = source.key === active.key;
            return (
              <button
                key={source.key}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveKey(source.key)}
                className={`h-8 cursor-pointer rounded-lg border px-3.5 text-xs transition-colors ${
                  selected
                    ? "border-[#7c5fc4] bg-[#4a3d73] text-[#e0deeb]"
                    : "border-[#55516c] bg-[#2a2838] text-[#b4aec7] hover:text-[#e0deeb]"
                }`}
              >
                {source.label}
              </button>
            );
          })}
        </div>

        <div ref={pickerRef} className="relative">
          <button
            type="button"
            onClick={() => setPickerOpen((value) => !value)}
            aria-expanded={pickerOpen}
            className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-lg border border-[#55516c] bg-[#2a2838] px-3.5 text-xs text-[#e0deeb] hover:bg-[#46445a]"
          >
            <SlidersHorizontal className="size-3.5" strokeWidth={1.7} aria-hidden="true" />
            Choose sources
          </button>

          {pickerOpen && (
            <div className="absolute right-0 top-10 z-30 w-[260px] rounded-xl border border-[#55516c] bg-[#2a2838] p-3 shadow-xl">
              <p className="mb-2 text-[11px] uppercase tracking-wide text-[#8b86a3]">
                Show reviews from
              </p>
              <ul className="flex flex-col gap-1">
                {SOURCES.map((source) => (
                  <li key={source.key}>
                    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-xs hover:bg-[#373646]">
                      <span className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={enabled.includes(source.key)}
                          onChange={() => toggleSource(source.key)}
                          className="size-4 accent-[#7c5fc4]"
                        />
                        {source.label}
                      </span>
                      <span className="text-[10px] text-[#8b86a3]">
                        {source.kind === "api" ? "In-page" : "Opens site"}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[10px] text-[#8b86a3]">
                Your choice is saved on this device.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Link-out sources */}
      {active.kind === "link" && (
        <div className="flex flex-col items-start gap-3 rounded-xl border border-[#55516c] bg-[#2f2d3e] p-5">
          <p className="text-sm text-[#b4aec7]">
            {active.label} doesn’t share its reviews with other apps, so you can read
            them on their site.
          </p>
          <Button
            asChild
            className="h-10 gap-2 rounded-lg border-0 bg-[#a8484c] px-5 text-[13px] font-semibold text-[#e0deeb] shadow-none hover:bg-[#ae494e]"
          >
            <a href={active.url(gameName)} target="_blank" rel="noreferrer">
              Search {gameName} on {active.label}
              <ExternalLink className="size-4" aria-hidden="true" />
            </a>
          </Button>
        </div>
      )}

      {/* API sources */}
      {active.kind === "api" && (
        <>
          {summary && (summary.score != null || summary.label || summary.count) && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#55516c] bg-[#2f2d3e] px-5 py-4">
              <div>
                <p className="text-[20px] font-semibold leading-7">
                  {summary.score != null ? `${summary.score.toFixed(1)} / 10` : "—"}
                  <span className="text-[#b4aec7]"> • {active.label}</span>
                </p>
                <p className="text-xs text-[#b4aec7]">
                  {[summary.label, summary.count ? `${summary.count.toLocaleString()} ratings` : null]
                    .filter(Boolean)
                    .join(" • ")}
                </p>
              </div>

              {summary.url && (
                <a
                  href={summary.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-[#c2ade7] hover:text-[#e0deeb]"
                >
                  View on {active.label}
                  <ExternalLink className="size-3.5" aria-hidden="true" />
                </a>
              )}
            </div>
          )}

          {items.map((item) => (
            <ExternalItem key={item.id} item={item} scoreLabel={scoreLabel} />
          ))}

          {loading && (
            <p role="status" className="text-sm text-[#b4aec7]">
              Loading {active.label}…
            </p>
          )}

          {error && (
            <p role="alert" className="text-sm text-[#e58d91]">
              {error}
            </p>
          )}

          {!loading && !error && data && data.kind === "summary" && !summary?.score && (
            <p className="text-sm text-[#b4aec7]">
              {active.label} has no score for this game.
            </p>
          )}

          {!loading && !error && data && data.kind === "reviews" && items.length === 0 && (
            <p className="text-sm text-[#b4aec7]">
              No {active.label} reviews found for this game.
            </p>
          )}

          {data?.kind === "summary" && (
            <p className="text-xs text-[#8b86a3]">
              {active.label} doesn’t provide individual reviews, only its score.
            </p>
          )}

          {!loading && cursor && (
            <Button
              type="button"
              onClick={loadMore}
              className="h-10 w-fit rounded-lg border border-[#55516c] bg-transparent px-5 text-sm font-semibold text-[#e0deeb] shadow-none hover:bg-[#46445a]"
            >
              Load more
            </Button>
          )}
        </>
      )}
    </div>
  );
}
