import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Mail, MailCheck } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { forgotPassword } from "@/services/authService";

const ROTATING_HERO_GAMES = [
  {
    title: "Hollow Knight: Silksong",
    cover: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1030300/header.jpg",
    genre: "Action / Platformer / Metroidvania",
  },
  {
    title: "Armored Core VI Fires of Rubicon",
    cover: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1888160/header.jpg",
    genre: "Action / Mecha / Sci-Fi",
  },
  {
    title: "Black Myth: Wukong",
    cover: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2358720/header.jpg",
    genre: "Action RPG / Mythology",
  },
  {
    title: "Lies of P",
    cover: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1627720/header.jpg",
    genre: "Souls-like / Dark Fantasy",
  },
  {
    title: "Counter-Strike 2",
    cover: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/730/header.jpg",
    genre: "FPS / Tactical Competitive",
  },
  {
    title: "Cuphead",
    cover: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/268910/header.jpg",
    genre: "Run & Gun / Classic Animation",
  },
  {
    title: "NieR:Automata",
    cover: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/524220/header.jpg",
    genre: "Action RPG / Post-Apocalyptic",
  },
  {
    title: "Dark Souls III",
    cover: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/374320/header.jpg",
    genre: "Dark Fantasy / Action RPG",
  },
  {
    title: "Red Dead Redemption 2",
    cover: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1174180/header.jpg",
    genre: "Open World / Western Story",
  },
];

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

function toText(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value.join(" ");
  return undefined;
}

/** Handles DRF-style payloads: { detail }, { email: [...] }, etc. */
function parseApiError(err: unknown): { general?: string; email?: string } {
  if (isAxiosError(err)) {
    if (!err.response) {
      return { general: "Can't reach the server. Check your connection and try again." };
    }
    const data = err.response.data as Record<string, unknown> | undefined;
    const email = toText(data?.email);
    const general =
      toText(data?.detail) ??
      toText(data?.non_field_errors) ??
      toText(data?.error) ??
      toText(data?.message) ??
      (email ? undefined : "Something went wrong. Please try again.");
    return { general, email };
  }
  return { general: "Something went wrong. Please try again." };
}

