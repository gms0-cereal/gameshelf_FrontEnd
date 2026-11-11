import { Link } from "react-router-dom";
import { Calendar, Monitor, Star } from "lucide-react";

export interface GameSummary {
  id: number | string;
  title: string;
  slug: string;
  cover: string;
  genres?: string[];
  platforms?: string[];
  release_year?: number | null;
  score?: number | null;
  price?: string | null;
  statusLabel?: string;
  statusClassName?: string;
  bio?: string;
  description?: string;
  short_description?: string;
}

export default function GameCard({ game }: { game: GameSummary }) {
  const descText =
    game.bio ||
    game.description ||
    game.short_description ||
    "Explore live community catalogs and add this title to your shelf.";

  return (
    <Link
      to={`/gamedetails/${game.slug || game.id}`}
      className="group relative flex h-[420px] w-full flex-col overflow-hidden rounded-2xl border border-[#302438] bg-[#17191E] transition-all duration-200 hover:border-[#B39ACF] hover:bg-[#20232B] focus:outline-none focus:ring-2 focus:ring-[#B39ACF]"
    >
      {/* Clean Cover Image Container */}
      <div className="relative h-[160px] w-full shrink-0 overflow-hidden rounded-t-2xl bg-[#20232B]">
        <img
          src={game.cover}
          alt={game.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 group-hover:brightness-110"
        />
      </div>

      {/* Content Area */}
      <div className="flex flex-1 flex-col p-4">
        <p className="line-clamp-1 text-[11px] font-medium uppercase tracking-wider text-[#B39ACF]">
          {game.genres?.slice(0, 2).join(" / ") || "Steam Game"}
        </p>
        
        <h3 className="mt-1 line-clamp-1 text-base font-semibold leading-tight text-[#E6E1EA] transition-colors group-hover:text-[#B39ACF]" title={game.title}>
          {game.title}
        </h3>

        <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-[#A0A0A8]">
          {descText}
        </p>

        <div className="flex-1" />

        {/* Metadata Footer */}
        <div className="mt-3 flex flex-col gap-1.5 text-[12px] font-medium text-[#A0A0A8]">
          <div className="flex items-center gap-2">
            <Monitor className="size-3.5 text-[#38BDF8]" />
            <span className="line-clamp-1">{game.platforms?.join(" / ") || "PC"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="size-3.5 text-[#34D399]" />
            <span>{game.release_year ? `Released ${game.release_year}` : "Release date unknown"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="size-3.5 text-[#FBBF24]" />
            <span className={game.score ? "text-[#E6E1EA]" : ""}>
              {game.score ? `Score ${game.score.toFixed(1)}/10` : "No score yet"}
            </span>
          </div>
        </div>

        {/* Visual Link Button */}
        <div className="mt-4 flex w-full items-center justify-center rounded-xl bg-[#302C39] py-2.5 text-[13px] font-semibold text-[#B39ACF] transition-colors group-hover:bg-[#B39ACF] group-hover:text-[#17191E]">
          View Game
        </div>
      </div>
    </Link>
  );
}