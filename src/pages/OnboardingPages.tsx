import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Radio,
  Headphones,
  Newspaper,
  Check,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Video,
  Download,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { BrandLogo } from "../components/shared/Brand";
import { apiFetch } from "../lib/api";
import { usePreferences } from "../lib/usePreferences";
import { useAuth } from "../lib/AuthContext";
import { PROGRAM_CATEGORIES, titleCaseCategory } from "../lib/constants";
import { cn } from "../lib/utils";

export function MobileSplashPage() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(12);

  useEffect(() => {
    const start = Date.now();
    const duration = 2200;
    const interval = setInterval(() => {
      const pct = Math.min(100, 12 + ((Date.now() - start) / duration) * 88);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(interval);
        navigate("/mobile/welcome", { replace: true });
      }
    }, 40);
    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#E9F3EC] sm:p-4">
      <div
        role="button"
        tabIndex={0}
        onClick={() => navigate("/mobile/welcome", { replace: true })}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            navigate("/mobile/welcome", { replace: true });
          }
        }}
        aria-label="Continue to onboarding"
        className="relative flex h-screen w-full max-w-[480px] cursor-pointer items-center justify-center overflow-hidden bg-[#F7FBF8] shadow-[0_24px_70px_-24px_rgba(5,5,5,0.38)] sm:h-[860px] sm:max-h-[94vh] sm:rounded-[32px]"
      >
        <img
          src="/assets/aistudio/image_16edc46e.png"
          alt="Radio Hargeysa — Codka Jamhuuriyadda Somaliland"
          className="h-full w-full object-cover object-center select-none"
        />

        {/* Subtle bottom loading progress bar */}
        <div className="absolute inset-x-0 bottom-0 h-1 bg-[#047422]/15">
          <div
            className="h-full bg-[#047422] transition-all duration-75"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

interface WelcomeSlide {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  accent: string;
  badge: string;
  renderVisual: () => React.ReactNode;
}

