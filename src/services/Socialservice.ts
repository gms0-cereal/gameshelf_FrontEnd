import api from "@/lib/api";

export const getSuggestedPlayers = (search = "") =>
  api.get("/social/suggested-players/", {
    params: { search, limit: 50 },
  });

export const getFriends = (search = "") =>
  api.get("/social/friends/", {
    params: { search, limit: 100 },
  });

export const getFriendRequests = (direction: "incoming" | "outgoing") =>
  api.get("/social/friend-requests/", {
    params: { direction },
  });

export const sendFriendRequest = (username: string) =>
  api.post("/social/friend-requests/", { username });

export const acceptFriendRequest = (id: number) =>
  api.post(`/social/friend-requests/${id}/accept/`);

export const declineFriendRequest = (id: number) =>
  api.post(`/social/friend-requests/${id}/decline/`);

export const cancelFriendRequest = (id: number) =>
  api.post(`/social/friend-requests/${id}/cancel/`);

export const blockUser = (username: string) =>
  api.post("/social/blocks/", { username });

export const removeFriend = (username: string) =>
  api.delete(`/social/friends/${encodeURIComponent(username)}/`);