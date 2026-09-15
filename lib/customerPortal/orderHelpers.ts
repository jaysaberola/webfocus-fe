import { getPaynamicsPaymentLabel } from "@/lib/checkoutPaymentMethods";
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

export function orderPaymentDate(order: PortalOrder) {
  return String(order.paymentDate || "").trim() || null;
}

export function orderPaymentMethodLabel(order: PortalOrder) {
  const raw = String(order.paymentMode || order.gateway || "").trim();
  if (!raw || raw === "—") return "—";

  const idMatch = raw.match(/paynamics[-_ ]([a-z0-9]+)/i);
  if (idMatch?.[1]) {
    const specific = getPaynamicsPaymentLabel(idMatch[1]);
    if (specific && specific.toLowerCase() !== idMatch[1].toLowerCase()) {
      return `Paynamics - ${specific}`;
    }
  }

  if (/paynamics\s*ipg/i.test(raw) || /^paynamics$/i.test(raw)) return "Paynamics";
  if (/paynamics/i.test(raw) && /hosted|portal|gateway/i.test(raw) && !/\(.*\)| - /.test(raw)) {
    return "Paynamics";
  }
  return raw;
}
