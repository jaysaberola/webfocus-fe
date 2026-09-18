import { useEffect, useState } from "react";
import PortalModal from "@/components/CustomerPortal/PortalModal";
import PaynamicsReceiptPromptModal from "@/components/CustomerPortal/PaynamicsReceiptPromptModal";
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
  const [fundAmount, setFundAmount] = useState(FUND_PRESETS[1]);
  const [receiptTipOpen, setReceiptTipOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFundAmount(FUND_PRESETS[1]);
    setReceiptTipOpen(false);
  }, [open, mode, invoiceId]);

  const startPayment = () => {
    if (mode === "add-funds") {
      onSubmit("paynamics", fundAmount);
      return;
    }
    onSubmit("paynamics");
  };

  const handleSubmit = () => {
    setReceiptTipOpen(true);
  };

  return (
    <>
    <PortalModal open={open} onClose={onClose} ariaLabelledBy="billing-payment-title">
      <div className={styles.billingModalHead}>
        <div className={styles.billingModalHeadText}>
          <h3 id="billing-payment-title">
            {mode === "add-funds" ? "Add Funds" : submitLabel === "Pay & Renew" ? "Pay & Renew" : "Pay Invoice"}
          </h3>
          <p className={styles.panelSub}>
            {mode === "add-funds"
              ? "Choose an amount. You will be redirected to Paynamics to choose how to pay."
              : "You will be redirected to Paynamics to choose how to pay this invoice."}
          </p>
        </div>
        <button type="button" className={styles.billingModalClose} aria-label="Close" onClick={onClose}>
          <i className="fa-solid fa-xmark" aria-hidden="true" />
        </button>
      </div>

      <div className={styles.billingModalBody}>
        <p className={styles.proofNeedHint}>
          After you pay, screenshot or download the Paynamics <strong>Payment Success</strong> page. If you miss it,
          keep the Paynamics email or your GCash, Maya, or bank confirmation and upload that as proof.
        </p>
        {mode === "invoice" ? (
          <div className={styles.billingModalSummary}>
            {title ? (
              <p className={styles.billingModalLine}>
                <strong>Service:</strong> {title}
              </p>
            ) : null}
            {invoiceId ? (
              <p className={styles.billingModalLine}>
                <strong>Invoice:</strong> {invoiceId}
              </p>
            ) : null}
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
                  className={[styles.fundPresetBtn, fundAmount === preset ? styles.fundPresetBtnActive : ""]
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
      </div>

      <div className={styles.billingModalActions}>
        <button type="button" className={styles.primaryBtnSm} onClick={handleSubmit} disabled={submitting}>
          {submitting
            ? "Processing..."
            : mode === "add-funds"
              ? "Proceed to Paynamics"
              : submitLabel}
        </button>
      </div>
    </PortalModal>
    <PaynamicsReceiptPromptModal
      open={open && receiptTipOpen}
      mode="before-pay"
      invoiceId={invoiceId}
      onUpload={() => {
        setReceiptTipOpen(false);
        startPayment();
      }}
      onLater={() => setReceiptTipOpen(false)}
    />
    </>
  );
}