const WELCOME_SLIDES: WelcomeSlide[] = [
  {
    id: "live",
    eyebrow: "SLIDE 1 OF 3 · LIVE RADIO",
    title: "Live 24/7 from Studio 1 Hargeisa",
    description:
      "Stream Codka Jamhuuriyadda Somaliland crystal clear anywhere — morning bulletins, civic debates, and national broadcasts.",
    accent: "from-[#ECF7EF] via-[#FFFFFF] to-[#FCECEC]",
    badge: "LIVE ON AIR",
    renderVisual: () => (
      <div className="relative flex h-56 w-full flex-col items-center justify-center overflow-hidden rounded-3xl border border-[#DCE8DF] bg-gradient-to-br from-[#F4FBF6] via-white to-[#ECF7EF] p-5">
        <div className="flex items-center gap-2 rounded-full bg-[#D91618] px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.1em] text-white shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-white live-dot" />
          <span>LIVE NOW · 98.5 FM</span>
        </div>
        <div className="my-5 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white p-1.5 shadow-md ring-1 ring-[#E7E9EC]">
            <BrandLogo size={48} />
          </div>
          <div className="flex h-12 items-end gap-1.5">
            {[20, 38, 28, 46, 34, 42, 24, 36].map((h, i) => (
              <span
                key={i}
                className={cn(
                  "w-1.5 rounded-full",
                  i % 3 === 0 ? "bg-[#C40D0F]" : "bg-[#047422]"
                )}
                style={{ height: `${h}px` }}
              />
            ))}
          </div>
        </div>
        <p className="text-[12px] font-bold text-[#050505]">
          Subaxnimo &amp; National News Desk
        </p>
        <p className="mt-0.5 text-[11px] text-[#4B5563]">
          Low-data 32kbps &amp; HD 128kbps streams
        </p>
      </div>
    ),
  },
  {
    id: "podcasts-video",
    eyebrow: "SLIDE 2 OF 3 · PODCASTS & VIDEO",
    title: "Programs, Episodes & Studio Videos",
    description:
      "Browse 11 curated categories from Politics and Business to Somali Culture, Education, Agriculture, and Sports on demand.",
    accent: "from-[#F9EDF6] via-[#FFFFFF] to-[#ECF7EF]",
    badge: "ON DEMAND",
    renderVisual: () => (
      <div className="relative flex h-56 w-full flex-col justify-between overflow-hidden rounded-3xl border border-[#E7E9EC] bg-gradient-to-br from-[#FAF5FF] via-white to-[#F0F9F2] p-5">
        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-2xl border border-[#E7E9EC] bg-white p-3 shadow-xs">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E7F5EA] text-[#047422]">
              <Headphones className="h-4.5 w-4.5" />
            </div>
            <p className="mt-2 text-[12px] font-extrabold text-[#050505]">
              Podcast Episodes
            </p>
            <p className="text-[10px] text-[#6B7280]">Listen &amp; resume anytime</p>
          </div>
          <div className="rounded-2xl border border-[#E7E9EC] bg-white p-3 shadow-xs">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FDE7E7] text-[#C40D0F]">
              <Video className="h-4.5 w-4.5" />
            </div>
            <p className="mt-2 text-[12px] font-extrabold text-[#050505]">
              Studio Videos
            </p>
            <p className="text-[10px] text-[#6B7280]">Full shows &amp; clips</p>
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-1.5 pt-2">
          {["News", "Politics", "Culture", "Education", "Sports"].map((tag, i) => (
            <span
              key={tag}
              className={cn(
                "rounded-full px-2.5 py-1 text-[10px] font-bold",
                i % 2 === 0
                  ? "bg-[#E7F5EA] text-[#047422]"
                  : "bg-[#FDE7E7] text-[#C40D0F]"
              )}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "news-library",
    eyebrow: "SLIDE 3 OF 3 · NEWS & OFFLINE",
    title: "Verified News & Offline Library",
    description:
      "Read trusted reporting from Hargeisa and across the regions, follow favorite presenters, and save episodes for offline listening.",
    accent: "from-[#ECF7EF] via-[#FFFFFF] to-[#F5F6F7]",
    badge: "STAY INFORMED",
    renderVisual: () => (
      <div className="relative flex h-56 w-full flex-col justify-center gap-3 overflow-hidden rounded-3xl border border-[#DCE8DF] bg-gradient-to-br from-[#F4FBF6] via-white to-[#EEF2F6] p-5">
        <div className="flex items-center gap-3 rounded-2xl border border-[#E7E9EC] bg-white p-3 shadow-xs">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E7F5EA] text-[#047422]">
            <Newspaper className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[12.5px] font-extrabold text-[#050505]">
              National &amp; Regional News
            </p>
            <p className="truncate text-[10.5px] text-[#6B7280]">
              Verified dispatches in Somali &amp; English
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-[#E7E9EC] bg-white p-3 shadow-xs">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#047422] text-white">
            <Download className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[12.5px] font-extrabold text-[#050505]">
              Offline Downloads &amp; Alerts
            </p>
            <p className="truncate text-[10.5px] text-[#6B7280]">
              Save shows and get instant live notifications
            </p>
          </div>
        </div>
      </div>
    ),
  },
];

export function MobileWelcomePage() {
  const navigate = useNavigate();
  const [slideIdx, setSlideIdx] = useState(0);
  const slide = WELCOME_SLIDES[slideIdx];
  const isLast = slideIdx === WELCOME_SLIDES.length - 1;

  return (
    <div className="min-h-screen bg-[#F5F6F7]">
      <div className="mx-auto flex min-h-screen max-w-[480px] flex-col justify-between bg-white px-6 py-7 shadow-[0_0_60px_-30px_rgba(5,5,5,.35)]">
        {/* Top bar */}
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <BrandLogo size={38} />
              <div>
                <p className="text-[13px] font-extrabold leading-tight text-[#050505]">
                  Radio Hargeysa
                </p>
                <p className="text-[10px] font-semibold text-[#047422]">
                  Since 1942
                </p>
              </div>
            </div>
            <Link
              to="/mobile/language"
              className="rounded-full bg-[#F5F6F7] px-3 py-1.5 text-[11.5px] font-bold text-[#4B5563] hover:bg-[#E7E9EC] hover:text-[#050505]"
            >
              Skip
            </Link>
          </div>

          {/* Interactive Slide Visual */}
          <div className="mt-7">{slide.renderVisual()}</div>

          {/* Slide Copy */}
          <div className="mt-7">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#047422]">
              {slide.eyebrow}
            </p>
            <h1 className="mt-2 text-[28px] font-extrabold leading-[1.1] tracking-[-0.03em] text-[#050505]">
              {slide.title}
            </h1>
            <p className="mt-2.5 text-[13.5px] leading-relaxed text-[#4B5563]">
              {slide.description}
            </p>
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="mt-8 space-y-4">
          {/* Dots indicator */}
          <div className="flex items-center justify-center gap-2">
            {WELCOME_SLIDES.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSlideIdx(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={cn(
                  "h-2 rounded-full transition-all",
                  idx === slideIdx
                    ? "w-7 bg-[#047422]"
                    : "w-2 bg-[#D1D5DB] hover:bg-[#9CA3AF]"
                )}
              />
            ))}
          </div>

          <div className="flex items-center gap-2.5">
            {slideIdx > 0 && (
              <button
                type="button"
                onClick={() => setSlideIdx((i) => Math.max(0, i - 1))}
                aria-label="Previous slide"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#E7E9EC] bg-white text-[#050505] hover:bg-[#F5F6F7]"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (isLast) {
                  navigate("/mobile/language");
                } else {
                  setSlideIdx((i) => i + 1);
                }
              }}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#047422] px-4 text-[13.5px] font-extrabold text-white shadow-sm transition-colors hover:bg-[#035A1B]"
            >
              <span>{isLast ? "Get Started" : "Next"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <Link
            to="/mobile/auth"
            className="block w-full py-1.5 text-center text-[12.5px] font-bold text-[#6B7280] hover:text-[#050505]"
          >
            I already have an account
          </Link>
        </div>
      </div>
    </div>
  );
}

export function MobileLanguagePage() {
  const { prefs, updatePrefs } = usePreferences();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<"so" | "en">(prefs.language || "so");

  const langs = [
    {
      code: "so" as const,
      flag: "🇸🇴",
      name: "Somali",
      native: "Af-Soomaali",
      hint: "Luqadda rasmiga ah ee Radio Hargeysa",
    },
    {
      code: "en" as const,
      flag: "🇬🇧",
      name: "English",
      native: "English",
      hint: "International broadcasts & English desk",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F5F6F7]">
      <div className="mx-auto flex min-h-screen max-w-[480px] flex-col justify-between bg-white px-6 py-8 shadow-[0_0_60px_-30px_rgba(5,5,5,.35)]">
        <div>
          <div className="flex items-center justify-between">
            <Link
              to="/mobile/welcome"
              className="inline-flex items-center gap-1 text-[12px] font-bold text-[#6B7280] hover:text-[#050505]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back</span>
            </Link>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#047422]">
              Step 1 of 3
            </p>
          </div>

          <h1 className="mt-5 text-[30px] font-extrabold leading-tight tracking-[-0.03em] text-[#050505]">
            Choose your language
          </h1>
          <p className="mt-1.5 text-[13px] text-[#6B7280]">
            Dooro luqaddaada — you can change this anytime in Settings.
          </p>

          <div className="mt-7 space-y-3">
            {langs.map((l) => {
              const active = selected === l.code;
              return (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setSelected(l.code)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-all",
                    active
                      ? "border-[#047422] bg-[#E7F5EA]/50 ring-2 ring-[#047422]"
                      : "border-[#E7E9EC] bg-white hover:bg-[#FAFBFC]"
                  )}
                >
                  <div className="flex items-center gap-3.5">
                    <span className="text-2xl">{l.flag}</span>
                    <div>
                      <p className="text-[14px] font-extrabold text-[#050505]">
                        {l.name}{" "}
                        <span className="font-semibold text-[#6B7280]">
                          ({l.native})
                        </span>
                      </p>
                      <p className="text-[11.5px] text-[#6B7280]">{l.hint}</p>
                    </div>
                  </div>
                  {active && (
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#047422] text-white">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="sticky bottom-0 bg-white pt-4">
          <button
            type="button"
            onClick={async () => {
              await updatePrefs({ language: selected });
              navigate("/mobile/interests");
            }}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#047422] px-4 text-[13.5px] font-extrabold text-white hover:bg-[#035A1B]"
          >
            <span>Continue</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function MobileInterestsPage() {
  const { prefs, updatePrefs } = usePreferences();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string[]>(prefs.interests || []);
  const [categories, setCategories] = useState<
    Array<{ slug: string; name: string }>
  >(() =>
    PROGRAM_CATEGORIES.map((c) => ({
      slug: c,
      name: titleCaseCategory(c),
    }))
  );

  useEffect(() => {
    apiFetch<any[]>("/api/content/categories")
      .then((list) => {
        if (Array.isArray(list) && list.length > 0) {
          setCategories(
            list.map((c) => ({
              slug: c.slug || c.name,
              name: c.name || titleCaseCategory(c.slug),
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  const toggle = (cat: string) => {
    setSelected((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  return (
    <div className="min-h-screen bg-[#F5F6F7]">
      <div className="mx-auto flex min-h-screen max-w-[480px] flex-col justify-between bg-white px-6 py-8 shadow-[0_0_60px_-30px_rgba(5,5,5,.35)]">
        <div>
          <div className="flex items-center justify-between">
            <Link
              to="/mobile/language"
              className="inline-flex items-center gap-1 text-[12px] font-bold text-[#6B7280] hover:text-[#050505]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back</span>
            </Link>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#047422]">
              Step 2 of 3
            </p>
          </div>

          <h1 className="mt-5 text-[30px] font-extrabold leading-tight tracking-[-0.03em] text-[#050505]">
            Pick your interests
          </h1>
          <p className="mt-1.5 text-[13px] text-[#6B7280]">
            Select topics you care about to personalize your home feed.
          </p>

          <div className="mt-7 flex flex-wrap gap-2.5">
            {categories.map((cat) => {
              const active = selected.includes(cat.slug);
              return (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => toggle(cat.slug)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-[12.5px] font-bold transition-colors",
                    active
                      ? "border-[#047422] bg-[#047422] text-white shadow-xs"
                      : "border-[#E7E9EC] bg-[#F5F6F7] text-[#1F2937] hover:bg-[#EDEFF1]"
                  )}
                >
                  {active && <Check className="h-3.5 w-3.5" />}
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-8 space-y-2.5">
          <button
            type="button"
            onClick={async () => {
              await updatePrefs({ interests: selected });
              navigate("/mobile/auth");
            }}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#047422] px-4 text-[13.5px] font-extrabold text-white hover:bg-[#035A1B]"
          >
            <span>Continue</span>
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => navigate("/mobile/auth")}
            className="w-full py-2 text-center text-[12.5px] font-bold text-[#6B7280] hover:text-[#050505]"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}

export function MobileAuthStepPage() {
  const { login, register, verifyOtp, resendOtp, loginWithGoogle, demoLogin } =
    useAuth();
  const { updatePrefs } = usePreferences();
  const navigate = useNavigate();

  const [mode, setMode] = useState<"login" | "signup" | "otp">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const finishOnboarding = async () => {
    try {
      localStorage.setItem("rh_onboarding_v2", "1");
    } catch {
      // ignore
    }
    await updatePrefs({ onboarded: true });
    navigate("/mobile/home", { replace: true });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email, password);
      await finishOnboarding();
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    } finally {
      setBusy(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await register(email, password);
      if (res.devOtpHint) setDevOtpHint(res.devOtpHint);
      setMode("otp");
      toast.success("Verification code sent to your email");
    } catch (err: any) {
      setError(err.message || "Could not create account.");
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otpDigits.join("");
    if (code.length !== 6) {
      setError("Enter all 6 digits.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await verifyOtp(email, code);
      toast.success("Account verified");
      await finishOnboarding();
    } catch (err: any) {
      setError(err.message || "Verification failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F6F7]">
      <div className="mx-auto flex min-h-screen max-w-[480px] flex-col justify-between bg-white px-6 py-8 shadow-[0_0_60px_-30px_rgba(5,5,5,.35)]">
        <div>
          <div className="flex items-center justify-between">
            <Link
              to="/mobile/interests"
              className="inline-flex items-center gap-1 text-[12px] font-bold text-[#6B7280] hover:text-[#050505]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back</span>
            </Link>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#047422]">
              Step 3 of 3
            </p>
          </div>

          <div className="mt-5 flex items-center gap-2.5">
            <BrandLogo size={38} />
            <div>
              <h1 className="text-[22px] font-extrabold leading-tight tracking-[-0.02em] text-[#050505]">
                {mode === "signup"
                  ? "Create your account"
                  : mode === "otp"
                  ? "Verify your email"
                  : "Sign in to Radio Hargeysa"}
              </h1>
              <p className="text-[12px] text-[#6B7280]">
                {mode === "otp"
                  ? `Enter the 6-digit code sent to ${email}`
                  : "Sync favorites, playlists, downloads & notifications."}
              </p>
            </div>
          </div>

          {mode !== "otp" && (
            <>
              {/* Sign In / Create Account tabs */}
              <div className="mt-5 grid grid-cols-2 rounded-xl bg-[#F5F6F7] p-1">
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setError(null);
                  }}
                  className={cn(
                    "rounded-lg py-2 text-[12.5px] font-bold transition-all",
                    mode === "login"
                      ? "bg-white text-[#050505] shadow-xs"
                      : "text-[#6B7280] hover:text-[#050505]"
                  )}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setError(null);
                  }}
                  className={cn(
                    "rounded-lg py-2 text-[12.5px] font-bold transition-all",
                    mode === "signup"
                      ? "bg-white text-[#050505] shadow-xs"
                      : "text-[#6B7280] hover:text-[#050505]"
                  )}
                >
                  Sign Up
                </button>
              </div>

              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  setError(null);
                  try {
                    await loginWithGoogle();
                    await finishOnboarding();
                  } catch (err: any) {
                    setError(err.message || "Google sign-in failed");
                  } finally {
                    setBusy(false);
                  }
                }}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[#E7E9EC] bg-white px-4 py-2.5 text-[12.5px] font-bold text-[#050505] hover:bg-[#F5F6F7] disabled:opacity-40"
              >
                <span>Continue with Google</span>
              </button>

              <div className="my-4 flex items-center gap-3 text-[11px] text-[#9CA3AF]">
                <div className="h-px flex-1 bg-[#E7E9EC]" />
                <span>or with email</span>
                <div className="h-px flex-1 bg-[#E7E9EC]" />
              </div>
            </>
          )}

          {mode === "login" && (
            <form onSubmit={handleLogin} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF]">
                  Email <span className="text-[#C40D0F]">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-1 w-full rounded-xl border border-[#E7E9EC] px-3 py-2 text-[12.5px] focus:border-[#047422] focus:outline-none"
                />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF]">
                    Password <span className="text-[#C40D0F]">*</span>
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-[11px] font-bold text-[#047422] hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1 w-full rounded-xl border border-[#E7E9EC] px-3 py-2 text-[12.5px] focus:border-[#047422] focus:outline-none"
                />
              </div>

              {error && (
                <p className="text-[11.5px] font-semibold text-[#C40D0F]">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#047422] px-4 text-[13px] font-bold text-white hover:bg-[#035A1B] disabled:opacity-40"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>Sign in</span>
              </button>
            </form>
          )}

          {mode === "signup" && (
            <form onSubmit={handleSignup} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF]">
                  Email <span className="text-[#C40D0F]">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-1 w-full rounded-xl border border-[#E7E9EC] px-3 py-2 text-[12.5px] focus:border-[#047422] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF]">
                  Password <span className="text-[#C40D0F]">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="mt-1 w-full rounded-xl border border-[#E7E9EC] px-3 py-2 text-[12.5px] focus:border-[#047422] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF]">
                  Confirm Password <span className="text-[#C40D0F]">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat password"
                  className="mt-1 w-full rounded-xl border border-[#E7E9EC] px-3 py-2 text-[12.5px] focus:border-[#047422] focus:outline-none"
                />
              </div>

              {error && (
                <p className="text-[11.5px] font-semibold text-[#C40D0F]">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#047422] px-4 text-[13px] font-bold text-white hover:bg-[#035A1B] disabled:opacity-40"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>Create Account</span>
              </button>
            </form>
          )}

          {mode === "otp" && (
            <form onSubmit={handleVerifyOtp} className="mt-6 space-y-4">
              {devOtpHint && (
                <div className="flex items-center gap-2 rounded-xl border border-[#047422]/25 bg-[#E7F5EA] px-3 py-2 text-[12px] font-semibold text-[#047422]">
                  <Sparkles className="h-4 w-4 shrink-0" />
                  <span>
                    Verification code: <strong className="font-mono">{devOtpHint}</strong>
                  </span>
                </div>
              )}
              <div className="grid grid-cols-6 gap-2">
                {otpDigits.map((digit, i) => (
                  <input
                    key={i}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(-1);
                      setOtpDigits((prev) => {
                        const next = [...prev];
                        next[i] = val;
                        return next;
                      });
                      if (val && e.target.nextElementSibling instanceof HTMLInputElement) {
                        e.target.nextElementSibling.focus();
                      }
                    }}
                    className="h-12 w-full rounded-xl border border-[#E7E9EC] text-center font-mono text-[18px] font-extrabold text-[#050505] focus:border-[#047422] focus:outline-none"
                  />
                ))}
              </div>
              {error && (
                <p className="text-[11.5px] font-semibold text-[#C40D0F]">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={busy}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#047422] px-4 text-[13px] font-bold text-white hover:bg-[#035A1B] disabled:opacity-40"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>Verify &amp; Enter App</span>
              </button>
              <div className="flex items-center justify-between text-[12px] font-bold">
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className="text-[#6B7280] hover:text-[#050505]"
                >
                  Change email
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const res = await resendOtp(email);
                    if (res.devOtpHint) setDevOtpHint(res.devOtpHint);
                    toast.success("Code resent");
                  }}
                  className="text-[#047422] hover:underline"
                >
                  Resend code
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="mt-6 space-y-2.5">
          <div className="rounded-2xl border border-[#E7E9EC] bg-[#F5F6F7] p-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9CA3AF]">
                  Demo listener
                </p>
                <p className="truncate font-mono text-[11px] text-[#1F2937]">
                  listener@radiohargeysa.so
                </p>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await demoLogin("mobile");
                    await finishOnboarding();
                  } finally {
                    setBusy(false);
                  }
                }}
                className="shrink-0 rounded-xl bg-[#050505] px-3 py-2 text-[11.5px] font-bold text-white hover:bg-[#1F2937]"
              >
                Demo Sign In
              </button>
            </div>
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={finishOnboarding}
            className="flex h-11 w-full items-center justify-center rounded-xl border border-[#E7E9EC] bg-white px-4 text-[12.5px] font-bold text-[#050505] hover:bg-[#F5F6F7] disabled:opacity-40"
          >
            Continue as guest → Home
          </button>
        </div>
      </div>
    </div>
  );
}
