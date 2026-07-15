import axios from "axios";
import type { GetServerSidePropsContext } from "next";
import { AUTH_TOKEN_COOKIE_KEY } from "@/lib/authToken";

const API_BASE_URL = `${(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")}/api`;

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

export const isAdminLikeUser = (user: any) => {
  if (!user || typeof user !== "object") return false;

  if (user.is_admin === true || user.is_admin === 1 || user.isAdmin === true || user.isAdmin === 1) {
    return true;
  }

  const roleCandidates = [
    user.role,
    user.user_type,
    user.type,
    ...(Array.isArray(user.roles)
      ? user.roles.map((role: any) => role?.name ?? role?.role ?? role)
      : []),
  ]
    .map(normalizeRoleName)
    .filter(Boolean);

  return roleCandidates.some((role) => ["admin", "administrator", "super admin", "superadmin"].includes(role));
};

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
  if (isAdminLikeUser(currentUser)) return currentUser;

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
    return isAdminLikeUser(user);
  } catch {
    return false;
  }
};
