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
  User as UserIcon,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

const navLinks = [
  { to: "/discover", label: "Discover" },
  { to: "/", label: "Home" },
  { to: "/mygamelist", label: "My List" },
];

const menuItems = [
  { to: "/profile", label: "Profile" },
  { to: "/mygamelist", label: "My Game List" },
  { to: "/settings", label: "Settings" },
];

const menuItemClass =
  "block w-full px-4 py-2.5 text-left text-sm text-[#d9d6ee] hover:bg-[#373646] focus:bg-[#373646] focus:outline-none";

export default function Navbar() {
  const { user, loading, logoutUser } = useAuth();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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

    const query = searchQuery.trim();

    if (query) {
      navigate(`/discover?q=${encodeURIComponent(query)}`);
      setSearchQuery("");
    }
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

  const initial = (
    user?.nickname ||
    user?.username ||
    ""
  )
    .charAt(0)
    .toUpperCase();

  return (
    <header className="border-b border-[#55516c] bg-[#201e2f]">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex min-h-[88px] w-full max-w-[1440px] flex-wrap items-center gap-5 px-5 py-4 md:px-8 xl:h-[88px] xl:flex-nowrap xl:gap-[34px] xl:px-16 xl:py-0"
      >
        {/* Brand */}
        <Link
          to="/home"
          aria-label="GameShelf home"
          className="flex w-[163px] shrink-0 items-center gap-2.5 text-[#e0deeb]"
        >
          <Library
            className="size-[26px] shrink-0 text-[#8870b6]"
            strokeWidth={1.7}
            aria-hidden="true"
          />

          <span className="text-[21px] leading-[25px] tracking-[-0.6px]">
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
                      ? "font-semibold text-[#c2ade7]"
                      : "text-[#b4aec7] hover:text-[#e0deeb]"
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
          className="order-last flex h-10 w-full min-w-0 items-center gap-2.5 rounded-lg bg-[#373646] px-[14px] focus-within:ring-2 focus-within:ring-[#c2ade7] xl:order-none xl:w-auto xl:flex-1"
        >
          <Search
            className="size-[18px] shrink-0 text-[#8f8ca9]"
            strokeWidth={1.7}
            aria-hidden="true"
          />

          <Input
            ref={searchRef}
            type="search"
            name="q"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search games"
            placeholder="Search games..."
            className="h-full min-w-0 flex-1 rounded-none border-0 bg-transparent p-0 text-[13px] leading-4 text-[#e0deeb] shadow-none placeholder:text-[#b4aec7] focus-visible:border-transparent focus-visible:ring-0 dark:bg-transparent"
          />

          <kbd className="shrink-0 whitespace-nowrap text-[11px] leading-[13px] text-[#b4aec7]">
            ⌘ K
          </kbd>
        </form>

        {/* Authentication and profile */}
        <div className="ml-auto flex shrink-0 items-center gap-3 sm:gap-5 xl:ml-0">
          {loading ? (
            <div
              className="h-9 w-9 animate-pulse rounded-full bg-[#373646]"
              aria-hidden="true"
            />
          ) : user ? (
            <>
              <Link
                to="/profile"
                className="hidden text-sm leading-[17px] text-[#b4aec7] hover:text-[#e0deeb] sm:block"
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
                  className="flex shrink-0 items-center gap-2.5 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c2ade7]"
                >
                  <Avatar className="size-[34px] border border-[#4a4766]">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : null}

                    <AvatarFallback className="bg-[#4d3e68] text-xs font-bold text-[#c2ade7]">
                      {initial || (
                        <UserIcon
                          className="size-4"
                          aria-hidden="true"
                        />
                      )}
                    </AvatarFallback>
                  </Avatar>

                  <ChevronDown
                    className={`size-[14px] text-[#8f8ca9] transition-transform ${
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
                    className="absolute right-0 z-50 mt-3 w-52 overflow-hidden rounded-lg border border-[#55516c] bg-[#2c2a40] py-1 shadow-xl"
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
                      className={`${menuItemClass} border-t border-[#55516c] disabled:opacity-60`}
                    >
                      {loggingOut ? "Logging out…" : "Logout"}
                    </button>

                    {logoutError && (
                      <p
                        role="alert"
                        className="px-4 py-2 text-xs text-[#f0a0a5]"
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
                className="whitespace-nowrap text-sm text-[#b4aec7] hover:text-[#e0deeb]"
              >
                Log In
              </Link>

              <Link
                to="/register"
                className="whitespace-nowrap rounded-lg bg-[#4d3e68] px-4 py-2.5 text-sm font-medium text-[#e0deeb] transition-colors hover:bg-[#5b497b] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c2ade7]"
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