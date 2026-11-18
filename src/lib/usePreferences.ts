import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "./api";
import { useAuth } from "./AuthContext";

export interface AppPreferences {
  language: "so" | "en";
  interests: string[];
  data_saver: boolean;
  audio_quality: "32" | "64" | "128" | "AUTO";
  video_quality: "144" | "240" | "360" | "480" | "720" | "1080" | "AUTO";
  autoplay: boolean;
  notify_live: boolean;
  notify_news: boolean;
  notify_programs: boolean;
  notify_episodes: boolean;
  notify_videos: boolean;
  onboarded: boolean;
}

const DEFAULT_PREFS: AppPreferences = {
  language: "so",
  interests: [],
  data_saver: false,
  audio_quality: "AUTO",
  video_quality: "AUTO",
  autoplay: true,
  notify_live: true,
  notify_news: true,
  notify_programs: true,
  notify_episodes: true,
  notify_videos: true,
  onboarded: false,
};

const STORAGE_KEY = "rh_prefs";

function readLocalPrefs(): AppPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFS;
  }
}

function writeLocalPrefs(prefs: AppPreferences) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // ignore
  }
}

export function usePreferences() {
  const { isAuthenticated } = useAuth();
  const [prefs, setPrefs] = useState<AppPreferences>(readLocalPrefs);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setPrefs(readLocalPrefs());
      return;
    }
    let cancelled = false;
    setLoading(true);
    apiFetch<Partial<AppPreferences> | null>("/api/listener/preferences")
      .then((remote) => {
        if (cancelled) return;
        if (remote) {
          const merged = { ...DEFAULT_PREFS, ...remote };
          setPrefs(merged);
          writeLocalPrefs(merged);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const updatePrefs = useCallback(
    async (patch: Partial<AppPreferences>) => {
      const next = { ...prefs, ...patch };
      setPrefs(next);
      writeLocalPrefs(next);
      if (isAuthenticated) {
        try {
          const saved = await apiFetch<AppPreferences>("/api/listener/preferences", {
            method: "PUT",
            body: JSON.stringify(patch),
          });
          if (saved) {
            const merged = { ...DEFAULT_PREFS, ...saved };
            setPrefs(merged);
            writeLocalPrefs(merged);
          }
        } catch {
          // keep local copy
        }
      }
      return next;
    },
    [prefs, isAuthenticated]
  );

  return { prefs, loading, updatePrefs };
}
