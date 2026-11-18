export const STATION_OFFSET_MIN = 180; // UTC+3 Somaliland East Africa Time

export interface StationNow {
  date: Date;
  dayOfWeek: string;
  hhmm: string;
  minutesSinceMidnight: number;
  iso: string;
}

const JS_DAY_TO_ENUM = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

export function stationNow(base: Date = new Date()): StationNow {
  const utcMs = base.getTime() + base.getTimezoneOffset() * 60_000;
  const stationDate = new Date(utcMs + STATION_OFFSET_MIN * 60_000);
  const hours = stationDate.getHours();
  const minutes = stationDate.getMinutes();
  const hh = String(hours).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  return {
    date: stationDate,
    dayOfWeek: JS_DAY_TO_ENUM[stationDate.getDay()],
    hhmm: `${hh}:${mm}`,
    minutesSinceMidnight: hours * 60 + minutes,
    iso: stationDate.toISOString(),
  };
}

export function hhmmToMinutes(hhmm?: string | null): number {
  if (!hhmm) return 0;
  const [h, m] = hhmm.split(":").map((n) => parseInt(n, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
}

export function formatTime(hhmm?: string | null): string {
  if (!hhmm) return "";
  if (!/^\d{1,2}:\d{2}$/.test(hhmm)) return hhmm;
  const [hRaw, m] = hhmm.split(":");
  const h = parseInt(hRaw, 10);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${suffix}`;
}

export function formatTimeRange(start?: string | null, end?: string | null): string {
  if (!start && !end) return "";
  if (start && end) return `${formatTime(start)} - ${formatTime(end)}`;
  return formatTime(start || end);
}

export function formatDuration(seconds?: number | null): string {
  if (seconds == null || Number.isNaN(seconds) || seconds <= 0) return "0:00";
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function formatClock(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function formatDate(value?: string | Date | null): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function relativeTime(value?: string | Date | null): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diffSec < 45) return "just now";
  const min = Math.floor(diffSec / 60);
  if (min < 60) return `${min}m ago`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(d);
}

export function initials(name?: string | null, email?: string | null): string {
  const source = (name || email || "RH").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}
