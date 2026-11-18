import React from "react";
import { Link } from "react-router-dom";
import { Loader2, ShieldAlert, Lock } from "lucide-react";
import { useArea } from "../../lib/useArea";
import { ROLE_LABELS, landingForRole } from "../../lib/rbac";

export function LoadingState({ label = "Checking access" }: { label?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F5F6F7] px-4">
      <Loader2 className="h-7 w-7 animate-spin text-[#047422]" />
      <p className="mt-3 text-[13px] font-medium text-[#6B7280]">{label}</p>
    </div>
  );
}

export function SignInPrompt({ area }: { area: "admin" | "studio" }) {
  const title =
    area === "admin"
      ? "Sign in to the Admin Dashboard"
      : "Sign in to the Studio Dashboard";
  const loginPath = area === "admin" ? "/admin_/login" : "/studio_/login";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F6F7] px-4">
      <div className="w-full max-w-[448px] rounded-3xl border border-[#E7E9EC] bg-white p-8 text-center shadow-[0_24px_60px_-40px_rgba(5,5,5,.3)]">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E7F5EA] text-[#047422]">
          <Lock className="h-5 w-5" />
        </div>
        <h1 className="mt-4 text-[20px] font-extrabold tracking-tight text-[#050505]">
          {title}
        </h1>
        <p className="mt-2 text-[13px] text-[#6B7280] leading-relaxed">
          Staff authentication is required to access Radio Hargeysa broadcast and
          editorial tools.
        </p>
        <Link
          to={loginPath}
          className="mt-6 flex w-full items-center justify-center rounded-xl bg-[#047422] px-4 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-[#035A1B]"
        >
          Continue to sign in
        </Link>
        <Link
          to="/"
          className="mt-3 inline-block text-[12.5px] font-semibold text-[#6B7280] hover:text-[#050505]"
        >
          Back to the public site
        </Link>
      </div>
    </div>
  );
}

export function ForbiddenState({
  area,
  role,
  onSignOut,
}: {
  area: "admin" | "studio";
  role: any;
  onSignOut: () => void;
}) {
  const ownLanding = landingForRole(role);
  const loginPath = area === "admin" ? "/admin_/login" : "/studio_/login";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F6F7] px-4">
      <div className="w-full max-w-[448px] rounded-3xl border border-[#FDE7E7] bg-white p-8 text-center shadow-[0_24px_60px_-40px_rgba(5,5,5,.3)]">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FDE7E7] text-[#C40D0F]">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-[#C40D0F]">
          403 · Forbidden
        </p>
        <h1 className="mt-1 text-[20px] font-extrabold tracking-tight text-[#050505]">
          You don't have access to {area === "admin" ? "Admin" : "Studio"}
        </h1>
        <p className="mt-2 text-[13px] text-[#6B7280] leading-relaxed">
          Your current role is{" "}
          <span className="font-bold text-[#050505]">
            {ROLE_LABELS[role as keyof typeof ROLE_LABELS] || role}
          </span>
          . This workspace requires elevated broadcast permissions.
        </p>
        <Link
          to={ownLanding}
          className="mt-6 flex w-full items-center justify-center rounded-xl bg-[#047422] px-4 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-[#035A1B]"
        >
          Go to your workspace
        </Link>
        <div className="mt-3 flex items-center justify-center gap-4 text-[12.5px] font-semibold">
          <button
            type="button"
            onClick={onSignOut}
            className="text-[#C40D0F] hover:underline"
          >
            Sign out
          </button>
          <Link to={loginPath} className="text-[#6B7280] hover:text-[#050505]">
            Sign in with a different account
          </Link>
        </div>
      </div>
    </div>
  );
}

export function AreaGate({
  area,
  children,
}: {
  area: "admin" | "studio";
  children: React.ReactNode;
}) {
  const { status, role, logout } = useArea(area);

  if (status === "loading") return <LoadingState />;
  if (status === "unauthenticated") return <SignInPrompt area={area} />;
  if (status === "forbidden") {
    return (
      <ForbiddenState
        area={area}
        role={role}
        onSignOut={() => {
          logout();
        }}
      />
    );
  }
  return <>{children}</>;
}
