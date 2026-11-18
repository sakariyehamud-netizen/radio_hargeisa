import React, { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  Search,
  Bell,
  Home,
  LayoutGrid,
  Radio,
  PlaySquare,
  User,
  Play,
  Pause,
  X,
  Loader2,
} from "lucide-react";
import { BrandLogo } from "../shared/Brand";
import { PlayerProvider, usePlayer } from "./PlayerProvider";
import { apiFetch } from "../../lib/api";
import { cn } from "../../lib/utils";

function MiniPlayer() {
  const { track, playing, loading, toggle, close } = usePlayer();
  if (!track) return null;

  return (
    <div className="pointer-events-auto mx-3 mb-2 flex items-center justify-between gap-2.5 rounded-2xl border border-[#E7E9EC] bg-white/95 p-2 backdrop-blur shadow-[0_12px_32px_-16px_rgba(5,5,5,.35)]">
      <Link
        to={track.href || (track.type === "LIVE" ? "/mobile/live" : "/mobile/episodes")}
        className="flex min-w-0 flex-1 items-center gap-2.5"
      >
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-[#050505]">
          {track.imageUrl ? (
            <img
              src={track.imageUrl}
              alt={track.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-white text-[10px] font-bold">
              RH
            </div>
          )}
          {track.type === "LIVE" && (
            <span className="absolute inset-x-0 bottom-0 bg-[#C40D0F] text-center text-[7px] font-extrabold uppercase tracking-wider text-white">
              LIVE
            </span>
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[12.5px] font-bold text-[#050505]">
            {track.title}
          </p>
          <p className="truncate text-[10.5px] font-medium text-[#6B7280]">
            {track.subtitle || "Radio Hargeysa"}
          </p>
        </div>
      </Link>

      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? "Pause" : "Play"}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#047422] text-white transition-transform active:scale-95"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : playing ? (
            <Pause className="h-4 w-4 fill-current" />
          ) : (
            <Play className="h-4 w-4 fill-current ml-0.5" />
          )}
        </button>
        <button
          type="button"
          onClick={close}
          aria-label="Close player"
          className="flex h-8 w-8 items-center justify-center rounded-full text-[#6B7280] hover:bg-[#F5F6F7]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function BottomNav() {
  const { pathname } = useLocation();
  const { track, playing } = usePlayer();
  const isLivePlaying = track?.type === "LIVE" && playing;

  const tabs = [
    { label: "Home", to: "/mobile/home", icon: Home },
    { label: "Categories", to: "/mobile/programs", icon: LayoutGrid },
    { label: "Live Radio", to: "/mobile/live", icon: Radio, liveDot: isLivePlaying },
    { label: "Videos", to: "/mobile/videos", icon: PlaySquare },
    { label: "Profile", to: "/mobile/profile", icon: User },
  ];

  return (
    <nav className="pointer-events-auto mx-3 grid grid-cols-5 gap-0.5 rounded-[24px] border border-[#E7E9EC]/90 bg-white/92 px-2 py-1.5 shadow-[0_14px_34px_-10px_rgba(5,5,5,0.26)] backdrop-blur-xl">
      {tabs.map((tab) => {
        const active =
          pathname === tab.to || pathname.startsWith(tab.to + "/");
        const Icon = tab.icon;
        return (
          <Link
            key={tab.to}
            to={tab.to}
            className={cn(
              "relative flex min-h-[46px] flex-col items-center justify-center gap-0.5 rounded-2xl py-1 transition-all",
              active
                ? "bg-[#E7F5EA]/80 text-[#047422]"
                : "text-[#6B7280] hover:bg-[#F5F6F7]/70 hover:text-[#111827]"
            )}
          >
            <div className="relative">
              <Icon className="h-[19px] w-[19px]" strokeWidth={active ? 2.4 : 1.9} />
              {tab.liveDot && (
                <span className="absolute -right-1 -top-0.5 h-2 w-2 rounded-full bg-[#C40D0F] live-dot" />
              )}
            </div>
            <span className={cn("text-[10px] leading-tight whitespace-nowrap", active ? "font-extrabold" : "font-semibold")}>
              {tab.label}
            </span>
            {active && (
              <span className="mt-0.5 h-[2.5px] w-7 rounded-full bg-[#047422]" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function MobileShellInner() {
  const { pathname } = useLocation();
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    apiFetch<any[]>("/api/listener/notifications")
      .then((list) => {
        if (Array.isArray(list)) {
          setHasUnread(list.some((n) => !n.is_read));
        }
      })
      .catch(() => {});
  }, [pathname]);

  return (
    <div className="min-h-screen bg-[#F5F6F7]">
      <div className="mx-auto flex min-h-screen max-w-[480px] flex-col bg-[#F7F9F8] shadow-[0_0_60px_-30px_rgba(5,5,5,.35)]">
        {/* Sticky header */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#EEF0F2] bg-white/95 px-4 py-2.5 backdrop-blur">
          <Link to="/mobile/home" className="flex items-center gap-2.5 min-w-0">
            <BrandLogo size={38} />
            <div className="min-w-0">
              <p className="truncate text-[14.5px] font-extrabold leading-tight text-[#050505]">
                Radio Hargeysa
              </p>
              <p className="truncate text-[10px] font-medium text-[#4B5563]">
                Codka Jamhuuriyadda Somaliland
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-1 shrink-0">
            <Link
              to="/mobile/search"
              aria-label="Search"
              className="flex h-10 w-10 items-center justify-center rounded-full text-[#111827] hover:bg-[#F5F6F7]"
            >
              <Search className="h-[19px] w-[19px]" />
            </Link>
            <Link
              to="/mobile/notifications"
              aria-label="Notifications"
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-[#111827] hover:bg-[#F5F6F7]"
            >
              <Bell className="h-[19px] w-[19px]" />
              {hasUnread && (
                <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-[#C40D0F] ring-2 ring-white" />
              )}
            </Link>
          </div>
        </header>

        {/* Scroll body */}
        <main key={pathname} className="enter-rise flex-1 pb-6">
          <Outlet />
        </main>

        {/* Floating bottom dock */}
        <div className="pointer-events-none sticky bottom-0 z-30 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <MiniPlayer />
          <BottomNav />
        </div>
      </div>
    </div>
  );
}

export function MobileShell() {
  return (
    <PlayerProvider>
      <MobileShellInner />
    </PlayerProvider>
  );
}
