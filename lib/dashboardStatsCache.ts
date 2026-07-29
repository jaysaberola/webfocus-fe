import { getDashboardStats, type DashboardStats } from "@/services/dashboardService";

const STORAGE_KEY = "cms4.dashboardStats.v1";
const TTL_MS = 60_000;

type CachePayload = {
  data: DashboardStats;
  cachedAt: number;
};

let inflight: Promise<DashboardStats> | null = null;

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

function writeCache(data: DashboardStats) {
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

async function fetchStats(): Promise<DashboardStats> {
  const res = await getDashboardStats();
  const data = res.data.data;
  writeCache(data);
  return data;
}

export async function getDashboardStatsCached(opts?: { force?: boolean }): Promise<DashboardStats> {
  const force = opts?.force === true;
  const cached = readCache();

  if (!force && cached && Date.now() - cached.cachedAt < TTL_MS) {
    return cached.data;
  }

  if (!force && cached) {
    if (!inflight) {
      inflight = fetchStats()
        .catch(() => cached.data)
        .finally(() => {
          inflight = null;
        });
    }
    return cached.data;
  }

  if (!inflight) {
    inflight = fetchStats().finally(() => {
      inflight = null;
    });
  }

  return inflight;
}
