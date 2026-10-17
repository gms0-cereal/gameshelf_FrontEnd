import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Library, Search, User as UserIcon } from "lucide-react";
import { useAuth } from "../context/AuthContext";

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

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm transition-colors hover:text-white ${
    isActive ? "text-white" : "text-[#b4b1cc]"
  }`;

const menuItemClass =
  "block w-full px-4 py-2 text-left text-sm text-[#d9d6ee] hover:bg-[#35324b] focus:bg-[#35324b] focus:outline-none";

const Navbar = () => {
  const { user, loading, logoutUser } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  // Focus first item when opening.
  useEffect(() => {
    if (open) menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
  }, [open]);

  const onMenuKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []
    );
    const index = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === "Escape") {
      setOpen(false);
      wrapperRef.current?.querySelector<HTMLElement>("button")?.focus();
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

  const initial = (user?.nickname || user?.username || "").charAt(0).toUpperCase();

  return (
    <header className="border-b border-[#3a3750] bg-[#211f31]">
      <nav
        aria-label="Main"
        className="mx-auto flex h-[70px] max-w-[1200px] items-center gap-4 px-4 sm:px-6 lg:gap-8 lg:px-[52px]"
      >
        <Link to="/" className="flex items-center gap-2 text-[#e6e3f5]" aria-label="GameShelf home">
          <Library className="h-5 w-5 text-[#8b6fd6]" aria-hidden="true" />
          <span className="text-lg font-light tracking-wide">GAMESHELF</span>
        </Link>

        <ul className="hidden items-center gap-6 md:flex">
          {navLinks.map((l) => (
            <li key={l.label}>
              <NavLink to={l.to} end={l.to === "/"} className={linkClass}>
                {l.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            const q = new FormData(e.currentTarget).get("q")?.toString().trim();
            if (q) navigate(`/discover?q=${encodeURIComponent(q)}`);
          }}
          className="relative mx-auto hidden h-9 max-w-[476px] flex-1 lg:block"
        >
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8f8ca9]"
            aria-hidden="true"
          />
          <input
            name="q"
            type="search"
            placeholder="Search games..."
            aria-label="Search games"
            className="h-full w-full rounded-md border border-transparent bg-[#2c2a40] pl-10 pr-14 text-sm text-[#d9d6ee] placeholder:text-[#9a97b5] focus:border-[#8b6fd6] focus:outline-none"
          />
          <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#8f8ca9]">
            ⌘ K
          </kbd>
        </form>

        <div className="ml-auto flex items-center gap-3 sm:gap-5 lg:ml-0">
          {loading ? (
            // Reserve space so controls don't flash while the session is checked.
            <div className="h-9 w-40 animate-pulse rounded-md bg-[#2c2a40]" aria-hidden="true" />
          ) : user ? (
            <div ref={wrapperRef} className="relative">
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={open}
                aria-label="Open profile menu"
                onClick={() => setOpen((v) => !v)}
                className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-[#4a4766] bg-[#35324b] text-sm font-medium text-[#e6e3f5] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8b6fd6]"
              >
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : initial ? (
                  <span aria-hidden="true">{initial}</span>
                ) : (
                  <UserIcon className="h-4 w-4" aria-hidden="true" />
                )}
              </button>

              {open && (
                <div
                  ref={menuRef}
                  role="menu"
                  aria-label="Profile menu"
                  onKeyDown={onMenuKeyDown}
                  className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-lg border border-[#3a3750] bg-[#2c2a40] py-1 shadow-xl"
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
                    className={`${menuItemClass} border-t border-[#3a3750] disabled:opacity-60`}
                  >
                    {loggingOut ? "Logging out…" : "Logout"}
                  </button>
                  {logoutError && (
                    <p role="alert" className="px-4 py-2 text-xs text-[#f0a0a5]">
                      {logoutError}
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="text-sm text-[#e6e3f5] hover:text-white">
                Log In
              </Link>
              <Link
                to="/register"
                className="rounded-md bg-[#a8454b] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#b9525a] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e6e3f5]"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;