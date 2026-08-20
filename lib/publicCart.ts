import type { Product } from "@/services/publicProductService";
import { resolveProductImageUrl } from "@/services/publicProductService";
import {
  parseWebDesignMeta,
  type WebDesignCartMeta,
} from "@/lib/webDesignSetup";

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
  /** Structured web design selection (template + additional services). */
  webDesign?: WebDesignCartMeta;
  /** Web design packages are quote-based until Sales sets a price. */
  pricingStatus?: "pending_quotation" | "priced";
  /** Set after the Pending Quotation request was filed with Sales (item stays in cart). */
  quotationTransactionNo?: string | null;
  /** Client-entered notes for Sales on pending quotation items. */
  clientNotes?: string;
};

const CART_KEY = "cms4.publicCart.v1";
/** Full cart snapshot while Paynamics checkout is in progress (survives browser Back). */
const CHECKOUT_BACKUP_KEY = "cms4.publicCart.checkoutBackup.v1";
const CHECKOUT_SESSION_KEY = "cms4.publicCart.checkoutSession.v1";

export type PublicCartCheckoutSession = {
  transactionId?: number | null;
  transactionNo?: string | null;
  requestId?: string | null;
  payableKeys: string[];
  createdAt: number;
  settled?: "paid" | "abandoned";
};

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

/** Attach a unique invoice/transaction number to one pending quotation cart row. */
export function markQuotationSubmittedCartItem(
  items: PublicCartItem[],
  itemKey: string,
  transactionNo: string | null | undefined
): PublicCartItem[] {
  const orderNo = String(transactionNo || "").trim();
  return items.map((item) => {
    if (item.key !== itemKey || !isPendingQuotationCartItem(item)) return item;
    return {
      ...item,
      pricingStatus: "pending_quotation" as const,
      quotationTransactionNo: orderNo || item.quotationTransactionNo || "submitted",
    };
  });
}

