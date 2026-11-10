import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { isAxiosError } from "axios";
import { Mail, Lock, User, ArrowRight, ChevronLeft, ChevronRight, Eye, EyeOff, LogIn } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { login } from "@/services/authService";
import {useAuth} from "@/context/AuthContext";

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

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshUser } = useAuth();

  const routeState = location.state as {
    from?: { pathname?: string } | string;
    username?: string;
  } | null;

  const redirectTo =
    typeof routeState?.from === "string"
      ? routeState.from
      : routeState?.from?.pathname || "/home";

  const [currentSlide, setCurrentSlide] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: routeState?.username || "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % ROTATING_HERO_GAMES.length);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const activeGame = ROTATING_HERO_GAMES[currentSlide];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login({
        username: formData.username.trim(),
        password: formData.password,
      });

      await refreshUser();

      toast.success("Logged in successfully!");
      navigate(redirectTo, { replace: true });
    } catch (error) {
      const message = isAxiosError(error)
        ? error.response?.data?.detail ||
          error.response?.data?.message ||
          "Invalid username or password. Please try again."
        : "Unable to log in. Please try again.";

      toast.error(String(message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#000000] text-[#E6E1EA] antialiased" style={{ fontFamily: "'Inter', sans-serif" }}>
      <Navbar />

      <main className="flex flex-1 flex-col justify-center px-5 py-8 md:px-8 xl:px-16">
        <div className="grid w-full gap-8 lg:grid-cols-12 lg:items-center">
          
          {/* Form Side */}
          <div className="flex w-full flex-col justify-center lg:col-span-5">
            <Card className="w-full rounded-2xl border border-[#302438] bg-[#17191E] p-2 text-[#E6E1EA] shadow-2xl">
              <CardContent className="flex flex-col gap-6 p-6 md:p-8">
                <div>
                  <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.5px] text-[#E6E1EA]">
                    Welcome Back
                  </h1>
                  <p className="mt-1.5 text-xs text-[#A0A0A8]">
                    Log in to your GameShelf account to access your library and shelf.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="username" className="text-[12px] font-medium text-[#A0A0A8]">
                      Username
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#77717F]" />
                      <input
                        id="username"
                        name="username"
                        type="text"
                        required
                        value={formData.username}
                        onChange={handleChange}
                        placeholder="gamer123"
                        className="h-11 w-full rounded-xl border border-[#302438] bg-[#000000] pl-10 pr-4 text-xs text-[#E6E1EA] placeholder-[#554363] outline-none transition-colors focus:border-[#B39ACF]"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor="password" className="text-[12px] font-medium text-[#A0A0A8]">
                        Password
                      </label>
                      <Link to="/forgot-password" className="text-[11px] text-[#B39ACF] hover:underline">
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#77717F]" />
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        required
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="••••••••"
                        className="h-11 w-full rounded-xl border border-[#302438] bg-[#000000] pl-10 pr-10 text-xs text-[#E6E1EA] placeholder-[#554363] outline-none transition-colors focus:border-[#B39ACF]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#77717F] hover:text-[#E6E1EA]"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="mt-2 h-11 w-full gap-2 rounded-xl border-0 bg-[#B39ACF] text-xs font-semibold text-[#17191E] shadow-none hover:bg-[#C2ADE0]"
                  >
                    {loading ? "Logging in..." : "Log In"}
                    <LogIn className="size-4" />
                  </Button>
                </form>

                <div className="border-t border-[#302438] pt-4 text-center text-xs text-[#A0A0A8]">
                  Don't have an account?{" "}
                  <Link to="/register" className="font-medium text-[#B39ACF] hover:underline">
                    Create an account
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Banner Side */}
          <div className="hidden w-full lg:col-span-7 lg:block">
            <div className="relative flex min-h-[460px] w-full flex-col justify-end overflow-hidden rounded-2xl border border-[#302438] bg-[#17191E] p-8 md:p-10">
              <div className="absolute inset-0">
                <img
                  key={activeGame.cover}
                  src={activeGame.cover}
                  alt={activeGame.title}
                  className="h-full w-full object-cover contrast-110 saturate-125 transition-opacity duration-1000"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.7) 60%, rgba(0,0,0,0.95) 100%)",
                  }}
                />
              </div>

              <div className="relative z-10 flex flex-col gap-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#B39ACF]">
                  {activeGame.genre}
                </p>
                <h2 className="text-3xl font-semibold leading-tight text-[#E6E1EA] md:text-4xl">
                  {activeGame.title}
                </h2>
                <p className="max-w-[500px] text-xs text-[#A0A0A8]">
                  Welcome back. Pick up right where you left off on your game shelf.
                </p>
              </div>

              <div className="relative z-10 mt-6 flex items-center justify-between">
                <div className="flex gap-1.5">
                  {ROTATING_HERO_GAMES.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlide(idx)}
                      className={`h-2 rounded-full transition-all ${
                        idx === currentSlide ? "w-6 bg-[#B39ACF]" : "w-2 bg-[#A0A0A8]/40 hover:bg-[#A0A0A8]"
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
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentSlide((prev) => (prev + 1) % ROTATING_HERO_GAMES.length)
                    }
                    className="flex size-8 items-center justify-center rounded-xl border border-[#302438] bg-[#17191E]/80 text-[#E6E1EA] backdrop-blur-sm transition-colors hover:border-[#554363] hover:bg-[#20232B]"
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