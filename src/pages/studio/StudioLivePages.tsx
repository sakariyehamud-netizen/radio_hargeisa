import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Calendar,
  Disc,
  Mic,
  Video,
  Newspaper,
  AlertTriangle,
  Plus,
  X,
  Loader2,
  ChevronRight,
  Radio,
  Play,
  Square,
  FolderOpen,
  ArrowRight,
  BarChart3,
  ListMusic,
  Smartphone,
  Search,
  Filter,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "../../lib/api";
import { useAuth } from "../../lib/AuthContext";
import {
  DAYS_OF_WEEK,
  DAY_SHORT_LABELS,
} from "../../lib/constants";
import {
  formatTime,
  formatTimeRange,
  formatDuration,
  relativeTime,
  hhmmToMinutes,
} from "../../lib/format";
import {
  PageHeader,
  SectionCard,
  ToolbarButton,
} from "../../components/shared/Surface";
import { DataTable, TablePill } from "../../components/shared/DataTable";
import { StatusBadge } from "../../components/shared/StatusBadge";
import { EmptyState } from "../../components/shared/EmptyState";
import { BroadcastPanel } from "../../components/studio/BroadcastPanel";
import {
  ConfirmDeleteDialog,
  FieldDef,
  RecordActions,
  RecordEditDialog,
  RecordViewDialog,
} from "../../components/studio/RecordActions";
import { StreamForm } from "../../components/admin/StreamForm";
import { BroadcastOverviewChart } from "../../components/shared/Charts";
import { BrandLogo } from "../../components/shared/Brand";
import { cn } from "../../lib/utils";

