import type { ReactNode } from "react";
import logo from "../Logo/Gameshelf_Logo.png";
import { Link, NavLink } from "react-router-dom";

/* Shell for every moderator page: sidebar, top bar, footer.
   Sidebar links are real routes; "My Account" goes to your existing /profile page. */

const NAV: { label: string; to: string; end?: boolean }[] = [
  { label: "Overview", to: "/moderator", end: true },
  { label: "Reports Queue", to: "/moderator/reports" },
  { label: "Sanctions & Enforcement", to: "/moderator/sanctions" },
  { label: "Appeals Management", to: "/moderator/appeals" },
  { label: "Moderation History", to: "/moderator/history" },
  { label: "My Account", to: "/profile" },
];

export default function ModLayout({ crumbs, children }: { crumbs: string[]; children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#0e0e13] text-zinc-200">
      {/* Sidebar */}
      <aside className="hidden w-[200px] shrink-0 flex-col border-r border-[#22222a] bg-[#131318] md:flex">
        <div className="flex items-center gap-2 px-4 py-4">
          <img src={logo} alt="" className="h-7 w-7 rounded-md object-contain" />
          <span className="text-[15px] font-semibold text-zinc-50">GameShelf</span>
        </div>
        <div className="px-4 pb-4">
          <p className="text-[11px] font-medium text-zinc-200">Community safety</p>
          <p className="text-[9px] text-zinc-500">Moderator workspace</p>
        </div>
        <nav className="flex flex-col gap-0.5 px-2">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `rounded-md px-3 py-2 text-left text-[11px] transition-colors ${
                  isActive
                    ? "bg-[#2a2540] text-zinc-50 shadow-[inset_2px_0_0_#8b6cf0]"
                    : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto space-y-3 px-4 py-4 text-[10px] text-zinc-500">
          <div>
            <p>Safety &amp; support access</p>
            <Link to="/home" className="text-zinc-300 hover:text-white">
              ↗ View GameShelf
            </Link>
          </div>
          <p className="text-zinc-400">⊟ Collapse navigation</p>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 items-center justify-between border-b border-[#22222a] px-6">
          <p className="text-[10px] text-zinc-500">
            {crumbs.map((c, i) => (
              <span key={c}>
                {i > 0 && <span className="mx-1.5">/</span>}
                <span className={i === crumbs.length - 1 ? "text-zinc-300" : ""}>{c}</span>
              </span>
            ))}
          </p>
          <div className="flex items-center gap-4">
            <input
              placeholder="Search safety workspace…"
              className="w-56 rounded-md border border-[#2a2a33] bg-[#17171d] px-3 py-1.5 text-[11px] placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none"
            />
            <span className="relative text-zinc-500">
              🔔<span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-red-500" />
            </span>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2a2347] text-[9px] font-semibold text-[#b7a4ff]">
                MR
              </span>
              <span className="leading-tight">
                <span className="block text-[10px] text-zinc-200">Maya Ross</span>
                <span className="block text-[9px] text-zinc-500">Moderator</span>
              </span>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1100px] flex-1 px-8 py-7">{children}</main>

        <footer className="flex items-center justify-between px-8 pb-4 text-[9px] text-zinc-600">
          <span>Demo data</span>
          <span>Snapshot 02 Nov 2026 · 10:30 UTC</span>
        </footer>
      </div>
    </div>
  );
}