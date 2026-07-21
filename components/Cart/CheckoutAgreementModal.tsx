import { useEffect, useMemo, useRef, useState } from "react";
import {
  CHECKOUT_AGREEMENT_PRIVACY_LABEL,
  CHECKOUT_AGREEMENT_SECTIONS,
  CHECKOUT_AGREEMENT_TERMS_LABEL,
} from "@/lib/checkoutAgreementContent";
import { formatCartMoney, PublicCartItem } from "@/lib/publicCart";
import styles from "@/styles/checkoutAgreementModal.module.css";

type CheckoutAgreementModalProps = {
  open: boolean;
  items: PublicCartItem[];
  onClose: () => void;
  onAccept: () => void;
};

function isDomainItem(item: PublicCartItem) {
  return /domain/i.test(item.category || "") || /domain/i.test(item.name);
}

function isAddonItem(item: PublicCartItem) {
  return /addon|add-on|ssl|backup|security|whois|whols/i.test(
    `${item.category || ""} ${item.name} ${item.detail || ""}`
  );
}

function formatAddonBilling(item: PublicCartItem) {
  const source = `${item.detail || ""} ${item.category || ""}`.toLowerCase();
  if (/month|mo\b|monthly/.test(source)) return "Monthly";
  if (/year|yr\b|annual/.test(source)) return "Yearly";
  return "One-time";
}

