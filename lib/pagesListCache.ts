import { getPagesSwitcherList, getPages } from "@/services/pageService";

export type PageSwitcherItem = {
  id: number;
  title: string;
  label: string;
  visibility: string;
  slug?: string;
};

const STORAGE_KEY = "webfocus:pages-switcher:v1";
const TTL_MS = 5 * 60_000;

let cachedPages: PageSwitcherItem[] | null = null;
let cachedAt = 0;
let inflight: Promise<PageSwitcherItem[]> | null = null;

function normalizeRows(rows: unknown[]): PageSwitcherItem[] {
  return rows.map((row: any) => ({
    id: Number(row.id),
    title: String(row.title || row.name || "Untitled"),
    label: String(row.label || ""),
    visibility: String(row.visibility || row.status || "Published"),
    slug: row.slug ? String(row.slug) : undefined,
  }));
}

function readStorage(): PageSwitcherItem[] | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as { cachedAt?: number; data?: PageSwitcherItem[] };
    if (!parsed?.cachedAt || !Array.isArray(parsed.data)) return null;
    if (Date.now() - parsed.cachedAt > TTL_MS) return null;

    return parsed.data;
  } catch {
    return null;
  }
}

function writeStorage(data: PageSwitcherItem[]) {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        cachedAt: Date.now(),
        data,
      }),
    );
  } catch {
    // Ignore quota / privacy mode errors.
  }
}

function commitCache(data: PageSwitcherItem[]) {
  cachedPages = data;
  cachedAt = Date.now();
  writeStorage(data);
  return data;
}

export function getPagesSwitcherListCachedSync(): PageSwitcherItem[] | null {
  const now = Date.now();
  if (cachedPages && now - cachedAt < TTL_MS) {
    return cachedPages;
  }

  const stored = readStorage();
  if (stored) {
    cachedPages = stored;
    cachedAt = now;
    return stored;
  }

  return null;
}

export async function getPagesSwitcherListCached(opts?: { force?: boolean }): Promise<PageSwitcherItem[]> {
  const force = opts?.force === true;
  const now = Date.now();

  if (!force) {
    const sync = getPagesSwitcherListCachedSync();
    if (sync) return sync;
  }

  if (!inflight) {
    inflight = getPagesSwitcherList({ silent: true })
      .then((res) => {
        const rows = res.data?.data ?? res.data ?? [];
        return commitCache(normalizeRows(Array.isArray(rows) ? rows : []));
      })
      .catch(() =>
        getPages({ per_page: 200, sort_by: "title", sort_order: "asc" }, { silent: true }).then((res) => {
          const rows = res.data?.data ?? res.data ?? [];
          return commitCache(normalizeRows(Array.isArray(rows) ? rows : []));
        }),
      )
      .catch(() => commitCache([]))
      .finally(() => {
        inflight = null;
      });
  }

  return inflight;
}

export function prefetchPagesSwitcherList() {
  void getPagesSwitcherListCached();
}

export function invalidatePagesSwitcherListCache() {
  cachedPages = null;
  cachedAt = 0;

  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}
