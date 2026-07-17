import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { CustomerSignInModal } from "@/components/Auth/CustomerSignInModal";
import LiveCheckoutProgress from "@/components/Cart/LiveCheckoutProgress";
import {
  cartCount,
  cartSubtotal,
  formatCartMoney,
  PublicCartItem,
  readPublicCart,
  removePublicCartItem,
} from "@/lib/publicCart";
import { readStoredAuthToken } from "@/lib/authToken";
import { getStoredCustomer } from "@/services/publicCustomerService";
import { toast } from "@/lib/toast";
import styles from "@/styles/publicCartCheckout.module.css";

const TERM_OPTIONS = [
  { label: "12 Months", months: 12 },
  { label: "24 Months", months: 24 },
  { label: "36 Months", months: 36 },
];

function getCartItemTitle(item: PublicCartItem) {
  if (/domain/i.test(item.category || "")) {
    return `Domain Registration ${item.name}`;
  }
  return item.name;
}

function getCartItemIcon(category?: string) {
  if (/domain/i.test(category || "")) return "fa-solid fa-globe";
  if (/hosting/i.test(category || "")) return "fa-solid fa-server";
  if (/dms|document/i.test(category || "")) return "fa-solid fa-file-lines";
  if (/design|web/i.test(category || "")) return "fa-solid fa-palette";
  return "fa-solid fa-box";
}

export default function PublicCartCheckoutPage() {
  const router = useRouter();
  const [items, setItems] = useState<PublicCartItem[]>([]);
  const [terms, setTerms] = useState<Record<string, number>>({});
  const [signInOpen, setSignInOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [promoOpen, setPromoOpen] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);

  const refreshAuth = () => {
    setIsLoggedIn(Boolean(readStoredAuthToken() && getStoredCustomer()));
  };

  const refreshCart = () => {
    const nextItems = readPublicCart();
    setItems(nextItems);
    setTerms((current) => {
      const next = { ...current };
      nextItems.forEach((item) => {
        if (!next[item.key]) next[item.key] = 12;
      });
      return next;
    });
  };

  useEffect(() => {
    refreshCart();
    refreshAuth();
    window.addEventListener("public-cart-updated", refreshCart);
    window.addEventListener("public-customer-updated", refreshAuth);
    window.addEventListener("storage", refreshCart);
    return () => {
      window.removeEventListener("public-cart-updated", refreshCart);
      window.removeEventListener("public-customer-updated", refreshAuth);
      window.removeEventListener("storage", refreshCart);
    };
  }, []);

  useEffect(() => {
    if (!router.isReady) return;
    if (router.query.signin === "1" && !isLoggedIn) {
      setSignInOpen(true);
    }
  }, [router.isReady, router.query.signin, isLoggedIn]);

  const itemCount = cartCount(items);
  const subtotal = cartSubtotal(items);

  const removeItem = (key: string) => {
    setItems(removePublicCartItem(key));
  };

  const handleReadyForCheckout = () => {
    if (!items.length) return;
    if (isLoggedIn) {
      router.push("/public/checkout");
      return;
    }
    setSignInOpen(true);
  };

  const handleSignInSuccess = () => {
    refreshAuth();
    router.replace("/public/cart", undefined, { shallow: true });
    router.push("/public/checkout");
  };

  const applyPromoCode = () => {
    const code = promoCode.trim();
    if (!code) {
      toast.warning("Enter a promo code.");
      return;
    }
    setAppliedPromo(code.toUpperCase());
    toast.success(`Promo code "${code.toUpperCase()}" applied.`);
  };

  const closePromo = () => {
    setPromoOpen(false);
    setPromoCode("");
  };

  const emptyState = items.length === 0;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.pageHeader}>
          <h1>Your Cart</h1>
          <p>Review your requested domains and services prior to proceeding with checkout.</p>
        </header>

        <LiveCheckoutProgress isLoggedIn={isLoggedIn} hasItems={!emptyState} />

        <div className={styles.layout}>
          <section className={styles.mainColumn}>
            {emptyState ? (
              <div className={styles.emptyCard}>
                <p>Your shopping cart is currently empty.</p>
                <Link href="/public/services" className={styles.browseLink}>
                  Browse Services
                </Link>
              </div>
            ) : (
              items.map((item) => {
                const months = terms[item.key] || 12;
                const renewalYear = new Date().getFullYear() + Math.ceil(months / 12);
                return (
                  <article key={item.key} className={styles.itemCard}>
                    <div className={styles.itemIcon} aria-hidden="true">
                      <i className={getCartItemIcon(item.category)} />
                    </div>

                    <div className={styles.itemBody}>
                      <h2 className={styles.itemTitle}>{getCartItemTitle(item)}</h2>

                      <div className={styles.termRow}>
                        <select
                          value={months}
                          onChange={(event) =>
                            setTerms((current) => ({
                              ...current,
                              [item.key]: Number(event.target.value),
                            }))
                          }
                          aria-label={`Term for ${item.name}`}
                        >
                          {TERM_OPTIONS.map((option) => (
                            <option key={option.months} value={option.months}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <p className={styles.renewalNote}>
                        Renews {months} months from purchase. Next renewal around {renewalYear}.
                      </p>
                    </div>

                    <div className={styles.itemAside}>
                      <strong className={styles.itemPrice}>{formatCartMoney(item.price * item.qty)}</strong>
                      <button
                        type="button"
                        className={styles.removeIconBtn}
                        aria-label={`Remove ${item.name} from cart`}
                        onClick={() => removeItem(item.key)}
                      >
                        <i className="fa-regular fa-trash-can" aria-hidden="true" />
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </section>

          <aside className={styles.sidebar}>
            <div className={styles.summaryCard}>
              <h3>Order Summary</h3>
              <p className={styles.summaryCount}>
                {itemCount} Item{itemCount === 1 ? "" : "s"}
              </p>
              <div className={styles.summaryTotal}>
                <span>Subtotal (PHP)</span>
                <strong>{formatCartMoney(subtotal)}</strong>
              </div>

              <div className={styles.promoBlock}>
                <button
                  type="button"
                  className={styles.promoLink}
                  onClick={() => setPromoOpen(true)}
                >
                  Have a promo code?
                </button>

                {promoOpen && (
                  <div className={styles.promoRow}>
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(event) => setPromoCode(event.target.value)}
                      className={styles.promoInput}
                      placeholder="Enter promo code"
                      aria-label="Promo code"
                      autoFocus
                    />
                    <button type="button" className={styles.promoApplyBtn} onClick={applyPromoCode}>
                      Apply
                    </button>
                    <button
                      type="button"
                      className={styles.promoCloseBtn}
                      aria-label="Close promo code"
                      onClick={closePromo}
                    >
                      <i className="fa-solid fa-xmark" aria-hidden="true" />
                    </button>
                  </div>
                )}

                {appliedPromo && (
                  <p className={styles.promoApplied}>Promo applied: {appliedPromo}</p>
                )}
              </div>

              <button
                type="button"
                className={styles.checkoutBtn}
                disabled={emptyState}
                onClick={handleReadyForCheckout}
              >
                Ready for Checkout
              </button>
            </div>

            <div className={styles.trustCard}>
              <h4>Quality You Can Trust</h4>
              <p>
                WebFocus Solutions, Inc. provides enterprise-grade hosting, domain registration, and
                managed services backed by Manila NOC support.
              </p>
            </div>
          </aside>
        </div>
      </div>

      <CustomerSignInModal
        open={signInOpen}
        onClose={() => setSignInOpen(false)}
        onSuccess={handleSignInSuccess}
      />
    </div>
  );
}
