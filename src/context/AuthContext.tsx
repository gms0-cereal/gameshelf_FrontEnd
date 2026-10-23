import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { getCurrentUser, logout, type AuthUser } from "../services/authService";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  refreshUser: () => Promise<AuthUser | null>;
  logoutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  // Shares one in-flight /auth/me/ request between callers (e.g. StrictMode double effects).
  const inFlight = useRef<Promise<AuthUser | null> | null>(null);

  const refreshUser = useCallback((): Promise<AuthUser | null> => {
    if (inFlight.current) return inFlight.current;

    const request = getCurrentUser()
      .then((u) => {
        setUser(u);
        return u;
      })
      .catch(() => {
        // 401/403/network error: treat as logged out.
        setUser(null);
        return null;
      })
      .finally(() => {
        setLoading(false);
        inFlight.current = null;
      });

    inFlight.current = request;
    return request;
  }, []);

  const logoutUser = useCallback(async () => {
    // Throws on failure so callers can show an error; user is only cleared on success.
    await logout();
    setUser(null);
  }, []);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const value = useMemo(
    () => ({ user, loading, refreshUser, logoutUser }),
    [user, loading, refreshUser, logoutUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}