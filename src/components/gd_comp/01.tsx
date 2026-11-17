import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Image as ImageIcon, Maximize2 } from "lucide-react";

import type { SteamGameDetail, SteamMovie } from "@/services/Gameservice";

type SteamScreenshot = NonNullable<SteamGameDetail["screenshots"]>[number];

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

type MediaSlide =
  | { type: "trailer"; id: string; movie: SteamMovie; thumbnail: string }
  | { type: "screenshot"; id: string; fullUrl: string; thumbnail: string }
  | { type: "hero"; id: string; fullUrl: string; thumbnail: string };

function movieSource(movie: SteamMovie) {
  return (
    movie.mp4?.max ??
    movie.mp4?.["480"] ??
    movie.webm?.max ??
    movie.webm?.["480"] ??
    null
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
  // Build unified playlist: Trailer first (if available), then screenshots, fallback to heroImage
  const slides: MediaSlide[] = useMemo(() => {
    const list: MediaSlide[] = [];

    if (trailer) {
      list.push({
        type: "trailer",
        id: `trailer-${trailer.id ?? "main"}`,
        movie: trailer,
        thumbnail: trailer.thumbnail,
      });
    }

    screenshots.forEach((shot) => {
      list.push({
        type: "screenshot",
        id: `shot-${shot.id}`,
        fullUrl: shot.path_full,
        thumbnail: shot.path_thumbnail,
      });
    });

    if (list.length === 0 && heroImage) {
      list.push({
        type: "hero",
        id: "hero-fallback",
        fullUrl: heroImage,
        thumbnail: heroImage,
      });
    }

    return list;
  }, [trailer, screenshots, heroImage]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isPlayingTrailer, setIsPlayingTrailer] = useState(false);
  const ROTATION_SECONDS = 7;
  // Reset index if game changes
  useEffect(() => {
    setActiveIndex(0);
    setIsPlayingTrailer(false);
  }, [game.id]);

  // 3-second auto-rotation (pauses on hover or when video is playing)
    useEffect(() => {
        if (slides.length <= 1 || isHovered || isPlayingTrailer) return;

        const timer = setInterval(() => {
          setActiveIndex((prev) => (prev + 1) % slides.length);
        }, ROTATION_SECONDS * 1000);

        return () => clearInterval(timer);
      }, [slides.length, isHovered, isPlayingTrailer]);

  const currentSlide = slides[activeIndex] ?? slides[0];
  const trailerVideoSrc =
    currentSlide?.type === "trailer" ? movieSource(currentSlide.movie) : null;

  const handleSelectSlide = (index: number, autoPlay = false) => {
    setActiveIndex(index);
    setIsPlayingTrailer(autoPlay);
  };

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

      {/* CINEMATIC KEY ART / ROTATING STAGE */}
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group relative isolate aspect-video min-h-[220px] overflow-hidden rounded-xl border border-[#302438] bg-[#17191E] sm:min-h-[280px]"
      >
        <AnimatePresence mode="wait">
          {!currentSlide ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <ImageIcon className="size-12 text-[#554363]" />
            </motion.div>
          ) : currentSlide.type === "trailer" &&
            isPlayingTrailer &&
            trailerVideoSrc ? (
            <motion.div
              key={`${currentSlide.id}-video`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="absolute inset-0 z-20 bg-black"
            >
              <video
                className="h-full w-full object-contain"
                src={trailerVideoSrc}
                poster={currentSlide.thumbnail}
                controls
                autoPlay
                onEnded={() => setIsPlayingTrailer(false)}
              />
            </motion.div>
          ) : (
            <motion.div
              key={currentSlide.id}
              initial={{ opacity: 0, scale: 1.03 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
            >
              <img
                src={
                  currentSlide.type === "trailer"
                    ? currentSlide.thumbnail
                    : currentSlide.fullUrl
                }
                alt={`${game.name} media preview`}
                fetchPriority="high"
                className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.02]"
              />

              {/* Centered Play Overlay when Trailer slide is active */}
              {currentSlide.type === "trailer" && (
                <div className="absolute inset-0 z-10 flex items-center justify-center">
                  {trailerVideoSrc ? (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={() => setIsPlayingTrailer(true)}
                      aria-label={`Play ${currentSlide.movie.name}`}
                      className="flex size-14 cursor-pointer items-center justify-center rounded-full bg-[#B39ACF] text-[#17191E] shadow-2xl ring-4 ring-black/40"
                    >
                      <Play
                        className="ml-0.5 size-6"
                        fill="currentColor"
                        aria-hidden="true"
                      />
                    </motion.button>
                  ) : (
                    <a
                      href={storeUrl}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Watch ${currentSlide.movie.name} on Steam`}
                      className="flex size-14 items-center justify-center rounded-full bg-[#B39ACF] text-[#17191E] shadow-2xl ring-4 ring-black/40 transition-transform hover:scale-110"
                    >
                      <Play
                        className="ml-0.5 size-6"
                        fill="currentColor"
                        aria-hidden="true"
                      />
                    </a>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hide text overlays while video player controls are active */}
        {!isPlayingTrailer && (
          <>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/65 via-transparent to-transparent"
            />

            {/* Top-right lightbox expand button for screenshots */}
            {currentSlide?.type === "screenshot" && (
              <button
                type="button"
                onClick={() => onSelectScreenshot(currentSlide.fullUrl)}
                aria-label="Expand screenshot"
                className="absolute top-4 right-4 z-10 flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/10 bg-black/60 px-2.5 py-1.5 text-[11px] font-medium text-[#E6E1EA] opacity-0 backdrop-blur-sm transition-opacity hover:border-[#B39ACF] group-hover:opacity-100"
              >
                <Maximize2 className="size-3.5 text-[#B39ACF]" />
                <span>Full Size</span>
              </button>
            )}

            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-2 p-5 sm:p-7">
              <h1
                id="game-title"
                className="max-w-[90%] text-3xl font-semibold leading-[1.08] tracking-[-0.8px] text-[#E6E1EA] drop-shadow-lg sm:text-4xl lg:text-[42px]"
              >
                {game.name}
              </h1>

              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-medium text-[#C2BACB] sm:text-xs">
                {genres.map((genre, index) => (
                  <span key={`${genre}-${index}`} className="contents">
                    {index > 0 && <span className="text-[#82778F]">·</span>}
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
          </>
        )}
      </div>

      {/* MEDIA GALLERY STRIP */}
      {slides.length > 0 && (
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
            {slides.map((slide, index) => {
              const isActive = index === activeIndex;

              return (
                <motion.button
                  key={slide.id}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 28,
                  }}
                  type="button"
                  onClick={() =>
                    handleSelectSlide(index, slide.type === "trailer")
                  }
                  onDoubleClick={() => {
                    if (slide.type === "screenshot") {
                      onSelectScreenshot(slide.fullUrl);
                    }
                  }}
                  aria-label={
                    slide.type === "trailer"
                      ? `Play ${slide.movie.name}`
                      : `Preview media ${index + 1}`
                  }
                  className={`group relative aspect-video w-[180px] shrink-0 cursor-pointer overflow-hidden rounded-xl border bg-[#17191E] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B39ACF] ${
                    isActive
                      ? "border-[#B39ACF] ring-1 ring-[#B39ACF]/50"
                      : "border-[#302438] hover:border-[#806B99]"
                  }`}
                >
                  <img
                    src={slide.thumbnail}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />

                  {slide.type === "trailer" ? (
                    <>
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
                  ) : (
                    <span className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/15" />
                  )}

                  {/* Animated 3s timer bar on the active thumbnail */}
            {isActive && !isHovered && !isPlayingTrailer && slides.length > 1 && (
                <motion.span
                  key={`progress-${activeIndex}`}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: ROTATION_SECONDS, ease: "linear" }}
                  style={{ transformOrigin: "left" }}
                  className="absolute inset-x-0 bottom-0 h-1 bg-[#B39ACF]"
                />
              )}
                </motion.button>
              );
            })}
          </div>
        </div>
      )}
    </motion.section>
  );
}