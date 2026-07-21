import { websiteService } from "@/services/websiteService";
import { resolveStorageAssetUrl } from "@/lib/storageAssets";

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

export async function getWebsiteSettingsCached(opts?: { force?: boolean }): Promise<WebsiteSettings> {
  const force = opts?.force === true;

  if (!force) {
    const stored = readStoredWebsiteSettings();
    if (stored) return stored;
  }

  if (!inflight) {
    inflight = websiteService
      .getSettings()
      .then((response: any) => {
        const settings = response?.setting ?? response ?? {};
        storeWebsiteSettings(settings);
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
