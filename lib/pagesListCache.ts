import { getPages } from "@/services/pageService";

export type PageSwitcherItem = {
  id: number;
  title: string;
  label: string;
  visibility: string;
  slug?: string;
};

const TTL_MS = 60_000;

let cachedPages: PageSwitcherItem[] | null = null;
let cachedAt = 0;
let inflight: Promise<PageSwitcherItem[]> | null = null;

export async function getPagesSwitcherListCached(opts?: { force?: boolean }): Promise<PageSwitcherItem[]> {
  const force = opts?.force === true;
  const now = Date.now();

  if (!force && cachedPages && now - cachedAt < TTL_MS) {
    return cachedPages;
  }

  if (!inflight) {
    inflight = getPages({ per_page: 200, sort_by: "title", sort_order: "asc" }, { silent: true })
      .then((res) => {
        const rows = res.data?.data ?? res.data ?? [];
        cachedPages = rows.map((row: any) => ({
          id: Number(row.id),
          title: String(row.title || row.name || "Untitled"),
          label: String(row.label || ""),
          visibility: String(row.visibility || "Published"),
          slug: row.slug ? String(row.slug) : undefined,
        }));
        cachedAt = Date.now();
        return cachedPages;
      })
      .catch(() => {
        cachedPages = [];
        cachedAt = Date.now();
        return cachedPages;
      })
      .finally(() => {
        inflight = null;
      });
  }

  return inflight;
}

export function invalidatePagesSwitcherListCache() {
  cachedPages = null;
  cachedAt = 0;
}
