/**
 * Build a storage asset URL that works on localhost and production.
 * Accepts a relative storage path (`banners/foo.jpg`), `/storage/...`, or a full URL
 * from any host and rewrites it using NEXT_PUBLIC_API_URL.
 */
export function resolveStorageAssetUrl(pathOrUrl?: string | null): string | undefined {
  const raw = (pathOrUrl ?? "").toString().trim().replace(/\\/g, "/");
  if (!raw) return undefined;
  if (raw.startsWith("blob:") || raw.startsWith("data:")) return raw;

  // Pass through non-storage absolute URLs (frontend assets, CDN, etc.)
  if (/^https?:\/\//i.test(raw)) {
    const storageMarker = "/storage/";
    const markerIndex = raw.toLowerCase().indexOf(storageMarker);
    if (markerIndex < 0) return raw;

    const storagePath =
      raw.slice(markerIndex + storageMarker.length).split("?")[0]?.split("#")[0] ?? "";
    if (!storagePath) return undefined;

    const configuredBase = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
    const base = configuredBase.endsWith("/api") ? configuredBase.slice(0, -4) : configuredBase;
    if (!base) return `/storage/${storagePath}`;
    return `${base}/storage/${storagePath}`;
  }

  let storagePath = raw;

  if (raw.startsWith("storage/")) {
    storagePath = raw.slice("storage/".length);
  } else if (raw.startsWith("/storage/")) {
    storagePath = raw.slice("/storage/".length);
  }

  storagePath = storagePath.replace(/^\/+/, "").split("?")[0]?.split("#")[0] ?? "";
  if (!storagePath) return undefined;

  const configuredBase = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
  const base = configuredBase.endsWith("/api") ? configuredBase.slice(0, -4) : configuredBase;

  if (!base) return `/storage/${storagePath}`;
  return `${base}/storage/${storagePath}`;
}

export function resolveStorageAssetUrlWithFallback(
  pathOrUrl?: string | null,
  fallback?: string
): string {
  return resolveStorageAssetUrl(pathOrUrl) || fallback || "";
}
