import React from "react";
import { Radio } from "lucide-react";

export const CATEGORY_THEMES = [
  { value: "green", label: "Mint Green" },
  { value: "rose", label: "Soft Rose" },
  { value: "blue", label: "Sky Blue" },
  { value: "amber", label: "Warm Amber" },
] as const;

export const CATEGORY_ICONS = [
  { value: "newspaper", label: "News (Newspaper)" },
  { value: "landmark", label: "Politics (Capitol)" },
  { value: "briefcase", label: "Business (Briefcase)" },
  { value: "graduation-cap", label: "Education (Grad Cap)" },
  { value: "drum", label: "Culture (Heritage Drum)" },
  { value: "moon", label: "Religion (Mosque / Crescent)" },
  { value: "music", label: "Entertainment (Music)" },
  { value: "sprout", label: "Agriculture (Sprout)" },
  { value: "laptop", label: "Technology (Laptop)" },
  { value: "users", label: "Community (People)" },
  { value: "trophy", label: "Sports (Trophy)" },
  { value: "radio", label: "General (Radio)" },
] as const;

export function getThemeWaveColors(theme?: string) {
  switch (theme) {
    case "rose":
      return {
        bg: "from-[#FFFDFD] via-[#FFF6F6] to-[#FDE7E8]",
        waveBack: "#F8D2D4",
        waveFront: "#F2BFC2",
        dot: "#C40D0F",
      };
    case "blue":
      return {
        bg: "from-[#FCFEFF] via-[#F2F8FD] to-[#E1EFFB]",
        waveBack: "#CBE3FA",
        waveFront: "#B3D6F7",
        dot: "#1D4ED8",
      };
    case "amber":
      return {
        bg: "from-[#FFFDF9] via-[#FEF8EC] to-[#FBEED4]",
        waveBack: "#F7DFAF",
        waveFront: "#F3D192",
        dot: "#B45309",
      };
    case "green":
    default:
      return {
        bg: "from-[#FCFEFD] via-[#F3FAF5] to-[#DFEFE4]",
        waveBack: "#CBE6D4",
        waveFront: "#B7DBC3",
        dot: "#047422",
      };
  }
}

