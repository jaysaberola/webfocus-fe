import { readStoredAuthToken } from "@/lib/authToken";
import { readStoredCurrentUser } from "@/lib/currentUser";
import { isAdminLikeUser } from "@/lib/userRoles";
import { getStoredCustomer, type PublicCustomer } from "@/services/publicCustomerService";
import type { User } from "@/services/accountService";

export type PublicAuthState = {
  customer: PublicCustomer | null;
  adminUser: User | null;
};

export function readStoredPublicAuthState(): PublicAuthState {
  if (typeof window === "undefined") {
    return { customer: null, adminUser: null };
  }

  if (!readStoredAuthToken()) {
    return { customer: null, adminUser: null };
  }

  const customer = getStoredCustomer();
  if (customer) {
    return { customer, adminUser: null };
  }

  const adminUser = readStoredCurrentUser();
  if (adminUser && isAdminLikeUser(adminUser)) {
    return { customer: null, adminUser };
  }

  return { customer: null, adminUser: null };
}

export function isPublicSiteUserLoggedIn(): boolean {
  const { customer, adminUser } = readStoredPublicAuthState();
  return Boolean(customer || adminUser);
}

export function scheduleIdleTask(task: () => void, timeout = 2000): () => void {
  if (typeof window === "undefined") return () => {};

  if ("requestIdleCallback" in window) {
    const id = window.requestIdleCallback(task, { timeout });
    return () => window.cancelIdleCallback(id);
  }

  const id = window.setTimeout(task, 0);
  return () => window.clearTimeout(id);
}
