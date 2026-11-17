import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { isAxiosError } from "axios";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { verifyEmail } from "../services/authService";

const HERO_IMAGE = "/images/login-hero.jpg";

type Stage = "loading" | "ok" | "error";

const VerifyEmail = () => {
  const [params] = useSearchParams();
  const [stage, setStage] = useState<Stage>("loading");
  const [message, setMessage] = useState("");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // avoid a double call in React StrictMode
    ran.current = true;

    const uid = params.get("uid");
    const token = params.get("token");
    if (!uid || !token) {
      setStage("error");
      setMessage("This verification link is incomplete.");
      return;
    }

    verifyEmail({ uid, token })
      .then(() => setStage("ok"))
      .catch((err) => {
        setStage("error");
        if (isAxiosError(err) && !err.response) {
          setMessage("Can't reach the server. Check your connection and try again.");
        } else if (isAxiosError(err) && typeof err.response?.data?.detail === "string") {
          setMessage(err.response.data.detail);
        } else {
          setMessage("This verification link is invalid or has expired.");
        }
      });
  }, [params]);

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

        {/* Content */}
        <section className="w-full md:max-w-[473px] md:justify-self-end">
          {stage === "loading" && (
            <div className="flex items-center gap-3 text-[13px] text-[#a9a6c2]">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Verifying your email…
            </div>
          )}

          {stage === "ok" && (
            <>
              <h1 className="text-[28px] font-semibold text-[#e6e3f5]">Email verified</h1>
              <div
                role="status"
                className="mt-6 flex gap-3 rounded-lg border border-[#4a4766] bg-[#35334a] px-4 py-3"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#b6a8e8]" aria-hidden="true" />
                <p className="text-[13px] text-[#a9a6c2]">
                  Your account is ready. You can log in and start building your shelf.
                </p>
              </div>
              <Link
                to="/login"
                className="mt-6 inline-flex h-[34px] items-center rounded-md bg-[#a8454b] px-5 text-[13px] font-medium text-white transition-colors hover:bg-[#b9525a]"
              >
                Go to Log In
              </Link>
            </>
          )}

          {stage === "error" && (
            <>
              <h1 className="text-[28px] font-semibold text-[#e6e3f5]">Verification failed</h1>
              <div
                role="alert"
                className="mt-6 flex gap-3 rounded-lg border border-[#a8454b] bg-[#a8454b]/15 px-4 py-3"
              >
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#f4b6ba]" aria-hidden="true" />
                <p className="text-[13px] text-[#f4b6ba]">{message}</p>
              </div>
              <p className="mt-6 text-[13px] text-[#a9a6c2]">
                Log in and request a new verification email from your account.
              </p>
              <Link
                to="/login"
                className="mt-4 inline-flex h-[34px] items-center rounded-md bg-[#a8454b] px-5 text-[13px] font-medium text-white transition-colors hover:bg-[#b9525a]"
              >
                Go to Log In
              </Link>
            </>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default VerifyEmail;