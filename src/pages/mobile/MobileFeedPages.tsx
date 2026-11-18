import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Play,
  Pause,
  Radio,
  Share2,
  Volume2,
  Search,
  Download,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Clock,
  Eye,
  Users,
  Loader2,
  Calendar,
  Megaphone,
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch, trackAnalyticsEvent } from "../../lib/api";
import {
  formatDuration,
  formatTime,
  formatTimeRange,
  formatDate,
  hhmmToMinutes,
} from "../../lib/format";
import { PROGRAM_CATEGORIES, titleCaseCategory } from "../../lib/constants";
import { usePreferences } from "../../lib/usePreferences";
import { usePlayer } from "../../components/mobile/PlayerProvider";
import { useLibrary } from "../../components/mobile/useLibrary";
import {
  MediaCard,
  Row,
  RowHeader,
  EpisodeRow,
} from "../../components/mobile/Media";
import { FollowButton, FavoriteButton } from "../../components/mobile/SaveButtons";
import { ContinueListening } from "../../components/mobile/ContinueListening";
import { EmptyState, IntegrationNotice } from "../../components/shared/EmptyState";
import { StatusBadge } from "../../components/shared/StatusBadge";
import { BrandLogo } from "../../components/shared/Brand";
import {
  CategoryIconGraphic,
  getThemeWaveColors,
} from "../../components/shared/CategoryVisuals";
import { cn } from "../../lib/utils";

