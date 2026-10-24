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
  caption?: string;
};

function GameCard({ game }: { game: GameSummary }) {
  const platformsText = game.platforms?.join(" / ") || "PC";
  const releaseText = game.release_year ? `Released ${game.release_year}` : "Release date unknown";
  const scoreText = game.score !== null && game.score !== undefined ? `Score ${game.score.toFixed(1)}/10` : "No score yet";

  const details = [
    { icon: Gamepad2, text: platformsText },
    { icon: Calendar, text: releaseText },
    { icon: Star, text: scoreText },
  ];

  return (
    <Card className="group relative flex min-w-0 flex-col gap-0 overflow-hidden rounded-xl border border-[#55516c] bg-[#373646] py-0 text-[#e0deeb] shadow-none transition-colors hover:border-[#c2ade7] focus-within:border-[#c2ade7]">
      <div className="relative aspect-[3/2] w-full shrink-0 overflow-hidden bg-[#2a2838]">
        {game.cover ? (
          <img
            src={game.cover}
            alt=""
            loading="lazy"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
            className="block h-full w-full object-cover object-center"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#3b3560] to-[#1d2b33]">
            <Gamepad2 className="size-8 text-[#8870b6]" />
          </div>
        )}

        {game.price && (
          <span className="absolute right-2.5 top-2.5 rounded-full bg-[#ede9fe] px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.5px] text-[#5b21b6]">
            {game.price}
          </span>
        )}
      </div>

      <CardContent className="flex flex-1 flex-col p-3.5">
        <p className="truncate text-xs leading-4 text-[#b4aec7]">
          {game.genres?.slice(0, 2).join(" / ") || "Steam Game"}
        </p>
        {(game.caption || game.bio) && (
          <p className="mt-1 truncate text-xs leading-4 text-[#b4aec7]">
            {game.caption || game.bio}
          </p>
        )}

        <h3 className="mt-1 truncate text-base font-medium leading-6">
          <Link
            to={`/gamedetails/${game.id}`}
            title={game.title}
            className="outline-none after:absolute after:inset-0 after:z-10 after:content-[''] group-hover:text-[#c2ade7]"
          >
            {game.title}
          </Link>
        </h3>

        <ul className="mt-2.5 flex flex-col gap-1.5">
          {details.map(({ icon: Icon, text }, i) => (
            <li
              key={i}
              className="flex items-center gap-2.5 text-[13px] leading-5 text-[#b4aec7]"
            >
              <Icon
                className="size-4 shrink-0 text-[#8b86a3]"
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
            className="inline-flex h-9 w-full items-center justify-center rounded-lg bg-[#a8484c] px-4 text-[13px] font-medium text-[#e0deeb] transition-colors group-hover:bg-[#ae494e]"
          >
            View Game
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// Export both named and default to prevent any import mismatches across files
export { GameCard };
export default GameCard;