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
  return (
    order.status === "Pending Request" ||
    order.status === "Pending Payment" ||
    order.status === "Awaiting Approval"
  );
}

export function orderCanCheckout(order: PortalOrder) {
  if (typeof order.canCheckout === "boolean") return order.canCheckout;
  return order.status === "Pending Payment" && order.total > 0;
}

export function orderCanCustomize(order: PortalOrder) {
  return order.status === "Pending Payment" || orderCanCheckout(order);
}

export function orderPaymentDate(order: PortalOrder) {
  return String(order.paymentDate || "").trim() || null;
}

export const PROVISIONING_MIN_HOURS = 24;
export const PROVISIONING_MAX_HOURS = 48;

export function orderProvisioningStartedAt(
  order: Pick<PortalOrder, "approvedAt">,
) {
  const parsed = Date.parse(String(order.approvedAt || ""));
  return Number.isFinite(parsed) ? parsed : null;
}

export function provisioningCountdownCopy(
  order: Pick<PortalOrder, "approvedAt">,
  now = Date.now(),
) {
  const startedAt = orderProvisioningStartedAt(order);
  if (startedAt == null) {
    return {
      hours: PROVISIONING_MAX_HOURS,
      minutes: 0,
      headline: "48h 00m left",
      detail: "Starts when admin approves",
    };
  }

  const elapsedMs = Math.max(0, now - startedAt);
  const remainingMs = Math.max(0, PROVISIONING_MAX_HOURS * 36e5 - elapsedMs);
  const totalHours = Math.floor(remainingMs / 36e5);
  const minutes = Math.floor((remainingMs % 36e5) / 6e4);
  const elapsedHours = elapsedMs / 36e5;

  if (elapsedHours >= PROVISIONING_MAX_HOURS) {
    return {
      hours: 0,
      minutes: 0,
      headline: "0 hours left",
      detail: "Past 48 hours (2 days)",
    };
  }

  return {
    hours: totalHours,
    minutes,
    headline: `${totalHours}h ${String(minutes).padStart(2, "0")}m left`,
    detail: "24–48 hours (2 days)",
  };
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
