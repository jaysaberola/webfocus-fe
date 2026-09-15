import type { PortalInvoice } from "@/lib/customerPortal/types";
import type { PublicCartItem } from "@/lib/publicCart";

const PENDING_CHECKOUT_STATUSES = new Set(["Pending Payment"]);

export function isUnpaidInvoice(invoice: PortalInvoice) {
  return PENDING_CHECKOUT_STATUSES.has(invoice.status) && !invoice.pendingQuotation;
}

export function pendingInvoicesForCart(invoices: PortalInvoice[], cartItems: PublicCartItem[]) {
  const payable = cartItems.filter((item) => item.price > 0);
  if (!payable.length) return [];

  const cartTotal = payable.reduce((sum, item) => sum + item.price * (item.qty || 1), 0);

  const matched = invoices.filter((invoice) => {
    if (!isUnpaidInvoice(invoice)) return false;
    return Math.abs((invoice.amount ?? 0) - cartTotal) < 0.009;
  });

  return [...matched].sort((a, b) => String(a.id).localeCompare(String(b.id)));
}
