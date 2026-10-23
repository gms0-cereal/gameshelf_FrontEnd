import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Clock, Gamepad2, Star } from "lucide-react";
import { getSteamGames, type SteamGame } from "@/services/Gameservice";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type GameStatus = "playing" | "completed" | "on-hold" | "plan-to-play";

type Game = {
  slug: string;
  title: string;
  image: string;
  genre: string;
  status: GameStatus;
  platform: string;
  hoursPlayed: number | null;
  rating: number | null; // out of 10
  lastPlayed: string | null; // ISO date, e.g. "2026-10-16"
};

const STEAM_PAGE_SIZE = 12;

const STATUS_STYLES: Record<GameStatus, { label: string; className: string }> = {
  playing: { label: "Playing", className: "bg-[#e0e7ff] text-[#3730a3]" },
  completed: { label: "Completed", className: "bg-[#dcfce7] text-[#166534]" },
  "on-hold": { label: "On Hold", className: "bg-[#fef3c7] text-[#92400e]" },
  "plan-to-play": {
    label: "Plan to Play",
    className: "bg-[#ede9fe] text-[#5b21b6]",
  },
};

// Recommendations you haven't played yet share these defaults.
const UNPLAYED = {
  status: "plan-to-play" as GameStatus,
  platform: "PC",
  hoursPlayed: null,
  rating: null,
  lastPlayed: null,
};

const HOLLOW_KNIGHT_RECOMMENDATIONS: Game[] = [
  {
    slug: "387290",
    title: "Ori and the Blind Forest",
    image: "/images/games/ori-and-the-blind-forest.png",
    genre: "Adventure / Platformer",
    ...UNPLAYED,
  },
  {
    slug: "774361",
    title: "Blasphemous",
    image: "/images/games/blasphemous.png",
    genre: "Action / Metroidvania",
    ...UNPLAYED,
  },
  {
    slug: "1369630",
    title: "Ender Lilies",
    image: "/images/games/ender-lilies.png",
    genre: "Action / RPG",
    ...UNPLAYED,
  },
  {
    slug: "332200",
    title: "Axiom Verge",
    image: "/images/games/axiom-verge.png",
    genre: "Adventure / Metroidvania",
    ...UNPLAYED,
  },
];

const RPG_RECOMMENDATIONS: Game[] = [
  {
    slug: "1244090",
    title: "Sea of Stars",
    image: "/images/games/sea-of-stars.png",
    genre: "RPG",
    ...UNPLAYED,
  },
  {
    slug: "1229240",
    title: "Chained Echoes",
    image: "/images/games/chained-echoes.png",
    genre: "RPG",
    ...UNPLAYED,
  },
  {
    slug: "1971650",
    title: "Octopath Traveler II",
    image: "/images/games/octopath-traveler-ii.png",
    genre: "RPG",
    ...UNPLAYED,
  },
  {
    slug: "368340",
    title: "CrossCode",
    image: "/images/games/crosscode.png",
    genre: "Action / RPG",
    ...UNPLAYED,
  },
];

