import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  MoreVertical,
  UserPlus,
  UserCheck,
  ShieldAlert,
  Ban,
  ExternalLink,
  Gamepad2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getFriends, type SocialUser } from "@/services/Userservice";

type MiniProfileProps = {
  user: SocialUser & {
    banner_url?: string | null;
    is_friend?: boolean;
    favorites?: Array<{ title: string; image?: string }>;
  };
  position?: { top: number; left: number };
  onAddFriend?: () => void;
  onBlock?: () => void;
  onReport?: () => void;
  onMouseLeave?: () => void;
  onMouseEnter?: () => void;
  isFriendsTab?: boolean;
};

export default function MiniProfileCard({
  user,
  position,
  onAddFriend,
  onBlock,
  onReport,
  onMouseLeave,
  onMouseEnter,
  isFriendsTab = false,
}: MiniProfileProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isFriend, setIsFriend] = useState<boolean>(
    user.is_friend || isFriendsTab || false
  );
  const menuRef = useRef<HTMLDivElement>(null);

  const displayName = user.nickname?.trim() || user.username;

  const favorites = user.favorites ?? [
    {
      title: "Hollow Knight",
      image:
        "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/367520/header.jpg",
    },
    {
      title: "Hades",
      image:
        "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1145360/header.jpg",
    },
  ];

  // Dynamically check friends list via getFriends()
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

  const containerStyle = position
    ? { top: position.top, left: position.left }
    : {};
  const containerClassName = position
    ? "fixed z-[9990] w-[310px] pointer-events-auto rounded-2xl border border-[#55516c] bg-[#2a2838] text-[#e0deeb] shadow-2xl animate-in fade-in-0 zoom-in-95"
    : "absolute left-0 bottom-full mb-2 z-50 w-[310px] pointer-events-auto rounded-2xl border border-[#55516c] bg-[#2a2838] text-[#e0deeb] shadow-2xl animate-in fade-in-0 zoom-in-95";

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={containerStyle}
      className={containerClassName}
    >
      {/* Banner Container - Notice NO overflow-hidden on outer container */}
      <div className="relative h-24 w-full">
        {/* Rounded Banner Image */}
        <div className="absolute inset-0 rounded-t-2xl overflow-hidden bg-[#373646]">
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
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#2a2838] via-transparent to-black/30" />
        </div>

        {/* Top-Right Side-by-Side Action Buttons */}
        <div className="absolute right-3 top-3 z-30 flex items-center gap-2">
          {/* Friend Status Badge / Add Button */}
          {isFriend ? (
            <div
              title="Already Friends"
              className="flex h-7 items-center gap-1 rounded-full bg-black/60 px-2.5 text-[11px] font-medium text-[#c2ade7] backdrop-blur-md border border-white/10"
            >
              <UserCheck className="size-3.5" /> Friends
            </div>
          ) : (
            onAddFriend && (
              <Button
                type="button"
                onClick={onAddFriend}
                className="h-7 gap-1 rounded-full bg-[#8063a8] px-3 text-[11px] text-white hover:bg-[#9274bb] shadow-md border border-white/10"
              >
                <UserPlus className="size-3.5" /> Add
              </Button>
            )
          )}

          {/* Three-Dots Menu Toggle */}
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="flex size-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors backdrop-blur-md border border-white/10"
            >
              <MoreVertical className="size-4" />
            </button>

            {/* Dropdown Popup with high z-index and no parent clipping */}
            {menuOpen && (
              <div className="absolute right-0 top-8 z-[9999] w-36 rounded-xl border border-[#55516c] bg-[#373646] p-1 shadow-2xl">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onReport?.();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-[#e58d91] hover:bg-[#454256] transition-colors"
                >
                  <ShieldAlert className="size-3.5" /> Report User
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onBlock?.();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-[#e58d91] hover:bg-[#454256] transition-colors"
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
          <Avatar className="size-16 border-4 border-[#2a2838] bg-[#4d3e68] shrink-0 shadow-md">
            <AvatarImage
              src={user.avatar_url || undefined}
              alt={displayName}
              className="object-cover"
            />
            <AvatarFallback>
              <Gamepad2 className="size-6 text-[#c2ade7]" />
            </AvatarFallback>
          </Avatar>
        </div>

        <div>
          <h3 className="text-base font-bold text-white truncate">
            {displayName}
          </h3>
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
              <div
                key={i}
                className="h-12 flex-1 overflow-hidden rounded-lg bg-[#373646]"
              >
                {game.image ? (
                  <img
                    src={game.image}
                    alt={game.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Gamepad2 className="size-4 text-[#8870b6]" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* View Full Profile Button */}
        <div className="mt-4 pt-3 border-t border-[#55516c]/60">
          <Button
            asChild
            variant="outline"
            className="w-full h-9 gap-1.5 border-[#55516c] bg-[#373646] text-xs font-semibold text-[#e0deeb] hover:bg-[#454256] hover:text-white transition-colors"
          >
            <Link to={`/profile/${encodeURIComponent(user.username)}`}>
              View Full Profile <ExternalLink className="size-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}