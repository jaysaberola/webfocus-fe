import { getAlbums } from "@/services/albumService";
import { getMenus } from "@/services/menuService";

const TTL_MS = 5 * 60_000;

type CacheEntry<T> = {
  data: T;
  cachedAt: number;
};

let albumsCache: CacheEntry<any[]> | null = null;
let menusCache: CacheEntry<any[]> | null = null;
let albumsInflight: Promise<any[]> | null = null;
let menusInflight: Promise<any[]> | null = null;

function isFresh<T>(entry: CacheEntry<T> | null) {
  return Boolean(entry && Date.now() - entry.cachedAt < TTL_MS);
}

export async function getAlbumsCached(opts?: { force?: boolean }): Promise<any[]> {
  if (!opts?.force && isFresh(albumsCache)) {
    return albumsCache!.data;
  }

  if (!albumsInflight) {
    albumsInflight = getAlbums({ page: 1, per_page: 200 }, { silent: true })
      .then((res) => {
        const data = res.data.data ?? res.data ?? [];
        albumsCache = { data, cachedAt: Date.now() };
        return data;
      })
      .catch(() => {
        albumsCache = { data: [], cachedAt: Date.now() };
        return [];
      })
      .finally(() => {
        albumsInflight = null;
      });
  }

  return albumsInflight;
}

export async function getMenusCached(opts?: { force?: boolean }): Promise<any[]> {
  if (!opts?.force && isFresh(menusCache)) {
    return menusCache!.data;
  }

  if (!menusInflight) {
    menusInflight = getMenus({ page: 1, per_page: 200 }, { silent: true })
      .then((res) => {
        const data = res.data.data ?? res.data ?? [];
        menusCache = { data, cachedAt: Date.now() };
        return data;
      })
      .catch(() => {
        menusCache = { data: [], cachedAt: Date.now() };
        return [];
      })
      .finally(() => {
        menusInflight = null;
      });
  }

  return menusInflight;
}

export function scheduleIdleTask(task: () => void, timeout = 2000) {
  if (typeof window === "undefined") return () => {};
  if ("requestIdleCallback" in window) {
    const id = window.requestIdleCallback(task, { timeout });
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(task, Math.min(timeout, 800));
  return () => window.clearTimeout(id);
}
