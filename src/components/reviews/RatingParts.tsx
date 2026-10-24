import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { getRatingStats, type RatingStats } from "@/services/Reviewservice";

/** 10-segment bar, e.g. 8.6 fills 8 segments and 60% of the 9th. */
export function RatingBar({ value }: { value: number | null }) {
  const score = value ?? 0;

  return (
    <div
      role="img"
      aria-label={value !== null ? `${value.toFixed(1)} out of 10` : "No ratings yet"}
      className="flex gap-1"
    >
      {Array.from({ length: 10 }, (_, index) => {
        const fill = Math.min(Math.max(score - index, 0), 1);
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

/** Clickable 1-10 stars. `onChange` is called with the chosen score. */
export function ScoreStars({
  value,
  onChange,
  disabled,
}: {
  value: number | null;
  onChange: (score: number) => void;
  disabled?: boolean;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? value ?? 0;

  return (
    <div
      role="group"
      aria-label="Score from 1 to 10"
      className="flex items-center gap-0.5"
      onMouseLeave={() => setHover(null)}
    >
      {Array.from({ length: 10 }, (_, index) => index + 1).map((score) => (
        <button
          key={score}
          type="button"
          disabled={disabled}
          onClick={() => onChange(score)}
          onMouseEnter={() => setHover(score)}
          onFocus={() => setHover(score)}
          onBlur={() => setHover(null)}
          aria-label={`Score ${score} out of 10`}
          aria-pressed={value === score}
          className="cursor-pointer rounded p-0.5 disabled:cursor-wait"
        >
          <Star
            className={`size-[22px] transition-colors ${
              score <= shown ? "fill-[#f1c76b] text-[#f1c76b]" : "text-[#55516c]"
            }`}
            strokeWidth={1.5}
            aria-hidden="true"
          />
        </button>
      ))}
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

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[20px] font-semibold leading-7">
        {stats?.average != null ? `${stats.average.toFixed(1)} / 10` : "No ratings yet"}{" "}
        <span className="text-[#b4aec7]">• GameShelf rating</span>
      </p>

      <RatingBar value={stats?.average ?? null} />

      <p className="text-xs text-[#b4aec7]">
        {stats?.count
          ? `${stats.count.toLocaleString()} ${stats.count === 1 ? "rating" : "ratings"} from GameShelf members`
          : "Be the first to rate this game"}
      </p>

      <p className="text-sm text-[#b4aec7]">
        Your score: {stats?.my_score ? `${stats.my_score} / 10` : "Not rated"}
      </p>
    </div>
  );
}
