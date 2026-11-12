import type { ReactNode } from "react";
import logo from "../Logo/Gameshelf_Logo.png";
import { Link, NavLink } from "react-router-dom";
import { Bell, ChevronRight, CircleHelp, LayoutDashboard, LogOut, Menu, ScrollText, ShieldAlert, UserRound } from "lucide-react";

/* Shell for every moderator page: sidebar, top bar, footer.
   Sidebar links are real routes; "My Account" goes to your existing /profile page. */

const NAV: { label: string; to: string; end?: boolean }[] = [
  { label: "Overview", to: "/moderator", end: true },
  { label: "Reports Queue", to: "/moderator/reports" },
  { label: "Sanctions & Enforcement", to: "/moderator/sanctions" },
  { label: "Appeals Management", to: "/moderator/appeals" },
  { label: "Moderation History", to: "/moderator/history" },
];

export default function ModLayout({ crumbs, children }: { crumbs: string[]; children: ReactNode }) {
  const navIcons = [LayoutDashboard, ShieldAlert, ScrollText, CircleHelp, ScrollText];

  return (
    <div className="flex min-h-screen bg-[#141417] font-sans text-slate-100">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-[#33333b] bg-[#1b1a20] p-4 md:flex">
        <div className="mb-4 flex items-center gap-3 border-b border-[#33333b] px-3 py-4">
          <div className="rounded-lg border border-[#51465f] bg-[#383044] p-2">
            <img src={logo} alt="" className="h-6 w-6 object-contain" />
          </div>
          <div>
            <h2 className="text-base font-bold leading-tight text-white">GameShelf</h2>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#bda6e4]">Moderator Suite</span>
          </div>
        </div>
        <nav className="space-y-1">
          {NAV.map((item, index) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-[#383044] text-[#e5d9fa]"
                    : "text-slate-400 hover:bg-[#29272f] hover:text-white"
                }`
              }
            >
              {(() => {
                const Icon = navIcons[index];
                return <Icon className="h-4 w-4" />;
              })()}
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto border-t border-[#33333b] pt-4">
          <Link to="/profile" className="mb-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium text-slate-400 hover:bg-[#29272f] hover:text-white">
            <UserRound className="h-4 w-4" />
            My Account
          </Link>
          <Link to="/home" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium text-slate-400 hover:bg-[#29272f] hover:text-white">
            <LogOut className="h-4 w-4" />
            View GameShelf
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-[#33333b] bg-[#141417] px-6">
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <button type="button" className="rounded-lg p-1.5 text-slate-300 transition hover:bg-[#383044] lg:hidden">
              <Menu className="h-5 w-5" />
            </button>
            <p className="flex items-center text-xs">
            {crumbs.map((c, i) => (
              <span key={c} className="flex items-center">
                {i > 0 && <ChevronRight className="mx-1 h-3 w-3" />}
                <span className={i === crumbs.length - 1 ? "font-medium text-white" : ""}>{c}</span>
              </span>
            ))}
            </p>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <input
              placeholder="Search moderator..."
              className="hidden w-72 rounded-lg border border-[#454650] bg-[#1a1a20] px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 transition focus:border-[#bda6e4] focus:outline-none sm:block"
            />
            <button type="button" className="rounded-lg p-2 transition hover:bg-[#383044] hover:text-white">
              <Bell className="h-4 w-4" />
            </button>
            <button type="button" className="rounded-lg p-2 transition hover:bg-[#383044] hover:text-white">
              <CircleHelp className="h-4 w-4" />
            </button>
            <div className="hidden items-center gap-2 sm:flex">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#383044] text-[10px] font-semibold text-[#bda6e4]">
                MR
              </span>
              <span className="leading-tight">
                <span className="block text-[10px] text-slate-200">Maya Ross</span>
                <span className="block text-[9px] text-slate-500">Moderator</span>
              </span>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1600px] flex-1 space-y-6 overflow-y-auto p-8">{children}</main>

        <footer className="flex items-center justify-between px-8 pb-4 text-[9px] text-slate-600">
          <span>Demo data</span>
          <span>Snapshot 02 Nov 2026 · 10:30 UTC</span>
        </footer>
      </div>
    </div>
  );
}