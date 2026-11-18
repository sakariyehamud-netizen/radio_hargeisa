import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Globe,
} from "lucide-react";
import { BrandLogo } from "./Brand";
import { ADMIN_NAV, STUDIO_NAV, type NavGroup } from "./navConfig";
import { useAuth } from "../../lib/AuthContext";
import { usePreferences } from "../../lib/usePreferences";
import { ROLE_LABELS } from "../../lib/rbac";
import { formatTimeRange, initials } from "../../lib/format";
import { cn } from "../../lib/utils";
import { apiFetch } from "../../lib/api";

export function DashboardShell({
  area,
  children,
}: {
  area: "admin" | "studio";
  children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [liveInfo, setLiveInfo] = useState<{
    isLive: boolean;
    timeRange: string;
    unreadCount: number;
  }>({ isLive: false, timeRange: "07:00 – 09:00", unreadCount: 0 });
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, role, logout } = useAuth();
  const { prefs, updatePrefs } = usePreferences();

  const groups: NavGroup[] = area === "admin" ? ADMIN_NAV : STUDIO_NAV;
  const areaTitle = area === "admin" ? "Admin" : "Studio";
  const isAdmin = area === "admin";

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    Promise.all([
      apiFetch<any>("/api/content/live").catch(() => null),
      apiFetch<any[]>("/api/listener/notifications").catch(() => []),
    ]).then(([live, notifs]) => {
      const slot =
        live?.currentProgram?.start_time && live?.currentProgram?.end_time
          ? formatTimeRange(
              live.currentProgram.start_time,
              live.currentProgram.end_time
            )
          : "07:00 – 09:00";
      const unread = Array.isArray(notifs)
        ? notifs.filter((n) => !n.is_read).length
        : 0;
      setLiveInfo({
        isLive: Boolean(live?.broadcast),
        timeRange: slot,
        unreadCount: unread,
      });
    });
  }, [pathname]);

  const currentItem =
    groups
      .flatMap((g) => g.items)
      .find((item) => {
        const baseTo = item.to.split("?")[0];
        return pathname === baseTo || pathname.startsWith(baseTo + "/");
      }) || null;

  const handleSignOut = async () => {
    await logout();
    navigate("/");
  };

  const toggleLanguage = () => {
    const nextLang = prefs.language === "en" ? "so" : "en";
    updatePrefs({ language: nextLang }).catch(() => {});
  };

  const defaultDashboardTitle = isAdmin ? "Admin Dashboard" : "Studio Dashboard";
  const panelSubtitle = isAdmin
    ? "Radio Hargeysa Administration Panel"
    : "Radio Hargeysa Studio Management Panel";

  const sidebarContent = (
    <div className="relative flex h-full w-[248px] flex-col overflow-hidden bg-gradient-to-b from-[#044D1B] via-[#033F15] to-[#022D0E] text-white">
      {/* Subtle broadcast tower watermark silhouette */}
      <svg
        aria-hidden="true"
        viewBox="0 0 220 260"
        className="pointer-events-none absolute bottom-10 right-0 h-56 w-48 opacity-15"
      >
        <path
          d="M 148 250 L 166 55 L 184 250 M 153 200 L 179 200 M 157 160 L 175 160 M 161 120 L 171 120 M 154 210 L 176 175 M 178 210 L 156 175 M 158 165 L 173 130 M 174 165 L 159 130"
          stroke="#86EFAC"
          strokeWidth="2"
          fill="none"
        />
        <circle cx="166" cy="48" r="5" fill="#86EFAC" />
        <path
          d="M 150 38 A 20 20 0 0 0 150 58 M 140 30 A 32 32 0 0 0 140 66 M 182 38 A 20 20 0 0 1 182 58 M 192 30 A 32 32 0 0 1 192 66"
          stroke="#86EFAC"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
      </svg>

      {/* Brand header */}
      <div className="relative z-10 flex items-center justify-between border-b border-white/10 px-4 py-4">
        <Link to={`/${area}/dashboard`} className="flex items-center gap-2.5">
          <BrandLogo size={36} />
          <div>
            <p className="text-[13.5px] font-extrabold leading-tight text-white">
              Radio Hargeysa
            </p>
            <p className="text-[9.5px] font-extrabold uppercase tracking-[0.2em] text-[#4ADE80]">
              {areaTitle}
            </p>
          </div>
        </Link>
        <button
          type="button"
          onClick={() => setDrawerOpen(false)}
          className="lg:hidden rounded-lg p-1 text-white/60 hover:text-white"
          aria-label="Close navigation"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Nav groups */}
      <nav className="rh-scroll relative z-10 flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="px-2.5 mb-1.5 text-[9.5px] font-bold uppercase tracking-[0.16em] text-white/55">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const baseTo = item.to.split("?")[0];
                const active =
                  pathname === baseTo ||
                  (baseTo !== `/${area}/dashboard` &&
                    pathname.startsWith(baseTo + "/"));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label + item.to}
                    to={item.to}
                    className={cn(
                      "flex items-center justify-between rounded-xl px-3 py-2 text-[12.5px] font-semibold transition-all",
                      active
                        ? "bg-[#0D8A33] text-white shadow-sm ring-1 ring-white/15"
                        : "text-white/80 hover:bg-white/[0.08] hover:text-white"
                    )}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0",
                          active ? "text-white" : "text-white/70"
                        )}
                      />
                      <span className="truncate">{item.label}</span>
                    </span>
                    {item.badge && (
                      <span className="rounded-full bg-[#C40D0F] px-1.5 py-0.5 text-[9px] font-bold text-white">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer user profile & Log Out */}
      <div className="relative z-10 border-t border-white/10 p-3 space-y-2">
        <Link
          to={`/${area}/settings`}
          className="flex items-center justify-between gap-2 rounded-2xl border border-white/10 bg-black/25 px-3 py-2.5 hover:bg-black/35 transition-colors"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0D8A33] text-[11px] font-extrabold text-white ring-2 ring-white/25">
              {initials(user?.full_name, user?.email)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[12px] font-bold text-white">
                {user?.full_name || user?.email}
              </p>
              <p className="flex items-center gap-1 text-[10px] font-semibold text-[#86EFAC]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#4ADE80]" />
                <span>Online</span>
                <span className="text-white/45">· {ROLE_LABELS[role]}</span>
              </p>
            </div>
          </div>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-white/50" />
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/[0.04] px-3 py-2 text-[12px] font-bold text-white transition-colors hover:bg-white/[0.12]"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#F5F7F6] text-[#050505]">
      {/* Desktop sidebar */}
      {desktopSidebarOpen && (
        <aside className="hidden lg:block sticky top-0 h-screen shrink-0">
          {sidebarContent}
        </aside>
      )}

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="relative z-10 h-full">{sidebarContent}</div>
        </div>
      )}

      {/* Main area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#E7E9EC] bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-7">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="lg:hidden rounded-xl border border-[#E7E9EC] bg-white p-2 text-[#374151] hover:bg-[#F5F6F7]"
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setDesktopSidebarOpen((v) => !v)}
              className="hidden lg:flex rounded-xl border border-[#E7E9EC] bg-white p-2 text-[#374151] hover:bg-[#F5F6F7]"
              aria-label="Toggle sidebar"
            >
              <Menu className="h-4 w-4" />
            </button>

            <div className="min-w-0">
              <h1 className="truncate text-[16px] font-extrabold leading-tight tracking-tight text-[#050505]">
                {currentItem?.label === "Dashboard"
                  ? defaultDashboardTitle
                  : currentItem?.label || defaultDashboardTitle}
              </h1>
              <p className="truncate text-[11px] font-medium text-[#6B7280]">
                {panelSubtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              to={`/${area}/live`}
              className="hidden sm:inline-flex items-center gap-2 rounded-full border border-[#E7E9EC] bg-[#FAFBFC] p-1 pr-3 text-[11.5px] font-bold text-[#050505] hover:border-[#047422]/40 transition-colors"
            >
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold text-white",
                  liveInfo.isLive ? "bg-[#047422]" : "bg-[#4B5563]"
                )}
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full bg-white",
                    liveInfo.isLive && "live-dot"
                  )}
                />
                <span>{liveInfo.isLive ? "On Air" : "Standby"}</span>
              </span>
              <span className="tabular-nums text-[#374151]">
                {liveInfo.timeRange}
              </span>
              <span className="flex items-end gap-[2px]" aria-hidden="true">
                <span className="h-2 w-[2px] rounded-full bg-[#047422]" />
                <span className="h-3.5 w-[2px] rounded-full bg-[#047422]" />
                <span className="h-2.5 w-[2px] rounded-full bg-[#047422]" />
                <span className="h-3 w-[2px] rounded-full bg-[#047422]" />
              </span>
            </Link>

            <Link
              to={`/${area}/notifications`}
              className="relative flex h-9 w-9 items-center justify-center rounded-full border border-[#E7E9EC] bg-white text-[#111827] hover:bg-[#F5F6F7]"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {liveInfo.unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#C40D0F] px-1 text-[9px] font-extrabold text-white ring-2 ring-white tabular-nums">
                  {liveInfo.unreadCount}
                </span>
              )}
            </Link>

            <button
              type="button"
              onClick={toggleLanguage}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#E7E9EC] bg-white px-3 py-1.5 text-[11.5px] font-bold text-[#050505] hover:bg-[#F5F6F7]"
              title="Switch language"
            >
              <Globe className="h-3.5 w-3.5 text-[#4B5563]" />
              <span>{(prefs.language || "en").toUpperCase()}</span>
            </button>
          </div>
        </header>

        {/* Page body */}
        <main className="flex-1 px-4 py-5 sm:px-6 lg:px-7">{children}</main>
      </div>
    </div>
  );
}
