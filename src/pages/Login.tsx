import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import { Eye, EyeOff, Loader2, LogIn, User, ShieldAlert } from "lucide-react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { useAuth } from "../context/AuthContext";
import { login } from "../services/authService";
import api from "../lib/api";

const STORAGE_KEY_COVER_INDEX = "gameshelf_login_cover_idx";
const STORAGE_KEY_ATTEMPTS = "gameshelf_login_attempts";
const STORAGE_KEY_LOCKOUT = "gameshelf_login_lockout_until";

// Fallback covers in case the API call is still loading or offline
const FALLBACK_COVERS = [
  "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1200&auto=format&fit=crop",
];

type FieldErrors = Partial<Record<"username" | "password", string>>;

function toText(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value.join(" ");
  return undefined;
}

function parseApiError(err: unknown): { general?: string; fields: FieldErrors } {
  if (isAxiosError(err)) {
    if (!err.response) {
      return { general: "Can't reach the server. Check your connection and try again.", fields: {} };
    }
    const data = err.response.data as Record<string, unknown> | undefined;
    const fields: FieldErrors = {
      username: toText(data?.username),
      password: toText(data?.password),
    };
    const general =
      toText(data?.detail) ??
      toText(data?.non_field_errors) ??
      toText(data?.error) ??
      toText(data?.message) ??
      (fields.username || fields.password
        ? undefined
        : err.response.status === 401 || err.response.status === 400
        ? "Incorrect username or password."
        : "Something went wrong. Please try again.");
    return { general, fields };
  }
  return { general: "Something went wrong. Please try again.", fields: {} };
}

const inputBase =
  "h-[42px] w-full rounded-xl border border-[#302438] bg-[#17191E] pl-3 pr-10 text-[13px] text-[#E6E1EA] placeholder:text-[#77717F] focus:border-[#B39ACF] focus:outline-none focus:ring-2 focus:ring-[#B39ACF]/40";

