import { useState, useRef, useEffect, memo } from "react";
import { Link } from "react-router-dom";
import {
  MoreVertical,
  UserPlus,
  UserCheck,
  ShieldAlert,
  Ban,
  ExternalLink,
  Gamepad2,
  Lock,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getFriends, type SocialUser, type UserFavoriteGameEntry } from "@/services/Userservice";

type MiniProfileProps = {
  user: SocialUser & {
    banner_url?: string | null;
    is_friend?: boolean;
    favorites?: UserFavoriteGameEntry[];
    visibility?: "public" | "private";
    has_incoming_request?: boolean;
  };
  position?: { top: number; left: number };
  side?: "top" | "bottom" | "openupward"; 
  onAddFriend?: () => void;
  onBlock?: () => void;
  onReport?: () => void;
  onMouseLeave?: () => void;
  onMouseEnter?: () => void;
  isFriendsTab?: boolean;
};

/** Optimized cover image handler with silent failure handling */
const FavoriteCover = memo(({ src, title }: { src?: string | null; title: string }) => {
  const [failed, setFailed] = useState(false);
  return src && !failed ? (
    <img
      src={src}
      alt={title}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className="h-full w-full object-cover"
    />
  ) : (
    <div className="flex h-full items-center justify-center bg-[#20232B]">
      <Gamepad2 className="size-4 text-[#B39ACF]" />
    </div>
  );
});
FavoriteCover.displayName = "FavoriteCover";

