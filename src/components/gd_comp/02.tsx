
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronDown,
  Heart,
  PenLine,
  Plus,
  Star,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import {
  LIST_STATUS_OPTIONS,
  addToMyList,
  getListStatus,
  removeListEntry,
  type ListStatus,
  type SteamGameDetail,
  type UserGameEntry,
} from "@/services/Gameservice";

interface MarketIntelligenceProps {
  game: SteamGameDetail;
  reviewsPath: string;
  communityScore: number | null;
  totalReviews: number;
  liked: boolean;
  likeCount: number;
  likeBusy: boolean;
  myScore: number | null;
  onToggleLike: () => void;
}

function AddToListMenu({ appId }: { appId: number }) {
  const [open, setOpen] = useState(false);
  const [entry, setEntry] = useState<UserGameEntry | null>(null);
  const [busy, setBusy] = useState(false);

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    setEntry(null);

    getListStatus(appId)
      .then((data) => {
        if (!cancelled && data.in_list) {
          setEntry(data);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [appId]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (
        ref.current &&
        !ref.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, []);

  async function choose(value: ListStatus, label: string) {
    setOpen(false);
    setBusy(true);

    try {
      const saved = await addToMyList(appId, value);

      setEntry(saved);
      toast.success(`Saved to your list as "${label}"`);
    } catch {
      toast.error(
        "Couldn't update your list. Please make sure you're logged in."
      );
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!entry) return;

    setOpen(false);
    setBusy(true);

    try {
      await removeListEntry(entry.id);

      setEntry(null);
      toast.success("Removed from your list");
    } catch {
      toast.error("Couldn't remove this game. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const currentLabel = LIST_STATUS_OPTIONS.find(
    (option) => option.value === entry?.status
  )?.label;

  return (
    <div ref={ref} className="relative w-full">
      <Button
        type="button"
        onClick={() => setOpen((value) => !value)}
        disabled={busy}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="h-10 w-full justify-between gap-2 rounded-lg border border-[#554363] bg-[#20232B] px-3 text-xs font-semibold text-[#E6E1EA] shadow-none hover:border-[#806B99] hover:bg-[#292530]"
      >
        <span className="flex min-w-0 items-center gap-2">
          <Plus className="size-4 shrink-0 text-[#B39ACF]" />
          <span className="truncate">
            {currentLabel ?? "Add to My List"}
          </span>
        </span>

        <ChevronDown
          className={`size-4 shrink-0 text-[#A0A0A8] transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </Button>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-12 z-50 w-full min-w-0 overflow-hidden rounded-xl border border-[#302438] bg-[#17191E] p-1.5 shadow-2xl"
          >
            {LIST_STATUS_OPTIONS.map(({ value, label }) => {
              const selected = entry?.status === value;

              return (
                <li
                  key={value}
                  role="option"
                  aria-selected={selected}
                >
                  <button
                    type="button"
                    onClick={() => choose(value, label)}
                    className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 text-left text-xs transition-colors ${
                      selected
                        ? "bg-[#B39ACF]/15 text-[#E6E1EA]"
                        : "text-[#A0A0A8] hover:bg-[#20232B] hover:text-[#E6E1EA]"
                    }`}
                  >
                    {label}

                    {selected && (
                      <span className="text-[10px] font-semibold text-[#B39ACF]">
                        SELECTED
                      </span>
                    )}
                  </button>
                </li>
              );
            })}

            {entry && (
              <li className="mt-1 border-t border-[#302438] pt-1">
                <button
                  type="button"
                  onClick={remove}
                  className="w-full cursor-pointer rounded-lg px-3 py-2.5 text-left text-xs text-[#E58B91] transition-colors hover:bg-[#2B171C]"
                >
                  Remove from list
                </button>
              </li>
            )}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function MarketIntelligence({
  game,
  reviewsPath,
  communityScore,
  totalReviews,
  liked,
  likeCount,
  likeBusy,
  myScore,
  onToggleLike,
}: MarketIntelligenceProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      aria-labelledby="market-intelligence-title"
      className="flex min-w-0 flex-col gap-3"
    >
      {/* SECTION HEADING */}
      <div className="flex items-center justify-between gap-2">
        <h2
          id="market-intelligence-title"
          className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B39ACF]"
        >
          02 / Market Intelligence
        </h2>

        <span className="text-[10px] tracking-wider text-[#77727F]">
          PLAYER DATA
        </span>
      </div>

      {/* MARKET PANEL */}
      <div className="flex h-full flex-col gap-5 rounded-xl border border-[#302438] bg-[#17191E] p-5 text-[#E6E1EA] sm:p-6">

        {/* PERSONAL GAME STATUS */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#A0A0A8]">
            Your Game Status
          </span>

          <AddToListMenu appId={game.steam_appid} />
        </div>

        <div className="h-px bg-[#302438]" />

        {/* PERSONAL RATING */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#A0A0A8]">
              Your Rating
            </span>

            <span className="text-xs text-[#77727F]">
              Your personal assessment
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Star
              className="size-5 text-[#FBBF24]"
              fill="currentColor"
            />

            <span className="text-xl font-semibold text-[#E6E1EA]">
              {myScore !== null ? myScore : "—"}
            </span>

            <span className="text-xs text-[#77727F]">/5</span>
          </div>
        </div>

        <div className="h-px bg-[#302438]" />

        {/* COMMUNITY SCORE */}
{/* COMMUNITY SCORE */}
<div className="flex flex-col gap-2">
  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#34D399]">
    Community Score
  </span>

  <div className="flex items-end justify-between gap-3">
    <div className="flex items-baseline gap-2">
      <Star
        className="size-5 text-[#FBBF24]"
        fill="currentColor"
      />

      <span className="text-[32px] font-semibold leading-none tracking-tight text-[#E6E1EA]">
        {communityScore !== null
          ? (communityScore / 2).toFixed(1)
          : "—"}
      </span>

      <span className="text-xs text-[#77727F]">
        / 5
      </span>

        <span className="text-right text-[10px] text-[#A0A0A8]">
              {totalReviews.toLocaleString()} ratings
            </span>
    </div>
  </div>
</div>
        <div className="h-px bg-[#302438]" />

        {/* LIKES */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#A0A0A8]">
              Community Appreciation
            </span>

            <span className="text-sm font-semibold">
              {likeCount.toLocaleString()} Likes
            </span>
          </div>

          <motion.button
            whileTap={{ scale: 0.92 }}
            type="button"
            onClick={onToggleLike}
            disabled={likeBusy}
            aria-pressed={liked}
            className={`flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-lg border px-4 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              liked
                ? "border-[#E58B91]/50 bg-[#E58B91]/10 text-[#E58B91]"
                : "border-[#302438] bg-[#000000] text-[#A0A0A8] hover:border-[#554363] hover:text-[#E6E1EA]"
            }`}
          >
            <Heart
              className={`size-4 ${
                liked ? "fill-current text-[#E58B91]" : ""
              }`}
            />

            {liked ? "Liked" : "Like"}
          </motion.button>
        </div>

        {/* REVIEW ACTION */}
        <div className="mt-auto border-t border-[#302438] pt-5">
          <Button
            asChild
            className="h-11 w-full gap-2 rounded-lg bg-[#B39ACF] text-xs font-semibold text-[#17191E] shadow-none hover:bg-[#C2ADE0]"
          >
            <Link to={reviewsPath}>
              <PenLine className="size-4" />
              Rate / Write Review
            </Link>
          </Button>

          <p className="mt-2 text-center text-[10px] text-[#77727F]">
            Share your experience with the community
          </p>
        </div>
      </div>
    </motion.section>
  );
}