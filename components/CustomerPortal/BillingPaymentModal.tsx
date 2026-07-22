import { useEffect, useState } from "react";
import CheckoutPaymentMethods from "@/components/Cart/CheckoutPaymentMethods";
import { PAYNAMICS_PAYMENT_METHODS } from "@/lib/checkoutPaymentMethods";
import { formatPeso } from "@/lib/customerPortal/mockData";
import styles from "@/styles/customerPortal.module.css";

const FUND_PRESETS = [1000, 5000, 10000, 25000];

type BillingPaymentModalProps = {
  open: boolean;
  mode: "invoice" | "add-funds";
  invoiceId?: string;
  title?: string;
  amount?: number;
  submitLabel?: string;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (paymentMethod: string, amount?: number) => void;
};

export default function BillingPaymentModal({
  open,
  mode,
  invoiceId,
  title,
  amount,
  submitLabel = "Pay Now",
  submitting = false,
  onClose,
  onSubmit,
}: BillingPaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState(PAYNAMICS_PAYMENT_METHODS[0]?.id ?? "cc");
  const [fundAmount, setFundAmount] = useState(FUND_PRESETS[1]);

  useEffect(() => {
    if (!open) return;
    setPaymentMethod(PAYNAMICS_PAYMENT_METHODS[0]?.id ?? "cc");
    setFundAmount(FUND_PRESETS[1]);
  }, [open, mode, invoiceId]);

  if (!open) return null;

  const handleSubmit = () => {
    if (mode === "add-funds") {
      onSubmit(paymentMethod, fundAmount);
      return;
    }
    onSubmit(paymentMethod);
  };

  return (
    <div className={styles.billingModalOverlay} role="presentation" onClick={onClose}>
      <div
        className={styles.billingModal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="billing-payment-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.billingModalHead}>
          <div>
            <h3 id="billing-payment-title">
              {mode === "add-funds" ? "Add Funds" : submitLabel === "Pay & Renew" ? "Pay & Renew" : "Pay Invoice"}
            </h3>
            <p className={styles.panelSub}>
              {mode === "add-funds"
                ? "Choose an amount and payment method. You will be redirected to Paynamics to complete payment."
                : "Choose a payment method to pay your pending invoice through Paynamics."}
            </p>
          </div>
          <button type="button" className={styles.billingModalClose} aria-label="Close" onClick={onClose}>
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>

        {mode === "invoice" ? (
          <div className={styles.billingModalSummary}>
            {title ? <p className={styles.billingModalLine}><strong>Service:</strong> {title}</p> : null}
            {invoiceId ? <p className={styles.billingModalLine}><strong>Invoice:</strong> {invoiceId}</p> : null}
            {amount != null ? (
              <p className={styles.billingModalLine}>
                <strong>Amount:</strong> {formatPeso(amount)}
              </p>
            ) : null}
          </div>
        ) : (
          <div className={styles.billingModalSummary}>
            <p className={styles.billingModalLine}>
              <strong>Select amount (PHP)</strong>
            </p>
            <div className={styles.fundPresetRow}>
              {FUND_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className={[
                    styles.fundPresetBtn,
                    fundAmount === preset ? styles.fundPresetBtnActive : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => setFundAmount(preset)}
                >
                  {formatPeso(preset)}
                </button>
              ))}
            </div>
            <label className={styles.fundCustomLabel}>
              Custom amount
              <input
                type="number"
                min={100}
                step={100}
                value={fundAmount}
                onChange={(event) => setFundAmount(Number(event.target.value) || 0)}
              />
            </label>
          </div>
        )}

        <CheckoutPaymentMethods value={paymentMethod} onChange={setPaymentMethod} />

        <div className={styles.billingModalActions}>
          <button type="button" className={styles.secondaryBtnSm} onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="button" className={styles.primaryBtnSm} onClick={handleSubmit} disabled={submitting}>
            {submitting
              ? "Processing..."
              : mode === "add-funds"
                ? "Proceed to Paynamics"
                : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
