
import { useState } from "react";
import { motion } from "framer-motion";
import { Play, Image as ImageIcon } from "lucide-react";

import type {
  SteamGameDetail,
  SteamMovie,
} from "@/services/Gameservice";

type SteamScreenshot = NonNullable<
  SteamGameDetail["screenshots"]
>[number];

interface VisualDocumentationProps {
  game: SteamGameDetail;
  heroImage: string | undefined;
  genres: string[];
  platforms: string;
  trailer?: SteamMovie;
  screenshots: SteamScreenshot[];
  storeUrl: string;
  onSelectScreenshot: (imageUrl: string) => void;
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
    "relative aspect-video w-[180px] shrink-0 overflow-hidden rounded-xl border border-[#302438] bg-[#17191E]";

  if (playing && source) {
    return (
      <video
        className={`${frame} object-cover`}
        src={source}
        poster={movie.thumbnail}
        controls
        autoPlay
      />
    );
  }

  const content = (
    <>
      <img
        src={movie.thumbnail}
        alt=""
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />

      <span className="absolute inset-0 flex items-center justify-center bg-black/40 transition-colors group-hover:bg-black/25">
        <span className="flex size-10 items-center justify-center rounded-full bg-[#B39ACF] text-[#17191E] shadow-lg transition-transform group-hover:scale-110">
          <Play
            className="ml-0.5 size-4"
            fill="currentColor"
            aria-hidden="true"
          />
        </span>
      </span>

      <span className="absolute bottom-2 left-2 rounded-md bg-black/70 px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-[#E6E1EA]">
        Trailer
      </span>
    </>
  );

  if (!source) {
    return (
      <a
        href={fallbackUrl}
        target="_blank"
        rel="noreferrer"
        aria-label={`Watch ${movie.name} on Steam`}
        className={`group ${frame}`}
      >
        {content}
      </a>
    );
  }

  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={`Play ${movie.name}`}
      className={`group cursor-pointer ${frame}`}
    >
      {content}
    </motion.button>
  );
}

export default function VisualDocumentation({
  game,
  heroImage,
  genres,
  platforms,
  trailer,
  screenshots,
  storeUrl,
  onSelectScreenshot,
}: VisualDocumentationProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      aria-labelledby="game-title"
      className="flex min-w-0 flex-col gap-3"
    >
      {/* SECTION HEADING */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B39ACF]">
          01 / Visual Documentation
        </h2>

        <span className="text-[10px] font-medium tracking-wider text-[#77727F]">
          GAME ARCHIVE
        </span>
      </div>

      {/* CINEMATIC KEY ART */}
      <div className="group relative isolate aspect-video min-h-[220px] overflow-hidden rounded-xl border border-[#302438] bg-[#17191E] sm:min-h-[280px]">
        {heroImage ? (
          <img
            src={heroImage}
            alt={`${game.name} key art`}
            fetchPriority="high"
            loading="eager"
            className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <ImageIcon className="size-12 text-[#554363]" />
          </div>
        )}

        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent"
        />

        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-black/65 via-transparent to-transparent"
        />

        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-5 sm:p-7">
          <h1
            id="game-title"
            className="max-w-[90%] text-3xl font-semibold leading-[1.08] tracking-[-0.8px] text-[#E6E1EA] drop-shadow-lg sm:text-4xl lg:text-[42px]"
          >
            {game.name}
          </h1>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-medium text-[#C2BACB] sm:text-xs">
            {genres.map((genre, index) => (
              <span key={`${genre}-${index}`} className="contents">
                {index > 0 && (
                  <span className="text-[#82778F]">·</span>
                )}
                <span>{genre}</span>
              </span>
            ))}

            {genres.length > 0 && platforms && (
              <span className="mx-1 text-[#82778F]">/</span>
            )}

            {platforms && (
              <span className="text-[#B39ACF]">{platforms}</span>
            )}
          </div>
        </div>
      </div>

      {/* SCREENSHOT STRIP */}
      {(screenshots.length > 0 || trailer) && (
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#A0A0A8]">
              Media Gallery
            </span>

            <span className="text-[10px] text-[#77727F]">
              {screenshots.length} SCREENSHOTS
            </span>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[#302438]">
            {trailer && (
              <TrailerTile
                movie={trailer}
                fallbackUrl={storeUrl}
              />
            )}

            {screenshots.map((shot, index) => (
              <motion.button
                key={shot.id}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 28,
                }}
                type="button"
                onClick={() => onSelectScreenshot(shot.path_full)}
                aria-label={`View screenshot ${index + 1} from ${game.name}`}
                className="group relative aspect-video w-[180px] shrink-0 cursor-pointer overflow-hidden rounded-xl border border-[#302438] bg-[#17191E] transition-colors hover:border-[#806B99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B39ACF]"
              >
                <img
                  src={shot.path_thumbnail}
                  alt={`${game.name} screenshot ${index + 1}`}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />

                <span className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/15" />
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </motion.section>
  );
}
