import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type FormEvent,
} from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import gameShelfLogo from "../logo/Gameshelf_Logo.png";
import {
  Search,
  ChevronDown,
  Gamepad2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { searchSteamGames, type PickerGame } from "@/services/playlistService";

const navLinks = [
  { to: "/home", label: "Home" },
  { to: "/discover", label: "Discover" },
  { to: "/playlists", label: "Gamelist" },
  { to: "/my-library", label: "My Library" },
];

const menuItems = [
  { to: "/profile", label: "Profile" },
  { to: "/my-library", label: "My Game Library" },
  { to: "/settings", label: "Settings" },
];

const menuItemClass =
  "block w-full px-4 py-2.5 text-left text-sm text-[#E6E1EA] hover:bg-[#20232B] focus:bg-[#20232B] focus:outline-none transition-colors";

function isUserAdult(birthDayStr: string | null | undefined): boolean {
  if (!birthDayStr) return false;
  const birthDate = new Date(birthDayStr);
  if (isNaN(birthDate.getTime())) return false;
  
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 18;
}

function isAdultGame(game: PickerGame & { genres?: string[]; tags?: string[] }) {
  const adultKeywords = ["hentai", "sexual content", "nudity", "adult content"];
  
  const matchesGenre = game.genres?.some((g) => 
    adultKeywords.some((kw) => g.toLowerCase().includes(kw))
  );
  const matchesTag = game.tags?.some((t) => 
    adultKeywords.some((kw) => t.toLowerCase().includes(kw))
  );
  const matchesTitle = adultKeywords.some((kw) => 
    game.title.toLowerCase().includes(kw)
  );

  return matchesGenre || matchesTag || matchesTitle;
}

export default function Navbar() {
  const { user, loading, logoutUser } = useAuth();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PickerGame[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  useEffect(() => {
    if (open) {
      menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    }
  }, [open]);

  useEffect(() => {
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 2) return;

    let cancelled = false;
    const controller = new AbortController();

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const games = await searchSteamGames(query, controller.signal);
        if (!cancelled) {
          const userCanViewAdult = user?.birth_day && isUserAdult(user.birth_day);
          const filteredGames = games.filter((game) => {
            if (isAdultGame(game) && !userCanViewAdult) return false;
            return true;
          });
          setSearchResults(filteredGames.slice(0, 8));
        }
      } catch {
        if (!cancelled && !controller.signal.aborted) {
          setSearchResults([]);
          setSearchError("Couldn't search games right now. Try again.");
        }
      } finally {
        if (!cancelled) setSearchLoading(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery, user]);

  const onMenuKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []
    );
    const index = items.indexOf(document.activeElement as HTMLElement);

    if (e.key === "Escape") {
      setOpen(false);
      wrapperRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      items[(index + 1) % items.length]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      items[(index - 1 + items.length) % items.length]?.focus();
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const firstResult = searchResults[0];
    if (firstResult) {
      navigate(`/gamedetails/${firstResult.appid}`);
      setSearchQuery("");
    }
  };

  const handleGameSelect = (game: PickerGame) => {
    navigate(`/gamedetails/${game.appid}`);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleLogout = async () => {
    setLogoutError(null);
    setLoggingOut(true);
    try {
      await logoutUser();
      setOpen(false);
      navigate("/login");
    } catch {
      setLogoutError("Couldn't log out. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <header className="w-full bg-[#17191E] border-b border-[#302438]">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex min-h-[88px] w-full max-w-[1440px] items-center justify-between px-5 py-4 md:px-8 xl:h-[88px] xl:px-16"
      >
        {/* Left side: Brand + Nav Links */}
        <div className="flex items-center gap-8 xl:gap-10">
          
          {/* ==========================================================
            LOGO POSITIONING CONTROLS:
            - Change `translate-y-[...]` to move up/down (e.g. translate-y-[1px])
            - Change `ml-[...]` or `mr-[...]` to nudge left or right 
            ========================================================== */}
          <Link
            to="/home"
            aria-label="GameShelf home"
            className="flex items-center text-base leading-[19px] text-[#E6E1EA] shrink-0"
          >
            <motion.img
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              src={gameShelfLogo}
              alt="GameShelf"
              className="h-[36px] w-auto object-contain select-none"
            />
          </Link>
          
          {/* Nav Links with Framer Motion feedback */}
          <ul className="flex items-center gap-6 text-sm leading-[17px]">
            {navLinks.map((link) => (
              <li key={link.label} className="relative">
                <NavLink
                  to={link.to}
                  end={link.to === "/"}
                  className={({ isActive }) =>
                    `relative block py-1 whitespace-nowrap transition-colors ${
                      isActive
                        ? "font-semibold text-[#B39ACF]"
                        : "text-[#A0A0A8] hover:text-[#E6E1EA]"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <motion.span
                        whileTap={{ scale: 0.92 }}
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                        className="inline-block"
                      >
                        {link.label}
                      </motion.span>
                      
                      {/* Smooth Framer Motion layout pill indicator for active tab */}
                      {isActive && (
                        <motion.div
                          layoutId="activeTabIndicator"
                          className="absolute -bottom-1 left-0 right-0 h-[2px] bg-[#B39ACF] rounded-full shadow-[0_0_8px_rgba(179,154,207,0.5)]"
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        {/* Right side: Search bar + Profile */}
        <div className="flex items-center gap-5">
          <form
            role="search"
            onSubmit={handleSearch}
            className="relative hidden md:flex h-10 w-[280px] lg:w-[320px] items-center gap-2.5 rounded-xl border border-[#302438] bg-[#000000] px-[14px] transition-colors focus-within:border-[#B39ACF] focus-within:ring-2 focus-within:ring-[#B39ACF]/20"
          >
            <Search
              className="size-[18px] shrink-0 text-[#A0A0A8]"
              strokeWidth={1.7}
              aria-hidden="true"
            />

            <Input
              ref={searchRef}
              type="search"
              name="q"
              value={searchQuery}
              onChange={(e) => {
                const value = e.target.value;
                setSearchQuery(value);
                setSearchResults([]);
                setSearchLoading(false);
                setSearchError(null);
              }}
              aria-label="Search games"
              placeholder="Search games..."
              className="h-full min-w-0 flex-1 rounded-none border-0 bg-transparent p-0 text-[13px] leading-4 text-[#E6E1EA] shadow-none placeholder:text-[#A0A0A8] focus-visible:border-transparent focus-visible:ring-0 dark:bg-transparent"
            />

            {searchQuery.trim().length >= 2 && (
              <div
                role="listbox"
                aria-label="Game search results"
                className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-xl border border-[#302438] bg-[#17191E] shadow-xl"
              >
                {searchLoading && (
                  <p role="status" className="px-4 py-3 text-xs text-[#A0A0A8]">
                    Searching games…
                  </p>
                )}

                {searchError && (
                  <p role="alert" className="px-4 py-3 text-xs text-[#E58B91]">
                    {searchError}
                  </p>
                )}

                {!searchLoading && !searchError && searchResults.length === 0 && (
                  <p className="px-4 py-3 text-xs text-[#A0A0A8]">
                    No games found.
                  </p>
                )}

                {!searchLoading &&
                  !searchError &&
                  searchResults.map((game) => (
                    <button
                      key={game.appid}
                      type="button"
                      role="option"
                      aria-label={`Open ${game.title}`}
                      onClick={() => handleGameSelect(game)}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-[#20232B] focus:bg-[#20232B] focus:outline-none"
                    >
                      <img
                        src={game.cover}
                        alt=""
                        className="h-10 w-[72px] shrink-0 rounded object-cover"
                        loading="lazy"
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-[13px] font-medium text-[#E6E1EA]">
                          {game.title}
                        </span>
                        {game.subtitle && (
                          <span className="mt-0.5 block truncate text-[11px] text-[#A0A0A8]">
                            {game.subtitle}
                          </span>
                        )}
                      </span>
                    </button>
                  ))}
              </div>
            )}
          </form>

          {/* Authentication and profile */}
          <div className="flex shrink-0 items-center gap-3 sm:gap-4">
            {loading ? (
              <div
                className="h-9 w-9 animate-pulse rounded-full bg-[#302438]"
                aria-hidden="true"
              />
            ) : user ? (
              <div ref={wrapperRef} className="relative">
                <button
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={open}
                  aria-label="Open profile menu"
                  onClick={() => setOpen((v) => !v)}
                  className="flex shrink-0 items-center gap-2.5 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B39ACF]"
                >
                  <Avatar className="size-11 shrink-0 overflow-hidden border-2 border-[#B39ACF] bg-[#20232B] after:hidden">
                    <AvatarImage
                      src={user?.avatar_url || undefined}
                      alt={user?.nickname || user?.username || "Player"}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-[#20232B]">
                      <Gamepad2
                        className="size-11 text-[#B39ACF]"
                        strokeWidth={1.7}
                      />
                    </AvatarFallback>
                  </Avatar>

                  <ChevronDown
                    className={`size-[14px] text-[#A0A0A8] transition-transform ${
                      open ? "rotate-180" : ""
                    }`}
                    strokeWidth={1.7}
                    aria-hidden="true"
                  />
                </button>

                {open && (
                  <div
                    ref={menuRef}
                    role="menu"
                    aria-label="Profile menu"
                    onKeyDown={onMenuKeyDown}
                    className="absolute right-0 z-50 mt-3 w-52 overflow-hidden rounded-xl border border-[#302438] bg-[#17191E] py-1 shadow-xl"
                  >
                    {menuItems.map((item) => (
                      <Link
                        key={item.label}
                        to={item.to}
                        role="menuitem"
                        onClick={() => setOpen(false)}
                        className={menuItemClass}
                      >
                        {item.label}
                      </Link>
                    ))}

                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className={`${menuItemClass} border-t border-[#302438] text-[#E58B91] hover:bg-[#2B171C] focus:bg-[#2B171C] disabled:opacity-60`}
                    >
                      {loggingOut ? "Logging out…" : "Logout"}
                    </button>

                    {logoutError && (
                      <p
                        role="alert"
                        className="px-4 py-2 text-xs text-[#E58B91]"
                      >
                        {logoutError}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="whitespace-nowrap text-sm text-[#A0A0A8] transition-colors hover:text-[#E6E1EA]"
                >
                  Log In
                </Link>

                <Link
                  to="/register"
                  className="whitespace-nowrap rounded-xl bg-[#B39ACF] px-4 py-2.5 text-sm font-semibold text-[#17191E] transition-colors hover:bg-[#C2ADE0] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B39ACF]"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}