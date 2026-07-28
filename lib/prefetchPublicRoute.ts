import type { NextRouter } from "next/router";

const prefetched = new Set<string>();

export function prefetchPublicRoute(router: NextRouter, href: string) {
  const path = (href || "").trim();
  if (!path || path === "#" || /^https?:\/\//i.test(path)) return;
  if (prefetched.has(path)) return;

  prefetched.add(path);

  try {
    void router.prefetch(path);
  } catch {
    prefetched.delete(path);
  }
}

export function prefetchPublicRoutes(router: NextRouter, hrefs: string[]) {
  hrefs.forEach((href) => prefetchPublicRoute(router, href));
}

export const CORE_PUBLIC_ROUTES = [
  "/public/home",
  "/public/about-us",
  "/public/services",
  "/public/news",
  "/public/contact-us",
];
