import { useSyncExternalStore } from "react";
import type { PublicFooter } from "@/services/publicPageService";
import { getFooter } from "@/services/publicPageService";

export const PUBLIC_FOOTER_STORAGE_KEY = "cms4.publicFooter.v1";
export const PUBLIC_FOOTER_UPDATED_EVENT = "cms4:public-footer-updated";

let memoryFooter: PublicFooter | null = null;
let inflight: Promise<PublicFooter | null> | null = null;
let cachedFooterSnapshot: PublicFooter | null = null;
let cachedFooterSnapshotKey = "";

function readFooterFromSessionStorage(): PublicFooter | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(PUBLIC_FOOTER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PublicFooter;
  } catch {
    return null;
  }
}

function computeStoredPublicFooter(): PublicFooter | null {
  if (memoryFooter) return memoryFooter;
  memoryFooter = readFooterFromSessionStorage();
  return memoryFooter;
}

function getPublicFooterSnapshot(): PublicFooter | null {
  const next = computeStoredPublicFooter();
  if (!next) {
    if (cachedFooterSnapshotKey === "empty") return cachedFooterSnapshot;
    cachedFooterSnapshotKey = "empty";
    cachedFooterSnapshot = null;
    return null;
  }

  const nextKey = JSON.stringify({ id: next.id, slug: next.slug });
  if (nextKey === cachedFooterSnapshotKey) return cachedFooterSnapshot;

  cachedFooterSnapshotKey = nextKey;
  cachedFooterSnapshot = next;
  return cachedFooterSnapshot;
}

function subscribePublicFooter(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};

  window.addEventListener(PUBLIC_FOOTER_UPDATED_EVENT, onStoreChange);
  return () => window.removeEventListener(PUBLIC_FOOTER_UPDATED_EVENT, onStoreChange);
}

export function useStoredPublicFooter(): PublicFooter | null {
  return useSyncExternalStore(subscribePublicFooter, getPublicFooterSnapshot, () => null);
}

export function readStoredPublicFooter(): PublicFooter | null {
  return getPublicFooterSnapshot();
}

export function storePublicFooter(footer: PublicFooter | null) {
  memoryFooter = footer;
  cachedFooterSnapshotKey = "";
  if (typeof window === "undefined") return;

  try {
    if (!footer) window.sessionStorage.removeItem(PUBLIC_FOOTER_STORAGE_KEY);
    else window.sessionStorage.setItem(PUBLIC_FOOTER_STORAGE_KEY, JSON.stringify(footer));
  } catch {
    // ignore storage errors
  }

  window.dispatchEvent(new Event(PUBLIC_FOOTER_UPDATED_EVENT));
}

export async function getFooterCached(opts?: { force?: boolean }): Promise<PublicFooter | null> {
  const force = opts?.force === true;

  if (!force) {
    const cached = readStoredPublicFooter();
    if (cached) return cached;
  }

  if (!inflight) {
    inflight = getFooter()
      .then((res) => {
        const footer = res.data?.data ?? null;
        if (footer) storePublicFooter(footer);
        return footer;
      })
      .catch(() => readStoredPublicFooter())
      .finally(() => {
        inflight = null;
      });
  }

  return inflight;
}
