// ============================================================================
// GameShelf Admin — layout + shared UI in ONE file.
//   • UI primitives (Panel, PageHeading, MetricCard, DataTable, Tabs, Toggle, …)
//   • Sidebar + top bar (nav matches the Figma "Administrator workspace")
//   • AdminLayout (wrap every admin page with it)
// ============================================================================
import React, { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  Bell, ChartNoAxesCombined, ChevronDown, CircleCheck, Database, Download, Gamepad2, Info, LayoutDashboard,
  PanelLeftClose, PanelLeftOpen, ScrollText, Search, Settings2, ShieldCheck, UserRound, Users, Workflow, X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ───────────────────────── UI primitives ─────────────────────────

/* ---------- Panel ---------- */
export const Panel: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', ...rest }) => (
  <div {...rest} className={`rounded-[10px] border border-[#38363f] bg-[#222228] ${className}`} />
);

/* ---------- Page heading ---------- */
interface PageHeadingProps {
  eyebrow: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
}
export const PageHeading: React.FC<PageHeadingProps> = ({ eyebrow, title, description, actions }) => (
  <div className="flex flex-wrap items-center gap-5">
    <div className="flex min-w-0 flex-1 flex-col gap-[7px]">
      <p className="text-[10px] uppercase leading-normal text-[#c2ade7]">{eyebrow}</p>
      <h1 className="text-[30px] font-semibold leading-[1.2] tracking-[-0.8px] text-[#f0eef5]">{title}</h1>
      <p className="text-xs text-[#aaa6b5]">{description}</p>
    </div>
    {actions}
  </div>
);

/* ---------- Buttons ---------- */
export const SecondaryButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className = '', ...rest }) => (
  <button
    type="button"
    {...rest}
    className={`inline-flex min-h-[38px] items-center gap-2 rounded-md border border-[#38363f] bg-[#1a1a20] px-[14px] py-[9px] text-xs font-semibold text-[#f0eef5] transition hover:bg-[#2b2a33] ${className}`}
  />
);

export const ExportButton: React.FC<{ label: string }> = ({ label }) => (
  <SecondaryButton onClick={() => window.print()}>
    <Download className="h-[15px] w-[15px]" />
    {label}
  </SecondaryButton>
);

/* ---------- Section heading (inside panels) ---------- */
interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}
export const SectionHeading: React.FC<SectionHeadingProps> = ({ title, subtitle, action }) => (
  <div className="flex items-center gap-4">
    <div className="min-w-0 flex-1">
      <h3 className="text-base font-semibold leading-normal text-[#f0eef5]">{title}</h3>
      {subtitle && <p className="text-[11px] leading-normal text-[#aaa6b5]">{subtitle}</p>}
    </div>
    {action && <div className="shrink-0 text-[11px] text-[#c2ade7]">{action}</div>}
  </div>
);

/* ---------- Metric cards ---------- */
export const MetricCard: React.FC<{ label: string; value: string; context: string; danger?: boolean }> = ({ label, value, context, danger }) => (
  <div className="flex flex-col gap-[9px] rounded-[10px] border border-[#38363f] bg-[#222228] p-[18px]">
    <p className="text-[11px] text-[#aaa6b5]">{label}</p>
    <p className="text-[28px] font-semibold leading-normal text-[#f0eef5]">{value}</p>
    <p className={`text-[10px] ${danger ? 'text-[#edb1b4]' : 'text-[#aaa6b5]'}`}>{context}</p>
  </div>
);

