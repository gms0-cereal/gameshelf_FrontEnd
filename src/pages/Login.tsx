import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import { Eye, EyeOff, Loader2, LogIn, User } from "lucide-react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { useAuth } from "../context/AuthContext";
import { login } from "../services/authService";


// Replace with your own asset path (the forest artwork from the reference).
const HERO_IMAGE = "/images/login-hero.jpg";

type FieldErrors = Partial<Record<"username" | "password", string>>;

function toText(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value.join(" ");
  return undefined;
}



/** Handles DRF-style payloads: { detail }, { non_field_errors }, { username: [...] }. */
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
  "h-[38px] w-full rounded-lg border bg-transparent pl-3 pr-10 text-[13px] text-[#e6e3f5] placeholder:text-[#9a97b5] focus:outline-none focus:ring-2 focus:ring-[#8b6fd6]/60";

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

  // Redirect once authenticated (covers both a fresh login and an existing session).
  useEffect(() => {
    if (!authLoading && user) navigate(redirectTo, { replace: true });
  }, [authLoading, user, navigate, redirectTo]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;

    const errs: FieldErrors = {};
    if (!username.trim()) errs.username = "Enter your username.";
    if (!password) errs.password = "Enter your password.";
    setFieldErrors(errs);
    setError(null);
    if (Object.keys(errs).length) return;

    setSubmitting(true);
    try {
      await login({ username: username.trim(), password });
      // Updates shared state so the navbar switches immediately.
      const current = await refreshUser();
      if (!current) {
        setError("Logged in, but your session couldn't be verified. Please try again.");
      }
    } catch (err) {
      const parsed = parseApiError(err);
      setError(parsed.general ?? null);
      setFieldErrors(parsed.fields);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#282539] font-sans text-[#e6e3f5]">
      <Navbar />

      <main className="mx-auto grid w-full max-w-[1200px] flex-1 items-center gap-10 px-4 py-10 sm:px-6 md:grid-cols-2 md:gap-14 lg:px-[52px] lg:py-[50px]">
        {/* Hero panel */}
        <section
          aria-label="GameShelf"
          className="relative hidden min-h-[360px] overflow-hidden rounded-2xl bg-[#1d2b33] bg-cover bg-center md:block md:h-full md:min-h-[550px]"
          style={{ backgroundImage: `url(${HERO_IMAGE})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#1b1a2a]/90 via-[#1b1a2a]/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-8">
            <p className="text-xs text-[#c9c6e0]">YOUR GAMES. YOUR STORY.</p>
            <h2 className="mt-3 max-w-[300px] text-[32px] font-semibold leading-[1.1] text-[#ecebf7]">
              A home for every adventure.
            </h2>
            <p className="mt-5 text-[13px] text-[#c9c6e0]">
              Discover what’s next. Keep the games you love close.
            </p>
          </div>
        </section>

        {/* Form */}
        <section className="w-full md:max-w-[473px] md:justify-self-end">
          <h1 className="text-[28px] font-semibold text-[#e6e3f5]">Log In</h1>
          <p className="mt-6 text-[13px] text-[#a9a6c2]">
            Welcome back. Your next chapter is waiting.
          </p>

          <form onSubmit={handleSubmit} noValidate className="mt-6">
            <div role="alert" aria-live="polite">
              {error && (
                <p className="mb-4 rounded-lg border border-[#a8454b] bg-[#a8454b]/15 px-3 py-2 text-[13px] text-[#f4b6ba]">
                  {error}
                </p>
              )}
            </div>

            <label htmlFor="username" className="block text-xs font-medium text-[#e6e3f5]">
              UserName
            </label>
            <div className="relative mt-2">
              <input
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                aria-invalid={!!fieldErrors.username}
                aria-describedby={fieldErrors.username ? "username-error" : undefined}
                className={`${inputBase} ${fieldErrors.username ? "border-[#a8454b]" : "border-[#4a4766]"}`}
              />
              <User
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8f8ca9]"
                aria-hidden="true"
              />
            </div>
            {fieldErrors.username && (
              <p id="username-error" className="mt-1 text-xs text-[#f4b6ba]">{fieldErrors.username}</p>
            )}

            <label htmlFor="password" className="mt-6 block text-xs font-medium text-[#e6e3f5]">
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
                aria-invalid={!!fieldErrors.password}
                aria-describedby={fieldErrors.password ? "password-error" : undefined}
                className={`${inputBase} ${fieldErrors.password ? "border-[#a8454b]" : "border-[#4a4766]"}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded text-[#8f8ca9] hover:text-[#e6e3f5] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8b6fd6]"
              >
                {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
            </div>
            {fieldErrors.password && (
              <p id="password-error" className="mt-1 text-xs text-[#f4b6ba]">{fieldErrors.password}</p>
            )}

            <p className="mt-7 text-[13px] text-[#a9a6c2]">
              Your account keeps your list and ratings together.
            </p>

            <button
              type="submit"
              disabled={submitting}
              className="mt-6 inline-flex h-[34px] min-w-[82px] items-center justify-center gap-2 rounded-md bg-[#a8454b] px-5 text-[13px] font-medium text-white transition-colors hover:bg-[#b9525a] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e6e3f5] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <LogIn className="h-3.5 w-3.5 text-white/60" aria-hidden="true" />
              )}
              {submitting ? "Logging in…" : "Log In"}
            </button>
          </form>

          <p className="mt-6 text-[13px]">
            <Link to="/forgot-password" className="text-[#b6a8e8] hover:underline">
              Forgot password?
            </Link>
          </p>
          <p className="mt-5 text-[13px] text-[#a9a6c2]">
            New here?{" "}
            <Link to="/register" className="text-[#b6a8e8] hover:underline">
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