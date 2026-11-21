import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { getRatingStats, type RatingStats } from "@/services/Reviewservice";

/** 5-star bar on a 0–5 scale (or 0–10 input converted via `scale` / `value / 2`). */
export function RatingBar({ value }: { value: number | null }) {
  // Convert incoming 0–10 average to 0–5 stars (e.g., 8.6 -> 4.3 stars)
  const stars = value !== null ? Math.max(0, Math.min(5, value / 2)) : 0;

  return (
    <div
      role="img"
      aria-label={value !== null ? `${stars.toFixed(1)} out of 5` : "No ratings yet"}
      className="flex gap-1"
    >
      {Array.from({ length: 5 }, (_, index) => {
        const fill = Math.min(Math.max(stars - index, 0), 1);
        return (
          <span
            key={index}
            className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#4a4760]"
          >
            <span
              className="block h-full rounded-full bg-[#c2ade7]"
              style={{ width: `${fill * 100}%` }}
            />
          </span>
        );
      })}
    </div>
  );
}

/**
 * Clickable 0.5–5 stars (in 0.5 increments).
 * Expects `value` on a 1–10 backend scale (e.g. 7 = 3.5 stars) and calls `onChange`
 * with the mapped 1–10 integer so existing backend payloads stay compatible.
 */
export function ScoreStars({
  value,
  onChange,
  disabled,
}: {
  value: number | null;
  onChange: (score: number) => void;
  disabled?: boolean;
}) {
  const [hoverStars, setHoverStars] = useState<number | null>(null);

  const currentStars = value != null ? value / 2 : 0;
  const shownStars = hoverStars ?? currentStars;

  function getHalfStepFromPointer(
    e: React.PointerEvent<HTMLButtonElement> | React.MouseEvent<HTMLButtonElement>,
    starIndex: number
  ) {
    const rect = e.currentTarget.getBoundingClientRect();
    const isLeftHalf = e.clientX - rect.left < rect.width / 2;
    return isLeftHalf ? starIndex - 0.5 : starIndex;
  }

  return (
    <div
      role="group"
      aria-label="Score from 0.5 to 5 stars"
      className="flex items-center gap-1"
      onMouseLeave={() => setHoverStars(null)}
    >
      {[1, 2, 3, 4, 5].map((starIndex) => {
        const fill = Math.min(Math.max(shownStars - (starIndex - 1), 0), 1);
        const starScore10 = starIndex * 2;

        return (
          <button
            key={starIndex}
            type="button"
            disabled={disabled}
            onMouseMove={(e) => {
              if (!disabled) setHoverStars(getHalfStepFromPointer(e, starIndex));
            }}
            onClick={(e) => {
              if (disabled) return;
              const pickedStars = getHalfStepFromPointer(e, starIndex);
              onChange(Math.round(pickedStars * 2));
            }}
            onFocus={() => setHoverStars(starIndex)}
            onBlur={() => setHoverStars(null)}
            aria-label={`Rate ${starIndex} stars (half-star supported)`}
            aria-pressed={
              value != null && (value === starScore10 || value === starScore10 - 1)
            }
            className="relative cursor-pointer rounded p-0.5 disabled:cursor-wait"
          >
            {/* Empty / base star */}
            <Star
              className="size-[24px] text-[#55516c] transition-colors"
              strokeWidth={1.5}
              aria-hidden="true"
            />

            {/* Partial / full gold fill */}
            {fill > 0 && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0.5 left-0.5 overflow-hidden"
                style={{ width: `${fill * 100}%` }}
              >
                <Star
                  className="size-[24px] fill-[#f1c76b] text-[#f1c76b]"
                  strokeWidth={1.5}
                />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Read-only GameShelf rating for the game page's score card. */
export function GameshelfRatingSummary({ appId }: { appId: number }) {
  const [stats, setStats] = useState<RatingStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    setStats(null);

    getRatingStats(appId)
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch(() => {
        /* leave the card in its empty state */
      });

    return () => {
      cancelled = true;
    };
  }, [appId]);

  const avgStars = stats?.average != null ? stats.average / 2 : null;
  const myStars = stats?.my_score != null ? stats.my_score / 2 : null;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[20px] font-semibold leading-7">
        {avgStars != null ? `${avgStars.toFixed(1)} / 5` : "No ratings yet"}{" "}
        <span className="text-[#b4aec7]">• GameShelf rating</span>
      </p>

      <RatingBar value={stats?.average ?? null} />

      <p className="text-xs text-[#b4aec7]">
        {stats?.count
          ? `${stats.count.toLocaleString()} ${stats.count === 1 ? "rating" : "ratings"} from GameShelf members`
          : "Be the first to rate this game"}
      </p>

      <p className="text-sm text-[#b4aec7]">
        Your score: {myStars != null ? `${myStars} / 5` : "Not rated"}
      </p>
    </div>
  );
}