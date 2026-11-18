import React from "react";
import { AlertTriangle, type LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E3E5E9] bg-white px-6 py-14 text-center",
        className
      )}
    >
      {Icon && (
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5F6F7] text-[#6B7280]">
          <Icon className="h-6 w-6" />
        </div>
      )}
      <h3 className="text-[15px] font-bold text-[#050505]">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-[13px] text-[#6B7280]">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function IntegrationNotice({
  title,
  detail,
  className,
}: {
  title: string;
  detail: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[#FDE7E7] bg-[#FEF7F7] p-4 flex items-start gap-3",
        className
      )}
    >
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#FDE7E7] text-[#C40D0F]">
        <AlertTriangle className="h-4 w-4" />
      </div>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#C40D0F]">
          {title}
        </p>
        <p className="mt-0.5 text-[13px] text-[#1F2937]">{detail}</p>
      </div>
    </div>
  );
}
