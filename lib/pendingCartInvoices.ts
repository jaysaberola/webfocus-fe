import { resolveServiceCategory } from "@/lib/serviceCategory";
import type { PortalInvoice } from "@/lib/customerPortal/types";
import type { PublicCartItem } from "@/lib/publicCart";

const PENDING_CHECKOUT_STATUSES = new Set(["Pending Payment"]);

export function isUnpaidInvoice(invoice: PortalInvoice) {
  return PENDING_CHECKOUT_STATUSES.has(invoice.status) && !invoice.pendingQuotation;
}

function cartItemCategory(item: PublicCartItem) {
  return resolveServiceCategory(item.name, item.category).trim().toLowerCase();
}

function invoiceCategory(invoice: PortalInvoice) {
  return String(invoice.serviceName || invoice.items || "").trim().toLowerCase();
}

export function pendingInvoicesForCart(invoices: PortalInvoice[], cartItems: PublicCartItem[]) {
  const payable = cartItems.filter((item) => item.price > 0);
  if (!payable.length) return [];

  const unpaid = invoices.filter(isUnpaidInvoice);
  if (!unpaid.length) return [];

  const cartTotal = payable.reduce((sum, item) => sum + item.price * (item.qty || 1), 0);
  const cartCategories = new Set(payable.map(cartItemCategory).filter(Boolean));

  const exactAmount = unpaid.filter(
    (invoice) => Math.abs((invoice.amount ?? 0) - cartTotal) < 0.009,
  );
  if (exactAmount.length) {
    return [...exactAmount].sort((a, b) => String(a.id).localeCompare(String(b.id)));
  }

  const overlapping = unpaid.filter((invoice) => {
    const service = invoiceCategory(invoice);
    if (!service) return false;
    return [...cartCategories].some(
      (category) => category === service || category.includes(service) || service.includes(category),
    );
  });

  return [...overlapping].sort((a, b) => String(a.id).localeCompare(String(b.id)));
}

export function invoiceFromCheckoutConflict(
  invoices: PortalInvoice[],
  invoiceId?: string | null,
): PortalInvoice | null {
  const wanted = String(invoiceId ?? "").trim().toLowerCase();
  if (!wanted) return null;

  return (
    invoices.find((invoice) => {
      if (!isUnpaidInvoice(invoice)) return false;
      const id = String(invoice.id ?? "").trim().toLowerCase();
      const transactionNo = String(invoice.transactionNo ?? "").trim().toLowerCase();
      return id === wanted || `inv-${transactionNo}` === wanted || transactionNo === wanted.replace(/^inv-/, "");
    }) ?? null
  );
}
