import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Gamepad2,
  Pencil,
  Users,
  Lock,
  Eye,
  UserCheck,
  Star,
  Library,
  ListVideo,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

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
import { getMyPlaylists, type Playlist } from "@/services/playlistService";
import { PlaylistCarouselCard } from "@/components/playlists/PlaylistCards";
import MiniProfileCard from "@/components/social/MiniProfileCard";

const OUTLINE_BUTTON =
  "h-11 gap-[9px] rounded-xl border border-[#302438] " +
  "bg-[#17191E] px-[18px] py-[13px] text-sm font-semibold " +
  "leading-[17px] text-[#B39ACF] shadow-none " +
  "transition-colors hover:border-[#554363] " +
  "hover:bg-[#20232B] hover:text-[#C2ADE0] " +
  "[&_svg]:size-[18px]";

function VisibilityBadge({
  profileUser,
}: {
  profileUser: UserProfile | null;
}) {
  const libVis =
    (profileUser as any)?.library_visibility?.toLowerCase() || "public";

  const friendVis =
    (profileUser as any)?.friends_visibility?.toLowerCase() || "public";

  if (libVis === "private" && friendVis === "private") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-[#E58B91]/20 bg-[#24191D] px-2 py-0.5 text-[11px] text-[#E58B91]">
        <Lock className="size-3" />
        Private Profile
      </span>
    );
  }

  if (
    libVis === "friends" ||
    friendVis === "friends" ||
    libVis === "friends_only" ||
    friendVis === "friends_only"
  ) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-[#302438] bg-[#17191E] px-2 py-0.5 text-[11px] text-[#B39ACF]">
        <UserCheck className="size-3" />
        Friends Only
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-[#302438] bg-[#17191E] px-2 py-0.5 text-[11px] text-[#A0A0A8]">
      <Eye className="size-3" />
      Public
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
  const displayName =
    profileUser?.nickname?.trim() || profileUser?.username || "Player";

  const hasCustomBanner = Boolean(profileUser?.banner_url);

  return (
    <section
      aria-labelledby="player-name"
      className="relative isolate flex min-h-[220px] items-end overflow-hidden rounded-2xl border border-[#302438] bg-[#17191E] p-6 md:min-h-[260px] md:p-8"
    >
      {hasCustomBanner ? (
        <img
          src={profileUser?.banner_url}
          alt=""
          className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
        />
      ) : (
        /* Gorgeous multi-stop gradient background when no banner is provided */
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-20 h-full w-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#3a2256] via-[#1d1727] to-[#111318]"
        />
      )}

      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(15,17,22,0.95) 100%)",
        }}
      />

      <div className="flex w-full flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <Avatar className="size-20 shrink-0 overflow-hidden border-2 border-[#554363] bg-[#17191E] shadow-lg md:size-24">
            <AvatarImage
              src={profileUser?.avatar_url || undefined}
              alt={displayName}
              className="object-cover"
            />

            <AvatarFallback className="bg-[#20232B]">
              <Gamepad2
                className="size-10 text-[#B39ACF]"
                strokeWidth={1.7}
              />
            </AvatarFallback>
          </Avatar>

          <div className="flex flex-col gap-1">
            <h2
              id="player-name"
              className="text-2xl font-bold tracking-tight text-[#E6E1EA] drop-shadow-md md:text-3xl"
            >
              {displayName}
            </h2>

            <div className="flex flex-wrap items-center gap-2 text-xs text-[#A0A0A8]">
              <span>@{profileUser?.username}</span>

              {profileUser?.pronouns && (
                <>
                  <span>•</span>
                  <span>{profileUser.pronouns}</span>
                </>
              )}

              {profileUser?.age && (
                <>
                  <span>•</span>
                  <span>{profileUser.age} yrs old</span>
                </>
              )}
            </div>
          </div>
        </div>

        {isOwnProfile && (
          <Button
            asChild
            variant="outline"
            className={`${OUTLINE_BUTTON} shrink-0 bg-[#17191E]/90 backdrop-blur-sm`}
          >
            <Link to="/profile/edit">
              <Pencil
                className="size-4 text-[#B39ACF]"
                strokeWidth={1.7}
              />
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
  playlistCount,
  friendCount,
  reviewsCount,
}: {
  profileUser: UserProfile | null;
  libraryCount: number;
  playlistCount: number;
  friendCount: number;
  reviewsCount: number;
}) {
  const joinedDate = profileUser?.joined
    ? new Date(profileUser.joined).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
    : null;

  const stats = [
    {
      label: "Library",
      value: libraryCount,
      color: "text-[#38BDF8]",
      icon: Library,
    },
    {
      label: "Playlists",
      value: playlistCount,
      color: "text-[#B39ACF]",
      icon: ListVideo,
    },
    {
      label: "Friends",
      value: friendCount,
      color: "text-[#34D399]",
      icon: Users,
    },
    {
      label: "Reviews",
      value: reviewsCount,
      color: "text-[#FBBF24]",
      icon: Star,
    },
  ];

  return (
    <section
      aria-label="Profile Details and Statistics"
      className="flex flex-col gap-6 pt-1"
    >
      <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-[1.5fr_2fr]">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3 text-xs text-[#A0A0A8]">
            <VisibilityBadge profileUser={profileUser} />

            {joinedDate && (
              <>
                <span>•</span>
                <span>Member since {joinedDate}</span>
              </>
            )}
          </div>

          <p className="max-w-xl text-xs leading-relaxed text-[#A0A0A8] md:text-sm">
            {profileUser?.bio?.trim() || "No bio provided."}
          </p>
        </div>

        <dl className="grid grid-cols-4 gap-2 rounded-2xl border border-[#302438] bg-[#17191E] p-4 text-center shadow-none">
          {stats.map(({ label, value, color, icon: Icon }, index) => (
            <div
              key={label}
              className={`flex flex-col items-center justify-center gap-1 ${
                index !== 3 ? "border-r border-[#252832]" : ""
              }`}
            >
              <Icon
                className={`size-4 ${color}`}
                strokeWidth={1.8}
                aria-hidden="true"
              />

              <dd className={`text-xl font-bold ${color}`}>
                {value}
              </dd>

              <dt className="text-[10px] uppercase tracking-wider text-[#A0A0A8]">
                {label}
              </dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function FavoriteGames({
  favorites,
}: {
  favorites: UserFavoriteGameEntry[];
}) {
  return (
    <section
      aria-labelledby="favorite-games-title"
      className="flex flex-col gap-5"
    >
      <div className="flex items-center gap-2">
        <Star className="size-5 text-[#B39ACF]" />

        <h2
          id="favorite-games-title"
          className="text-2xl font-semibold tracking-tight text-[#E6E1EA]"
        >
          Favorite games
        </h2>
      </div>

      {favorites.length > 0 ? (
        <div className="max-h-[420px] overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:#302438_#17191E] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-[#17191E] [&::-webkit-scrollbar-thumb]:bg-[#302438] [&::-webkit-scrollbar-thumb]:rounded-md">
          <div className="grid grid-cols-2 gap-4 pb-2 sm:grid-cols-3 lg:grid-cols-4">
            {favorites.map((game) => (
              <Link
                key={game.id}
                to={
                  game.steam_app_id
                    ? `/gamedetails/${game.steam_app_id}`
                    : "#"
                }
                className="group flex flex-col overflow-hidden rounded-2xl border border-[#302438] bg-[#17191E] transition-colors hover:border-[#554363]"
              >
                <div className="aspect-[3/2] w-full overflow-hidden bg-[#000000]">
                  {game.cover_image_url ? (
                    <img
                      src={game.cover_image_url}
                      alt={game.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Gamepad2 className="size-8 text-[#B39ACF]" />
                    </div>
                  )}
                </div>

                <div className="p-3">
                  <p className="truncate text-sm font-medium text-[#E6E1EA] transition-colors group-hover:text-[#B39ACF]">
                    {game.title}
                  </p>

                  <p className="mt-0.5 truncate text-[11px] text-[#A0A0A8]">
                    {game.genres?.join(" / ") || "Game"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-[#302438] bg-[#17191E] p-8 text-center">
          <Gamepad2 className="mx-auto mb-3 size-8 text-[#B39ACF]" />

          <p className="font-medium text-[#E6E1EA]">
            No favorite games yet
          </p>

          <p className="mt-1 text-sm text-[#A0A0A8]">
            Favorite games will appear here once you click the heart icon on
            games in your library.
          </p>
        </div>
      )}
    </section>
  );
}

function UserPlaylistsSection({ playlists }: { playlists: Playlist[] }) {
  const playlistsRef = useRef<HTMLDivElement>(null);
  const scrollPlaylists = (dir: 1 | -1) =>
    playlistsRef.current?.scrollBy({
      left: dir * (playlistsRef.current.clientWidth * 0.8),
      behavior: "smooth",
    });

  return (
    <section aria-labelledby="user-playlists-title" className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ListVideo className="size-5 text-[#B39ACF]" />
          <h2
            id="user-playlists-title"
            className="text-2xl font-semibold tracking-tight text-[#E6E1EA]"
          >
            Playlists
          </h2>
        </div>

        {playlists.length > 0 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => scrollPlaylists(-1)}
              aria-label="Scroll left"
              className="size-8 rounded-lg border-[#302438] bg-[#17191E] text-[#E6E1EA] hover:bg-[#20232B]"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => scrollPlaylists(1)}
              aria-label="Scroll right"
              className="size-8 rounded-lg border-[#302438] bg-[#17191E] text-[#E6E1EA] hover:bg-[#20232B]"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        )}
      </div>

      {playlists.length > 0 ? (
        <div
          ref={playlistsRef}
          className="-mx-1 flex snap-x snap-mandatory gap-5 overflow-x-auto px-1 pt-2 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {playlists.map((playlist) => (
            <div
              key={playlist.id}
              className="w-[280px] sm:w-[320px] shrink-0 snap-start"
            >
              <PlaylistCarouselCard playlist={playlist} />
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-[#302438] bg-[#17191E] p-8 text-center">
          <ListVideo className="mx-auto mb-3 size-8 text-[#B39ACF]" />
          <p className="font-medium text-[#E6E1EA]">No playlists yet</p>
          <p className="mt-1 text-sm text-[#A0A0A8]">
            Playlists you create will appear here.
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
  onSelectFriend: (
    friend: SocialUser,
    event: React.MouseEvent<HTMLButtonElement>
  ) => void;
}) {
  return (
    <section
      aria-labelledby="friends-title"
      className="flex flex-col gap-5"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="size-5 text-[#34D399]" />

          <h2
            id="friends-title"
            className="text-2xl font-semibold tracking-tight text-[#E6E1EA]"
          >
            Friends
          </h2>
        </div>

        <Link
          to="/friends"
          className="text-sm font-medium text-[#B39ACF] transition-colors hover:text-[#C2ADE0]"
        >
          View all
        </Link>
      </div>

      {friends.length > 0 ? (
        <div className="max-h-[160px] overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:#302438_#17191E] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-[#17191E] [&::-webkit-scrollbar-thumb]:bg-[#302438] [&::-webkit-scrollbar-thumb]:rounded-md">
          <div className="grid grid-cols-2 gap-3 pb-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {friends.map((friend) => {
              const displayName =
                friend.nickname?.trim() || friend.username;

              return (
                <button
                  key={friend.id}
                  type="button"
                  onClick={(e) => onSelectFriend(friend, e)}
                  className="group flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border border-[#302438] bg-[#17191E] p-2.5 text-center transition-colors hover:border-[#554363]"
                >
                  <Avatar className="size-10 shrink-0 border-2 border-[#302438] bg-[#20232B] transition-colors group-hover:border-[#B39ACF]">
                    <AvatarImage
                      src={friend.avatar_url || undefined}
                      alt={displayName}
                      className="object-cover"
                    />

                    <AvatarFallback className="bg-[#20232B]">
                      <Users className="size-5 text-[#34D399]" />
                    </AvatarFallback>
                  </Avatar>

                  <div className="w-full min-w-0">
                    <p
                      className="truncate text-xs font-medium text-[#E6E1EA] transition-colors group-hover:text-[#B39ACF]"
                      title={displayName}
                    >
                      {displayName}
                    </p>

                    <p className="truncate text-[10px] text-[#A0A0A8]">
                      @{friend.username}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-[#302438] bg-[#17191E] p-6 text-center">
          <Users className="mx-auto mb-2 size-6 text-[#34D399]" />

          <p className="font-medium text-[#E6E1EA]">
            No friends yet
          </p>

          <p className="mt-0.5 text-xs text-[#A0A0A8]">
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
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [libraryTotal, setLibraryTotal] = useState<number>(0);
  const [playlistTotal, setPlaylistTotal] = useState<number>(0);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isOwnProfile =
    !username || Boolean(authUser && authUser.username === username);

  const [selectedFriend, setSelectedFriend] =
    useState<SocialUser | null>(null);

  const [modalPosition, setModalPosition] = useState<
    { top: number; left: number } | undefined
  >(undefined);

  const [openUpward, setOpenUpward] = useState(false);

  useEffect(() => {
    let isMounted = true;

    setLoadingProfile(true);
    setError(null);

    async function fetchProfileData() {
      try {
        if (isOwnProfile) {
          const [meData, friendsData, listData, favsData, playlistData] =
            await Promise.all([
              getMe(),
              getFriends(),
              getMyGameList(),
              getFavoriteGames(),
              getMyPlaylists().catch(() => ({ count: 0, results: [] })),
            ]);

          if (isMounted) {
            const counts = listData?.counts;
            const total = counts?.all ?? 0;
            const pResults = playlistData?.results ?? [];
            const pTotal = playlistData?.count ?? pResults.length;

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
            setPlaylists(pResults);
            setLibraryTotal(total);
            setPlaylistTotal(pTotal);
          }
        } else {
          const profileData = await getUserProfile(username);

          if (isMounted) {
            setProfileUser(profileData);
            setFriends([]);
            setFavorites(profileData.favorites ?? []);
            setPlaylists(profileData.playlists ?? []);

            if (profileData.library) {
              setLibraryTotal(profileData.library.all ?? 0);
            }
            setPlaylistTotal(
              profileData.playlists_count ??
                profileData.playlists?.length ??
                0
            );
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
      <div className="flex min-h-screen items-center justify-center bg-[#000000] text-[#A0A0A8]">
        <p className="text-sm">Loading profile…</p>
      </div>
    );
  }

  if (error || !profileUser) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#000000] text-[#E6E1EA]">
        <p>{error || "Profile not found."}</p>

        <Button
          asChild
          className="bg-[#B39ACF] font-semibold text-[#17101F] hover:bg-[#C2ADE0]"
        >
          <Link to="/home">Back to Home</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#000000]">
      <div
        className="flex min-h-screen w-full flex-col bg-[#000000] text-[#E6E1EA] antialiased"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <Navbar />

        <main className="flex flex-1 flex-col gap-8 px-5 pb-16 pt-11 md:px-8 xl:px-16">
          <ProfileBanner
            profileUser={profileUser}
            isOwnProfile={isOwnProfile}
          />

          <ProfileDetailsAndStats
            profileUser={profileUser}
            libraryCount={libraryTotal}
            playlistCount={playlistTotal}
            friendCount={profileUser.friend_count ?? friends.length}
            reviewsCount={profileUser.reviews_count ?? 0}
          />

          <FavoriteGames favorites={favorites} />

          <UserPlaylistsSection playlists={playlists} />

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
            className="fixed inset-0 z-[9990] bg-black/70 backdrop-blur-sm animate-in fade-in-0"
            onClick={() => setSelectedFriend(null)}
          >
            <div onClick={(e) => e.stopPropagation()}>
              <MiniProfileCard
                user={selectedFriend}
                position={modalPosition}
                side="openupward"
                isFriendsTab
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}