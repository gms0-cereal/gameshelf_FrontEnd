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
  "h-11 gap-[9px] rounded-lg border border-[#38363F] " +
  "bg-[#383044] px-[18px] py-[13px] text-sm font-semibold " +
  "leading-[17px] text-[#F0EEF5] shadow-none " +
  "hover:bg-[#383044]/80 hover:text-[#F0EEF5] " +
  "[&_svg]:size-[18px]";

function VisibilityBadge({ profileUser }: { profileUser: UserProfile | null }) {
  const libVis = (profileUser as any)?.library_visibility?.toLowerCase() || "public";
  const friendVis = (profileUser as any)?.friends_visibility?.toLowerCase() || "public";

  if (libVis === "private" && friendVis === "private") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-[#38363F] bg-[#383044] px-2 py-0.5 text-[11px] text-[#EDB1B4]">
        <Lock className="size-3" /> Private Profile
      </span>
    );
  }

  if (libVis === "friends" || friendVis === "friends" || libVis === "friends_only" || friendVis === "friends_only") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-[#38363F] bg-[#383044] px-2 py-0.5 text-[11px] text-[#C2ADE7]">
        <UserCheck className="size-3" /> Friends Only
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-[#38363F] bg-[#383044] px-2 py-0.5 text-[11px] text-[#AAA6B5]">
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

  return (
    <section
      aria-labelledby="player-name"
      className="relative isolate flex min-h-[220px] items-end overflow-hidden rounded-2xl bg-[#383044] border border-[#38363F] p-6 md:min-h-[260px] md:p-8"
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
            "linear-gradient(180deg, rgba(27,26,32,0.3) 0%, rgba(27,26,32,0.9) 100%)",
        }}
      />

      <div className="flex w-full flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <Avatar className="size-20 shrink-0 overflow-hidden border-2 border-[#8870B6] bg-[#383044] md:size-24 shadow-lg">
            <AvatarImage
              src={profileUser?.avatar_url || undefined}
              alt={displayName}
              className="object-cover contrast-110 saturate-125"
            />
            <AvatarFallback className="bg-[#383044]">
              <Gamepad2 className="size-10 text-[#C2ADE7]" strokeWidth={1.7} />
            </AvatarFallback>
          </Avatar>

          <div className="flex flex-col gap-1">
            <h2 id="player-name" className="text-2xl font-bold tracking-tight text-[#F0EEF5] md:text-3xl drop-shadow-md">
              {displayName}
            </h2>

            {/* Directly Under Display Name: @username • Pronouns • Age */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#AAA6B5]">
              <span>@{profileUser?.username}</span>
              {profileUser?.pronouns && (
                <>
                  <span className="text-[#38363F]">•</span>
                  <span className="text-[#F0EEF5]">{profileUser.pronouns}</span>
                </>
              )}
              {profileUser?.age && (
                <>
                  <span className="text-[#38363F]">•</span>
                  <span className="text-[#F0EEF5]">{profileUser.age} yrs old</span>
                </>
              )}
            </div>
          </div>
        </div>

        {isOwnProfile && (
          <Button
            asChild
            variant="outline"
            className={`${OUTLINE_BUTTON} shrink-0 border-[#38363F] bg-[#1B1A20]/60 backdrop-blur-sm text-[#F0EEF5] hover:bg-[#1B1A20]/90 hover:text-[#F0EEF5]`}
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

function ProfileDetailsAndStats({
  profileUser,
  libraryCount,
  friendCount,
  reviewsCount,
}: {
  profileUser: UserProfile | null;
  libraryCount: number;
  friendCount: number;
  reviewsCount: number;
}) {
  const joinedDate = profileUser?.joined
    ? new Date(profileUser.joined).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <section aria-label="Profile Details and Statistics" className="flex flex-col gap-6 pt-1">
      {/* Backgroundless Row: Details on Left | Stats Card on Right */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_2fr] items-center">
        <div className="flex flex-col gap-3">
          {/* Visibility Status & Member Since */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-[#AAA6B5]">
            <VisibilityBadge profileUser={profileUser} />
            {joinedDate && (
              <>
                <span className="text-[#38363F]">•</span>
                <span>Member since {joinedDate}</span>
              </>
            )}
          </div>

          {/* Bio */}
          <p className="max-w-xl text-xs leading-relaxed text-[#AAA6B5] md:text-sm">
            {profileUser?.bio?.trim() || "No bio provided."}
          </p>
        </div>

        {/* Clean Metrics Bar */}
        <dl className="grid grid-cols-4 gap-2 rounded-xl bg-[#383044] p-4 ring-1 ring-inset ring-[#38363F] text-center shadow-none">
          <div className="flex flex-col justify-center border-r border-[#38363F] pr-2">
            <dd className="text-xl font-bold text-[#C2ADE7]">{libraryCount}</dd>
            <dt className="text-[10px] uppercase tracking-wider text-[#AAA6B5]">Library</dt>
          </div>
          <div className="flex flex-col justify-center border-r border-[#38363F] px-2">
            <dd className="text-xl font-bold text-[#C2ADE7]">0</dd>
            <dt className="text-[10px] uppercase tracking-wider text-[#AAA6B5]">Playlists</dt>
          </div>
          <div className="flex flex-col justify-center border-r border-[#38363F] px-2">
            <dd className="text-xl font-bold text-[#C2ADE7]">{friendCount}</dd>
            <dt className="text-[10px] uppercase tracking-wider text-[#AAA6B5]">Friends</dt>
          </div>
          <div className="flex flex-col justify-center pl-2">
            <dd className="text-xl font-bold text-[#C2ADE7]">{reviewsCount}</dd>
            <dt className="text-[10px] uppercase tracking-wider text-[#AAA6B5]">Reviews</dt>
          </div>
        </dl>
      </div>
    </section>
  );
}

function FavoriteGames({ favorites }: { favorites: UserFavoriteGameEntry[] }) {
  return (
    <section aria-labelledby="favorite-games-title" className="flex flex-col gap-5">
      <h2 id="favorite-games-title" className="text-2xl font-semibold tracking-tight text-[#F0EEF5]">
        Favorite games
      </h2>

      {favorites.length > 0 ? (
        <div className="max-h-[420px] overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:#38363F_#1B1A20] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-[#1B1A20] [&::-webkit-scrollbar-thumb]:bg-[#38363F] [&::-webkit-scrollbar-thumb]:rounded-md">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 pb-2">
            {favorites.map((game) => (
              <Link
                key={game.id}
                to={game.steam_app_id ? `/gamedetails/${game.steam_app_id}` : "#"}
                className="group flex flex-col overflow-hidden rounded-xl border border-[#38363F] bg-[#383044] transition-colors hover:border-[#C2ADE7]"
              >
                <div className="aspect-[3/2] w-full bg-[#1B1A20] overflow-hidden">
                  {game.cover_image_url ? (
                    <img
                      src={game.cover_image_url}
                      alt={game.title}
                      loading="lazy"
                      className="h-full w-full object-cover contrast-110 saturate-125 transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Gamepad2 className="size-8 text-[#8870B6]" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="truncate text-sm font-medium text-[#F0EEF5] group-hover:text-[#C2ADE7]">
                    {game.title}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-[#AAA6B5]">
                    {game.genres?.join(" / ") || "Game"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-[#383044] p-8 text-center ring-1 ring-inset ring-[#38363F] text-[#AAA6B5]">
          <Gamepad2 className="mx-auto mb-3 size-8 text-[#8870B6]" />
          <p className="font-medium text-[#F0EEF5]">No favorite games yet</p>
          <p className="mt-1 text-sm text-[#AAA6B5]">
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
        <h2 id="friends-title" className="text-2xl font-semibold tracking-tight text-[#F0EEF5]">
          Friends
        </h2>
        <Link to="/friends" className="text-sm font-medium text-[#C2ADE7] hover:text-white">
          View all
        </Link>
      </div>

      {friends.length > 0 ? (
        <div className="max-h-[160px] overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:#38363F_#1B1A20] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-[#1B1A20] [&::-webkit-scrollbar-thumb]:bg-[#38363F] [&::-webkit-scrollbar-thumb]:rounded-md">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 pb-2">
            {friends.map((friend) => {
              const displayName = friend.nickname?.trim() || friend.username;
              return (
                <button
                  key={friend.id}
                  type="button"
                  onClick={(e) => onSelectFriend(friend, e)}
                  className="group flex flex-col items-center gap-1.5 rounded-xl border border-[#38363F] bg-[#383044] p-2.5 text-center transition-colors hover:border-[#C2ADE7] cursor-pointer"
                >
                  <Avatar className="size-10 border-2 border-[#8870B6] bg-[#383044] group-hover:border-[#C2ADE7] transition-colors shrink-0">
                    <AvatarImage
                      src={friend.avatar_url || undefined}
                      alt={displayName}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-[#383044]">
                      <Users className="size-5 text-[#C2ADE7]" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="w-full min-w-0">
                    <p
                      className="truncate text-xs font-medium text-[#F0EEF5] group-hover:text-[#C2ADE7]"
                      title={displayName}
                    >
                      {displayName}
                    </p>
                    <p className="truncate text-[10px] text-[#AAA6B5]">
                      @{friend.username}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-[#383044] p-6 text-center ring-1 ring-inset ring-[#38363F] text-[#AAA6B5]">
          <Users className="mx-auto mb-2 size-6 text-[#8870B6]" />
          <p className="font-medium text-[#F0EEF5]">No friends yet</p>
          <p className="mt-0.5 text-xs text-[#AAA6B5]">
            Your friends will appear here once you add them.
          </p>
        </div>
      )}
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
              library_visibility: meData.library_visibility,
              friends_visibility: meData.friends_visibility,
            } as any);
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
      <div className="flex min-h-screen items-center justify-center bg-[#1B1A20] text-[#AAA6B5]">
        <p className="text-sm">Loading profile…</p>
      </div>
    );
  }

  if (error || !profileUser) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#1B1A20] text-[#F0EEF5] gap-4">
        <p>{error || "Profile not found."}</p>
        <Button asChild className="bg-[#BDA6E4] text-[#1B1A20] font-semibold hover:bg-[#C2ADE7]">
          <Link to="/home">Back to Home</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1B1A20]">
      <div
        className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col bg-[#1B1A20] text-[#F0EEF5] antialiased"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <Navbar />
        <main className="flex flex-1 flex-col gap-8 px-5 pb-16 pt-11 md:px-8 xl:px-16">
          <ProfileBanner profileUser={profileUser} isOwnProfile={isOwnProfile} />
          <ProfileDetailsAndStats
            profileUser={profileUser}
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