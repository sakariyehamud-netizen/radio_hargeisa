import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Check,
  Loader2,
  User,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  Home,
  Mic,
  Settings,
  BarChart3,
  Users,
  FileText,
  Radio,
  Headphones,
} from "lucide-react";
import { toast } from "sonner";
import { BrandLogo } from "../components/shared/Brand";
import { useAuth } from "../lib/AuthContext";
import { safeReturnTo } from "../lib/authReturnTo";
import { landingForRole } from "../lib/rbac";
import { apiFetch } from "../lib/api";

function AuthLayout({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const bullets = [
    "24/7 live national radio & breaking newsroom dispatches",
    "On-demand podcasts, cultural archives & sports coverage",
    "Role-secured broadcast studio & station administration",
  ];

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-12">
      {/* Left brand panel */}
      <div className="relative hidden lg:flex lg:col-span-5 flex-col justify-between overflow-hidden brand-gradient p-10 text-white">
        <div className="rh-grid absolute inset-0 opacity-70" />
        <div className="relative">
          <Link to="/" className="inline-flex items-center gap-3">
            <BrandLogo size={42} />
            <div>
              <p className="text-[14px] font-extrabold text-white">
                Radio Hargeysa
              </p>
              <p className="text-[9.5px] font-bold uppercase tracking-[0.16em] text-[#4ADE80]">
                Since 1942
              </p>
            </div>
          </Link>
        </div>

        <div className="relative">
          <p className="font-display italic text-[28px] leading-snug text-white">
            Codka Jamhuuriyadda Somaliland
          </p>
          <p className="mt-3 text-[13.5px] leading-relaxed text-white/75">
            Somaliland's national broadcaster — connecting Hargeisa and the
            global diaspora.
          </p>

          <ul className="mt-7 space-y-3">
            {bullets.map((b) => (
              <li
                key={b}
                className="flex items-start gap-2.5 text-[12.5px] text-white/85"
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15 text-[#4ADE80]">
                  <Check className="h-3 w-3" />
                </span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-[11px] text-white/50">
          Hargeisa, Somaliland · Station time UTC+3
        </p>
      </div>

      {/* Right white card */}
      <div className="flex flex-col items-center justify-center bg-[#F5F6F7] px-4 py-10 lg:col-span-7">
        <div className="w-full max-w-[420px] rounded-3xl border border-[#E7E9EC] bg-white p-7 shadow-[0_24px_60px_-40px_rgba(5,5,5,.3)]">
          <div className="mb-6 flex items-center justify-between lg:hidden">
            <Link to="/" className="flex items-center gap-2">
              <BrandLogo size={32} />
              <span className="text-[13px] font-extrabold text-[#050505]">
                Radio Hargeysa
              </span>
            </Link>
          </div>

          {eyebrow && (
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#047422]">
              {eyebrow}
            </p>
          )}
          <h1 className="mt-1 text-[22px] font-extrabold tracking-tight text-[#050505]">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-[12.5px] text-[#6B7280]">{subtitle}</p>
          )}

          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function LoginPage() {
  const { login, loginWithGoogle, demoLogin } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { role } = await login(email, password);
      const returnTo = params.get("returnTo");
      navigate(returnTo ? safeReturnTo(returnTo) : landingForRole(role));
    } catch (err: any) {
      setError(err.message || "Could not sign in.");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setBusy(true);
    setError(null);
    try {
      const { role } = await loginWithGoogle();
      const returnTo = params.get("returnTo");
      navigate(returnTo ? safeReturnTo(returnTo) : landingForRole(role));
    } catch (err: any) {
      setError(err.message || "Google sign-in failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="ACCOUNT"
      title="Sign in"
      subtitle="Access your Radio Hargeysa listener library or workspace."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
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
          <p className="text-[11.5px] font-semibold text-[#C40D0F]">{error}</p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#047422] px-4 py-2.5 text-[13px] font-bold text-white hover:bg-[#035A1B] disabled:opacity-40"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          <span>Sign in</span>
        </button>
      </form>

      <div className="my-5 flex items-center gap-3 text-[11px] text-[#9CA3AF]">
        <div className="h-px flex-1 bg-[#E7E9EC]" />
        <span>or</span>
        <div className="h-px flex-1 bg-[#E7E9EC]" />
      </div>

      <div className="space-y-2.5">
        <button
          type="button"
          disabled={busy}
          onClick={handleGoogleSignIn}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#E7E9EC] bg-white px-4 py-2.5 text-[12.5px] font-bold text-[#050505] hover:bg-[#F5F6F7] disabled:opacity-40"
        >
          <span>Continue with Google</span>
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setError(null);
            setBusy(true);
            try {
              const { role } = await demoLogin("mobile");
              navigate(landingForRole(role));
            } catch (err: any) {
              setError(err.message || "Demo sign-in failed.");
            } finally {
              setBusy(false);
            }
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#F5F6F7] px-4 py-2 text-[12px] font-bold text-[#374151] hover:bg-[#EDEFF1] disabled:opacity-40"
        >
          <span>Use Listener Demo Account</span>
        </button>
      </div>

      <p className="mt-5 text-center text-[12px] text-[#6B7280]">
        New here?{" "}
        <Link to="/register" className="font-bold text-[#047422] hover:underline">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
}

export function RegisterPage() {
  const { register, verifyOtp, resendOtp } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<"form" | "otp">("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await register(email, password);
      if (res.devOtpHint) setDevOtpHint(res.devOtpHint);
      setStep("otp");
      toast.success("Verification code sent to your email");
    } catch (err: any) {
      setError(err.message || "Could not create account.");
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otpDigits.join("");
    if (code.length !== 6) {
      setError("Enter all 6 digits.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { role } = await verifyOtp(email, code);
      toast.success("Account verified");
      navigate(landingForRole(role));
    } catch (err: any) {
      setError(err.message || "Verification failed.");
    } finally {
      setBusy(false);
    }
  };

  if (step === "otp") {
    return (
      <AuthLayout
        eyebrow="VERIFICATION"
        title="Enter 6-digit code"
        subtitle={`We sent a verification code to ${email}.`}
      >
        <form onSubmit={handleVerify} className="space-y-4">
          <div className="grid grid-cols-6 gap-2">
            {otpDigits.map((digit, idx) => (
              <input
                key={idx}
                maxLength={1}
                value={digit}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(-1);
                  const next = [...otpDigits];
                  next[idx] = val;
                  setOtpDigits(next);
                  if (val && idx < 5) {
                    const nextEl = document.getElementById(`otp-${idx + 1}`);
                    nextEl?.focus();
                  }
                }}
                id={`otp-${idx}`}
                className="h-11 w-full rounded-xl border border-[#E7E9EC] text-center font-mono text-[16px] font-bold focus:border-[#047422] focus:outline-none"
              />
            ))}
          </div>

          {devOtpHint && (
            <p className="rounded-xl bg-[#E7F5EA] px-3 py-2 text-[11.5px] font-semibold text-[#047422]">
              Verification code: <span className="font-mono font-bold">{devOtpHint}</span>
            </p>
          )}

          {error && (
            <p className="text-[11.5px] font-semibold text-[#C40D0F]">{error}</p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#047422] px-4 py-2.5 text-[13px] font-bold text-white hover:bg-[#035A1B] disabled:opacity-40"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>Verify and continue</span>
          </button>

          <button
            type="button"
            onClick={async () => {
              const res = await resendOtp(email);
              if (res.devOtpHint) setDevOtpHint(res.devOtpHint);
              toast.success("New code sent");
            }}
            className="w-full text-center text-[12px] font-bold text-[#6B7280] hover:text-[#050505]"
          >
            Resend code
          </button>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      eyebrow="NEW ACCOUNT"
      title="Create an account"
      subtitle="We'll email you a 6-digit code."
    >
      <form onSubmit={handleRegister} className="space-y-4">
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
            placeholder="••••••••"
            className="mt-1 w-full rounded-xl border border-[#E7E9EC] px-3 py-2 text-[12.5px] focus:border-[#047422] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF]">
            Confirm password <span className="text-[#C40D0F]">*</span>
          </label>
          <input
            type="password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
            className="mt-1 w-full rounded-xl border border-[#E7E9EC] px-3 py-2 text-[12.5px] focus:border-[#047422] focus:outline-none"
          />
        </div>

        {error && (
          <p className="text-[11.5px] font-semibold text-[#C40D0F]">{error}</p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#047422] px-4 py-2.5 text-[13px] font-bold text-white hover:bg-[#035A1B] disabled:opacity-40"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          <span>Create account</span>
        </button>
      </form>

      <p className="mt-5 text-center text-[12px] text-[#6B7280]">
        Already have an account?{" "}
        <Link to="/login" className="font-bold text-[#047422] hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [devToken, setDevToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await apiFetch<{ ok: boolean; devResetToken?: string }>(
        "/api/auth/forgot-password",
        { method: "POST", body: JSON.stringify({ email }) }
      );
      if (res.devResetToken) setDevToken(res.devResetToken);
      setSent(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="PASSWORD RESET"
      title="Forgot password"
      subtitle="Enter your email address and we'll send reset instructions."
    >
      {sent ? (
        <div className="space-y-4">
          <div className="rounded-2xl bg-[#E7F5EA] p-4 text-[12.5px] text-[#047422]">
            If an account exists for <span className="font-bold">{email}</span>,
            a password reset link has been sent.
          </div>
          {devToken && (
            <Link
              to={`/reset-password?token=${devToken}`}
              className="block rounded-xl border border-[#E7E9EC] px-4 py-2.5 text-center text-[12.5px] font-bold text-[#047422] hover:bg-[#F5F6F7]"
            >
              Open reset password page
            </Link>
          )}
          <Link
            to="/login"
            className="block text-center text-[12.5px] font-bold text-[#6B7280] hover:text-[#050505]"
          >
            Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
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

          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#047422] px-4 py-2.5 text-[13px] font-bold text-white hover:bg-[#035A1B] disabled:opacity-40"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>Send reset link</span>
          </button>

          <Link
            to="/login"
            className="block text-center text-[12px] font-bold text-[#6B7280] hover:text-[#050505]"
          >
            Back to sign in
          </Link>
        </form>
      )}
    </AuthLayout>
  );
}

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await apiFetch("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });
      toast.success("Password updated");
      navigate("/login");
    } catch (err: any) {
      setError(err.message || "Reset link invalid.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="PASSWORD RESET"
      title="Set a new password"
      subtitle="Choose a strong password for your Radio Hargeysa account."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF]">
            New password <span className="text-[#C40D0F]">*</span>
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="mt-1 w-full rounded-xl border border-[#E7E9EC] px-3 py-2 text-[12.5px] focus:border-[#047422] focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF]">
            Confirm password <span className="text-[#C40D0F]">*</span>
          </label>
          <input
            type="password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
            className="mt-1 w-full rounded-xl border border-[#E7E9EC] px-3 py-2 text-[12.5px] focus:border-[#047422] focus:outline-none"
          />
        </div>

        {error && (
          <p className="text-[11.5px] font-semibold text-[#C40D0F]">{error}</p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#047422] px-4 py-2.5 text-[13px] font-bold text-white hover:bg-[#035A1B] disabled:opacity-40"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          <span>Update password</span>
        </button>
      </form>
    </AuthLayout>
  );
}

function ShieldPortalLogo() {
  return (
    <svg viewBox="0 0 64 72" className="h-14 w-12 shrink-0 drop-shadow-md">
      <path
        d="M32 3 L60 13 V36 C60 53 47 64 32 69 C17 64 4 53 4 36 V13 Z"
        fill="#FFFFFF"
        stroke="#FFFFFF"
        strokeWidth="2"
      />
      <path d="M8 16 L32 8 L56 16 V24 H8 Z" fill="#047422" />
      <rect x="8" y="24" width="48" height="25" fill="#FFFFFF" />
      <path d="M8 49 H56 C53 56 44 62 32 65 C20 62 11 56 8 49 Z" fill="#C40D0F" />
      <text
        x="32"
        y="44"
        textAnchor="middle"
        fill="#050505"
        fontFamily="Georgia, serif"
        fontWeight="800"
        fontSize="24"
        letterSpacing="-1"
      >
        RH
      </text>
    </svg>
  );
}

export function WorkspaceLoginPage({ area }: { area: "admin" | "studio" }) {
  const { login, demoLogin } = useAuth();
  const navigate = useNavigate();
  const isAdmin = area === "admin";
  const demoEmail = isAdmin
    ? "admin@radiohargeysa.so"
    : "studio@radiohargeysa.so";
  const demoPass = isAdmin ? "Admin123!" : "Studio123!";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email, password);
      navigate(isAdmin ? "/admin/dashboard" : "/studio/dashboard");
    } catch (err: any) {
      setError(err.message || "Could not sign in.");
    } finally {
      setBusy(false);
    }
  };

  const handleDemo = async () => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setBusy(true);
    setError(null);
    try {
      await demoLogin(area);
      navigate(isAdmin ? "/admin/dashboard" : "/studio/dashboard");
    } catch (err: any) {
      setError(err.message || "Demo sign-in failed.");
    } finally {
      setBusy(false);
    }
  };

  const adminFeatures = [
    { icon: Settings, label: "Manage System" },
    { icon: BarChart3, label: "View Analytics" },
    { icon: Users, label: "Manage Users" },
    { icon: FileText, label: "Control Content" },
  ];

  const studioFeatures = [
    { icon: Radio, label: "Live Broadcast" },
    { icon: BarChart3, label: "Manage Programs" },
    { icon: Headphones, label: "Studio Control" },
  ];

  return (
    <div className="relative flex min-h-screen w-full overflow-hidden bg-[#F3F7F4]">
      {/* Left Deep Emerald Brand Panel with Curved S-Wave Divider */}
      <div className="relative hidden lg:flex lg:w-[55%] flex-col justify-between overflow-hidden bg-gradient-to-br from-[#024A16] via-[#03681E] to-[#01340F] px-12 py-10 text-white">
        {/* Studio / Desk Photo Overlay */}
        <img
          src="/media/radio-studio.jpg"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[58%] w-full object-cover opacity-35 mix-blend-luminosity"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#024A16] via-[#024A16]/80 to-[#01340F]/85" />

        {/* Subtle dotted world texture */}
        <svg
          aria-hidden="true"
          viewBox="0 0 600 300"
          className="pointer-events-none absolute right-10 top-6 h-56 w-[420px] opacity-25"
        >
          <pattern
            id="portalDots"
            width="10"
            height="10"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="2" cy="2" r="1.4" fill="#4ADE80" />
          </pattern>
          <path
            d="M40 80 Q140 30 240 90 T450 70 Q530 90 560 170 Q460 220 350 180 T120 200 Z"
            fill="url(#portalDots)"
          />
        </svg>

        {/* Right-edge curved S-wave separator matching screenshots */}
        <svg
          aria-hidden="true"
          viewBox="0 0 120 800"
          preserveAspectRatio="none"
          className="pointer-events-none absolute right-0 top-0 h-full w-24"
        >
          <path
            d="M 120 0 L 120 800 L 15 800 C 80 610 -15 350 55 0 Z"
            fill="#F3F7F4"
          />
          <path
            d="M 55 0 C -15 350 80 610 15 800 L 38 800 C 98 610 5 350 74 0 Z"
            fill="#16A34A"
            fillOpacity="0.85"
          />
        </svg>

        {/* Top Header Lockup */}
        <div className="relative z-10 pr-16">
          <Link to="/" className="inline-flex items-center gap-4">
            <ShieldPortalLogo />
            <div>
              <p className="text-[24px] font-extrabold leading-none tracking-tight text-white">
                Radio Hargeysa
              </p>
              <div className="mt-1.5 flex items-center gap-2 text-[10px] font-bold tracking-[0.26em] text-white/80">
                <span className="h-px w-8 bg-white/40" />
                <span>SINCE 1942</span>
                <span className="h-px w-8 bg-white/40" />
              </div>
            </div>
          </Link>

          <div className="mt-10">
            <h1 className="text-[46px] font-extrabold leading-none tracking-[-0.03em]">
              {isAdmin ? (
                <>
                  <span className="text-white">Admin </span>
                  <span className="text-[#4ADE80]">Portal</span>
                </>
              ) : (
                <span className="text-white">Studio Portal</span>
              )}
            </h1>
            <p className="mt-3 font-display italic text-[26px] leading-snug text-white">
              {isAdmin
                ? "Manage. Monitor. Grow."
                : "Broadcast. Inform. Connect."}
            </p>
            <div className="mt-2 h-0.5 w-60 rounded-full bg-gradient-to-r from-[#4ADE80] to-transparent" />

            <p className="mt-4 max-w-md text-[14.5px] leading-relaxed text-white/90">
              {isAdmin
                ? "Secure access for administrators to manage users, content, programs and system settings."
                : "Access your studio dashboard to manage programs, live broadcasts and content."}
            </p>

            {/* Admin Feature Strip */}
            {isAdmin && (
              <div className="mt-8 grid max-w-md grid-cols-4 divide-x divide-white/20">
                {adminFeatures.map((f) => {
                  const Icon = f.icon;
                  return (
                    <div
                      key={f.label}
                      className="flex flex-col items-center px-2 text-center"
                    >
                      <Icon className="h-5 w-5 text-white" />
                      <span className="mt-2 text-[11px] font-semibold leading-tight text-white/90">
                        {f.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Visual Footer */}
        <div className="relative z-10 pr-16">
          {isAdmin ? (
            <div className="inline-flex items-center gap-3 rounded-2xl border border-white/15 bg-black/35 px-4 py-3 backdrop-blur-md">
              <BrandLogo size={38} />
              <div>
                <p className="text-[12.5px] font-extrabold text-white">
                  Radio Hargeysa Network
                </p>
                <p className="text-[11px] text-white/70">
                  Governance · Audit Logs · Streams
                </p>
              </div>
            </div>
          ) : (
            <div className="inline-grid grid-cols-3 divide-x divide-white/20 rounded-2xl border border-white/15 bg-black/40 px-4 py-3 backdrop-blur-md">
              {studioFeatures.map((f) => {
                const Icon = f.icon;
                return (
                  <div
                    key={f.label}
                    className="flex items-center gap-2.5 px-3 first:pl-1 last:pr-1"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-[#4ADE80]" />
                    <span className="text-[11.5px] font-bold leading-tight text-white">
                      {f.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Login Card Container */}
      <div className="relative flex flex-1 flex-col items-center justify-center bg-gradient-to-br from-[#F3F7F4] via-[#FFFFFF] to-[#ECF4EE] px-5 py-10">
        {/* Mobile Brand Header */}
        <div className="mb-6 flex items-center gap-3 lg:hidden">
          <BrandLogo size={40} />
          <div>
            <p className="text-[15px] font-extrabold text-[#050505]">
              Radio Hargeysa
            </p>
            <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-[#047422]">
              Since 1942
            </p>
          </div>
        </div>

        <div className="w-full max-w-[430px] rounded-[28px] border border-[#E5ECE7] bg-white p-8 shadow-[0_24px_60px_-28px_rgba(4,116,34,0.28)]">
          {/* Top Portal Emblem */}
          <div className="flex flex-col items-center text-center">
            <div className="relative flex items-center justify-center">
              <span className="absolute -left-7 text-[#047422]/20">
                <Radio className="h-7 w-7" />
              </span>
              {isAdmin ? (
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#047422] text-white shadow-[0_12px_24px_-10px_rgba(4,116,34,0.65)]">
                  <User className="h-8 w-8" />
                </div>
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#E3F3E7] text-[#047422]">
                  <Mic className="h-8 w-8" />
                </div>
              )}
              <span className="absolute -right-7 text-[#047422]/20">
                <Radio className="h-7 w-7" />
              </span>
            </div>

            <h2 className="mt-4 text-[30px] font-extrabold tracking-[-0.02em]">
              <span className="text-[#047422]">
                {isAdmin ? "Admin " : "Studio "}
              </span>
              <span className="text-[#050505]">Portal</span>
            </h2>
            <p className="mt-1 text-[13px] font-medium text-[#374151]">
              {isAdmin
                ? "Login to Your Admin Dashboard"
                : "Login to Your Studio Dashboard"}
            </p>
            <div className="mt-3 h-0.5 w-16 rounded-full bg-[#047422]" />
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="relative">
              <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#047422]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={
                  isAdmin ? "Admin Username" : "Username or Staff ID"
                }
                aria-label={isAdmin ? "Admin Username" : "Username or Staff ID"}
                className="w-full rounded-xl border border-[#DCE4DE] bg-[#FAFCFA] py-3 pl-10 pr-4 text-[13px] text-[#050505] placeholder:text-[#6B7280] focus:border-[#047422] focus:bg-white focus:outline-none"
              />
            </div>

            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#047422]" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                aria-label="Password"
                className="w-full rounded-xl border border-[#DCE4DE] bg-[#FAFCFA] py-3 pl-10 pr-10 text-[13px] text-[#050505] placeholder:text-[#6B7280] focus:border-[#047422] focus:bg-white focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#050505]"
              >
                {showPassword ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between text-[12px]">
              <label className="flex cursor-pointer items-center gap-2 font-semibold text-[#1F2937]">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded accent-[#047422]"
                />
                <span>{isAdmin ? "Remember me" : "Remember Me"}</span>
              </label>
              <Link
                to="/forgot-password"
                className="font-bold text-[#047422] underline underline-offset-2 hover:text-[#035A1B]"
              >
                Forgot Password?
              </Link>
            </div>

            {error && (
              <p className="rounded-xl bg-[#FDE7E7] px-3 py-2 text-[11.5px] font-semibold text-[#C40D0F]">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#047422] to-[#0A8A2B] px-4 py-3 text-[13.5px] font-bold text-white shadow-[0_12px_24px_-12px_rgba(4,116,34,0.7)] transition-opacity hover:opacity-95 disabled:opacity-40"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogIn className="h-4 w-4" />
              )}
              <span>{isAdmin ? "Login to Dashboard" : "Login to Studio"}</span>
            </button>
          </form>

          <div className="my-5 flex items-center gap-3 text-[11px] font-bold text-[#4B5563]">
            <div className="h-px flex-1 bg-[#E7E9EC]" />
            <span>OR</span>
            <div className="h-px flex-1 bg-[#E7E9EC]" />
          </div>

          <Link
            to="/"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#DCEADF] bg-[#EAF5ED] px-4 py-2.5 text-[12.5px] font-bold text-[#050505] transition-colors hover:bg-[#DCF0E2]"
          >
            <Home className="h-4 w-4 text-[#047422]" />
            <span>Back to Website</span>
          </Link>

          {/* Compact quick demo sign-in strip */}
          <div className="mt-4 flex items-center justify-between rounded-xl border border-[#E7E9EC] bg-[#F8FAF8] px-3.5 py-2.5 text-[11px]">
            <div className="min-w-0">
              <p className="font-mono font-semibold text-[#374151] truncate">
                {demoEmail}
              </p>
              <p className="font-mono text-[#6B7280]">{demoPass}</p>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={handleDemo}
              className="ml-2 shrink-0 rounded-lg bg-[#050505] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-[#1F2937]"
            >
              Use demo
            </button>
          </div>

          <p className="mt-4 text-center text-[11px] font-medium text-[#4B5563]">
            {isAdmin
              ? "Radio Hargeysa • Admin Portal"
              : "Radio Hargeysa • Studio Access"}
          </p>
        </div>
      </div>
    </div>
  );
}
