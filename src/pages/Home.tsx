import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Check, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type Game = {
  slug: string;
  title: string;
  image: string;
  genre: string;
  reason: string;
};

const HOLLOW_KNIGHT_RECOMMENDATIONS: Game[] = [
  {
    slug: "ori-and-the-blind-forest",
    title: "Ori and the Blind Forest",
    image: "/images/games/ori-and-the-blind-forest.png",
    genre: "Adventure / Platformer",
    reason: "Explore a connected world",
  },
  {
    slug: "blasphemous",
    title: "Blasphemous",
    image: "/images/games/blasphemous.png",
    genre: "Action / Metroidvania",
    reason: "More exploration and boss battles",
  },
  {
    slug: "ender-lilies",
    title: "Ender Lilies",
    image: "/images/games/ender-lilies.png",
    genre: "Action / RPG",
    reason: "A new world to uncover",
  },
  {
    slug: "axiom-verge",
    title: "Axiom Verge",
    image: "/images/games/axiom-verge.png",
    genre: "Adventure / Metroidvania",
    reason: "Discover paths and new abilities",
  },
];

const RPG_RECOMMENDATIONS: Game[] = [
  {
    slug: "sea-of-stars",
    title: "Sea of Stars",
    image: "/images/games/sea-of-stars.png",
    genre: "RPG",
    reason: "Based on your favorite genre",
  },
  {
    slug: "chained-echoes",
    title: "Chained Echoes",
    image: "/images/games/chained-echoes.png",
    genre: "RPG",
    reason: "Because you like story-driven RPGs",
  },
  {
    slug: "octopath-traveler-ii",
    title: "Octopath Traveler II",
    image: "/images/games/octopath-traveler-ii.png",
    genre: "RPG",
    reason: "Based on your RPG preferences",
  },
  {
    slug: "crosscode",
    title: "CrossCode",
    image: "/images/games/crosscode.png",
    genre: "Action / RPG",
    reason: "For your interest in action RPGs",
  },
];

