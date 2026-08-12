import type { HostingPlanType } from "@/lib/servicesCatalog";
import type { PublicHostingAddon, PublicHostingPlan } from "@/services/publicHostingService";

export const PUBLIC_HOSTING_CACHE_KEY = "cms4.publicHosting.v2";

export type PublicHostingCache = {
  plans: Partial<Record<HostingPlanType, PublicHostingPlan[]>>;
  typeAddons: Partial<Record<HostingPlanType, PublicHostingAddon[]>>;
  universalAddons: PublicHostingAddon[];
};

export function readPublicHostingCache(): PublicHostingCache | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(PUBLIC_HOSTING_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PublicHostingCache;
  } catch {
    return null;
  }
}

export function storePublicHostingCache(cache: PublicHostingCache) {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(PUBLIC_HOSTING_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // ignore storage errors
  }
}

export function readCachedHostingPlans(type: HostingPlanType): PublicHostingPlan[] | null {
  const cache = readPublicHostingCache();
  const plans = cache?.plans?.[type];
  return plans?.length ? plans : null;
}

export function readCachedHostingTypeAddons(type: HostingPlanType): PublicHostingAddon[] | null {
  const cache = readPublicHostingCache();
  const addons = cache?.typeAddons?.[type];
  return addons?.length ? addons : null;
}

export function readCachedUniversalHostingAddons(): PublicHostingAddon[] | null {
  const cache = readPublicHostingCache();
  return cache?.universalAddons?.length ? cache.universalAddons : null;
}
