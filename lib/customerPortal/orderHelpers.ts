import { customerPlanLabelFromParts } from "@/lib/serviceCategory";
import type { PortalOrder } from "@/lib/customerPortal/types";

export function orderDueDate(order: PortalOrder) {
  return order.dueDate ?? order.expiredDate;
}

export function orderPlanLabel(order: PortalOrder) {
  return customerPlanLabelFromParts({
    serviceName: order.serviceName,
    plan: order.plan,
    items: order.items,
  });
}

export function orderServiceName(order: PortalOrder) {
  return order.serviceName ?? order.items[0]?.name ?? "Order";
}

export function orderCanCancel(order: PortalOrder) {
  if (order.status === "Cancelled") return false;
  if (typeof order.canCancel === "boolean") return order.canCancel;
  return order.status === "Pending Request" || order.status === "Awaiting Approval";
}

export function orderPaymentMethodLabel(order: PortalOrder) {
  const raw = String(order.gateway || "").trim();
  if (!raw) return "—";
  if (/paynamics\s*ipg/i.test(raw) || /^paynamics$/i.test(raw)) return "Paynamics";
  if (/paynamics/i.test(raw) && /hosted|portal|gateway/i.test(raw)) return "Paynamics";
  return raw;
}
