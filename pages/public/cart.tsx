import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import LandingPageLayout from "@/components/Layout/GuestLayout";
import { CustomerSignInModal } from "@/components/Auth/CustomerSignInModal";
import CheckoutAgreementModal from "@/components/Cart/CheckoutAgreementModal";
import CheckoutBillingAddressModal from "@/components/Cart/CheckoutBillingAddressModal";
import LiveCheckoutProgress from "@/components/Cart/LiveCheckoutProgress";
import {
  customerNeedsCheckoutBillingAddress,
  isCheckoutBillingValidationError,
} from "@/lib/checkoutBillingAddress";
import {
  cartCount,
  cartHasMixedCheckout,
  cartHeldQuotationItems,
  cartIsQuotationOnly,
  cartPayableItems,
  cartSubtotal,
  cartUnsubmittedQuotationItems,
  formatCartItemPrice,
  formatCartMoney,
  formatCartSubtotalLabel,
  isPendingQuotationCartItem,
  isQuotationSubmittedCartItem,
  applyQuotationTransactionNumbers,
  MIXED_CART_WEB_DESIGN_NOTICE,
  PENDING_QUOTATION_LABEL,
  PublicCartItem,
  readPublicCart,
  removePublicCartItem,
  beginPublicCartCheckout,
  updatePublicCartItemNotes,
  writePublicCart,
} from "@/lib/publicCart";
import {
  hasCheckoutAgreementAccepted,
  markCheckoutAgreementAccepted,
} from "@/lib/checkoutAgreement";
import {
  buildWebDesignMetaLine,
  resolveWebDesignCartMeta,
  webDesignAdditionalServicesLabel,
} from "@/lib/webDesignSetup";
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

