import {
  LayoutGrid,
  Radio,
  Activity,
  Calendar,
  Mic,
  Disc,
  Video,
  Newspaper,
  Users,
  FolderOpen,
  Sparkles,
  Bell,
  BarChart3,
  Settings,
  ShieldCheck,
  UserPlus,
  Building2,
  Megaphone,
  ScrollText,
  Waves,
  History,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  badge?: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const STUDIO_NAV: NavGroup[] = [
  {
    label: "OVERVIEW",
    items: [
      { label: "Dashboard", to: "/studio/dashboard", icon: LayoutGrid },
      { label: "Live Control", to: "/studio/live", icon: Radio },
      { label: "Stream Health", to: "/studio/streams", icon: Activity },
    ],
  },
  {
    label: "SCHEDULE",
    items: [
      { label: "Schedule", to: "/studio/schedule", icon: Calendar },
      { label: "Programs", to: "/studio/programs", icon: Waves },
    ],
  },
  {
    label: "PRODUCTION",
    items: [
      { label: "Episodes", to: "/studio/episodes", icon: Disc },
      { label: "Recordings", to: "/studio/recordings", icon: Mic },
      { label: "Videos", to: "/studio/videos", icon: Video },
      { label: "News", to: "/studio/news", icon: Newspaper },
      { label: "Presenters", to: "/studio/presenters", icon: Users },
      { label: "Media Library", to: "/studio/media", icon: FolderOpen },
    ],
  },
  {
    label: "AI TOOLS",
    items: [{ label: "AI Tools", to: "/studio/ai", icon: Sparkles }],
  },
  {
    label: "OPERATIONS",
    items: [
      { label: "Notifications", to: "/studio/notifications", icon: Bell },
      { label: "Analytics", to: "/studio/analytics", icon: BarChart3 },
      { label: "Settings", to: "/studio/settings", icon: Settings },
    ],
  },
];

export const ADMIN_NAV: NavGroup[] = [
  {
    label: "OVERVIEW",
    items: [{ label: "Dashboard", to: "/admin/dashboard", icon: LayoutGrid }],
  },
  {
    label: "RADIO",
    items: [
      { label: "Live Control", to: "/admin/live", icon: Radio },
      { label: "Streams", to: "/admin/streams", icon: Activity },
      { label: "Schedule", to: "/admin/schedules", icon: Calendar },
      { label: "Broadcast History", to: "/admin/broadcast-history", icon: History },
    ],
  },
  {
    label: "CONTENT",
    items: [
      { label: "Categories", to: "/admin/category", icon: LayoutGrid },
      { label: "Programs", to: "/admin/programs", icon: Waves },
      { label: "Episodes", to: "/admin/episodes", icon: Disc },
      { label: "Videos", to: "/admin/videos", icon: Video },
      { label: "News", to: "/admin/news", icon: Newspaper },
      { label: "Presenters", to: "/admin/presenters", icon: Users },
    ],
  },
  {
    label: "MEDIA",
    items: [{ label: "Media Library", to: "/admin/media", icon: FolderOpen }],
  },
  {
    label: "AI",
    items: [{ label: "AI Operations", to: "/admin/ai", icon: Sparkles }],
  },
  {
    label: "PEOPLE",
    items: [
      { label: "Users", to: "/admin/users", icon: Users },
      { label: "Roles & Permissions", to: "/admin/roles", icon: ShieldCheck },
      { label: "Staff Invitations", to: "/admin/notifications", icon: UserPlus },
    ],
  },
  {
    label: "NETWORK",
    items: [
      { label: "Organizations", to: "/admin/organizations", icon: Building2 },
      { label: "Stations", to: "/admin/stations", icon: Radio },
      { label: "Advertisements", to: "/admin/advertisements", icon: Megaphone },
    ],
  },
  {
    label: "INSIGHTS",
    items: [
      { label: "Analytics", to: "/admin/analytics", icon: BarChart3 },
      { label: "Audit Logs", to: "/admin/audit-logs", icon: ScrollText },
    ],
  },
  {
    label: "CONFIGURE",
    items: [{ label: "Settings", to: "/admin/settings", icon: Settings }],
  },
];
