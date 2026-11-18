import { useCallback, useEffect, useState } from "react";
import { apiFetch, trackAnalyticsEvent } from "../../lib/api";
import { useAuth } from "../../lib/AuthContext";
import { toast } from "sonner";

export interface LibraryState {
  favorites: any[];
  follows: any[];
  history: any[];
  downloads: any[];
  playlists: any[];
}

const EMPTY_LIB: LibraryState = {
  favorites: [],
  follows: [],
  history: [],
  downloads: [],
  playlists: [],
};

export function useLibrary() {
  const { isAuthenticated } = useAuth();
  const [library, setLibrary] = useState<LibraryState>(EMPTY_LIB);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setLibrary(EMPTY_LIB);
      return;
    }
    setLoading(true);
    try {
      const data = await apiFetch<LibraryState>("/api/listener/library");
      setLibrary(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isFavorite = useCallback(
    (itemType: string, itemId: string) =>
      library.favorites.some((f) => f.item_type === itemType && f.item_id === itemId),
    [library.favorites]
  );

  const isFollowing = useCallback(
    (targetType: string, targetId: string) =>
      library.follows.some((f) => f.target_type === targetType && f.target_id === targetId),
    [library.follows]
  );

  const toggleFavorite = useCallback(
    async (item: {
      item_type: "PROGRAM" | "EPISODE" | "VIDEO" | "NEWS" | "PRESENTER";
      item_id: string;
      title?: string;
      subtitle?: string;
      image_url?: string;
      href?: string;
    }) => {
      if (!isAuthenticated) {
        toast.error("Sign in to save items to your library.");
        return false;
      }
      const res = await apiFetch<{ saved: boolean }>("/api/listener/favorites/toggle", {
        method: "POST",
        body: JSON.stringify(item),
      });
      if (res.saved) {
        trackAnalyticsEvent({ event_type: "FAVORITE", item_type: item.item_type, item_id: item.item_id });
        toast.success("Saved to favourites");
      } else {
        toast.success("Removed from favourites");
      }
      await refresh();
      return res.saved;
    },
    [isAuthenticated, refresh]
  );

  const toggleFollow = useCallback(
    async (target: {
      target_type: "PROGRAM" | "PRESENTER";
      target_id: string;
      title?: string;
      subtitle?: string;
      image_url?: string;
    }) => {
      if (!isAuthenticated) {
        toast.error("Sign in to follow programs and presenters.");
        return false;
      }
      const res = await apiFetch<{ following: boolean }>("/api/listener/follows/toggle", {
        method: "POST",
        body: JSON.stringify(target),
      });
      if (res.following) {
        trackAnalyticsEvent({ event_type: "FOLLOW", item_type: target.target_type, item_id: target.target_id });
        toast.success("Following");
      } else {
        toast.success("Unfollowed");
      }
      await refresh();
      return res.following;
    },
    [isAuthenticated, refresh]
  );

  const saveDownload = useCallback(
    async (item: {
      item_type: "EPISODE" | "VIDEO";
      item_id: string;
      title: string;
      subtitle?: string;
      image_url?: string;
      file_uri?: string;
      size_mb?: number;
    }) => {
      if (!isAuthenticated) {
        toast.error("Sign in to save downloads.");
        return;
      }
      await apiFetch("/api/listener/downloads", {
        method: "POST",
        body: JSON.stringify(item),
      });
      trackAnalyticsEvent({ event_type: "DOWNLOAD", item_type: item.item_type, item_id: item.item_id });
      toast.success("Saved to downloads");
      await refresh();
    },
    [isAuthenticated, refresh]
  );

  const removeDownload = useCallback(
    async (id: string) => {
      await apiFetch(`/api/listener/downloads/${id}`, { method: "DELETE" });
      toast.success("Download removed");
      await refresh();
    },
    [refresh]
  );

  const createPlaylist = useCallback(
    async (name: string) => {
      if (!isAuthenticated) {
        toast.error("Sign in to create playlists.");
        return null;
      }
      const pl = await apiFetch("/api/listener/playlists", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      toast.success("Playlist created");
      await refresh();
      return pl;
    },
    [isAuthenticated, refresh]
  );

  const deletePlaylist = useCallback(
    async (id: string) => {
      await apiFetch(`/api/listener/playlists/${id}`, { method: "DELETE" });
      toast.success("Playlist deleted");
      await refresh();
    },
    [refresh]
  );

  return {
    library,
    loading,
    refresh,
    isFavorite,
    isFollowing,
    toggleFavorite,
    toggleFollow,
    saveDownload,
    removeDownload,
    createPlaylist,
    deletePlaylist,
  };
}
