import { useState, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function SpoilerMask({
  active,
  children,
}: {
  active: boolean;
  children: ReactNode;
}) {
  const [revealed, setRevealed] = useState(false);

  if (!active) return <>{children}</>;

  if (revealed) {
    return (
      <div className="flex flex-col gap-2">
        {children}
        <button
          type="button"
          onClick={() => setRevealed(false)}
          className="flex w-fit cursor-pointer items-center gap-1.5 text-xs text-[#c2ade7] hover:text-[#e0deeb]"
        >
          <EyeOff className="size-3.5" aria-hidden="true" />
          Hide spoilers
        </button>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* The real text stays in the DOM but is blurred and hidden from screen readers */}
      <div
        aria-hidden="true"
        className="pointer-events-none select-none blur-md"
      >
        {children}
      </div>

      <button
        type="button"
        onClick={() => setRevealed(true)}
        className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-1 bg-[#2a2838]/60 text-xs font-semibold text-[#e0deeb] hover:bg-[#2a2838]/40"
      >
        <span className="flex items-center gap-1.5">
          <Eye className="size-4" aria-hidden="true" />
          Contains spoilers
        </span>
        <span className="font-normal text-[#b4aec7]">Click to reveal</span>
      </button>
    </div>
  );
}