export function CategoryIconGraphic({
  iconName,
  imageUrl,
  name,
  className = "h-8 w-8",
}: {
  iconName?: string;
  imageUrl?: string;
  name?: string;
  className?: string;
}) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name || "Category"}
        referrerPolicy="no-referrer"
        className={`${className} rounded-lg object-cover shadow-xs`}
      />
    );
  }

  switch (iconName) {
    case "newspaper":
      return (
        <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
          <rect x="7" y="8" width="28" height="32" rx="3" fill="#E5E7EB" stroke="#374151" strokeWidth="2" />
          <rect x="35" y="13" width="6" height="27" rx="2" fill="#D1D5DB" stroke="#374151" strokeWidth="2" />
          <rect x="11" y="13" width="20" height="5" rx="1" fill="#1F2937" />
          <rect x="11" y="21" width="9" height="9" rx="1" fill="#9CA3AF" />
          <line x1="23" y1="22" x2="31" y2="22" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" />
          <line x1="23" y1="26" x2="31" y2="26" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" />
          <line x1="23" y1="30" x2="31" y2="30" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" />
          <line x1="11" y1="34" x2="31" y2="34" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "landmark":
      return (
        <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
          <polygon points="24,7 7,17 41,17" fill="#D1D5DB" stroke="#374151" strokeWidth="2" strokeLinejoin="round" />
          <rect x="9" y="17" width="30" height="3.5" fill="#9CA3AF" stroke="#374151" strokeWidth="1.5" />
          <rect x="12" y="20.5" width="4" height="14" fill="#E5E7EB" stroke="#374151" strokeWidth="1.5" />
          <rect x="22" y="20.5" width="4" height="14" fill="#E5E7EB" stroke="#374151" strokeWidth="1.5" />
          <rect x="32" y="20.5" width="4" height="14" fill="#E5E7EB" stroke="#374151" strokeWidth="1.5" />
          <rect x="7" y="34.5" width="34" height="4" rx="1" fill="#9CA3AF" stroke="#374151" strokeWidth="1.5" />
          <rect x="5" y="38.5" width="38" height="3.5" rx="1" fill="#6B7280" stroke="#374151" strokeWidth="1.5" />
        </svg>
      );
    case "briefcase":
      return (
        <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
          <path d="M18 14 V10 C18 8.9 18.9 8 20 8 H28 C29.1 8 30 8.9 30 10 V14" fill="none" stroke="#78350F" strokeWidth="2.5" />
          <rect x="7" y="14" width="34" height="25" rx="4" fill="#B45309" stroke="#78350F" strokeWidth="2" />
          <path d="M7 22 Q24 27 41 22" fill="none" stroke="#78350F" strokeWidth="2" />
          <rect x="21" y="21" width="6" height="5" rx="1" fill="#FBBF24" stroke="#78350F" strokeWidth="1.5" />
        </svg>
      );
    case "graduation-cap":
      return (
        <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
          <polygon points="24,10 5,19 24,28 43,19" fill="#1F2937" stroke="#050505" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M13 23 V32 C13 35.5 35 35.5 35 32 V23" fill="#374151" stroke="#050505" strokeWidth="1.8" />
          <line x1="39" y1="21" x2="39" y2="33" stroke="#F59E0B" strokeWidth="2.2" />
          <circle cx="39" cy="34.5" r="2.2" fill="#F59E0B" />
        </svg>
      );
    case "drum":
      return (
        <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
          <path d="M10 17 L14 36 C15 39 33 39 34 36 L38 17 Z" fill="#C2410C" stroke="#7C2D12" strokeWidth="2" />
          <ellipse cx="24" cy="17" rx="14" ry="5" fill="#FDE68A" stroke="#7C2D12" strokeWidth="2" />
          <path d="M12 22 L17 36 M20 22 L20 38 M28 22 L28 38 M36 22 L31 36" stroke="#F59E0B" strokeWidth="1.8" />
        </svg>
      );
    case "moon":
      return (
        <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
          <path d="M12 24 C12 16 24 11 24 11 C24 11 36 16 36 24 Z" fill="#16A34A" stroke="#14532D" strokeWidth="1.8" />
          <rect x="10" y="24" width="28" height="15" rx="1.5" fill="#F3F4F6" stroke="#14532D" strokeWidth="1.8" />
          <path d="M21 39 V31 C21 29.3 27 29.3 27 31 V39" fill="#15803D" />
          <rect x="6" y="18" width="4" height="21" fill="#E5E7EB" stroke="#14532D" strokeWidth="1.5" />
          <rect x="38" y="18" width="4" height="21" fill="#E5E7EB" stroke="#14532D" strokeWidth="1.5" />
          <line x1="24" y1="6" x2="24" y2="11" stroke="#F59E0B" strokeWidth="2" />
          <circle cx="24" cy="6" r="1.8" fill="#F59E0B" />
        </svg>
      );
    case "music":
      return (
        <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
          <path d="M18 33 V13 L36 9 V29" fill="none" stroke="#6D28D9" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="18" y1="18" x2="36" y2="14" stroke="#6D28D9" strokeWidth="3" />
          <circle cx="14" cy="34" r="5" fill="#7C3AED" />
          <circle cx="32" cy="30" r="5" fill="#7C3AED" />
        </svg>
      );
    case "sprout":
      return (
        <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
          <ellipse cx="24" cy="38" rx="13" ry="3.5" fill="#78350F" />
          <path d="M24 38 V21" stroke="#15803D" strokeWidth="3" strokeLinecap="round" />
          <path d="M24 26 C15 26 11 19 11 14 C18 14 24 18 24 26 Z" fill="#22C55E" stroke="#15803D" strokeWidth="1.8" />
          <path d="M24 22 C33 22 37 15 37 10 C30 10 24 14 24 22 Z" fill="#16A34A" stroke="#15803D" strokeWidth="1.8" />
        </svg>
      );
    case "laptop":
      return (
        <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
          <rect x="10" y="11" width="28" height="20" rx="2.5" fill="#1E293B" stroke="#0F172A" strokeWidth="2" />
          <rect x="13" y="14" width="22" height="14" rx="1" fill="#38BDF8" />
          <path d="M6 32 H42 L39 38 H9 Z" fill="#94A3B8" stroke="#334155" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      );
    case "users":
      return (
        <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
          <circle cx="15" cy="18" r="4.5" fill="#15803D" />
          <path d="M8 34 C8 28 22 28 22 34 Z" fill="#16A34A" />
          <circle cx="33" cy="18" r="4.5" fill="#15803D" />
          <path d="M26 34 C26 28 40 28 40 34 Z" fill="#16A34A" />
          <circle cx="24" cy="15" r="5.5" fill="#047422" stroke="#FFFFFF" strokeWidth="1.5" />
          <path d="M14 37 C14 29 34 29 34 37 Z" fill="#047422" stroke="#FFFFFF" strokeWidth="1.5" />
        </svg>
      );
    case "trophy":
      return (
        <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
          <path d="M13 11 H29 V21 C29 26 25.5 29 21 29 C16.5 29 13 26 13 21 Z" fill="#F59E0B" stroke="#B45309" strokeWidth="1.8" />
          <path d="M13 14 H9 C9 19 11 21 13 21" fill="none" stroke="#B45309" strokeWidth="2" />
          <path d="M29 14 H33 C33 19 31 21 29 21" fill="none" stroke="#B45309" strokeWidth="2" />
          <rect x="19" y="29" width="4" height="6" fill="#D97706" />
          <rect x="14" y="35" width="14" height="4" rx="1.5" fill="#B45309" />
          <circle cx="35" cy="32" r="7" fill="#FFFFFF" stroke="#1F2937" strokeWidth="1.8" />
          <polygon points="35,28 38,30.5 37,34 33,34 32,30.5" fill="#1F2937" />
        </svg>
      );
    default:
      return <Radio className={`${className} text-[#047422]`} />;
  }
}
