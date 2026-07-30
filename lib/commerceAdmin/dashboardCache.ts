import { fetchCommerceDashboard, type CommerceDashboardData } from "@/services/commerceAdminService";

const STORAGE_KEY = "cms4.commerceDashboard.v1";
const TTL_MS = 60_000;

type CachePayload = {
  data: CommerceDashboardData;
  cachedAt: number;
};

let inflight: Promise<CommerceDashboardData> | null = null;

function readCache(): CachePayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachePayload;
    if (!parsed?.data || !parsed.cachedAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(data: CommerceDashboardData) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        data,
        cachedAt: Date.now(),
      } satisfies CachePayload)
    );
  } catch {
    // ignore
  }
}

async function fetchDashboard(): Promise<CommerceDashboardData> {
  const data = await fetchCommerceDashboard();
  writeCache(data);
  return data;
}

export function readCommerceDashboardCache(): CommerceDashboardData | null {
  const cached = readCache();
  if (!cached) return null;
  if (Date.now() - cached.cachedAt >= TTL_MS) return cached.data;
  return cached.data;
}

export async function getCommerceDashboardCached(opts?: { force?: boolean }): Promise<CommerceDashboardData> {
  const force = opts?.force === true;
  const cached = readCache();

  if (!force && cached && Date.now() - cached.cachedAt < TTL_MS) {
    return cached.data;
  }

  if (!force && cached) {
    if (!inflight) {
      inflight = fetchDashboard()
        .catch(() => cached.data)
        .finally(() => {
          inflight = null;
        });
    }
    return cached.data;
  }

  if (!inflight) {
    inflight = fetchDashboard().finally(() => {
      inflight = null;
    });
  }

  return inflight;
}
