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

export function notifyWebsiteSettingsUpdated() {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new CustomEvent(WEBSITE_SETTINGS_UPDATED_EVENT));
  } catch {
    // ignore
  }
}

let inflight: Promise<WebsiteSettings> | null = null;

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

export async function getWebsiteSettingsCached(opts?: { force?: boolean }): Promise<WebsiteSettings> {
  const force = opts?.force === true;

  if (!force) {
    const stored = readStoredWebsiteSettings();
    if (stored) {
      void refreshWebsiteSettings();
      return stored;
    }
  }

  return refreshWebsiteSettings();
}

async function refreshWebsiteSettings(): Promise<WebsiteSettings> {
  if (!inflight) {
    inflight = fetchWebsiteSettings()
      .then((settings) => {
        storeWebsiteSettings(settings);
        notifyWebsiteSettingsUpdated();
        return settings;
      })
      .finally(() => {
        inflight = null;
      });
  }

  return inflight;
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

  if (!publicBrandingInflight) {
    publicBrandingInflight = websiteService
      .getPublicBranding()
      .then((branding) => {
        const merged = {
          ...(readStoredWebsiteSettings() ?? {}),
          ...branding,
        };
        storeWebsiteSettings(merged);
        return merged;
      })
      .catch(() => readStoredWebsiteSettings() ?? {})
      .finally(() => {
        publicBrandingInflight = null;
      });
  }

  return publicBrandingInflight;
}
