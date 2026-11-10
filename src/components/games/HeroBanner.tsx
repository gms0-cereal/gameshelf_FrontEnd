import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface HeroGame {
  id: number | string;
  slug: string;
  title: string;
  cover: string;
  score: number | null;
  bio: string;
}

interface HeroBannerProps {
  heroGames: HeroGame[];
}

export default function HeroBanner({ heroGames }: HeroBannerProps) {
  const [heroIndex, setHeroIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (heroGames.length <= 1 || isHovered) return;

    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev < heroGames.length - 1 ? prev + 1 : 0));
    }, 7000);

    return () => clearInterval(timer);
  }, [heroGames.length, isHovered]);

  if (heroGames.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative min-h-[420px] w-full overflow-hidden rounded-2xl bg-[#17191E] border border-[#302438] xl:h-[440px]"
    >
      <div
        className="flex h-full w-full transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${heroIndex * 100}%)` }}
      >
        {heroGames.map((hero) => (
          <div
            key={hero.id}
            className="relative flex min-h-[420px] w-full flex-shrink-0 items-end px-6 py-10 md:px-11 xl:h-[440px]"
          >
            <img
              src={hero.cover || ""}
              alt={hero.title}
              fetchPriority="high"
              loading="eager"
              className="absolute inset-0 h-full w-full object-cover object-center contrast-110 saturate-125 brightness-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#17191E] via-[#17191E]/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#17191E]/90 via-transparent to-transparent" />

            <div className="relative z-10 flex w-full max-w-[640px] flex-col gap-4">
              <p className="text-[11px] font-semibold uppercase tracking-[2px] text-[#34D399]">
                POPULAR THIS MONTH ON GAMESHELF
              </p>
              <h2 className="text-[32px] font-bold leading-tight tracking-[-0.5px] text-[#E6E1EA] drop-shadow-md md:text-[46px]">
                {hero.title}
              </h2>
              <p className="line-clamp-2 text-[14px] leading-relaxed text-[#A0A0A8] drop-shadow">
                {hero.bio}
              </p>
              <div className="flex items-center gap-4 pt-2">
                <Button
                  asChild
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#B39ACF] px-6 text-[14px] font-semibold text-[#17191E] hover:bg-[#C2ADE0]"
                >
                  <Link to={`/gamedetails/${hero.slug}`}>
                    <Info className="size-4 text-[#17191E]" /> Details
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="absolute right-6 top-6 z-20 flex items-center gap-3">
        <span className="text-xs font-medium text-[#E6E1EA]">
          {heroIndex + 1} / {Math.max(heroGames.length, 1)}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              setHeroIndex((prev) => (prev > 0 ? prev - 1 : heroGames.length - 1))
            }
            className="size-8 rounded-lg border-[#302438] bg-[#17191E]/80 text-[#E6E1EA] hover:bg-[#20232B]"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              setHeroIndex((prev) =>
                prev < heroGames.length - 1 ? prev + 1 : 0
              )
            }
            className="size-8 rounded-lg border-[#302438] bg-[#17191E]/80 text-[#E6E1EA] hover:bg-[#20232B]"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </motion.section>
  );
}