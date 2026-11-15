
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronDown,
  Heart,
  PenLine,
  Plus,
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

interface GameOverviewProps {
  game: SteamGameDetail;
  reviewsPath: string;
  communityScore: number | null;
  totalReviews: number;
  liked: boolean;
  likeCount: number;
  likeBusy: boolean;
  onToggleLike: () => void;
}

function stripHtml(html: string | undefined) {
  if (!html) return "";

  const doc = new DOMParser().parseFromString(html, "text/html");

  return (doc.body.textContent ?? "")
    .replace(/\s+/g, " ")
    .trim();
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
      toast.success(`Saved to your list as “${label}”`);
    } catch {
      toast.error(
        "Couldn’t update your list. Please make sure you’re logged in."
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
      toast.error("Couldn’t remove this game. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const currentLabel = LIST_STATUS_OPTIONS.find(
    (option) => option.value === entry?.status
  )?.label;

  return (
    <div ref={ref} className="relative">
      <motion.div whileTap={{ scale: 0.97 }}>
        <Button
          type="button"
          onClick={() => setOpen((value) => !value)}
          disabled={busy}
          aria-haspopup="listbox"
          aria-expanded={open}
          className="h-10 gap-2 rounded-xl border-0 bg-[#B39ACF] px-4 text-[13px] font-semibold text-[#17191E] shadow-none hover:bg-[#C2ADE0]"
        >
          <Plus className="size-4" strokeWidth={1.7} />

          {currentLabel ?? "Add to My List"}

          <ChevronDown
            className={`size-4 transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
            strokeWidth={1.7}
          />
        </Button>
      </motion.div>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="absolute left-0 top-12 z-30 w-[200px] overflow-hidden rounded-xl border border-[#302438] bg-[#17191E] p-1.5 shadow-xl"
          >
            {LIST_STATUS_OPTIONS.map(({ value, label }) => {
              const isSelected = entry?.status === value;

              return (
                <li
                  key={value}
                  role="option"
                  aria-selected={isSelected}
                >
                  <button
                    type="button"
                    onClick={() => choose(value, label)}
                    className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                      isSelected
                        ? "bg-[#B39ACF]/20 text-[#E6E1EA]"
                        : "text-[#A0A0A8] hover:bg-[#20232B] hover:text-[#E6E1EA]"
                    }`}
                  >
                    {label}

                    {isSelected && (
                      <span className="rounded-full bg-[#B39ACF] px-2 py-0.5 text-[10px] font-semibold text-[#17191E]">
                        Selected
                      </span>
                    )}
                  </button>
                </li>
              );
            })}

            {entry && (
              <li
                role="presentation"
                className="mt-1 border-t border-[#302438] pt-1"
              >
                <button
                  type="button"
                  onClick={remove}
                  className="w-full cursor-pointer rounded-lg px-3 py-2 text-left text-xs text-[#E58B91] hover:bg-[#2B171C]"
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

export default function GameOverview({
  game,
  reviewsPath,
  communityScore,
  totalReviews,
  liked,
  likeCount,
  likeBusy,
  onToggleLike,
}: GameOverviewProps) {
  const releaseYear =
    game.release_date?.date.match(/\d{4}/)?.[0] ?? "—";

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: 0.08,
        ease: "easeOut",
      }}
      className="flex flex-col gap-5"
    >
      <div className="flex flex-col gap-6 rounded-2xl border border-[#302438] bg-[#17191E] p-6 text-[#E6E1EA]">
        {/* List Status, Review Button, Score and Like */}

        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#302438] pb-5">
          <div className="flex flex-wrap items-center gap-3">
            <AddToListMenu appId={game.steam_appid} />

            <motion.div whileTap={{ scale: 0.97 }}>
              <Button
                asChild
                className="h-10 gap-2 rounded-xl border border-[#302438] bg-[#000000] px-4 text-[13px] font-semibold text-[#E6E1EA] shadow-none hover:border-[#554363] hover:bg-[#20232B]"
              >
                <Link to={reviewsPath}>
                  <PenLine
                    className="size-4 text-[#B39ACF]"
                    strokeWidth={1.7}
                  />
                  Rate / Write Review
                </Link>
              </Button>
            </motion.div>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-baseline gap-2">
              <span className="text-[20px] font-semibold leading-7">
                {communityScore !== null
                  ? `${communityScore.toFixed(1)} / 10`
                  : "No score yet"}
              </span>

              <span className="text-sm text-[#A0A0A8]">
                • Community score (
                {totalReviews > 0
                  ? `${totalReviews.toLocaleString()} ratings`
                  : "Not enough reviews"}
                )
              </span>
            </div>

            <motion.button
              whileTap={{ scale: 0.92 }}
              type="button"
              onClick={onToggleLike}
              disabled={likeBusy}
              aria-pressed={liked}
              className={`flex cursor-pointer items-center gap-2 text-sm transition-colors ${
                liked
                  ? "text-[#E58B91]"
                  : "text-[#A0A0A8] hover:text-[#E6E1EA]"
              }`}
            >
              <Heart
                className={`size-4 transition-transform ${
                  liked
                    ? "scale-110 fill-[#E58B91] text-[#E58B91]"
                    : ""
                }`}
                strokeWidth={1.7}
              />

              {liked ? "Liked" : "Like"}

              {likeCount > 0 && (
                <span className="text-xs text-[#77717F]">
                  ({likeCount.toLocaleString()})
                </span>
              )}
            </motion.button>
          </div>
        </div>

        {/* About the Game */}

        <div className="flex flex-col gap-2">
          <h2 className="text-[22px] font-semibold leading-7">
            About {game.name}
          </h2>

          <p className="min-h-[120px] text-sm leading-6 text-[#A0A0A8]">
            {stripHtml(game.about_the_game) ||
              game.short_description ||
              "No description available."}
          </p>
        </div>

        {/* Developer, Publisher and Release */}

        <dl className="grid grid-cols-2 gap-4 border-t border-[#302438] pt-5 text-xs sm:grid-cols-3">
          <div>
            <dt className="mb-1 uppercase tracking-wide text-[#77717F]">
              Developer
            </dt>

            <dd className="font-medium text-[#38BDF8]">
              {game.developers?.join(", ") || "—"}
            </dd>
          </div>

          <div>
            <dt className="mb-1 uppercase tracking-wide text-[#77717F]">
              Publisher
            </dt>

            <dd className="font-medium text-[#B39ACF]">
              {game.publishers?.join(", ") || "—"}
            </dd>
          </div>

          <div>
            <dt className="mb-1 uppercase tracking-wide text-[#77717F]">
              Release year
            </dt>

            <dd className="font-medium text-[#34D399]">
              {releaseYear}
            </dd>
          </div>
        </dl>
      </div>
    </motion.section>
  );
}
