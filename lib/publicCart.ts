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
};

const CART_KEY = "cms4.publicCart.v1";

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

export const writePublicCart = (items: PublicCartItem[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(CART_KEY, JSON.stringify(items.map(normalizeCartItem)));
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

export const removePublicCartItem = (key: string) => {
  const next = readPublicCart().filter((item) => item.key !== key);
  writePublicCart(next);
  return next;
};

export function cartPayableItems(items: PublicCartItem[]) {
  return items.filter((item) => !isPendingQuotationCartItem(item));
}

export function cartHeldQuotationItems(items: PublicCartItem[]) {
  return items.filter(isPendingQuotationCartItem);
}

export function cartHasMixedCheckout(items: PublicCartItem[]) {
  return cartPayableItems(items).length > 0 && cartHeldQuotationItems(items).length > 0;
}

export const MIXED_CART_WEB_DESIGN_NOTICE =
  "Web design packages are Pending Quotation. They will be submitted to Sales for pricing, while your other services proceed to Paynamics payment.";

export const cartCategoryLabel = (category?: string) => {
  const value = String(category || "Service").trim();
  if (/domain/i.test(value)) return "DOMAIN";
  if (/hosting/i.test(value)) return "HOSTING";
  if (/dms|document/i.test(value)) return "DMS";
  if (/web design|agency|design/i.test(value)) return "DESIGN";
  return value.split(/\s+/)[0].toUpperCase().slice(0, 12);
};
