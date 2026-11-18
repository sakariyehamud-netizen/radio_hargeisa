import { useAuth } from "./AuthContext";
import { canAccessArea } from "./rbac";

export function useArea(area: "admin" | "studio") {
  const { user, role, loading, isAuthenticated, logout } = useAuth();
  const allowed = isAuthenticated && canAccessArea(role, area);

  let status: "loading" | "unauthenticated" | "forbidden" | "allowed" = "loading";
  if (!loading) {
    if (!isAuthenticated) status = "unauthenticated";
    else if (!allowed) status = "forbidden";
    else status = "allowed";
  }

  return {
    area,
    status,
    user,
    role,
    loading,
    isAuthenticated,
    allowed,
    logout,
  };
}
