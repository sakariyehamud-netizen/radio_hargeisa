import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Play,
  Pause,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Headphones,
  Radio,
  LayoutGrid,
  Podcast,
  FolderOpen,
  CheckCircle2,
  Mic,
  Newspaper,
  GraduationCap,
  Music,
  Users,
  Sparkles,
  Video,
  Home,
  ShieldCheck,
  BarChart3,
  Globe,
  Tv,
  Share2,
  Send,
  Megaphone,
} from "lucide-react";
import { toast } from "sonner";
import { BrandLogo } from "../components/shared/Brand";
import { apiFetch } from "../lib/api";
import { formatTimeRange, formatDate } from "../lib/format";
import { cn } from "../lib/utils";

export function LandingPage() {
  const [homeData, setHomeData] = useState<any>(null);
  const [quality, setQuality] = useState<"64k" | "48k" | "128k">("48k");
  const [isPlayingLive, setIsPlayingLive] = useState(false);
  const [adIndex, setAdIndex] = useState(0);
  const [adPaused, setAdPaused] = useState(false);
  const [brokenAds, setBrokenAds] = useState<Record<string, boolean>>({});
  const trackedImpressions = useRef<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isOnboarded] = useState<boolean>(() => {
    try {
      return localStorage.getItem("rh_onboarding_v2") === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    apiFetch("/api/content/home")
      .then(setHomeData)
      .catch(() => {});
  }, []);

  const scrollToSection = (id: string) => {
    if (id === "top") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (hash) {
      const t = window.setTimeout(() => {
        scrollToSection(hash);
        window.history.replaceState(null, "", window.location.pathname);
      }, 80);
      return () => window.clearTimeout(t);
    }
  }, []);

  const ads: any[] = React.useMemo(() => {
    const raw =
      homeData?.landingAds?.length > 0
        ? homeData.landingAds
        : homeData?.advertisements || [];
    if (Array.isArray(raw) && raw.length > 0) return raw;
    return [
      {
        id: "rh_sponsor_default",
        isFallback: true,
        name: "Sponsor & Partner Campaigns on Radio Hargeysa",
        advertiser: "Reach listeners across Somaliland and the global diaspora on air, web, and mobile.",
        creative_url: "/media/hargeisa-sunset.jpg",
        target_url: "/mobile/programs",
        cta_label: "Explore Programs",
      },
    ];
  }, [homeData]);

  const safeAdIndex = ads.length > 0 ? adIndex % ads.length : 0;
  const activeAd = ads[safeAdIndex];

  useEffect(() => {
    if (ads.length <= 1 || adPaused) return;
    const timer = window.setInterval(() => {
      setAdIndex((i) => (i + 1) % ads.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [ads.length, adPaused]);

  useEffect(() => {
    if (!activeAd || activeAd.isFallback || !activeAd.id) return;
    if (trackedImpressions.current.has(activeAd.id)) return;
    trackedImpressions.current.add(activeAd.id);
    apiFetch(`/api/content/ads/${activeAd.id}/impression`, { method: "POST" }).catch(
      () => {}
    );
  }, [activeAd]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, []);

  const streamUrl =
    homeData?.audioStream?.primary_url ||
    homeData?.audioStream?.backup_url ||
    "";

  const onAirTitle =
    homeData?.broadcast?.program_title ||
    homeData?.currentProgram?.program_title ||
    "Morning news, culture & conversation";
  const onAirPresenter =
    homeData?.broadcast?.presenter_name ||
    homeData?.currentProgram?.presenter_name ||
    "With the Radio Hargeysa morning team";
  const onAirTime = homeData?.currentProgram
    ? formatTimeRange(
        homeData.currentProgram.start_time,
        homeData.currentProgram.end_time
      )
    : "07:00 – 09:00";

  const handleToggleLiveAudio = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!streamUrl) {
      toast.info("Live audio stream endpoint is not configured yet. Open Live Studio view to check stream status.");
      return;
    }
    if (isPlayingLive) {
      audio.pause();
      setIsPlayingLive(false);
      return;
    }
    try {
      if (audio.src !== streamUrl) {
        audio.src = streamUrl;
      }
      await audio.play();
      setIsPlayingLive(true);
    } catch {
      setIsPlayingLive(false);
      toast.error("Unable to start live stream playback in this browser.");
    }
  };

  const handleQualityChange = (q: "64k" | "48k" | "128k") => {
    setQuality(q);
    toast.success(`Stream quality preference set to ${q}`);
  };

  const handleTrackAdClick = (ad: any) => {
    if (!ad?.isFallback && ad?.id) {
      apiFetch(`/api/content/ads/${ad.id}/click`, { method: "POST" }).catch(() => {});
    }
  };

  const waveHeights = [26, 46, 38, 64, 52, 86, 62, 92, 54, 72, 42, 68, 34, 58];

  const stats = [
    { icon: Radio, value: "1942", label: "ON AIR SINCE" },
    {
      icon: LayoutGrid,
      value: String(homeData?.programs?.length || 8),
      label: "DAILY PROGRAMS",
    },
    { icon: Podcast, value: "24/7", label: "LIVE STREAM" },
    {
      icon: FolderOpen,
      value: String(homeData?.categories?.length || 11),
      label: "CONTENT CATEGORIES",
    },
  ];

  const services = [
    {
      title: "Live Radio Broadcast",
      summary: "24/7 national FM and digital audio transmission across Somaliland.",
      icon: Radio,
      to: "/mobile/live",
    },
    {
      title: "Podcasts & On-Demand",
      summary: "Catch up on recorded episodes and series anytime on any device.",
      icon: Headphones,
      to: "/mobile/episodes",
    },
    {
      title: "News & Current Affairs",
      summary: "Verified reporting, regional bulletins, and national dispatches.",
      icon: Newspaper,
      to: "/mobile/news",
    },
    {
      title: "Education Programs",
      summary: "Civic literacy, youth learning, and public knowledge broadcasts.",
      icon: GraduationCap,
      to: "/mobile/programs?category=EDUCATION",
    },
    {
      title: "Culture & Entertainment",
      summary: "Somali poetry, heritage, music archives, and cultural discussions.",
      icon: Music,
      to: "/mobile/programs?category=CULTURE",
    },
    {
      title: "Community Platform",
      summary: "Connecting citizens in Hargeisa, the regions, and the diaspora.",
      icon: Users,
      to: "/mobile/presenters",
    },
    {
      title: "Special Coverage",
      summary: "Daily broadcast timetable, national ceremonies, and live events.",
      icon: Sparkles,
      to: "/mobile/schedule",
    },
    {
      title: "Multimedia Content",
      summary: "Studio video sessions, interviews, and visual highlights.",
      icon: Video,
      to: "/mobile/videos",
    },
  ];

  const fallbackNews = [
    {
      id: "news_1",
      title: "Hargeisa trade fair opens with record exhibitor numbers",
      category: "BUSINESS",
      image_url: "/media/hargeisa-sunset.jpg",
      published_at: "2026-11-14T09:00:00Z",
    },
    {
      id: "news_2",
      title: "National football team names squad for regional cup",
      category: "SPORTS",
      image_url: "/media/stadium.jpg",
      published_at: "2026-11-12T14:00:00Z",
    },
    {
      id: "news_3",
      title: "Radio Hargeysa celebrates decades of national heritage",
      category: "CULTURE",
      image_url: "/media/oud-culture.jpg",
      published_at: "2026-11-10T10:00:00Z",
    },
    {
      id: "news_4",
      title: "Education ministries expand community radio classroom hours",
      category: "EDUCATION",
      image_url: "/media/classroom.jpg",
      published_at: "2026-11-08T08:00:00Z",
    },
  ];

  const liveNews: any[] = homeData?.latestNews || [];
  const displayNews = liveNews.length > 0 ? liveNews.slice(0, 4) : fallbackNews;

  const isExternalTarget = (url?: string) =>
    Boolean(url && /^https?:\/\//i.test(url.trim()));

  return (
    <div id="top" className="min-h-screen bg-[#F5F7F6] text-[#050505]">
      <audio
        ref={audioRef}
        preload="none"
        onEnded={() => setIsPlayingLive(false)}
        onError={() => {
          if (isPlayingLive) {
            setIsPlayingLive(false);
            toast.error("Live audio stream interrupted.");
          }
        }}
      />

      {/* Sticky Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-[#E7E9EC] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-8">
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <BrandLogo size={42} />
            <div>
              <p className="text-[15px] font-extrabold leading-tight text-[#050505] whitespace-nowrap">
                Radio Hargeysa
              </p>
              <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-[#6B7280] whitespace-nowrap">
                CODKA JAMHUURIYADDA SOMALILAND
              </p>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-5 text-[12.5px] font-semibold text-[#374151]">
            <button
              type="button"
              onClick={() => scrollToSection("top")}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#047422] px-4 py-1.5 text-[12px] font-bold text-white whitespace-nowrap shrink-0"
            >
              <Home className="h-3.5 w-3.5" />
              <span>Home</span>
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("advertising")}
              className="hover:text-[#047422] transition-colors whitespace-nowrap shrink-0"
            >
              Featured
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("about")}
              className="hover:text-[#047422] transition-colors whitespace-nowrap shrink-0"
            >
              About
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("services")}
              className="hover:text-[#047422] transition-colors whitespace-nowrap shrink-0"
            >
              Our Services
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("studio")}
              className="hover:text-[#047422] transition-colors whitespace-nowrap shrink-0"
            >
              Our Studio
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("news")}
              className="hover:text-[#047422] transition-colors whitespace-nowrap shrink-0"
            >
              News
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("footer")}
              className="hover:text-[#047422] transition-colors whitespace-nowrap shrink-0"
            >
              Contact
            </button>
          </nav>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              to="/mobile/live"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-[#F3D2D2] bg-white px-3.5 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.06em] text-[#C40D0F] whitespace-nowrap"
            >
              <span className="h-2 w-2 rounded-full bg-[#C40D0F] live-dot" />
              <span>ON AIR</span>
            </Link>
            <Link
              to="/mobile/live"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#047422] px-4 py-2 text-[12px] font-bold text-white transition-colors hover:bg-[#035A1B] whitespace-nowrap"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Listen Live</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#F8FBF9] via-[#FFFFFF] to-[#EEF5F0] pt-10 pb-16 sm:pt-12 sm:pb-20">
        <svg
          aria-hidden="true"
          viewBox="0 0 1440 520"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 h-full w-full"
        >
          <defs>
            <linearGradient id="landRibbonGreen" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="#047422" />
              <stop offset="100%" stopColor="#0B8F30" />
            </linearGradient>
            <linearGradient id="landRibbonRed" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="#B80B0D" />
              <stop offset="100%" stopColor="#DC1C1E" />
            </linearGradient>
          </defs>
          <circle
            cx="710"
            cy="240"
            r="160"
            fill="none"
            stroke="#047422"
            strokeOpacity="0.06"
            strokeWidth="22"
          />
          <circle
            cx="710"
            cy="240"
            r="230"
            fill="none"
            stroke="#047422"
            strokeOpacity="0.045"
            strokeWidth="22"
          />
          <circle
            cx="710"
            cy="240"
            r="300"
            fill="none"
            stroke="#047422"
            strokeOpacity="0.03"
            strokeWidth="22"
          />
          <path
            d="M 520 520 C 980 480 1240 310 1450 25 L 1450 95 C 1255 340 990 490 610 520 Z"
            fill="url(#landRibbonGreen)"
          />
          <path
            d="M 640 520 C 1030 495 1270 375 1450 215 L 1450 278 C 1270 415 1030 508 740 520 Z"
            fill="url(#landRibbonRed)"
          />
        </svg>

        <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 sm:px-8 lg:grid-cols-12">
          {/* Left Hero Column */}
          <div className="lg:col-span-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#047422] to-[#C40D0F] px-3.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-white shadow-xs">
              NATIONAL BROADCASTER · SOMALILAND
            </span>

            <h1 className="mt-4 text-[46px] font-extrabold leading-[0.94] tracking-[-0.035em] sm:text-[64px]">
              <span className="block text-[#047422]">Radio</span>
              <span className="block text-[#C40D0F]">Hargeysa</span>
            </h1>

            <p className="mt-3 font-display italic text-[22px] sm:text-[26px] text-[#050505]">
              Codka Jamhuuriyadda Somaliland
            </p>

            <p className="mt-3 max-w-lg text-[14px] leading-relaxed text-[#374151]">
              One platform for live radio, video, podcasts, news and the people
              who make them — built for Somaliland&apos;s networks and the
              diaspora beyond.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                to={isOnboarded ? "/mobile/auth" : "/mobile/splash"}
                className="inline-flex items-center gap-2 rounded-full bg-[#047422] px-6 py-3 text-[13px] font-extrabold text-white shadow-[0_10px_24px_-10px_rgba(4,116,34,0.65)] transition-colors hover:bg-[#035A1B]"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Open Mobile App</span>
              </Link>
              <Link
                to="/mobile/live"
                className="inline-flex items-center gap-2 rounded-full border border-[#050505] bg-white px-6 py-3 text-[13px] font-extrabold text-[#050505] transition-colors hover:bg-[#F5F6F7]"
              >
                <Headphones className="h-4 w-4" />
                <span>Listen Live</span>
              </Link>
            </div>

            {/* 4 Metrics Strip */}
            <div className="mt-9 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {stats.map((st, idx) => {
                const Icon = st.icon;
                return (
                  <div
                    key={st.label}
                    className={cn(
                      "pr-3",
                      idx > 0 && "sm:border-l sm:border-[#D9E2DC] sm:pl-4"
                    )}
                  >
                    <Icon className="h-4 w-4 text-[#047422]" />
                    <p className="mt-1.5 text-[20px] font-extrabold tracking-tight text-[#050505] tabular-nums">
                      {st.value}
                    </p>
                    <p className="text-[9.5px] font-bold uppercase tracking-[0.1em] text-[#4B5563]">
                      {st.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Hero Column: Live Now Card + Retro Radio Illustration */}
          <div className="relative lg:col-span-6 flex items-center justify-center lg:justify-start">
            <div className="relative z-10 w-full max-w-[440px] rounded-[28px] border border-[#E7E9EC] bg-white/85 p-3 shadow-[0_24px_60px_-24px_rgba(5,5,5,0.28)] backdrop-blur-md">
              <div className="rounded-[20px] bg-gradient-to-b from-[#17191C] to-[#0B0C0E] p-5 text-white">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#047422] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-white">
                    <span className="h-1.5 w-1.5 rounded-full bg-white live-dot" />
                    LIVE NOW
                  </span>
                  <span className="text-[11.5px] font-semibold text-white/80 tabular-nums">
                    {onAirTime}
                  </span>
                </div>

                {/* Red rounded glowing waveform bars */}
                <div className="my-6 flex h-14 items-center justify-center gap-1.5">
                  {waveHeights.map((h, i) => (
                    <div
                      key={i}
                      style={{ height: `${h}%` }}
                      className={cn(
                        "w-2.5 rounded-full bg-gradient-to-t from-[#B80B0D] to-[#EF4444] shadow-[0_0_12px_rgba(220,38,38,0.45)] transition-transform duration-300",
                        isPlayingLive && i % 2 === 0 && "scale-y-110"
                      )}
                    />
                  ))}
                </div>

                <div className="flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#4ADE80]">
                      ON AIR: HARGEYSA
                    </p>
                    <h2 className="mt-1 truncate text-[19px] font-extrabold tracking-tight text-white">
                      {onAirTitle}
                    </h2>
                    <p className="mt-0.5 truncate text-[12px] text-white/70">
                      {onAirPresenter}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleLiveAudio}
                    aria-label={isPlayingLive ? "Pause live radio" : "Play live radio"}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#047422] text-white shadow-lg transition-transform hover:scale-105 hover:bg-[#058829]"
                  >
                    {isPlayingLive ? (
                      <Pause className="h-4 w-4 fill-current" />
                    ) : (
                      <Play className="h-4 w-4 fill-current translate-x-[1px]" />
                    )}
                  </button>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-3.5 text-[11px]">
                  <span className="flex items-center gap-1.5 text-white/65">
                    <BarChart3 className="h-3.5 w-3.5 text-white/50" />
                    Audio quality
                  </span>
                  <div className="flex items-center gap-1.5 font-mono">
                    {(["64k", "48k", "128k"] as const).map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => handleQualityChange(q)}
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-[10.5px] font-bold transition-colors",
                          quality === q
                            ? "bg-[#C40D0F] text-white"
                            : "bg-white/10 text-white/70 hover:bg-white/20"
                        )}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <p className="mt-2.5 pb-0.5 text-center font-display italic text-[12px] text-[#374151]">
                Tune in anytime, anywhere – on your device
              </p>
            </div>

            {/* Classic Tabletop Radio Vector beside the card on wide screens */}
            <svg
              aria-hidden="true"
              viewBox="0 0 180 175"
              className="hidden xl:block -ml-4 mt-20 h-44 w-44 shrink-0 drop-shadow-[0_18px_24px_rgba(5,5,5,0.28)]"
            >
              <defs>
                <linearGradient id="radioWood" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#B91C1C" />
                  <stop offset="50%" stopColor="#7F1D1D" />
                  <stop offset="100%" stopColor="#450A0A" />
                </linearGradient>
                <linearGradient id="radioDial" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#F3F4F6" />
                  <stop offset="100%" stopColor="#9CA3AF" />
                </linearGradient>
              </defs>
              <line
                x1="36"
                y1="52"
                x2="132"
                y2="14"
                stroke="#D1D5DB"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              <circle cx="134" cy="13" r="4" fill="#E5E7EB" />
              <rect
                x="14"
                y="46"
                width="148"
                height="98"
                rx="14"
                fill="url(#radioWood)"
                stroke="#3F0A0A"
                strokeWidth="2"
              />
              <rect
                x="24"
                y="58"
                width="82"
                height="74"
                rx="8"
                fill="#451A03"
                stroke="#92400E"
                strokeWidth="1.5"
              />
              <pattern
                id="grillPattern"
                width="6"
                height="6"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="3" cy="3" r="1.4" fill="#FDE68A" fillOpacity="0.45" />
              </pattern>
              <rect
                x="26"
                y="60"
                width="78"
                height="70"
                rx="6"
                fill="url(#grillPattern)"
              />
              <circle
                cx="134"
                cy="80"
                r="14"
                fill="url(#radioDial)"
                stroke="#374151"
                strokeWidth="2"
              />
              <circle cx="134" cy="80" r="8" fill="#1F2937" />
              <circle
                cx="134"
                cy="115"
                r="11"
                fill="url(#radioDial)"
                stroke="#374151"
                strokeWidth="2"
              />
              <circle cx="134" cy="115" r="5" fill="#1F2937" />
              <rect x="26" y="144" width="16" height="6" rx="2" fill="#1F2937" />
              <rect x="134" y="144" width="16" height="6" rx="2" fill="#1F2937" />
            </svg>
          </div>
        </div>
      </section>

      {/* Main White Content Container — Vertically Stacked Sections */}
      <section className="relative z-10 -mt-6 px-4 pb-16 sm:px-8">
        <div className="mx-auto max-w-7xl rounded-[28px] border border-[#E7E9EC] bg-white p-6 shadow-[0_24px_60px_-38px_rgba(5,5,5,0.2)] sm:p-10">
          {/* 0. Advertising Slides Section (Synced with /admin/advertisements) */}
          <div
            id="advertising"
            className="scroll-mt-24"
            onMouseEnter={() => setAdPaused(true)}
            onMouseLeave={() => setAdPaused(false)}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#047422]">
                  FEATURED SPONSORS &amp; CAMPAIGNS
                </p>
                <h2 className="mt-0.5 text-[22px] font-extrabold tracking-[-0.02em] text-[#050505]">
                  Advertising Highlights
                </h2>
              </div>
              {ads.length > 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-[11.5px] font-bold text-[#6B7280] tabular-nums mr-1">
                    {safeAdIndex + 1} / {ads.length}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setAdIndex((i) => (i - 1 + ads.length) % ads.length)
                    }
                    aria-label="Previous advertising slide"
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E7E9EC] bg-white text-[#111827] transition-colors hover:border-[#047422] hover:text-[#047422]"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdIndex((i) => (i + 1) % ads.length)}
                    aria-label="Next advertising slide"
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E7E9EC] bg-white text-[#111827] transition-colors hover:border-[#047422] hover:text-[#047422]"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {activeAd && (
              <div className="mt-4 overflow-hidden rounded-[22px] border border-[#DCE8DF] bg-gradient-to-r from-[#F6FBF7] via-[#FFFFFF] to-[#FDF5F6] shadow-[0_14px_34px_-24px_rgba(5,5,5,0.2)]">
                <div className="grid grid-cols-1 items-center lg:grid-cols-12">
                  <div className="p-6 sm:p-8 lg:col-span-7">
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-[#047422] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.08em] text-white">
                      <Megaphone className="h-3 w-3" />
                      <span>Advertisement</span>
                    </span>
                    <h3 className="mt-3 text-[22px] font-extrabold leading-tight tracking-tight text-[#050505] sm:text-[26px]">
                      {activeAd.name}
                    </h3>
                    {activeAd.advertiser && (
                      <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed text-[#4B5563]">
                        {activeAd.advertiser}
                      </p>
                    )}

                    <div className="mt-5 flex flex-wrap items-center gap-3">
                      {isExternalTarget(activeAd.target_url) ? (
                        <a
                          href={activeAd.target_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => handleTrackAdClick(activeAd)}
                          className="inline-flex items-center gap-2 rounded-full bg-[#C40D0F] px-5 py-2.5 text-[12.5px] font-bold text-white transition-colors hover:bg-[#A00B0C]"
                        >
                          <span>{activeAd.cta_label || "Visit Advertiser"}</span>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      ) : (
                        <Link
                          to={activeAd.target_url?.startsWith("/") ? activeAd.target_url : "/mobile/programs"}
                          onClick={() => handleTrackAdClick(activeAd)}
                          className="inline-flex items-center gap-2 rounded-full bg-[#C40D0F] px-5 py-2.5 text-[12.5px] font-bold text-white transition-colors hover:bg-[#A00B0C]"
                        >
                          <span>{activeAd.cta_label || "Learn More"}</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className="relative h-52 w-full overflow-hidden bg-[#111827] sm:h-64 lg:col-span-5 lg:h-68">
                    {activeAd.creative_url && !brokenAds[activeAd.id] ? (
                      <img
                        src={activeAd.creative_url}
                        alt={activeAd.name}
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setBrokenAds((prev) => ({ ...prev, [activeAd.id]: true }))
                        }
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#047422] to-[#023A11] p-6 text-center text-white">
                        <Megaphone className="h-10 w-10 text-white/80" />
                        <p className="mt-2 text-[14px] font-extrabold">
                          {activeAd.name}
                        </p>
                      </div>
                    )}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                  </div>
                </div>

                {ads.length > 1 && (
                  <div className="flex items-center justify-center gap-1.5 border-t border-[#EEF0F2] bg-white/80 py-2.5">
                    {ads.map((ad, idx) => (
                      <button
                        key={ad.id || idx}
                        type="button"
                        onClick={() => setAdIndex(idx)}
                        aria-label={`Select advertisement slide ${idx + 1}`}
                        className={cn(
                          "h-1.5 rounded-full transition-all",
                          safeAdIndex === idx
                            ? "w-7 bg-[#047422]"
                            : "w-2 bg-[#CBD5E1] hover:bg-[#9CA3AF]"
                        )}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="my-12 h-px bg-[#EEF0F2]" />

          {/* 1. About Us (Stacked Full-Width Section) */}
          <div id="about" className="scroll-mt-24">
            <div className="inline-block">
              <h2 className="text-[26px] font-extrabold tracking-[-0.02em] text-[#047422]">
                About Us
              </h2>
              <div className="mt-1 flex h-1 w-20 overflow-hidden rounded-full">
                <span className="w-1/2 bg-[#047422]" />
                <span className="w-1/2 bg-[#C40D0F]" />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
              <div className="space-y-4 lg:col-span-7">
                <p className="text-[15px] leading-relaxed text-[#374151]">
                  Radio Hargeysa is the voice of Somaliland, established in 1942.
                  For over eight decades, we have served our people with trusted
                  news, quality programs and a platform for dialogue, culture and
                  development.
                </p>
                <p className="text-[13.5px] leading-relaxed text-[#4B5563]">
                  Broadcasting live from the heart of Hargeisa across FM, online
                  audio streams, video broadcasts, and mobile listeners worldwide.
                </p>
                <ul className="grid grid-cols-1 gap-2.5 pt-1 text-[13px] font-semibold text-[#1F2937] sm:grid-cols-3">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[#047422]" />
                    <span>Trusted for over 80 years</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[#047422]" />
                    <span>Somaliland &amp; diaspora reach</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[#047422]" />
                    <span>News, Culture &amp; Education</span>
                  </li>
                </ul>
                <div className="pt-2">
                  <Link
                    to="/mobile/about"
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#C40D0F] px-5 py-2.5 text-[12.5px] font-bold text-white transition-colors hover:bg-[#A00B0C]"
                  >
                    <span>Learn More</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-[#E7E9EC] bg-[#050505] aspect-[16/10] lg:col-span-5">
                <img
                  src="/media/radio-studio.jpg"
                  alt="Radio Hargeysa broadcast microphone"
                  className="h-full w-full object-cover"
                />
                <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-xl bg-white/95 px-3 py-1.5 shadow-md">
                  <BrandLogo size={24} />
                  <span className="text-[10.5px] font-extrabold text-[#050505]">
                    RH · Est. 1942
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="my-12 h-px bg-[#EEF0F2]" />

          {/* 2. Our Services (Stacked Full-Width Section) */}
          <div id="services" className="scroll-mt-24">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="inline-block">
                  <h2 className="text-[26px] font-extrabold tracking-[-0.02em] text-[#047422]">
                    Our Services
                  </h2>
                  <div className="mt-1 flex h-1 w-24 overflow-hidden rounded-full">
                    <span className="w-1/2 bg-[#047422]" />
                    <span className="w-1/2 bg-[#C40D0F]" />
                  </div>
                </div>
                <p className="mt-2 text-[13.5px] text-[#4B5563]">
                  We provide a complete suite of public broadcasting, on-demand audio, video, and newsroom services.
                </p>
              </div>
              <Link
                to="/mobile/programs"
                className="inline-flex items-center gap-1 text-[12.5px] font-bold text-[#047422] hover:underline"
              >
                <span>Browse Programs</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {services.map((svc) => {
                const Icon = svc.icon;
                return (
                  <Link
                    key={svc.title}
                    to={svc.to}
                    className="group flex flex-col justify-between rounded-2xl border border-[#DCEADF] bg-[#F5FAF6] p-5 transition-colors hover:border-[#047422] hover:bg-[#E7F4EB]"
                  >
                    <div>
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#047422] shadow-xs transition-transform group-hover:scale-105">
                        <Icon className="h-5 w-5" />
                      </span>
                      <h3 className="mt-3.5 text-[14px] font-extrabold text-[#050505]">
                        {svc.title}
                      </h3>
                      <p className="mt-1 text-[12px] leading-relaxed text-[#4B5563]">
                        {svc.summary}
                      </p>
                    </div>
                    <span className="mt-4 inline-flex items-center gap-1 text-[11.5px] font-bold text-[#047422]">
                      <span>Open</span>
                      <ArrowRight className="h-3 w-3" />
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="my-12 h-px bg-[#EEF0F2]" />

          {/* 3. Our Studio (Stacked Full-Width Section) */}
          <div id="studio" className="scroll-mt-24">
            <div className="inline-block">
              <h2 className="text-[26px] font-extrabold tracking-[-0.02em] text-[#047422]">
                Our Studio
              </h2>
              <div className="mt-1 flex h-1 w-20 overflow-hidden rounded-full">
                <span className="w-1/2 bg-[#047422]" />
                <span className="w-1/2 bg-[#C40D0F]" />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
              <div className="relative overflow-hidden rounded-2xl border border-[#E7E9EC] bg-[#050505] aspect-[16/10] lg:col-span-5">
                <img
                  src="/media/oud-culture.jpg"
                  alt="Radio Hargeysa Studio 1 Control Room"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                <span className="absolute bottom-3.5 left-4 text-[11px] font-extrabold uppercase tracking-[0.14em] text-white">
                  RADIO HARGEYSA · STUDIO 1 HARGEISA
                </span>
              </div>

              <div className="space-y-4 lg:col-span-7">
                <p className="text-[15px] leading-relaxed text-[#374151]">
                  A modern broadcast studio equipped with digital mixing desks,
                  multi-track recording booths, and real-time stream encoding to
                  deliver crisp audio and video live from Hargeysa.
                </p>
                <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-3">
                  <div className="rounded-xl border border-[#E7E9EC] bg-[#FAFBFC] p-3.5">
                    <CheckCircle2 className="h-4 w-4 text-[#047422]" />
                    <p className="mt-2 text-[13px] font-bold text-[#050505]">
                      Professional Studio
                    </p>
                    <p className="mt-0.5 text-[11.5px] text-[#6B7280]">
                      Dedicated on-air &amp; recording suites.
                    </p>
                  </div>
                  <div className="rounded-xl border border-[#E7E9EC] bg-[#FAFBFC] p-3.5">
                    <CheckCircle2 className="h-4 w-4 text-[#047422]" />
                    <p className="mt-2 text-[13px] font-bold text-[#050505]">
                      Live Streaming
                    </p>
                    <p className="mt-0.5 text-[11.5px] text-[#6B7280]">
                      Adaptive bitrates for global listeners.
                    </p>
                  </div>
                  <div className="rounded-xl border border-[#E7E9EC] bg-[#FAFBFC] p-3.5">
                    <CheckCircle2 className="h-4 w-4 text-[#047422]" />
                    <p className="mt-2 text-[13px] font-bold text-[#050505]">
                      Digital Production
                    </p>
                    <p className="mt-0.5 text-[11.5px] text-[#6B7280]">
                      End-to-end episode &amp; video editing.
                    </p>
                  </div>
                </div>
                <div className="pt-2">
                  <Link
                    to="/studio_/login"
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#C40D0F] px-5 py-2.5 text-[12.5px] font-bold text-white transition-colors hover:bg-[#A00B0C]"
                  >
                    <span>Explore Our Studio</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="my-12 h-px bg-[#EEF0F2]" />

          {/* 4. Latest News (Stacked Full-Width Section) */}
          <div id="news" className="scroll-mt-24">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="inline-block">
                  <h2 className="text-[26px] font-extrabold tracking-[-0.02em] text-[#047422]">
                    Latest News
                  </h2>
                  <div className="mt-1 flex h-1 w-20 overflow-hidden rounded-full">
                    <span className="w-1/2 bg-[#047422]" />
                    <span className="w-1/2 bg-[#C40D0F]" />
                  </div>
                </div>
                <p className="mt-2 text-[13.5px] text-[#4B5563]">
                  Stay updated with the latest verified stories from Somaliland and beyond.
                </p>
              </div>
              <Link
                to="/mobile/news"
                className="inline-flex items-center gap-1 text-[12.5px] font-bold text-[#C40D0F] hover:underline"
              >
                <span>View All News</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {displayNews.map((item) => (
                <Link
                  key={item.id}
                  to={
                    liveNews.length > 0
                      ? `/mobile/news/${item.id}`
                      : "/mobile/news"
                  }
                  className="group flex flex-col overflow-hidden rounded-2xl border border-[#E7E9EC] bg-white transition-colors hover:border-[#047422]"
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#050505]">
                    <img
                      src={item.image_url || "/media/hargeisa-sunset.jpg"}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-1 flex-col justify-between p-4">
                    <div>
                      <p className="text-[10.5px] font-bold uppercase tracking-[0.06em] text-[#6B7280] tabular-nums">
                        {(item.category || "NEWS").replace(/_/g, " ")} ·{" "}
                        {formatDate(item.published_at || item.created_date)}
                      </p>
                      <h3 className="mt-1.5 line-clamp-2 text-[14px] font-extrabold leading-snug text-[#050505]">
                        {item.title}
                      </h3>
                    </div>
                    <span className="mt-3.5 inline-flex items-center gap-1 text-[11.5px] font-bold text-[#C40D0F]">
                      <span>Read More</span>
                      <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Dark Green Footer */}
      <footer
        id="footer"
        className="scroll-mt-24 relative overflow-hidden bg-gradient-to-b from-[#046B20] to-[#024A16] text-white"
      >
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-5 py-12 sm:grid-cols-2 lg:grid-cols-12 sm:px-8">
          <div className="lg:col-span-4 flex items-start gap-3.5">
            <BrandLogo size={54} />
            <div>
              <p className="text-[18px] font-extrabold tracking-tight">
                Radio Hargeysa
              </p>
              <p className="text-[12px] text-white/80">
                Codka Jamhuuriyadda Somaliland
              </p>
              <p className="mt-2 text-[11.5px] text-white/60">
                Hargeisa, Somaliland · Station time UTC+3
              </p>
            </div>
          </div>

          <div className="lg:col-span-3">
            <p className="text-[12.5px] font-extrabold text-white">
              Quick Links
            </p>
            <ul className="mt-3 space-y-1.5 text-[12px] text-white/80">
              <li>
                <button
                  type="button"
                  onClick={() => scrollToSection("top")}
                  className="hover:text-white"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollToSection("advertising")}
                  className="hover:text-white"
                >
                  Advertising Slides
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollToSection("about")}
                  className="hover:text-white"
                >
                  About Us
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollToSection("services")}
                  className="hover:text-white"
                >
                  Our Services
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollToSection("studio")}
                  className="hover:text-white"
                >
                  Our Studio
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollToSection("news")}
                  className="hover:text-white"
                >
                  Latest News
                </button>
              </li>
              <li>
                <Link to="/mobile/home" className="hover:text-white">
                  Listener App
                </Link>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-3">
            <p className="text-[12.5px] font-extrabold text-white">
              Our Dashboards
            </p>
            <div className="mt-3 space-y-2.5 max-w-[230px]">
              <Link
                to="/admin_/login"
                className="flex items-center gap-2.5 rounded-full border border-white/50 bg-white/10 px-4 py-2 text-[12.5px] font-bold text-white transition-colors hover:bg-white/20"
              >
                <ShieldCheck className="h-4 w-4 text-[#4ADE80]" />
                <span>Admin Dashboard</span>
              </Link>
              <Link
                to="/studio_/login"
                className="flex items-center gap-2.5 rounded-full border border-white/50 bg-white/10 px-4 py-2 text-[12.5px] font-bold text-white transition-colors hover:bg-white/20"
              >
                <Mic className="h-4 w-4 text-[#4ADE80]" />
                <span>Studio Dashboard</span>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-2">
            <p className="text-[12.5px] font-extrabold text-white">Follow Us</p>
            <div className="mt-3 flex items-center gap-2.5">
              <Link
                to="/mobile/home"
                aria-label="Listener App"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#046B20] transition-transform hover:scale-105"
              >
                <Globe className="h-4 w-4" />
              </Link>
              <Link
                to="/mobile/videos"
                aria-label="Videos"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#046B20] transition-transform hover:scale-105"
              >
                <Tv className="h-4 w-4" />
              </Link>
              <Link
                to="/mobile/news"
                aria-label="News"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#046B20] transition-transform hover:scale-105"
              >
                <Share2 className="h-4 w-4" />
              </Link>
              <Link
                to="/mobile/live"
                aria-label="Live"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#046B20] transition-transform hover:scale-105"
              >
                <Send className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom stripe */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#C40D0F] via-white to-[#047422]" />
        <div className="bg-[#023A11]">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-5 py-4 text-[11px] text-white/75 sm:flex-row sm:px-8">
            <p>© {new Date().getFullYear()} Radio Hargeysa. All rights reserved.</p>
            <p className="font-display italic text-[12.5px] text-white/90">
              Codka Jamhuuriyadda Somaliland · Since 1942
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
