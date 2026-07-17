import type { PublicMenuItem } from "@/services/publicPageService";

/** Known dev/prod hosts saved in menu targets — strip to pathname at render time. */
const KNOWN_MENU_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "cms4-nextjs.vercel.app",
  "webfocus-fe.vercel.app",
]);

/**
 * Menu items are stored with full URLs (e.g. http://127.0.0.1:3000/public/home).
 * For internal pages, always use a relative path so links work on any domain.
 */
export function resolvePublicMenuHref(item: Pick<PublicMenuItem, "type" | "target">): string {
  const target = String(item.target ?? "").trim();
  if (!target) return "#";

  if (item.type !== "page") {
    return target;
  }

  if (target.startsWith("/")) {
    return target;
  }

  try {
    const url = new URL(target);
    if (KNOWN_MENU_HOSTS.has(url.hostname) || url.pathname.startsWith("/public/")) {
      return url.pathname || "/";
    }
    return url.pathname.startsWith("/") ? url.pathname : `/${url.pathname}`;
  } catch {
    if (target.startsWith("public/")) return `/${target}`;
    return `/public/${target.replace(/^\/+/, "")}`;
  }
}

/** Prefer relative paths when saving menu page items. */
export function buildPublicPageMenuTarget(slug: string): string {
  const clean = slug.replace(/^\/+/, "").replace(/^public\//, "");
  return `/public/${clean}`;
}