export default function MiniProfileCard({
  user,
  position,
  onAddFriend,
  onBlock,
  onReport,
  onMouseLeave,
  onMouseEnter,
  side = "bottom",
  isFriendsTab = false,
}: MiniProfileProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isFriend, setIsFriend] = useState<boolean>(
    user.is_friend || isFriendsTab || false
  );
  const menuRef = useRef<HTMLDivElement>(null);

  const displayName = user.nickname?.trim() || user.username;
  const favorites = user.favorites ?? [];
  const isPrivate = user.visibility === "private";
  const canAddFriend = !isPrivate || user.has_incoming_request;

  // Verify friendship status efficiently
  useEffect(() => {
    let isMounted = true;

    async function checkFriendStatus() {
      if (user.is_friend || isFriendsTab) {
        setIsFriend(true);
        return;
      }

      try {
        const friendsList = await getFriends();
        if (isMounted && Array.isArray(friendsList)) {
          const found = friendsList.some(
            (f) => f.id === user.id || f.username === user.username
          );
          setIsFriend(found);
        }
      } catch (error) {
        console.error("Error verifying friend status:", error);
      }
    }

    void checkFriendStatus();
    return () => {
      isMounted = false;
    };
  }, [user.id, user.username, user.is_friend, isFriendsTab]);

  // Close dropdown menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  const containerStyle = position ? { top: position.top, left: position.left } : {};
  
  const containerClassName = position
    ? "fixed z-[9990] w-[310px] pointer-events-auto rounded-2xl border border-[#302438] bg-[#17191E] text-[#E6E1EA] shadow-2xl animate-in fade-in-0 zoom-in-95"
    : side === "top" || side === "openupward"
      ? "absolute left-0 bottom-full mb-2 z-50 w-[310px] pointer-events-auto rounded-2xl border border-[#302438] bg-[#17191E] text-[#E6E1EA] shadow-2xl animate-in fade-in-0 zoom-in-95"
      : "absolute left-0 top-full mt-2 z-50 w-[310px] pointer-events-auto rounded-2xl border border-[#302438] bg-[#17191E] text-[#E6E1EA] shadow-2xl animate-in fade-in-0 zoom-in-95";

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={containerStyle}
      className={containerClassName}
    >
      {/* Banner Container */}
      <div className="relative h-24 w-full">
        <div className="absolute inset-0 rounded-t-2xl overflow-hidden bg-[#20232B]">
          {user.banner_url ? (
            <img
              src={user.banner_url}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover object-center"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-r from-[#302438] via-[#20232B] to-[#17191E]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#17191E] via-transparent to-black/30" />
        </div>

        {/* Top-Right Side-by-Side Action Buttons */}
        <div className="absolute right-3 top-3 z-30 flex items-center gap-2">
          {isFriend ? (
            <div
              title="Already Friends"
              className="flex h-7 items-center gap-1 rounded-full bg-black/60 px-2.5 text-[11px] font-medium text-[#B39ACF] backdrop-blur-md border border-white/10"
            >
              <UserCheck className="size-3.5" /> Friends
            </div>
          ) : (
            onAddFriend && (
              <Button
                type="button"
                onClick={onAddFriend}
                disabled={!canAddFriend}
                title={!canAddFriend ? "Private profiles can only send requests, not receive them." : undefined}
                className={`h-7 gap-1 rounded-full px-3 text-[11px] text-white shadow-md border border-white/10 transition-colors ${
                  canAddFriend
                    ? "bg-[#B39ACF] text-[#17191E] hover:bg-[#C2ADE0] font-semibold"
                    : "bg-[#20232B] text-[#777780] cursor-not-allowed border-transparent"
                }`}
              >
                {canAddFriend ? <UserPlus className="size-3.5" /> : <Lock className="size-3" />}
                {canAddFriend ? "Add" : "Private"}
              </Button>
            )
          )}

          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="flex size-7 items-center justify-center rounded-full bg-black/65 text-[#E6E1EA] hover:bg-black/85 transition-colors backdrop-blur-md border border-white/10"
            >
              <MoreVertical className="size-4" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-8 z-[9999] w-36 rounded-xl border border-[#302438] bg-[#20232B] p-1 shadow-2xl">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onReport?.();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-[#E58B91] hover:bg-[#302438] transition-colors"
                >
                  <ShieldAlert className="size-3.5" /> Report User
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onBlock?.();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-[#E58B91] hover:bg-[#302438] transition-colors"
                >
                  <Ban className="size-3.5" /> Block User
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Avatar & Card Body */}
      <div className="relative px-5 pb-5 pt-0 z-10">
        <div className="-mt-9 mb-2 flex items-end justify-between">
          <Avatar className="size-16 border-4 border-[#17191E] bg-[#302438] shrink-0 shadow-md">
            <AvatarImage
              src={user.avatar_url || undefined}
              alt={displayName}
              className="object-cover"
            />
            <AvatarFallback>
              <Gamepad2 className="size-6 text-[#B39ACF]" />
            </AvatarFallback>
          </Avatar>
        </div>

        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="text-base font-bold text-[#E6E1EA] truncate">
              {displayName}
            </h3>
            {isPrivate && (
              <span title="Private Profile" className="text-[#A0A0A8]">
                <Lock className="size-3.5" />
              </span>
            )}
          </div>
          <p className="text-xs text-[#B39ACF] truncate">@{user.username}</p>
        </div>

        <p className="mt-2 text-xs leading-relaxed text-[#A0A0A8] line-clamp-2">
          {isPrivate && !isFriend
            ? "This profile is private."
            : user.bio?.trim() || "No bio provided."}
        </p>

        {/* Favorite Games preview (Hidden for private non-friends) */}
        {!isPrivate || isFriend ? (
          <div className="mt-3">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#B39ACF]">
              Favorite games
            </p>
            <div className="flex gap-2">
              {favorites.length > 0 ? (
                favorites.slice(0, 3).map((game, i) => (
                  <div
                    key={game.id || i}
                    className="h-12 flex-1 overflow-hidden rounded-lg bg-[#20232B] border border-[#302438]"
                  >
                    <FavoriteCover src={game.cover_image_url} title={game.title} />
                  </div>
                ))
              ) : (
                <p className="text-[11px] text-[#A0A0A8]">No favorite games listed.</p>
              )}
            </div>
          </div>
        ) : null}

        {/* View Full Profile Button */}
        <div className="mt-4 pt-3 border-t border-[#302438]">
          {isPrivate && !isFriend ? (
            <Button
              disabled
              variant="outline"
              className="w-full h-9 gap-1.5 border-[#302438] bg-[#17191E] text-xs font-semibold text-[#777780] cursor-not-allowed"
            >
              <Lock className="size-3.5" /> Profile is Private
            </Button>
          ) : (
            <Button
              asChild
              variant="outline"
              className="w-full h-9 gap-1.5 border-[#302438] bg-[#20232B] text-xs font-semibold text-[#E6E1EA] hover:bg-[#302438] hover:border-[#554363] hover:text-white transition-colors"
            >
              <Link to={`/profile/${encodeURIComponent(user.username)}`}>
                View Full Profile <ExternalLink className="size-3.5" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}