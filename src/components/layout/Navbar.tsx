import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type FormEvent,
} from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Library,
  Search,
  ChevronDown,
  Gamepad2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { searchSteamGames, type PickerGame } from "@/services/playlistService";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/discover", label: "Discover" },
  { to: "/browse", label: "Browse" },
  { to: "/my-library", label: "My Library" },
];

const menuItems = [
  { to: "/profile", label: "Profile" },
  { to: "/my-library", label: "My Game Library" },
  { to: "/settings", label: "Settings" },
];

const menuItemClass =
  "block w-full px-4 py-2.5 text-left text-sm text-[#F0EEF5] hover:bg-[#383044] focus:bg-[#383044] focus:outline-none transition-colors";

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

  // Close the profile menu when clicking outside.
  useEffect(() => {
    if (!open) return;

    const onClick = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onClick);

    return () => {
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  // Focus the first menu item when opening the menu.
  useEffect(() => {
    if (open) {
      menuRef.current
        ?.querySelector<HTMLElement>('[role="menuitem"]')
        ?.focus();
    }
  }, [open]);

  // Ctrl+K / Cmd+K opens search.
  useEffect(() => {
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key.toLowerCase() === "k"
      ) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
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
        if (!cancelled) setSearchResults(games.slice(0, 8));
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
  }, [searchQuery]);

  const onMenuKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>(
        '[role="menuitem"]'
      ) ?? []
    );

    const index = items.indexOf(
      document.activeElement as HTMLElement
    );

    if (e.key === "Escape") {
      setOpen(false);

      wrapperRef.current
        ?.querySelector<HTMLButtonElement>("button")
        ?.focus();
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
    <header className="border-b border-[#38363F] bg-[#1B1A20]">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex min-h-[88px] w-full max-w-[1440px] flex-wrap items-center gap-5 px-5 py-4 md:px-8 xl:h-[88px] xl:flex-nowrap xl:gap-[34px] xl:px-16 xl:py-0"
      >
        {/* Brand */}
        <Link
          to="/home"
          aria-label="GameShelf home"
          className="flex w-[163px] shrink-0 items-center gap-2.5 text-[#F0EEF5]"
        >
          <Library
            className="size-[26px] shrink-0 text-[#8870B6]"
            strokeWidth={1.7}
            aria-hidden="true"
          />

          <span className="text-[21px] font-bold leading-[25px] tracking-[-0.6px] text-[#F0EEF5]">
            GAMESHELF
          </span>
        </Link>

        {/* Main navigation */}
        <ul className="flex items-center gap-5 text-sm leading-[17px] xl:gap-[34px]">
          {navLinks.map((link) => (
            <li key={link.label}>
              <NavLink
                to={link.to}
                end={link.to === "/"}
                className={({ isActive }) =>
                  `whitespace-nowrap transition-colors ${
                    isActive
                      ? "font-semibold text-[#C2ADE7]"
                      : "text-[#AAA6B5] hover:text-[#F0EEF5]"
                  }`
                }
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Search */}
        <form
          role="search"
          onSubmit={handleSearch}
          className="relative order-last flex h-10 w-full min-w-0 items-center gap-2.5 rounded-lg bg-[#383044]/40 px-[14px] border border-[#38363F] focus-within:border-[#C2ADE7] focus-within:ring-2 focus-within:ring-[#C2ADE7]/20 xl:order-none xl:w-auto xl:flex-1"
        >
          <Search
            className="size-[18px] shrink-0 text-[#AAA6B5]"
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
            className="h-full min-w-0 flex-1 rounded-none border-0 bg-transparent p-0 text-[13px] leading-4 text-[#F0EEF5] shadow-none placeholder:text-[#AAA6B5] focus-visible:border-transparent focus-visible:ring-0 dark:bg-transparent"
          />

          <kbd className="shrink-0 whitespace-nowrap text-[11px] leading-[13px] text-[#AAA6B5]">
          </kbd>

          {searchQuery.trim().length >= 2 && (
            <div
              role="listbox"
              aria-label="Game search results"
              className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-lg border border-[#38363F] bg-[#1B1A20] shadow-xl"
            >
              {searchLoading && (
                <p role="status" className="px-4 py-3 text-xs text-[#AAA6B5]">
                  Searching games…
                </p>
              )}

              {searchError && (
                <p role="alert" className="px-4 py-3 text-xs text-[#EDB1B4]">
                  {searchError}
                </p>
              )}

              {!searchLoading && !searchError && searchResults.length === 0 && (
                <p className="px-4 py-3 text-xs text-[#AAA6B5]">
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
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-[#383044] focus:bg-[#383044] focus:outline-none"
                  >
                    <img
                      src={game.cover}
                      alt=""
                      className="h-10 w-[72px] shrink-0 rounded object-cover"
                      loading="lazy"
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-medium text-[#F0EEF5]">
                        {game.title}
                      </span>
                      {game.subtitle && (
                        <span className="mt-0.5 block truncate text-[11px] text-[#AAA6B5]">
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
        <div className="ml-auto flex shrink-0 items-center gap-3 sm:gap-5 xl:ml-0">
          {loading ? (
            <div
              className="h-9 w-9 animate-pulse rounded-full bg-[#383044]"
              aria-hidden="true"
            />
          ) : user ? (
            <>
              <Link
                to="/profile"
                className="hidden text-sm leading-[17px] text-[#AAA6B5] hover:text-[#F0EEF5] sm:block"
              >
                Profile
              </Link>

              <div ref={wrapperRef} className="relative">
                <button
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={open}
                  aria-label="Open profile menu"
                  onClick={() => setOpen((v) => !v)}
                  className="flex shrink-0 items-center gap-2.5 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C2ADE7]"
                >
                  <Avatar className="size-11 shrink-0 overflow-hidden border-2 border-[#8870B6] bg-[#383044] after:hidden">
                    <AvatarImage
                      src={user?.avatar_url || undefined}
                      alt={user?.nickname || user?.username || "Player"}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-[#383044]">
                      <Gamepad2 className="size-11 text-[#C2ADE7]" strokeWidth={1.7} />
                    </AvatarFallback>
                  </Avatar>

                  <ChevronDown
                    className={`size-[14px] text-[#AAA6B5] transition-transform ${
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
                    className="absolute right-0 z-50 mt-3 w-52 overflow-hidden rounded-lg border border-[#38363F] bg-[#1B1A20] py-1 shadow-xl"
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
                      className={`${menuItemClass} border-t border-[#38363F] text-[#EDB1B4] hover:bg-[#3A272D] focus:bg-[#3A272D] disabled:opacity-60`}
                    >
                      {loggingOut ? "Logging out…" : "Logout"}
                    </button>

                    {logoutError && (
                      <p
                        role="alert"
                        className="px-4 py-2 text-xs text-[#EDB1B4]"
                      >
                        {logoutError}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="whitespace-nowrap text-sm text-[#AAA6B5] hover:text-[#F0EEF5]"
              >
                Log In
              </Link>

              <Link
                to="/register"
                className="whitespace-nowrap rounded-lg bg-[#BDA6E4] px-4 py-2.5 text-sm font-semibold text-[#1B1A20] transition-colors hover:bg-[#C2ADE7] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C2ADE7]"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}