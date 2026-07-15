export const AUTH_TOKEN_STORAGE_KEY = "auth_token";
export const AUTH_TOKEN_COOKIE_KEY = "cms4_auth_token";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export function readStoredAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setAuthTokenCookie(token: string) {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${AUTH_TOKEN_COOKIE_KEY}=${encodeURIComponent(token)}; Max-Age=${COOKIE_MAX_AGE}; Path=/; SameSite=Lax${secure}`;
}

export function clearAuthTokenCookie() {
  if (typeof document === "undefined") return;
  const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${AUTH_TOKEN_COOKIE_KEY}=; Max-Age=0; Path=/; SameSite=Lax${secure}`;
}

export function storeAuthToken(token: string) {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
    } catch {
      // ignore storage errors
    }
  }
  setAuthTokenCookie(token);
}

export function clearStoredAuthToken() {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    } catch {
      // ignore storage errors
    }
  }
  clearAuthTokenCookie();
}

export function syncAuthTokenCookieFromStorage() {
  const token = readStoredAuthToken();
  if (token) {
    setAuthTokenCookie(token);
  } else {
    clearAuthTokenCookie();
  }
}
