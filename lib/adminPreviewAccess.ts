import axios from "axios";
import type { GetServerSidePropsContext } from "next";
import { AUTH_TOKEN_COOKIE_KEY, readStoredAuthToken, syncAuthTokenCookieFromStorage } from "@/lib/authToken";
import { getCurrentUserCached, readStoredCurrentUser } from "@/lib/currentUser";

const API_BASE_URL = `${(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")}/api`;

const PREVIEW_PERMISSIONS = new Set([
  "pages.view",
  "pages.edit",
  "news.view",
  "news.edit",
  "dashboard.view",
]);

const CUSTOMER_ROLES = new Set(["customer"]);
const COMMERCE_ONLY_ROLES = new Set([
  "technical support",
  "technical_support",
  "customer care",
  "customer_care",
]);

const parseCookies = (rawCookie: string | undefined) => {
  const result: Record<string, string> = {};
  if (!rawCookie) return result;

  rawCookie.split(";").forEach((chunk) => {
    const index = chunk.indexOf("=");
    if (index < 0) return;
    const key = chunk.slice(0, index).trim();
    const value = chunk.slice(index + 1).trim();
    if (!key) return;
    result[key] = decodeURIComponent(value);
  });

  return result;
};

const normalizeRoleName = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

const getRoleNames = (user: any): string[] => {
  if (!user || typeof user !== "object") return [];
  const roles = [
    user.role,
    user.user_type,
    user.type,
    ...(Array.isArray(user.roles)
      ? user.roles.map((role: any) => (typeof role === "string" ? role : role?.name ?? role?.role))
      : []),
  ]
    .map(normalizeRoleName)
    .filter(Boolean);
  return Array.from(new Set(roles));
};

export const isAdminLikeUser = (user: any) => {
  if (!user || typeof user !== "object") return false;

  if (user.is_admin === true || user.is_admin === 1 || user.isAdmin === true || user.isAdmin === 1) {
    return true;
  }

  return getRoleNames(user).some((role) =>
    ["admin", "administrator", "super admin", "superadmin"].includes(role),
  );
};

const userHasPreviewPermission = (user: any) => {
  const permissions = Array.isArray(user?.permissions) ? user.permissions : [];
  return permissions.some((perm: unknown) => PREVIEW_PERMISSIONS.has(String(perm)));
};

export function canPreviewPrivateContent(user: unknown) {
  if (!user || typeof user !== "object") return false;
  if (isAdminLikeUser(user)) return true;

  const roles = getRoleNames(user);
  if (roles.some((role) => CUSTOMER_ROLES.has(role))) return false;
  if (roles.some((role) => COMMERCE_ONLY_ROLES.has(role))) return false;

  // Any CMS staff role, or users granted page/news view rights.
  if (roles.length > 0) return true;
  return userHasPreviewPermission(user);
}

const getAxiosConfig = (token: string) => ({
  baseURL: API_BASE_URL,
  headers: {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  },
});

const fetchCurrentUserForPreview = async (token: string) => {
  if (!API_BASE_URL || !token) return null;

  const { data: currentUser } = await axios.get("/user", getAxiosConfig(token));
  if (canPreviewPrivateContent(currentUser)) return currentUser;

  const currentUserId = Number(currentUser?.id);
  if (!Number.isFinite(currentUserId) || currentUserId <= 0) {
    return currentUser;
  }

  try {
    const { data } = await axios.get(`/users/${currentUserId}`, getAxiosConfig(token));
    return data?.data ?? data ?? currentUser;
  } catch {
    return currentUser;
  }
};

export const requireAdminPreviewAccess = async (ctx: GetServerSidePropsContext) => {
  ctx.res.setHeader("Cache-Control", "private, no-store, no-cache, must-revalidate");

  const cookies = parseCookies(ctx.req.headers.cookie);
  const token = cookies[AUTH_TOKEN_COOKIE_KEY];
  if (!token) return false;

  try {
    const user = await fetchCurrentUserForPreview(token);
    return canPreviewPrivateContent(user);
  } catch {
    return false;
  }
};

/** Client-side check used when SSR cookie auth is unavailable. */
export async function ensureClientPreviewAccess(): Promise<boolean> {
  syncAuthTokenCookieFromStorage();

  const token = readStoredAuthToken();
  if (!token) return false;

  const stored = readStoredCurrentUser();
  if (canPreviewPrivateContent(stored)) return true;

  try {
    const user = await getCurrentUserCached({ force: false });
    return canPreviewPrivateContent(user);
  } catch {
    return false;
  }
}
