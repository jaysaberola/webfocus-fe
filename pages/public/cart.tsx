import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import LandingPageLayout from "@/components/Layout/GuestLayout";
import { CustomerSignInModal } from "@/components/Auth/CustomerSignInModal";
import CheckoutAgreementModal from "@/components/Cart/CheckoutAgreementModal";
import LiveCheckoutProgress from "@/components/Cart/LiveCheckoutProgress";
import {
  cartCount,
  cartHasMixedCheckout,
  cartHeldQuotationItems,
  cartIsQuotationOnly,
  cartPayableItems,
  cartSubtotal,
  clearPublicCart,
  formatCartItemPrice,
  formatCartMoney,
  formatCartSubtotalLabel,
  isPendingQuotationCartItem,
  MIXED_CART_WEB_DESIGN_NOTICE,
  PENDING_QUOTATION_LABEL,
  PublicCartItem,
  readPublicCart,
  removePublicCartItem,
  writePublicCart,
} from "@/lib/publicCart";
import {
  hasCheckoutAgreementAccepted,
  markCheckoutAgreementAccepted,
} from "@/lib/checkoutAgreement";
import { readStoredAuthToken } from "@/lib/authToken";
import {
  fetchCurrentCustomer,
  getStoredCustomer,
  PublicCustomer,
} from "@/services/publicCustomerService";
import {
  checkoutWithPaynamics,
  createSalesTransaction,
} from "@/services/salesTransactionService";
import { WEB_DESIGN_PENDING_QUOTATION_MARKER } from "@/lib/commerceAdmin/webDesignPricing";
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
  if (/dms|document/i.test(category || "")) {
    return "fa-solid fa-file-lines";
  }
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
  const payableItems = cartPayableItems(items);
  const heldQuotationItems = cartHeldQuotationItems(items);
  const mixedCheckout = cartHasMixedCheckout(items);
  const subtotal = cartSubtotal(payableItems);
  const emptyState = items.length === 0;
  const quotationOnly = cartIsQuotationOnly(items);
  const canCheckoutPayable = payableItems.length > 0;
  const paymentStepActive =
    isLoggedIn && agreementAccepted && !emptyState && (quotationOnly || canCheckoutPayable);
  const checkoutBlockedByAgreement =
    isLoggedIn && !agreementAccepted && !emptyState;

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

    const activeCustomer = customer ?? getStoredCustomer();
    if (!activeCustomer) {
      setSignInOpen(true);
      return;
    }

    const checkoutItems = quotationOnly ? items : payableItems;
    if (!checkoutItems.length) {
      toast.info(
        "Your cart only has Pending Quotation web design items. Submit a quotation request, or wait for Customer Care to set the price."
      );
      return;
    }

    if (mixedCheckout) {
      toast.info(MIXED_CART_WEB_DESIGN_NOTICE);
    }

    const itemSummary = checkoutItems
      .map((item) => {
        const priceLabel = isPendingQuotationCartItem(item)
          ? PENDING_QUOTATION_LABEL
          : formatCartMoney(item.price);
        return `${item.qty} x ${item.name} @ ${priceLabel}${
          item.detail ? ` (${item.detail})` : ""
        }`;
      })
      .join("\n");

    try {
      setPlacingOrder(true);

      if (quotationOnly) {
        const result = await createSalesTransaction({
          customer_id: activeCustomer.id,
          customer_name:
            `${activeCustomer.fname ?? ""} ${activeCustomer.lname ?? ""}`.trim(),
          customer_email: activeCustomer.email,
          subtotal: 0,
          discount_total: 0,
          tax_total: 0,
          shipping_total: 0,
          payment_status: "pending",
          order_status: "pending",
          transacted_at: new Date().toISOString(),
          items: checkoutItems.map((item) => ({
            product_id: item.id ?? null,
            name: item.name,
            item_type: "web_design",
            price: 0,
            quantity: item.qty,
            total_price: 0,
          })),
          notes: [
            "Web design quotation request",
            WEB_DESIGN_PENDING_QUOTATION_MARKER,
            "Notify: Customer Care",
            "",
            "Items:",
            itemSummary,
          ].join("\n"),
        });

        clearPublicCart();
        const orderNo = result?.data?.transaction_no;
        toast.success(
          orderNo
            ? `Quotation request ${orderNo} submitted to Customer Care. Sales will set the package price.`
            : "Quotation request submitted to Customer Care. Sales will set the package price."
        );
        window.location.assign("/public/dashboard?tab=orders");
        return;
      }

      const result = await checkoutWithPaynamics({
        customer_id: activeCustomer.id,
        customer_name:
          `${activeCustomer.fname ?? ""} ${activeCustomer.lname ?? ""}`.trim(),
        customer_email: activeCustomer.email,
        subtotal,
        discount_total: 0,
        tax_total: 0,
        shipping_total: 0,
        payment_status: "pending",
        order_status: "pending",
        transacted_at: new Date().toISOString(),
        items: checkoutItems.map((item) => ({
          product_id: item.id ?? null,
          name: item.name,
          item_type: "product",
          price: item.price,
          quantity: item.qty,
          total_price: item.price * item.qty,
        })),
        notes: [
          "Customer checkout order",
          "Payment gateway: Paynamics hosted portal",
          mixedCheckout
            ? "Note: Web design Pending Quotation items were excluded and kept in the customer cart."
            : null,
          "",
          "Items:",
          itemSummary,
        ]
          .filter(Boolean)
          .join("\n"),
      });

      const redirectUrl = result?.paynamics?.redirect_url;
      if (!redirectUrl) {
        throw new Error("Paynamics did not return a payment portal URL.");
      }

      // Keep pending web design quotations in the cart after paying for other services.
      writePublicCart(heldQuotationItems);
      toast.success(
        mixedCheckout
          ? "Opening payment for payable items. Web design Pending Quotation remains in your cart."
          : "Redirecting to the secure Paynamics payment portal..."
      );
      window.location.assign(redirectUrl);
    } catch (err: any) {
      const validationErrors = err?.response?.data?.errors;
      const firstValidationError = validationErrors
        ? Object.values(validationErrors).flat().find(Boolean)
        : null;

      toast.error(
        String(
          firstValidationError ||
            err?.response?.data?.message ||
            err?.message ||
            (quotationOnly
              ? "Failed to submit quotation request."
              : "Failed to open the Paynamics payment portal.")
        )
      );
    } finally {
      setPlacingOrder(false);
    }
  };

  const handleSignInSuccess = () => {
    refreshAuth();
    fetchCurrentCustomer({ silent: true })
      .then(setCustomer)
      .catch(() => undefined);
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
          <p>
            Review your requested domains and services prior to proceeding
            with checkout.
          </p>
        </header>

        <LiveCheckoutProgress
          isLoggedIn={isLoggedIn}
          hasItems={!emptyState}
          agreementAccepted={agreementAccepted}
        />

        <div className={styles.layout}>
          <section className={styles.mainColumn}>
            {mixedCheckout ? (
              <div className={styles.mixedCartNotice} role="status">
                <i className="fa-solid fa-circle-info" aria-hidden="true" />
                <div>
                  <strong>Web design stays in your cart</strong>
                  <p>{MIXED_CART_WEB_DESIGN_NOTICE}</p>
                </div>
              </div>
            ) : null}
            {emptyState ? (
              <div className={styles.emptyCard}>
                <p>Your shopping cart is currently empty.</p>
                <Link
                  href="/public/services"
                  className={styles.browseLink}
                >
                  Browse Services
                </Link>
              </div>
            ) : (
              items.map((item) => {
                const months = terms[item.key] || 12;
                const renewalYear =
                  new Date().getFullYear() + Math.ceil(months / 12);

                return (
                  <article key={item.key} className={styles.itemCard}>
                    <div
                      className={styles.itemIcon}
                      aria-hidden="true"
                    >
                      <i className={getCartItemIcon(item.category)} />
                    </div>

                    <div className={styles.itemBody}>
                      <h2 className={styles.itemTitle}>
                        {getCartItemTitle(item)}
                      </h2>

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
                            <option
                              key={option.months}
                              value={option.months}
                            >
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <p className={styles.renewalNote}>
                        Renews {months} months from purchase. Next renewal
                        around {renewalYear}.
                      </p>
                    </div>

                    <div className={styles.itemAside}>
                      <strong className={styles.itemPrice}>
                        {formatCartItemPrice(item)}
                      </strong>
                      <button
                        type="button"
                        className={styles.removeIconBtn}
                        aria-label={`Remove ${item.name} from cart`}
                        onClick={() => removeItem(item.key)}
                      >
                        <i
                          className="fa-regular fa-trash-can"
                          aria-hidden="true"
                        />
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
                <strong>
                  {quotationOnly
                    ? PENDING_QUOTATION_LABEL
                    : formatCartSubtotalLabel(payableItems)}
                </strong>
              </div>
              {heldQuotationItems.length > 0 ? (
                <p className={styles.heldQuoteHint}>
                  {heldQuotationItems.length} web design item
                  {heldQuotationItems.length === 1 ? "" : "s"} held as{" "}
                  {PENDING_QUOTATION_LABEL}
                  {mixedCheckout ? " (excluded from this checkout)" : ""}.
                </p>
              ) : null}

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
                      onChange={(event) =>
                        setPromoCode(event.target.value)
                      }
                      className={styles.promoInput}
                      placeholder="Enter promo code"
                      aria-label="Promo code"
                      autoFocus
                    />
                    <button
                      type="button"
                      className={styles.promoApplyBtn}
                      onClick={applyPromoCode}
                    >
                      Apply
                    </button>
                    <button
                      type="button"
                      className={styles.promoCloseBtn}
                      aria-label="Close promo code"
                      onClick={closePromo}
                    >
                      <i
                        className="fa-solid fa-xmark"
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                )}

                {appliedPromo && (
                  <p className={styles.promoApplied}>
                    Promo applied: {appliedPromo}
                  </p>
                )}
              </div>

              {isLoggedIn && !emptyState ? (
                <div className={styles.agreementBlock}>
                  {agreementAccepted ? (
                    <p className={styles.agreementAccepted}>
                      <i
                        className="fa-solid fa-circle-check"
                        aria-hidden="true"
                      />
                      Agreement accepted
                    </p>
                  ) : (
                    <p className={styles.agreementPrompt}>
                      Review and accept the policy and contract agreement
                      before checkout.
                    </p>
                  )}

                  <button
                    type="button"
                    className={styles.agreementLink}
                    onClick={() => setAgreementOpen(true)}
                  >
                    {agreementAccepted
                      ? "Review agreement again"
                      : "Read policy and contract agreement"}
                  </button>
                </div>
              ) : null}

              {paymentStepActive ? (
                <button
                  type="button"
                  className={styles.checkoutBtn}
                  disabled={placingOrder}
                  onClick={handleProceedToPaynamics}
                >
                  {placingOrder
                    ? quotationOnly
                      ? "Submitting quotation..."
                      : "Opening secure payment..."
                    : quotationOnly
                      ? "Submit Quotation Request"
                      : mixedCheckout
                        ? "Checkout Payable Items"
                        : "Proceed to Paynamics"}
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.checkoutBtn}
                  disabled={emptyState || checkoutBlockedByAgreement}
                  onClick={handleReadyForCheckout}
                >
                  {!isLoggedIn ? "Sign In to Continue" : "Ready for Checkout"}
                </button>
              )}

              {checkoutBlockedByAgreement ? (
                <p className={styles.agreementHint}>
                  Open the agreement, scroll to the end, and accept it to
                  continue.
                </p>
              ) : paymentStepActive && quotationOnly ? (
                <p className={styles.agreementHint}>
                  This request goes to Customer Care as Pending Quotation. Sales
                  will set the package price before payment.
                </p>
              ) : paymentStepActive && mixedCheckout ? (
                <p className={styles.agreementHint}>
                  Only non-web-design items will be charged now. Web design
                  Pending Quotation remains in your cart.
                </p>
              ) : paymentStepActive ? (
                <p className={styles.agreementHint}>
                  Payment details are entered securely on the Paynamics
                  portal.
                </p>
              ) : null}
            </div>

            <div className={styles.trustCard}>
              <h4>Quality You Can Trust</h4>
              <p>
                WebFocus Solutions, Inc. provides enterprise-grade hosting,
                domain registration, and managed services backed by Manila
                NOC support.
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

PublicCartCheckoutPage.Layout = function PublicCartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LandingPageLayout
      pageData={{ title: "Your Cart", meta: { title: "Your Cart" } }}
      layout={{ hideBanner: true, fullWidth: true, minimalFooter: true }}
    >
      {children}
    </LandingPageLayout>
  );
};
