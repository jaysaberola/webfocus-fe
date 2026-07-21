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
};

const CART_KEY = "cms4.publicCart.v1";

export const readPublicCart = (): PublicCartItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const writePublicCart = (items: PublicCartItem[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("public-cart-updated"));
  try {
    sessionStorage.removeItem("cms4.checkoutAgreementAccepted.v1");
  } catch {
    // ignore
  }
};

export const clearPublicCart = () => writePublicCart([]);

export const cartCount = (items: PublicCartItem[]) => items.reduce((sum, item) => sum + Number(item.qty || 0), 0);
export const cartSubtotal = (items: PublicCartItem[]) => items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0), 0);

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
  const index = current.findIndex((cartItem) => cartItem.key === item.key);
  if (index >= 0) current[index] = { ...current[index], qty: current[index].qty + item.qty };
  else current.push(item);
  writePublicCart(current);
  return current;
};

export const updatePublicCartQty = (key: string, qty: number) => {
  const next = readPublicCart()
    .map((item) => item.key === key ? { ...item, qty: Math.max(1, Math.floor(qty || 1)) } : item)
    .filter((item) => item.qty > 0);
  writePublicCart(next);
  return next;
};

export const removePublicCartItem = (key: string) => {
  const next = readPublicCart().filter((item) => item.key !== key);
  writePublicCart(next);
  return next;
};

export const formatCartMoney = (amount: number) =>
  `₱${Number(amount || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export const cartCategoryLabel = (category?: string) => {
  const value = String(category || "Service").trim();
  if (/domain/i.test(value)) return "DOMAIN";
  if (/hosting/i.test(value)) return "HOSTING";
  if (/dms|document/i.test(value)) return "DMS";
  if (/web design|agency/i.test(value)) return "DESIGN";
  return value.split(/\s+/)[0].toUpperCase().slice(0, 12);
};
