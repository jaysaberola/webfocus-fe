import { websiteService } from "@/services/websiteService";
import { resolveStorageAssetUrl } from "@/lib/storageAssets";
import { isPublicSiteRoute } from "@/lib/freshchatConfig";
import { isAdminSiteRoute } from "@/lib/adminRoute";

export type WebsiteSettings = {
  company_logo?: string | null;
  website_name?: string | null;
  company_name?: string | null;
  [key: string]: any;
};

export const WEBSITE_SETTINGS_STORAGE_KEY = "cms4.websiteSettings.v1";
export const WEBSITE_SETTINGS_UPDATED_EVENT = "cms4:website-settings-updated";

const REFRESH_TTL_MS = 5 * 60 * 1000;
const RATE_LIMIT_BACKOFF_MS = 90 * 1000;

let inflight: Promise<WebsiteSettings> | null = null;
let lastFetchedAt = 0;
let rateLimitedUntil = 0;
let staleRefreshScheduled = false;

export function readStoredWebsiteSettings(): WebsiteSettings | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(WEBSITE_SETTINGS_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as WebsiteSettings;
  } catch {
    return null;
  }
}

export function storeWebsiteSettings(settings: WebsiteSettings | null) {
  if (typeof window === "undefined") return;
  try {
    if (!settings) window.localStorage.removeItem(WEBSITE_SETTINGS_STORAGE_KEY);
    else window.localStorage.setItem(WEBSITE_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore storage errors
  }
}

function settingsChanged(a: WebsiteSettings | null, b: WebsiteSettings | null) {
  if (!a || !b) return true;
  try {
    return JSON.stringify(a) !== JSON.stringify(b);
  } catch {
    return true;
  }
}

export function notifyWebsiteSettingsUpdated() {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new CustomEvent(WEBSITE_SETTINGS_UPDATED_EVENT));
  } catch {
    // ignore
  }
}

function shouldUsePublicBrandingEndpoint(): boolean {
  if (typeof window === "undefined") return true;
  const path = window.location.pathname || "";
  if (isPublicSiteRoute(path)) return true;
  return !isAdminSiteRoute(path);
}

async function fetchWebsiteSettings(): Promise<WebsiteSettings> {
  if (shouldUsePublicBrandingEndpoint()) {
    return websiteService.getPublicBranding();
  }

  const response = await websiteService.getSettings();
  return (response as any)?.setting ?? response ?? {};
}

function scheduleStaleRefreshIfNeeded() {
  if (typeof window === "undefined") return;
  if (staleRefreshScheduled || inflight) return;

  const now = Date.now();
  if (now < rateLimitedUntil) return;
  if (now - lastFetchedAt < REFRESH_TTL_MS) return;

  staleRefreshScheduled = true;
  window.setTimeout(() => {
    staleRefreshScheduled = false;
    void refreshWebsiteSettings({ background: true });
  }, 250);
}

async function refreshWebsiteSettings(opts?: {
  force?: boolean;
  background?: boolean;
}): Promise<WebsiteSettings> {
  const now = Date.now();
  const stored = readStoredWebsiteSettings();

  if (now < rateLimitedUntil) {
    return stored ?? {};
  }

  if (!opts?.force && stored && now - lastFetchedAt < REFRESH_TTL_MS) {
    return stored;
  }

  if (!inflight) {
    inflight = fetchWebsiteSettings()
      .then((settings) => {
        lastFetchedAt = Date.now();
        const previous = readStoredWebsiteSettings();
        storeWebsiteSettings(settings);
        if (settingsChanged(previous, settings)) {
          notifyWebsiteSettingsUpdated();
        }
        return settings;
      })
      .catch((err: any) => {
        const status = err?.response?.status;
        if (status === 429) {
          rateLimitedUntil = Date.now() + RATE_LIMIT_BACKOFF_MS;
          if (!opts?.background) {
            console.warn("Website settings refresh paused after rate limit (429). Using cached values.");
          }
        }
        return readStoredWebsiteSettings() ?? {};
      })
      .finally(() => {
        inflight = null;
      });
  }

  return inflight;
}

export async function getWebsiteSettingsCached(opts?: { force?: boolean }): Promise<WebsiteSettings> {
  const force = opts?.force === true;
  const stored = readStoredWebsiteSettings();

  if (!force && stored) {
    scheduleStaleRefreshIfNeeded();
    return stored;
  }

  return refreshWebsiteSettings({ force });
}

export function subscribeWebsiteSettingsUpdated(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const onUpdated = () => cb();
  const onStorage = (e: StorageEvent) => {
    if (e.key === WEBSITE_SETTINGS_STORAGE_KEY) cb();
  };

  window.addEventListener(WEBSITE_SETTINGS_UPDATED_EVENT, onUpdated as any);
  window.addEventListener("storage", onStorage);

  return () => {
    window.removeEventListener(WEBSITE_SETTINGS_UPDATED_EVENT, onUpdated as any);
    window.removeEventListener("storage", onStorage);
  };
}

export function resolveWebsiteAssetUrl(path?: string | null): string | undefined {
  return resolveStorageAssetUrl(path);
}

export function resolveWebsiteFaviconUrl(settings?: WebsiteSettings | null): string | undefined {
  return resolveWebsiteAssetUrl(settings?.website_favicon ?? null);
}

let publicBrandingInflight: Promise<WebsiteSettings> | null = null;

export async function getPublicBrandingCached(opts?: { force?: boolean }): Promise<WebsiteSettings> {
  const force = opts?.force === true;

  if (!force) {
    const stored = readStoredWebsiteSettings();
    if (stored?.website_favicon || stored?.company_logo) return stored;
  }

  const now = Date.now();
  if (now < rateLimitedUntil) {
    return readStoredWebsiteSettings() ?? {};
  }

  if (!publicBrandingInflight) {
    publicBrandingInflight = websiteService
      .getPublicBranding()
      .then((branding) => {
        lastFetchedAt = Date.now();
        const merged = {
          ...(readStoredWebsiteSettings() ?? {}),
          ...branding,
        };
        const previous = readStoredWebsiteSettings();
        storeWebsiteSettings(merged);
        if (settingsChanged(previous, merged)) {
          notifyWebsiteSettingsUpdated();
        }
        return merged;
      })
      .catch((err: any) => {
        if (err?.response?.status === 429) {
          rateLimitedUntil = Date.now() + RATE_LIMIT_BACKOFF_MS;
        }
        return readStoredWebsiteSettings() ?? {};
      })
      .finally(() => {
        publicBrandingInflight = null;
      });
  }

  return publicBrandingInflight;
}
