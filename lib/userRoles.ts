import { isAdminLikeUser as isSuperAdminUser } from "@/lib/adminPreviewAccess";

const normalizeRoleName = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

export const getUserRoleNames = (user: unknown): string[] => {
  if (!user || typeof user !== "object") return [];

  const candidate = user as Record<string, unknown>;
  const roles = [
    candidate.role,
    candidate.user_type,
    candidate.type,
    ...(Array.isArray(candidate.roles)
      ? candidate.roles.map((role) =>
          typeof role === "string" ? role : (role as { name?: string; role?: string })?.name ?? (role as { role?: string })?.role
        )
      : []),
  ]
    .map(normalizeRoleName)
    .filter(Boolean);

  return Array.from(new Set(roles));
};

const COMMERCE_ONLY_ROLES = new Set([
  "technical support",
  "technical_support",
  "customer care",
  "customer_care",
]);

export const COMMERCE_ADMIN_PATH = "/public/commerce-admin";

export function isCommerceOnlyStaffUser(user: unknown) {
  if (!user || typeof user !== "object") return false;
  return getUserRoleNames(user).some((role) => COMMERCE_ONLY_ROLES.has(role));
}

export function isCmsPortalUser(user: unknown) {
  if (!user || typeof user !== "object") return false;
  if (isCustomerUser(user)) return false;
  if (isCommerceOnlyStaffUser(user)) return false;
  return isStaffUser(user);
}

export function isBillingInChargeUser(user: unknown) {
  if (!user || typeof user !== "object") return false;
  return getUserRoleNames(user).some(
    (role) => role === "billing in charge" || role === "billing-in-charge"
  );
}

export function isSalesStaffUser(user: unknown) {
  if (!user || typeof user !== "object") return false;
  return getUserRoleNames(user).some((role) => role === "sales staff");
}

export function isSalesRoleUser(user: unknown) {
  if (!user || typeof user !== "object") return false;
  return getUserRoleNames(user).some((role) => role === "sales staff" || role === "sales admin");
}

export function resolveStaffLoginRedirect(user: unknown, requestedRedirect?: string) {
  const redirect = typeof requestedRedirect === "string" ? requestedRedirect.trim() : "";
  const safeRedirect = redirect.startsWith("/") && !redirect.startsWith("//") ? redirect : "";

  if (isCommerceOnlyStaffUser(user) || isBillingInChargeUser(user) || isSalesStaffUser(user)) {
    if (safeRedirect.startsWith(COMMERCE_ADMIN_PATH)) return safeRedirect;
    return COMMERCE_ADMIN_PATH;
  }

  if (safeRedirect) return safeRedirect;
  return "/dashboard";
}

const COMMERCE_STAFF_ROLES = new Set([
  "admin",
  "administrator",
  "super admin",
  "superadmin",
  "finance admin",
  "finance_admin",
  "sales admin",
  "sales_admin",
  "marketing",
  "customer care",
  "customer_care",
  "technical support",
  "technical_support",
  "billing in charge",
  "billing_in_charge",
  "billing-in-charge",
  "sales staff",
  "sales_staff",
  "editor",
]);

const ROLE_LABELS: Record<string, string> = {
  admin: "Super Admin",
  finance_admin: "Finance Admin",
  sales_admin: "Sales Admin",
  sales_staff: "Sales Staff",
  marketing: "Marketing",
  customer_care: "Customer Care",
  technical_support: "Technical Support",
  billing_in_charge: "Billing-in-Charge",
  customer: "Customer",
  editor: "Editor",
};

export const getRoleDisplayLabel = (user: unknown): string => {
  if (!user || typeof user !== "object") return "User";
  const candidate = user as Record<string, unknown>;
  const description = String(candidate.role_description ?? "").trim();
  if (description) return description;

  const roleSlug = String(candidate.role ?? getUserRoleNames(user)[0] ?? "").trim();
  if (!roleSlug) return "User";
  return ROLE_LABELS[roleSlug] ?? roleSlug.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

export const isCustomerCareUser = (user: unknown) => {
  if (!user || typeof user !== "object") return false;
  return getUserRoleNames(user).some((role) => role === "customer care");
};

/** Customer Care, Finance Admin, Sales Admin (and admins) can assign transactions. */
export const canAssignSalesTransactions = (user: unknown) => {
  if (!user || typeof user !== "object") return false;
  if (isSuperAdminUser(user)) return true;
  const roles = getUserRoleNames(user);
  return (
    roles.includes("customer care") ||
    roles.includes("finance admin") ||
    roles.includes("sales admin") ||
    roles.includes("admin")
  );
};

export const isCommerceStaffUser = (user: unknown) => {
  if (!user || typeof user !== "object") return false;
  if (isSuperAdminUser(user)) return true;
  return getUserRoleNames(user).some((role) => COMMERCE_STAFF_ROLES.has(role));
};

export const isStaffUser = (user: unknown) => {
  if (!user || typeof user !== "object") return false;
  if (isCustomerUser(user)) return false;
  if (isCommerceStaffUser(user)) return true;

  const roles = getUserRoleNames(user);
  return roles.length > 0 && !roles.includes("customer");
};

export const isCustomerUser = (user: unknown) => {
  if (!user || typeof user !== "object") return false;
  if (isSuperAdminUser(user)) return false;
  return getUserRoleNames(user).includes("customer");
};

export { isSuperAdminUser as isAdminLikeUser };
