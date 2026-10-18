import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import { ArrowLeft, Info, Loader2, Mail } from "lucide-react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { useAuth } from "../context/AuthContext";
//import { requestPasswordReset } from "../services/authService";
import {forgotPassword} from "../services/authService";

// Same artwork as the Login page.
const HERO_IMAGE = "/images/login-hero.jpg";

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

const inputBase =
  "h-[38px] w-full rounded-lg border bg-transparent pl-3 pr-10 text-[13px] text-[#e6e3f5] placeholder:text-[#9a97b5] focus:outline-none focus:ring-2 focus:ring-[#8b6fd6]/60";

const ForgotPassword = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | undefined>();

  // Already signed in? No need to reset a password here.
  useEffect(() => {
    if (!authLoading && user) navigate("/", { replace: true });
  }, [authLoading, user, navigate]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;

    const value = email.trim();
    setError(null);
    setSent(false);

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
      setSent(true);
    } catch (err) {
      const parsed = parseApiError(err);
      setError(parsed.general ?? null);
      setEmailError(parsed.email);
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
          <h1 className="text-[28px] font-semibold text-[#e6e3f5]">Forgot Password</h1>
          <p className="mt-6 text-[13px] text-[#a9a6c2]">
            Let’s get you back to your shelf. Enter the email linked to your account.
          </p>

          <form onSubmit={handleSubmit} noValidate className="mt-6">
            <div role="alert" aria-live="polite">
              {error && (
                <p className="mb-4 rounded-lg border border-[#a8454b] bg-[#a8454b]/15 px-3 py-2 text-[13px] text-[#f4b6ba]">
                  {error}
                </p>
              )}
            </div>

            <label htmlFor="email" className="block text-xs font-medium text-[#e6e3f5]">
              Email
            </label>
            <div className="relative mt-2">
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError(undefined);
                }}
                placeholder="Enter email"
                aria-invalid={!!emailError}
                aria-describedby={emailError ? "email-error" : undefined}
                className={`${inputBase} ${emailError ? "border-[#a8454b]" : "border-[#4a4766]"}`}
              />
              <Mail
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8f8ca9]"
                aria-hidden="true"
              />
            </div>
            {emailError && (
              <p id="email-error" className="mt-1 text-xs text-[#f4b6ba]">
                {emailError}
              </p>
            )}

            <p className="mt-7 text-[13px] text-[#a9a6c2]">
              Your account keeps your list and ratings together.
            </p>

            <button
              type="submit"
              disabled={submitting}
              className="mt-6 inline-flex h-[34px] min-w-[82px] items-center justify-center gap-2 rounded-md bg-[#a8454b] px-5 text-[13px] font-medium text-white transition-colors hover:bg-[#b9525a] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e6e3f5] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
              {submitting ? "Sending…" : "Send Reset Link"}
            </button>
          </form>

          <div aria-live="polite">
            {sent && (
              <div
                role="status"
                className="mt-6 flex gap-3 rounded-lg border border-[#4a4766] bg-[#35334a] px-4 py-3"
              >
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#b6a8e8]" aria-hidden="true" />
                <div>
                  <p className="text-[13px] font-medium text-[#b6a8e8]">Check your email</p>
                  <p className="mt-0.5 text-xs text-[#a9a6c2]">
                    A reset link is on its way. Follow the link to choose a new password.
                  </p>
                </div>
              </div>
            )}
          </div>

          <p className="mt-6 text-[13px]">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-[#b6a8e8] hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              Back to Log In
            </Link>
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ForgotPassword;