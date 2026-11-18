import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";

export function SettingsGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="px-1 pb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#9CA3AF]">
        {label}
      </p>
      <div className="divide-y divide-[#F0F1F3] overflow-hidden rounded-2xl border border-[#E7E9EC] bg-white">
        {children}
      </div>
    </div>
  );
}

export function SettingsLink({
  to,
  icon: Icon,
  label,
  value,
}: {
  to: string;
  icon: LucideIcon;
  label: string;
  value?: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-[#FAFBFC]"
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#F5F6F7] text-[#050505]">
          <Icon className="h-4 w-4" />
        </span>
        <span className="truncate text-[12.5px] font-bold text-[#050505]">
          {label}
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {value && (
          <span className="text-[11px] font-medium text-[#6B7280]">{value}</span>
        )}
        <ChevronRight className="h-4 w-4 text-[#C4C9CF]" />
      </div>
    </Link>
  );
}

export function SettingsToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3.5">
      <div className="min-w-0">
        <p className="text-[12.5px] font-bold text-[#050505]">{label}</p>
        {description && (
          <p className="mt-0.5 text-[11px] text-[#6B7280]">{description}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-10 shrink-0 rounded-full transition-colors",
          checked ? "bg-[#047422]" : "bg-[#E3E5E9]"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-4" : "translate-x-0"
          )}
        />
      </button>
    </div>
  );
}

export function SettingsChoice({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly string[];
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <div className="px-4 py-3.5">
      <p className="text-[12.5px] font-bold text-[#050505]">{label}</p>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {options.map((opt) => {
          const selected = value === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className={cn(
                "rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors",
                selected
                  ? "bg-[#047422] text-white"
                  : "bg-[#F5F6F7] text-[#4B5563] hover:bg-[#EDEFF1]"
              )}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
