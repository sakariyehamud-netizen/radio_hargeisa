const TOKEN_KEY = "rh_token";

// In-memory Firebase ID token (never persisted to localStorage)
let memoryFirebaseToken: string | null = null;
let tokenProvider: (() => Promise<string | null>) | null = null;

export function setMemoryAuthToken(token: string | null) {
  memoryFirebaseToken = token;
}

export function setAuthTokenProvider(fn: (() => Promise<string | null>) | null) {
  tokenProvider = fn;
}

export function getStoredToken(): string | null {
  if (memoryFirebaseToken) return memoryFirebaseToken;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore storage errors
  }
}

export async function apiFetch<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  let token = memoryFirebaseToken;
  if (!token && tokenProvider) {
    try {
      token = await tokenProvider();
      memoryFirebaseToken = token;
    } catch {
      token = null;
    }
  }
  if (!token) {
    token = getStoredToken();
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const method = (options.method || "GET").toUpperCase();
  let res = await fetch(url, {
    ...options,
    headers,
  });
  if (method === "GET" && (res.status === 502 || res.status === 503)) {
    await new Promise((r) => setTimeout(r, 600));
    res = await fetch(url, {
      ...options,
      headers,
    });
  }
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (!res.ok) {
    const err: any = new Error(data?.error || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data as T;
}

export function trackAnalyticsEvent(payload: {
  event_type:
    | "APP_OPEN"
    | "LIVE_PLAY"
    | "AUDIO_PLAY"
    | "VIDEO_PLAY"
    | "EPISODE_PLAY"
    | "DOWNLOAD"
    | "FAVORITE"
    | "FOLLOW"
    | "SHARE"
    | "SEARCH"
    | "LISTEN_DURATION"
    | "WATCH_DURATION";
  item_type?: string;
  item_id?: string;
  label?: string;
  duration_seconds?: number;
}) {
  apiFetch("/api/content/track", {
    method: "POST",
    body: JSON.stringify(payload),
  }).catch(() => {});
}
