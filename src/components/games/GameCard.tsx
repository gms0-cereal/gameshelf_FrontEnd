import { useState } from "react";
import { Link } from "react-router-dom";

export type GameSummary = {
  id: number;
  title: string;
  slug: string;
  cover: string | null;
  genres: string[];
  caption?: string;
};

const GameCard = ({ game }: { game: GameSummary }) => {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border border-[#46415c] bg-[#393549]">
      {game.cover && !imageFailed ? (
        <img
          src={game.cover}
          alt=""
          loading="lazy"
          onError={() => setImageFailed(true)}
          className="aspect-[16/10] w-full object-cover"
        />
      ) : (
        <div
          aria-hidden="true"
          className="aspect-[16/10] w-full bg-[linear-gradient(135deg,#2c2a45,#46415c)]"
        />
      )}

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-[15px] font-semibold text-[#ecebf7]">{game.title}</h3>
        <p className="mt-4 text-[11px] text-[#a9a6c2]">{game.genres.join(" / ")}</p>
        {game.caption && <p className="mt-1.5 text-[11px] text-[#a9a6c2]">{game.caption}</p>}

        <div className="mt-auto pt-5">
          <Link
            to={`/games/${game.slug}`}
            aria-label={`View ${game.title}`}
            className="inline-flex h-[34px] items-center justify-center rounded-md bg-[#a8454b] px-5 text-[13px] font-medium text-white transition-colors hover:bg-[#b9525a] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e6e3f5]"
          >
            View Game
          </Link>
        </div>
      </div>
    </article>
  );
};

export default GameCard;