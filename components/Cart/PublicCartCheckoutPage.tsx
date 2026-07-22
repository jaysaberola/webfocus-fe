import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { CustomerSignInModal } from "@/components/Auth/CustomerSignInModal";
import CheckoutAgreementModal from "@/components/Cart/CheckoutAgreementModal";
import CheckoutPaymentMethods from "@/components/Cart/CheckoutPaymentMethods";
import LiveCheckoutProgress from "@/components/Cart/LiveCheckoutProgress";
import {
  cartCount,
  cartSubtotal,
  clearPublicCart,
  formatCartMoney,
  PublicCartItem,
  readPublicCart,
  removePublicCartItem,
} from "@/lib/publicCart";
import {
  formatPaynamicsPaymentMethod,
  getPaynamicsPaymentLabel,
  PAYNAMICS_PAYMENT_METHODS,
} from "@/lib/checkoutPaymentMethods";
import { hasCheckoutAgreementAccepted, markCheckoutAgreementAccepted } from "@/lib/checkoutAgreement";
import { readStoredAuthToken } from "@/lib/authToken";
import { fetchCurrentCustomer, getStoredCustomer, PublicCustomer } from "@/services/publicCustomerService";
import { createSalesTransaction } from "@/services/salesTransactionService";
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
  const [agreementOpen, setAgreementOpen] = useState(false);
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(PAYNAMICS_PAYMENT_METHODS[0]?.id ?? "cc");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [customer, setCustomer] = useState<PublicCustomer | null>(null);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [promoOpen, setPromoOpen] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);

  const refreshAuth = () => {
    const storedCustomer = getStoredCustomer();
    setCustomer(storedCustomer);
    setIsLoggedIn(Boolean(readStoredAuthToken() && storedCustomer));
  };

  const refreshCart = () => {
    const nextItems = readPublicCart();
    setItems(nextItems);
    setAgreementAccepted(hasCheckoutAgreementAccepted(nextItems));
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
  const emptyState = items.length === 0;
  const paymentStepActive = isLoggedIn && agreementAccepted && !emptyState;
  const checkoutBlockedByAgreement = isLoggedIn && !agreementAccepted && !emptyState;

  const removeItem = (key: string) => {
    setItems(removePublicCartItem(key));
  };

  const handleReadyForCheckout = () => {
    if (!items.length) return;
    if (!isLoggedIn) {
      setSignInOpen(true);
      return;
    }
    if (!agreementAccepted) {
      setAgreementOpen(true);
      return;
    }
  };

  const handleAgreementContinueToPayment = () => {
    setAgreementAccepted(true);
    setAgreementOpen(false);
    markCheckoutAgreementAccepted(items);
  };

  const handleProceedToPaynamics = async () => {
    if (!items.length) return;
    if (!isLoggedIn) {
      setSignInOpen(true);
      return;
    }
    if (!agreementAccepted) {
      setAgreementOpen(true);
      return;
    }
    if (!paymentMethod) {
      toast.warning("Select a payment method to continue.");
      return;
    }

    const activeCustomer = customer ?? getStoredCustomer();
    if (!activeCustomer) {
      setSignInOpen(true);
      return;
    }

    const paymentLabel = getPaynamicsPaymentLabel(paymentMethod);
    const paymentGateway = formatPaynamicsPaymentMethod(paymentMethod);
    const itemSummary = items.map((item) => `${item.qty} x ${item.name} @ ${formatCartMoney(item.price)}`).join("\n");

    try {
      setPlacingOrder(true);
      const result = await createSalesTransaction({
        customer_id: activeCustomer.id,
        customer_name: `${activeCustomer.fname ?? ""} ${activeCustomer.lname ?? ""}`.trim(),
        customer_email: activeCustomer.email,
        subtotal,
        discount_total: 0,
        tax_total: 0,
        shipping_total: 0,
        payment_status: "pending",
        order_status: "pending",
        transacted_at: new Date().toISOString(),
        items: items.map((item) => ({
          product_id: item.id ?? null,
          name: item.name,
          item_type: "product",
          price: item.price,
          quantity: item.qty,
          total_price: item.price * item.qty,
        })),
        notes: [
          "Customer checkout order",
          `Payment method: ${paymentGateway} (${paymentLabel})`,
          "",
          "Items:",
          itemSummary,
        ].join("\n"),
      });
      clearPublicCart();
      const orderNo = result?.data?.transaction_no;
      toast.success(
        orderNo
          ? `Order ${orderNo} submitted. Redirecting to your orders...`
          : "Order submitted. Redirecting to your orders..."
      );
      window.location.assign("/public/dashboard?tab=orders");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to start Paynamics payment");
    } finally {
      setPlacingOrder(false);
    }
  };

  const handleSignInSuccess = () => {
    refreshAuth();
    fetchCurrentCustomer({ silent: true }).then(setCustomer).catch(() => undefined);
    router.replace("/public/cart", undefined, { shallow: true });
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

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.pageHeader}>
          <h1>Your Cart</h1>
          <p>Review your requested domains and services prior to proceeding with checkout.</p>
        </header>

        <LiveCheckoutProgress
          isLoggedIn={isLoggedIn}
          hasItems={!emptyState}
          agreementAccepted={agreementAccepted}
        />

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

              {isLoggedIn && !emptyState ? (
                <div className={styles.agreementBlock}>
                  {agreementAccepted ? (
                    <p className={styles.agreementAccepted}>
                      <i className="fa-solid fa-circle-check" aria-hidden="true" />
                      Agreement accepted
                    </p>
                  ) : (
                    <p className={styles.agreementPrompt}>
                      Review and accept the policy and contract agreement before checkout.
                    </p>
                  )}
                  <button
                    type="button"
                    className={styles.agreementLink}
                    onClick={() => setAgreementOpen(true)}
                  >
                    {agreementAccepted ? "Review agreement again" : "Read policy and contract agreement"}
                  </button>
                </div>
              ) : null}

              {paymentStepActive ? (
                <CheckoutPaymentMethods value={paymentMethod} onChange={setPaymentMethod} />
              ) : null}

              {paymentStepActive ? (
                <button
                  type="button"
                  className={styles.checkoutBtn}
                  disabled={placingOrder}
                  onClick={handleProceedToPaynamics}
                >
                  {placingOrder ? "Processing..." : "Proceed to Paynamics"}
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.checkoutBtn}
                  disabled={emptyState || checkoutBlockedByAgreement}
                  onClick={handleReadyForCheckout}
                >
                  Ready for Checkout
                </button>
              )}
              {checkoutBlockedByAgreement ? (
                <p className={styles.agreementHint}>
                  Open the agreement, scroll to the end, and accept it to continue.
                </p>
              ) : paymentStepActive ? (
                <p className={styles.agreementHint}>
                  Selected: {getPaynamicsPaymentLabel(paymentMethod)} via Paynamics IPG.
                </p>
              ) : null}
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

      <CheckoutAgreementModal
        open={agreementOpen}
        items={items}
        onClose={() => setAgreementOpen(false)}
        onAccept={handleAgreementContinueToPayment}
      />
    </div>
  );
}
