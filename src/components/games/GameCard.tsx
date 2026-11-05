import { Link } from "react-router-dom";
import { Calendar, Gamepad2, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export type GameSummary = {
  id: number;
  title: string;
  slug: string;
  cover?: string | null;
  genres?: string[];
  platforms?: string[];
  release_year?: number | null;
  score?: number | null;
  price?: string | null;
  statusLabel?: string;
  statusClassName?: string;
  communityRatingText?: string;
  lastPlayedText?: string;
  bio?: string;
  description?: string;
  short_description?: string;
};

export function GameCard({ game }: { game: GameSummary }) {
  const details = [
    {
      icon: Gamepad2,
      text: game.platforms?.join(" / ") || "Platform unknown",
      color: "text-[#38BDF8]",
    },
    {
      icon: Calendar,
      text: game.release_year
        ? `Released ${game.release_year}`
        : "Release date unknown",
      color: "text-[#34D399]",
    },
    {
      icon: Star,
      text:
        game.score !== null && game.score !== undefined
          ? `Score ${game.score.toFixed(1)}/10`
          : "No score yet",
      color: "text-[#FBBF24]",
    },
  ];

  const descText =
    game.bio ||
    game.description ||
    game.short_description ||
    "Explore this game title and dive into immersive gameplay.";

  return (
    <Card className="group relative flex min-w-0 flex-col gap-0 rounded-2xl border border-[#302438] bg-[#17191E] py-0 text-[#E6E1EA] shadow-none transition-colors duration-200 hover:border-[#554363] focus-within:border-[#B39ACF]">
     <div className="relative aspect-[3/2] w-full shrink-0 overflow-hidden rounded-t-[15px] bg-[#000000]">
        {game.cover ? (
          <img
            src={game.cover}
            alt={game.title}
            loading="lazy"
            className="block h-full w-full object-cover object-center contrast-110 saturate-125 transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[#17191E]">
            <Gamepad2 className="size-8 text-[#B39ACF]" />
          </div>
        )}

        {game.price && (
          <span className="absolute right-2.5 top-2.5 rounded-full border border-[#34D399]/30 bg-[#10251F]/95 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.5px] text-[#34D399]">
            {game.price}
          </span>
        )}
      </div>

      <CardContent className="flex flex-1 flex-col p-4">
        <p className="truncate text-xs leading-4 text-[#B39ACF]">
          {game.genres?.slice(0, 2).join(" / ") || "—"}
        </p>

        <h3 className="mt-1 truncate text-base font-medium leading-6">
          <Link
            to={`/gamedetails/${game.id}`}
            title={game.title}
            className="outline-none after:absolute after:inset-0 after:z-10 after:content-[''] group-hover:text-[#B39ACF] focus-visible:text-[#C2ADE0]"
          >
            {game.title}
          </Link>
        </h3>

        <p className="mt-1.5 line-clamp-2 text-[13px] leading-5 text-[#A0A0A8]">
          {descText}
        </p>

        <ul className="mt-3 flex flex-col gap-1.5">
          {details.map(({ icon: Icon, text, color }, i) => (
            <li
              key={i}
              className="flex items-center gap-2.5 text-[13px] leading-5 text-[#A0A0A8]"
            >
              <Icon
                className={`size-4 shrink-0 ${color}`}
                strokeWidth={1.7}
                aria-hidden="true"
              />
              <span className="min-w-0 truncate">{text}</span>
            </li>
          ))}
        </ul>

        <div className="mt-auto pt-4">
          <span
            aria-hidden="true"
            className="inline-flex h-9 w-full items-center justify-center rounded-xl bg-[#B39ACF]/15 px-4 text-[13px] font-semibold text-[#C2ADE0] transition-colors duration-200 group-hover:bg-[#B39ACF]/25 group-hover:text-[#E6E1EA]"
          >
            View Game
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export default GameCard;