export function StudioDashboardPage() {
  useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [trendDays, setTrendDays] = useState<7 | 30>(7);
  const [broadcastBusy, setBroadcastBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await apiFetch("/api/studio/overview");
      setData(res);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const counts = data?.counts || {};
  const todaySchedule: any[] = data?.todaySchedule || [];
  const broadcast = data?.broadcast || null;
  const currentProgram = data?.currentProgram || null;
  const recentRecordings: any[] = data?.recentRecordings || [];
  const productionQueue: any[] = data?.productionQueue || [];
  const trendSeries =
    trendDays === 30 ? data?.broadcastTrend30 || [] : data?.broadcastTrend7 || [];

  const isOnAir = Boolean(broadcast);
  const slotLabel = currentProgram
    ? formatTimeRange(currentProgram.start_time, currentProgram.end_time)
    : "07:00 – 09:00";

  const handleToggleBroadcast = async () => {
    setBroadcastBusy(true);
    try {
      if (broadcast?.id) {
        await apiFetch(`/api/studio/broadcast/${broadcast.id}/stop`, {
          method: "POST",
        });
        toast.success("Broadcast ended and recording saved");
      } else {
        await apiFetch("/api/studio/broadcast/start", {
          method: "POST",
          body: JSON.stringify({
            program_id: currentProgram?.program_id || null,
            program_title:
              currentProgram?.program_title || "Radio Hargeysa Live",
            presenter_name: currentProgram?.presenter_name || "Studio 1 Desk",
          }),
        });
        toast.success("Broadcast is now On Air");
      }
      await load();
    } catch (err: any) {
      toast.error(err.message || "Broadcast action failed");
    } finally {
      setBroadcastBusy(false);
    }
  };

  const kpiCards = [
    {
      label: "Today's Broadcasts",
      value: todaySchedule.length,
      sub: "Scheduled",
      to: "/studio/schedule",
      icon: Radio,
      tone: "green" as const,
    },
    {
      label: "Episodes",
      value: counts.episodes || 0,
      sub: `${counts.publishedEpisodes || 0} live`,
      to: "/studio/episodes",
      icon: Play,
      tone: "rose" as const,
    },
    {
      label: "Videos",
      value: counts.videos || 0,
      sub: "Studio & news",
      to: "/studio/videos",
      icon: Video,
      tone: "green" as const,
    },
    {
      label: "News Stories",
      value: counts.news || 0,
      sub: `${counts.publishedNews || 0} published`,
      to: "/studio/news",
      icon: Newspaper,
      tone: "rose" as const,
    },
    {
      label: "Recordings",
      value: counts.recordings || 0,
      sub: "Captured",
      to: "/studio/recordings",
      icon: FolderOpen,
      tone: "green" as const,
    },
  ];

  const eqHeights = [32, 46, 38, 60, 48, 72, 42, 64, 52, 86];
  const curMin = data?.now?.minutesSinceMidnight ?? 0;

  return (
    <div className="space-y-4">
      {/* Row 1: Hero Broadcast Banner + Studio Status Control */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Hero Broadcast Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-[#D4E6D9] bg-gradient-to-r from-[#EEF7F0] via-[#F9FCFA] to-[#E5F4E9] p-5 sm:p-6 lg:col-span-9 shadow-[0_12px_30px_-20px_rgba(4,116,34,0.28)]">
          {/* Cityscape, Tower, Ribbons & Studio Mic SVG Artwork */}
          <svg
            aria-hidden="true"
            viewBox="0 0 900 220"
            preserveAspectRatio="xMidYMid slice"
            className="pointer-events-none absolute inset-0 h-full w-full"
          >
            <defs>
              <linearGradient id="stSkyFade" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#E6F4EA" stopOpacity="0.4" />
                <stop offset="55%" stopColor="#FFFFFF" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#D7EEDF" stopOpacity="0.45" />
              </linearGradient>
              <linearGradient id="stRibbonGreen" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0%" stopColor="#047422" />
                <stop offset="100%" stopColor="#0EA63B" />
              </linearGradient>
              <linearGradient id="stRibbonRed" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0%" stopColor="#B80B0D" />
                <stop offset="100%" stopColor="#E11D20" />
              </linearGradient>
            </defs>
            <rect width="900" height="220" fill="url(#stSkyFade)" />
            {/* Hargeisa skyline silhouette */}
            <path
              d="M 0 220 L 0 185 L 40 175 L 95 190 L 140 182 L 195 170 L 250 185 L 290 172 L 320 172 L 320 155 L 350 155 L 350 178 L 410 178 L 410 162 L 455 162 L 455 182 L 515 182 L 515 150 L 555 150 L 555 176 L 610 176 L 610 160 L 660 160 L 660 185 L 725 185 L 725 168 L 780 168 L 780 184 L 845 172 L 900 182 L 900 220 Z"
              fill="#CBD5E1"
              fillOpacity="0.42"
            />
            {/* Radio tower */}
            <g stroke="#94A3B8" strokeOpacity="0.55" strokeWidth="1.6" fill="none">
              <path d="M 388 188 L 398 52 L 408 188" />
              <path d="M 391 150 L 405 150 M 393 120 L 403 120 M 395 90 L 401 90" />
              <circle cx="398" cy="48" r="3.5" fill="#94A3B8" fillOpacity="0.6" />
              <path d="M 384 38 A 18 18 0 0 0 384 58 M 412 38 A 18 18 0 0 1 412 58" />
            </g>
            {/* Bottom Somaliland diagonal ribbons */}
            <path
              d="M 480 220 C 650 212 790 185 900 140 L 900 176 C 790 205 660 220 530 220 Z"
              fill="url(#stRibbonGreen)"
              fillOpacity="0.88"
            />
            <path
              d="M 555 220 C 710 216 820 198 900 172 L 900 220 Z"
              fill="url(#stRibbonRed)"
              fillOpacity="0.9"
            />
          </svg>

          <div className="relative z-10 flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div className="max-w-md">
              <h2 className="text-[28px] sm:text-[34px] font-extrabold leading-none tracking-[-0.03em] text-[#045E1C]">
                Radio Hargeysa
              </h2>
              <p className="mt-1.5 font-display italic text-[18px] sm:text-[21px] text-[#050505]">
                Codka Jamhuuriyadda Somaliland
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2.5">
                <Link
                  to="/studio/live"
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[11.5px] font-extrabold uppercase tracking-[0.06em] text-white shadow-sm transition-transform active:scale-95",
                    isOnAir ? "bg-[#C40D0F]" : "bg-[#C40D0F]/90 hover:bg-[#C40D0F]"
                  )}
                >
                  <Radio className="h-3.5 w-3.5" />
                  <span>{isOnAir ? "LIVE ON AIR" : "GO LIVE"}</span>
                </Link>
                <span className="inline-flex items-center rounded-full bg-[#044F19] px-4 py-2 text-[11.5px] font-bold text-white tabular-nums shadow-sm">
                  {slotLabel}
                </span>
              </div>
            </div>

            {/* Center/Right Mic + RH 1942 Badge + Motto */}
            <div className="hidden md:flex items-center gap-6 pr-2">
              <svg
                aria-hidden="true"
                viewBox="0 0 180 165"
                className="h-36 w-40 shrink-0 drop-shadow-md"
              >
                <defs>
                  <linearGradient id="stMic" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#141619" />
                    <stop offset="45%" stopColor="#3B4048" />
                    <stop offset="100%" stopColor="#0A0B0C" />
                  </linearGradient>
                  <clipPath id="stRhClip">
                    <circle cx="90" cy="88" r="24" />
                  </clipPath>
                </defs>
                {/* Green and red spiral rings */}
                <ellipse
                  cx="90"
                  cy="74"
                  rx="62"
                  ry="20"
                  transform="rotate(-14 90 74)"
                  fill="none"
                  stroke="#047422"
                  strokeWidth="9"
                />
                <ellipse
                  cx="90"
                  cy="102"
                  rx="60"
                  ry="20"
                  transform="rotate(14 90 102)"
                  fill="none"
                  stroke="#D91618"
                  strokeWidth="9"
                />
                {/* Mic body */}
                <rect x="86" y="120" width="8" height="32" rx="3" fill="#1F2937" />
                <ellipse cx="90" cy="153" rx="34" ry="7" fill="#111827" />
                <rect x="66" y="14" width="48" height="58" rx="24" fill="url(#stMic)" />
                <rect x="65" y="70" width="50" height="7" rx="2" fill="#D1D5DB" />
                <rect x="67" y="77" width="46" height="46" rx="12" fill="url(#stMic)" />
                {/* RH badge inside mic */}
                <circle cx="90" cy="88" r="25" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1.5" />
                <g clipPath="url(#stRhClip)">
                  <rect x="64" y="62" width="52" height="12" fill="#047422" />
                  <rect x="64" y="74" width="52" height="24" fill="#FFFFFF" />
                  <rect x="64" y="98" width="52" height="16" fill="#C40D0F" />
                  <text
                    x="90"
                    y="93"
                    textAnchor="middle"
                    fill="#050505"
                    fontFamily="Georgia, serif"
                    fontWeight="800"
                    fontSize="18"
                  >
                    RH
                  </text>
                  <text
                    x="90"
                    y="108"
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontFamily="Manrope, sans-serif"
                    fontWeight="800"
                    fontSize="7"
                  >
                    1942
                  </text>
                </g>
              </svg>

              <div className="text-right">
                <p className="font-display italic text-[22px] font-semibold leading-snug text-[#050505]">
                  Wadajir,
                  <br />
                  War iyo Wacyi
                </p>
                <div className="mt-1.5 ml-auto h-1 w-24 rounded-full bg-gradient-to-r from-[#047422] to-[#C40D0F]" />
              </div>
            </div>
          </div>
        </div>

        {/* Studio Status Control Card */}
        <div className="flex flex-col justify-between rounded-3xl border border-[#E7E9EC] bg-white p-5 lg:col-span-3 shadow-[0_10px_28px_-20px_rgba(5,5,5,0.25)]">
          <div>
            <p className="text-[12.5px] font-bold text-[#374151]">
              Studio Status
            </p>
            <div className="mt-2 flex items-center gap-2.5">
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full",
                  isOnAir ? "bg-[#047422]/15" : "bg-[#9CA3AF]/15"
                )}
              >
                <span
                  className={cn(
                    "h-2.5 w-2.5 rounded-full",
                    isOnAir ? "bg-[#047422] live-dot" : "bg-[#9CA3AF]"
                  )}
                />
              </span>
              <span className="text-[22px] font-extrabold tracking-tight text-[#050505]">
                {isOnAir ? "On Air" : "Standby"}
              </span>
            </div>
            <p className="mt-0.5 pl-7 text-[11.5px] font-medium text-[#6B7280] truncate">
              {isOnAir
                ? broadcast?.program_title || "Now Broadcasting"
                : currentProgram?.program_title || "Ready to broadcast"}
            </p>
          </div>

          {/* Stepped Equalizer Meter */}
          <div className="my-4 flex h-10 items-end justify-between gap-1.5 px-1">
            {eqHeights.map((h, idx) => (
              <div
                key={idx}
                className="flex flex-1 flex-col justify-end gap-[2px] h-full"
              >
                <span
                  className={cn(
                    "w-full rounded-sm transition-all",
                    isOnAir ? "bg-[#047422]" : "bg-[#D1D5DB]"
                  )}
                  style={{ height: `${isOnAir ? h : Math.max(20, h - 25)}%` }}
                />
              </div>
            ))}
          </div>

          <button
            type="button"
            disabled={broadcastBusy}
            onClick={handleToggleBroadcast}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[12.5px] font-extrabold text-white shadow-sm transition-colors disabled:opacity-50",
              isOnAir
                ? "bg-[#C40D0F] hover:bg-[#A10B0D]"
                : "bg-[#047422] hover:bg-[#035A1B]"
            )}
          >
            {broadcastBusy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : isOnAir ? (
              <Square className="h-3.5 w-3.5 fill-current" />
            ) : (
              <Play className="h-3.5 w-3.5 fill-current" />
            )}
            <span>{isOnAir ? "End Broadcast" : "Start Broadcast"}</span>
          </button>
        </div>
      </div>

      {/* Row 2: 5 Pastel KPI Stat Cards */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          const isGreen = card.tone === "green";
          return (
            <Link
              key={card.label}
              to={card.to}
              className={cn(
                "group relative overflow-hidden rounded-2xl border p-4 transition-transform hover:-translate-y-0.5",
                isGreen
                  ? "border-[#D5EBD9] bg-gradient-to-br from-[#F3FBF5] to-[#E6F4E9]"
                  : "border-[#F7DCE0] bg-gradient-to-br from-[#FFF6F7] to-[#FCE9EC]"
              )}
            >
              {/* Subtle right watermark icon */}
              <Icon
                aria-hidden="true"
                className={cn(
                  "pointer-events-none absolute -bottom-2 -right-2 h-16 w-16 opacity-10 transition-transform group-hover:scale-105",
                  isGreen ? "text-[#047422]" : "text-[#C40D0F]"
                )}
              />
              <div className="relative z-10 flex items-center gap-2.5">
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-xs",
                    isGreen ? "bg-[#047422]" : "bg-[#D91618]"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[11.5px] font-bold text-[#374151]">
                    {card.label}
                  </p>
                  <div className="mt-0.5 flex items-baseline gap-1.5">
                    <span className="text-[22px] font-extrabold leading-none text-[#050505] tabular-nums">
                      {card.value}
                    </span>
                    <span
                      className={cn(
                        "text-[10.5px] font-bold whitespace-nowrap",
                        isGreen ? "text-[#047422]" : "text-[#047422]"
                      )}
                    >
                      {card.sub}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Row 3: Broadcast Overview Chart + Production Queue */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Broadcast Overview */}
        <div className="rounded-3xl border border-[#E7E9EC] bg-white p-5 lg:col-span-7 shadow-[0_8px_24px_-18px_rgba(5,5,5,0.2)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[#047422]" />
              <h2 className="text-[14.5px] font-extrabold text-[#050505]">
                Broadcast Overview
              </h2>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 text-[11px] font-bold text-[#374151]">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#047422]" />
                  Listeners
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#C40D0F]" />
                  Streams
                </span>
              </div>
              <select
                value={trendDays}
                onChange={(e) => setTrendDays(Number(e.target.value) as 7 | 30)}
                aria-label="Select date range"
                className="rounded-xl border border-[#E7E9EC] bg-[#FAFBFC] px-2.5 py-1 text-[11.5px] font-bold text-[#374151] focus:border-[#047422] focus:outline-none"
              >
                <option value={7}>Last 7 Days</option>
                <option value={30}>Last 30 Days</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <BroadcastOverviewChart data={trendSeries} height={220} />
          </div>
        </div>

        {/* Production Queue */}
        <div className="rounded-3xl border border-[#E7E9EC] bg-white p-5 lg:col-span-5 shadow-[0_8px_24px_-18px_rgba(5,5,5,0.2)]">
          <div className="flex items-center justify-between gap-2 pb-3">
            <div className="flex items-center gap-2">
              <ListMusic className="h-4 w-4 text-[#047422]" />
              <h2 className="text-[14.5px] font-extrabold text-[#050505]">
                Production Queue
              </h2>
            </div>
            <Link
              to="/studio/episodes"
              className="inline-flex items-center gap-1 text-[11.5px] font-bold text-[#047422] hover:underline whitespace-nowrap"
            >
              <span>View All</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {productionQueue.length > 0 ? (
            <div className="space-y-2.5">
              {productionQueue.slice(0, 4).map((item: any) => (
                <Link
                  key={item.id}
                  to={item.to || "/studio/episodes"}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-[#F0F1F3] bg-[#FAFBFC] px-3 py-2.5 transition-colors hover:border-[#047422]/40 hover:bg-[#F4FBF6]"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="shrink-0 rounded-lg bg-[#E7F5EA] px-2 py-1 text-[11px] font-bold text-[#047422] tabular-nums">
                      {item.time || "Queued"}
                    </span>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#047422]/10 text-[#047422]">
                      <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[12.5px] font-bold text-[#050505]">
                        {item.title}
                      </p>
                      <p className="truncate text-[11px] text-[#6B7280]">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-[#E7F5EA] px-2.5 py-0.5 text-[10.5px] font-bold text-[#047422]">
                    {item.status || "Queued"}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex h-44 flex-col items-center justify-center rounded-2xl border border-dashed border-[#E7E9EC] text-center">
              <p className="text-[12.5px] font-semibold text-[#6B7280]">
                Production queue is clear.
              </p>
              <Link
                to="/studio/episodes/upload"
                className="mt-2 text-[12px] font-bold text-[#047422] hover:underline"
              >
                Upload a new episode →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Row 4: Today's Schedule + Recent Recordings + Radio Hargeysa App Banner */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Today's Schedule */}
        <div className="rounded-3xl border border-[#E7E9EC] bg-white p-5 lg:col-span-4 shadow-[0_8px_24px_-18px_rgba(5,5,5,0.2)]">
          <div className="flex items-center justify-between gap-2 pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#047422]" />
              <h2 className="text-[14.5px] font-extrabold text-[#050505]">
                Today&apos;s Schedule
              </h2>
            </div>
            <Link
              to="/studio/schedule"
              className="inline-flex items-center gap-1 text-[11.5px] font-bold text-[#047422] hover:underline whitespace-nowrap"
            >
              <span>Full Schedule</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-2.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-9 animate-pulse rounded-xl bg-[#F0F1F3]" />
              ))}
            </div>
          ) : todaySchedule.length > 0 ? (
            <div className="divide-y divide-[#F0F1F3]">
              {todaySchedule.slice(0, 5).map((slot: any) => {
                const startM = hhmmToMinutes(slot.start_time);
                const endM = hhmmToMinutes(slot.end_time);
                const slotLive = curMin >= startM && curMin < endM;
                return (
                  <div
                    key={slot.id}
                    className="flex items-center justify-between gap-2 py-2.5"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="shrink-0 text-[11.5px] font-extrabold text-[#050505] tabular-nums">
                        {slot.start_time} – {slot.end_time}
                      </span>
                      <span className="truncate text-[12px] font-semibold text-[#374151]">
                        {slot.program_title}
                      </span>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold",
                        slotLive
                          ? "bg-[#FDE7E7] text-[#C40D0F]"
                          : "bg-[#E8F1FD] text-[#1D4ED8]"
                      )}
                    >
                      {slotLive ? "Live" : "Upcoming"}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="py-10 text-center text-[12px] text-[#9CA3AF]">
              Nothing scheduled today.
            </p>
          )}
        </div>

        {/* Recent Recordings */}
        <div className="rounded-3xl border border-[#E7E9EC] bg-white p-5 lg:col-span-4 shadow-[0_8px_24px_-18px_rgba(5,5,5,0.2)]">
          <div className="flex items-center justify-between gap-2 pb-3">
            <div className="flex items-center gap-2">
              <Mic className="h-4 w-4 text-[#047422]" />
              <h2 className="text-[14.5px] font-extrabold text-[#050505]">
                Recent Recordings
              </h2>
            </div>
            <Link
              to="/studio/recordings"
              className="inline-flex items-center gap-1 text-[11.5px] font-bold text-[#047422] hover:underline whitespace-nowrap"
            >
              <span>View All</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {recentRecordings.length > 0 ? (
            <div className="space-y-3">
              {recentRecordings.slice(0, 3).map((rec: any) => (
                <Link
                  key={rec.id}
                  to="/studio/recordings"
                  className="flex items-center justify-between gap-3 rounded-xl p-1.5 transition-colors hover:bg-[#F5F7F6]"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="relative flex h-12 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#0B1D12] text-white">
                      <Mic className="h-4 w-4 text-[#4ADE80]" />
                      <span className="absolute bottom-1 right-1 rounded bg-black/75 px-1 text-[9px] font-bold text-white tabular-nums">
                        {formatDuration(rec.duration_seconds)}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[12.5px] font-bold text-[#050505]">
                        {rec.program_title || "Studio Recording"}
                      </p>
                      <p className="truncate text-[10.5px] text-[#6B7280]">
                        {rec.presenter_name || "Studio 1"} ·{" "}
                        {relativeTime(rec.created_date)}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-[#9CA3AF]" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex h-40 flex-col items-center justify-center rounded-2xl border border-dashed border-[#E7E9EC] text-center">
              <p className="text-[12px] font-semibold text-[#6B7280]">
                No recordings captured yet.
              </p>
              <Link
                to="/studio/live"
                className="mt-1.5 text-[11.5px] font-bold text-[#047422] hover:underline"
              >
                Start a live broadcast to record →
              </Link>
            </div>
          )}
        </div>

        {/* Radio Hargeysa App Promo Card */}
        <div className="relative flex items-center justify-between gap-4 overflow-hidden rounded-3xl border border-[#D4E6D9] bg-gradient-to-br from-[#EAF6ED] via-[#F7FBF8] to-[#D8EEDF] p-5 lg:col-span-4 shadow-[0_10px_28px_-20px_rgba(4,116,34,0.3)]">
          {/* Somaliland ribbon corner */}
          <svg
            aria-hidden="true"
            viewBox="0 0 200 100"
            className="pointer-events-none absolute bottom-0 right-0 h-20 w-44"
          >
            <path d="M 40 100 L 200 35 L 200 68 L 95 100 Z" fill="#047422" />
            <path d="M 95 100 L 200 68 L 200 100 Z" fill="#C40D0F" />
          </svg>

          <div className="relative z-10 max-w-[64%]">
            <h2 className="text-[18px] font-extrabold leading-tight tracking-tight text-[#045E1C]">
              Radio Hargeysa App
            </h2>
            <p className="mt-1 font-display italic text-[13px] text-[#1F2937]">
              Listen Live, Anytime, Anywhere
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-lg bg-[#050505] px-2.5 py-1 text-[10px] font-bold text-white">
                <Smartphone className="h-3 w-3 text-[#4ADE80]" />
                <span>Android &amp; iOS</span>
              </span>
              <span className="inline-flex items-center rounded-lg bg-white/90 px-2.5 py-1 text-[10px] font-bold text-[#047422] ring-1 ring-[#DCE8DF]">
                PWA Ready
              </span>
            </div>
            <Link
              to="/mobile/splash"
              className="mt-3.5 inline-flex items-center gap-1.5 rounded-full bg-[#045E1C] px-4 py-2 text-[12px] font-extrabold text-white shadow-sm hover:bg-[#047422]"
            >
              <span>Open Mobile App</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Tilted Mobile Phone Mockup Preview */}
          <div className="relative z-10 hidden sm:flex h-36 w-24 shrink-0 rotate-6 flex-col items-center justify-between rounded-[20px] border-[3px] border-[#1F2937] bg-white p-2 shadow-xl">
            <div className="h-1 w-8 rounded-full bg-[#1F2937]" />
            <BrandLogo size={40} />
            <div className="w-full space-y-1">
              <div className="mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-[#047422] text-white">
                <Play className="h-2.5 w-2.5 fill-current ml-0.5" />
              </div>
              <div className="h-1 w-full rounded-full bg-[#E5E7EB]">
                <div className="h-1 w-2/3 rounded-full bg-[#047422]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const STUDIO_BROADCAST_FIELDS: FieldDef[] = [
  { key: "program_title", label: "Program", required: true },
  { key: "presenter_name", label: "Presenter", placeholder: "Studio Host" },
  {
    key: "status",
    label: "Status",
    type: "select",
    options: ["LIVE", "PAUSED", "EMERGENCY", "ENDED"].map((s) => ({
      value: s,
      label: s,
    })),
  },
  {
    key: "recording_status",
    label: "Recording",
    type: "select",
    options: ["RECORDING", "SAVED", "IDLE"].map((s) => ({
      value: s,
      label: s,
    })),
  },
  { key: "listener_count", label: "Listeners", type: "number" },
  { key: "duration_seconds", label: "Duration (sec)", type: "number" },
  { key: "is_emergency", label: "Emergency Broadcast", type: "checkbox" },
  { key: "notes", label: "Notes", type: "textarea", fullWidth: true },
];

export function StudioLivePage() {
  const [overview, setOverview] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [modeFilter, setModeFilter] = useState("ALL");

  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState<any | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [deleting, setDeleting] = useState<any | null>(null);

  const load = useCallback(async () => {
    try {
      const [ov, hist] = await Promise.all([
        apiFetch("/api/studio/overview"),
        apiFetch<any[]>("/api/studio/broadcast/history"),
      ]);
      setOverview(ov);
      setHistory(hist);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    return history.filter((r) => {
      if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
      if (modeFilter === "EMERGENCY" && !r.is_emergency) return false;
      if (modeFilter === "STANDARD" && r.is_emergency) return false;
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        const hit =
          r.program_title?.toLowerCase().includes(q) ||
          r.presenter_name?.toLowerCase().includes(q) ||
          r.notes?.toLowerCase().includes(q);
        if (!hit) return false;
      }
      return true;
    });
  }, [history, statusFilter, modeFilter, query]);

  const hasFilters =
    Boolean(query.trim()) || statusFilter !== "ALL" || modeFilter !== "ALL";

  const resetFilters = () => {
    setQuery("");
    setStatusFilter("ALL");
    setModeFilter("ALL");
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="BROADCAST CONTROL"
        title="Live Control"
        description="Start, pause, monitor, and record live studio broadcasts."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/studio/live/emergency"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#FDE7E7] bg-white px-3 py-2 text-[12px] font-bold text-[#C40D0F] hover:bg-[#FEF7F7]"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Emergency broadcast</span>
            </Link>
            <ToolbarButton onClick={() => setCreating(true)}>
              <Plus className="h-3.5 w-3.5" />
              <span>Log broadcast</span>
            </ToolbarButton>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <BroadcastPanel
          broadcast={overview?.broadcast}
          currentProgram={overview?.currentProgram}
          audioStream={overview?.audioStream}
          stationName={overview?.station?.name}
          onRefresh={load}
        />

        <div className="space-y-4 lg:col-span-2">
          <SectionCard title="On air now">
            {overview?.broadcast ? (
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[15px] font-extrabold text-[#050505]">
                    {overview.broadcast.program_title}
                  </p>
                  <p className="text-[12px] text-[#6B7280]">
                    {overview.broadcast.presenter_name} · Started{" "}
                    {relativeTime(overview.broadcast.started_at)}
                  </p>
                </div>
                <StatusBadge status={overview.broadcast.status} />
              </div>
            ) : (
              <p className="text-[12.5px] text-[#6B7280]">
                Studio is currently off air.
              </p>
            )}
          </SectionCard>

          <SectionCard title="Upcoming today">
            {(overview?.todaySchedule || []).length === 0 ? (
              <p className="text-[12.5px] text-[#6B7280]">
                No slots scheduled today.
              </p>
            ) : (
              <div className="divide-y divide-[#F0F1F3]">
                {overview.todaySchedule.slice(0, 5).map((s: any) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between py-2.5 text-[12.5px]"
                  >
                    <div>
                      <span className="font-bold text-[#047422] mr-2.5 tabular-nums">
                        {formatTime(s.start_time)}
                      </span>
                      <span className="font-bold text-[#050505]">
                        {s.program_title}
                      </span>
                      <span className="ml-2 text-[#6B7280]">
                        · {s.presenter_name}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#9CA3AF]">
                      {s.studio}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>

      <SectionCard title="Recent broadcasts" padded={false}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F0F1F3] bg-[#FAFBFC] px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search program, presenter…"
                className="w-52 rounded-xl border border-[#E7E9EC] bg-white py-1.5 pl-8 pr-3 text-[12px] text-[#050505] placeholder:text-[#B0B6BE] focus:border-[#047422] focus:outline-none"
              />
            </div>

            <div className="inline-flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-[#9CA3AF]" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by broadcast status"
                className="rounded-xl border border-[#E7E9EC] bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[#1F2937] focus:border-[#047422] focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="LIVE">LIVE</option>
                <option value="PAUSED">PAUSED</option>
                <option value="EMERGENCY">EMERGENCY</option>
                <option value="ENDED">ENDED</option>
              </select>
            </div>

            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              aria-label="Filter by mode"
              className="rounded-xl border border-[#E7E9EC] bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[#1F2937] focus:border-[#047422] focus:outline-none"
            >
              <option value="ALL">All Modes</option>
              <option value="STANDARD">Standard</option>
              <option value="EMERGENCY">Emergency</option>
            </select>

            {hasFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 rounded-xl border border-[#E7E9EC] bg-white px-2.5 py-1.5 text-[11.5px] font-bold text-[#6B7280] hover:text-[#050505]"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          <span className="text-[11.5px] font-semibold text-[#6B7280] tabular-nums">
            Showing {filtered.length} of {history.length}
          </span>
        </div>

        <div className="p-4">
          <DataTable
            loading={loading}
            columns={[
              {
                key: "program_title",
                label: "Program",
                render: (r) => (
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#050505]">
                      {r.program_title}
                    </span>
                    {r.is_emergency && (
                      <TablePill tone="live">EMERGENCY</TablePill>
                    )}
                  </div>
                ),
              },
              { key: "presenter_name", label: "Presenter" },
              {
                key: "started_at",
                label: "Start",
                render: (r) => (
                  <span className="tabular-nums">{relativeTime(r.started_at)}</span>
                ),
              },
              {
                key: "duration_seconds",
                label: "Duration",
                render: (r) => (
                  <span className="font-mono tabular-nums">
                    {formatDuration(r.duration_seconds)}
                  </span>
                ),
              },
              {
                key: "status",
                label: "Status",
                render: (r) => <StatusBadge status={r.status} />,
              },
              {
                key: "_actions",
                label: "Actions",
                align: "right",
                render: (r) => (
                  <RecordActions
                    onView={() => setViewing(r)}
                    onEdit={() => setEditing(r)}
                    onDelete={() => setDeleting(r)}
                  />
                ),
              },
            ]}
            rows={filtered}
            onRowClick={(r) => setViewing(r)}
            empty={
              <EmptyState
                icon={Radio}
                title={hasFilters ? "No matching broadcasts" : "No broadcasts recorded yet"}
                description="Start a live broadcast above or log a studio session."
                action={
                  hasFilters ? (
                    <ToolbarButton variant="outline" onClick={resetFilters}>
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Reset filters</span>
                    </ToolbarButton>
                  ) : (
                    <ToolbarButton onClick={() => setCreating(true)}>
                      <Plus className="h-3.5 w-3.5" />
                      <span>Log broadcast</span>
                    </ToolbarButton>
                  )
                }
              />
            }
          />
        </div>
      </SectionCard>

      <RecordViewDialog
        open={Boolean(viewing)}
        title={viewing?.program_title || "Broadcast Details"}
        record={viewing}
        fields={STUDIO_BROADCAST_FIELDS}
        extraFields={[{ key: "started_at", label: "Started At" }]}
        onClose={() => setViewing(null)}
        onEdit={viewing ? () => setEditing(viewing) : undefined}
        onDelete={viewing ? () => setDeleting(viewing) : undefined}
      />

      <RecordEditDialog
        open={creating}
        title="Log Broadcast Session"
        fields={STUDIO_BROADCAST_FIELDS}
        initialValues={{
          status: "ENDED",
          recording_status: "SAVED",
          listener_count: 18,
          duration_seconds: 1800,
          is_emergency: false,
        }}
        onClose={() => setCreating(false)}
        onSave={async (vals) => {
          await apiFetch("/api/studio/record/Broadcast", {
            method: "POST",
            body: JSON.stringify(vals),
          });
          toast.success("Broadcast logged");
          load();
        }}
      />

      <RecordEditDialog
        open={Boolean(editing)}
        title="Edit Broadcast Session"
        fields={STUDIO_BROADCAST_FIELDS}
        initialValues={editing || {}}
        onClose={() => setEditing(null)}
        onSave={async (vals) => {
          await apiFetch(`/api/studio/record/Broadcast/${editing.id}`, {
            method: "PATCH",
            body: JSON.stringify(vals),
          });
          toast.success("Changes saved");
          load();
        }}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        title="Delete broadcast"
        description={`Delete broadcast "${deleting?.program_title || "this session"}"?`}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (deleting?.id) {
            await apiFetch(`/api/studio/record/Broadcast/${deleting.id}`, {
              method: "DELETE",
            });
            toast.success("Deleted");
            load();
          }
        }}
      />
    </div>
  );
}

export function StudioEmergencyPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [notify, setNotify] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);

  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState<any | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [deleting, setDeleting] = useState<any | null>(null);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const all = await apiFetch<any[]>("/api/studio/broadcast/history");
      setLogs(all.filter((b) => b.is_emergency || b.status === "EMERGENCY"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const rules = [
    "Immediately takes over the active Radio Hargeysa live stream.",
    "Begins automatic emergency recording in Studio 1.",
    "Marks the live broadcast status as EMERGENCY across all dashboards.",
    "Optionally dispatches an in-app alert banner to all listeners.",
  ];

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !confirmed) return;
    setBusy(true);
    try {
      await apiFetch("/api/studio/broadcast/start", {
        method: "POST",
        body: JSON.stringify({
          program_title: title.trim(),
          notes: message.trim(),
          is_emergency: true,
          send_notification: notify,
        }),
      });
      toast.success("Emergency broadcast started");
      navigate("/studio/live");
    } catch (err: any) {
      toast.error(err.message || "Could not start emergency broadcast");
    } finally {
      setBusy(false);
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((r) => {
      if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        const hit =
          r.program_title?.toLowerCase().includes(q) ||
          r.notes?.toLowerCase().includes(q) ||
          r.started_by?.toLowerCase().includes(q);
        if (!hit) return false;
      }
      return true;
    });
  }, [logs, statusFilter, query]);

  const hasFilters = Boolean(query.trim()) || statusFilter !== "ALL";

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="OVERRIDE PROTOCOL"
        title="Emergency broadcast"
        description="Interrupt scheduled programming for urgent national or civil announcements."
        actions={
          <ToolbarButton onClick={() => setCreating(true)}>
            <Plus className="h-3.5 w-3.5" />
            <span>Log override record</span>
          </ToolbarButton>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <SectionCard title="What this does">
          <ul className="space-y-3">
            {rules.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[12.5px] text-[#1F2937]"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#C40D0F]" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Confirmation required">
          <form onSubmit={handleStart} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF]">
                Broadcast title <span className="text-[#C40D0F]">*</span>
              </label>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Urgent public weather bulletin"
                className="mt-1 w-full rounded-xl border border-[#E7E9EC] px-3 py-2 text-[12.5px] focus:border-[#C40D0F] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF]">
                Listener message
              </label>
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Reason for the interruption…"
                className="mt-1 w-full rounded-xl border border-[#E7E9EC] px-3 py-2 text-[12.5px] focus:border-[#C40D0F] focus:outline-none"
              />
            </div>

            <label className="flex items-center gap-2.5 text-[12.5px] font-semibold text-[#1F2937]">
              <input
                type="checkbox"
                checked={notify}
                onChange={(e) => setNotify(e.target.checked)}
                className="h-4 w-4 accent-[#C40D0F]"
              />
              <span>Send a push notification to listeners</span>
            </label>

            <div className="rounded-2xl border border-[#FDE7E7] bg-[#FEF7F7] p-3.5">
              <label className="flex items-center gap-2.5 text-[12.5px] font-bold text-[#C40D0F]">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="h-4 w-4 accent-[#C40D0F]"
                />
                <span>I confirm this override is intentional</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Link
                to="/studio/live"
                className="rounded-xl border border-[#E7E9EC] bg-white px-4 py-2 text-[12px] font-bold text-[#050505]"
              >
                Cancel
              </Link>
              <ToolbarButton
                type="submit"
                variant="danger"
                disabled={busy || !confirmed || !title.trim()}
              >
                {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Start emergency broadcast</span>
              </ToolbarButton>
            </div>
          </form>
        </SectionCard>
      </div>

      <SectionCard title="Emergency override log" padded={false}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F0F1F3] bg-[#FAFBFC] px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search bulletin title, notes…"
                className="w-52 rounded-xl border border-[#E7E9EC] bg-white py-1.5 pl-8 pr-3 text-[12px] text-[#050505] placeholder:text-[#B0B6BE] focus:border-[#047422] focus:outline-none"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by override status"
              className="rounded-xl border border-[#E7E9EC] bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[#1F2937] focus:border-[#047422] focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="EMERGENCY">EMERGENCY</option>
              <option value="PAUSED">PAUSED</option>
              <option value="ENDED">ENDED</option>
            </select>

            {hasFilters && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setStatusFilter("ALL");
                }}
                className="inline-flex items-center gap-1 rounded-xl border border-[#E7E9EC] bg-white px-2.5 py-1.5 text-[11.5px] font-bold text-[#6B7280] hover:text-[#050505]"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
          <span className="text-[11.5px] font-semibold text-[#6B7280] tabular-nums">
            Showing {filteredLogs.length} of {logs.length}
          </span>
        </div>

        <div className="p-4">
          <DataTable
            loading={loading}
            columns={[
              {
                key: "program_title",
                label: "Bulletin Title",
                render: (r) => (
                  <span className="font-bold text-[#050505]">
                    {r.program_title}
                  </span>
                ),
              },
              { key: "notes", label: "Message" },
              {
                key: "started_at",
                label: "Triggered",
                render: (r) => relativeTime(r.started_at),
              },
              {
                key: "status",
                label: "Status",
                render: (r) => <StatusBadge status={r.status} />,
              },
              {
                key: "_actions",
                label: "Actions",
                align: "right",
                render: (r) => (
                  <RecordActions
                    onView={() => setViewing(r)}
                    onEdit={() => setEditing(r)}
                    onDelete={() => setDeleting(r)}
                  />
                ),
              },
            ]}
            rows={filteredLogs}
            onRowClick={(r) => setViewing(r)}
            empty={
              <EmptyState
                icon={AlertTriangle}
                title="No emergency overrides recorded"
              />
            }
          />
        </div>
      </SectionCard>

      <RecordViewDialog
        open={Boolean(viewing)}
        title={viewing?.program_title || "Emergency Override"}
        record={viewing}
        fields={STUDIO_BROADCAST_FIELDS}
        onClose={() => setViewing(null)}
        onEdit={viewing ? () => setEditing(viewing) : undefined}
        onDelete={viewing ? () => setDeleting(viewing) : undefined}
      />

      <RecordEditDialog
        open={creating}
        title="Log Emergency Override"
        fields={STUDIO_BROADCAST_FIELDS}
        initialValues={{ status: "ENDED", is_emergency: true, recording_status: "SAVED" }}
        onClose={() => setCreating(false)}
        onSave={async (vals) => {
          await apiFetch("/api/studio/record/Broadcast", {
            method: "POST",
            body: JSON.stringify({ ...vals, is_emergency: true }),
          });
          toast.success("Override logged");
          loadLogs();
        }}
      />

      <RecordEditDialog
        open={Boolean(editing)}
        title="Edit Emergency Log"
        fields={STUDIO_BROADCAST_FIELDS}
        initialValues={editing || {}}
        onClose={() => setEditing(null)}
        onSave={async (vals) => {
          await apiFetch(`/api/studio/record/Broadcast/${editing.id}`, {
            method: "PATCH",
            body: JSON.stringify(vals),
          });
          toast.success("Changes saved");
          loadLogs();
        }}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        title="Delete emergency log"
        description={`Delete "${deleting?.program_title || "this override record"}"?`}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (deleting?.id) {
            await apiFetch(`/api/studio/record/Broadcast/${deleting.id}`, {
              method: "DELETE",
            });
            toast.success("Deleted");
            loadLogs();
          }
        }}
      />
    </div>
  );
}

export function StudioStreamsPage() {
  const [streams, setStreams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState("ALL");
  const [healthFilter, setHealthFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState<any | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [deleting, setDeleting] = useState<any | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    apiFetch<any[]>("/api/studio/streams")
      .then(setStreams)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    return streams.filter((s) => {
      if (kindFilter !== "ALL" && s.kind !== kindFilter) return false;
      if (healthFilter !== "ALL" && (s.health || "GOOD") !== healthFilter) {
        return false;
      }
      if (statusFilter !== "ALL" && (s.status || "OFFLINE") !== statusFilter) {
        return false;
      }
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        const hit =
          s.name?.toLowerCase().includes(q) ||
          s.provider?.toLowerCase().includes(q) ||
          s.codec?.toLowerCase().includes(q) ||
          s.primary_url?.toLowerCase().includes(q);
        if (!hit) return false;
      }
      return true;
    });
  }, [streams, kindFilter, healthFilter, statusFilter, query]);

  const hasFilters =
    Boolean(query.trim()) ||
    kindFilter !== "ALL" ||
    healthFilter !== "ALL" ||
    statusFilter !== "ALL";

  const resetFilters = () => {
    setQuery("");
    setKindFilter("ALL");
    setHealthFilter("ALL");
    setStatusFilter("ALL");
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="STREAM TELEMETRY"
        title="Stream health"
        description="Monitor live signal latency, encoder bitrate, health diagnostics, and failover endpoints."
        actions={
          <ToolbarButton onClick={() => setCreating(true)}>
            <Plus className="h-3.5 w-3.5" />
            <span>Add stream</span>
          </ToolbarButton>
        }
      />

      {streams.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {streams.slice(0, 2).map((s) => (
            <SectionCard
              key={s.id}
              title={s.name}
              description={`${s.kind} · ${(s.provider || "icecast").toUpperCase()}`}
              actions={
                <div className="flex items-center gap-2">
                  <TablePill tone={s.kind === "AUDIO" ? "brand" : "neutral"}>
                    {s.kind}
                  </TablePill>
                  <StatusBadge status={s.status} />
                </div>
              }
            >
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-[12px]">
                <div>
                  <p className="text-[10px] font-bold uppercase text-[#9CA3AF]">
                    Health
                  </p>
                  <div className="mt-1">
                    <StatusBadge status={s.health || "GOOD"} />
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-[#9CA3AF]">
                    Bitrate
                  </p>
                  <p className="mt-1 font-bold tabular-nums">{s.bitrate_kbps} kbps</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-[#9CA3AF]">
                    Codec
                  </p>
                  <p className="mt-1 font-bold">{s.codec || "AAC"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-[#9CA3AF]">
                    Latency
                  </p>
                  <p className="mt-1 font-bold tabular-nums">{s.latency_ms || 0} ms</p>
                </div>
              </div>
            </SectionCard>
          ))}
        </div>
      )}

      <SectionCard title="All studio stream monitors" padded={false}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F0F1F3] bg-[#FAFBFC] px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search stream, codec, provider…"
                className="w-52 rounded-xl border border-[#E7E9EC] bg-white py-1.5 pl-8 pr-3 text-[12px] text-[#050505] placeholder:text-[#B0B6BE] focus:border-[#047422] focus:outline-none"
              />
            </div>

            <div className="inline-flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-[#9CA3AF]" />
              <select
                value={kindFilter}
                onChange={(e) => setKindFilter(e.target.value)}
                aria-label="Filter by stream kind"
                className="rounded-xl border border-[#E7E9EC] bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[#1F2937] focus:border-[#047422] focus:outline-none"
              >
                <option value="ALL">All Kinds</option>
                <option value="AUDIO">AUDIO</option>
                <option value="VIDEO">VIDEO</option>
              </select>
            </div>

            <select
              value={healthFilter}
              onChange={(e) => setHealthFilter(e.target.value)}
              aria-label="Filter by stream health"
              className="rounded-xl border border-[#E7E9EC] bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[#1F2937] focus:border-[#047422] focus:outline-none"
            >
              <option value="ALL">All Health</option>
              <option value="GOOD">GOOD</option>
              <option value="DEGRADED">DEGRADED</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by stream status"
              className="rounded-xl border border-[#E7E9EC] bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[#1F2937] focus:border-[#047422] focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="LIVE">LIVE</option>
              <option value="OFFLINE">OFFLINE</option>
              <option value="PAUSED">PAUSED</option>
              <option value="ERROR">ERROR</option>
            </select>

            {hasFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 rounded-xl border border-[#E7E9EC] bg-white px-2.5 py-1.5 text-[11.5px] font-bold text-[#6B7280] hover:text-[#050505]"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          <span className="text-[11.5px] font-semibold text-[#6B7280] tabular-nums">
            Showing {filtered.length} of {streams.length}
          </span>
        </div>

        <div className="p-4">
          <DataTable
            loading={loading}
            columns={[
              {
                key: "name",
                label: "Stream",
                render: (s) => (
                  <div>
                    <span className="font-bold text-[#050505]">{s.name}</span>
                    <p className="mt-0.5 max-w-xs truncate font-mono text-[11px] text-[#6B7280]">
                      {s.primary_url || s.hls_output_url || "No endpoint configured"}
                    </p>
                  </div>
                ),
              },
              {
                key: "kind",
                label: "Kind",
                render: (s) => (
                  <TablePill tone={s.kind === "AUDIO" ? "brand" : "neutral"}>
                    {s.kind}
                  </TablePill>
                ),
              },
              {
                key: "bitrate_kbps",
                label: "Bitrate / Codec",
                render: (s) => (
                  <span className="font-mono text-[11.5px] tabular-nums">
                    {s.bitrate_kbps || 64} kbps · {s.codec || "AAC"}
                  </span>
                ),
              },
              {
                key: "latency_ms",
                label: "Latency",
                align: "right",
                render: (s) => (
                  <span className="font-mono text-[11.5px] tabular-nums">
                    {s.latency_ms || 0} ms
                  </span>
                ),
              },
              {
                key: "health",
                label: "Health",
                render: (s) => <StatusBadge status={s.health || "GOOD"} />,
              },
              {
                key: "status",
                label: "Status",
                render: (s) => <StatusBadge status={s.status || "OFFLINE"} />,
              },
              {
                key: "_actions",
                label: "Actions",
                align: "right",
                render: (s) => (
                  <RecordActions
                    onView={() => setViewing(s)}
                    onEdit={() => setEditing(s)}
                    onDelete={() => setDeleting(s)}
                  />
                ),
              },
            ]}
            rows={filtered}
            onRowClick={(s) => setViewing(s)}
            empty={
              <EmptyState
                icon={Radio}
                title={hasFilters ? "No matching streams" : "No streams configured"}
                action={
                  hasFilters ? (
                    <ToolbarButton variant="outline" onClick={resetFilters}>
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Reset filters</span>
                    </ToolbarButton>
                  ) : (
                    <ToolbarButton onClick={() => setCreating(true)}>
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add stream</span>
                    </ToolbarButton>
                  )
                }
              />
            }
          />
        </div>
      </SectionCard>

      <RecordViewDialog
        open={Boolean(viewing)}
        title={viewing?.name || "Stream Health Details"}
        record={viewing}
        extraFields={[
          { key: "name", label: "Stream Name" },
          { key: "kind", label: "Kind" },
          { key: "provider", label: "Provider" },
          { key: "codec", label: "Codec" },
          { key: "bitrate_kbps", label: "Bitrate (kbps)" },
          { key: "latency_ms", label: "Latency (ms)" },
          { key: "health", label: "Health" },
          { key: "primary_url", label: "Primary URL" },
          { key: "backup_url", label: "Backup URL" },
          { key: "hls_output_url", label: "HLS Output URL" },
          { key: "rtmp_ingest_url", label: "RTMP Ingest URL" },
        ]}
        onClose={() => setViewing(null)}
        onEdit={viewing ? () => setEditing(viewing) : undefined}
        onDelete={viewing ? () => setDeleting(viewing) : undefined}
      />

      <StreamForm
        open={creating || Boolean(editing)}
        stream={editing}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        onSaved={load}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        title="Delete stream"
        description={`Delete stream "${deleting?.name || "this stream"}"?`}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (deleting?.id) {
            await apiFetch(`/api/studio/record/LiveStream/${deleting.id}`, {
              method: "DELETE",
            });
            toast.success("Stream deleted");
            load();
          }
        }}
      />
    </div>
  );
}

export function StudioSchedulePage() {
  const [day, setDay] = useState("ALL");
  const [query, setQuery] = useState("");
  const [studioFilter, setStudioFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [schedules, setSchedules] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openNew, setOpenNew] = useState(false);
  const [viewing, setViewing] = useState<any | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [deleting, setDeleting] = useState<any | null>(null);

  const [form, setForm] = useState({
    program_id: "",
    program_title: "",
    presenter_name: "",
    day_of_week: "MONDAY",
    start_time: "07:00",
    end_time: "09:00",
    studio: "Studio 1",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const prod = await apiFetch<any>("/api/studio/production");
      setSchedules(prod.schedules || []);
      setPrograms(prod.programs || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const studios = useMemo(() => {
    return Array.from(
      new Set(schedules.map((s) => s.studio).filter(Boolean))
    ) as string[];
  }, [schedules]);

  const filtered = useMemo(() => {
    return schedules.filter((s) => {
      if (day !== "ALL" && s.day_of_week !== day) return false;
      if (studioFilter !== "ALL" && s.studio !== studioFilter) return false;
      if (statusFilter !== "ALL" && (s.status || "SCHEDULED") !== statusFilter) {
        return false;
      }
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        const hit =
          s.program_title?.toLowerCase().includes(q) ||
          s.presenter_name?.toLowerCase().includes(q) ||
          s.studio?.toLowerCase().includes(q);
        if (!hit) return false;
      }
      return true;
    });
  }, [schedules, day, studioFilter, statusFilter, query]);

  const hasFilters =
    day !== "ALL" ||
    Boolean(query.trim()) ||
    studioFilter !== "ALL" ||
    statusFilter !== "ALL";

  const resetFilters = () => {
    setDay("ALL");
    setQuery("");
    setStudioFilter("ALL");
    setStatusFilter("ALL");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch("/api/studio/schedule", {
        method: "POST",
        body: JSON.stringify(form),
      });
      toast.success("Slot added to the schedule");
      setOpenNew(false);
      load();
    } catch (err: any) {
      toast.error(err.message || "Could not add slot");
    }
  };

  const scheduleFields: FieldDef[] = [
    { key: "program_title", label: "Program", required: true },
    { key: "presenter_name", label: "Presenter" },
    {
      key: "day_of_week",
      label: "Day of Week",
      type: "select",
      options: DAYS_OF_WEEK.map((d) => ({ value: d, label: d })),
    },
    { key: "studio", label: "Studio" },
    { key: "start_time", label: "Start", placeholder: "07:00" },
    { key: "end_time", label: "End", placeholder: "09:00" },
    {
      key: "status",
      label: "Status",
      type: "select",
      options: ["SCHEDULED", "ACTIVE", "CANCELLED"].map((s) => ({
        value: s,
        label: s,
      })),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="PROGRAMMING"
        title="Schedule"
        description="Manage weekly broadcast slots across Studio 1 and Studio 2."
        actions={
          <ToolbarButton onClick={() => setOpenNew(true)}>
            <Plus className="h-3.5 w-3.5" />
            <span>New slot</span>
          </ToolbarButton>
        }
      />

      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setDay("ALL")}
          className={cn(
            "rounded-full border px-3.5 py-1.5 text-[11.5px] font-bold transition-colors",
            day === "ALL"
              ? "border-[#047422] bg-[#047422] text-white"
              : "border-[#E7E9EC] bg-white text-[#4B5563]"
          )}
        >
          All Days
        </button>
        {DAYS_OF_WEEK.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDay(d)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-[11.5px] font-bold transition-colors",
              day === d
                ? "border-[#047422] bg-[#047422] text-white"
                : "border-[#E7E9EC] bg-white text-[#4B5563]"
            )}
          >
            {DAY_SHORT_LABELS[d]}
          </button>
        ))}
      </div>

      <SectionCard padded={false}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F0F1F3] bg-[#FAFBFC] px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search program, presenter, studio…"
                className="w-52 rounded-xl border border-[#E7E9EC] bg-white py-1.5 pl-8 pr-3 text-[12px] text-[#050505] placeholder:text-[#B0B6BE] focus:border-[#047422] focus:outline-none"
              />
            </div>

            <select
              value={studioFilter}
              onChange={(e) => setStudioFilter(e.target.value)}
              aria-label="Filter by studio"
              className="rounded-xl border border-[#E7E9EC] bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[#1F2937] focus:border-[#047422] focus:outline-none"
            >
              <option value="ALL">All Studios</option>
              {studios.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by schedule status"
              className="rounded-xl border border-[#E7E9EC] bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[#1F2937] focus:border-[#047422] focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="SCHEDULED">SCHEDULED</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>

            {hasFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 rounded-xl border border-[#E7E9EC] bg-white px-2.5 py-1.5 text-[11.5px] font-bold text-[#6B7280] hover:text-[#050505]"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          <span className="text-[11.5px] font-semibold text-[#6B7280] tabular-nums">
            Showing {filtered.length} of {schedules.length}
          </span>
        </div>

        <div className="p-4">
          <DataTable
            loading={loading}
            columns={[
              {
                key: "day_of_week",
                label: "Day",
                render: (r) => (
                  <TablePill tone="brand">
                    {DAY_SHORT_LABELS[r.day_of_week] || r.day_of_week}
                  </TablePill>
                ),
              },
              {
                key: "time",
                label: "Time",
                render: (r) => (
                  <span className="font-bold text-[#047422] tabular-nums">
                    {formatTime(r.start_time)} – {formatTime(r.end_time)}
                  </span>
                ),
              },
              {
                key: "program_title",
                label: "Program",
                render: (r) => (
                  <span className="font-bold text-[#050505]">
                    {r.program_title}
                  </span>
                ),
              },
              { key: "presenter_name", label: "Presenter" },
              { key: "studio", label: "Studio" },
              {
                key: "status",
                label: "Status",
                render: (r) => <StatusBadge status={r.status} />,
              },
              {
                key: "_actions",
                label: "Actions",
                align: "right",
                render: (r) => (
                  <RecordActions
                    onView={() => setViewing(r)}
                    onEdit={() => setEditing(r)}
                    onDelete={() => setDeleting(r)}
                  />
                ),
              },
            ]}
            rows={filtered}
            onRowClick={(r) => setViewing(r)}
            empty={
              <EmptyState
                icon={Calendar}
                title={hasFilters ? "No matching schedule slots" : "Nothing scheduled"}
                action={
                  hasFilters ? (
                    <ToolbarButton variant="outline" onClick={resetFilters}>
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Reset filters</span>
                    </ToolbarButton>
                  ) : (
                    <ToolbarButton onClick={() => setOpenNew(true)}>
                      <Plus className="h-3.5 w-3.5" />
                      <span>New slot</span>
                    </ToolbarButton>
                  )
                }
              />
            }
          />
        </div>
      </SectionCard>

      {openNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6">
            <div className="flex items-center justify-between border-b border-[#F0F1F3] pb-3">
              <h3 className="text-[16px] font-extrabold">New schedule slot</h3>
              <button
                type="button"
                onClick={() => setOpenNew(false)}
                className="p-1 text-[#6B7280]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF]">
                  Program <span className="text-[#C40D0F]">*</span>
                </label>
                <select
                  value={form.program_id}
                  onChange={(e) => {
                    const p = programs.find((pr) => pr.id === e.target.value);
                    setForm((f) => ({
                      ...f,
                      program_id: e.target.value,
                      program_title: p?.title || "",
                      presenter_name: p?.presenter_names?.[0] || f.presenter_name,
                    }));
                  }}
                  className="mt-1 w-full rounded-xl border border-[#E7E9EC] bg-white px-3 py-2 text-[12.5px]"
                >
                  <option value="">—</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF]">
                    Presenter
                  </label>
                  <input
                    value={form.presenter_name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, presenter_name: e.target.value }))
                    }
                    className="mt-1 w-full rounded-xl border border-[#E7E9EC] px-3 py-2 text-[12.5px]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF]">
                    Day
                  </label>
                  <select
                    value={form.day_of_week}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, day_of_week: e.target.value }))
                    }
                    className="mt-1 w-full rounded-xl border border-[#E7E9EC] bg-white px-3 py-2 text-[12.5px]"
                  >
                    {DAYS_OF_WEEK.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF]">
                    Start
                  </label>
                  <input
                    value={form.start_time}
                    placeholder="07:00"
                    onChange={(e) =>
                      setForm((f) => ({ ...f, start_time: e.target.value }))
                    }
                    className="mt-1 w-full rounded-xl border border-[#E7E9EC] px-3 py-2 text-[12.5px]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF]">
                    End
                  </label>
                  <input
                    value={form.end_time}
                    placeholder="09:00"
                    onChange={(e) =>
                      setForm((f) => ({ ...f, end_time: e.target.value }))
                    }
                    className="mt-1 w-full rounded-xl border border-[#E7E9EC] px-3 py-2 text-[12.5px]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF]">
                  Studio
                </label>
                <input
                  value={form.studio}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, studio: e.target.value }))
                  }
                  className="mt-1 w-full rounded-xl border border-[#E7E9EC] px-3 py-2 text-[12.5px]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <ToolbarButton
                  type="button"
                  variant="outline"
                  onClick={() => setOpenNew(false)}
                >
                  Cancel
                </ToolbarButton>
                <ToolbarButton type="submit">Save</ToolbarButton>
              </div>
            </form>
          </div>
        </div>
      )}

      <RecordViewDialog
        open={Boolean(viewing)}
        title={viewing?.program_title || "Schedule Slot"}
        record={viewing}
        fields={scheduleFields}
        onClose={() => setViewing(null)}
        onEdit={viewing ? () => setEditing(viewing) : undefined}
        onDelete={viewing ? () => setDeleting(viewing) : undefined}
      />

      <RecordEditDialog
        open={Boolean(editing)}
        title="Edit slot"
        fields={scheduleFields}
        initialValues={editing || {}}
        onClose={() => setEditing(null)}
        onSave={async (vals) => {
          await apiFetch(`/api/studio/record/Schedule/${editing.id}`, {
            method: "PATCH",
            body: JSON.stringify(vals),
          });
          toast.success("Changes saved");
          load();
        }}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        title="Delete schedule slot"
        description={`Delete schedule slot for "${deleting?.program_title || "this program"}"?`}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (deleting?.id) {
            await apiFetch(`/api/studio/record/Schedule/${deleting.id}`, {
              method: "DELETE",
            });
            toast.success("Deleted");
            load();
          }
        }}
      />
    </div>
  );
}
