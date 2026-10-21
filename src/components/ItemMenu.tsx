import { useEffect, useRef, useState } from "react";
import { Flag, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

interface Props {
  isMine: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onReport?: () => void;
}

export default function ItemMenu({ isMine, onEdit, onDelete, onReport }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  function run(action?: () => void) {
    setOpen(false);
    action?.();
  }

  const itemClass =
    "flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-xs hover:bg-[#373646]";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="More actions"
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex size-7 cursor-pointer items-center justify-center rounded-md text-[#b4aec7] hover:bg-[#46445a] hover:text-[#e0deeb]"
      >
        <MoreHorizontal className="size-4" strokeWidth={1.7} aria-hidden="true" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-8 z-30 w-[150px] overflow-hidden rounded-xl border border-[#55516c] bg-[#2a2838] p-1.5 shadow-xl"
        >
          {isMine ? (
            <>
              <button
                type="button"
                role="menuitem"
                onClick={() => run(onEdit)}
                className={`${itemClass} text-[#e0deeb]`}
              >
                <Pencil className="size-3.5" strokeWidth={1.7} aria-hidden="true" />
                Edit
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => run(onDelete)}
                className={`${itemClass} text-[#e58d91]`}
              >
                <Trash2 className="size-3.5" strokeWidth={1.7} aria-hidden="true" />
                Delete
              </button>
            </>
          ) : (
            <button
              type="button"
              role="menuitem"
              onClick={() => run(onReport)}
              className={`${itemClass} text-[#e0deeb]`}
            >
              <Flag className="size-3.5" strokeWidth={1.7} aria-hidden="true" />
              Report
            </button>
          )}
        </div>
      )}
    </div>
  );
}