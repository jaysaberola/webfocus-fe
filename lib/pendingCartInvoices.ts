import { resolveServiceCategory } from "@/lib/serviceCategory";
import type { PortalInvoice } from "@/lib/customerPortal/types";
import type { PublicCartItem } from "@/lib/publicCart";

const PENDING_CHECKOUT_STATUSES = new Set(["Pending Payment"]);

export function cartItemServiceName(item: PublicCartItem) {
  return resolveServiceCategory(item.name, item.category);
}

export function isUnpaidInvoice(invoice: PortalInvoice) {
  return PENDING_CHECKOUT_STATUSES.has(invoice.status) && !invoice.pendingQuotation;
}

export function invoiceMatchesCartItem(invoice: PortalInvoice, item: PublicCartItem) {
  if (!isUnpaidInvoice(invoice)) return false;

  const service = String(invoice.serviceName || invoice.items || "").trim().toLowerCase();
  const itemService = cartItemServiceName(item).toLowerCase();
  const itemName = item.name.trim().toLowerCase();
  const amountMatch = Math.abs((invoice.amount ?? 0) - item.price * item.qty) < 0.009;

  if (service && itemService && service === itemService) return true;
  if (service && itemName && service.includes(itemName)) return true;
  if (amountMatch && service && itemService && service === itemService) return true;

  return false;
}

export function pendingInvoicesForCart(invoices: PortalInvoice[], cartItems: PublicCartItem[]) {
  const payable = cartItems.filter((item) => item.price > 0);
  if (!payable.length) return [];

  const matched = invoices.filter((invoice) =>
    payable.some((item) => invoiceMatchesCartItem(invoice, item)),
  );

  return [...matched].sort((a, b) => String(a.id).localeCompare(String(b.id)));
}
