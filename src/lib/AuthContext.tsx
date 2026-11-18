import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { auth, googleAuthProvider } from "./firebase";
import {
  apiFetch,
  getStoredToken,
  setAuthTokenProvider,
  setMemoryAuthToken,
  setStoredToken,
} from "./api";
import { resolveRole, type AppRole, type UserLike } from "./rbac";

interface AuthContextValue {
  user: UserLike | null;
  role: AppRole;
  loading: boolean;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ user: UserLike; role: AppRole }>;
  loginWithGoogle: () => Promise<{ user: UserLike; role: AppRole }>;
  demoLogin: (area: "admin" | "studio" | "mobile") => Promise<{ user: UserLike; role: AppRole }>;
  register: (
    email: string,
    password: string,
    fullName?: string
  ) => Promise<{ ok: boolean; email: string; devOtpHint?: string }>;
  verifyOtp: (email: string, code: string) => Promise<{ user: UserLike; role: AppRole }>;
  resendOtp: (email: string) => Promise<{ ok: boolean; devOtpHint?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserLike | null>(null);
  const [role, setRole] = useState<AppRole>("USER");
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = useCallback(async () => {
    const firebaseUser = auth.currentUser;
    if (firebaseUser) {
      try {
        const idToken = await firebaseUser.getIdToken();
        setMemoryAuthToken(idToken);
        const data = await apiFetch<{ user: UserLike | null; role: AppRole }>("/api/auth/me");
        setUser(data.user);
        setRole(data.user ? resolveRole(data.user) : "USER");
        setLoading(false);
        return;
      } catch {
        setMemoryAuthToken(null);
      }
    }

    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setRole("USER");
      setLoading(false);
      return;
    }
    try {
      const data = await apiFetch<{ user: UserLike | null; role: AppRole }>("/api/auth/me");
      setUser(data.user);
      setRole(data.user ? resolveRole(data.user) : "USER");
    } catch (err: any) {
      if (err?.status === 401) {
        setStoredToken(null);
        setMemoryAuthToken(null);
        setUser(null);
        setRole("USER");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setAuthTokenProvider(async () => {
      if (auth.currentUser) {
        return auth.currentUser.getIdToken();
      }
      return null;
    });

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          setMemoryAuthToken(idToken);
          const data = await apiFetch<{ user: UserLike | null; role: AppRole }>("/api/auth/me");
          setUser(data.user);
          setRole(data.user ? resolveRole(data.user) : "USER");
        } catch {
          setMemoryAuthToken(null);
        } finally {
          setLoading(false);
        }
      } else {
        setMemoryAuthToken(null);
        refreshUser();
      }
    });

    return () => {
      unsub();
      setAuthTokenProvider(null);
    };
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiFetch<{ token: string; user: UserLike; role: AppRole }>(
      "/api/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }
    );
    setMemoryAuthToken(null);
    setStoredToken(res.token);
    setUser(res.user);
    setRole(resolveRole(res.user));
    return { user: res.user, role: resolveRole(res.user) };
  }, []);

  const loginWithGoogle = useCallback(async () => {
    const result = await signInWithPopup(auth, googleAuthProvider);
    const idToken = await result.user.getIdToken();
    setMemoryAuthToken(idToken);
    setStoredToken(null);
    const data = await apiFetch<{ user: UserLike | null; role: AppRole }>("/api/auth/me");
    if (!data.user) {
      throw new Error("Could not sync Google account with user directory.");
    }
    const resolved = resolveRole(data.user);
    setUser(data.user);
    setRole(resolved);
    return { user: data.user, role: resolved };
  }, []);

  const demoLogin = useCallback(async (area: "admin" | "studio" | "mobile") => {
    const res = await apiFetch<{ token: string; user: UserLike; role: AppRole }>(
      "/api/auth/demo-login",
      {
        method: "POST",
        body: JSON.stringify({ area }),
      }
    );
    setMemoryAuthToken(null);
    setStoredToken(res.token);
    setUser(res.user);
    setRole(resolveRole(res.user));
    return { user: res.user, role: resolveRole(res.user) };
  }, []);

  const register = useCallback(async (email: string, password: string, fullName?: string) => {
    return apiFetch<{ ok: boolean; email: string; devOtpHint?: string }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, full_name: fullName }),
    });
  }, []);

  const verifyOtp = useCallback(async (email: string, code: string) => {
    const res = await apiFetch<{ token: string; user: UserLike; role: AppRole }>(
      "/api/auth/verify-otp",
      {
        method: "POST",
        body: JSON.stringify({ email, code }),
      }
    );
    setMemoryAuthToken(null);
    setStoredToken(res.token);
    setUser(res.user);
    setRole(resolveRole(res.user));
    return { user: res.user, role: resolveRole(res.user) };
  }, []);

  const resendOtp = useCallback(async (email: string) => {
    return apiFetch<{ ok: boolean; devOtpHint?: string }>("/api/auth/resend-otp", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
    } catch {
      // ignore
    }
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    setMemoryAuthToken(null);
    setStoredToken(null);
    setUser(null);
    setRole("USER");
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        loading,
        isAuthenticated: Boolean(user),
        refreshUser,
        login,
        loginWithGoogle,
        demoLogin,
        register,
        verifyOtp,
        resendOtp,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
