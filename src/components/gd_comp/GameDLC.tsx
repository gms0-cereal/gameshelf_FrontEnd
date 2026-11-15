
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import type { SteamGameDetail } from "@/services/Gameservice";

interface GameDLCProps {
  dlc: SteamGameDetail[];
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

export default function GameDLC({ dlc }: GameDLCProps) {
  if (dlc.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: 0.14,
        ease: "easeOut",
      }}
      className="flex flex-col gap-5"
    >
      <SectionHeading
        title="DLC"
        note="Extra content for this game"
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {dlc.map((item) => (
          <motion.div
            key={item.steam_appid}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.985 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 28,
            }}
            className="flex"
          >
            <Link
              to={`/gamedetails/${item.steam_appid}`}
              className="group flex w-full flex-col overflow-hidden rounded-2xl border border-[#302438] bg-[#17191E] transition-colors hover:border-[#554363]"
            >
              <img
                src={item.header_image}
                alt={item.name}
                loading="lazy"
                className="aspect-[460/215] w-full object-cover contrast-110 saturate-125 transition-transform duration-300 group-hover:scale-105"
              />

              <div className="flex flex-col gap-1 p-4">
                <p className="truncate text-sm font-medium group-hover:text-[#B39ACF]">
                  {item.name}
                </p>

                <p className="text-xs text-[#A0A0A8]">
                  {item.is_free
                    ? "Free"
                    : item.price_overview?.final_formatted ?? "DLC"}
                </p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
