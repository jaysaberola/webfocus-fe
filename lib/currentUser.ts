import { accountService, User } from "@/services/accountService";
import { resolveStorageAssetUrl } from "@/lib/storageAssets";

export const CURRENT_USER_STORAGE_KEY = "cms4.currentUser.v1";
export const CURRENT_USER_UPDATED_EVENT = "cms4:user-updated";

export function readStoredCurrentUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CURRENT_USER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function storeCurrentUser(user: User | null) {
  if (typeof window === "undefined") return;
  try {
    if (!user) window.localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
    else window.localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(user));
  } catch {
    // ignore storage errors
  }
}

export function notifyCurrentUserUpdated() {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new CustomEvent(CURRENT_USER_UPDATED_EVENT));
  } catch {
    // ignore
  }
}

let inflight: Promise<User> | null = null;

export async function getCurrentUserCached(opts?: { force?: boolean }): Promise<User> {
  const force = opts?.force === true;

  if (!force) {
    const stored = readStoredCurrentUser();
    if (stored) return stored;
  }

  if (!inflight) {
    inflight = accountService
      .getCurrentUser()
      .then((user) => {
        storeCurrentUser(user);
        return user;
      })
      .finally(() => {
        inflight = null;
      });
  }

  return inflight;
}

export function subscribeCurrentUserUpdated(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const onUserUpdated = () => cb();
  const onStorage = (e: StorageEvent) => {
    if (e.key === CURRENT_USER_STORAGE_KEY) cb();
  };

  window.addEventListener(CURRENT_USER_UPDATED_EVENT, onUserUpdated as any);
  window.addEventListener("storage", onStorage);

  return () => {
    window.removeEventListener(CURRENT_USER_UPDATED_EVENT, onUserUpdated as any);
    window.removeEventListener("storage", onStorage);
  };
}

export function resolveAvatarUrl(avatar?: string | null): string | undefined {
  return resolveStorageAssetUrl(avatar);
}

export function initialsForUser(user: Partial<User> | null | undefined): string {
  const fname = (user?.fname || "").trim();
  const lname = (user?.lname || "").trim();
  const email = (user as any)?.email ? String((user as any).email) : "";

  const initials = fname && lname ? `${fname[0]}${lname[0]}` : fname?.[0] || lname?.[0] || email?.[0] || "U";
  return initials.toUpperCase();
}