export default function CheckoutAgreementModal({
  open,
  items,
  onClose,
  onAccept,
}: CheckoutAgreementModalProps) {
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const [scrolledToEnd, setScrolledToEnd] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);

  const grouped = useMemo(() => {
    const domains = items.filter(isDomainItem);
    const addons = items.filter((item) => !isDomainItem(item) && isAddonItem(item));
    const services = items.filter((item) => !isDomainItem(item) && !isAddonItem(item));
    return { domains, addons, services };
  }, [items]);

  const leadItem = grouped.domains[0] || (items.length === 1 ? items[0] : grouped.services[0]) || null;
  const summaryLead = leadItem?.name || null;

  useEffect(() => {
    if (!open) {
      setScrolledToEnd(false);
      setAcceptedTerms(false);
      setAcceptedPrivacy(false);
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      const el = bodyRef.current;
      if (!el) return;
      if (el.scrollHeight <= el.clientHeight + 8) {
        setScrolledToEnd(true);
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [open, items]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  const handleScroll = () => {
    const el = bodyRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 8) {
      setScrolledToEnd(true);
    }
  };

  if (!open) return null;

  const canContinue = scrolledToEnd && acceptedTerms && acceptedPrivacy;
  const purchaseSection = CHECKOUT_AGREEMENT_SECTIONS.find((section) => section.number === 1);
  const trailingSections = CHECKOUT_AGREEMENT_SECTIONS.filter((section) => section.number !== 1);

  return (
    <div className={styles.overlay} role="presentation">
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-agreement-title"
      >
        <div className={styles.header}>
          <div>
            <p className={styles.kicker}>Review required</p>
            <h2 id="checkout-agreement-title" className={styles.title}>
              Policy and contract agreement
            </h2>
            <p className={styles.subtitle}>
              Scroll to the bottom to unlock the acceptance checkboxes.
            </p>
          </div>
          <button type="button" className={styles.closeBtn} aria-label="Close" onClick={onClose}>
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>

        <div ref={bodyRef} className={styles.body} onScroll={handleScroll}>
          {purchaseSection ? (
            <section className={styles.section}>
              <div className={styles.sectionHeading}>
                <span className={styles.sectionNumber}>{purchaseSection.number}.</span>
                <h3 className={styles.sectionTitle}>{purchaseSection.title}</h3>
              </div>
              {purchaseSection.paragraphs.map((paragraph) => (
                <p key={paragraph} className={styles.sectionText}>
                  {paragraph}
                </p>
              ))}
            </section>
          ) : null}

          <section className={styles.section}>
            <div className={styles.sectionHeading}>
              <span className={styles.sectionNumber}>2.</span>
              <h3 className={styles.sectionTitle}>Order Contract Summary</h3>
            </div>

            <div className={styles.summaryCard}>
              {summaryLead ? <p className={styles.summaryLead}>{summaryLead}</p> : null}

              {grouped.domains.length > 0 && (
                <div className={styles.summaryBlock}>
                  <div className={styles.summaryBlockHead}>
                    <p className={styles.summaryBlockTitle}>Domains</p>
                    <strong className={styles.summaryBlockPrice}>
                      {formatCartMoney(
                        grouped.domains.reduce((sum, item) => sum + item.price * item.qty, 0)
                      )}
                    </strong>
                  </div>
                  {grouped.domains.map((item) => (
                    <p key={item.key} className={styles.summaryMeta}>
                      Configuration: {item.name}
                    </p>
                  ))}
                </div>
              )}

              {grouped.services.length > 0 && (
                <div className={styles.summaryBlock}>
                  <div className={styles.summaryBlockHead}>
                    <p className={styles.summaryBlockTitle}>Services</p>
                    <strong className={styles.summaryBlockPrice}>
                      {formatCartMoney(
                        grouped.services.reduce((sum, item) => sum + item.price * item.qty, 0)
                      )}
                    </strong>
                  </div>
                  {grouped.services
                    .filter((item) => grouped.services.length > 1 || item.name !== summaryLead)
                    .map((item) => (
                    <div key={item.key} className={styles.serviceLine}>
                      <span>
                        {item.qty} x {item.name}
                      </span>
                      <strong>{formatCartMoney(item.price * item.qty)}</strong>
                    </div>
                  ))}
                </div>
              )}

              {grouped.addons.length > 0 && (
                <div className={styles.summaryBlock}>
                  <p className={styles.summaryBlockTitle}>Add-ons</p>
                  {grouped.addons.map((item) => (
                    <div key={item.key} className={styles.addonLine}>
                      <span>+ {item.name}</span>
                      <strong>
                        {formatCartMoney(item.price * item.qty)}/{formatAddonBilling(item)}
                      </strong>
                    </div>
                  ))}
                </div>
              )}

              {!summaryLead && items.length === 0 ? (
                <p className={styles.summaryMeta}>No products are currently in your cart.</p>
              ) : null}
            </div>
          </section>

          {trailingSections.map((section) => (
            <section key={section.number} className={styles.section}>
              <div className={styles.sectionHeading}>
                <span className={styles.sectionNumber}>{section.number}.</span>
                <h3 className={styles.sectionTitle}>{section.title}</h3>
              </div>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className={styles.sectionText}>
                  {paragraph}
                </p>
              ))}
            </section>
          ))}

          <section className={styles.acceptSection}>
            <div className={styles.checkboxList}>
              <label
                className={`${styles.checkboxRow} ${scrolledToEnd ? styles.checkboxRowEnabled : ""}`}
              >
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  disabled={!scrolledToEnd}
                  onChange={(event) => setAcceptedTerms(event.target.checked)}
                />
                <span className={styles.checkboxLabel}>{CHECKOUT_AGREEMENT_TERMS_LABEL}</span>
              </label>

              <label
                className={`${styles.checkboxRow} ${scrolledToEnd ? styles.checkboxRowEnabled : ""}`}
              >
                <input
                  type="checkbox"
                  checked={acceptedPrivacy}
                  disabled={!scrolledToEnd}
                  onChange={(event) => setAcceptedPrivacy(event.target.checked)}
                />
                <span className={styles.checkboxLabel}>{CHECKOUT_AGREEMENT_PRIVACY_LABEL}</span>
              </label>
            </div>
            <p className={scrolledToEnd ? styles.scrollHintReady : styles.scrollHint}>
              {scrolledToEnd
                ? "You reached the end. The checkboxes are now enabled."
                : "Scroll through the agreement to enable the checkboxes."}
            </p>
          </section>
        </div>

        <div className={styles.footer}>
          <button
            type="button"
            className={`${styles.continueBtn} ${canContinue ? styles.continueBtnReady : ""}`}
            disabled={!canContinue}
            onClick={onAccept}
          >
            Continue to payment
          </button>
        </div>
      </div>
    </div>
  );
}
