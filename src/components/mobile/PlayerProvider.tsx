import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { apiFetch, trackAnalyticsEvent } from "../../lib/api";
import { useAuth } from "../../lib/AuthContext";

export interface PlayerTrack {
  id: string;
  type: "LIVE" | "EPISODE";
  title: string;
  subtitle?: string;
  imageUrl?: string;
  src: string;
  durationSeconds?: number;
  href?: string;
}

interface PlayerContextValue {
  track: PlayerTrack | null;
  playing: boolean;
  loading: boolean;
  error: string | null;
  currentTime: number;
  duration: number;
  volume: number;
  play: (track: PlayerTrack) => void;
  toggle: () => void;
  pause: () => void;
  seek: (seconds: number) => void;
  setVolume: (v: number) => void;
  close: () => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [track, setTrack] = useState<PlayerTrack | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.9);
  const { isAuthenticated } = useAuth();
  const trackRef = useRef<PlayerTrack | null>(null);

  useEffect(() => {
    trackRef.current = track;
  }, [track]);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "none";
    audio.volume = volume;
    audioRef.current = audio;

    const onPlay = () => {
      setPlaying(true);
      setLoading(false);
      setError(null);
      const t = trackRef.current;
      if (t) {
        trackAnalyticsEvent({
          event_type: t.type === "LIVE" ? "LIVE_PLAY" : "EPISODE_PLAY",
          item_type: t.type,
          item_id: t.id,
        });
      }
    };
    const onPause = () => {
      setPlaying(false);
      setLoading(false);
    };
    const onWaiting = () => setLoading(true);
    const onCanPlay = () => setLoading(false);
    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime || 0);
      if (audio.duration && Number.isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const onEnded = () => {
      setPlaying(false);
      const t = trackRef.current;
      if (t && isAuthenticated) {
        apiFetch("/api/listener/history", {
          method: "POST",
          body: JSON.stringify({
            item_type: t.type,
            item_id: t.id,
            title: t.title,
            subtitle: t.subtitle,
            image_url: t.imageUrl,
            href: t.href,
            progress_seconds: Math.floor(audio.duration || 0),
            duration_seconds: Math.floor(audio.duration || t.durationSeconds || 0),
            completed: true,
          }),
        }).catch(() => {});
      }
    };
    const onError = () => {
      setPlaying(false);
      setLoading(false);
      setError("Could not load audio stream.");
    };

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("canplay", onCanPlay);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    return () => {
      audio.pause();
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
    };
  }, []);

  const play = useCallback(
    (next: PlayerTrack) => {
      const audio = audioRef.current;
      if (!audio) return;
      if (!next.src) {
        toast.error(
          next.type === "LIVE"
            ? "Add your Icecast or HLS endpoint in Admin → Streams to go live."
            : "Audio for this episode has not been uploaded yet."
        );
        return;
      }
      setError(null);
      if (track?.id === next.id && track?.src === next.src) {
        if (audio.paused) {
          setLoading(true);
          audio.play().catch(() => {
            setLoading(false);
            setError("Playback blocked or unavailable.");
          });
        } else {
          audio.pause();
        }
        return;
      }
      setTrack(next);
      setCurrentTime(0);
      setDuration(next.durationSeconds || 0);
      setLoading(true);
      audio.src = next.src;
      audio.load();
      audio
        .play()
        .then(() => {
          if (isAuthenticated) {
            apiFetch("/api/listener/history", {
              method: "POST",
              body: JSON.stringify({
                item_type: next.type,
                item_id: next.id,
                title: next.title,
                subtitle: next.subtitle,
                image_url: next.imageUrl,
                href: next.href,
                progress_seconds: 0,
                duration_seconds: next.durationSeconds || 0,
                completed: false,
              }),
            }).catch(() => {});
          }
        })
        .catch(() => {
          setLoading(false);
          setError("Unable to play audio source.");
        });
    },
    [track, isAuthenticated]
  );

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !track) return;
    if (audio.paused) {
      setLoading(true);
      audio.play().catch(() => {
        setLoading(false);
        setError("Playback unavailable.");
      });
    } else {
      audio.pause();
    }
  }, [track]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const seek = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, seconds);
    setCurrentTime(audio.currentTime);
  }, []);

  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    setVolumeState(clamped);
    if (audioRef.current) audioRef.current.volume = clamped;
  }, []);

  const close = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
    }
    setTrack(null);
    setPlaying(false);
    setLoading(false);
    setError(null);
  }, []);

  return (
    <PlayerContext.Provider
      value={{
        track,
        playing,
        loading,
        error,
        currentTime,
        duration,
        volume,
        play,
        toggle,
        pause,
        seek,
        setVolume,
        close,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used inside PlayerProvider");
  return ctx;
}