const Login = () => {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = location.state as { from?: string; username?: string } | null;
  const redirectTo = routeState?.from ?? "/home";

  const [username, setUsername] = useState(routeState?.username || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [lockoutTimeLeft, setLockoutTimeLeft] = useState<number>(0);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  
  // Dynamic Game Covers State
  const [heroCovers, setHeroCovers] = useState<string[]>(FALLBACK_COVERS);
  const [currentCover, setCurrentCover] = useState<string>(FALLBACK_COVERS[0]);

  // Fetch actual game covers from the backend game service on mount
  useEffect(() => {
    async function fetchGameCovers() {
      try {
        const gameQueries = ["Silksong", "Ultrakill", "Ori", "Nier", "Counter-Strike", "Castle Crashers"];
        const promises = gameQueries.map(async (query) => {
          const { data } = await api.get("/games/", { params: { search: query, limit: 1 } });
          const results = Array.isArray(data) ? data : (data as { results?: any[] }).results;
          if (results && results.length > 0) {
            return results[0].cover_image_url || results[0].background_image || null;
          }
          return null;
        });

        const fetchedImages = (await Promise.all(promises)).filter(Boolean) as string[];
        const coversToUse = fetchedImages.length > 0 ? fetchedImages : FALLBACK_COVERS;

        setHeroCovers(coversToUse);

        // Rotate index using localStorage sequence
        const storedIdx = localStorage.getItem(STORAGE_KEY_COVER_INDEX);
        const nextIdx = storedIdx ? (parseInt(storedIdx, 10) + 1) % coversToUse.length : 0;
        setCurrentCover(coversToUse[nextIdx]);
      } catch {
        // Fallback gracefully if game service fails
        setCurrentCover(FALLBACK_COVERS[0]);
      }
    }

    fetchGameCovers();

    // Check Lockout Timer
    const lockoutTimestamp = localStorage.getItem(STORAGE_KEY_LOCKOUT);
    if (lockoutTimestamp) {
      const remaining = parseInt(lockoutTimestamp, 10) - Date.now();
      if (remaining > 0) {
        setLockoutTimeLeft(Math.ceil(remaining / 1000));
      } else {
        localStorage.removeItem(STORAGE_KEY_LOCKOUT);
        localStorage.removeItem(STORAGE_KEY_ATTEMPTS);
      }
    }
  }, []);

  useEffect(() => {
    if (lockoutTimeLeft <= 0) return;
    const interval = setInterval(() => {
      const lockoutTimestamp = localStorage.getItem(STORAGE_KEY_LOCKOUT);
      if (lockoutTimestamp) {
        const remaining = parseInt(lockoutTimestamp, 10) - Date.now();
        if (remaining <= 0) {
          setLockoutTimeLeft(0);
          localStorage.removeItem(STORAGE_KEY_LOCKOUT);
          localStorage.removeItem(STORAGE_KEY_ATTEMPTS);
          setWarningMessage(null);
        } else {
          setLockoutTimeLeft(Math.ceil(remaining / 1000));
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutTimeLeft]);

  useEffect(() => {
    if (!authLoading && user && heroCovers.length > 0) {
      const storedIdx = localStorage.getItem(STORAGE_KEY_COVER_INDEX);
      const nextIdx = storedIdx ? (parseInt(storedIdx, 10) + 1) % heroCovers.length : 0;
      localStorage.setItem(STORAGE_KEY_COVER_INDEX, nextIdx.toString());

      localStorage.removeItem(STORAGE_KEY_ATTEMPTS);
      localStorage.removeItem(STORAGE_KEY_LOCKOUT);

      navigate(redirectTo, { replace: true });
    }
  }, [authLoading, user, navigate, redirectTo, heroCovers]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting || lockoutTimeLeft > 0) return;

    const errs: FieldErrors = {};
    if (!username.trim()) errs.username = "Enter your username.";
    if (!password) errs.password = "Enter your password.";
    setFieldErrors(errs);
    setError(null);
    if (Object.keys(errs).length) return;

    setSubmitting(true);
    try {
      await login({ username: username.trim(), password });
      const current = await refreshUser();
      if (!current) {
        setError("Logged in, but your session couldn't be verified. Please try again.");
      }
    } catch (err) {
      const parsed = parseApiError(err);
      setError(parsed.general ?? null);
      setFieldErrors(parsed.fields);

      const currentAttempts = parseInt(localStorage.getItem(STORAGE_KEY_ATTEMPTS) || "0", 10) + 1;
      localStorage.setItem(STORAGE_KEY_ATTEMPTS, currentAttempts.toString());

      if (currentAttempts === 3) {
        setWarningMessage("Warning: 3 failed attempts. If you fail 1 more time, you will be temporarily locked out.");
      } else if (currentAttempts >= 4) {
        // 5 minute lockout instead of 1 hour
        const lockoutEnd = Date.now() + 5 * 60 * 1000;
        localStorage.setItem(STORAGE_KEY_LOCKOUT, lockoutEnd.toString());
        setLockoutTimeLeft(5 * 60);
        setWarningMessage("Too many failed login attempts. Locked out for 5 minutes.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#000000] font-sans text-[#E6E1EA]">
      <Navbar />

      <main className="mx-auto grid w-full max-w-[1440px] flex-1 items-center gap-12 px-5 py-12 md:px-8 xl:px-16 md:grid-cols-2">
        {/* Hero panel with dynamic game covers */}
        <section
          aria-label="GameShelf Featured Artwork"
          className="relative hidden min-h-[420px] overflow-hidden rounded-2xl border border-[#302438] bg-[#17191E] md:block md:h-full md:min-h-[580px]"
        >
          <img
            src={currentCover}
            alt="Featured Game Artwork"
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700 opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#000000]/95 via-[#000000]/30 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-8 z-10">
            <p className="font-mono text-[10px] uppercase tracking-widest text-[#B39ACF]">Featured Adventure</p>
            <h2 className="mt-3 max-w-[360px] text-[32px] font-semibold leading-[41px] tracking-[-0.8px] text-[#E6E1EA]">
              A home for every adventure.
            </h2>
            <p className="mt-3 text-[13px] text-[#A0A0A8]">
              Discover what’s next. Keep the games you love close.
            </p>
          </div>
        </section>

        {/* Form Container */}
        <section className="w-full md:max-w-[440px] md:justify-self-center rounded-2xl border border-[#302438] bg-[#17191E] p-8">
          <h1 className="text-[28px] font-semibold tracking-[-0.6px] text-[#E6E1EA]">Log In</h1>
          <p className="mt-2 text-[13px] text-[#A0A0A8]">
            Welcome back. Your next chapter is waiting.
          </p>

          <form onSubmit={handleSubmit} noValidate className="mt-6">
            <div role="alert" aria-live="polite">
              {error && (
                <p className="mb-4 rounded-xl border border-[#E58B91] bg-[#E58B91]/15 px-4 py-3 text-[13px] text-[#E58B91]">
                  {error}
                </p>
              )}
              {warningMessage && lockoutTimeLeft === 0 && (
                <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-[#FBBF24]/40 bg-[#FBBF24]/10 px-4 py-3 text-[13px] text-[#FBBF24]">
                  <ShieldAlert className="size-4 shrink-0 text-[#FBBF24]" />
                  <span>{warningMessage}</span>
                </div>
              )}
              {lockoutTimeLeft > 0 && (
                <div className="mb-4 rounded-xl border border-[#E58B91] bg-[#E58B91]/15 p-4 text-center text-[13px] text-[#E58B91]">
                  <p className="font-semibold">Too many failed attempts.</p>
                  <p className="mt-1">Account login locked. Try again in <span className="font-mono font-bold text-[#E6E1EA]">{formatTime(lockoutTimeLeft)}</span>.</p>
                </div>
              )}
            </div>

            <label htmlFor="username" className="block text-xs font-medium text-[#E6E1EA]">
              Username
            </label>
            <div className="relative mt-2">
              <input
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                disabled={lockoutTimeLeft > 0}
                aria-invalid={!!fieldErrors.username}
                aria-describedby={fieldErrors.username ? "username-error" : undefined}
                className={`${inputBase} ${fieldErrors.username ? "border-[#E58B91]" : ""} disabled:opacity-50`}
              />
              <User
                className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-[#77717F]"
                aria-hidden="true"
              />
            </div>
            {fieldErrors.username && (
              <p id="username-error" className="mt-1.5 text-xs text-[#E58B91]">{fieldErrors.username}</p>
            )}

            <label htmlFor="password" className="mt-5 block text-xs font-medium text-[#E6E1EA]">
              Password
            </label>
            <div className="relative mt-2">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                disabled={lockoutTimeLeft > 0}
                aria-invalid={!!fieldErrors.password}
                aria-describedby={fieldErrors.password ? "password-error" : undefined}
                className={`${inputBase} ${fieldErrors.password ? "border-[#E58B91]" : ""} disabled:opacity-50`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                disabled={lockoutTimeLeft > 0}
                className="absolute right-3 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-lg text-[#77717F] hover:text-[#E6E1EA] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B39ACF]"
              >
                {showPassword ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
              </button>
            </div>
            {fieldErrors.password && (
              <p id="password-error" className="mt-1.5 text-xs text-[#E58B91]">{fieldErrors.password}</p>
            )}

            <div className="mt-6 flex items-center justify-between text-[13px]">
              <Link to="/forgot-password" className="text-[#B39ACF] hover:underline">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={submitting || lockoutTimeLeft > 0}
              className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#B39ACF] px-5 text-[13px] font-semibold text-[#17191E] transition-colors hover:bg-[#B39ACF]/85 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B39ACF] focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <LogIn className="size-4" aria-hidden="true" />
              )}
              <span>{submitting ? "Logging in..." : "Log In"}</span>
            </button>
          </form>

          <p className="mt-6 text-center text-[13px] text-[#A0A0A8]">
            New here?{" "}
            <Link to="/register" className="font-semibold text-[#B39ACF] hover:underline">
              Create an account
            </Link>
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Login;