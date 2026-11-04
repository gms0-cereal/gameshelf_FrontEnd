import { useCallback, useEffect, useState, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Ban,
  Flag,
  Gamepad2,
  Loader2,
  Search,
  Unlock,
  UserMinus,
  UserPlus,
  Users,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MiniProfileCard from "@/components/social/MiniProfileCard";
import {
  getSuggestedPlayers,
  getFriends,
  getFriendRequests,
  getBlockedUsers,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
  blockUser,
  unblockUser,
  removeFriend,
  reportUser,
  type SocialUser,
  type Friendship as ServiceFriendship,
  type UserFavoriteGameEntry,
} from "@/services/Userservice";

type Player = SocialUser & {
  bio?: string | null;
  favorites?: UserFavoriteGameEntry[];
  banner_url?: string | null;
  visibility?: "public" | "private";
  is_friend?: boolean;
  has_incoming_request?: boolean;
};

type Friendship = ServiceFriendship & {
  user: Player;
  friend?: Player;
};

type Tab = "suggested" | "requests" | "friends" | "blocked";

type ModalConfig =
  | { type: "block"; player: Player }
  | { type: "unfriend"; player: Player }
  | { type: "report"; player: Player }
  | null;

const CARD =
  "rounded-2xl border border-[#38363F] bg-[#383044] " +
  "text-[#F0EEF5] shadow-none";

const PAGE_SIZE = 15;

const getErrorMessage = (error: unknown, fallback: string) => {
  const err = error as {
    response?: {
      data?: {
        detail?: string;
        username?: string[];
      };
    };
    message?: string;
  };

  return (
    err.response?.data?.detail ||
    err.response?.data?.username?.[0] ||
    err.message ||
    fallback
  );
};

const getDisplayName = (player: Player) =>
  player.nickname?.trim() || player.username;

export default function Friends() {
  const [activeTab, setActiveTab] = useState<Tab>("suggested");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [suggested, setSuggested] = useState<Player[]>([]);
  const [incoming, setIncoming] = useState<Friendship[]>([]);
  const [outgoing, setOutgoing] = useState<Friendship[]>([]);
  const [friends, setFriends] = useState<Player[]>([]);
  const [blocked, setBlocked] = useState<Player[]>([]);

  const [loading, setLoading] = useState(false);
  const [busyUsername, setBusyUsername] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Modal State Management
  const [modalConfig, setModalConfig] = useState<ModalConfig>(null);
  const [reportReason, setReportReason] = useState("harassment");
  const [reportDetails, setReportDetails] = useState("");

  // Fetch incoming request count on mount so badge is always live across tabs
  useEffect(() => {
    getFriendRequests("incoming")
      .then((res) => setIncoming((res.results ?? []) as Friendship[]))
      .catch(() => {});
  }, []);

  // Reset page when switching tabs or searching
  useEffect(() => {
    setPage(1);
  }, [activeTab, search]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      if (activeTab === "suggested") {
        const response = await getSuggestedPlayers(search.trim());
        setSuggested(response as Player[]);
      } else if (activeTab === "requests") {
        const [incomingResponse, outgoingResponse] = await Promise.all([
          getFriendRequests("incoming"),
          getFriendRequests("outgoing"),
        ]);

        setIncoming((incomingResponse.results ?? []) as Friendship[]);
        setOutgoing((outgoingResponse.results ?? []) as Friendship[]);
      } else if (activeTab === "friends") {
        const response = await getFriends(search.trim());
        setFriends((response ?? []) as Player[]);
      } else if (activeTab === "blocked") {
        const response = await getBlockedUsers(search.trim());
        setBlocked((response ?? []) as Player[]);
      }
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Couldn't load players. Check your connection and try again.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [activeTab, search]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const runAction = async (
    username: string,
    action: () => Promise<unknown>,
    successMessage: string,
  ) => {
    setBusyUsername(username);
    setError("");
    setNotice("");

    try {
      await action();
      setNotice(successMessage);
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err, "That action failed. Please try again."));
    } finally {
      setBusyUsername(null);
    }
  };

  const sendRequest = (player: Player) =>
    runAction(
      player.username,
      () => sendFriendRequest(player.username),
      `Friend request sent to ${getDisplayName(player)}.`,
    );

  const handleBlockConfirm = () => {
    if (!modalConfig || modalConfig.type !== "block") return;
    const player = modalConfig.player;
    setModalConfig(null);

    void runAction(
      player.username,
      () => blockUser(player.username),
      `Blocked ${getDisplayName(player)}.`,
    );
  };

  const handleUnfriendConfirm = () => {
    if (!modalConfig || modalConfig.type !== "unfriend") return;
    const player = modalConfig.player;
    setModalConfig(null);

    void runAction(
      player.username,
      () => removeFriend(player.username),
      `Removed ${getDisplayName(player)} from your friends.`,
    );
  };

  const handleReportConfirm = () => {
    if (!modalConfig || modalConfig.type !== "report") return;
    const player = modalConfig.player;
    const details = reportDetails.trim();
    setModalConfig(null);
    setReportDetails("");

    void runAction(
      player.username,
      () => reportUser(player.username, reportReason, details),
      `Report submitted for ${getDisplayName(player)}. Thank you.`,
    );
  };

  const handleUnblock = (player: Player) =>
    runAction(
      player.username,
      () => unblockUser(player.username),
      `Unblocked ${getDisplayName(player)}.`,
    );

  const acceptRequest = (request: Friendship) =>
    runAction(
      request.user.username,
      () => acceptFriendRequest(request.id),
      `You are now friends with ${getDisplayName(request.user)}.`,
    );

  const declineRequest = (request: Friendship) =>
    runAction(
      request.user.username,
      () => declineFriendRequest(request.id),
      `Declined ${getDisplayName(request.user)}'s request.`,
    );

  const cancelRequest = (request: Friendship) =>
    runAction(
      request.user.username,
      () => cancelFriendRequest(request.id),
      `Cancelled your request to ${getDisplayName(request.user)}.`,
    );

  const visibleRequests = [
    ...incoming.filter((request) => matchesSearch(request.user, search)),
    ...outgoing.filter((request) => matchesSearch(request.friend || request.user, search)),
  ];

  const currentCount =
    activeTab === "suggested"
      ? suggested.length
      : activeTab === "requests"
        ? visibleRequests.length
        : activeTab === "friends"
          ? friends.length
          : blocked.length;

  const totalPages = Math.ceil(currentCount / PAGE_SIZE) || 1;

  // Safety check to clamp page if items are removed/blocked and page goes out of bounds
  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  // Sliced lists for pagination
  const paginatedSuggested = suggested.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const paginatedIncoming = incoming.filter((r) => matchesSearch(r.user, search)).slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const paginatedOutgoing = outgoing.filter((r) => matchesSearch(r.friend || r.user, search)).slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const paginatedFriends = friends.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const paginatedBlocked = blocked.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="min-h-screen bg-[#1B1A20] text-[#F0EEF5]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col">
        <Navbar />

        <main className="flex flex-1 flex-col gap-8 px-5 pb-16 pt-10 md:px-8 xl:px-16">
          <section className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[#F0EEF5] md:text-4xl">
                {activeTab === "suggested"
                  ? "Discover Players"
                  : activeTab === "requests"
                    ? "Friend Requests"
                    : activeTab === "friends"
                      ? "My Friends"
                      : "Blocked Users"}
              </h1>

              <p className="mt-2 text-sm text-[#AAA6B5] md:text-base">
                {activeTab === "suggested"
                  ? "Find players who share your taste in games."
                  : activeTab === "requests"
                    ? "Manage your incoming and outgoing requests."
                    : activeTab === "friends"
                      ? "Your gaming circle on GameShelf."
                      : "Players you have blocked from your profile and suggestions."}
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm text-[#AAA6B5]">
              <Users className="size-5 text-[#C2ADE7]" />
              <span>{currentCount} players</span>
            </div>
          </section>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#AAA6B5]" />

            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by username or nickname..."
              aria-label="Search players"
              className="h-12 rounded-xl border-[#38363F] bg-[#383044] pl-12 text-[#F0EEF5] placeholder:text-[#AAA6B5] focus-visible:ring-[#C2ADE7]"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto border-b border-[#38363F] pb-3">
            {[
              { id: "suggested", label: "Suggested" },
              { id: "requests", label: "Requests" },
              { id: "friends", label: "My Friends" },
              { id: "blocked", label: "Blocked Users" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-[#C2ADE7] text-[#1B1A20] font-semibold"
                    : "bg-[#383044] text-[#AAA6B5] hover:bg-[#383044]/80 hover:text-[#F0EEF5]"
                }`}
              >
                {tab.label}
                {tab.id === "requests" && incoming.length > 0 && (
                  <span className="ml-2 rounded-full bg-[#C2ADE7] px-2 py-0.5 text-xs text-[#1B1A20]">
                    {incoming.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {notice && (
            <div
              role="status"
              className="rounded-xl border border-[#38363F] bg-[#383044] px-4 py-3 text-sm text-[#C2ADE7] animate-in fade-in duration-200"
            >
              {notice}
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="flex items-center justify-between gap-3 rounded-xl border border-[#3A272D] bg-[#3A272D]/50 px-4 py-3 text-sm text-[#EDB1B4]"
            >
              <span>{error}</span>
              <Button
                variant="outline"
                onClick={() => void loadData()}
                className="border-[#EDB1B4]/40 bg-transparent text-[#EDB1B4] hover:bg-[#3A272D]"
              >
                Retry
              </Button>
            </div>
          )}

          {/* Locked minimum height container */}
          <div className="min-h-[650px] flex flex-col justify-between">
            {loading ? (
              <div className="flex flex-col items-center gap-3 py-20 text-[#AAA6B5]">
                <Loader2 className="size-8 animate-spin text-[#C2ADE7]" />
                <p>Loading players...</p>
              </div>
            ) : (
              <div key={activeTab} className="flex flex-col gap-6 animate-in fade-in-50 duration-200">
                {activeTab === "suggested" && (
                  <section className="flex flex-col gap-4">
                    <h2 className="text-xl font-semibold text-[#F0EEF5]">Suggested players</h2>

                    {paginatedSuggested.length ? (
                      <div key={`suggested-page-${page}`} className="flex flex-col gap-4">
                        <AnimatePresence mode="popLayout">
                          {paginatedSuggested.map((player) => (
                            <PlayerCard
                              key={player.id}
                              player={player}
                              busy={busyUsername === player.username}
                              onAdd={() => void sendRequest(player)}
                              onBlock={() => setModalConfig({ type: "block", player })}
                              onReport={() => setModalConfig({ type: "report", player })}
                              addLabel="Add friend"
                            />
                          ))}
                        </AnimatePresence>
                      </div>
                    ) : (
                      <EmptyState
                        title="No players found"
                        description={
                          search.trim()
                            ? "Try another username or search term."
                            : "There are no new players to suggest right now."
                        }
                      />
                    )}
                  </section>
                )}

                {activeTab === "requests" && (
                  <section className="flex flex-col gap-8">
                    <div className="flex flex-col gap-4">
                      <h2 className="text-xl font-semibold text-[#F0EEF5]">Incoming requests</h2>

                      {paginatedIncoming.length ? (
                        <div key={`incoming-page-${page}`} className="flex flex-col gap-4">
                          <AnimatePresence mode="popLayout">
                            {paginatedIncoming.map((request) => (
                              <PlayerCard
                                key={request.id}
                                player={{ ...request.user, has_incoming_request: true }}
                                busy={busyUsername === request.user.username}
                                onAdd={() => void acceptRequest(request)}
                                onBlock={() => setModalConfig({ type: "block", player: request.user })}
                                onReport={() => setModalConfig({ type: "report", player: request.user })}
                                addLabel="Accept"
                                secondaryAction={{
                                  label: "Decline",
                                  icon: <X className="size-4" />,
                                  onClick: () => void declineRequest(request),
                                }}
                              />
                            ))}
                          </AnimatePresence>
                        </div>
                      ) : (
                        <EmptyState
                          title="No incoming requests"
                          description="When someone sends you a friend request, it'll appear here."
                        />
                      )}
                    </div>

                    <div className="flex flex-col gap-4">
                      <h2 className="text-xl font-semibold text-[#F0EEF5]">Sent requests</h2>

                      {paginatedOutgoing.length ? (
                        <div key={`outgoing-page-${page}`} className="flex flex-col gap-4">
                          <AnimatePresence mode="popLayout">
                            {paginatedOutgoing.map((request) => {
                              const targetPlayer = request.friend || request.user;
                              return (
                                <PlayerCard
                                  key={request.id}
                                  player={targetPlayer}
                                  busy={busyUsername === targetPlayer.username}
                                  onAdd={() => void cancelRequest(request)}
                                  onBlock={() => setModalConfig({ type: "block", player: targetPlayer })}
                                  onReport={() => setModalConfig({ type: "report", player: targetPlayer })}
                                  addLabel="Cancel request"
                                  addIcon={<X className="size-4" />}
                                />
                              );
                            })}
                          </AnimatePresence>
                        </div>
                      ) : (
                        <p className="text-sm text-[#AAA6B5]">
                          You haven't sent any pending requests.
                        </p>
                      )}
                    </div>
                  </section>
                )}

                {activeTab === "friends" && (
                  <section className="flex flex-col gap-4">
                    <h2 className="text-xl font-semibold text-[#F0EEF5]">My Friends</h2>

                    {paginatedFriends.length ? (
                      <div key={`friends-page-${page}`} className="flex flex-col gap-4">
                        <AnimatePresence mode="popLayout">
                          {paginatedFriends.map((player) => (
                            <PlayerCard
                              key={player.id}
                              player={{ ...player, is_friend: true }}
                              busy={busyUsername === player.username}
                              onAdd={() => setModalConfig({ type: "unfriend", player })}
                              onBlock={() => setModalConfig({ type: "block", player })}
                              onReport={() => setModalConfig({ type: "report", player })}
                              addLabel="Unfriend"
                              addIcon={<UserMinus className="size-4" />}
                            />
                          ))}
                        </AnimatePresence>
                      </div>
                    ) : (
                      <EmptyState
                        title="No friends yet"
                        description="Discover players and send a friend request to start building your gaming circle."
                      />
                    )}
                  </section>
                )}

                {activeTab === "blocked" && (
                  <section className="flex flex-col gap-4">
                    <h2 className="text-xl font-semibold text-[#F0EEF5]">Blocked Users</h2>

                    {paginatedBlocked.length ? (
                      <div key={`blocked-page-${page}`} className="flex flex-col gap-4">
                        <AnimatePresence mode="popLayout">
                          {paginatedBlocked.map((player) => (
                            <PlayerCard
                              key={player.id}
                              player={player}
                              busy={busyUsername === player.username}
                              onAdd={() => void handleUnblock(player)}
                              onBlock={() => setModalConfig({ type: "report", player })}
                              onReport={() => setModalConfig({ type: "report", player })}
                              addLabel="Unblock"
                              addIcon={<Unlock className="size-4" />}
                              isBlockedView
                            />
                          ))}
                        </AnimatePresence>
                      </div>
                    ) : (
                      <EmptyState
                        title="No blocked users"
                        description="Users you block will appear here."
                      />
                    )}
                  </section>
                )}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-[#38363F] pt-6 mt-auto">
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="border-[#38363F] bg-[#383044] text-[#F0EEF5] hover:bg-[#383044]/80 disabled:opacity-40"
                >
                  <ChevronLeft className="size-4 mr-1.5" /> Previous
                </Button>

                <span className="text-sm text-[#AAA6B5]">
                  Page <strong className="text-[#F0EEF5]">{page}</strong> of <strong className="text-[#F0EEF5]">{totalPages}</strong>
                </span>

                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className="border-[#38363F] bg-[#383044] text-[#F0EEF5] hover:bg-[#383044]/80 disabled:opacity-40"
                >
                  Next <ChevronRight className="size-4 ml-1.5" />
                </Button>
              </div>
            )}
          </div>
        </main>

        <Footer />
      </div>

      {/* CUSTOM CONFIRMATION & ACTION MODALS */}
      {modalConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in-0">
          <div className="w-full max-w-md rounded-2xl border border-[#38363F] bg-[#1B1A20] p-6 text-[#F0EEF5] shadow-2xl animate-in zoom-in-95">
            {modalConfig.type === "block" && (
              <>
                <h3 className="text-lg font-semibold text-[#F0EEF5]">Block Player</h3>
                <p className="mt-2 text-sm text-[#AAA6B5]">
                  Are you sure you want to block <span className="text-[#F0EEF5] font-medium">{getDisplayName(modalConfig.player)}</span>? They will no longer be able to interact with you or appear in your suggestions.
                </p>
                <div className="mt-6 flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setModalConfig(null)}
                    className="border-[#38363F] bg-transparent text-[#AAA6B5] hover:bg-[#383044] hover:text-[#F0EEF5]"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleBlockConfirm}
                    className="bg-[#3A272D] text-[#EDB1B4] border border-[#EDB1B4]/40 hover:bg-[#4d323a]"
                  >
                    Block User
                  </Button>
                </div>
              </>
            )}

            {modalConfig.type === "unfriend" && (
              <>
                <h3 className="text-lg font-semibold text-[#F0EEF5]">Remove Friend</h3>
                <p className="mt-2 text-sm text-[#AAA6B5]">
                  Are you sure you want to remove <span className="text-[#F0EEF5] font-medium">{getDisplayName(modalConfig.player)}</span> from your friends list?
                </p>
                <div className="mt-6 flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setModalConfig(null)}
                    className="border-[#38363F] bg-transparent text-[#AAA6B5] hover:bg-[#383044] hover:text-[#F0EEF5]"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUnfriendConfirm}
                    className="bg-[#3A272D] text-[#EDB1B4] border border-[#EDB1B4]/40 hover:bg-[#4d323a]"
                  >
                    Unfriend
                  </Button>
                </div>
              </>
            )}

            {modalConfig.type === "report" && (
              <>
                <h3 className="text-lg font-semibold text-[#F0EEF5]">Report Player</h3>
                <p className="mt-2 text-sm text-[#AAA6B5]">
                  Report <span className="text-[#F0EEF5] font-medium">{getDisplayName(modalConfig.player)}</span> for inappropriate behavior.
                </p>

                <div className="mt-4 flex flex-col gap-3">
                  <div>
                    <label className="text-xs font-medium text-[#AAA6B5]">Reason</label>
                    <select
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="mt-1 h-10 w-full rounded-lg border border-[#38363F] bg-[#383044] px-3 text-xs text-[#F0EEF5] outline-none focus:border-[#C2ADE7]"
                    >
                      <option value="harassment">Harassment or Bullying</option>
                      <option value="spam">Spam or Scams</option>
                      <option value="inappropriate_profile">Inappropriate Profile Content</option>
                      <option value="cheating">Cheating / Fair Play Violation</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-[#AAA6B5]">Additional Details (Optional)</label>
                    <textarea
                      value={reportDetails}
                      onChange={(e) => setReportDetails(e.target.value)}
                      placeholder="Provide context or links..."
                      rows={3}
                      className="mt-1 w-full rounded-lg border border-[#38363F] bg-[#383044] p-3 text-xs text-[#F0EEF5] outline-none placeholder:text-[#AAA6B5] focus:border-[#C2ADE7]"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setModalConfig(null)}
                    className="border-[#38363F] bg-transparent text-[#AAA6B5] hover:bg-[#383044] hover:text-[#F0EEF5]"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleReportConfirm}
                    className="bg-[#C2ADE7] text-[#1B1A20] font-semibold hover:bg-[#b098db]"
                  >
                    Submit Report
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function matchesSearch(player: Player, search: string) {
  const query = search.trim().toLowerCase();

  if (!query) return true;

  return (
    player.username.toLowerCase().includes(query) ||
    (player.nickname ?? "").toLowerCase().includes(query)
  );
}

type PlayerCardProps = {
  player: Player;
  busy: boolean;
  onAdd: () => void;
  onBlock: () => void;
  onReport: () => void;
  addLabel: string;
  addIcon?: React.ReactNode;
  secondaryAction?: {
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
  };
  isBlockedView?: boolean;
};

/** Optimized cover image handler */
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
    <div className="flex h-full w-full items-center justify-center">
      <Gamepad2 className="size-5 text-[#8870B6]" />
    </div>
  );
});
FavoriteCover.displayName = "FavoriteCover";

function PlayerCard({
  player,
  busy,
  onAdd,
  onBlock,
  onReport,
  addLabel,
  addIcon,
  secondaryAction,
  isBlockedView = false,
}: PlayerCardProps) {
  const favorites = player.favorites ?? [];
  const displayName = getDisplayName(player);
  const [showMiniProfile, setShowMiniProfile] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const cardHeight = 340;
    const spacing = 8;
    const overflowsBottom = rect.bottom + spacing + cardHeight > window.innerHeight;

    setOpenUpward(overflowsBottom);
    setShowMiniProfile(true);
  };

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className={`${CARD} p-4 md:p-5 relative`}
    >
      <div className="grid grid-cols-1 items-center gap-5 md:grid-cols-[minmax(0,1fr)_250px_120px] md:gap-6">
        <div className="flex min-w-0 items-center gap-4">
          
          {/* Hover Avatar Container */}
          <div 
            className="relative inline-block"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={() => setShowMiniProfile(false)}
          >
            <Avatar className="size-[76px] shrink-0 border-2 border-[#8870B6] bg-[#383044] md:size-[88px] cursor-pointer">
              <AvatarImage src={player.avatar_url || undefined} alt={displayName} />
              <AvatarFallback className="bg-[#383044]">
                <Gamepad2 className="size-9 text-[#C2ADE7]" />
              </AvatarFallback>
            </Avatar>

            {showMiniProfile && (
              <div className={`absolute left-0 z-50 ${openUpward ? "bottom-full mb-2" : "top-full mt-2"}`}>
                <MiniProfileCard
                  user={player}
                  onAddFriend={onAdd}
                  onBlock={onBlock}
                  onReport={onReport}
                />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-semibold text-[#F0EEF5] md:text-xl">
              {displayName}
            </h3>
            <p className="mb-2 text-sm text-[#AAA6B5]">@{player.username}</p>
            <p className="line-clamp-3 break-words text-sm leading-relaxed text-[#AAA6B5]">
              {player.bio?.trim() || "No bio yet."}
            </p>
          </div>
        </div>

        {/* Middle Column: Favorite Games Preview */}
        <div className="hidden md:flex flex-col gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#AAA6B5]">
            Favorites
          </span>
          {favorites.length > 0 ? (
            <div className="flex items-center gap-2">
              {favorites.slice(0, 3).map((fav, index) => (
                <div
                  key={fav.id || index}
                  className="size-14 shrink-0 overflow-hidden rounded-lg border border-[#38363F] bg-[#1B1A20]"
                  title={fav.title}
                >
                  <FavoriteCover src={fav.cover_image_url} title={fav.title} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#AAA6B5]">No favorite games listed.</p>
          )}
        </div>

        {/* Right Column: Actions */}
        <div className="flex flex-col gap-2 md:items-end">
          <Button
            onClick={onAdd}
            disabled={busy}
            className="w-full bg-[#C2ADE7] text-[#1B1A20] font-semibold hover:bg-[#b098db] md:w-auto text-xs h-9"
          >
            {addIcon}
            <span className={addIcon ? "ml-1.5" : ""}>{addLabel}</span>
          </Button>

          {secondaryAction && (
            <Button
              variant="outline"
              onClick={secondaryAction.onClick}
              disabled={busy}
              className="w-full border-[#38363F] bg-transparent text-[#AAA6B5] hover:bg-[#383044] hover:text-[#F0EEF5] md:w-auto text-xs h-9"
            >
              {secondaryAction.icon}
              <span className="ml-1.5">{secondaryAction.label}</span>
            </Button>
          )}

          {!isBlockedView && (
            <div className="flex items-center gap-2 mt-1">
              <button
                type="button"
                onClick={onBlock}
                className="text-[11px] text-[#AAA6B5] hover:text-[#EDB1B4] transition-colors"
              >
                Block
              </button>
              <span className="text-[#38363F]">•</span>
              <button
                type="button"
                onClick={onReport}
                className="text-[11px] text-[#AAA6B5] hover:text-[#EDB1B4] transition-colors"
              >
                Report
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.article>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div
      className={`${CARD} flex flex-col items-center gap-3 px-5 py-14 text-center`}
    >
      <Users className="size-10 text-[#8870B6]" />

      <h3 className="text-lg font-semibold text-[#F0EEF5]">{title}</h3>

      <p className="max-w-sm text-sm text-[#AAA6B5]">{description}</p>
    </div>
  );
}