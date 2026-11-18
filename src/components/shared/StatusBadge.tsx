import React from "react";
import { cn } from "../../lib/utils";

type StatusTone =
  | "live"
  | "success"
  | "warning"
  | "info"
  | "neutral"
  | "danger";

const STATUS_TONE_MAP: Record<string, StatusTone> = {
  LIVE: "live",
  EMERGENCY: "live",
  ACTIVE: "success",
  SUCCESS: "success",
  PUBLISHED: "success",
  APPROVED: "success",
  READY: "success",
  GOOD: "success",
  SAVED: "success",
  ACCEPTED: "success",
  GENERATED: "success",
  PENDING: "warning",
  PENDING_APPROVAL: "warning",
  DEGRADED: "warning",
  PAUSED: "warning",
  SUGGESTED: "warning",
  SCHEDULED: "info",
  PROCESSING: "info",
  AI_PROCESSING: "info",
  DOWNLOADING: "info",
  QUEUED: "info",
  COMPLETE: "info",
  DRAFT: "neutral",
  OFFLINE: "neutral",
  ARCHIVED: "neutral",
  INACTIVE: "neutral",
  ENDED: "neutral",
  IDLE: "neutral",
  REVOKED: "neutral",
  REJECTED: "danger",
  ERROR: "danger",
  SUSPENDED: "danger",
  DOWN: "danger",
  FAILED: "danger",
  CANCELLED: "danger",
};

const TONE_CLASSES: Record<StatusTone, string> = {
  live: "bg-[#C40D0F] text-white",
  success: "bg-[#E7F5EA] text-[#047422]",
  warning: "bg-[#FEF3C7] text-[#92400E]",
  info: "bg-[#E0EDFF] text-[#1D4ED8]",
  neutral: "bg-[#F1F2F4] text-[#4B5563]",
  danger: "bg-[#FDE7E7] text-[#C40D0F]",
};

export function StatusBadge({
  status,
  className,
}: {
  status?: string | null;
  className?: string;
}) {
  const key = (status || "DRAFT").toUpperCase();
  const tone = STATUS_TONE_MAP[key] || "neutral";
  const isLive = key === "LIVE" || key === "EMERGENCY";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] whitespace-nowrap shrink-0",
        TONE_CLASSES[tone],
        className
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full bg-current",
          isLive && "live-dot"
        )}
      />
      <span>{key.replace(/_/g, " ")}</span>
    </span>
  );
}
