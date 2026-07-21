import type { PublicCartItem } from "@/lib/publicCart";

const AGREEMENT_KEY = "cms4.checkoutAgreementAccepted.v1";

export function getCartAgreementFingerprint(items: PublicCartItem[]) {
  return items
    .map((item) => `${item.key}:${item.qty}:${item.price}`)
    .sort()
    .join("|");
}

export function markCheckoutAgreementAccepted(items: PublicCartItem[]) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(AGREEMENT_KEY, getCartAgreementFingerprint(items));
}

export function hasCheckoutAgreementAccepted(items: PublicCartItem[]) {
  if (typeof window === "undefined") return false;
  if (!items.length) return false;
  return sessionStorage.getItem(AGREEMENT_KEY) === getCartAgreementFingerprint(items);
}

export function clearCheckoutAgreementAccepted() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(AGREEMENT_KEY);
}
