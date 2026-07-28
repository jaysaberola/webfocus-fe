import { useSyncExternalStore } from "react";
import type { PublicMenu, PublicMenuItem } from "@/services/publicPageService";
import { getActiveMenu } from "@/services/publicPageService";
import { resolvePublicMenuHref } from "@/lib/publicMenuLinks";

export const PUBLIC_MENU_STORAGE_KEY = "cms4.publicMenu.v1";
export const PUBLIC_MENU_UPDATED_EVENT = "cms4:public-menu-updated";

let memoryMenu: PublicMenu | null = null;
let inflight: Promise<PublicMenu | null> | null = null;
let cachedMenuSnapshot: PublicMenu | null = null;
let cachedMenuSnapshotKey = "";

function readMenuFromSessionStorage(): PublicMenu | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(PUBLIC_MENU_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PublicMenu;
  } catch {
    return null;
  }
}

function computeStoredPublicMenu(): PublicMenu | null {
  if (memoryMenu) return memoryMenu;
  memoryMenu = readMenuFromSessionStorage();
  return memoryMenu;
}

function getPublicMenuSnapshot(): PublicMenu | null {
  const next = computeStoredPublicMenu();
  if (!next) {
    if (cachedMenuSnapshotKey === "empty") return cachedMenuSnapshot;
    cachedMenuSnapshotKey = "empty";
    cachedMenuSnapshot = null;
    return null;
  }

  const nextKey = JSON.stringify({
    id: next.id,
    items: next.items.map((item) => ({
      id: item.id,
      label: item.label,
      target: item.target,
      type: item.type,
    })),
  });

  if (nextKey === cachedMenuSnapshotKey) return cachedMenuSnapshot;

  cachedMenuSnapshotKey = nextKey;
  cachedMenuSnapshot = next;
  return cachedMenuSnapshot;
}

function subscribePublicMenu(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};

  window.addEventListener(PUBLIC_MENU_UPDATED_EVENT, onStoreChange);
  return () => window.removeEventListener(PUBLIC_MENU_UPDATED_EVENT, onStoreChange);
}

export function useStoredPublicMenu(): PublicMenu | null {
  return useSyncExternalStore(subscribePublicMenu, getPublicMenuSnapshot, () => null);
}

export function readStoredPublicMenu(): PublicMenu | null {
  return getPublicMenuSnapshot();
}

export function storePublicMenu(menu: PublicMenu | null) {
  memoryMenu = menu;
  cachedMenuSnapshotKey = "";
  if (typeof window === "undefined") return;

  try {
    if (!menu) window.sessionStorage.removeItem(PUBLIC_MENU_STORAGE_KEY);
    else window.sessionStorage.setItem(PUBLIC_MENU_STORAGE_KEY, JSON.stringify(menu));
  } catch {
    // ignore storage errors
  }

  window.dispatchEvent(new Event(PUBLIC_MENU_UPDATED_EVENT));
}

export async function getActiveMenuCached(opts?: { force?: boolean }): Promise<PublicMenu | null> {
  const force = opts?.force === true;

  if (!force) {
    const cached = readStoredPublicMenu();
    if (cached) return cached;
  }

  if (!inflight) {
    inflight = getActiveMenu()
      .then((res) => {
        const menu = res.data?.data ?? null;
        if (menu) storePublicMenu(menu);
        return menu;
      })
      .catch(() => readStoredPublicMenu())
      .finally(() => {
        inflight = null;
      });
  }

  return inflight;
}

export function collectPublicMenuHrefs(items: PublicMenuItem[] = []): string[] {
  const hrefs = new Set<string>();

  const walk = (rows: PublicMenuItem[]) => {
    rows.forEach((item) => {
      if (item.type === "page") {
        const href = resolvePublicMenuHref(item);
        if (href.startsWith("/") && !href.startsWith("//")) {
          hrefs.add(href);
        }
      }
      if (item.children?.length) walk(item.children);
    });
  };

  walk(items);
  return Array.from(hrefs);
}
