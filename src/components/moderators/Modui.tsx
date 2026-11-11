import type { ReactNode } from "react";

/* Shared primitives for the GameShelf moderator workspace.
   Assumes React 18+ and Tailwind CSS. */

export type Tone = "neutral" | "purple" | "red" | "amber" | "green" | "blue";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-white/5 text-zinc-300 border-white/10",
  purple: "bg-[#2a2347] text-[#b7a4ff] border-[#43377a]",
  red: "bg-[#3b1719] text-[#f28b8b] border-[#5e2327]",
  amber: "bg-[#3a2d12] text-[#e7bb5b] border-[#5a4519]",
  green: "bg-[#15301f] text-[#6fd39a] border-[#21502f]",
  blue: "bg-[#14283d] text-[#7db8f0] border-[#21466b]",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded border px-1.5 py-0.5 text-[10px] font-medium leading-none ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="mb-2 text-[9px] font-medium uppercase tracking-[0.12em] text-zinc-500">{children}</p>;
}

export function Label({ children }: { children: ReactNode }) {
  return <p className="mb-1 text-[9px] font-medium uppercase tracking-[0.1em] text-zinc-500">{children}</p>;
}

export function PageHeader({
  title,
  subtitle,
  meta,
  actions,
}: {
  title: string;
  subtitle?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-5">
      <Eyebrow>Trust &amp; Community</Eyebrow>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-zinc-50">{title}</h1>
          {subtitle && <p className="mt-1.5 max-w-3xl text-[11px] text-zinc-500">{subtitle}</p>}
          {meta && <p className="mt-1 text-[10px] text-zinc-600">{meta}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function Card({
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-lg border border-[#2a2a33] bg-[#17171d] ${className}`}>
      {(title || action) && (
        <header className="flex items-start justify-between gap-3 px-4 pt-4">
          <div>
            {title && <h3 className="text-[13px] font-semibold text-zinc-100">{title}</h3>}
            {subtitle && <p className="mt-0.5 text-[10px] text-zinc-500">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-[#2a2a33] bg-[#17171d] p-4">
      <p className="flex items-center justify-between text-[10px] text-zinc-500">
        {label}
        {icon}
      </p>
      <p className="mt-2 text-[28px] font-semibold leading-none text-zinc-50">{value}</p>
      {hint && <p className="mt-2 text-[10px] text-zinc-500">{hint}</p>}
    </div>
  );
}

export function Notice({
  tone = "amber",
  children,
  className = "",
}: {
  tone?: "amber" | "info";
  children: ReactNode;
  className?: string;
}) {
  const styles =
    tone === "amber"
      ? "border-[#4a3f1c] bg-[#2a2514] text-[#d9c27a]"
      : "border-[#2a2a33] bg-[#121217] text-zinc-400";
  return (
    <div className={`flex items-start gap-2 rounded-md border px-3 py-2 text-[10.5px] ${styles} ${className}`}>
      <span aria-hidden className="mt-px text-[11px]">ⓘ</span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export function Button({
  variant = "secondary",
  children,
  onClick,
  disabled,
}: {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const styles = {
    primary: "bg-violet-600 text-white hover:bg-violet-500 border-violet-500",
    secondary: "bg-[#1d1d25] text-zinc-200 hover:bg-[#25252f] border-[#33333f]",
    danger: "bg-[#b4343c] text-white hover:bg-[#c53f48] border-[#c9474f]",
    ghost: "bg-transparent text-zinc-400 hover:text-zinc-200 border-transparent",
  }[variant];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md border px-3 py-1.5 text-[11px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${styles}`}
    >
      {children}
    </button>
  );
}

export function BackButton({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md border border-[#33333f] bg-[#1d1d25] px-2.5 py-1 text-[10px] text-zinc-300 hover:bg-[#25252f]"
    >
      ← {children}
    </button>
  );
}

export type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
};

export function DataTable<T extends { id: string | number }>({
  columns,
  rows,
  selectedId,
  onRowClick,
  dense = false,
}: {
  columns: Column<T>[];
  rows: T[];
  selectedId?: T["id"];
  onRowClick?: (row: T) => void;
  dense?: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-[11px]">
        <thead>
          <tr className="border-b border-[#2a2a33] text-[9px] uppercase tracking-[0.1em] text-zinc-500">
            {columns.map((c) => (
              <th key={c.key} className={`px-3 py-2.5 font-medium ${c.className ?? ""}`}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const selected = selectedId === row.id;
            return (
              <tr
                key={row.id}
                onClick={() => onRowClick?.(row)}
                className={`border-b border-[#22222a] last:border-0 ${
                  onRowClick ? "cursor-pointer hover:bg-white/[0.03]" : ""
                } ${selected ? "bg-[#2a2540] shadow-[inset_2px_0_0_#8b6cf0]" : ""}`}
              >
                {columns.map((c) => (
                  <td key={c.key} className={`px-3 ${dense ? "py-2" : "py-3"} align-top text-zinc-300 ${c.className ?? ""}`}>
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Two-line table cell: primary text with a muted secondary line. */
export function Cell({ main, sub }: { main: ReactNode; sub?: ReactNode }) {
  return (
    <div>
      <div className="text-zinc-200">{main}</div>
      {sub && <div className="mt-0.5 text-[9.5px] text-zinc-500">{sub}</div>}
    </div>
  );
}

export function RowAction({ children }: { children: ReactNode }) {
  return <span className="whitespace-nowrap text-[10.5px] text-zinc-300">{children}</span>;
}

export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: readonly T[];
  active: T;
  onChange: (t: T) => void;
}) {
  return (
    <div className="mb-3 flex gap-4 border-b border-[#2a2a33]">
      {tabs.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onChange(t)}
          className={`-mb-px border-b-2 pb-2 text-[11px] ${
            active === t ? "border-violet-500 text-zinc-100" : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

export function SearchInput({ placeholder, className = "" }: { placeholder: string; className?: string }) {
  return (
    <input
      placeholder={placeholder}
      className={`rounded-md border border-[#2a2a33] bg-[#121217] px-3 py-2 text-[11px] text-zinc-200 placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none ${className}`}
    />
  );
}

export function FilterSelect({ options, label }: { options: string[]; label?: string }) {
  return (
    <label className="flex flex-col gap-1">
      {label && <Label>{label}</Label>}
      <select className="rounded-md border border-[#2a2a33] bg-[#1d1d25] px-2.5 py-1.5 text-[11px] text-zinc-200 focus:border-violet-500 focus:outline-none">
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}

export function Pagination({ summary }: { summary: string }) {
  return (
    <div className="flex items-center justify-between px-3 pt-3 text-[10px] text-zinc-500">
      <span>{summary}</span>
      <span className="flex items-center gap-3">
        <span className="text-zinc-600">‹ Previous</span>
        <span className="text-zinc-300">Page 1 of 1</span>
        <span className="text-zinc-600">Next ›</span>
      </span>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-[#22222a] py-2 text-[11px] last:border-0">
      <span className="text-zinc-500">{label}</span>
      <span className="text-right text-zinc-200">{children}</span>
    </div>
  );
}

export function TextArea({
  placeholder,
  rows = 3,
  label,
}: {
  placeholder?: string;
  rows?: number;
  label?: string;
}) {
  return (
    <label className="block">
      {label && <Label>{label}</Label>}
      <textarea
        rows={rows}
        placeholder={placeholder}
        className="w-full resize-none rounded-md border border-[#2a2a33] bg-[#121217] p-2.5 text-[11px] text-zinc-200 placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none"
      />
    </label>
  );
}

export function Avatar({ initials }: { initials: string }) {
  return (
    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#2a2347] text-[9px] font-semibold text-[#b7a4ff]">
      {initials}
    </span>
  );
}