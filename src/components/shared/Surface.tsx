import React from "react";
import { cn } from "../../lib/utils";
import type { LucideIcon } from "lucide-react";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div>
        {eyebrow && (
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#047422]">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-1 text-[24px] sm:text-[28px] font-extrabold tracking-[-0.02em] text-[#050505]">
          {title}
        </h1>
        {description && (
          <p className="mt-1 max-w-2xl text-[13px] text-[#6B7280] leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>
      )}
    </div>
  );
}

export function SectionCard({
  title,
  description,
  actions,
  padded = true,
  children,
  className,
}: {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  padded?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-[#E7E9EC] bg-white overflow-hidden",
        className
      )}
    >
      {(title || description || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F0F1F3] px-5 py-4">
          <div>
            {title && (
              <h2 className="text-[14px] font-bold text-[#050505]">{title}</h2>
            )}
            {description && (
              <p className="mt-0.5 text-[12px] text-[#6B7280]">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={padded ? "p-5" : ""}>{children}</div>
    </section>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
  className,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  tone?: "default" | "brand" | "live";
  className?: string;
}) {
  const iconColors =
    tone === "live"
      ? "bg-[#FDE7E7] text-[#C40D0F]"
      : tone === "brand"
        ? "bg-[#E7F5EA] text-[#047422]"
        : "bg-[#F5F6F7] text-[#6B7280]";

  return (
    <div
      className={cn(
        "rounded-2xl border border-[#E7E9EC] bg-white p-4 flex flex-col justify-between",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#6B7280]">
          {label}
        </span>
        {Icon && (
          <span
            className={cn(
              "inline-flex h-7 w-7 items-center justify-center rounded-lg",
              iconColors
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
      <div className="mt-2.5 text-[26px] font-extrabold tracking-[-0.02em] text-[#050505] tabular-nums">
        {value}
      </div>
      {hint && <p className="mt-1 text-[11px] text-[#9CA3AF]">{hint}</p>}
    </div>
  );
}

export function ToolbarButton({
  variant = "primary",
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "danger" | "outline" | "ghost" | "dark";
}) {
  const styles: Record<string, string> = {
    primary: "bg-[#047422] text-white hover:bg-[#035A1B]",
    danger: "bg-[#C40D0F] text-white hover:bg-[#A10B0D]",
    dark: "bg-[#050505] text-white hover:bg-[#1F2937]",
    outline:
      "bg-white text-[#050505] border border-[#E7E9EC] hover:bg-[#F5F6F7]",
    ghost: "bg-[#F5F6F7] text-[#1F2937] hover:bg-[#EDEFF1]",
  };

  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-bold transition-colors whitespace-nowrap shrink-0 disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98]",
        styles[variant],
        className
      )}
    >
      {children}
    </button>
  );
}