export function applyQuotationTransactionNumbers(
  items: PublicCartItem[],
  orderNosByKey: Record<string, string>
): PublicCartItem[] {
  let next = items;
  for (const [key, orderNo] of Object.entries(orderNosByKey)) {
    next = markQuotationSubmittedCartItem(next, key, orderNo);
  }
  return next;
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
  const parsedWebDesign = item.webDesign ?? parseWebDesignMeta(item.detail);
  const withMeta = parsedWebDesign
    ? {
        ...item,
        webDesign: {
          ...parsedWebDesign,
          packageName: parsedWebDesign.packageName || item.name,
        },
      }
    : item;
  if (withMeta.pricingStatus === "priced") return withMeta;
  if (looksLikeWebDesignCartItem(withMeta) && Number(withMeta.price || 0) <= 0) {
    return {
      ...withMeta,
      price: 0,
      pricingStatus: "pending_quotation",
    };
  }
  return withMeta;
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

export const writePublicCart = (
  items: PublicCartItem[],
  options?: { syncCheckoutBackup?: boolean },
) => {
  if (typeof window === "undefined") return;
  const normalized = items.map(normalizeCartItem);
  localStorage.setItem(CART_KEY, JSON.stringify(normalized));
  if (options?.syncCheckoutBackup !== false) {
    syncCheckoutBackupWithCart(normalized);
  }
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
      clientNotes: normalized.clientNotes || current[index].clientNotes,
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

export const updatePublicCartItemNotes = (key: string, clientNotes: string) => {
  const next = readPublicCart().map((item) =>
    item.key === key ? { ...item, clientNotes: clientNotes.trim() ? clientNotes : "" } : item,
  );
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

export function cartItemHasAvailableAmount(item: PublicCartItem) {
  if (isPendingQuotationCartItem(item)) return false;
  return Number(item.price || 0) * Number(item.qty || 0) > 0;
}

export function cartPayableItems(items: PublicCartItem[]) {
  return items.filter(cartItemHasAvailableAmount);
}

export function cartHeldQuotationItems(items: PublicCartItem[]) {
  return items.filter((item) => !cartItemHasAvailableAmount(item));
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

function readCheckoutSession(): PublicCartCheckoutSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw =
      sessionStorage.getItem(CHECKOUT_SESSION_KEY) ||
      localStorage.getItem(CHECKOUT_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PublicCartCheckoutSession;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

function persistCheckoutSession(session: PublicCartCheckoutSession) {
  if (typeof window === "undefined") return;
  const payload = JSON.stringify(session);
  try {
    sessionStorage.setItem(CHECKOUT_SESSION_KEY, payload);
  } catch {
    // ignore
  }
  try {
    localStorage.setItem(CHECKOUT_SESSION_KEY, payload);
  } catch {
    // ignore
  }
}

export function readPublicCartCheckoutSession() {
  return readCheckoutSession();
}

export function clearPublicCartCheckoutSession() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(CHECKOUT_SESSION_KEY);
  } catch {
    // ignore
  }
  try {
    localStorage.removeItem(CHECKOUT_SESSION_KEY);
  } catch {
    // ignore
  }
}

export function isPaidCheckoutStatus(status?: string | null) {
  const value = String(status ?? "").trim().toLowerCase();
  return ["paid", "success", "completed"].includes(value);
}

export function isAbandonedCheckoutStatus(status?: string | null) {
  const value = String(status ?? "").trim().toLowerCase();
  return ["cancelled", "canceled", "failed", "verification_failed"].includes(value);
}

/** Snapshot the full cart, then drop priced items from the live cart while Paynamics is open. */
export function stashPublicCartForCheckout(items: PublicCartItem[]) {
  if (typeof window === "undefined") return;
  const snapshot = items.map(normalizeCartItem);
  persistCheckoutBackup(snapshot);
  writePublicCart(cartHeldQuotationItems(snapshot), { syncCheckoutBackup: false });
  persistCheckoutBackup(snapshot);
}

export function beginPublicCartCheckout(params: {
  items: PublicCartItem[];
  payableKeys?: string[];
  transactionId?: number | null;
  transactionNo?: string | null;
  requestId?: string | null;
}) {
  const snapshot = params.items.map(normalizeCartItem);
  const payableKeys =
    params.payableKeys?.filter(Boolean) ?? cartPayableItems(snapshot).map((item) => item.key);
  persistCheckoutSession({
    transactionId: params.transactionId ?? null,
    transactionNo: params.transactionNo ?? null,
    requestId: params.requestId ?? null,
    payableKeys,
    createdAt: Date.now(),
  });
  stashPublicCartForCheckout(snapshot);
}

/** If checkout was abandoned (Back / Cancel), restore any missing priced items. */
export function restorePublicCartFromCheckoutBackup(): PublicCartItem[] | null {
  if (readCheckoutSession()?.settled === "paid") return null;

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

  writePublicCart(backup, { syncCheckoutBackup: false });
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
  writePublicCart(remaining, { syncCheckoutBackup: false });
  clearPublicCartCheckoutBackup();
  return remaining;
}

/** Confirm payment: drop priced items and prevent Back from restoring them. */
export function finalizePaidPublicCartCheckout() {
  const before = readPublicCart();
  const remaining = clearPayablePublicCartItems();
  const session = readCheckoutSession();
  if (session) {
    persistCheckoutSession({ ...session, settled: "paid" });
  }
  clearPublicCartCheckoutSession();
  return {
    items: remaining,
    removed: cartPayableItems(before).length > 0 || before.length !== remaining.length,
  };
}

export function abandonPublicCartCheckout() {
  const restored = restorePublicCartFromCheckoutBackup();
  const session = readCheckoutSession();
  if (session) {
    persistCheckoutSession({ ...session, settled: "abandoned" });
  }
  clearPublicCartCheckoutBackup();
  clearPublicCartCheckoutSession();
  return restored;
}

export function checkoutSessionMatchesPaidInvoice(params: {
  transactionNo?: string | null;
  invoiceId?: string | null;
  status?: string | null;
}) {
  const session = readCheckoutSession();
  if (!session || session.settled === "abandoned") return false;
  if (!isPaidCheckoutStatus(params.status)) return false;
  const transactionNo = String(session.transactionNo ?? "").trim();
  if (!transactionNo) return session.settled === "paid";
  const invoiceNo = String(params.transactionNo ?? "").trim();
  const invoiceId = String(params.invoiceId ?? "").trim();
  if (invoiceNo && invoiceNo === transactionNo) return true;
  if (invoiceId && invoiceId.replace(/^inv-/i, "") === transactionNo) return true;
  return false;
}

export function cartHasMixedCheckout(items: PublicCartItem[]) {
  return cartPayableItems(items).length > 0 && cartHeldQuotationItems(items).length > 0;
}

export const MIXED_CART_WEB_DESIGN_NOTICE =
  "Priced services will share one invoice and one payment. Pending quotation items are billed on a separate invoice and stay in your cart until Sales sets the price.";

export const cartCategoryLabel = (category?: string) => {
  const value = String(category || "Service").trim();
  if (/domain/i.test(value)) return "DOMAIN";
  if (/hosting/i.test(value)) return "HOSTING";
  if (/dms|document/i.test(value)) return "DMS";
  if (/web design|agency|design/i.test(value)) return "DESIGN";
  return value.split(/\s+/)[0].toUpperCase().slice(0, 12);
};
