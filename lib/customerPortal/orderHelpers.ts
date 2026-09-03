import { joinPlanNames } from "@/lib/serviceCategory";
import type { PortalOrder } from "@/lib/customerPortal/types";

export function orderDueDate(order: PortalOrder) {
  return order.dueDate ?? order.expiredDate;
}

export function orderPlanLabel(order: PortalOrder) {
  return order.plan ?? joinPlanNames(order.items.map((entry) => entry.detail ?? entry.name));
}

export function orderServiceName(order: PortalOrder) {
  return order.serviceName ?? order.items[0]?.name ?? "Order";
}

export function orderCanCancel(order: PortalOrder) {
  if (order.status === "Cancelled") return false;
  if (typeof order.canCancel === "boolean") return order.canCancel;
  return order.status === "Pending Request" || order.status === "Awaiting Approval";
}