export default function ForgotPassword() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [currentSlide, setCurrentSlide] = useState(0);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | undefined>();

  // Already signed in? No need to reset a password here.
  useEffect(() => {
    if (!authLoading && user) navigate("/", { replace: true });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % ROTATING_HERO_GAMES.length);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const activeGame = ROTATING_HERO_GAMES[currentSlide];

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;

    const value = email.trim();
    setError(null);

    if (!value) {
      setEmailError("Enter your email.");
      return;
    }
    if (!isValidEmail(value)) {
      setEmailError("Enter a valid email address.");
      return;
    }
    setEmailError(undefined);

    setSubmitting(true);
    try {
      await forgotPassword({ email: value });
      setSentTo(value);
    } catch (err) {
      const parsed = parseApiError(err);
      setError(parsed.general ?? null);
      setEmailError(parsed.email);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="flex min-h-screen w-full flex-col bg-[#000000] text-[#E6E1EA] antialiased"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <Navbar />

      <main className="flex flex-1 flex-col justify-center px-5 py-8 md:px-8 xl:px-16">
        <div className="grid w-full gap-8 lg:grid-cols-12 lg:items-center">

          {/* Form Side */}
          <div className="flex w-full flex-col justify-center lg:col-span-5">
            <Card className="w-full rounded-2xl border border-[#302438] bg-[#17191E] p-2 text-[#E6E1EA] shadow-2xl">
              {sentTo ? (
                /* ── Check your email panel ── */
                <CardContent className="flex flex-col gap-6 p-6 md:p-8">
                  <div className="flex size-12 items-center justify-center rounded-full bg-[#B39ACF]/15">
                    <MailCheck className="size-6 text-[#B39ACF]" aria-hidden="true" />
                  </div>

                  <div>
                    <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.5px] text-[#E6E1EA]">
                      Check your email
                    </h1>
                    <p className="mt-3 text-xs leading-relaxed text-[#A0A0A8]">
                      If an account exists for{" "}
                      <span className="font-semibold text-[#E6E1EA]">{sentTo}</span>, a reset link
                      is on its way. Follow the link to choose a new password.
                    </p>
                  </div>

                  <div
                    role="status"
                    className="rounded-xl border border-[#302438] bg-[#000000] px-4 py-3 text-xs text-[#A0A0A8]"
                  >
                    Can’t find it? Check your spam or promotions folder. The email can take a
                    minute to arrive.
                  </div>

                  <div className="flex flex-col gap-3">
                    <Button
                      type="button"
                      onClick={() => {
                        setSentTo(null);
                        setEmail("");
                      }}
                      className="h-11 w-full gap-2 rounded-xl border border-[#302438] bg-transparent text-xs font-semibold text-[#E6E1EA] shadow-none hover:bg-[#20232B]"
                    >
                      Use a different email
                    </Button>

                    <Link to="/login">
                      <Button
                        type="button"
                        className="h-11 w-full gap-2 rounded-xl border-0 bg-[#B39ACF] text-xs font-semibold text-[#17191E] shadow-none hover:bg-[#C2ADE0]"
                      >
                        Back to Log In
                        <ArrowRight className="size-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              ) : (
                /* ── Forgot password form ── */
                <CardContent className="flex flex-col gap-6 p-6 md:p-8">
                  <div>
                    <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.5px] text-[#E6E1EA]">
                      Forgot Password
                    </h1>
                    <p className="mt-1.5 text-xs text-[#A0A0A8]">
                      Let’s get you back to your shelf. Enter the email linked to your account
                      and we’ll send you a reset link.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
                    <div role="alert" aria-live="polite">
                      {error && (
                        <p className="rounded-xl border border-[#a8454b] bg-[#a8454b]/15 px-3 py-2 text-xs text-[#f4b6ba]">
                          {error}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="email" className="text-[12px] font-medium text-[#A0A0A8]">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#77717F]" />
                        <input
                          id="email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            if (emailError) setEmailError(undefined);
                          }}
                          placeholder="you@example.com"
                          aria-invalid={!!emailError}
                          aria-describedby={emailError ? "email-error" : undefined}
                          className={`h-11 w-full rounded-xl border bg-[#000000] pl-10 pr-4 text-xs text-[#E6E1EA] placeholder-[#554363] outline-none transition-colors focus:border-[#B39ACF] ${
                            emailError ? "border-[#a8454b]" : "border-[#302438]"
                          }`}
                        />
                      </div>
                      {emailError && (
                        <p id="email-error" className="text-xs text-[#f4b6ba]">
                          {emailError}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={submitting}
                      className="mt-2 h-11 w-full gap-2 rounded-xl border-0 bg-[#B39ACF] text-xs font-semibold text-[#17191E] shadow-none hover:bg-[#C2ADE0] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {submitting ? "Sending..." : "Send Reset Link"}
                      <ArrowRight className="size-4" />
                    </Button>
                  </form>

                  <div className="border-t border-[#302438] pt-4 text-center text-xs text-[#A0A0A8]">
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-1.5 font-medium text-[#B39ACF] hover:underline"
                    >
                      <ArrowLeft className="size-3.5" aria-hidden="true" />
                      Back to Log In
                    </Link>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>

          {/* Banner Side */}
          <div className="hidden w-full lg:col-span-7 lg:block">
            <div className="relative flex min-h-[460px] w-full flex-col justify-end overflow-hidden rounded-2xl border border-[#302438] bg-[#17191E] p-8 md:p-10">

              {/* Animated Game Cover */}
              <div className="absolute inset-0 overflow-hidden">
                <AnimatePresence mode="sync" initial={false}>
                  <motion.img
                    key={activeGame.cover}
                    src={activeGame.cover}
                    alt={activeGame.title}
                    initial={{ opacity: 0, scale: 1.08 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.02 }}
                    transition={{
                      opacity: { duration: 1.2, ease: "easeInOut" },
                      scale: { duration: 10, ease: "linear" },
                    }}
                    className="absolute inset-0 h-full w-full object-cover contrast-110 saturate-125"
                  />
                </AnimatePresence>

                {/* Gradient Overlay */}
                <div
                  className="absolute inset-0 z-[1]"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.7) 60%, rgba(0,0,0,0.95) 100%)",
                  }}
                />
              </div>

              {/* Animated Game Information */}
              <div className="relative z-10 flex flex-col gap-2">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={activeGame.title}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                    className="flex flex-col gap-2"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#B39ACF]">
                      {activeGame.genre}
                    </p>

                    <h2 className="text-3xl font-semibold leading-tight text-[#E6E1EA] md:text-4xl">
                      {activeGame.title}
                    </h2>

                    <p className="max-w-[500px] text-xs text-[#A0A0A8]">
                      Your account keeps your list and ratings together.
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Carousel Controls */}
              <div className="relative z-10 mt-6 flex items-center justify-between">
                <div className="flex gap-1.5">
                  {ROTATING_HERO_GAMES.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentSlide(idx)}
                      className={`h-2 rounded-full transition-all duration-500 ${
                        idx === currentSlide
                          ? "w-6 bg-[#B39ACF]"
                          : "w-2 bg-[#A0A0A8]/40 hover:bg-[#A0A0A8]"
                      }`}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentSlide(
                        (prev) => (prev - 1 + ROTATING_HERO_GAMES.length) % ROTATING_HERO_GAMES.length
                      )
                    }
                    className="flex size-8 items-center justify-center rounded-xl border border-[#302438] bg-[#17191E]/80 text-[#E6E1EA] backdrop-blur-sm transition-colors hover:border-[#554363] hover:bg-[#20232B]"
                    aria-label="Previous game"
                  >
                    <ChevronLeft className="size-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentSlide((prev) => (prev + 1) % ROTATING_HERO_GAMES.length)}
                    className="flex size-8 items-center justify-center rounded-xl border border-[#302438] bg-[#17191E]/80 text-[#E6E1EA] backdrop-blur-sm transition-colors hover:border-[#554363] hover:bg-[#20232B]"
                    aria-label="Next game"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}