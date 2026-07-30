import { useSyncExternalStore } from "react";
import { readStoredAuthToken } from "@/lib/authToken";
import { readStoredCurrentUser } from "@/lib/currentUser";
import { isStaffUser } from "@/lib/userRoles";
import { getStoredCustomer, type PublicCustomer } from "@/services/publicCustomerService";
import type { User } from "@/services/accountService";

export type PublicAuthState = {
  customer: PublicCustomer | null;
  adminUser: User | null;
};

const EMPTY_AUTH_STATE: PublicAuthState = {
  customer: null,
  adminUser: null,
};

function computeStoredPublicAuthState(): PublicAuthState {
  if (typeof window === "undefined") {
    return EMPTY_AUTH_STATE;
  }

  if (!readStoredAuthToken()) {
    return EMPTY_AUTH_STATE;
  }

  const customer = getStoredCustomer();
  if (customer) {
    return { customer, adminUser: null };
  }

  const adminUser = readStoredCurrentUser();
  if (adminUser && isStaffUser(adminUser)) {
    return { customer: null, adminUser };
  }

  return EMPTY_AUTH_STATE;
}

let cachedAuthSnapshot: PublicAuthState = EMPTY_AUTH_STATE;
let cachedAuthSnapshotKey = "";

function getPublicAuthSnapshot(): PublicAuthState {
  const next = computeStoredPublicAuthState();
  const nextKey =
    next.customer || next.adminUser
      ? JSON.stringify({
          customerId: next.customer?.id ?? null,
          customerEmail: next.customer?.email ?? null,
          customerFname: next.customer?.fname ?? null,
          customerLname: next.customer?.lname ?? null,
          adminId: next.adminUser?.id ?? null,
          adminEmail: next.adminUser?.email ?? null,
          adminAvatar: next.adminUser?.avatar ?? null,
          adminRole: next.adminUser?.role ?? null,
        })
      : "empty";

  if (nextKey === cachedAuthSnapshotKey) {
    return cachedAuthSnapshot;
  }

  cachedAuthSnapshotKey = nextKey;
  cachedAuthSnapshot =
    next.customer || next.adminUser
      ? {
          customer: next.customer,
          adminUser: next.adminUser,
        }
      : EMPTY_AUTH_STATE;

  return cachedAuthSnapshot;
}

export function readStoredPublicAuthState(): PublicAuthState {
  return getPublicAuthSnapshot();
}

export function isPublicSiteUserLoggedIn(): boolean {
  const { customer, adminUser } = readStoredPublicAuthState();
  return Boolean(customer || adminUser);
}

function subscribePublicAuth(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};

  window.addEventListener("public-customer-updated", onStoreChange);
  window.addEventListener("cms4:user-updated", onStoreChange);
  window.addEventListener("storage", onStoreChange);

  return () => {
    window.removeEventListener("public-customer-updated", onStoreChange);
    window.removeEventListener("cms4:user-updated", onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

export function useStoredPublicAuthState(): PublicAuthState {
  return useSyncExternalStore(
    subscribePublicAuth,
    getPublicAuthSnapshot,
    () => EMPTY_AUTH_STATE
  );
}

export function scheduleIdleTask(task: () => void, timeout = 2000): () => void {
  if (typeof window === "undefined") return () => {};

  if ("requestIdleCallback" in window) {
    const id = window.requestIdleCallback(task, { timeout });
    return () => window.cancelIdleCallback(id);
  }

  const id = globalThis.setTimeout(task, 0);
  return () => globalThis.clearTimeout(id);
}
