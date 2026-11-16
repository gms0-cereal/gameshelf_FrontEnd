
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import type { SteamGameDetail } from "@/services/Gameservice";

interface ExpansionsProps {
  dlc: SteamGameDetail[];
}

function Jellyfish({
  className,
  delay = 0,
  duration = 4,
}: {
  className: string;
  delay?: number;
  duration?: number;
}) {
  return (
    <motion.div
      className={`pointer-events-none absolute ${className}`}
      animate={{
        y: [0, -13, 0],
        rotate: [-3, 3, -3],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <svg
        viewBox="0 0 100 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full"
      >
        <defs>
          <linearGradient id="jelly-body" x1="50" y1="15" x2="50" y2="85">
            <stop stopColor="#D9C4FF" stopOpacity=".85" />
            <stop offset="1" stopColor="#8D70C4" stopOpacity=".2" />
          </linearGradient>
          <radialGradient id="jelly-glow">
            <stop stopColor="#B99AFF" stopOpacity=".3" />
            <stop offset="1" stopColor="#B99AFF" stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx="50" cy="47" r="45" fill="url(#jelly-glow)" />

        <path
          d="M15 57C15 32 30 17 50 17C70 17 85 32 85 57C85 65 79 70 72 70H28C21 70 15 65 15 57Z"
          fill="url(#jelly-body)"
          stroke="#D9C4FF"
          strokeOpacity=".8"
          strokeWidth="1.5"
        />

        <path
          d="M25 70C22 82 30 85 25 101M40 70C35 83 45 91 39 108M60 70C65 82 55 94 63 108M75 70C80 83 70 91 77 101"
          stroke="#B99AFF"
          strokeOpacity=".7"
          strokeWidth="2"
          strokeLinecap="round"
        />

        <path
          d="M35 46C39 41 44 40 48 42M55 42C60 40 65 42 68 46"
          stroke="#F0E8FF"
          strokeOpacity=".7"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </motion.div>
  );
}

function EmptyExpansions() {
  return (
    <div className="relative flex min-h-[280px] flex-col items-center justify-center overflow-hidden rounded-lg border border-[#302438] bg-[#0D0D14] px-5 py-10 text-center">
      {/* Underwater atmosphere */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_100%,rgba(103,75,157,0.18),transparent_65%)]" />

      <div className="pointer-events-none absolute bottom-0 left-0 h-24 w-full bg-gradient-to-t from-[#171322]/70 to-transparent" />

      {/* Floating jellyfish */}
      <Jellyfish
        className="left-[12%] top-[18%] h-16 w-16 opacity-40"
        delay={0.5}
        duration={5}
      />

      <Jellyfish
        className="right-[13%] top-[13%] h-24 w-24 opacity-60"
        delay={1}
        duration={4.5}
      />

      <Jellyfish
        className="bottom-[12%] left-[30%] h-12 w-12 opacity-25"
        delay={1.5}
        duration={5.5}
      />

      <Jellyfish
        className="bottom-[8%] right-[29%] h-14 w-14 opacity-30"
        delay={0.8}
        duration={4.8}
      />

      {/* Message */}
      <div className="relative z-10">
        <p className="mb-3 text-[9px] font-semibold uppercase tracking-[0.3em] text-[#8F7BAC]">
          Expansion Archive / Empty
        </p>

        <h3 className="text-2xl font-semibold tracking-wide text-[#E6E1EA] sm:text-3xl">
          It's dark in here.
        </h3>

        <p className="mt-3 text-[10px] uppercase tracking-[0.2em] text-[#777080]">
          — Mr. Peanut
        </p>

        <p className="mt-5 text-xs text-[#777780]">
          No expansions have been discovered for this game.
        </p>
      </div>
    </div>
  );
}

export default function Expansions({ dlc }: ExpansionsProps) {
  return (
    <section className="h-full rounded-xl border border-[#302438] bg-[#17191E] p-6 sm:p-7">
      {/* Heading */}
      <div className="mb-6">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B39ACF]">
          06 / Expansions
        </p>

        <h2 className="text-xl font-semibold tracking-wide text-[#E6E1EA]">
          Additional Content
        </h2>

        <div className="mt-4 h-px w-full bg-[#302438]" />
      </div>

      {/* Empty state */}
      {dlc.length === 0 ? (
        <EmptyExpansions />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          {dlc.map((item, index) => (
            <motion.div
              key={item.steam_appid}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.08 }}
            >
              <Link
                to={`/gamedetails/${item.steam_appid}`}
                className="group block overflow-hidden rounded-lg border border-[#302438] bg-[#111216] transition-all duration-300 hover:border-[#554363] hover:bg-[#20232B]"
              >
                <div className="aspect-video overflow-hidden bg-[#0D0D14]">
                  {item.header_image ? (
                    <img
                      src={item.header_image}
                      alt={item.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-[#777780]">
                      Artwork unavailable
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-3 p-4">
                  <h3 className="line-clamp-2 text-sm font-medium text-[#E6E1EA] transition-colors group-hover:text-[#C2ADE0]">
                    {item.name}
                  </h3>

                  <span className="shrink-0 text-xs font-medium text-[#B39ACF]">
                    {item.is_free
                      ? "Free"
                      : item.price_overview?.final_formatted ?? "DLC"}
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}
