import { useState } from "react";
import { Link } from "react-router-dom";
import { Gamepad2, Star } from "lucide-react";

export type GameSummary = {
  id: number | string;
  title: string;
  slug: string;
  cover: string | null;
  genres: string[];
  statusLabel?: string;
  statusClassName?: string;
  ratingText?: string;
  communityRatingText?: string;
  lastPlayedText?: string;
  bio?: string | null;
  platform?: string;
};

export default function GameCard({ game }: { game: GameSummary }) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-[#55516c] bg-[#373646] text-[#e0deeb] shadow-none transition-colors hover:border-[#c2ade7] focus-within:border-[#c2ade7]">
      <div className="relative aspect-[3/2] w-full shrink-0 overflow-hidden bg-[#2a2838]">
        {game.cover && !imageFailed ? (
          <img
            src={game.cover}
            alt={game.title}
            loading="lazy"
            onError={() => setImageFailed(true)}
            className="block h-full w-full object-cover object-center"
          />
        ) : (
          <div className="h-full w-full bg-[linear-gradient(135deg,#2a2838,#55516c)]" />
        )}

        {game.statusLabel && (
          <span
            className={`absolute right-2.5 top-2.5 rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.5px] ${
              game.statusClassName || "bg-[#2a2838] text-[#b4aec7] border border-[#55516c]"
            }`}
          >
            {game.statusLabel}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3.5">
        <p className="text-xs leading-4 text-[#b4aec7]">{game.genres.join(" / ") || "Steam Game"}</p>

        <h3 className="mt-1 truncate text-base font-medium leading-6">
          <Link
            to={`/gamedetails/${game.slug}`}
            className="outline-none after:absolute after:inset-0 after:z-10 after:content-[''] group-hover:text-[#c2ade7]"
          >
            {game.title}
          </Link>
        </h3>

        <p className="mt-1.5 line-clamp-2 text-justify text-xs leading-relaxed text-[#b4aec7]">
          {game.bio || "No description available."}
        </p>

        <div className="mt-3 flex flex-col gap-1.5 border-t border-[#55516c]/40 pt-2.5 text-[13px]">
          <div className="flex items-center gap-2 text-[#d0ccdc]">
            <Gamepad2 className="size-4 shrink-0 text-[#8b86a3]" strokeWidth={1.7} />
            <span className="truncate">{game.platform || "PC"}</span>
          </div>

          <div className="flex items-center gap-2 text-[#e0deeb]">
            <Star className="size-4 shrink-0 text-amber-400 fill-amber-400" />
            <span className="truncate">
              Your rating: <strong className="text-white">{game.ratingText || "Not rated yet"}</strong>
            </span>
          </div>

          <div className="text-[11px] text-[#b4aec7] pl-6">
            {game.communityRatingText || "★ N/A (0 user ratings)"}
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-2.5 pt-4">
          <p className="min-w-0 truncate text-xs leading-4 text-[#b4aec7]">
            {game.lastPlayedText || "Never played"}
          </p>

          <span
            aria-hidden="true"
            className="inline-flex h-9 w-full shrink-0 items-center justify-center rounded-lg bg-[#a8484c] px-4 text-[13px] font-medium text-[#e0deeb] transition-colors group-hover:bg-[#ae494e]"
          >
            View Game
          </span>
        </div>
      </div>
    </article>
  );
}