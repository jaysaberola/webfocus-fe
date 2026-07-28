import type { PublicMenu, PublicMenuItem } from "@/services/publicPageService";
import { getActiveMenu } from "@/services/publicPageService";
import { resolvePublicMenuHref } from "@/lib/publicMenuLinks";

export const PUBLIC_MENU_STORAGE_KEY = "cms4.publicMenu.v1";

let memoryMenu: PublicMenu | null = null;
let inflight: Promise<PublicMenu> | null = null;

export function readStoredPublicMenu(): PublicMenu | null {
  if (memoryMenu) return memoryMenu;
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(PUBLIC_MENU_STORAGE_KEY);
    if (!raw) return null;
    memoryMenu = JSON.parse(raw) as PublicMenu;
    return memoryMenu;
  } catch {
    return null;
  }
}

export function storePublicMenu(menu: PublicMenu | null) {
  memoryMenu = menu;
  if (typeof window === "undefined") return;

  try {
    if (!menu) window.sessionStorage.removeItem(PUBLIC_MENU_STORAGE_KEY);
    else window.sessionStorage.setItem(PUBLIC_MENU_STORAGE_KEY, JSON.stringify(menu));
  } catch {
    // ignore storage errors
  }
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
