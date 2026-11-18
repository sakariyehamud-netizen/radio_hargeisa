export type StaffRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "RADIO_MANAGER"
  | "PRODUCER"
  | "EDITOR"
  | "PRESENTER";

export type AppRole = StaffRole | "USER";

export type AreaType = "admin" | "studio" | "mobile";

export const STAFF_ROLES: StaffRole[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "RADIO_MANAGER",
  "PRODUCER",
  "EDITOR",
  "PRESENTER",
];

export const ALL_ROLES: AppRole[] = [...STAFF_ROLES, "USER"];

export const ROLE_LABELS: Record<AppRole, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Administrator",
  RADIO_MANAGER: "Radio Manager",
  PRODUCER: "Producer",
  EDITOR: "Editor",
  PRESENTER: "Presenter",
  USER: "Listener",
};

export const PERMISSIONS: Record<AppRole, string[]> = {
  SUPER_ADMIN: ["*"],
  ADMIN: [
    "users.read",
    "users.manage",
    "roles.manage",
    "orgs.manage",
    "stations.manage",
    "content.read",
    "content.write",
    "content.publish",
    "media.manage",
    "streams.manage",
    "broadcast.control",
    "broadcast.emergency",
    "ai.run",
    "ai.approve",
    "ads.manage",
    "analytics.read",
    "audit.read",
    "settings.manage",
    "notifications.send",
    "programs.manage",
    "schedules.manage",
  ],
  RADIO_MANAGER: [
    "content.read",
    "content.write",
    "content.publish",
    "media.manage",
    "streams.manage",
    "broadcast.control",
    "broadcast.emergency",
    "ai.run",
    "ai.approve",
    "analytics.read",
    "settings.manage",
    "notifications.send",
    "programs.manage",
    "schedules.manage",
  ],
  PRODUCER: [
    "content.read",
    "content.write",
    "content.publish",
    "media.manage",
    "broadcast.control",
    "ai.run",
    "ai.approve",
    "analytics.read",
    "programs.manage",
    "schedules.manage",
    "notifications.send",
  ],
  EDITOR: ["content.read", "content.write", "ai.run", "ai.approve", "analytics.read"],
  PRESENTER: ["content.read", "content.write", "ai.run", "analytics.read"],
  USER: [],
};

export interface UserLike {
  id?: string;
  email?: string;
  full_name?: string;
  role?: string;
  staff_role?: string | null;
  account_status?: string;
  station_id?: string | null;
}

export function resolveRole(user?: UserLike | null): AppRole {
  if (!user) return "USER";
  if (user.role === "admin" && !user.staff_role) return "SUPER_ADMIN";
  if (user.staff_role && (STAFF_ROLES as string[]).includes(user.staff_role)) {
    return user.staff_role as StaffRole;
  }
  if (user.role === "admin") return "SUPER_ADMIN";
  return "USER";
}

export function isStaffRole(role: AppRole): boolean {
  return role !== "USER";
}

export function isAdminRole(role: AppRole): boolean {
  return role === "SUPER_ADMIN" || role === "ADMIN";
}

export function areaForRole(role: AppRole): AreaType {
  if (isAdminRole(role)) return "admin";
  if (isStaffRole(role)) return "studio";
  return "mobile";
}

export function landingForRole(role: AppRole): string {
  const area = areaForRole(role);
  if (area === "admin") return "/admin/dashboard";
  if (area === "studio") return "/studio/dashboard";
  return "/mobile/home";
}

export function canAccessArea(role: AppRole, area: "admin" | "studio"): boolean {
  if (area === "admin") return isAdminRole(role);
  return isStaffRole(role);
}

export function hasPermission(role: AppRole, perm: string): boolean {
  const perms = PERMISSIONS[role] || [];
  if (perms.includes("*")) return true;
  if (perms.includes(perm)) return true;
  const [prefix] = perm.split(".");
  if (perms.includes(`${prefix}.*`)) return true;
  return false;
}
