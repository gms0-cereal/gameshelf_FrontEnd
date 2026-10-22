import { useState } from "react";
import { Link } from "react-router-dom";
import { MoreVertical, UserPlus, ShieldAlert, Ban, ExternalLink, Gamepad2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { SocialUser } from "@/services/Userservice";

type MiniProfileProps = {
  user: SocialUser & { banner_url?: string | null };
  position?: { top: number; left: number };
  onAddFriend?: () => void;
  onBlock?: () => void;
  onReport?: () => void;
  onMouseLeave?: () => void;
  onMouseEnter?: () => void;
};

export default function MiniProfileCard({
  user,
  position,
  onAddFriend,
  onBlock,
  onReport,
  onMouseLeave,
  onMouseEnter,
}: MiniProfileProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const displayName = user.nickname?.trim() || user.username;

  const favorites = user.favorites ?? [
    { title: "Hollow Knight", image: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/367520/header.jpg" },
    { title: "Hades", image: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1145360/header.jpg" },
  ];

  const containerStyle = position ? { top: position.top, left: position.left } : {};
  const containerClassName = position
    ? "fixed z-[9999] w-[310px] pointer-events-auto overflow-hidden rounded-2xl border border-[#55516c] bg-[#2a2838] text-[#e0deeb] shadow-2xl animate-in fade-in-0 zoom-in-95"
    : "absolute left-0 bottom-full mb-2 z-50 w-[310px] pointer-events-auto overflow-hidden rounded-2xl border border-[#55516c] bg-[#2a2838] text-[#e0deeb] shadow-2xl animate-in fade-in-0 zoom-in-95";

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={containerStyle}
      className={containerClassName}
    >
      {/* Banner with CSS Fallback */}
      <div className="relative h-24 w-full bg-[#373646] overflow-hidden">
        {user.banner_url ? (
          <img
            src={user.banner_url}
            alt=""
            className="h-full w-full object-cover object-center"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-r from-[#4d3e68] via-[#373646] to-[#2a2838]" />
        )}

        <div className="absolute right-3 top-3 z-10">
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex size-7 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            >
              <MoreVertical className="size-4" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-36 rounded-xl border border-[#55516c] bg-[#373646] p-1 shadow-xl z-20">
                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); onReport?.(); }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-[#e58d91] hover:bg-[#454256]"
                >
                  <ShieldAlert className="size-3.5" /> Report User
                </button>
                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); onBlock?.(); }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-[#e58d91] hover:bg-[#454256]"
                >
                  <Ban className="size-3.5" /> Block User
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Avatar & Info */}
      <div className="relative px-5 pb-5 pt-0">
        <div className="-mt-9 mb-2 flex items-end justify-between">
          <Avatar className="size-16 border-4 border-[#2a2838] bg-[#4d3e68] shrink-0">
            <AvatarImage src={user.avatar_url || undefined} alt={displayName} className="object-cover" />
            <AvatarFallback><Gamepad2 className="size-6 text-[#c2ade7]" /></AvatarFallback>
          </Avatar>

          {onAddFriend && (
            <Button
              type="button"
              onClick={onAddFriend}
              className="h-8 gap-1.5 bg-[#8063a8] px-3 text-xs text-white hover:bg-[#9274bb]"
            >
              <UserPlus className="size-3.5" /> Add
            </Button>
          )}
        </div>

        <div>
          <h3 className="text-base font-bold text-white truncate">{displayName}</h3>
          <p className="text-xs text-[#b4aec7] truncate">@{user.username}</p>
        </div>

        <p className="mt-2 text-xs leading-relaxed text-[#d0ccdc] line-clamp-2">
          {user.bio?.trim() || "No bio provided."}
        </p>

        {/* Favorite Games preview */}
        <div className="mt-3">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#b4aec7]">
            Favorite games
          </p>
          <div className="flex gap-2">
            {favorites.slice(0, 3).map((game, i) => (
              <div key={i} className="h-12 flex-1 overflow-hidden rounded-lg bg-[#373646]">
                {game.image ? (
                  <img src={game.image} alt={game.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Gamepad2 className="size-4 text-[#8870b6]" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* View Profile Link */}
        <div className="mt-4 pt-2.5 border-t border-[#55516c]/60">
         <Link
            to={`/profile/${encodeURIComponent(user.username)}`}
            className="flex items-center justify-center gap-1.5 text-xs font-semibold text-[#c2ade7] hover:text-white transition-colors"
            >
            View Full Profile <ExternalLink className="size-3.5" />
            </Link>
        </div>
      </div>
    </div>
  );
}