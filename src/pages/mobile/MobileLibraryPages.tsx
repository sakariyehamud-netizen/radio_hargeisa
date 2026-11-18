import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Heart,
  Download,
  History,
  Users,
  ListMusic,
  Bell,
  Settings,
  Info,
  LogOut,
  Library,
  Volume2,
  Globe,
  Shield,
  ChevronRight,
  Trash2,
  Plus,
  Check,
  Radio,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../lib/AuthContext";
import { useLibrary } from "../../components/mobile/useLibrary";
import { usePreferences } from "../../lib/usePreferences";
import { BrandLogo } from "../../components/shared/Brand";
import { EmptyState } from "../../components/shared/EmptyState";
import { StatusBadge } from "../../components/shared/StatusBadge";
import {
  SettingsGroup,
  SettingsLink,
  SettingsToggle,
  SettingsChoice,
} from "../../components/mobile/SettingsParts";
import {
  AUDIO_QUALITIES,
  VIDEO_QUALITIES,
  BRAND,
} from "../../lib/constants";
import { ROLE_LABELS, isStaffRole, landingForRole } from "../../lib/rbac";
import { relativeTime } from "../../lib/format";
import { apiFetch } from "../../lib/api";
import { cn } from "../../lib/utils";

function LibraryTabs() {
  const { pathname } = useLocation();
  const tabs = [
    { label: "Library", to: "/mobile/library" },
    { label: "Favourites", to: "/mobile/library/favorites" },
    { label: "Downloads", to: "/mobile/library/downloads" },
    { label: "History", to: "/mobile/library/history" },
    { label: "Following", to: "/mobile/library/following" },
    { label: "Playlists", to: "/mobile/library/playlists" },
  ];
  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-2">
      {tabs.map((t) => {
        const active = pathname === t.to;
        return (
          <Link
            key={t.to}
            to={t.to}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-[11.5px] font-bold transition-colors",
              active
                ? "border-[#047422] bg-[#047422] text-white"
                : "border-[#E7E9EC] bg-white text-[#050505]"
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}

export function MobileLibraryPage() {
  const { isAuthenticated } = useAuth();
  const { library } = useLibrary();

  const rows = [
    {
      label: "Favourites",
      count: `${library.favorites.length} items`,
      icon: Heart,
      to: "/mobile/library/favorites",
    },
    {
      label: "Downloads",
      count: `${library.downloads.length} items`,
      icon: Download,
      to: "/mobile/library/downloads",
    },
    {
      label: "History",
      count: `${library.history.length} items`,
      icon: History,
      to: "/mobile/library/history",
    },
    {
      label: "Following",
      count: `${library.follows.length} items`,
      icon: Users,
      to: "/mobile/library/following",
    },
    {
      label: "Playlists",
      count: `${library.playlists.length} playlists`,
      icon: ListMusic,
      to: "/mobile/library/playlists",
    },
  ];

  return (
    <div className="px-4 pt-4 pb-6 space-y-4">
      <LibraryTabs />
      <h1 className="text-[22px] font-extrabold tracking-[-0.02em] text-[#050505]">
        Your library
      </h1>

      {!isAuthenticated ? (
        <div className="rounded-2xl border border-[#E7E9EC] bg-white p-6 text-center">
          <p className="text-[15px] font-extrabold text-[#050505]">
            Your library lives here
          </p>
          <p className="mt-1 text-[12.5px] text-[#6B7280]">
            Sign in to sync your favourites, listening history, and playlists.
          </p>
          <Link
            to="/login?returnTo=/mobile/library"
            className="mt-4 inline-flex rounded-xl bg-[#047422] px-5 py-2.5 text-[12.5px] font-bold text-white"
          >
            Sign in
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-2.5">
            {rows.map((r) => {
              const Icon = r.icon;
              return (
                <Link
                  key={r.label}
                  to={r.to}
                  className="flex items-center justify-between rounded-2xl border border-[#E7E9EC] bg-white p-3.5 transition-colors hover:bg-[#FAFBFC]"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E7F5EA] text-[#047422]">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-[13px] font-bold text-[#050505]">
                        {r.label}
                      </p>
                      <p className="text-[11px] text-[#6B7280]">{r.count}</p>
                    </div>
                  </div>
                  <span className="text-[12px] font-bold text-[#047422]">
                    Open
                  </span>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-[#050505] p-5 text-white">
            <div>
              <p className="text-[9.5px] font-bold uppercase tracking-[0.16em] text-[#4ADE80]">
                SAVED NEWS
              </p>
              <p className="mt-0.5 text-[14px] font-extrabold">
                Stories you bookmarked
              </p>
            </div>
            <Link
              to="/mobile/library/favorites"
              className="rounded-full bg-white/15 px-4 py-1.5 text-[12px] font-bold text-white hover:bg-white/25"
            >
              View
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

export function MobileFavoritesPage() {
  const { library, toggleFavorite } = useLibrary();
  return (
    <div className="px-4 pt-4 pb-6 space-y-4">
      <LibraryTabs />
      <h1 className="text-[22px] font-extrabold tracking-[-0.02em] text-[#050505]">
        Favourites
      </h1>
      {library.favorites.length === 0 ? (
        <EmptyState icon={Heart} title="Nothing saved yet" />
      ) : (
        <div className="space-y-2.5">
          {library.favorites.map((f) => (
            <div
              key={f.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-[#E7E9EC] bg-white p-3.5"
            >
              <Link to={f.href || "/mobile/home"} className="min-w-0 flex-1">
                <span className="rounded-full bg-[#F5F6F7] px-2 py-0.5 text-[9px] font-bold uppercase text-[#6B7280]">
                  {f.item_type}
                </span>
                <p className="mt-1 truncate text-[13px] font-bold text-[#050505]">
                  {f.title}
                </p>
                {f.subtitle && (
                  <p className="truncate text-[11px] text-[#6B7280]">
                    {f.subtitle}
                  </p>
                )}
              </Link>
              <button
                type="button"
                onClick={() =>
                  toggleFavorite({
                    item_type: f.item_type,
                    item_id: f.item_id,
                  })
                }
                className="rounded-lg p-2 text-[#6B7280] hover:bg-[#FDE7E7] hover:text-[#C40D0F]"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function MobileFollowingPage() {
  const { library, toggleFollow } = useLibrary();
  return (
    <div className="px-4 pt-4 pb-6 space-y-4">
      <LibraryTabs />
      <h1 className="text-[22px] font-extrabold tracking-[-0.02em] text-[#050505]">
        Following
      </h1>
      {library.follows.length === 0 ? (
        <EmptyState icon={Users} title="Not following anything yet" />
      ) : (
        <div className="space-y-2.5">
          {library.follows.map((f) => (
            <div
              key={f.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-[#E7E9EC] bg-white p-3.5"
            >
              <Link
                to={
                  f.target_type === "PROGRAM"
                    ? `/mobile/programs/${f.target_id}`
                    : `/mobile/presenters/${f.target_id}`
                }
                className="min-w-0 flex-1"
              >
                <p className="truncate text-[13px] font-bold text-[#050505]">
                  {f.title}
                </p>
                <p className="truncate text-[11px] text-[#6B7280]">
                  {f.subtitle || f.target_type}
                </p>
              </Link>
              <button
                type="button"
                onClick={() =>
                  toggleFollow({
                    target_type: f.target_type,
                    target_id: f.target_id,
                  })
                }
                className="rounded-full border border-[#E7E9EC] px-3 py-1 text-[11px] font-bold text-[#6B7280] hover:text-[#C40D0F]"
              >
                Unfollow
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function MobileHistoryPage() {
  const { library } = useLibrary();
  return (
    <div className="px-4 pt-4 pb-6 space-y-4">
      <LibraryTabs />
      <h1 className="text-[22px] font-extrabold tracking-[-0.02em] text-[#050505]">
        Listening history
      </h1>
      {library.history.length === 0 ? (
        <EmptyState icon={History} title="Nothing played yet" />
      ) : (
        <div className="space-y-2.5">
          {library.history.map((h) => {
            const pct =
              h.duration_seconds > 0
                ? Math.min(100, Math.round((h.progress_seconds / h.duration_seconds) * 100))
                : h.completed
                  ? 100
                  : 15;
            return (
              <Link
                key={h.id}
                to={h.href || "/mobile/episodes"}
                className="block rounded-2xl border border-[#E7E9EC] bg-white p-3.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-[13px] font-bold text-[#050505]">
                    {h.title}
                  </p>
                  {h.completed && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#047422]">
                      <Check className="h-3 w-3" /> Played
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-[11px] text-[#6B7280]">
                  {relativeTime(h.last_played_at)}
                </p>
                <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-[#F0F1F3]">
                  <div className="h-full bg-[#047422]" style={{ width: `${pct}%` }} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function MobileDownloadsPage() {
  const { library, removeDownload } = useLibrary();
  return (
    <div className="px-4 pt-4 pb-6 space-y-4">
      <LibraryTabs />
      <h1 className="text-[22px] font-extrabold tracking-[-0.02em] text-[#050505]">
        Downloads
      </h1>
      {library.downloads.length === 0 ? (
        <EmptyState icon={Download} title="No downloads yet" />
      ) : (
        <div className="space-y-2.5">
          {library.downloads.map((d) => (
            <div
              key={d.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-[#E7E9EC] bg-white p-3.5"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-bold text-[#050505]">
                  {d.title}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-[11px] text-[#6B7280]">
                    {d.size_mb || 0} MB
                  </span>
                  <StatusBadge status={d.status || "READY"} />
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeDownload(d.id)}
                className="rounded-lg p-2 text-[#6B7280] hover:bg-[#FDE7E7] hover:text-[#C40D0F]"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function MobilePlaylistsPage() {
  const { library, createPlaylist, deletePlaylist } = useLibrary();
  const [name, setName] = useState("");
  const [activePlaylist, setActivePlaylist] = useState<any>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await createPlaylist(name.trim());
    setName("");
  };

  return (
    <div className="px-4 pt-4 pb-6 space-y-4">
      <LibraryTabs />
      <h1 className="text-[22px] font-extrabold tracking-[-0.02em] text-[#050505]">
        Playlists
      </h1>

      <form onSubmit={handleCreate} className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New playlist name"
          className="flex-1 rounded-xl border border-[#E7E9EC] bg-white px-3 py-2 text-[12.5px] focus:border-[#047422] focus:outline-none"
        />
        <button
          type="submit"
          className="inline-flex items-center gap-1 rounded-xl bg-[#047422] px-3.5 py-2 text-[12px] font-bold text-white"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Create</span>
        </button>
      </form>

      {library.playlists.length === 0 ? (
        <EmptyState icon={ListMusic} title="No playlists yet" />
      ) : (
        <div className="space-y-2.5">
          {library.playlists.map((pl) => (
            <div
              key={pl.id}
              onClick={() => setActivePlaylist(pl)}
              className="flex cursor-pointer items-center justify-between rounded-2xl border border-[#E7E9EC] bg-white p-3.5"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E7F5EA] text-[#047422]">
                  <ListMusic className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[13px] font-bold text-[#050505]">{pl.name}</p>
                  <p className="text-[11px] text-[#6B7280]">
                    {(pl.items || []).length} items
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  deletePlaylist(pl.id);
                }}
                className="rounded-lg p-2 text-[#6B7280] hover:text-[#C40D0F]"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {activePlaylist && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
          <div className="w-full max-w-[480px] rounded-t-3xl bg-white p-5">
            <div className="flex items-center justify-between border-b border-[#F0F1F3] pb-3">
              <h3 className="text-[15px] font-extrabold text-[#050505]">
                {activePlaylist.name}
              </h3>
              <button
                type="button"
                onClick={() => setActivePlaylist(null)}
                className="text-[12px] font-bold text-[#047422]"
              >
                Close
              </button>
            </div>
            <div className="mt-4 space-y-2">
              {(activePlaylist.items || []).length === 0 ? (
                <p className="py-6 text-center text-[12.5px] text-[#6B7280]">
                  No episodes in this playlist yet.
                </p>
              ) : (
                activePlaylist.items.map((it: any, idx: number) => (
                  <Link
                    key={idx}
                    to={`/mobile/episodes/${it.item_id}`}
                    className="block rounded-xl border border-[#E7E9EC] p-3"
                  >
                    <p className="text-[13px] font-bold text-[#050505]">
                      {it.title}
                    </p>
                    <p className="text-[11px] text-[#6B7280]">{it.subtitle}</p>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function MobileProfilePage() {
  const { user, role, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const links = [
    { label: "Library", to: "/mobile/library", icon: Library },
    { label: "Notifications", to: "/mobile/notifications", icon: Bell },
    { label: "Settings", to: "/mobile/settings", icon: Settings },
    { label: "About Radio Hargeysa", to: "/mobile/about", icon: Info },
  ];

  return (
    <div className="px-4 pt-5 pb-6 space-y-3">
      {/* Black profile card */}
      <div className="flex items-center gap-3.5 rounded-3xl bg-[#050505] p-5 text-white">
        <BrandLogo size={56} />
        <div className="min-w-0">
          <p className="truncate text-[16px] font-extrabold">
            {isAuthenticated ? user?.full_name || "Listener" : "Guest listener"}
          </p>
          <p className="truncate text-[12px] text-white/60">
            {isAuthenticated ? user?.email : "Not signed in"}
          </p>
          <span className="mt-2 inline-block rounded-full bg-[#047422] px-2.5 py-0.5 text-[9.5px] font-extrabold uppercase tracking-[0.12em] text-white">
            {(ROLE_LABELS[role] || "LISTENER").toUpperCase()}
          </span>
        </div>
      </div>

      {/* Staff shortcut */}
      {isAuthenticated && isStaffRole(role) && (
        <Link
          to={landingForRole(role)}
          className="flex items-center justify-between rounded-2xl border border-[#047422]/30 bg-[#E7F5EA] p-4"
        >
          <div>
            <p className="text-[13px] font-extrabold text-[#047422]">
              You have staff access
            </p>
            <p className="text-[11.5px] text-[#1F2937]">
              Open your {ROLE_LABELS[role]} dashboard
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-[#047422]" />
        </Link>
      )}

      {/* Link cards */}
      <div className="space-y-2.5 pt-1">
        {links.map((l) => {
          const Icon = l.icon;
          return (
            <Link
              key={l.to}
              to={l.to}
              className="flex items-center justify-between rounded-2xl border border-[#E7E9EC] bg-white p-4 transition-colors hover:bg-[#FAFBFC]"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F5F6F7] text-[#4B5563]">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-[13.5px] font-bold text-[#050505]">
                  {l.label}
                </span>
              </div>
              <ChevronRight className="h-4 w-4 text-[#C4C9CF]" />
            </Link>
          );
        })}
      </div>

      {isAuthenticated ? (
        <button
          type="button"
          onClick={async () => {
            await logout();
            toast.success("Signed out");
            navigate("/mobile/home");
          }}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#E7E9EC] bg-white py-3.5 text-[13px] font-bold text-[#C40D0F] hover:bg-[#FEF7F7]"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign out</span>
        </button>
      ) : (
        <Link
          to="/login?returnTo=/mobile/profile"
          className="flex w-full items-center justify-center rounded-2xl bg-[#047422] py-3.5 text-[13px] font-bold text-white"
        >
          Sign in to save your library
        </Link>
      )}

      <p className="pt-2 text-center text-[10.5px] text-[#9CA3AF]">
        {BRAND.name} · {BRAND.tagline}
      </p>
    </div>
  );
}

export function MobileSettingsPage() {
  const { prefs } = usePreferences();
  return (
    <div className="px-4 pt-5 pb-6 space-y-5">
      <h1 className="text-[22px] font-extrabold tracking-[-0.02em] text-[#050505]">
        Settings
      </h1>
      <SettingsGroup label="App & Playback">
        <SettingsLink
          to="/mobile/settings/playback"
          icon={Volume2}
          label="Playback & data"
          value={prefs.audio_quality === "AUTO" ? "Auto" : `${prefs.audio_quality}k`}
        />
        <SettingsLink
          to="/mobile/settings/notifications"
          icon={Bell}
          label="Notifications"
        />
        <SettingsLink
          to="/mobile/settings/language"
          icon={Globe}
          label="Language"
          value={prefs.language === "en" ? "English" : "Somali"}
        />
      </SettingsGroup>

      <SettingsGroup label="Account & Info">
        <SettingsLink
          to="/mobile/settings/privacy"
          icon={Shield}
          label="Privacy & data"
        />
        <SettingsLink
          to="/mobile/about"
          icon={Info}
          label="About Radio Hargeysa"
          value={`v${BRAND.version}`}
        />
      </SettingsGroup>
    </div>
  );
}

export function MobileSettingsPlaybackPage() {
  const { prefs, updatePrefs } = usePreferences();
  return (
    <div className="px-4 pt-5 pb-6 space-y-5">
      <h1 className="text-[22px] font-extrabold tracking-[-0.02em] text-[#050505]">
        Playback & data
      </h1>
      <SettingsGroup label="Streaming Quality">
        <SettingsChoice
          label="Audio quality"
          options={AUDIO_QUALITIES}
          value={prefs.audio_quality}
          onChange={(v) => {
            updatePrefs({ audio_quality: v as any });
            toast.success("Audio quality saved");
          }}
        />
        <SettingsChoice
          label="Video quality"
          options={VIDEO_QUALITIES}
          value={prefs.video_quality}
          onChange={(v) => {
            updatePrefs({ video_quality: v as any });
            toast.success("Video quality saved");
          }}
        />
      </SettingsGroup>
      <SettingsGroup label="Preferences">
        <SettingsToggle
          label="Data saver"
          description="Reduce audio bitrate on cellular connections."
          checked={prefs.data_saver}
          onChange={(v) => updatePrefs({ data_saver: v })}
        />
        <SettingsToggle
          label="Autoplay"
          description="Continue playing the next episode automatically."
          checked={prefs.autoplay}
          onChange={(v) => updatePrefs({ autoplay: v })}
        />
      </SettingsGroup>
    </div>
  );
}

export function MobileSettingsNotificationsPage() {
  const { prefs, updatePrefs } = usePreferences();
  return (
    <div className="px-4 pt-5 pb-6 space-y-5">
      <h1 className="text-[22px] font-extrabold tracking-[-0.02em] text-[#050505]">
        Notifications
      </h1>
      <SettingsGroup label="Alerts">
        <SettingsToggle
          label="Live radio"
          checked={prefs.notify_live}
          onChange={(v) => updatePrefs({ notify_live: v })}
        />
        <SettingsToggle
          label="Breaking news"
          checked={prefs.notify_news}
          onChange={(v) => updatePrefs({ notify_news: v })}
        />
        <SettingsToggle
          label="New programs"
          checked={prefs.notify_programs}
          onChange={(v) => updatePrefs({ notify_programs: v })}
        />
        <SettingsToggle
          label="New episodes"
          checked={prefs.notify_episodes}
          onChange={(v) => updatePrefs({ notify_episodes: v })}
        />
        <SettingsToggle
          label="New videos"
          checked={prefs.notify_videos}
          onChange={(v) => updatePrefs({ notify_videos: v })}
        />
      </SettingsGroup>
    </div>
  );
}

export function MobileSettingsLanguagePage() {
  const { prefs, updatePrefs } = usePreferences();
  const langs = [
    { code: "so" as const, flag: "🇸🇴", name: "Somali", native: "Af-Soomaali" },
    { code: "en" as const, flag: "🇬🇧", name: "English", native: "English" },
  ];
  return (
    <div className="px-4 pt-5 pb-6 space-y-4">
      <h1 className="text-[22px] font-extrabold tracking-[-0.02em] text-[#050505]">
        Language
      </h1>
      <div className="space-y-2.5">
        {langs.map((l) => {
          const active = prefs.language === l.code;
          return (
            <button
              key={l.code}
              type="button"
              onClick={async () => {
                await updatePrefs({ language: l.code });
                toast.success(`Language set to ${l.name}`);
              }}
              className={cn(
                "flex w-full items-center justify-between rounded-2xl border bg-white p-4 text-left",
                active
                  ? "border-[#047422] ring-2 ring-[#047422]"
                  : "border-[#E7E9EC]"
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{l.flag}</span>
                <div>
                  <p className="text-[13.5px] font-bold text-[#050505]">
                    {l.name}
                  </p>
                  <p className="text-[11px] text-[#6B7280]">{l.native}</p>
                </div>
              </div>
              {active && <Check className="h-4 w-4 text-[#047422]" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function MobileSettingsPrivacyPage() {
  const { isAuthenticated, logout } = useAuth();
  const { refresh } = useLibrary();
  const navigate = useNavigate();

  const clearHistory = async () => {
    if (!isAuthenticated) {
      toast.info("Sign in to manage library data");
      return;
    }
    try {
      await apiFetch("/api/listener/history", { method: "DELETE" });
      await refresh();
      toast.success("Listening history cleared");
    } catch (err: any) {
      toast.error(err.message || "Could not clear listening history");
    }
  };

  const clearDownloads = async () => {
    if (!isAuthenticated) {
      toast.info("Sign in to manage library data");
      return;
    }
    try {
      await apiFetch("/api/listener/downloads", { method: "DELETE" });
      await refresh();
      toast.success("Downloaded items cleared");
    } catch (err: any) {
      toast.error(err.message || "Could not clear downloads");
    }
  };

  return (
    <div className="px-4 pt-5 pb-6 space-y-5">
      <h1 className="text-[22px] font-extrabold tracking-[-0.02em] text-[#050505]">
        Privacy & data
      </h1>
      <div className="rounded-2xl border border-[#E7E9EC] bg-white p-4 text-[12.5px] leading-relaxed text-[#4B5563]">
        Your favourites, followed programs, and listening history are private to
        your account and never shared with third parties.
      </div>
      <div className="divide-y divide-[#F0F1F3] overflow-hidden rounded-2xl border border-[#E7E9EC] bg-white">
        <button
          type="button"
          onClick={clearHistory}
          className="flex w-full items-center justify-between px-4 py-3.5 text-left text-[13px] font-bold text-[#C40D0F] hover:bg-[#FEF7F7]"
        >
          <span>Clear listening history</span>
          <Trash2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={clearDownloads}
          className="flex w-full items-center justify-between px-4 py-3.5 text-left text-[13px] font-bold text-[#C40D0F] hover:bg-[#FEF7F7]"
        >
          <span>Clear downloaded items</span>
          <Trash2 className="h-4 w-4" />
        </button>
        {isAuthenticated && (
          <button
            type="button"
            onClick={async () => {
              await logout();
              navigate("/mobile/home");
            }}
            className="flex w-full items-center justify-between px-4 py-3.5 text-left text-[13px] font-bold text-[#C40D0F] hover:bg-[#FEF7F7]"
          >
            <span>Sign out of this device</span>
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export function MobileAboutPage() {
  return (
    <div className="px-4 pt-5 pb-6 space-y-4">
      <div className="rounded-3xl brand-gradient p-6 text-white">
        <BrandLogo size={52} />
        <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.18em] text-[#4ADE80]">
          SINCE 1942
        </p>
        <h1 className="mt-1 text-[22px] font-extrabold">Radio Hargeysa</h1>
        <p className="font-display italic text-[18px] text-white/90">
          {BRAND.tagline}
        </p>
      </div>

      <div className="rounded-2xl border border-[#E7E9EC] bg-white p-4 space-y-2.5 text-[12.5px] leading-relaxed text-[#1F2937]">
        <h2 className="text-[14px] font-bold text-[#050505]">Our history</h2>
        <p>
          Established in 1942, Radio Hargeysa is the historic voice of
          Somaliland—broadcasting national news, Somali literary heritage,
          education, and civic dialogue across the Horn of Africa and worldwide.
        </p>
      </div>

      <div className="rounded-2xl border border-[#E7E9EC] bg-white p-4 space-y-1.5 text-[12.5px] text-[#1F2937]">
        <h2 className="text-[14px] font-bold text-[#050505]">Station desk</h2>
        <p className="text-[#6B7280]">Hargeisa, Somaliland</p>
        <p className="text-[#6B7280]">desk@radiohargeysa.so</p>
      </div>

      <p className="text-center text-[11px] text-[#9CA3AF]">
        Radio Hargeysa Platform v{BRAND.version}
      </p>
    </div>
  );
}
