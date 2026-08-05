import type { PublicMenuItem } from "@/services/publicPageService";

/** Known dev/prod hosts saved in menu/footer targets — strip to pathname at render time. */
const KNOWN_PUBLIC_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "cms4-nextjs.vercel.app",
  "webfocus-fe.vercel.app",
]);

const SKIP_HREF_PREFIX =
  /^(#|mailto:|tel:|sms:|javascript:|data:|blob:)/i;

/**
 * Normalize CMS / Grapes / menu URLs so they work on any host.
 * Examples:
 * - https://webfocus-fe.vercel.app/public/about-us → /public/about-us
 * - http://127.0.0.1:3000/public/services → /public/services
 * - webfocus-fe.vercel.app/public/about-us → /public/about-us
 * - public/about-us → /public/about-us
 * - about-us → /public/about-us
 */
export function normalizePublicHref(href: string): string {
  const target = String(href ?? "").trim();
  if (!target) return "#";
  if (SKIP_HREF_PREFIX.test(target)) return target;

  if (target.startsWith("/") && !target.startsWith("//")) {
    return target;
  }

  if (target.startsWith("//")) {
    try {
      return normalizeParsedUrl(new URL(`https:${target}`), `https:${target}`);
    } catch {
      return target;
    }
  }

  try {
    return normalizeParsedUrl(new URL(target), target);
  } catch {
    // Bare host without protocol: webfocus-fe.vercel.app/public/about-us
    if (/^[a-z0-9.-]+\.[a-z]{2,}([/:?]|$)/i.test(target)) {
      try {
        return normalizeParsedUrl(new URL(`https://${target}`), `https://${target}`);
      } catch {
        // fall through
      }
    }

    if (target.startsWith("public/")) {
      return `/${target}`;
    }

    // Relative slug like "about-us" or "about" from the Grapes canvas
    const clean = target.replace(/^\/+/, "");
    if (clean && !clean.includes("://") && !clean.startsWith("?")) {
      return `/public/${clean}`;
    }

    return `/${clean}`;
  }
}

function normalizeParsedUrl(url: URL, fallback: string): string {
  const host = url.hostname.toLowerCase();
  const isKnownHost = KNOWN_PUBLIC_HOSTS.has(host);
  const isPublicPath = url.pathname.startsWith("/public/");

  if (isKnownHost || isPublicPath) {
    return `${url.pathname || "/"}${url.search}${url.hash}`;
  }

  // External absolute URL — keep as-is
  if (/^https?:$/i.test(url.protocol)) {
    return fallback.startsWith("http") ? fallback : url.toString();
  }

  return `${url.pathname || "/"}${url.search}${url.hash}`;
}

/**
 * Menu items are stored with full URLs (e.g. http://127.0.0.1:3000/public/home).
 * For internal pages, always use a relative path so links work on any domain.
 */
export function resolvePublicMenuHref(item: Pick<PublicMenuItem, "type" | "target">): string {
  const target = String(item.target ?? "").trim();
  if (!target) return "#";

  if (item.type !== "page") {
    return normalizePublicHref(target);
  }

  return normalizePublicHref(target);
}

/** Prefer relative paths when saving menu page items. */
export function buildPublicPageMenuTarget(slug: string): string {
  const clean = slug.replace(/^\/+/, "").replace(/^public\//, "");
  return `/public/${clean}`;
}

/** Full public URL for admin display (Manage Pages, tooltips, copy). */
export function buildPublicPageFullUrl(slug: string, frontendBase?: string | null): string {
  const path = buildPublicPageMenuTarget(slug);
  const base = (frontendBase || process.env.NEXT_PUBLIC_FRONTEND_URL || "")
    .trim()
    .replace(/\/$/, "");
  return base ? `${base}${path}` : path;
}

/** Rewrite every href in Grapes/HTML content to a host-safe public path. */
export function rewritePublicHtmlHrefs(html: string): string {
  if (!html) return "";

  return html.replace(
    /href\s*=\s*(["'])(.*?)\1/gi,
    (_match, quote: string, rawHref: string) => {
      const next = normalizePublicHref(rawHref);
      return `href=${quote}${next}${quote}`;
    }
  );
}
