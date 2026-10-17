import { useNavigate } from "react-router-dom";
import { Info, Sparkles } from "lucide-react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import GameGrid from "../components/games/GameGrid";
import type { GameSummary } from "../components/games/GameCard";

// Put your artwork in /public/images/ (the hero falls back to a flat colour without it).
const HERO_IMAGE = "/images/home-hero.jpg";

// Sample content for the new-user state. Replace with an API call (popular games) later.
const SAMPLE_GAMES: GameSummary[] = [
  {
    id: 1,
    title: "Hollow Knight",
    slug: "hollow-knight",
    cover: "/images/games/hollow-knight.jpg",
    genres: ["Adventure", "Metroidvania"],
    caption: "Popular pick • Sample content",
  },
  {
    id: 2,
    title: "Stardew Valley",
    slug: "stardew-valley",
    cover: "/images/games/stardew-valley.jpg",
    genres: ["Simulation", "RPG"],
    caption: "Popular pick • Sample content",
  },
  {
    id: 3,
    title: "Hades",
    slug: "hades",
    cover: "/images/games/hades.jpg",
    genres: ["Action", "Roguelike"],
    caption: "Popular pick • Sample content",
  },
  {
    id: 4,
    title: "Celeste",
    slug: "celeste",
    cover: "/images/games/celeste.jpg",
    genres: ["Platformer"],
    caption: "Popular pick • Sample content",
  },
];

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-[#282539] font-sans text-[#e6e3f5]">
      <Navbar />

      <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-6 sm:px-6 lg:px-[52px] lg:py-8">
        <h1 className="text-[28px] font-semibold text-[#e6e3f5]">Home</h1>

        {/* Hero */}
        <section
          aria-labelledby="home-hero-title"
          className="relative mt-5 overflow-hidden rounded-lg bg-[#1d2b33] bg-cover bg-center"
          style={{ backgroundImage: `url(${HERO_IMAGE})` }}
        >
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(24,22,38,0.9),rgba(24,22,38,0.6)_45%,transparent_80%)]" />
          <div className="relative max-w-xl px-6 py-10 sm:px-8 sm:py-14">
            <p className="text-[10px] uppercase tracking-wider text-[#c9c6e0]">
              Curated for your next chapter
            </p>
            <h2
              id="home-hero-title"
              className="mt-4 text-[34px] font-semibold leading-tight text-[#ecebf7] sm:text-[40px]"
            >
              Find your first favorite
            </h2>
            <p className="mt-4 text-[13px] text-[#c9c6e0]">
              Choose genres or like a few games to personalize your homepage.
            </p>
            <p className="mt-3 text-[13px] text-[#c9c6e0]">
              No play history yet? Start with popular games below.
            </p>
            <button
              type="button"
              onClick={() => navigate("/interests")}
              className="mt-6 inline-flex h-[34px] items-center justify-center gap-2 rounded-md bg-[#a8454b] px-5 text-[13px] font-medium text-white transition-colors hover:bg-[#b9525a] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e6e3f5]"
            >
              <Sparkles className="h-3.5 w-3.5 text-white/60" aria-hidden="true" />
              Choose Your Interests
            </button>
          </div>
        </section>

        {/* How taste is counted */}
        <p
          role="note"
          className="mt-6 flex items-center gap-3 rounded-lg border border-[#46415c] bg-[#393549] px-4 py-3.5 text-xs text-[#c9c6e0]"
        >
          <Info className="h-4 w-4 shrink-0 text-[#9a97b5]" aria-hidden="true" />
          Playing and Completed count as played. Plan to Play signals interest.
        </p>

        {/* Popular games */}
        <section aria-labelledby="popular-title" className="mt-8">
          <div className="mb-4 flex items-baseline justify-between gap-4">
            <h2 id="popular-title" className="text-xl font-semibold text-[#ecebf7]">
              Popular games to get you started
            </h2>
            <span className="hidden text-xs text-[#a9a6c2] sm:block">Your discovery starts here</span>
          </div>
          <GameGrid games={SAMPLE_GAMES} />
        </section>

        <p className="mt-6 text-xs text-[#a9a6c2]">
          Your future suggestions will reflect your likes and ratings.
        </p>
      </main>

      <Footer />
    </div>
  );
};

export default Home;