const GRID_COLS = { 3: 'xl:grid-cols-3', 4: 'xl:grid-cols-4', 5: 'xl:grid-cols-5' } as const;
export const MetricGrid: React.FC<{ cols: keyof typeof GRID_COLS; children: React.ReactNode }> = ({ cols, children }) => (
  <div className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${GRID_COLS[cols]}`}>{children}</div>
);

/* ---------- Status badge ---------- */
const BADGE_TONES = {
  high: 'bg-[#3a272d] text-[#edb1b4]',
  medium: 'bg-[#393229] text-[#dfc192]',
  info: 'bg-[#383044] text-[#c2ade7]',
  success: 'bg-[#24372e] text-[#abd2bc]',
  neutral: 'bg-[#2b2a33] text-[#aaa6b5]',
} as const;
export type BadgeTone = keyof typeof BADGE_TONES;

export const StatusBadge: React.FC<{ tone: BadgeTone; children: React.ReactNode }> = ({ tone, children }) => (
  <span className={`inline-flex rounded px-2 py-1 text-[11px] font-medium ${BADGE_TONES[tone]}`}>{children}</span>
);

/* ---------- Data table ---------- */
export interface Column<T> {
  header: string;
  className?: string;
  cell: (row: T) => React.ReactNode;
}
interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  footerLeft?: React.ReactNode;
  footerRight?: React.ReactNode;
  rowClassName?: (row: T) => string;
}
export function DataTable<T>({ columns, rows, rowKey, footerLeft, footerRight, rowClassName }: DataTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-[10px] border border-[#38363f] bg-[#222228]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left">
          <thead className="bg-[#1a1a20]">
            <tr>
              {columns.map((c) => (
                <th key={c.header} className={`p-[14px] text-[10px] font-semibold uppercase leading-[1.4] text-[#aaa6b5] ${c.className ?? ''}`}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={rowKey(row)} className={`border-b border-[#38363f] ${rowClassName?.(row) ?? ''}`}>
                {columns.map((c) => (
                  <td key={c.header} className={`h-16 p-[14px] align-middle text-xs leading-normal ${c.className ?? ''}`}>
                    {c.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(footerLeft || footerRight) && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-[14px] text-[11px]">
          <span className="text-[#aaa6b5]">{footerLeft}</span>
          <span className="whitespace-pre text-[#c2ade7]">{footerRight}</span>
        </div>
      )}
    </div>
  );
}

/* ---------- Footer ---------- */
export const WorkspaceFooter: React.FC<{ right?: string }> = ({ right = '02 Nov 2026 · 10:30 UTC' }) => (
  <div className="flex items-start justify-between pt-[10px] text-[10px] text-[#76717f]">
    <span>Demo data</span>
    <span>{right}</span>
  </div>
);

/* ---------- Tabs (underline style) ---------- */
interface TabsProps<K extends string> {
  tabs: { key: K; label: string }[];
  active: K;
  onChange: (key: K) => void;
}
export function Tabs<K extends string>({ tabs, active, onChange }: TabsProps<K>) {
  return (
    <div className="flex flex-wrap gap-6 border-b border-[#38363f]">
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => onChange(t.key)}
          className={`border-b-2 py-3 text-xs whitespace-nowrap ${
            active === t.key ? 'border-[#c2ade7] font-semibold text-[#c2ade7]' : 'border-transparent text-[#aaa6b5] hover:text-[#f0eef5]'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- Filter select (looks like the Figma secondary button) ---------- */
export const FilterSelect: React.FC<{ value: string; onChange: (v: string) => void; options: string[]; label?: string }> = ({
  value,
  onChange,
  options,
  label,
}) => (
  <select
    aria-label={label}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="min-h-[38px] rounded-md border border-[#38363f] bg-[#1a1a20] px-[14px] py-[9px] text-xs font-semibold text-[#f0eef5] outline-none focus:border-[#c2ade7]"
  >
    {options.map((o) => (
      <option key={o} value={o}>
        {o}
      </option>
    ))}
  </select>
);

/* ---------- Search field ---------- */
export const SearchField: React.FC<{ value: string; onChange: (v: string) => void; placeholder: string; hint?: string }> = ({
  value,
  onChange,
  placeholder,
  hint,
}) => (
  <div className="flex h-10 min-w-[220px] flex-1 items-center gap-[10px] rounded-md border border-[#38363f] bg-[#1a1a20] p-3 focus-within:border-[#c2ade7]">
    <Search className="h-4 w-4 shrink-0 text-[#aaa6b5]" />
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="min-w-0 flex-1 bg-transparent text-xs text-[#f0eef5] outline-none placeholder:text-[#aaa6b5]"
    />
    {hint && <span className="text-[10px] text-[#76717f]">{hint}</span>}
  </div>
);

/* ---------- Primary (danger) button ---------- */
export const PrimaryButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className = '', ...rest }) => (
  <button
    type="button"
    {...rest}
    className={`inline-flex min-h-[38px] items-center rounded-md border border-[#9f4044] bg-[#9f4044] px-[14px] py-[9px] text-xs font-semibold text-[#f0eef5] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
  />
);

/* ---------- Action feedback banner ---------- */
export const Banner: React.FC<{ tone: 'success' | 'warning'; children: React.ReactNode }> = ({ tone, children }) => (
  <div className={`flex items-center gap-[10px] rounded-md p-[14px] ${tone === 'success' ? 'bg-[#24372e]' : 'bg-[#393229]'}`}>
    {tone === 'success' ? (
      <CircleCheck className="h-[18px] w-[18px] shrink-0 text-[#abd2bc]" />
    ) : (
      <Info className="h-[18px] w-[18px] shrink-0 text-[#dfc192]" />
    )}
    <p className={`flex-1 text-xs leading-normal ${tone === 'success' ? 'text-[#abd2bc]' : 'text-[#aaa6b5]'}`}>{children}</p>
  </div>
);

/* ---------- Form bits ---------- */
export const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="flex flex-col gap-2">
    <span className="text-xs font-semibold text-[#f0eef5]">{label}</span>
    {children}
  </label>
);

const inputBase =
  'w-full rounded-md border border-[#38363f] bg-[#1a1a20] p-3 text-xs text-[#f0eef5] outline-none placeholder:text-[#aaa6b5] focus:border-[#c2ade7]';

export const TextInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className = '', ...rest }) => (
  <input {...rest} className={`min-h-[42px] ${inputBase} ${className}`} />
);
export const TextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({ className = '', ...rest }) => (
  <textarea {...rest} className={`min-h-[90px] resize-y ${inputBase} ${className}`} />
);
export const SelectInput: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ className = '', ...rest }) => (
  <select {...rest} className={`min-h-[42px] ${inputBase} ${className}`} />
);

