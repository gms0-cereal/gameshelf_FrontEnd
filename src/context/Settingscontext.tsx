import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { MotionConfig } from "framer-motion";

export type Visibility = "public" | "private";
export type SortKey = "newest" | "updated" | "oldest" | "title";
export type MotionPref = "system" | "reduce" | "full";

export const TEXT_SIZES = [
  { value: "small", label: "Small", scale: 0.9 },
  { value: "default", label: "Default", scale: 1 },
  { value: "large", label: "Large", scale: 1.15 },
  { value: "xlarge", label: "Extra large", scale: 1.3 },
] as const;
export type TextSize = (typeof TEXT_SIZES)[number]["value"];

export const PAGE_SIZES = [12, 24, 48] as const;

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "updated", label: "Recently updated" },
  { value: "oldest", label: "Oldest" },
  { value: "title", label: "Title (A–Z)" },
];

export type Settings = {
  textSize: TextSize;
  motion: MotionPref;
  hideMature: boolean; // hide 18+ games
  defaultVisibility: Visibility;
  playlistsPerPage: (typeof PAGE_SIZES)[number];
  defaultSort: SortKey;
};

export const DEFAULT_SETTINGS: Settings = {
  textSize: "default",
  motion: "system",
  hideMature: true,
  defaultVisibility: "public",
  playlistsPerPage: 12,
  defaultSort: "newest",
};

const STORAGE_KEY = "gameshelf:settings";

// Never trust stored data: anything missing or invalid falls back to the default.
function sanitize(raw: unknown): Settings {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    textSize: TEXT_SIZES.find((t) => t.value === r.textSize)?.value ?? DEFAULT_SETTINGS.textSize,
    motion: r.motion === "reduce" || r.motion === "full" ? r.motion : "system",
    hideMature: r.hideMature !== false, // hidden unless explicitly turned off
    defaultVisibility: r.defaultVisibility === "private" ? "private" : "public",
    playlistsPerPage:
      PAGE_SIZES.find((n) => n === r.playlistsPerPage) ?? DEFAULT_SETTINGS.playlistsPerPage,
    defaultSort:
      SORT_OPTIONS.find((o) => o.value === r.defaultSort)?.value ?? DEFAULT_SETTINGS.defaultSort,
  };
}

function load(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? sanitize(JSON.parse(raw)) : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

type SettingsContextValue = {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  reset: () => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

const MOTION_MODE = { system: "user", reduce: "always", full: "never" } as const;

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      /* storage unavailable: settings last for this visit only */
    }
  }, [settings]);

  // Text size: rem-based Tailwind classes follow the root font size, and
  // text-scale.css scales the arbitrary px sizes (text-[11px], leading-[41px]...).
  useLayoutEffect(() => {
    const scale = TEXT_SIZES.find((t) => t.value === settings.textSize)?.scale ?? 1;
    const root = document.documentElement;
    root.style.setProperty("--text-scale", String(scale));
    root.style.fontSize = `${scale * 100}%`;
  }, [settings.textSize]);

  // Keep other open tabs in sync.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setSettings(load());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const update = useCallback((patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch })), []);
  const reset = useCallback(() => setSettings(DEFAULT_SETTINGS), []);
  const value = useMemo(() => ({ settings, update, reset }), [settings, update, reset]);

  return (
    <SettingsContext.Provider value={value}>
      <MotionConfig reducedMotion={MOTION_MODE[settings.motion]}>{children}</MotionConfig>
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside <SettingsProvider>");
  return ctx;
}