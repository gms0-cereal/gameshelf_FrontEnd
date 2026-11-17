import { useEffect, useState } from "react";
import { getCurrentUser } from "@/services/authService"; // ← replace with the path the grep command found

const ROLE_LABELS: Record<string, string> = {
  user: "User",
  moderator: "Moderator",
  admin: "Administrator",
};

export interface CurrentUserView {
  name: string;
  initials: string;
  role: string;
}

const EMPTY: CurrentUserView = { name: "…", initials: "?", role: "" };

// Cached so the layout doesn't refetch /users/me/ on every page navigation.
let cached: CurrentUserView | null = null;
let inflight: Promise<CurrentUserView> | null = null;

function load(): Promise<CurrentUserView> {
  if (!inflight) {
    inflight = getCurrentUser()
      .then((u) => {
        const name = u.nickname?.trim() || u.username;
        const initials =
          name
            .split(/[\s_.-]+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((p) => p[0].toUpperCase())
            .join("") || "?";
        cached = {
          name,
          initials,
          role: ROLE_LABELS[u.role] ?? "User",
        };
        return cached;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

export function useCurrentUser(): CurrentUserView {
  const [user, setUser] = useState<CurrentUserView>(cached ?? EMPTY);

  useEffect(() => {
    if (cached) return;
    let alive = true;
    load()
      .then((u) => alive && setUser(u))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  return user;
}

// Call this on logout so the next login doesn't show the old account.
export function clearCurrentUserCache() {
  cached = null;
}