function GameCard({
  game,
  saved,
  onAdd,
  onDismiss,
}: {
  game: Game;
  saved: boolean;
  onAdd: () => void;
  onDismiss: () => void;
}) {
  return (
    <Card className="relative flex h-[454px] min-w-0 flex-col gap-0 overflow-hidden rounded-xl border-0 bg-[#373646] py-0 text-[#e0deeb] shadow-none">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 rounded-xl border border-[#55516c]"
      />

      <Link
        to={`/games/${game.slug}`}
        aria-label={`View ${game.title}`}
        className="block h-[214px] shrink-0 overflow-hidden rounded-[10px]"
      >
        <img
          src={game.image}
          alt=""
          loading="lazy"
          className="block h-full w-full object-cover object-center"
        />
      </Link>

      <CardContent className="flex h-[240px] flex-col items-start gap-3 p-[18px]">
        <h3 className="h-[46px] w-full shrink-0 text-[18px] font-semibold leading-[22.5px]">
          <Link
            to={`/games/${game.slug}`}
            className="hover:text-[#c2ade7]"
          >
            {game.title}
          </Link>
        </h3>

        <p className="h-[15px] w-full shrink-0 text-xs leading-[15px] text-[#b4aec7]">
          {game.genre}
        </p>

        <p className="h-9 w-full shrink-0 text-xs leading-[18px] text-[#b4aec7]">
          {game.reason}
        </p>

        <Button
          type="button"
          onClick={onAdd}
          disabled={saved}
          className="h-11 w-[161px] shrink-0 justify-start gap-[9px] rounded-lg border-0 bg-[#9f4044] px-[18px] py-[13px] text-sm font-semibold leading-[17px] text-[#e0deeb] shadow-none hover:bg-[#ae494e] disabled:opacity-70 [&_svg]:size-[18px]"
        >
          {saved ? (
            <Check
              className="text-[#c2ade7]"
              strokeWidth={1.7}
              aria-hidden="true"
            />
          ) : (
            <Plus
              className="text-[#55516c]"
              strokeWidth={1.7}
              aria-hidden="true"
            />
          )}

          {saved ? "Added to List" : "Add to My List"}
        </Button>

        <button
          type="button"
          onClick={onDismiss}
          aria-label={`Not interested in ${game.title}`}
          className="h-[15px] shrink-0 cursor-pointer text-left text-xs leading-[15px] text-[#b4aec7] hover:text-[#e0deeb]"
        >
          Not Interested
        </button>
      </CardContent>
    </Card>
  );
}

function SectionHeading({
  id,
  title,
  description,
}: {
  id: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[29px] flex-wrap items-center justify-between gap-3">
      <h2
        id={id}
        className="text-[24px] font-semibold leading-[29px] tracking-[-0.5px]"
      >
        {title}
      </h2>

      <p className="text-[13px] leading-4 text-[#b4aec7]">
        {description}
      </p>
    </div>
  );
}

export default function Home() {
  const [saved, setSaved] = useState<Set<string>>(
    () => new Set()
  );

  const [dismissed, setDismissed] = useState<Set<string>>(
    () => new Set()
  );

  function addGame(slug: string) {
    setSaved((previous) => new Set(previous).add(slug));
  }

  function dismissGame(slug: string) {
    setDismissed((previous) => new Set(previous).add(slug));
  }

  function renderGames(games: Game[]) {
    return games
      .filter((game) => !dismissed.has(game.slug))
      .map((game) => (
        <GameCard
          key={game.slug}
          game={game}
          saved={saved.has(game.slug)}
          onAdd={() => addGame(game.slug)}
          onDismiss={() => dismissGame(game.slug)}
        />
      ));
  }

  return (
    <div className="min-h-screen bg-[#201e2f]">
      <div
        className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col bg-[#201e2f] text-[#e0deeb] antialiased"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <Navbar />

        <main className="flex flex-1 flex-col gap-8 px-5 pb-16 pt-11 md:px-8 xl:px-16">
          <div className="flex min-h-[65px] flex-wrap items-center justify-between gap-4">
            <div className="flex flex-col gap-2">
              <p className="text-[13px] leading-4 text-[#b4aec7]">
                WELCOME BACK, PLAYERONE
              </p>

              <h1 className="text-[36px] font-semibold leading-[41px] tracking-[-0.8px]">
                Home
              </h1>
            </div>

            <Link
              to="/interests"
              className="text-[13px] leading-4 text-[#c2ade7] hover:text-[#e0deeb]"
            >
              Tune your suggestions: edit genres and liked games →
            </Link>
          </div>

          <section
            aria-labelledby="hero-title"
            className="relative flex min-h-[390px] items-center overflow-hidden rounded-2xl bg-[#201e2f] px-6 py-12 md:px-11 xl:h-[390px] xl:py-0"
          >
            <img
              src="/images/home-hero.png"
              alt=""
              fetchPriority="high"
              className="absolute inset-x-0 top-0 h-[460px] w-full max-w-none object-cover object-center"
            />

            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-[460px]"
              style={{
                background:
                  "linear-gradient(90deg, rgba(32,30,47,0.9608) 0%, rgba(32,30,47,0.7216) 50%, rgba(32,30,47,0.1255) 100%)",
              }}
            />

            <div className="relative z-10 flex w-full max-w-[580px] flex-col gap-5">
              <p className="text-[11px] leading-[13px] tracking-[2px] text-[#c2ade7]">
                CURATED FOR YOUR NEXT CHAPTER
              </p>

              <h2
                id="hero-title"
                className="text-[36px] font-semibold leading-[1.15] tracking-[-0.8px] md:text-[50px]"
              >
                Your next adventure starts here.
              </h2>

              <p className="text-[15px] leading-[22.5px] text-[#b4aec7]">
                Suggestions inspired by games you play, like, and want to try.
              </p>
            </div>
          </section>

          <section
            aria-labelledby="hollow-knight-title"
            className="flex flex-col gap-8"
          >
            <SectionHeading
              id="hollow-knight-title"
              title="Because you played Hollow Knight"
              description="EXPLORATION • CHALLENGE • DISCOVERY"
            />

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {renderGames(HOLLOW_KNIGHT_RECOMMENDATIONS)}
            </div>
          </section>

          <section
            aria-labelledby="rpg-title"
            className="flex flex-col gap-8"
          >
            <SectionHeading
              id="rpg-title"
              title="More RPGs for you"
              description="Inspired by your favorite genre"
            />

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {renderGames(RPG_RECOMMENDATIONS)}
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
}