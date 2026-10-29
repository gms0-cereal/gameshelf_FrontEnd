import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Gamepad2, Pencil, Users, Lock, Eye, UserCheck } from "lucide-react";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import {
  getFriends,
  getUserProfile,
  getMe,
  getFavoriteGames,
  type SocialUser,
  type UserProfile,
  type UserFavoriteGameEntry,
} from "@/services/Userservice";
import { getMyGameList } from "@/services/Gameservice";
import MiniProfileCard from "@/components/social/MiniProfileCard";

const OUTLINE_BUTTON =
  "h-11 gap-[9px] rounded-lg border border-[#55516c] " +
  "bg-[#373646] px-[18px] py-[13px] text-sm font-semibold " +
  "leading-[17px] text-[#e0deeb] shadow-none " +
  "hover:bg-[#454256] hover:text-[#e0deeb] " +
  "[&_svg]:size-[18px]";

function VisibilityBadge({ visibility }: { visibility?: string }) {
  const vis = visibility?.toLowerCase() || "public";

  if (vis === "private") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-[#55516c] bg-[#2a2838] px-2 py-0.5 text-[11px] text-[#e58d91]">
        <Lock className="size-3" /> Private Profile
      </span>
    );
  }

  if (vis === "friends" || vis === "friends_only") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-[#55516c] bg-[#2a2838] px-2 py-0.5 text-[11px] text-[#c2ade7]">
        <UserCheck className="size-3" /> Friends Only
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-[#55516c] bg-[#2a2838] px-2 py-0.5 text-[11px] text-[#b4aec7]">
      <Eye className="size-3" /> Public
    </span>
  );
}

function ProfileBanner({
  profileUser,
  isOwnProfile,
}: {
  profileUser: UserProfile | null;
  isOwnProfile: boolean;
}) {
  const displayName = profileUser?.nickname?.trim() || profileUser?.username || "Player";
  const joinedDate = profileUser?.joined
    ? new Date(profileUser.joined).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <section
      aria-labelledby="player-name"
      className="relative isolate flex min-h-[310px] items-end overflow-hidden rounded-2xl bg-[#29263b] p-6 md:h-[310px] md:p-9"
    >
      <img
        src={profileUser?.banner_url || "/images/profile-banner.png"}
        alt=""
        className="absolute inset-0 -z-20 h-full w-full object-cover object-center contrast-110 saturate-125"
      />

      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(180deg, rgba(32,30,47,0.2) 0%, rgba(32,30,47,0.85) 100%)",
        }}
      />

      <div className="flex w-full flex-wrap items-center gap-6 md:flex-nowrap">
        <Avatar className="size-24 shrink-0 overflow-hidden border-2 border-[#8870b6] bg-[#4d3e68] after:hidden">
          <AvatarImage
            src={profileUser?.avatar_url || undefined}
            alt={displayName}
            className="object-cover"
          />
          <AvatarFallback className="bg-[#4d3e68]">
            <Gamepad2 className="size-11 text-[#c2ade7]" strokeWidth={1.7} />
          </AvatarFallback>
        </Avatar>

        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex items-center gap-3 flex-wrap">
            <h2
              id="player-name"
              className="break-words text-3xl font-bold tracking-tight text-white md:text-4xl"
            >
              {displayName}
            </h2>
            <VisibilityBadge visibility={(profileUser as any)?.visibility} />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm text-[#b4aec7]">
            <span>@{profileUser?.username}</span>
            {joinedDate && (
              <>
                <span className="text-[#8f899f]">•</span>
                <span className="text-[#d0ccdc]">Member since {joinedDate}</span>
              </>
            )}
            {profileUser?.pronouns && (
              <>
                <span className="text-[#8f899f]">•</span>
                <span className="text-[#d0ccdc]">{profileUser.pronouns}</span>
              </>
            )}
            {profileUser?.age && (
              <>
                <span className="text-[#8f899f]">•</span>
                <span className="text-[#d0ccdc]">{profileUser.age} yrs old</span>
              </>
            )}
          </div>

          <p className="mt-1 max-w-2xl whitespace-pre-wrap break-words text-sm leading-relaxed text-[#d0ccdc] md:text-base">
            {profileUser?.bio?.trim() || "No bio yet."}
          </p>
        </div>

        {isOwnProfile && (
          <Button
            asChild
            variant="outline"
            className={`${OUTLINE_BUTTON} w-[137px] shrink-0 border-white/20 bg-black/20 text-white hover:bg-white/10 hover:text-white`}
          >
            <Link to="/profile/edit">
              <Pencil className="size-4" strokeWidth={1.7} aria-hidden="true" />
              Edit Profile
            </Link>
          </Button>
        )}
      </div>
    </section>
  );
}