function formatLastPlayed(date: string | null) {
  if (!date) return "Never played";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Never played";
  return `Last played ${parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}

function GameCard({ game }: { game: Game }) {
  const status = STATUS_STYLES[game.status];

  const details = [
    { icon: Gamepad2, text: game.platform },
    {
      icon: Clock,
      text: game.hoursPlayed ? `${game.hoursPlayed} h played` : "Not played yet",
    },
    {
      icon: Star,
      text: game.rating ? `Your rating ${game.rating}/10` : "Not rated yet",
    },
  ];

  return (
    <Card className="group relative flex min-w-0 flex-col gap-0 overflow-hidden rounded-xl border border-[#55516c] bg-[#373646] py-0 text-[#e0deeb] shadow-none transition-colors hover:border-[#c2ade7] focus-within:border-[#c2ade7]">
      <div className="relative aspect-[3/2] w-full shrink-0 overflow-hidden bg-[#2a2838]">
        <img
          src={game.image}
          alt=""
          loading="lazy"
          className="block h-full w-full object-cover object-center"
        />

        <span
          className={`absolute right-2.5 top-2.5 rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.5px] ${status.className}`}
        >
          {status.label}
        </span>
      </div>

      <CardContent className="flex flex-1 flex-col p-3.5">
        <p className="text-xs leading-4 text-[#b4aec7]">{game.genre}</p>

        <h3 className="mt-1 truncate text-base font-medium leading-6">
          <Link
            to={`/gamedetails/${game.slug}`}
            className="outline-none after:absolute after:inset-0 after:z-10 after:content-[''] group-hover:text-[#c2ade7]"
          >
            {game.title}
          </Link>
        </h3>

        <ul className="mt-2.5 flex flex-col gap-1.5">
          {details.map(({ icon: Icon, text }) => (
            <li
              key={text}
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

        <div className="mt-auto flex flex-col gap-2.5 pt-4">
          <p className="min-w-0 truncate text-xs leading-4 text-[#b4aec7]">
            {formatLastPlayed(game.lastPlayed)}
          </p>

          <span
            aria-hidden="true"
            className="inline-flex h-9 w-full shrink-0 items-center justify-center rounded-lg bg-[#a8484c] px-4 text-[13px] font-medium text-[#e0deeb] transition-colors group-hover:bg-[#ae494e]"
          >
            View Game
          </span>
        </div>
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

      <p className="text-[13px] leading-4 text-[#b4aec7]">{description}</p>
    </div>
  );
}

export default function Home() {
  // Steam data: hooks must live inside the component
  const [steamGames, setSteamGames] = useState<SteamGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Steam paginates with a cursor (last_appid), not page numbers.
  // cursors[i] is the cursor used to fetch page i, so "Previous" just pops.
  const [cursors, setCursors] = useState<number[]>([0]);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const pageNumber = cursors.length;
  const currentCursor = cursors[cursors.length - 1];

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getSteamGames(STEAM_PAGE_SIZE, currentCursor)
      .then((data) => {
        if (cancelled) return;
        setSteamGames(data.games);
        setNextCursor(data.last_appid);
        setHasMore(Boolean(data.have_more_results && data.last_appid));
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load games. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentCursor]);

  function goToNextPage() {
    if (hasMore && nextCursor !== null) {
      setCursors((previous) => [...previous, nextCursor]);
    }
  }

  function goToPreviousPage() {
    setCursors((previous) =>
      previous.length > 1 ? previous.slice(0, -1) : previous
    );
  }

  function renderStaticGames(list: Game[]) {
    return list.map((game) => <GameCard key={game.slug} game={game} />);
  }

  // Games coming from the Steam API
  function renderSteamGames(list: SteamGame[]) {
    return list
      .filter((game) => game.name)
      .map((game) => (
        <GameCard
          key={game.appid}
          game={{
            slug: String(game.appid),
            title: game.name,
            image: `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${game.appid}/header.jpg`,
            genre: "Steam Game",
            ...UNPLAYED,
          }}
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
              {renderStaticGames(HOLLOW_KNIGHT_RECOMMENDATIONS)}
            </div>
          </section>

          <section aria-labelledby="rpg-title" className="flex flex-col gap-8">
            <SectionHeading
              id="rpg-title"
              title="More RPGs for you"
              description="Inspired by your favorite genre"
            />

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {renderStaticGames(RPG_RECOMMENDATIONS)}
            </div>
          </section>

          <section aria-labelledby="steam-title" className="flex flex-col gap-8">
            <SectionHeading
              id="steam-title"
              title="Discover on Steam"
              description="Pulled live from the Steam catalog"
            />

            {loading && (
              <p role="status" className="text-sm text-[#b4aec7]">
                Loading games…
              </p>
            )}

            {error && (
              <p role="alert" className="text-sm text-[#e58d91]">
                {error}
              </p>
            )}

            {!loading && !error && (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {renderSteamGames(steamGames)}
              </div>
            )}

            <nav
              aria-label="Steam games pagination"
              className="flex items-center justify-center gap-4"
            >
              <Button
                type="button"
                onClick={goToPreviousPage}
                disabled={pageNumber === 1 || loading}
                className="h-10 rounded-lg border-0 bg-[#373646] px-5 text-sm font-semibold text-[#e0deeb] shadow-none hover:bg-[#46445a] disabled:opacity-50"
              >
                Previous
              </Button>

              <span className="text-[13px] text-[#b4aec7]" aria-live="polite">
                Page {pageNumber}
              </span>

              <Button
                type="button"
                onClick={goToNextPage}
                disabled={!hasMore || loading}
                className="h-10 rounded-lg border-0 bg-[#9f4044] px-5 text-sm font-semibold text-[#e0deeb] shadow-none hover:bg-[#ae494e] disabled:opacity-50"
              >
                Next
              </Button>
            </nav>
          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
}