function formatCompactCount(val?: number | null): string {
  const n = Number(val || 0);
  if (n >= 1000000) return `${(n / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

function formatMinutesLabel(seconds?: number | null): string {
  const s = Number(seconds || 0);
  if (s <= 0) return "";
  if (s < 60) return `${s} sec`;
  return `${Math.round(s / 60)} min`;
}

function HomeSectionHeader({
  title,
  seeAllTo,
}: {
  title: string;
  seeAllTo?: string;
}) {
  return (
    <div className="flex items-center justify-between px-4 pt-5 pb-2.5">
      <div className="flex items-center gap-2">
        <span className="h-4 w-1 rounded-full bg-[#047422]" aria-hidden="true" />
        <h2 className="text-[15px] font-extrabold tracking-tight text-[#050505]">
          {title}
        </h2>
      </div>
      {seeAllTo && (
        <Link
          to={seeAllTo}
          className="inline-flex items-center gap-1 text-[11.5px] font-bold text-[#047422] hover:underline whitespace-nowrap shrink-0"
        >
          <span>See all</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}

export function MobileHomePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [heroSlide, setHeroSlide] = useState(0);
  const [adIndex, setAdIndex] = useState(0);
  const trackedAdIds = useRef<Set<string>>(new Set());
  const navigate = useNavigate();
  const { track, playing, play, toggle } = usePlayer();

  useEffect(() => {
    trackAnalyticsEvent({ event_type: "APP_OPEN" });
    apiFetch("/api/content/home")
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const ads: any[] = Array.isArray(data?.advertisements) ? data.advertisements : [];
  const activeAd = ads.length > 0 ? ads[adIndex % ads.length] : null;

  useEffect(() => {
    if (activeAd?.id && !trackedAdIds.current.has(activeAd.id)) {
      trackedAdIds.current.add(activeAd.id);
      apiFetch(`/api/content/ads/${activeAd.id}/impression`, { method: "POST" }).catch(() => {});
    }
  }, [activeAd?.id]);

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <div className="h-48 animate-pulse rounded-[24px] bg-[#E7E9EC]" />
        <div className="h-24 animate-pulse rounded-[20px] bg-[#E7E9EC]" />
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="h-20 animate-pulse rounded-xl bg-[#E7E9EC]" />
          ))}
        </div>
        <div className="h-20 animate-pulse rounded-2xl bg-[#E7E9EC]" />
      </div>
    );
  }

  const liveTitle =
    data?.broadcast?.program_title ||
    data?.currentProgram?.program_title ||
    "Radio Hargeysa Live";
  const livePresenter =
    data?.broadcast?.presenter_name ||
    data?.currentProgram?.presenter_name ||
    "Studio 1 Desk";
  const liveTime = data?.currentProgram
    ? formatTimeRange(
        data.currentProgram.start_time,
        data.currentProgram.end_time
      )
    : "24/7 Live";
  const streamUrl = data?.audioStream?.primary_url || "";
  const isPlayingLive = track?.type === "LIVE" && playing;

  const heroSlides = [
    {
      eyebrow: "RADIO HARGEYSA",
      headline: "Codka Jamhuuriyadda Somaliland",
      subline: null as string | null,
    },
    {
      eyebrow: "ON AIR NOW",
      headline: liveTitle,
      subline: `${livePresenter} · ${liveTime}`,
    },
    {
      eyebrow: data?.nextProgram ? "UP NEXT" : "NATIONAL ARCHIVE",
      headline: data?.nextProgram
        ? data.nextProgram.program_title
        : "Trusted Voice Since 1942",
      subline: data?.nextProgram
        ? `${data.nextProgram.presenter_name || "Studio 1"} · ${formatTime(data.nextProgram.start_time)}`
        : "News, Culture, Education & Live Radio",
    },
  ];
  const currentHero = heroSlides[heroSlide % heroSlides.length];

  const categories: any[] =
    Array.isArray(data?.categories) && data.categories.length > 0
      ? data.categories
      : PROGRAM_CATEGORIES.map((slug, idx) => ({
          id: `fallback_${slug}`,
          name: titleCaseCategory(slug),
          slug,
          icon_name: "radio",
          color_theme: idx % 3 === 2 ? "rose" : "green",
        }));

  const handlePlayLive = () => {
    if (track?.type === "LIVE") {
      toggle();
      return;
    }
    play({
      id: "live_radio_hargeysa",
      type: "LIVE",
      title: liveTitle,
      subtitle: livePresenter,
      imageUrl: "/media/radio-studio.jpg",
      src: streamUrl,
      href: "/mobile/live",
    });
  };

  const trackAdClick = (ad: any) => {
    apiFetch(`/api/content/ads/${ad.id}/click`, { method: "POST" }).catch(() => {});
  };

  const handleInternalAdClick = (ad: any) => {
    trackAdClick(ad);
    const target = String(ad.target_url || "").trim();
    if (!target) {
      navigate("/mobile/programs");
      return;
    }
    if (target.startsWith("/")) {
      navigate(target);
    }
  };

  return (
    <div className="pb-4">
      {/* 1. Hero Live Broadcast Banner */}
      <div className="px-4 pt-3">
        <div className="relative overflow-hidden rounded-[24px] border border-[#DCE8DF] bg-gradient-to-br from-[#F7FBF8] via-[#FFFFFF] to-[#ECF6EE] px-4 pt-4 pb-3.5 text-[#050505] shadow-[0_14px_34px_-18px_rgba(5,5,5,0.18)]">
          {/* Decorative skyline, waves & Somaliland green/red ribbons */}
          <svg
            aria-hidden="true"
            viewBox="0 0 440 230"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-0 h-full w-full"
          >
            <defs>
              <linearGradient id="rhWaveMint" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#E6F4EA" stopOpacity="0.65" />
                <stop offset="100%" stopColor="#D7EEDF" stopOpacity="0.3" />
              </linearGradient>
              <linearGradient id="rhRibbonGreen" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0%" stopColor="#047422" />
                <stop offset="100%" stopColor="#0A9632" />
              </linearGradient>
              <linearGradient id="rhRibbonRed" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0%" stopColor="#B80B0D" />
                <stop offset="100%" stopColor="#E11D20" />
              </linearGradient>
            </defs>
            <path
              d="M -10 155 Q 160 110 450 25 L 450 240 L -10 240 Z"
              fill="url(#rhWaveMint)"
            />
            {/* Subtle Hargeisa hills & city skyline silhouette */}
            <path
              d="M 100 230 L 100 202 L 114 202 L 114 192 L 128 192 L 128 205 L 146 205 L 146 188 L 160 188 L 160 198 L 178 198 L 178 184 L 194 184 L 194 203 L 214 203 L 214 190 L 230 190 L 230 208 L 250 208 L 250 195 L 270 195 L 270 230 Z"
              fill="#CBD5E1"
              fillOpacity="0.28"
            />
            <path
              d="M 185 235 C 290 218 375 182 448 128 L 448 168 C 380 210 295 230 225 235 Z"
              fill="url(#rhRibbonGreen)"
            />
            <path
              d="M 130 235 C 265 232 375 208 448 164 L 448 235 Z"
              fill="url(#rhRibbonRed)"
            />
          </svg>

          {/* Right-side Radio Hargeysa 1942 crest + studio microphone artwork */}
          <svg
            aria-hidden="true"
            viewBox="0 0 215 190"
            className="pointer-events-none absolute -right-1 top-2 h-[155px] w-[176px] sm:right-1 sm:h-[168px] sm:w-[192px]"
          >
            <defs>
              <filter id="rhCrestShadow" x="-15%" y="-15%" width="130%" height="130%">
                <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#050505" floodOpacity="0.14" />
              </filter>
              <linearGradient id="rhMicBody" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#141619" />
                <stop offset="45%" stopColor="#3B4048" />
                <stop offset="100%" stopColor="#0A0B0C" />
              </linearGradient>
              <linearGradient id="rhMicCollar" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#9CA3AF" />
                <stop offset="50%" stopColor="#F3F4F6" />
                <stop offset="100%" stopColor="#6B7280" />
              </linearGradient>
              <clipPath id="rhBadgeClip">
                <circle cx="72" cy="84" r="56" />
              </clipPath>
            </defs>

            <g filter="url(#rhCrestShadow)">
              <circle cx="72" cy="84" r="58" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1.5" />
              <g clipPath="url(#rhBadgeClip)">
                <rect x="12" y="24" width="120" height="24" fill="#047422" />
                <rect x="12" y="48" width="120" height="66" fill="#FFFFFF" />
                <rect x="12" y="114" width="120" height="30" fill="#C40D0F" />
                <path d="M 28 49 L 47 49 L 44 57 L 35 61 L 26 57 Z" fill="#050505" />
                <path
                  d="M 31 99 L 36 74 L 41 99 M 33 88 L 39 88 M 34 81 L 38 81"
                  stroke="#050505"
                  strokeWidth="1.3"
                  fill="none"
                />
                <circle cx="36" cy="72" r="1.5" fill="#050505" />
                <text
                  x="72"
                  y="93"
                  textAnchor="middle"
                  fill="#050505"
                  fontFamily="Georgia, serif"
                  fontWeight="800"
                  fontSize="36"
                  letterSpacing="-1.5"
                >
                  RH
                </text>
                <text
                  x="88"
                  y="60"
                  textAnchor="middle"
                  fill="#050505"
                  fontFamily="Manrope, sans-serif"
                  fontWeight="800"
                  fontSize="5.5"
                  letterSpacing="0.5"
                >
                  RADIO HARGEYSA
                </text>
                <text
                  x="72"
                  y="108"
                  textAnchor="middle"
                  fill="#050505"
                  fontFamily="Manrope, sans-serif"
                  fontWeight="700"
                  fontSize="5.2"
                >
                  Codka Jamhuuriyadda Somaliland
                </text>
                <text
                  x="72"
                  y="124"
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontFamily="Manrope, sans-serif"
                  fontWeight="700"
                  fontSize="6"
                >
                  Since
                </text>
                <text
                  x="72"
                  y="135"
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontFamily="Manrope, sans-serif"
                  fontWeight="800"
                  fontSize="10.5"
                  letterSpacing="0.8"
                >
                  1942
                </text>
              </g>
            </g>

            {/* Studio Condenser Microphone + Green/Red Rings */}
            <g transform="translate(115, 18)">
              <ellipse
                cx="42"
                cy="66"
                rx="34"
                ry="13"
                transform="rotate(-14 42 66)"
                fill="none"
                stroke="#047422"
                strokeWidth="7"
              />
              <ellipse
                cx="42"
                cy="90"
                rx="32"
                ry="12"
                transform="rotate(14 42 90)"
                fill="none"
                stroke="#C40D0F"
                strokeWidth="7"
              />
              <rect x="39" y="114" width="6" height="36" rx="2" fill="#1F2937" />
              <ellipse cx="42" cy="152" rx="26" ry="6" fill="#111827" />
              <ellipse cx="42" cy="150" rx="22" ry="4" fill="#374151" />
              <path
                d="M 22 68 L 22 98 C 22 112 62 112 62 98 L 62 68"
                fill="none"
                stroke="#1F2937"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <rect x="27" y="16" width="30" height="42" rx="15" fill="url(#rhMicBody)" />
              <rect x="35" y="34" width="2.5" height="9" rx="1" fill="#F59E0B" />
              <rect x="39" y="30" width="2.5" height="14" rx="1" fill="#FB923C" />
              <rect x="43" y="28" width="2.5" height="17" rx="1" fill="#F59E0B" />
              <rect x="47" y="33" width="2.5" height="10" rx="1" fill="#FB923C" />
              <rect x="26" y="55" width="32" height="6" rx="1.5" fill="url(#rhMicCollar)" />
              <rect x="27" y="61" width="30" height="40" rx="8" fill="url(#rhMicBody)" />
              <circle cx="42" cy="75" r="2" fill="#9CA3AF" />
              <path
                d="M 9 72 C 18 82 65 82 75 62"
                fill="none"
                stroke="#047422"
                strokeWidth="7.5"
                strokeLinecap="round"
              />
              <path
                d="M 10 86 C 22 98 63 102 74 92"
                fill="none"
                stroke="#EF4444"
                strokeWidth="7.5"
                strokeLinecap="round"
              />
            </g>
          </svg>

          <div className="relative z-10">
            <div className="flex items-center gap-2">
              <Link
                to="/mobile/live"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#D91618] px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.08em] text-white shadow-sm"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-white live-dot" />
                <span>LIVE NOW</span>
              </Link>
            </div>

            <div className="max-w-[58%]">
              <p className="mt-3 text-[10.5px] font-extrabold uppercase tracking-[0.12em] text-[#047422]">
                {currentHero.eyebrow}
              </p>
              <h1 className="mt-0.5 text-[21px] font-extrabold leading-[1.12] tracking-[-0.025em] text-[#050505]">
                {currentHero.headline}
              </h1>
              {currentHero.subline && (
                <p className="mt-1 truncate text-[11px] font-semibold text-[#4B5563]">
                  {currentHero.subline}
                </p>
              )}
            </div>

            <div className="mt-3.5 flex items-center gap-2">
              <button
                type="button"
                onClick={handlePlayLive}
                className="inline-flex items-center gap-2 rounded-full border border-[#E7E9EC] bg-white px-4 py-2 text-[12px] font-extrabold text-[#050505] shadow-[0_6px_16px_-6px_rgba(5,5,5,0.22)] transition-transform active:scale-95"
              >
                {/* Mini equalizer bars matching screenshot */}
                <span className="flex items-end gap-[2px]" aria-hidden="true">
                  <span className="h-2 w-[2px] rounded-full bg-[#047422]" />
                  <span className="h-3.5 w-[2px] rounded-full bg-[#047422]" />
                  <span className="h-2.5 w-[2px] rounded-full bg-[#047422]" />
                  <span className="h-3 w-[2px] rounded-full bg-[#047422]" />
                </span>
                <span>{isPlayingLive ? "Playing Live" : "Listen Live"}</span>
                {isPlayingLive ? (
                  <Pause className="h-3 w-3 fill-[#047422] text-[#047422]" />
                ) : (
                  <Play className="h-3 w-3 fill-[#050505] text-[#050505]" />
                )}
              </button>
            </div>

            {/* Hero carousel dots */}
            <div className="mt-3.5 flex items-center gap-1.5">
              {heroSlides.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setHeroSlide(idx)}
                  aria-label={`Hero slide ${idx + 1}`}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    heroSlide === idx ? "w-5 bg-[#047422]" : "w-1.5 bg-[#CBD5E1]"
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stream-not-configured notice */}
      {!streamUrl && (
        <div className="px-4 pt-3">
          <IntegrationNotice
            title="Live stream not configured"
            detail="Add your Icecast or HLS endpoint in Admin → Streams to go live."
          />
        </div>
      )}

      {/* 2. Advertisement Banner Carousel (Linked to /admin/advertisements) */}
      {activeAd && (
        <div className="px-4 pt-3.5">
          <div
            className={cn(
              "relative overflow-hidden rounded-[20px] border border-[#E7E9EC] bg-gradient-to-r from-[#F9EDF6] via-[#FFFFFF] to-[#ECF7EF] py-3 shadow-[0_8px_22px_-16px_rgba(5,5,5,0.2)]",
              ads.length > 1 ? "px-9" : "px-4"
            )}
          >
            <span className="inline-block rounded-md bg-[#047422] px-2 py-0.5 text-[9.5px] font-bold text-white">
              Advertisement
            </span>

            {ads.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setAdIndex((i) => (i - 1 + ads.length) % ads.length)
                  }
                  aria-label="Previous advertisement"
                  className="absolute left-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-[#E7E9EC] bg-white/95 text-[#374151] shadow-xs hover:bg-white"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setAdIndex((i) => (i + 1) % ads.length)}
                  aria-label="Next advertisement"
                  className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-[#E7E9EC] bg-white/95 text-[#374151] shadow-xs hover:bg-white"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}

            {/^https?:\/\//i.test(String(activeAd.target_url || "").trim()) ? (
              <a
                href={String(activeAd.target_url).trim()}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackAdClick(activeAd)}
                className="mt-1.5 flex w-full items-center justify-between gap-3 text-left"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-extrabold tracking-tight text-[#7E1D76]">
                        {activeAd.name}
                      </p>
                      {activeAd.advertiser && (
                        <p className="truncate text-[11px] font-semibold text-[#1F2937]">
                          {activeAd.advertiser}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {activeAd.creative_url ? (
                  <div className="h-14 w-24 shrink-0 overflow-hidden rounded-xl border border-[#E7E9EC] bg-white">
                    <img
                      src={activeAd.creative_url}
                      alt={activeAd.name}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#E7F5EA] text-[#047422]">
                    <Megaphone className="h-5 w-5" />
                  </div>
                )}
              </a>
            ) : (
              <button
                type="button"
                onClick={() => handleInternalAdClick(activeAd)}
                className="mt-1.5 flex w-full items-center justify-between gap-3 text-left"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-extrabold tracking-tight text-[#7E1D76]">
                        {activeAd.name}
                      </p>
                      {activeAd.advertiser && (
                        <p className="truncate text-[11px] font-semibold text-[#1F2937]">
                          {activeAd.advertiser}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {activeAd.creative_url ? (
                  <div className="h-14 w-24 shrink-0 overflow-hidden rounded-xl border border-[#E7E9EC] bg-white">
                    <img
                      src={activeAd.creative_url}
                      alt={activeAd.name}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#E7F5EA] text-[#047422]">
                    <Megaphone className="h-5 w-5" />
                  </div>
                )}
              </button>
            )}

            {ads.length > 1 && (
              <div className="mt-2 flex items-center justify-center gap-1.5">
                {ads.map((ad, idx) => (
                  <button
                    key={ad.id}
                    type="button"
                    onClick={() => setAdIndex(idx)}
                    aria-label={`Advertisement ${idx + 1}`}
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      adIndex % ads.length === idx
                        ? "w-5 bg-[#047422]"
                        : "w-1.5 bg-[#CBD5E1]"
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Continue listening (shown when user has playback progress) */}
      <ContinueListening />

      {/* 3. Categories Grid (Linked to /admin/category) */}
      <div>
        <HomeSectionHeader title="Categories" seeAllTo="/mobile/programs" />
        <div className="grid grid-cols-5 gap-1.5 px-4">
          {categories.map((cat) => {
            const theme = getThemeWaveColors(cat.color_theme);
            return (
              <Link
                key={cat.id}
                to={`/mobile/programs?category=${encodeURIComponent(cat.slug)}`}
                className={cn(
                  "group relative flex h-[52px] flex-col items-center justify-between overflow-hidden rounded-lg border border-[#E7E9EC] bg-gradient-to-b px-1 pt-1.5 pb-1 text-center transition-transform active:scale-95",
                  theme.bg
                )}
              >
                {/* Pastel wave arc matching screenshot */}
                <svg
                  aria-hidden="true"
                  viewBox="0 0 120 42"
                  preserveAspectRatio="none"
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-5 w-full"
                >
                  <path
                    d="M0 18 Q 35 4, 65 18 T 120 14 L 120 42 L 0 42 Z"
                    fill={theme.waveBack}
                    fillOpacity="0.65"
                  />
                  <path
                    d="M0 24 Q 42 36, 76 20 T 120 24 L 120 42 L 0 42 Z"
                    fill={theme.waveFront}
                    fillOpacity="0.7"
                  />
                </svg>

                <div className="relative z-10 flex h-6 w-6 items-center justify-center transition-transform group-hover:scale-105">
                  <CategoryIconGraphic
                    iconName={cat.icon_name}
                    imageUrl={cat.image_url}
                    name={cat.name}
                    className="h-5 w-5"
                  />
                </div>
                <span className="relative z-10 w-full truncate text-[9.5px] font-bold leading-tight text-[#050505]">
                  {cat.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 4. Latest Episodes — 2-column grid cards */}
      <div>
        <HomeSectionHeader title="Latest Episodes" seeAllTo="/mobile/episodes" />
        {data?.latestEpisodes?.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 px-4">
            {data.latestEpisodes.slice(0, 4).map((ep: any) => {
              const isCurrent = track?.id === ep.id && playing;
              const minLabel = formatMinutesLabel(ep.duration_seconds);
              return (
                <div
                  key={ep.id}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-[#E7E9EC] bg-white shadow-[0_6px_18px_-14px_rgba(5,5,5,0.24)] transition-transform active:scale-[0.99]"
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#050505]">
                    <Link to={`/mobile/episodes/${ep.id}`} className="block h-full w-full">
                      {ep.cover_url ? (
                        <img
                          src={ep.cover_url}
                          alt={ep.title}
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-white/30">
                          <Radio className="h-6 w-6" />
                        </div>
                      )}
                    </Link>
                    <button
                      type="button"
                      onClick={() =>
                        play({
                          id: ep.id,
                          type: "EPISODE",
                          title: ep.title,
                          subtitle: ep.program_title || "Radio Hargeysa",
                          imageUrl: ep.cover_url,
                          src: ep.audio_url || "",
                          durationSeconds: ep.duration_seconds,
                          href: `/mobile/episodes/${ep.id}`,
                        })
                      }
                      aria-label={isCurrent ? "Pause episode" : "Play episode"}
                      className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#047422] text-white shadow-md ring-2 ring-white/80 transition-transform active:scale-95"
                    >
                      {isCurrent ? (
                        <Pause className="h-3.5 w-3.5 fill-current" />
                      ) : (
                        <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                      )}
                    </button>
                  </div>

                  <Link
                    to={`/mobile/episodes/${ep.id}`}
                    className="flex flex-1 flex-col justify-between p-2.5"
                  >
                    <p className="line-clamp-2 text-[12.5px] font-bold leading-snug text-[#050505]">
                      {ep.title}
                    </p>
                    <div className="mt-1.5 flex items-center justify-between gap-1 text-[10px] font-medium text-[#6B7280] tabular-nums">
                      <span className="inline-flex min-w-0 items-center gap-1 truncate">
                        <Clock className="h-3 w-3 shrink-0 text-[#9CA3AF]" />
                        <span className="truncate">
                          {minLabel || ep.program_title || "Episode"}
                        </span>
                      </span>
                      <span className="inline-flex shrink-0 items-center gap-0.5">
                        <Play className="h-2.5 w-2.5 text-[#9CA3AF]" />
                        {formatCompactCount(ep.play_count)}
                      </span>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-4">
            <div className="rounded-2xl border border-[#E7E9EC] bg-white px-4 py-5 text-center text-[12px] text-[#6B7280]">
              No episodes published yet.
            </div>
          </div>
        )}
      </div>

      {/* 5. Latest Videos — 2-column grid cards */}
      {data?.latestVideos?.length > 0 && (
        <div>
          <HomeSectionHeader title="Latest Videos" seeAllTo="/mobile/videos" />
          <div className="grid grid-cols-2 gap-3 px-4">
            {data.latestVideos.slice(0, 4).map((v: any) => {
              const minLabel = formatMinutesLabel(v.duration_seconds);
              return (
                <Link
                  key={v.id}
                  to={`/mobile/videos/${v.id}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-[#E7E9EC] bg-white shadow-[0_6px_18px_-14px_rgba(5,5,5,0.24)] transition-transform active:scale-[0.99]"
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#050505]">
                    {v.thumbnail_url ? (
                      <img
                        src={v.thumbnail_url}
                        alt={v.title}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-white/30">
                        <Play className="h-6 w-6" />
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#050505] shadow-md">
                        <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                      </span>
                    </div>
                    <span className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#047422] text-white shadow-md ring-2 ring-white/80">
                      <Play className="h-3 w-3 fill-current ml-0.5" />
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col justify-between p-2.5">
                    <p className="line-clamp-2 text-[12.5px] font-bold leading-snug text-[#050505]">
                      {v.title}
                    </p>
                    <div className="mt-1.5 flex items-center justify-between gap-1 text-[10px] font-medium text-[#6B7280] tabular-nums">
                      <span className="inline-flex min-w-0 items-center gap-1 truncate">
                        <Clock className="h-3 w-3 shrink-0 text-[#9CA3AF]" />
                        <span className="truncate">
                          {minLabel || v.program_title || titleCaseCategory(v.kind)}
                        </span>
                      </span>
                      <span className="inline-flex shrink-0 items-center gap-0.5">
                        <Play className="h-2.5 w-2.5 text-[#9CA3AF]" />
                        {formatCompactCount(v.view_count)}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. Latest News — 2-column grid cards */}
      {data?.latestNews?.length > 0 && (
        <div>
          <HomeSectionHeader title="Latest News" seeAllTo="/mobile/news" />
          <div className="grid grid-cols-2 gap-3 px-4">
            {data.latestNews.slice(0, 4).map((n: any) => (
              <Link
                key={n.id}
                to={`/mobile/news/${n.id}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-[#E7E9EC] bg-white shadow-[0_6px_18px_-14px_rgba(5,5,5,0.24)] transition-transform active:scale-[0.99]"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#050505]">
                  {n.image_url ? (
                    <img
                      src={n.image_url}
                      alt={n.title}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-white/30">
                      <Radio className="h-5 w-5" />
                    </div>
                  )}
                  {n.category && (
                    <span className="absolute left-2 top-2 rounded-md bg-[#047422]/90 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                      {titleCaseCategory(n.category)}
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col justify-between p-2.5">
                  <p className="line-clamp-2 text-[12.5px] font-bold leading-snug text-[#050505]">
                    {n.title}
                  </p>
                  <div className="mt-1.5 flex items-center justify-between gap-1 text-[10px] font-medium text-[#6B7280] tabular-nums">
                    <span className="inline-flex min-w-0 items-center gap-1 truncate">
                      <Clock className="h-3 w-3 shrink-0 text-[#9CA3AF]" />
                      <span className="truncate">
                        {formatDate(n.published_at || n.created_date)}
                      </span>
                    </span>
                    <span className="inline-flex shrink-0 items-center gap-0.5">
                      <Eye className="h-3 w-3 text-[#9CA3AF]" />
                      {formatCompactCount(n.view_count)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 7. Popular This Week & App Banner */}
      <div>
        <HomeSectionHeader title="Popular This Week" seeAllTo="/mobile/episodes" />
        <div className="space-y-3 px-4">
          {data?.popular?.length > 0 && (
            <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4">
              {data.popular.slice(0, 6).map((ep: any) => (
                <MediaCard
                  key={ep.id}
                  to={`/mobile/episodes/${ep.id}`}
                  title={ep.title}
                  meta={ep.program_title || "Radio Hargeysa"}
                  imageUrl={ep.cover_url}
                />
              ))}
            </div>
          )}

          {/* Radio Hargeysa App Banner Card */}
          <div className="relative flex items-center justify-between gap-3 overflow-hidden rounded-2xl border border-[#D4E7D8] bg-gradient-to-r from-[#F4FBF6] via-[#ECF7EF] to-[#DFF1E4] p-3 shadow-[0_8px_22px_-16px_rgba(4,116,34,0.28)]">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white p-1 shadow-xs ring-1 ring-[#E7E9EC]">
                <BrandLogo size={38} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[13.5px] font-extrabold text-[#050505]">
                  Radio Hargeysa App
                </p>
                <p className="truncate text-[10.5px] font-medium text-[#4B5563]">
                  Listen live, anytime, anywhere
                </p>
              </div>
            </div>
            <Link
              to="/mobile/library/downloads"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#047422] px-3 py-2 text-[11.5px] font-bold text-white shadow-sm transition-colors hover:bg-[#035A1B] whitespace-nowrap"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download App</span>
            </Link>
          </div>
        </div>
      </div>

      <p className="mt-6 text-center text-[10.5px] text-[#9CA3AF]">
        Radio Hargeysa · Codka Jamhuuriyadda Somaliland
      </p>
    </div>
  );
}

export function MobileLivePage() {
  const [data, setData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const { prefs } = usePreferences();
  const { track, playing, loading, error, volume, setVolume, play, toggle } =
    usePlayer();

  useEffect(() => {
    apiFetch("/api/content/live")
      .then(setData)
      .catch(() => {});
  }, []);

  const streamUrl = data?.audioStream?.primary_url || "";
  const isLiveTrack = track?.type === "LIVE";
  const isPlayingLive = isLiveTrack && playing;

  const liveTitle =
    data?.broadcast?.program_title ||
    data?.currentProgram?.program_title ||
    "Radio Hargeysa Live";
  const livePresenter =
    data?.broadcast?.presenter_name ||
    data?.currentProgram?.presenter_name ||
    "Studio 1 Desk";

  const curMin = data?.now?.minutesSinceMidnight ?? 0;
  const todaySchedule = data?.todaySchedule || [];
  const upcoming = todaySchedule.filter(
    (s: any) => hhmmToMinutes(s.start_time) > curMin
  );
  const earlier = todaySchedule
    .filter((s: any) => hhmmToMinutes(s.end_time) <= curMin)
    .reverse();

  const handleShare = async () => {
    const shareUrl = window.location.href;
    trackAnalyticsEvent({ event_type: "SHARE", item_type: "LIVE", item_id: "live" });
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${liveTitle} — Radio Hargeysa`,
          url: shareUrl,
        });
        return;
      } catch {
        // fallback to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Could not copy link");
    }
  };

  return (
    <div className="pb-6">
      {/* Dark red-to-black studio hero */}
      <div className="bg-gradient-to-b from-[#6B0608] via-[#1C0304] to-[#050505] px-5 pt-5 pb-7 text-white">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#C40D0F] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-white">
            <span className="h-1.5 w-1.5 rounded-full bg-white live-dot" />
            LIVE
          </span>
          <button
            type="button"
            onClick={handleShare}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            aria-label="Share live stream"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
        {copied && (
          <p className="mt-2 text-right text-[11px] font-semibold text-[#4ADE80]">
            Link copied
          </p>
        )}

        {/* Segmented equalizer bar */}
        <div className="my-7 flex items-center gap-1.5">
          {Array.from({ length: 14 }).map((_, idx) => (
            <div
              key={idx}
              className={cn(
                "h-2 flex-1 rounded-full transition-opacity",
                isPlayingLive
                  ? "bg-[#047422] opacity-100"
                  : "bg-[#047422]/85"
              )}
            />
          ))}
        </div>

        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#4ADE80]">
          RADIO HARGEYSA
        </p>
        <h1 className="mt-1 text-[24px] font-extrabold tracking-tight text-white">
          {liveTitle}
        </h1>
        <p className="mt-0.5 text-[13px] text-white/60">{livePresenter}</p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/[0.06] px-4 py-3">
            <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-white/45">
              LISTENERS
            </p>
            <p className="mt-1 text-[15px] font-extrabold text-white tabular-nums">
              {data?.broadcast?.listener_count || "—"}
            </p>
          </div>
          <div className="rounded-2xl bg-white/[0.06] px-4 py-3">
            <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-white/45">
              STREAM
            </p>
            <p className="mt-1 text-[15px] font-extrabold text-white">
              {streamUrl || data?.broadcast ? "On air" : "Not configured"}
            </p>
          </div>
        </div>

        {/* Big 72px play/pause + volume */}
        <div className="mt-6 flex items-center gap-4">
          <button
            type="button"
            onClick={() => {
              if (isLiveTrack) toggle();
              else
                play({
                  id: "live_radio_hargeysa",
                  type: "LIVE",
                  title: liveTitle,
                  subtitle: livePresenter,
                  imageUrl: "/media/radio-studio.jpg",
                  src: streamUrl,
                  href: "/mobile/live",
                });
            }}
            aria-label={isPlayingLive ? "Pause live radio" : "Play live radio"}
            className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full bg-white text-[#050505] shadow-lg transition-transform active:scale-95"
          >
            {loading && isLiveTrack ? (
              <Loader2 className="h-7 w-7 animate-spin text-[#047422]" />
            ) : isPlayingLive ? (
              <Pause className="h-7 w-7 fill-current" />
            ) : (
              <Play className="h-7 w-7 fill-current ml-1" />
            )}
          </button>

          <div className="flex-1">
            <div className="flex items-center gap-2.5">
              <Volume2 className="h-4 w-4 text-white/60" />
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full accent-[#047422]"
              />
            </div>
            <p className="mt-1.5 text-[11px] text-white/50">
              Quality: {prefs.audio_quality === "AUTO" ? "Auto" : `${prefs.audio_quality}k`}
            </p>
            {error && isLiveTrack && (
              <button
                type="button"
                onClick={() =>
                  play({
                    id: "live_radio_hargeysa",
                    type: "LIVE",
                    title: liveTitle,
                    subtitle: livePresenter,
                    imageUrl: "/media/radio-studio.jpg",
                    src: streamUrl,
                    href: "/mobile/live",
                  })
                }
                className="mt-1 text-[11px] font-bold text-[#FF8A8A] underline"
              >
                {error} Retry
              </button>
            )}
          </div>
        </div>
      </div>

      {!streamUrl && (
        <div className="px-4 pt-4">
          <IntegrationNotice
            title="Live stream not configured"
            detail="Add your Icecast or HLS endpoint in Admin → Streams to go live."
          />
        </div>
      )}

      {/* Next on air */}
      <div className="px-4 pt-6">
        <h2 className="text-[15px] font-extrabold tracking-tight text-[#050505]">
          Next on air
        </h2>
        <div className="mt-3 space-y-2.5">
          {upcoming.length > 0 ? (
            upcoming.map((s: any) => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-[#E7E9EC] bg-white p-3.5"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-16 shrink-0 tabular-nums">
                    <p className="text-[12px] font-extrabold text-[#047422]">
                      {formatTime(s.start_time)}
                    </p>
                    <p className="text-[10.5px] text-[#9CA3AF]">
                      {formatTime(s.end_time)}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-bold text-[#050505]">
                      {s.program_title}
                    </p>
                    <p className="truncate text-[11px] text-[#6B7280]">
                      {s.presenter_name}
                    </p>
                  </div>
                </div>
                <StatusBadge status={s.status || "SCHEDULED"} />
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-[#E7E9EC] bg-white p-4 text-[12.5px] text-[#6B7280]">
              No more scheduled shows today.
            </div>
          )}
        </div>
      </div>

      {/* Earlier today */}
      {earlier.length > 0 && (
        <div className="px-4 pt-6">
          <h2 className="text-[15px] font-extrabold tracking-tight text-[#050505]">
            Earlier today
          </h2>
          <div className="mt-3 space-y-2">
            {earlier.map((s: any) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-2xl border border-[#E7E9EC] bg-white px-4 py-3"
              >
                <p className="text-[12.5px] font-bold text-[#050505]">
                  {s.program_title}
                </p>
                <span className="text-[11px] font-medium text-[#6B7280] tabular-nums">
                  {formatTime(s.start_time)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="px-4 pt-5">
        <Link
          to="/mobile/schedule"
          className="flex w-full items-center justify-center rounded-full bg-[#050505] py-3 text-[12.5px] font-bold text-white hover:bg-[#1F2937]"
        >
          Full weekly schedule
        </Link>
      </div>
    </div>
  );
}

export function MobileProgramsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCat = (searchParams.get("category") || "ALL").toUpperCase();
  const [programs, setPrograms] = useState<any[]>([]);
  const [categories, setCategories] = useState<Array<{ slug: string; name: string }>>(
    PROGRAM_CATEGORIES.map((c) => ({ slug: c, name: titleCaseCategory(c) }))
  );
  const [category, setCategory] = useState(initialCat);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const paramCat = (searchParams.get("category") || "ALL").toUpperCase();
    setCategory(paramCat);
  }, [searchParams]);

  useEffect(() => {
    apiFetch<any[]>("/api/content/categories")
      .then((list) => {
        if (Array.isArray(list) && list.length > 0) {
          setCategories(list.map((c) => ({ slug: c.slug, name: c.name })));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    apiFetch(`/api/content/programs?category=${category}`)
      .then(setPrograms)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [category]);

  const selectCategory = (slug: string) => {
    setCategory(slug);
    if (slug === "ALL") {
      setSearchParams({});
    } else {
      setSearchParams({ category: slug });
    }
  };

  return (
    <div className="px-4 pt-5 pb-6">
      <h1 className="text-[22px] font-extrabold tracking-[-0.02em] text-[#050505]">
        Programs
      </h1>
      <p className="mt-0.5 text-[12.5px] text-[#6B7280]">
        Every show on Radio Hargeysa, by category.
      </p>

      {/* Category chips */}
      <div className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {[{ slug: "ALL", name: "All" }, ...categories].map((cat) => {
          const active = category === cat.slug;
          return (
            <button
              key={cat.slug}
              type="button"
              onClick={() => selectCategory(cat.slug)}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-[11.5px] font-bold transition-colors",
                active
                  ? "border-[#047422] bg-[#047422] text-white"
                  : "border-[#E7E9EC] bg-white text-[#4B5563] hover:bg-[#F5F6F7]"
              )}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="mt-4 space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-[#E7E9EC]" />
          ))}
        </div>
      ) : programs.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={Radio}
            title="No programs in this category"
            description="Try selecting All or another category."
          />
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {programs.map((p) => (
            <div
              key={p.id}
              className="rounded-2xl border border-[#E7E9EC] bg-white p-3.5"
            >
              <Link to={`/mobile/programs/${p.id}`} className="flex gap-3.5">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[#050505]">
                  <img
                    src={p.cover_url || "/media/radio-studio.jpg"}
                    alt={p.title}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[#F5F6F7] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#6B7280]">
                      {p.category}
                    </span>
                    <span className="rounded-full bg-[#E7F5EA] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#047422]">
                      ACTIVE
                    </span>
                  </div>
                  <h2 className="mt-1.5 text-[14px] font-extrabold text-[#050505]">
                    {p.title}
                  </h2>
                  <p className="text-[11.5px] font-medium text-[#6B7280]">
                    {(p.presenter_names || []).join(", ")}
                  </p>
                  <p className="text-[10.5px] text-[#9CA3AF]">
                    {p.schedule_text}
                  </p>
                </div>
              </Link>
              <div className="mt-3 flex items-center justify-between border-t border-[#F0F1F3] pt-2.5">
                <span className="text-[11px] font-medium text-[#6B7280] tabular-nums">
                  {p.follower_count || 0} followers
                </span>
                <FollowButton
                  targetType="PROGRAM"
                  targetId={p.id}
                  title={p.title}
                  subtitle={p.presenter_names?.[0]}
                  imageUrl={p.cover_url}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function MobileProgramDetailPage() {
  const { programId } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiFetch(`/api/content/programs/${programId}`)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [programId]);

  if (loading) {
    return (
      <div className="p-4">
        <div className="h-56 animate-pulse rounded-3xl bg-[#E7E9EC]" />
      </div>
    );
  }
  if (!data?.program) {
    return (
      <div className="p-4">
        <EmptyState icon={Radio} title="Program not found" />
      </div>
    );
  }

  const { program, episodes, schedule, presenters } = data;

  return (
    <div className="pb-6">
      <div className="relative h-56 w-full overflow-hidden bg-[#050505]">
        <img
          src={program.cover_url || "/media/radio-studio.jpg"}
          alt={program.title}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5 text-white">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#047422] px-2.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider">
              {program.category}
            </span>
            <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[9.5px] font-bold uppercase">
              {(program.language || "so").toUpperCase()}
            </span>
          </div>
          <h1 className="mt-2 text-[22px] font-extrabold tracking-tight">
            {program.title}
          </h1>
        </div>
      </div>

      <div className="space-y-5 px-4 pt-4">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-semibold text-[#6B7280] tabular-nums">
            {program.follower_count || 0} followers
          </span>
          <div className="flex items-center gap-2">
            <FavoriteButton
              itemType="PROGRAM"
              itemId={program.id}
              title={program.title}
              subtitle={program.schedule_text}
              imageUrl={program.cover_url}
              href={`/mobile/programs/${program.id}`}
            />
            <FollowButton
              targetType="PROGRAM"
              targetId={program.id}
              title={program.title}
              subtitle={program.presenter_names?.[0]}
              imageUrl={program.cover_url}
            />
          </div>
        </div>

        <p className="text-[13px] leading-relaxed text-[#1F2937]">
          {program.description}
        </p>

        {presenters?.length > 0 && (
          <div>
            <h2 className="text-[14px] font-bold text-[#050505]">Presenters</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {presenters.map((prs: any) => (
                <Link
                  key={prs.id}
                  to={`/mobile/presenters/${prs.id}`}
                  className="inline-flex items-center gap-2 rounded-full border border-[#E7E9EC] bg-white px-3 py-1.5 text-[12px] font-bold text-[#050505]"
                >
                  <Users className="h-3.5 w-3.5 text-[#047422]" />
                  <span>{prs.full_name}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-[14px] font-bold text-[#050505]">On air</h2>
          <div className="mt-2 rounded-2xl border border-[#E7E9EC] bg-white p-3.5 text-[12.5px] text-[#1F2937]">
            <div className="flex items-center gap-2 font-bold text-[#047422]">
              <Calendar className="h-4 w-4" />
              <span>{program.schedule_text || "Daily broadcast"}</span>
            </div>
            {schedule?.length > 0 && (
              <p className="mt-1 text-[11.5px] text-[#6B7280]">
                {schedule[0].studio || "Studio 1"} ·{" "}
                {formatTimeRange(schedule[0].start_time, schedule[0].end_time)}
              </p>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-[14px] font-bold text-[#050505]">Episodes</h2>
          <div className="mt-2 space-y-2.5">
            {episodes?.length > 0 ? (
              episodes.map((ep: any) => <EpisodeRow key={ep.id} episode={ep} />)
            ) : (
              <EmptyState
                icon={Radio}
                title="No episodes published yet"
                description="Check back after the next broadcast."
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function MobileEpisodesPage() {
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      apiFetch(`/api/content/episodes?q=${encodeURIComponent(q)}`)
        .then(setEpisodes)
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="px-4 pt-5 pb-6">
      <h1 className="text-[22px] font-extrabold tracking-[-0.02em] text-[#050505]">
        Episodes
      </h1>
      <div className="relative mt-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search episodes"
          className="w-full rounded-xl border border-[#E7E9EC] bg-white py-2.5 pl-9 pr-3 text-[12.5px] focus:border-[#047422] focus:outline-none"
        />
      </div>

      <div className="mt-4 space-y-2.5">
        {loading ? (
          [0, 1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-[#E7E9EC]" />
          ))
        ) : episodes.length === 0 ? (
          <EmptyState
            icon={Radio}
            title="No episodes yet"
            description="Published episodes from Studio 1 will appear here."
          />
        ) : (
          episodes.map((ep) => <EpisodeRow key={ep.id} episode={ep} />)
        )}
      </div>
    </div>
  );
}

export function MobileEpisodeDetailPage() {
  const { episodeId } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showTranscript, setShowTranscript] = useState(false);
  const { track, playing, play, currentTime, duration, seek } = usePlayer();
  const { saveDownload } = useLibrary();

  useEffect(() => {
    setLoading(true);
    apiFetch(`/api/content/episodes/${episodeId}`)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [episodeId]);

  if (loading) {
    return (
      <div className="p-4">
        <div className="h-64 animate-pulse rounded-3xl bg-[#E7E9EC]" />
      </div>
    );
  }
  if (!data?.episode) {
    return (
      <div className="p-4">
        <EmptyState icon={Radio} title="Episode not found" />
      </div>
    );
  }

  const { episode, related } = data;
  const isCurrent = track?.id === episode.id;
  const totalSec = duration || episode.duration_seconds || 0;
  const pct = totalSec > 0 && isCurrent ? Math.min(100, (currentTime / totalSec) * 100) : 0;

  return (
    <div className="space-y-5 px-4 pt-5 pb-6">
      <div className="mx-auto h-[220px] w-[220px] overflow-hidden rounded-3xl bg-[#050505] shadow-md">
        <img
          src={episode.cover_url || "/media/radio-studio.jpg"}
          alt={episode.title}
          className="h-full w-full object-cover"
        />
      </div>

      <div className="text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#047422]">
          {episode.program_title || "Radio Hargeysa"}
        </p>
        <h1 className="mt-1 text-[20px] font-extrabold tracking-[-0.015em] text-[#050505]">
          {episode.title}
        </h1>
        <p className="mt-1 text-[11.5px] text-[#6B7280]">
          {[
            (episode.presenter_names || []).join(", "),
            formatDate(episode.published_at || episode.created_date),
            episode.duration_seconds ? formatDuration(episode.duration_seconds) : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>

      {episode.audio_url ? (
        <div className="rounded-2xl border border-[#E7E9EC] bg-white p-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                play({
                  id: episode.id,
                  type: "EPISODE",
                  title: episode.title,
                  subtitle: episode.program_title,
                  imageUrl: episode.cover_url,
                  src: episode.audio_url,
                  durationSeconds: episode.duration_seconds,
                  href: `/mobile/episodes/${episode.id}`,
                })
              }
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#047422] py-2.5 text-[13px] font-bold text-white hover:bg-[#035A1B]"
            >
              {isCurrent && playing ? (
                <>
                  <Pause className="h-4 w-4 fill-current" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-current" />
                  <span>Play episode</span>
                </>
              )}
            </button>
            {episode.download_allowed && (
              <button
                type="button"
                onClick={() =>
                  saveDownload({
                    item_type: "EPISODE",
                    item_id: episode.id,
                    title: episode.title,
                    subtitle: episode.program_title,
                    image_url: episode.cover_url,
                    file_uri: episode.audio_url,
                  })
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E7E9EC] text-[#050505] hover:bg-[#F5F6F7]"
                aria-label="Save download"
              >
                <Download className="h-4 w-4" />
              </button>
            )}
            <FavoriteButton
              itemType="EPISODE"
              itemId={episode.id}
              title={episode.title}
              subtitle={episode.program_title}
              imageUrl={episode.cover_url}
              href={`/mobile/episodes/${episode.id}`}
            />
          </div>

          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#F0F1F3]">
            <div
              className="h-full bg-[#047422] transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      ) : (
        <EmptyState icon={Radio} title="Audio not available" />
      )}

      {(episode.summary || episode.description) && (
        <div className="rounded-2xl border border-[#E7E9EC] bg-white p-4">
          <h2 className="text-[13px] font-bold text-[#050505]">Summary</h2>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#1F2937]">
            {episode.summary || episode.description}
          </p>
        </div>
      )}

      {episode.chapters?.length > 0 && (
        <div className="rounded-2xl border border-[#E7E9EC] bg-white p-4">
          <h2 className="text-[13px] font-bold text-[#050505]">Chapters</h2>
          <div className="mt-2 divide-y divide-[#F0F1F3]">
            {episode.chapters.map((c: any, idx: number) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  const parts = String(c.time || "0:00").split(":").map(Number);
                  const sec =
                    parts.length === 2 ? parts[0] * 60 + parts[1] : 0;
                  seek(sec);
                }}
                className="flex w-full items-center gap-3 py-2 text-left text-[12.5px] hover:text-[#047422]"
              >
                <span className="font-mono text-[11px] font-bold text-[#047422]">
                  {c.time}
                </span>
                <span className="font-semibold text-[#1F2937]">{c.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {episode.transcript && (
        <div className="rounded-2xl border border-[#E7E9EC] bg-white p-4">
          <button
            type="button"
            onClick={() => setShowTranscript((v) => !v)}
            className="flex w-full items-center justify-between text-[13px] font-bold text-[#050505]"
          >
            <span>Transcript</span>
            {showTranscript ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {showTranscript && (
            <div className="rh-scroll mt-3 max-h-60 overflow-y-auto whitespace-pre-wrap text-[12.5px] leading-relaxed text-[#4B5563]">
              {episode.transcript}
            </div>
          )}
        </div>
      )}

      {related?.length > 0 && (
        <div>
          <h2 className="mb-2.5 text-[14px] font-bold text-[#050505]">
            Related episodes
          </h2>
          <div className="space-y-2">
            {related.map((ep: any) => (
              <EpisodeRow key={ep.id} episode={ep} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