function applyClientNotesToCart(
  cartItems: PublicCartItem[],
  notesByKey: Record<string, string>,
) {
  return cartItems.map((item) => {
    if (!isPendingQuotationCartItem(item)) return item;
    const notes = String(notesByKey[item.key] ?? item.clientNotes ?? "").trim();
    return { ...item, clientNotes: notes };
  });
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

function quotationCartItemSummary(item: PublicCartItem) {
  const meta = resolveWebDesignCartMeta(item);
  const extras = webDesignAdditionalServicesLabel(meta);
  const parts = [
    `${item.qty} x ${item.name} @ ${PENDING_QUOTATION_LABEL}`,
    meta?.templateLabel ? `Template: ${meta.templateLabel}` : null,
    extras ? `Additional Services: ${extras}` : item.detail ? `(${item.detail})` : null,
  ].filter(Boolean);
  return parts.join(" · ");
}

async function submitPendingQuotationItem(
  item: PublicCartItem,
  customer: PublicCustomer,
  extraNotes: string[] = [],
) {
  const result = await createSalesTransaction({
    customer_id: customer.id,
    customer_name: `${customer.fname ?? ""} ${customer.lname ?? ""}`.trim(),
    customer_email: customer.email,
    subtotal: 0,
    discount_total: 0,
    tax_total: 0,
    shipping_total: 0,
    payment_status: "pending",
    order_status: "pending",
    items: [
      {
        product_id: item.id ?? null,
        name: item.name,
        item_type: "web_design",
        price: 0,
        quantity: item.qty,
        total_price: 0,
      },
    ],
    notes: [
      "Web design quotation request",
      String(item.clientNotes || "").trim()
        ? `Notes:\n${String(item.clientNotes).trim()}`
        : null,
      WEB_DESIGN_PENDING_QUOTATION_MARKER,
      ...extraNotes,
      "Notify: Customer Care",
      item.webDesign
        ? buildWebDesignMetaLine({
            path: "online-services",
            templateLabel: item.webDesign.templateLabel,
            templateId: item.webDesign.templateId,
            packageName: item.webDesign.packageName || item.name,
            packagePrice: item.webDesign.packagePrice || 0,
            serviceFeatures: item.webDesign.serviceFeatures || [],
            paymentMethods: item.webDesign.paymentMethods || [],
          })
        : null,
      "",
      "Service: Web Design",
      item.webDesign?.templateLabel ? `Template: ${item.webDesign.templateLabel}` : null,
      webDesignAdditionalServicesLabel(item.webDesign)
        ? `Additional Services: ${webDesignAdditionalServicesLabel(item.webDesign)}`
        : null,
      "",
      "Items:",
      quotationCartItemSummary(item),
    ].filter(Boolean).join("\n"),
  });

  return String(result?.data?.transaction_no ?? "").trim() || null;
}

async function submitPendingQuotationItems(
  items: PublicCartItem[],
  customer: PublicCustomer,
  extraNotes: string[] = [],
) {
  const orderNosByKey: Record<string, string> = {};
  for (const item of items) {
    const orderNo = await submitPendingQuotationItem(item, customer, extraNotes);
    if (orderNo) orderNosByKey[item.key] = orderNo;
  }
  return orderNosByKey;
}

export default function PublicCartCheckoutPage() {
  const router = useRouter();
  const [items, setItems] = useState<PublicCartItem[]>([]);
  const [terms, setTerms] = useState<Record<string, number>>({});
  const [signInOpen, setSignInOpen] = useState(false);
  const [agreementOpen, setAgreementOpen] = useState(false);
  const [billingOpen, setBillingOpen] = useState(false);
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [customer, setCustomer] = useState<PublicCustomer | null>(null);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [promoOpen, setPromoOpen] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [quoteNotes, setQuoteNotes] = useState<Record<string, string>>({});

  const refreshAuth = () => {
    const storedCustomer = getStoredCustomer();
    setCustomer(storedCustomer);
    setIsLoggedIn(Boolean(readStoredAuthToken() && storedCustomer));
  };

  const refreshCart = () => {
    const nextItems = readPublicCart();
    setItems(nextItems);
    setQuoteNotes((current) => {
      const next: Record<string, string> = {};
      nextItems.forEach((item) => {
        if (!isPendingQuotationCartItem(item)) return;
        next[item.key] =
          current[item.key] !== undefined
            ? current[item.key]
            : String(item.clientNotes || "");
      });
      return next;
    });
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
    const onPageShow = () => refreshCart();
    window.addEventListener("pageshow", onPageShow);

    return () => {
      window.removeEventListener("public-cart-updated", refreshCart);
      window.removeEventListener("public-customer-updated", refreshAuth);
      window.removeEventListener("storage", refreshCart);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);

  useEffect(() => {
    if (!readStoredAuthToken()) return;
    let alive = true;
    fetchCurrentCustomer({ silent: true, force: true })
      .then((fresh) => {
        if (alive) setCustomer(fresh);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
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

  const handleProceedToPaynamics = async (customerOverride?: PublicCustomer) => {
    if (!items.length) return;

    if (!isLoggedIn) {
      setSignInOpen(true);
      return;
    }

    if (!agreementAccepted) {
      setAgreementOpen(true);
      return;
    }

    let activeCustomer =
      customerOverride ?? customer ?? getStoredCustomer();
    if (!activeCustomer) {
      setSignInOpen(true);
      return;
    }

    // Always re-check the server profile so a saved billing address skips the modal.
    if (!quotationOnly) {
      try {
        const fresh = await fetchCurrentCustomer({ silent: true, force: true });
        activeCustomer = {
          ...activeCustomer,
          ...fresh,
          address_street: fresh.address_street || activeCustomer.address_street,
          address_city: fresh.address_city || activeCustomer.address_city,
          address_municipality:
            fresh.address_municipality || activeCustomer.address_municipality,
          address_province: fresh.address_province || activeCustomer.address_province,
          address_zip: fresh.address_zip || activeCustomer.address_zip,
        };
        setCustomer(activeCustomer);
      } catch {
        // Keep local customer if refresh fails.
      }

      if (customerNeedsCheckoutBillingAddress(activeCustomer)) {
        setBillingOpen(true);
        toast.info("Add your billing address to continue to Paynamics.");
        return;
      }
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
      const cartWithNotes = applyClientNotesToCart(items, quoteNotes);
      writePublicCart(cartWithNotes);
      setItems(cartWithNotes);

      if (quotationOnly) {
        const unsubmitted = cartUnsubmittedQuotationItems(cartWithNotes);
        if (!unsubmitted.length) {
          toast.info(
            "This web design quotation was already sent to Sales. It stays in your cart until the package price is set."
          );
          return;
        }

        const orderNosByKey = await submitPendingQuotationItems(unsubmitted, activeCustomer);
        const orderNos = Object.values(orderNosByKey);
        writePublicCart(applyQuotationTransactionNumbers(cartWithNotes, orderNosByKey));
        toast.success(
          orderNos.length
            ? `Quotation request${orderNos.length > 1 ? "s" : ""} ${orderNos.join(", ")} submitted to Sales. ${
                orderNos.length > 1 ? "Each pending quotation has its own invoice." : "It remains in your cart until priced."
              }`
            : "Quotation request submitted to Sales. It remains in your cart until priced."
        );
        window.location.assign("/public/cart");
        return;
      }

      // Mixed cart: each pending quotation gets its own invoice, then priced items share one Paynamics invoice.
      let quotationOrderNos: string[] = [];
      const quotedItems = cartHeldQuotationItems(cartWithNotes);
      const unsubmittedQuotes = cartUnsubmittedQuotationItems(quotedItems);
      let quotedCart = cartWithNotes;
      if (mixedCheckout && unsubmittedQuotes.length > 0) {
        const orderNosByKey = await submitPendingQuotationItems(unsubmittedQuotes, activeCustomer, [
          "Submitted with mixed cart checkout (other services paid via Paynamics)",
        ]);
        quotationOrderNos = Object.values(orderNosByKey);
        quotedCart = applyQuotationTransactionNumbers(cartWithNotes, orderNosByKey);
      } else if (mixedCheckout && quotedItems.length > 0) {
        quotationOrderNos = quotedItems
          .map((item) => String(item.quotationTransactionNo || "").trim())
          .filter(Boolean);
      }

      const quotationOrderLabel = quotationOrderNos.join(", ");

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
          checkoutItems.length > 1
            ? `Combined invoice: ${checkoutItems.length} priced services paid in one transaction.`
            : null,
          mixedCheckout
            ? `Note: Pending quotation kept on a separate invoice${
                quotationOrderLabel ? ` (${quotationOrderLabel})` : ""
              } and was not included in this payment.`
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

      // Drop priced items from the live cart now; restore them only if payment is cancelled.
      const cartToKeep = heldQuotationItems.length > 0 ? quotedCart : cartWithNotes;
      beginPublicCartCheckout({
        items: cartToKeep,
        payableKeys: checkoutItems.map((item) => item.key),
        transactionId: result?.data?.id ?? null,
        transactionNo: result?.data?.transaction_no ?? null,
        requestId: result?.paynamics?.request_id ?? null,
      });
      toast.success(
        mixedCheckout
          ? quotationOrderNos.length
            ? `Pending quotation${quotationOrderNos.length > 1 ? "s" : ""} ${quotationOrderLabel} filed on ${quotationOrderNos.length > 1 ? "separate invoices" : "a separate invoice"}. Opening one payment for all priced services...`
            : "Pending quotation stays on a separate invoice. Opening one payment for priced services..."
          : checkoutItems.length > 1
            ? "Opening one payment for all priced services on the same invoice..."
            : "Redirecting to the secure Paynamics payment portal..."
      );
      window.location.assign(redirectUrl);
    } catch (err: any) {
      const validationErrors = err?.response?.data?.errors;
      const firstValidationError = validationErrors
        ? Object.values(validationErrors).flat().find(Boolean)
        : null;

      if (!quotationOnly && isCheckoutBillingValidationError(validationErrors)) {
        setBillingOpen(true);
        toast.error(
          "Complete your billing address (street, city, province, and ZIP) to continue checkout."
        );
        return;
      }

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

  const handleBillingAddressSaved = async (updated: PublicCustomer) => {
    setCustomer(updated);
    setBillingOpen(false);

    // Confirm the address persisted before continuing checkout.
    try {
      const fresh = await fetchCurrentCustomer({ silent: true, force: true });
      const merged = {
        ...updated,
        ...fresh,
        address_street: fresh.address_street || updated.address_street,
        address_city: fresh.address_city || updated.address_city,
        address_municipality:
          fresh.address_municipality || updated.address_municipality,
        address_province: fresh.address_province || updated.address_province,
        address_zip: fresh.address_zip || updated.address_zip,
      };
      setCustomer(merged);
      if (customerNeedsCheckoutBillingAddress(merged)) {
        setBillingOpen(true);
        toast.error(
          "Billing address did not save. Please try again before checkout."
        );
        return;
      }
      void handleProceedToPaynamics(merged);
    } catch {
      void handleProceedToPaynamics(updated);
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
                  <strong>Mixed cart checkout</strong>
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
                const isWebDesign = isPendingQuotationCartItem(item);

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
                        {(() => {
                          const meta = resolveWebDesignCartMeta(item);
                          if (isWebDesign && meta?.templateLabel) {
                            return (
                              <>
                                <span className={styles.templateName}>{meta.templateLabel}</span>
                                <span className={styles.packageName}>{item.name}</span>
                              </>
                            );
                          }
                          return getCartItemTitle(item);
                        })()}
                      </h2>

                      {isWebDesign ? (
                        <>
                          {(() => {
                            const extras = webDesignAdditionalServicesLabel(resolveWebDesignCartMeta(item));
                            return extras ? (
                              <p className={styles.addonLine}>Add-ons: {extras}</p>
                            ) : null;
                          })()}
                          <p className={styles.renewalNote}>
                            {isQuotationSubmittedCartItem(item)
                              ? `Sent to Sales${
                                  item.quotationTransactionNo &&
                                  item.quotationTransactionNo !== "submitted"
                                    ? ` (${item.quotationTransactionNo})`
                                    : ""
                                } · Pending Quotation · stays in your cart`
                              : "One-time web design package · Pending Quotation · no renewal term"}
                          </p>
                          <label className={styles.quoteNotes}>
                            <span>Notes:</span>
                            <textarea
                              value={quoteNotes[item.key] ?? item.clientNotes ?? ""}
                              onChange={(event) => {
                                const value = event.target.value;
                                setQuoteNotes((current) => ({
                                  ...current,
                                  [item.key]: value,
                                }));
                              }}
                              onBlur={(event) => {
                                updatePublicCartItemNotes(item.key, event.target.value);
                              }}
                              placeholder="Add details for the quotation (pages, branding, timeline, extras, etc.)"
                              rows={3}
                              maxLength={2000}
                              disabled={isQuotationSubmittedCartItem(item)}
                              aria-label={`Notes for ${item.name}`}
                            />
                          </label>
                        </>
                      ) : (
                        <>
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
                        </>
                      )}
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
                  {heldQuotationItems.length === 1 ? "" : "s"} as{" "}
                  {PENDING_QUOTATION_LABEL}
                  {heldQuotationItems.every(isQuotationSubmittedCartItem)
                    ? " — already sent to Sales (kept in your cart)"
                    : mixedCheckout
                      ? " — will be sent to Sales and kept in your cart when you checkout"
                      : " — stays in your cart after Sales receives the request"}
                  .
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
                  onClick={() => {
                    void handleProceedToPaynamics();
                  }}
                >
                  {placingOrder
                    ? quotationOnly
                      ? "Submitting quotation..."
                      : "Opening secure payment..."
                    : quotationOnly
                      ? heldQuotationItems.every(isQuotationSubmittedCartItem)
                        ? "Quotation Already Sent to Sales"
                        : "Submit Quotation Request"
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
                  {heldQuotationItems.every(isQuotationSubmittedCartItem)
                    ? "Sales already received this quotation. It remains in your cart until the package price is set."
                    : "This request goes to Sales as Pending Quotation and stays in your cart until priced."}
                </p>
              ) : paymentStepActive && mixedCheckout ? (
                <p className={styles.agreementHint}>
                  Payable services go to Paynamics. Web design is submitted to
                  Sales and remains in your cart as Pending Quotation.
                </p>
              ) : paymentStepActive &&
                customerNeedsCheckoutBillingAddress(customer) ? (
                <p className={styles.agreementHint}>
                  You&apos;ll be asked for street, city, province, and ZIP before
                  Paynamics opens.
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

      <CheckoutBillingAddressModal
        open={billingOpen}
        customer={customer}
        onClose={() => setBillingOpen(false)}
        onSaved={handleBillingAddressSaved}
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
