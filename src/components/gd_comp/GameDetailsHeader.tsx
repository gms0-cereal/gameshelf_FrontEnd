
import { motion } from "framer-motion";
import type { SteamGameDetail } from "@/services/Gameservice";

interface GameDetailsHeaderProps {
  game: SteamGameDetail;
  heroImage: string | undefined;
  genres: string[];
  platforms: string;
}

export default function GameDetailsHeader({
  game,
  heroImage,
  genres,
  platforms,
}: GameDetailsHeaderProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      aria-labelledby="game-title"
      className="relative z-20 flex min-h-[320px] items-center rounded-2xl px-6 py-10 md:px-11"
    >
      <div className="absolute inset-0 overflow-hidden rounded-2xl bg-[#17191E]">
        {heroImage && (
          <img
            src={heroImage}
            alt={game.name}
            fetchPriority="high"
            loading="eager"
            className="h-full w-full object-cover object-center contrast-110 saturate-125 brightness-105"
          />
        )}

        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(0,0,0,0.94) 0%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,0.15) 100%)",
          }}
        />
      </div>

      <div className="relative flex w-full max-w-[600px] flex-col gap-3">
        <h1
          id="game-title"
          className="text-[36px] font-semibold leading-[1.1] tracking-[-0.8px] text-[#E6E1EA] md:text-[48px]"
        >
          {game.name}
        </h1>

        <p className="text-[13px] text-[#A0A0A8]">
          {genres.join(" • ")}

          {genres.length > 0 && platforms && " | "}

          {platforms}
        </p>
      </div>
    </motion.section>
  );
}
