import { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { CalendarDays } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { BIRTHDAY_PATH, getBirthday } from "@/lib/birthday";

// Pages where the modal must NOT cover the screen.
const ALLOWED_PATHS = [
  BIRTHDAY_PATH,
  "/profile/set-birthday",
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/terms",
  "/privacy",
];

/** Full-screen modal: logged-in users must add their birthday before using the site. */
export default function BirthdayPrompt() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const buttonRef = useRef<HTMLAnchorElement>(null);

  const open = !!user && !getBirthday(user) && !ALLOWED_PATHS.includes(pathname);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden"; // stop the page behind from scrolling
    buttonRef.current?.focus();
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="birthday-title"
      aria-describedby="birthday-desc"
    >
      <div className="flex w-full max-w-lg flex-col items-center gap-6 rounded-3xl border border-[#B39ACF]/60 bg-[#17191E] p-8 text-center shadow-2xl shadow-black/60 sm:p-12">
        <span className="flex size-20 items-center justify-center rounded-full bg-[#B39ACF]/15">
          <CalendarDays className="size-10 text-[#B39ACF]" aria-hidden="true" />
        </span>

        <div className="flex flex-col gap-3">
          <h2 id="birthday-title" className="text-2xl font-bold text-[#E6E1EA] sm:text-3xl">
            Set your birthday first
          </h2>
          <p id="birthday-desc" className="text-sm leading-6 text-[#A0A0A8]">
            GameShelf needs your birthday to confirm your age. Until you add it, 18+ games stay hidden and you
            can't use the rest of the site.
          </p>
        </div>

        <Link
        ref={buttonRef}
        to={BIRTHDAY_PATH}
        state={{ focusBirthday: true }}
        className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#B39ACF] px-6 text-sm font-bold text-[#17101F] transition-colors hover:bg-[#C2ADE0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B39ACF]/60 sm:w-auto"
        >
          Add my birthday
        </Link>
      </div>
    </div>
  );
}