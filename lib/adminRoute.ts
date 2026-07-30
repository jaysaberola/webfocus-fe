import { isPublicSiteRoute } from "@/lib/freshchatConfig";

const AUTH_ROUTES = new Set(["/", "/forgot-password", "/reset-password"]);

export function isAuthRoute(pathname: string) {
  return AUTH_ROUTES.has(pathname);
}

/** Admin CMS routes (excludes login, public site, and auth recovery pages). */
export function isAdminSiteRoute(pathname: string) {
  if (isPublicSiteRoute(pathname)) return false;
  if (isAuthRoute(pathname)) return false;
  return true;
}

/** Styles served from /public/css (not bundled via _app imports). */
export const ADMIN_STYLESHEETS = ["/css/custom.css", "/css/admin.css", "/css/admin-no-hover.css"] as const;

export const ADMIN_FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap";
