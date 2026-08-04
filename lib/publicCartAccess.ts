import { readStoredAuthToken } from "@/lib/authToken";
import { readStoredCurrentUser } from "@/lib/currentUser";
import { getStoredCustomer } from "@/services/publicCustomerService";
import { isCustomerUser, isStaffUser } from "@/lib/userRoles";

export const PUBLIC_CART_CLIENT_ONLY_MESSAGE =
  "Only Client accounts can add items to the cart and complete checkout. Please sign in with a Client account to continue.";

export const PUBLIC_CART_STAFF_BLOCKED_MESSAGE =
  "Admin and staff accounts cannot use the cart. For testing, please create and use a Client account.";

export function isStaffCartBlocked(): boolean {
  const staffUser = readStoredCurrentUser();
  return Boolean(staffUser && isStaffUser(staffUser));
}

export function getStaffCartBlockReason(): string | null {
  return isStaffCartBlocked() ? PUBLIC_CART_STAFF_BLOCKED_MESSAGE : null;
}

export function canUsePublicCart(): boolean {
  if (isStaffCartBlocked()) return false;
  const customer = getStoredCustomer();
  return Boolean(readStoredAuthToken() && customer && isCustomerUser(customer));
}

export function getAddToCartBlockReason(): string | null {
  if (isStaffCartBlocked()) return PUBLIC_CART_STAFF_BLOCKED_MESSAGE;
  if (!canUsePublicCart()) return PUBLIC_CART_CLIENT_ONLY_MESSAGE;
  return null;
}

/** @deprecated Use getAddToCartBlockReason or getStaffCartBlockReason */
export function getPublicCartBlockReason(): string | null {
  return getAddToCartBlockReason();
}

export function canAddToPublicCart(): boolean {
  return getAddToCartBlockReason() === null;
}
