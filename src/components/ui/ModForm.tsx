import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

const base =
  "w-full rounded-md border border-[#2a2a33] bg-[#121217] px-2.5 py-1.5 text-[11px] text-zinc-200 outline-none focus:border-violet-500 disabled:opacity-50";
const labelCls = "mb-1 block text-[9px] uppercase tracking-[0.1em] text-zinc-500";

export function ModSelect({ label, children, ...p }: { label?: string; children: ReactNode } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div>
      {label && <span className={labelCls}>{label}</span>}
      <select {...p} className={base}>{children}</select>
    </div>
  );
}

export function ModTextArea({ label, ...p }: { label?: string } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div>
      {label && <span className={labelCls}>{label}</span>}
      <textarea {...p} className={base} />
    </div>
  );
}

export function ModInput({ label, ...p }: { label?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      {label && <span className={labelCls}>{label}</span>}
      <input {...p} className={base} />
    </div>
  );
}