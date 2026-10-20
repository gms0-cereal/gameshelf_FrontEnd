import { useCallback, useEffect, useState } from "react";
import {
  Ban,
  Check,
  Gamepad2,
  Loader2,
  Search,
  UserMinus,
  UserPlus,
  Users,
  X,
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

import {
  getSuggestedPlayers,
  getFriends,
  getFriendRequests,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
  blockUser,
  removeFriend,
  type SocialUser,
  type Friendship as ServiceFriendship,
  type SuggestedUser,
} from "@/services/Socialservice";

type FavoriteGame = {
  id?: number;
  title: string;
  image?: string | null;
};

type Player = SocialUser & {
  bio?: string | null;
  favorites?: FavoriteGame[];
};

type Friendship = ServiceFriendship & {
  user: Player;
  friend?: Player;
};

type Tab = "suggested" | "requests" | "friends";

const CARD =
  "rounded-2xl border border-[#514961] bg-[#373646] " +
  "text-[#e0deeb] shadow-none";

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

  const [suggested, setSuggested] = useState<Player[]>([]);
  const [incoming, setIncoming] = useState<Friendship[]>([]);
  const [outgoing, setOutgoing] = useState<Friendship[]>([]);
  const [friends, setFriends] = useState<Player[]>([]);

  const [loading, setLoading] = useState(false);
  const [busyUsername, setBusyUsername] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

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
        setFriends(response as Player[]);
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

  const blockPlayer = (player: Player) => {
    if (
      !window.confirm(
        `Block ${getDisplayName(player)}? They will no longer appear in your suggestions.`,
      )
    ) {
      return;
    }

    void runAction(
      player.username,
      () => blockUser(player.username),
      `Blocked ${getDisplayName(player)}.`,
    );
  };

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

  const unfriend = (player: Player) => {
    if (
      !window.confirm(
        `Remove ${getDisplayName(player)} from your friends?`,
      )
    ) {
      return;
    }

    void runAction(
      player.username,
      () => removeFriend(player.username),
      `Removed ${getDisplayName(player)} from your friends.`,
    );
  };

  const visibleRequests = [
    ...incoming.filter((request) => matchesSearch(request.user, search)),
    ...outgoing.filter((request) => matchesSearch(request.user, search)),
  ];

  const currentCount =
    activeTab === "suggested"
      ? suggested.length
      : activeTab === "requests"
        ? visibleRequests.length
        : friends.length;

  return (
    <div className="min-h-screen bg-[#201e2f] text-[#e0deeb]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col">
        <Navbar />

        <main className="flex flex-1 flex-col gap-8 px-5 pb-16 pt-10 md:px-8 xl:px-16">
          <section className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                {activeTab === "suggested"
                  ? "Discover Players"
                  : activeTab === "requests"
                    ? "Friend Requests"
                    : "My Friends"}
              </h1>

              <p className="mt-2 text-sm text-[#b4aec7] md:text-base">
                {activeTab === "suggested"
                  ? "Find players who share your taste in games."
                  : activeTab === "requests"
                    ? "Manage your incoming and outgoing requests."
                    : "Your gaming circle on GameShelf."}
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm text-[#b4aec7]">
              <Users className="size-5 text-[#c2ade7]" />
              <span>{currentCount} players</span>
            </div>
          </section>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#b4aec7]" />

            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by username or nickname..."
              aria-label="Search players"
              className="h-12 rounded-xl border-[#514961] bg-[#373646] pl-12 text-[#e0deeb] placeholder:text-[#928ba7] focus-visible:ring-[#8870b6]"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto border-b border-[#514961] pb-3">
            {[
              { id: "suggested", label: "Suggested" },
              { id: "requests", label: "Requests" },
              { id: "friends", label: "My Friends" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-[#8063a8] text-white"
                    : "bg-[#373646] text-[#b4aec7] hover:bg-[#454256] hover:text-white"
                }`}
              >
                {tab.label}
                {tab.id === "requests" && incoming.length > 0 && (
                  <span className="ml-2 rounded-full bg-[#c2ade7] px-2 py-0.5 text-xs text-[#201e2f]">
                    {incoming.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {notice && (
            <div
              role="status"
              className="rounded-xl border border-[#75618e] bg-[#373646] px-4 py-3 text-sm text-[#c2ade7]"
            >
              {notice}
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="flex items-center justify-between gap-3 rounded-xl border border-[#a65e72] bg-[#4a303d] px-4 py-3 text-sm text-[#f1b9c4]"
            >
              <span>{error}</span>
              <Button
                variant="outline"
                onClick={() => void loadData()}
                className="border-[#a65e72] bg-transparent text-[#f1b9c4]"
              >
                Retry
              </Button>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center gap-3 py-20 text-[#b4aec7]">
              <Loader2 className="size-8 animate-spin text-[#c2ade7]" />
              <p>Loading players...</p>
            </div>
          ) : (
            <>
              {activeTab === "suggested" && (
                <section className="flex flex-col gap-4">
                  <h2 className="text-xl font-semibold">Suggested players</h2>

                  {suggested.length ? (
                    suggested.map((player) => (
                      <PlayerCard
                        key={player.id}
                        player={player}
                        busy={busyUsername === player.username}
                        onAdd={() => void sendRequest(player)}
                        onBlock={() => blockPlayer(player)}
                        addLabel="Add friend"
                      />
                    ))
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
                <section className="flex flex-col gap-6">
                  <div className="flex flex-col gap-4">
                    <h2 className="text-xl font-semibold">
                      Incoming requests
                    </h2>

                    {incoming.filter((request) =>
                      matchesSearch(request.user, search),
                    ).length ? (
                      incoming
                        .filter((request) =>
                          matchesSearch(request.user, search),
                        )
                        .map((request) => (
                          <PlayerCard
                            key={request.id}
                            player={request.user}
                            busy={busyUsername === request.user.username}
                            onAdd={() => void acceptRequest(request)}
                            onBlock={() => blockPlayer(request.user)}
                            addLabel="Accept"
                            secondaryAction={{
                              label: "Decline",
                              icon: <X className="size-4" />,
                              onClick: () => void declineRequest(request),
                            }}
                          />
                        ))
                    ) : (
                      <EmptyState
                        title="No incoming requests"
                        description="When someone sends you a friend request, it'll appear here."
                      />
                    )}
                  </div>

                  <div className="flex flex-col gap-4">
                    <h2 className="text-xl font-semibold">
                      Sent requests
                    </h2>

                    {outgoing.filter((request) =>
                      matchesSearch(request.user, search),
                    ).length ? (
                      outgoing
                        .filter((request) =>
                          matchesSearch(request.user, search),
                        )
                        .map((request) => (
                          <PlayerCard
                            key={request.id}
                            player={request.user}
                            busy={busyUsername === request.user.username}
                            onAdd={() => void cancelRequest(request)}
                            onBlock={() => blockPlayer(request.user)}
                            addLabel="Cancel request"
                            addIcon={<X className="size-4" />}
                          />
                        ))
                    ) : (
                      <p className="text-sm text-[#b4aec7]">
                        You haven't sent any pending requests.
                      </p>
                    )}
                  </div>
                </section>
              )}

              {activeTab === "friends" && (
                <section className="flex flex-col gap-4">
                  <h2 className="text-xl font-semibold">My Friends</h2>

                  {friends.length ? (
                    friends.map((player) => (
                      <PlayerCard
                        key={player.id}
                        player={player}
                        busy={busyUsername === player.username}
                        onAdd={() => unfriend(player)}
                        onBlock={() => blockPlayer(player)}
                        addLabel="Unfriend"
                        addIcon={<UserMinus className="size-4" />}
                      />
                    ))
                  ) : (
                    <EmptyState
                      title="No friends yet"
                      description="Discover players and send a friend request to start building your gaming circle."
                    />
                  )}
                </section>
              )}
            </>
          )}
        </main>

        <Footer />
      </div>
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
  addLabel: string;
  addIcon?: React.ReactNode;
  secondaryAction?: {
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
  };
};

function PlayerCard({
  player,
  busy,
  onAdd,
  onBlock,
  addLabel,
  addIcon,
  secondaryAction,
}: PlayerCardProps) {
  const favorites = player.favorites ?? [];
  const displayName = getDisplayName(player);

  return (
    <article className={`${CARD} p-4 md:p-5`}>
      <div className="grid grid-cols-1 items-center gap-5 md:grid-cols-[minmax(0,1fr)_250px_120px] md:gap-6">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar className="size-[76px] shrink-0 border-2 border-[#8870b6] bg-[#4d3e68] md:size-[88px]">
            <AvatarImage
              src={player.avatar_url || undefined}
              alt={displayName}
            />
            <AvatarFallback className="bg-[#4d3e68]">
              <Gamepad2 className="size-9 text-[#c2ade7]" />
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-semibold text-white md:text-xl">
              {displayName}
            </h3>

            <p className="mb-2 text-sm text-[#b4aec7]">
              @{player.username}
            </p>

            <p
              className="line-clamp-3 break-words text-sm leading-relaxed text-[#d0ccdc]"
              title={player.bio || ""}
            >
              {player.bio?.trim() || "No bio yet."}
            </p>
          </div>
        </div>

        <div className="min-w-0">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#b4aec7]">
            Favorite games
          </p>

          {favorites.length > 0 ? (
            <div className="flex gap-3">
              {favorites.slice(0, 3).map((game, index) => (
                <div
                  key={game.id ?? `${game.title}-${index}`}
                  className="min-w-0 flex-1"
                >
                  <div className="aspect-[3/4] overflow-hidden rounded-lg bg-[#292638] ring-1 ring-inset ring-[#514961]">
                    {game.image ? (
                      <img
                        src={game.image}
                        alt={game.title}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Gamepad2 className="size-7 text-[#8870b6]" />
                      </div>
                    )}
                  </div>

                  <p
                    className="mt-1.5 truncate text-xs text-[#c2bad0]"
                    title={game.title}
                  >
                    {game.title}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#b4aec7]">
              This user has no favourite games.
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 md:flex-col">
          <Button
            disabled={busy}
            onClick={onAdd}
            variant="outline"
            className="h-10 min-w-0 flex-1 gap-2 border-[#75618e] bg-[#8063a8] text-white hover:bg-[#9274bb] md:w-full md:flex-none"
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              addIcon ?? <UserPlus className="size-4" />
            )}

            <span className="text-xs sm:text-sm">{addLabel}</span>
          </Button>

          {secondaryAction && (
            <Button
              disabled={busy}
              onClick={secondaryAction.onClick}
              variant="outline"
              className="h-10 flex-1 gap-2 border-[#75618e] bg-transparent text-[#d0ccdc] hover:bg-[#454256] md:w-full md:flex-none"
            >
              {secondaryAction.icon}
              <span className="text-xs sm:text-sm">
                {secondaryAction.label}
              </span>
            </Button>
          )}

          <Button
            disabled={busy}
            onClick={onBlock}
            variant="outline"
            aria-label={`Block ${displayName}`}
            title={`Block ${displayName}`}
            className="size-10 shrink-0 border-[#514961] bg-transparent text-[#d99ca9] hover:border-[#d99ca9] hover:bg-[#4a303d] hover:text-[#f1b9c4] md:w-full"
          >
            <Ban className="size-4" />
            <span className="sr-only">Block player</span>
          </Button>
        </div>
      </div>
    </article>
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
      <Users className="size-10 text-[#8870b6]" />

      <h3 className="text-lg font-semibold">{title}</h3>

      <p className="max-w-sm text-sm text-[#b4aec7]">{description}</p>
    </div>
  );
}