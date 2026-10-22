import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Gamepad2, Pencil } from "lucide-react";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { getFriends, getUserProfile, getMe, type SocialUser, type UserProfile } from "@/services/Userservice";
import { getMyGameList, type UserGameListResponse } from "@/services/Gameservice";

export default function Profile() {
  const { username } = useParams<{ username?: string }>();
  const { user: authUser, loading: authLoading } = useAuth();
  
  const [profileUser, setProfileUser] = useState<UserProfile | null>(null);
  const [friends, setFriends] = useState<SocialUser[]>([]);
  const [libraryCounts, setLibraryCounts] = useState<Record<string, number> | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isOwnProfile = !username || (authUser && authUser.username === username);

  useEffect(() => {
    let isMounted = true;
    setLoadingProfile(true);
    setError(null);

    async function fetchProfileData() {
      try {
        if (isOwnProfile) {
          const [meData, friendsData, listData] = await Promise.all([
            getMe(),
            getFriends(),
            getMyGameList(),
          ]);
          
          if (isMounted) {
            const counts = listData?.counts;
            const totalAll = counts 
              ? Object.values(counts).reduce((sum: number, val: any) => sum + (Number(val) || 0), 0) 
              : 0;

            const finalCounts = counts ? { ...counts, all: totalAll } : null;

            setProfileUser({
              id: meData.id,
              username: meData.username,
              nickname: meData.nickname,
              bio: meData.bio,
              avatar_url: meData.avatar_url,
              banner_url: meData.banner_url,
              joined: meData.created_at,
              friend_count: friendsData.length,
              library: finalCounts,
              ratings_count: 0,
              reviews_count: 0,
            });
            setFriends(friendsData ?? []);
            setLibraryCounts(finalCounts);
          }
        } else {
          const profileData = await getUserProfile(username);
          if (isMounted) {
            setProfileUser(profileData);
            setLibraryCounts(profileData.library ?? null);
            setFriends([]);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError("Failed to load user profile.");
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

  if (authLoading || loadingProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#201e2f] text-[#e0deeb]">
        Loading profile...
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
          {/* Banner Section */}
          <div className="relative h-48 w-full rounded-2xl overflow-hidden bg-[#373646]">
            {profileUser.banner_url ? (
              <img src={profileUser.banner_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-gradient-to-r from-[#4d3e68] via-[#373646] to-[#2a2838]" />
            )}
            <div className="absolute bottom-4 left-6 flex items-end gap-4">
              <Avatar className="size-20 border-4 border-[#201e2f] bg-[#4d3e68]">
                <AvatarImage src={profileUser.avatar_url || undefined} alt={profileUser.username} />
                <AvatarFallback><Gamepad2 className="size-8 text-[#c2ade7]" /></AvatarFallback>
              </Avatar>
              <div className="mb-1">
                <h1 className="text-2xl font-bold text-white">
                  {profileUser.nickname?.trim() || profileUser.username}
                </h1>
                <p className="text-xs text-[#b4aec7]">@{profileUser.username}</p>
              </div>
            </div>
            {isOwnProfile && (
              <div className="absolute right-4 top-4">
                <Button asChild variant="outline" className="h-8 gap-1.5 bg-[#373646]/80 border-[#55516c] text-xs text-white">
                  <Link to="/settings">
                    <Pencil className="size-3.5" /> Edit Profile
                  </Link>
                </Button>
              </div>
            )}
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Card className="p-4 bg-[#373646] border-[#55516c] text-white">
              <p className="text-xs text-[#b4aec7]">Total Games</p>
              <p className="text-xl font-bold">{libraryCounts?.all ?? 0}</p>
            </Card>
            <Card className="p-4 bg-[#373646] border-[#55516c] text-white">
              <p className="text-xs text-[#b4aec7]">Friends</p>
              <p className="text-xl font-bold">{profileUser.friend_count ?? friends.length}</p>
            </Card>
            <Card className="p-4 bg-[#373646] border-[#55516c] text-white">
              <p className="text-xs text-[#b4aec7]">Ratings</p>
              <p className="text-xl font-bold">{profileUser.ratings_count ?? 0}</p>
            </Card>
            <Card className="p-4 bg-[#373646] border-[#55516c] text-white">
              <p className="text-xs text-[#b4aec7]">Reviews</p>
              <p className="text-xl font-bold">{profileUser.reviews_count ?? 0}</p>
            </Card>
          </div>

          {/* Bio Section */}
          <div className="rounded-xl bg-[#373646] p-6 border border-[#55516c]">
            <h3 className="mb-2 text-sm font-semibold text-[#b4aec7] uppercase tracking-wider">About Me</h3>
            <p className="text-sm text-[#e0deeb] leading-relaxed">
              {profileUser.bio?.trim() || "No bio provided yet."}
            </p>
          </div>

          {/* Friends Section (if viewing own profile) */}
          {isOwnProfile && friends.length > 0 && (
            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-semibold text-white">Friends ({friends.length})</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {friends.map((friend) => (
                  <Link
                    key={friend.id}
                    to={`/profile/${encodeURIComponent(friend.username)}`}
                    className="flex items-center gap-3 p-3 rounded-xl bg-[#373646] border border-[#55516c] hover:border-[#c2ade7] transition-colors"
                  >
                    <Avatar className="size-10 bg-[#4d3e68]">
                      <AvatarImage src={friend.avatar_url || undefined} />
                      <AvatarFallback><Gamepad2 className="size-5 text-[#c2ade7]" /></AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{friend.nickname || friend.username}</p>
                      <p className="text-xs text-[#b4aec7] truncate">@{friend.username}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </main>
        <Footer />
      </div>
    </div>
  );
}