/** "Label  ·  value" line used on detail panels */
export const InfoLine: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <p className="text-xs leading-[1.6] text-[#f0eef5]">
    <span className="text-[#aaa6b5]">{label}&nbsp;&nbsp;·&nbsp;&nbsp;</span>
    {children}
  </p>
);

/* ---------- Modal ---------- */
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}
export const Modal: React.FC<ModalProps> = ({ open, onClose, title, icon, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:pt-[10vh]" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-[550px] flex-col gap-5 rounded-xl border border-[#38363f] bg-[#222228] p-7 shadow-[0_24px_60px_rgba(0,0,0,0.44)]"
      >
        <div className="flex items-start gap-4">
          {icon}
          <h2 className="flex-1 text-[21px] font-semibold leading-normal text-[#f0eef5]">{title}</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="text-[#aaa6b5] hover:text-[#f0eef5]">
            <X className="h-[18px] w-[18px]" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

/* ---------- Toggle switch + preference row ---------- */
export const Toggle: React.FC<{ checked: boolean; onChange?: (v: boolean) => void; disabled?: boolean; label: string }> = ({
  checked,
  onChange,
  disabled,
  label,
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    onClick={() => onChange?.(!checked)}
    className={`flex h-5 w-9 shrink-0 items-start rounded-[20px] border p-[3px] transition disabled:cursor-not-allowed disabled:opacity-50 ${
      checked ? 'justify-end border-[#c2ade7] bg-[#383044]' : 'border-[#38363f] bg-[#1a1a20]'
    }`}
  >
    <span className={`h-[14px] w-[14px] rounded-[20px] ${checked ? 'bg-[#c2ade7]' : 'bg-[#aaa6b5]'}`} />
  </button>
);

export const PreferenceRow: React.FC<{
  title: string;
  description: string;
  checked: boolean;
  onChange?: (v: boolean) => void;
  disabled?: boolean;
}> = ({ title, description, checked, onChange, disabled }) => (
  <div className="flex items-center gap-5 py-[7px]">
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <p className="text-xs font-semibold leading-normal text-[#f0eef5]">{title}</p>
      <p className="text-[11px] leading-normal text-[#aaa6b5]">{description}</p>
    </div>
    <Toggle checked={checked} onChange={onChange} disabled={disabled} label={title} />
  </div>
);

// ───────────────────────── Workspace shell ─────────────────────────

export interface WorkspaceNavItem {
  name: string;
  path: string;
  icon: LucideIcon;
  end?: boolean;
}

export interface WorkspaceConfig {
  /** Breadcrumb root, e.g. "Administrator" */
  rootLabel: string;
  /** Sidebar line 1, e.g. "Administration" */
  areaLabel: string;
  /** Sidebar line 2, e.g. "Administrator workspace" */
  workspaceLabel: string;
  searchPlaceholder: string;
  nav: WorkspaceNavItem[];
  user: { initials: string; name: string; role: string };
  accountPath: string;
  /** First line of the sidebar footer */
  statusLine: string;
}

interface WorkspaceShellProps {
  config: WorkspaceConfig;
  children: React.ReactNode;
}

export const WorkspaceShell: React.FC<WorkspaceShellProps> = ({ config, children }) => {
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  // Longest matching nav path wins, so /admin/users/U-1140 still shows "User Management"
  const current =
    config.nav
      .filter((i) => pathname === i.path || pathname.startsWith(`${i.path}/`))
      .sort((a, b) => b.path.length - a.path.length)[0] ?? config.nav[0];

  return (
    <div className="flex min-h-screen bg-[#141417] font-sans text-[#f0eef5]">
      {/* ---------------- Sidebar ---------------- */}
      <aside
        className={`sticky top-0 flex h-screen shrink-0 flex-col gap-6 overflow-y-auto border-r border-[#38363f] bg-[#1b1a20] px-4 py-6 transition-[width] ${
          collapsed ? 'w-[68px]' : 'w-[232px]'
        }`}
      >
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#51465f] bg-[#383044] text-[#c2ade7]">
            <Gamepad2 className="h-5 w-5" />
          </div>
          {!collapsed && (
            <span className="whitespace-nowrap text-xl font-bold tracking-[-0.8px]">
              Game<span className="text-[#c2ade7]">Shelf</span>
            </span>
          )}
        </div>

        {!collapsed && (
          <div>
            <p className="text-xs leading-[1.7]">{config.areaLabel}</p>
            <p className="text-[10px] leading-[1.7] text-[#c2ade7]">{config.workspaceLabel}</p>
          </div>
        )}

        <nav className="flex flex-col gap-[5px]">
          {config.nav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.end}
                title={collapsed ? item.name : undefined}
                className={({ isActive }) =>
                  `flex min-h-[43px] items-center gap-[10px] rounded-md p-[10px] text-xs transition-colors ${
                    isActive
                      ? 'bg-[#383044] font-semibold text-[#c2ade7]'
                      : 'text-[#aaa6b5] hover:bg-[#232129] hover:text-[#f0eef5]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive || collapsed ? <Icon className="h-[17px] w-[17px] shrink-0" /> : <span className="h-[17px] w-[17px] shrink-0" />}
                    {!collapsed && <span className="leading-[1.45]">{item.name}</span>}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-5">
          {!collapsed && (
            <div className="text-[11px] leading-[2] text-[#aaa6b5]">
              <p>{config.statusLine}</p>
              <Link to="/" className="text-[#c2ade7] hover:underline">
                ↗ View GameShelf
              </Link>
            </div>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="flex items-center gap-[10px] text-[11px] text-[#aaa6b5] hover:text-[#f0eef5]"
          >
            {collapsed ? <PanelLeftOpen className="h-[17px] w-[17px]" /> : <PanelLeftClose className="h-[17px] w-[17px]" />}
            {!collapsed && 'Collapse navigation'}
          </button>
        </div>
      </aside>

      {/* ---------------- Workspace body ---------------- */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-[72px] shrink-0 items-center gap-5 border-b border-[#38363f] bg-[#141417] px-8">
          <p className="min-w-0 flex-1 truncate text-[11px] text-[#aaa6b5]">
            {config.rootLabel} / <span className="text-[#c2ade7]">{current.name}</span>
          </p>

          <div className="relative hidden w-[220px] sm:block">
            <Search className="absolute left-[10px] top-1/2 h-[14px] w-[14px] -translate-y-1/2 text-[#aaa6b5]" />
            <input
              type="text"
              placeholder={config.searchPlaceholder}
              className="h-[34px] w-full rounded-md bg-[#2b2a33] pl-8 pr-2 text-[11px] text-[#f0eef5] placeholder:text-[#aaa6b5] outline-none focus:ring-1 focus:ring-[#c2ade7]"
            />
          </div>

          <button type="button" aria-label="Notifications" className="text-[#aaa6b5] hover:text-[#f0eef5]">
            <Bell className="h-[18px] w-[18px]" />
          </button>

          <Link to={config.accountPath} className="flex items-center gap-[10px] text-left">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#383044] text-[11px] font-semibold text-[#c2ade7]">
              {config.user.initials}
            </span>
            <span className="hidden sm:block">
              <span className="block text-[11px] leading-[1.7]">{config.user.name}</span>
              <span className="flex items-center gap-1 text-[10px] leading-[1.7] text-[#aaa6b5]">
                {config.user.role} <ChevronDown className="h-3 w-3" />
              </span>
            </span>
          </Link>
        </header>

        <main className="flex w-full flex-1 flex-col gap-6 p-8">{children}</main>
      </div>
    </div>
  );
};

// ───────────────────────── Admin workspace ─────────────────────────

// Navigation exactly as shown in Figma → "GameShelf / Administrator workspace"
export const adminConfig: WorkspaceConfig = {
  rootLabel: 'Administrator',
  areaLabel: 'Administration',
  workspaceLabel: 'Administrator workspace',
  searchPlaceholder: 'Search operations…',
  accountPath: '/admin/account',
  statusLine: '● 1 service degraded',
  user: { initials: 'AC', name: 'Alex Chen', role: 'Administrator' },
  nav: [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, end: true },
    { name: 'Platform Analytics', path: '/admin/analytics', icon: ChartNoAxesCombined },
    { name: 'User Management', path: '/admin/users', icon: Users },
    { name: 'Role & Permissions', path: '/admin/roles', icon: ShieldCheck },
    { name: 'Game Catalog Management', path: '/admin/games', icon: Gamepad2 },
    { name: 'System Logs', path: '/admin/logs', icon: ScrollText },
    { name: 'Website Settings', path: '/admin/settings', icon: Settings2 },
    { name: 'My Account', path: '/admin/account', icon: UserRound },
  ],
};

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => (
  <WorkspaceShell config={adminConfig}>
    {children}
  </WorkspaceShell>
);