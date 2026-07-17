import { logout as adminLogout } from "@/services/authService";
import { customerLogout } from "@/services/publicCustomerService";

const PROTECTED_PUBLIC_PATHS = [
  "/public/dashboard",
  "/public/commerce-admin",
  "/public/account",
  "/public/checkout",
];

export function getPublicSignOutRedirect(): string {
  if (typeof window === "undefined") return "/public/home";

  const { pathname, search } = window.location;
  const isProtected = PROTECTED_PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  if (isProtected || !pathname.startsWith("/public/")) {
    return "/public/home";
  }

  return `${pathname}${search}`;
}

export function signOutAdminAndStayOnSite() {
  adminLogout();
  window.location.assign(getPublicSignOutRedirect());
}

export function signOutCustomerAndStayOnSite() {
  customerLogout();
  window.location.assign(getPublicSignOutRedirect());
}