function PlayerStatistics({
  libraryCount,
  friendCount,
  reviewsCount,
}: {
  libraryCount: number;
  friendCount: number;
  reviewsCount: number;
}) {
  const stats = [
    { label: "Library", value: libraryCount },
    { label: "Playlists", value: 0 },
    { label: "Friends", value: friendCount },
    { label: "Reviews", value: reviewsCount },
  ];

  return (
    <section aria-label="Player statistics">
      <dl className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex h-[120px] flex-col justify-between rounded-2xl bg-[#373646] p-6 ring-1 ring-inset ring-[#55516c]"
          >
            <dd className="text-[32px] font-semibold text-[#c2ade7]">
              {stat.value}
            </dd>
            <dt className="text-[13px] text-[#b4aec7]">{stat.label}</dt>
          </div>
        ))}
      </dl>
    </section>
  );
}

function FavoriteGames({ favorites }: { favorites: UserFavoriteGameEntry[] }) {
  return (
    <section aria-labelledby="favorite-games-title" className="flex flex-col gap-5">
      <h2 id="favorite-games-title" className="text-2xl font-semibold tracking-tight">
        Favorite games
      </h2>

      {favorites.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {favorites.map((game) => (
            <Link
              key={game.id}
              to={game.steam_app_id ? `/gamedetails/${game.steam_app_id}` : "#"}
              className="group flex flex-col overflow-hidden rounded-xl border border-[#55516c] bg-[#373646] transition-colors hover:border-[#c2ade7]"
            >
              <div className="aspect-[3/2] w-full bg-[#2a2838] overflow-hidden">
                {game.cover_image_url ? (
                  <img
                    src={game.cover_image_url}
                    alt={game.title}
                    loading="lazy"
                    className="h-full w-full object-cover contrast-110 saturate-125 transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Gamepad2 className="size-8 text-[#8870b6]" />
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="truncate text-sm font-medium group-hover:text-[#c2ade7]">
                  {game.title}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-[#b4aec7]">
                  {game.genres?.join(" / ") || "Favorite"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl bg-[#373646] p-8 text-center ring-1 ring-inset ring-[#55516c]">
          <Gamepad2 className="mx-auto mb-3 size-8 text-[#8870b6]" />
          <p className="font-medium">No favorite games yet</p>
          <p className="mt-1 text-sm text-[#b4aec7]">
            Favorite games will appear here once you click the heart icon on games in your library.
          </p>
        </div>
      )}
    </section>
  );
}

function FriendsBar({
  friends,
  onSelectFriend,
}: {
  friends: SocialUser[];
  onSelectFriend: (friend: SocialUser, event: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <section aria-labelledby="friends-title" className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 id="friends-title" className="text-2xl font-semibold tracking-tight">
          Friends
        </h2>
        <Link to="/friends" className="text-sm font-medium text-[#c2ade7] hover:text-white">
          View all
        </Link>
      </div>

      <div className="flex min-h-[100px] items-center gap-4 overflow-x-auto rounded-2xl bg-[#373646] p-5 ring-1 ring-inset ring-[#55516c]">
        {friends.length > 0 ? (
          friends.map((friend) => {
            const displayName = friend.nickname?.trim() || friend.username;
            return (
              <button
                key={friend.id}
                type="button"
                onClick={(e) => onSelectFriend(friend, e)}
                className="flex flex-col items-center gap-2 shrink-0 text-center group cursor-pointer bg-transparent border-0"
              >
                <Avatar className="size-14 border-2 border-[#8870b6] bg-[#4d3e68] group-hover:border-[#c2ade7] transition-colors">
                  <AvatarImage
                    src={friend.avatar_url || undefined}
                    alt={displayName}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-[#4d3e68]">
                    <Users className="size-6 text-[#c2ade7]" />
                  </AvatarFallback>
                </Avatar>
                <span
                  className="max-w-[80px] truncate text-xs text-[#e0deeb] group-hover:text-white"
                  title={displayName}
                >
                  {displayName}
                </span>
              </button>
            );
          })
        ) : (
          <p className="text-sm text-[#b4aec7]">
            Your friends will appear here once you add them.
          </p>
        )}
      </div>
    </section>
  );
}

export default function Profile() {
  const { username } = useParams<{ username?: string }>();
  const { user: authUser } = useAuth();

  const [profileUser, setProfileUser] = useState<UserProfile | null>(null);
  const [friends, setFriends] = useState<SocialUser[]>([]);
  const [favorites, setFavorites] = useState<UserFavoriteGameEntry[]>([]);
  const [libraryTotal, setLibraryTotal] = useState<number>(0);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isOwnProfile = !username || Boolean(authUser && authUser.username === username);
  const [selectedFriend, setSelectedFriend] = useState<SocialUser | null>(null);
  const [modalPosition, setModalPosition] = useState<{ top: number; left: number } | undefined>(undefined);
  const [openUpward, setOpenUpward] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoadingProfile(true);
    setError(null);

    async function fetchProfileData() {
      try {
        if (isOwnProfile) {
          const [meData, friendsData, listData, favsData] = await Promise.all([
            getMe(),
            getFriends(),
            getMyGameList(),
            getFavoriteGames(),
          ]);

          if (isMounted) {
            const counts = listData?.counts;
            const total = counts?.all ?? 0;

            setProfileUser({
              id: meData.id,
              username: meData.username,
              nickname: meData.nickname,
              bio: meData.bio,
              avatar_url: meData.avatar_url,
              banner_url: meData.banner_url,
              age: meData.age,
              gender: meData.gender,
              pronouns: meData.pronouns,
              joined: meData.created_at,
              friend_count: friendsData.length,
              library: listData?.counts ?? null,
              ratings_count: 0,
              reviews_count: 0,
            });
            setFriends(friendsData ?? []);
            setFavorites(favsData ?? []);
            setLibraryTotal(total);
          }
        } else {
          const profileData = await getUserProfile(username);

          if (isMounted) {
            setProfileUser(profileData);
            setFriends([]);
            setFavorites(profileData.favorites ?? []);

            if (profileData.library) {
              const total = profileData.library.all ?? 0;
              setLibraryTotal(total);
            }
          }
        }
      } catch {
        if (isMounted) {
          setError("Failed to load profile.");
        }
      } finally {
        if (isMounted) {
          setLoadingProfile(false);
        }
      }
    }

    void fetchProfileData();
    return () => {
      isMounted = false;
    };
  }, [username, isOwnProfile]);

  if (loadingProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#201e2f] text-[#b4aec7]">
        <p className="text-sm">Loading profile…</p>
      </div>
    );
  }

  if (error || !profileUser) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#201e2f] text-[#e0deeb] gap-4">
        <p>{error || "Profile not found."}</p>
        <Button asChild className="bg-[#a8484c] text-white">
          <Link to="/home">Back to Home</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#201e2f]">
      <div
        className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col bg-[#201e2f] text-[#e0deeb] antialiased"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <Navbar />
        <main className="flex flex-1 flex-col gap-8 px-5 pb-16 pt-11 md:px-8 xl:px-16">
          <ProfileBanner profileUser={profileUser} isOwnProfile={isOwnProfile} />
          <PlayerStatistics
            libraryCount={libraryTotal}
            friendCount={profileUser.friend_count ?? friends.length}
            reviewsCount={profileUser.reviews_count ?? 0}
          />
          <FavoriteGames favorites={favorites} />
          {isOwnProfile && (
            <FriendsBar
              friends={friends}
              onSelectFriend={(friend, event) => {
                const rect = event.currentTarget.getBoundingClientRect();
                const spaceBelow = window.innerHeight - rect.bottom;

                const isUpward = spaceBelow < 320;
                setOpenUpward(isUpward);

                setModalPosition({
                  top: isUpward ? rect.top - 340 : rect.bottom + 8,
                  left: Math.min(rect.left, window.innerWidth - 330),
                });
                setSelectedFriend(friend);
              }}
            />
          )}
        </main>
        <Footer />

        {selectedFriend && (
          <div
            className="fixed inset-0 z-[9990] bg-black/60 backdrop-blur-sm animate-in fade-in-0"
            onClick={() => setSelectedFriend(null)}
          >
            <div onClick={(e) => e.stopPropagation()}>
              <MiniProfileCard
                user={selectedFriend}
                position={modalPosition}
                openUpward={openUpward}
                isFriendsTab
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}