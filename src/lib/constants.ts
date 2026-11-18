export const BRAND = {
  name: "Radio Hargeysa",
  tagline: "Codka Jamhuuriyadda Somaliland",
  foundedYear: 1942,
  city: "Hargeisa",
  country: "Somaliland",
  green: "#047422",
  red: "#C40D0F",
  black: "#050505",
  version: "2.4.0",
} as const;

export const PROGRAM_CATEGORIES = [
  "NEWS",
  "POLITICS",
  "SPORTS",
  "BUSINESS",
  "EDUCATION",
  "CULTURE",
  "RELIGION",
  "ENTERTAINMENT",
  "AGRICULTURE",
  "TECHNOLOGY",
  "COMMUNITY",
] as const;

export const NEWS_CATEGORIES = [
  "SOMALILAND",
  "SOMALIA",
  "AFRICA",
  "WORLD",
  "POLITICS",
  "BUSINESS",
  "SPORTS",
  "TECHNOLOGY",
  "CULTURE",
  "EDUCATION",
] as const;

export const DAYS_OF_WEEK = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;

export const DAY_SHORT_LABELS: Record<string, string> = {
  MONDAY: "MON",
  TUESDAY: "TUE",
  WEDNESDAY: "WED",
  THURSDAY: "THU",
  FRIDAY: "FRI",
  SATURDAY: "SAT",
  SUNDAY: "SUN",
};

export const EPISODE_STATUSES = [
  "DRAFT",
  "PROCESSING",
  "AI_PROCESSING",
  "PENDING_APPROVAL",
  "SCHEDULED",
  "PUBLISHED",
  "ARCHIVED",
  "REJECTED",
] as const;

export const VIDEO_KINDS = [
  "LIVE",
  "RECORDED",
  "INTERVIEW",
  "NEWS",
  "STUDIO",
] as const;

export const MEDIA_TYPES = [
  "AUDIO",
  "VIDEO",
  "IMAGE",
  "RECORDING",
  "CLIP",
  "THUMBNAIL",
  "DOCUMENT",
] as const;

export const AUDIO_QUALITIES = ["32", "64", "128", "AUTO"] as const;
export const VIDEO_QUALITIES = ["144", "240", "360", "480", "720", "1080", "AUTO"] as const;

export const AD_PLACEMENTS = [
  "MOBILE_HOME",
  "LANDING_SLIDES",
  "AUDIO_PREROLL",
  "VIDEO_PREROLL",
  "NEWS_INLINE",
] as const;

export const AI_KINDS = [
  { value: "TRANSCRIPT", label: "Transcription" },
  { value: "SUMMARY", label: "Summary" },
  { value: "CHAPTERS", label: "Chapters" },
  { value: "TITLE", label: "Title generator" },
  { value: "DESCRIPTION", label: "Description" },
  { value: "KEYWORDS", label: "Keywords" },
  { value: "CAPTION", label: "Social caption" },
] as const;

export const NOTIFICATION_TYPES = [
  { value: "LIVE_STARTED", label: "Live radio" },
  { value: "NEW_EPISODE", label: "Episodes" },
  { value: "NEW_VIDEO", label: "Videos" },
  { value: "BREAKING_NEWS", label: "News" },
  { value: "PROGRAM_STARTING", label: "Program starting" },
  { value: "NEW_PROGRAM", label: "New program" },
  { value: "AI_PROCESSING_COMPLETE", label: "AI output" },
] as const;

export const LANGUAGES = [
  { value: "so", label: "Somali" },
  { value: "en", label: "English" },
  { value: "ar", label: "Arabic" },
] as const;

export function titleCaseCategory(cat?: string | null): string {
  if (!cat) return "";
  return cat
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
