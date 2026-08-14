import type { Product } from "@/services/publicProductService";
import { resolveProductImageUrl } from "@/services/publicProductService";

export type PublicCartItem = {
  key: string;
  id?: string;
  slug?: string;
  name: string;
  price: number;
  qty: number;
  image?: string;
  category?: string;
  detail?: string;
  /** Web design packages are quote-based until Sales sets a price. */
  pricingStatus?: "pending_quotation" | "priced";
  /** Set after the Pending Quotation request was filed with Sales (item stays in cart). */
  quotationTransactionNo?: string | null;
};

const CART_KEY = "cms4.publicCart.v1";
/** Full cart snapshot while Paynamics checkout is in progress (survives browser Back). */
const CHECKOUT_BACKUP_KEY = "cms4.publicCart.checkoutBackup.v1";

export const PENDING_QUOTATION_LABEL = "Pending Quotation";

const WEB_DESIGN_NAME_PATTERN =
  /web design|agency web|agency|canvas|website template|business starter|professional corporate|e-?commerce plus|starter launch|\bdesign\b/i;

export const formatCartMoney = (amount: number) =>
  `₱${Number(amount || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

function looksLikeWebDesignCartItem(item: PublicCartItem) {
  const haystack = `${item.category || ""} ${item.name || ""} ${item.key || ""} ${item.detail || ""}`;
  return WEB_DESIGN_NAME_PATTERN.test(haystack);
}

export function isPendingQuotationCartItem(item: PublicCartItem) {
  if (!item) return false;
  if (item.pricingStatus === "pending_quotation") return true;
  if (item.pricingStatus === "priced") return false;
  return looksLikeWebDesignCartItem(item) && Number(item.price || 0) <= 0;
}

export function isQuotationSubmittedCartItem(item: PublicCartItem) {
  return (
    isPendingQuotationCartItem(item) &&
    Boolean(String(item.quotationTransactionNo || "").trim())
  );
}

export function markQuotationSubmittedCartItems(
  items: PublicCartItem[],
  transactionNo: string | null | undefined
): PublicCartItem[] {
  const orderNo = String(transactionNo || "").trim();
  return items.map((item) => {
    if (!isPendingQuotationCartItem(item)) return item;
    return {
      ...item,
      pricingStatus: "pending_quotation" as const,
      quotationTransactionNo: orderNo || item.quotationTransactionNo || "submitted",
    };
  });
}

export function cartUnsubmittedQuotationItems(items: PublicCartItem[]) {
  return cartHeldQuotationItems(items).filter((item) => !isQuotationSubmittedCartItem(item));
}

export function formatCartItemPrice(item: PublicCartItem) {
  if (isPendingQuotationCartItem(item)) return PENDING_QUOTATION_LABEL;
  return formatCartMoney(Number(item.price || 0) * Number(item.qty || 0));
}

export const cartCount = (items: PublicCartItem[]) =>
  items.reduce((sum, item) => sum + Number(item.qty || 0), 0);

export const cartSubtotal = (items: PublicCartItem[]) =>
  items.reduce((sum, item) => {
    if (isPendingQuotationCartItem(item)) return sum;
    return sum + Number(item.price || 0) * Number(item.qty || 0);
  }, 0);

export function cartHasPendingQuotation(items: PublicCartItem[]) {
  return items.some(isPendingQuotationCartItem);
}

export function cartIsQuotationOnly(items: PublicCartItem[]) {
  return items.length > 0 && items.every(isPendingQuotationCartItem);
}

export function formatCartSubtotalLabel(items: PublicCartItem[]) {
  if (cartIsQuotationOnly(items) || (cartHasPendingQuotation(items) && cartSubtotal(items) <= 0)) {
    return PENDING_QUOTATION_LABEL;
  }
  return formatCartMoney(cartSubtotal(items));
}

function normalizeCartItem(item: PublicCartItem): PublicCartItem {
  if (!item || typeof item !== "object") return item;
  if (item.pricingStatus === "priced") return item;
  if (looksLikeWebDesignCartItem(item) && Number(item.price || 0) <= 0) {
    return {
      ...item,
      price: 0,
      pricingStatus: "pending_quotation",
    };
  }
  return item;
}

export const readPublicCart = (): PublicCartItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    const normalized = parsed.map((item) => normalizeCartItem(item as PublicCartItem));
    // Persist upgraded quote flags so UI stays consistent across refreshes.
    try {
      const raw = JSON.stringify(parsed);
      const next = JSON.stringify(normalized);
      if (raw !== next) {
        localStorage.setItem(CART_KEY, next);
      }
    } catch {
      // ignore storage write errors
    }
    return normalized;
  } catch {
    return [];
  }
};

function persistCheckoutBackup(items: PublicCartItem[]) {
  if (typeof window === "undefined") return;
  const payload = JSON.stringify(items.map(normalizeCartItem));
  try {
    sessionStorage.setItem(CHECKOUT_BACKUP_KEY, payload);
  } catch {
    // ignore
  }
  try {
    localStorage.setItem(CHECKOUT_BACKUP_KEY, payload);
  } catch {
    // ignore
  }
}

/** Keep Paynamics backup aligned with the live cart so restore cannot resurrect deleted rows. */
function syncCheckoutBackupWithCart(items: PublicCartItem[]) {
  if (typeof window === "undefined") return;
  if (!readCheckoutBackup()?.length) return;
  persistCheckoutBackup(items);
}

export const writePublicCart = (items: PublicCartItem[]) => {
  if (typeof window === "undefined") return;
  const normalized = items.map(normalizeCartItem);
  localStorage.setItem(CART_KEY, JSON.stringify(normalized));
  syncCheckoutBackupWithCart(normalized);
  window.dispatchEvent(new Event("public-cart-updated"));
  try {
    sessionStorage.removeItem("cms4.checkoutAgreementAccepted.v1");
  } catch {
    // ignore
  }
};

export const clearPublicCart = () => writePublicCart([]);

export const productToCartItem = (product: Product | any, qty = 1): PublicCartItem => {
  const key = String(product?.id ?? product?.slug ?? product?.name);
  return {
    key,
    id: product?.id ? String(product.id) : undefined,
    slug: product?.slug ? String(product.slug) : undefined,
    name: String(product?.name ?? product?.title ?? "Product"),
    price: Number(product?.price || 0),
    qty: Math.max(1, Math.floor(Number(qty || 1))),
    image: resolveProductImageUrl(product?.image_url ?? product?.image),
  };
};

export const addPublicCartItem = (item: PublicCartItem) => {
  const current = readPublicCart();
  const normalized = normalizeCartItem(item);
  const index = current.findIndex((cartItem) => cartItem.key === normalized.key);
  if (index >= 0) {
    current[index] = {
      ...current[index],
      ...normalized,
      qty: current[index].qty + normalized.qty,
    };
  } else {
    current.push(normalized);
  }
  writePublicCart(current);
  return current;
};

export const updatePublicCartQty = (key: string, qty: number) => {
  const next = readPublicCart()
    .map((item) => (item.key === key ? { ...item, qty: Math.max(1, Math.floor(qty || 1)) } : item))
    .filter((item) => item.qty > 0);
  writePublicCart(next);
  return next;
};

function cartItemMatchesKey(item: PublicCartItem, key: string) {
  const needle = String(key || "").trim();
  if (!needle) return false;
  return (
    String(item.key || "") === needle ||
    String(item.id || "") === needle ||
    String(item.slug || "") === needle
  );
}

export const removePublicCartItem = (key: string) => {
  const next = readPublicCart().filter((item) => !cartItemMatchesKey(item, key));
  writePublicCart(next);
  return next;
};

export function cartPayableItems(items: PublicCartItem[]) {
  return items.filter((item) => !isPendingQuotationCartItem(item));
}

export function cartHeldQuotationItems(items: PublicCartItem[]) {
  return items.filter(isPendingQuotationCartItem);
}

function readCheckoutBackup(): PublicCartItem[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw =
      sessionStorage.getItem(CHECKOUT_BACKUP_KEY) ||
      localStorage.getItem(CHECKOUT_BACKUP_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    return parsed.map((item) => normalizeCartItem(item as PublicCartItem));
  } catch {
    return null;
  }
}

/** Snapshot the full cart before leaving for Paynamics so Back retains priced items. */
export function stashPublicCartForCheckout(items: PublicCartItem[]) {
  if (typeof window === "undefined") return;
  const snapshot = items.map(normalizeCartItem);
  persistCheckoutBackup(snapshot);
  // Always persist the full cart (payable + Pending Quotation) until payment succeeds.
  writePublicCart(snapshot);
}

/** If checkout was abandoned (Back / Cancel), restore any missing priced items. */
export function restorePublicCartFromCheckoutBackup(): PublicCartItem[] | null {
  const backup = readCheckoutBackup();
  if (!backup?.length) return null;

  const current = readPublicCart();
  const backupPayable = cartPayableItems(backup);
  const currentPayable = cartPayableItems(current);

  // Restore when priced services were wiped but still exist in the checkout snapshot.
  const needsRestore =
    backupPayable.length > 0 &&
    (currentPayable.length < backupPayable.length || current.length < backup.length);

  if (!needsRestore) return null;

  writePublicCart(backup);
  return backup;
}

export function clearPublicCartCheckoutBackup() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(CHECKOUT_BACKUP_KEY);
  } catch {
    // ignore
  }
  try {
    localStorage.removeItem(CHECKOUT_BACKUP_KEY);
  } catch {
    // ignore
  }
}

/** Remove payable items after successful payment; keep Pending Quotation rows. */
export function clearPayablePublicCartItems() {
  const remaining = cartHeldQuotationItems(readPublicCart());
  writePublicCart(remaining);
  clearPublicCartCheckoutBackup();
  return remaining;
}

export function cartHasMixedCheckout(items: PublicCartItem[]) {
  return cartPayableItems(items).length > 0 && cartHeldQuotationItems(items).length > 0;
}

export const MIXED_CART_WEB_DESIGN_NOTICE =
  "Web design packages are Pending Quotation. They will be submitted to Sales for pricing and stay in your cart, while your other services proceed to Paynamics payment.";

export const cartCategoryLabel = (category?: string) => {
  const value = String(category || "Service").trim();
  if (/domain/i.test(value)) return "DOMAIN";
  if (/hosting/i.test(value)) return "HOSTING";
  if (/dms|document/i.test(value)) return "DMS";
  if (/web design|agency|design/i.test(value)) return "DESIGN";
  return value.split(/\s+/)[0].toUpperCase().slice(0, 12);
};
