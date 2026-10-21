import { isAdminLikeUser, isCustomerCareUser, isSalesAdminUser } from "@/lib/userRoles";

export type LeadAssignableFor = "lead_sales_admin" | "lead_sales_staff";

export function resolveLeadAssignableFor(user: unknown): LeadAssignableFor | null {
  if (isAdminLikeUser(user)) return "lead_sales_admin";
  if (isSalesAdminUser(user)) return "lead_sales_staff";
  if (isCustomerCareUser(user)) return "lead_sales_admin";
  return null;
}

export function canChangeLeadAssignment(user: unknown) {
  return resolveLeadAssignableFor(user) !== null;
}

export function leadAssignmentFieldHint(user: unknown) {
  if (isSalesAdminUser(user) && !isCustomerCareUser(user)) {
    return "Assign to Sales Staff. They will be notified to follow up.";
  }
  if (isCustomerCareUser(user)) {
    return "Assign to Sales Admin. They will be notified to assign Sales Staff.";
  }
  return "Assign to Sales Admin or Sales Staff.";
}
