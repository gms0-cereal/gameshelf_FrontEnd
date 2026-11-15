
import { useState } from "react";
import { motion } from "framer-motion";
import { Play } from "lucide-react";

import type {
  SteamGameDetail,
  SteamMovie,
} from "@/services/Gameservice";

type SteamScreenshot = NonNullable<
  SteamGameDetail["screenshots"]
>[number];

interface GameMediaProps {
  trailer?: SteamMovie;
  screenshots: SteamScreenshot[];
  storeUrl: string;
  onSelectScreenshot: (imageUrl: string) => void;
}

function SectionHeading({
  title,
  note,
}: {
  title: string;
  note?: string;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <h2 className="text-[24px] font-semibold leading-[29px] tracking-[-0.5px] text-[#E6E1EA]">
        {title}
      </h2>

      {note && (
        <p className="text-[13px] leading-4 text-[#A0A0A8]">
          {note}
        </p>
      )}
    </div>
  );
}

function movieSource(movie: SteamMovie) {
  return (
    movie.mp4?.max ??
    movie.mp4?.["480"] ??
    movie.webm?.max ??
    movie.webm?.["480"] ??
    null
  );
}

function TrailerTile({
  movie,
  fallbackUrl,
}: {
  movie: SteamMovie;
  fallbackUrl: string;
}) {
  const [playing, setPlaying] = useState(false);
  const source = movieSource(movie);

  const frame =
    "relative block aspect-video w-full overflow-hidden rounded-2xl border border-[#302438] bg-black";

  if (playing && source) {
    return (
      <video
        className={frame}
        src={source}
        poster={movie.thumbnail}
        controls
        autoPlay
      />
    );
  }

  const overlay = (
    <>
      <img
        src={movie.thumbnail}
        alt=""
        loading="lazy"
        className="h-full w-full object-cover contrast-110 saturate-125 transition-transform duration-300 group-hover:scale-105"
      />

      <span className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors group-hover:bg-black/20">
        <span className="flex size-14 items-center justify-center rounded-full bg-[#B39ACF] text-[#17191E] shadow-lg transition-transform duration-200 group-hover:scale-110">
          <Play
            className="size-6"
            fill="currentColor"
            aria-hidden="true"
          />
        </span>
      </span>

      <span className="absolute bottom-3 left-3 rounded-full bg-black/60 px-3 py-1 text-xs text-[#E6E1EA]">
        Watch trailer
      </span>
    </>
  );

  if (!source) {
    return (
      <a
        href={fallbackUrl}
        target="_blank"
        rel="noreferrer"
        className={`group ${frame}`}
      >
        {overlay}
      </a>
    );
  }

  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={`Play ${movie.name}`}
      className={`group ${frame} cursor-pointer`}
    >
      {overlay}
    </motion.button>
  );
}

export default function GameMedia({
  trailer,
  screenshots,
  storeUrl,
  onSelectScreenshot,
}: GameMediaProps) {
  return (
    <>
      {/* TRAILER */}

      {trailer && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.4,
            delay: 0.12,
            ease: "easeOut",
          }}
          className="flex flex-col gap-5"
        >
          <SectionHeading
            title="Trailer"
            note="From the Steam store page"
          />

          <div className="max-w-[760px]">
            <TrailerTile
              movie={trailer}
              fallbackUrl={storeUrl}
            />
          </div>
        </motion.section>
      )}

      {/* SCREENSHOTS */}

      {screenshots.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.4,
            delay: 0.16,
            ease: "easeOut",
          }}
          className="flex flex-col gap-5"
        >
          <SectionHeading
            title="Pictures from the game"
            note="Click any screenshot to view in full size"
          />

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {screenshots.map((shot) => (
              <motion.button
                key={shot.id}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.985 }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 28,
                }}
                type="button"
                onClick={() =>
                  onSelectScreenshot(shot.path_full)
                }
                aria-label="Enlarge screenshot"
                className="group relative cursor-pointer overflow-hidden rounded-2xl border border-[#302438] bg-black transition-colors hover:border-[#554363]"
              >
                <img
                  src={shot.path_thumbnail}
                  alt="Game screenshot"
                  loading="lazy"
                  className="aspect-video w-full object-cover contrast-110 saturate-125 transition-transform duration-300 group-hover:scale-105"
                />
              </motion.button>
            ))}
          </div>
        </motion.section>
      )}
    </>
  );
}
