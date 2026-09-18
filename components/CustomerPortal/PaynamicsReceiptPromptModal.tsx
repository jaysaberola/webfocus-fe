import PortalModal from "@/components/CustomerPortal/PortalModal";
import styles from "@/styles/customerPortal.module.css";

type PaynamicsReceiptPromptModalProps = {
  open: boolean;
  mode?: "after-pay" | "before-pay";
  invoiceId?: string;
  confirmLabel?: string;
  onUpload: () => void;
  onLater: () => void;
};

export default function PaynamicsReceiptPromptModal({
  open,
  mode = "after-pay",
  invoiceId,
  confirmLabel,
  onUpload,
  onLater,
}: PaynamicsReceiptPromptModalProps) {
  const beforePay = mode === "before-pay";

  return (
    <PortalModal
      open={open}
      onClose={beforePay ? onLater : () => undefined}
      closeOnOverlay={false}
      closeOnEscape={beforePay}
      ariaLabelledBy="paynamics-receipt-prompt-title"
      dialogClassName={styles.proofPopupDialog}
    >
      <div className={styles.proofPopup}>
        <div className={styles.proofPopupHero} aria-hidden="true">
          <span className={styles.proofPopupIcon}>
            <i className="fa-solid fa-camera" />
          </span>
        </div>
        <h3 id="paynamics-receipt-prompt-title" className={styles.proofPopupTitle}>
          {beforePay ? "Screenshot your receipt after you pay" : "Upload your Paynamics receipt"}
        </h3>
        <p className={styles.proofPopupLead}>
          {beforePay
            ? "Paynamics will show a Payment Success page for a few seconds, then redirect you back. Capture that page before it disappears."
            : invoiceId
              ? `${invoiceId} is already paid. Please upload your Paynamics Payment Success screenshot now so billing can confirm it.`
              : "Your Paynamics payment went through. Please upload your Payment Success screenshot now so billing can confirm it."}
        </p>

        <ol className={styles.proofPopupSteps}>
          <li>
            <span className={styles.proofPopupStepNum}>1</span>
            <span>
              On the Paynamics <strong>Payment Success</strong> page, take a screenshot or download/save the receipt.
            </span>
          </li>
          <li>
            <span className={styles.proofPopupStepNum}>2</span>
            <span>
              Upload that file in <strong>Billing → Submit Payment Proof</strong> so we can confirm your payment.
            </span>
          </li>
        </ol>

        {!beforePay ? (
          <p className={styles.proofPopupNote}>
            If the page already redirected, use the screenshot you saved, your Paynamics email, or your bank/e-wallet
            confirmation. This reminder stays until you upload the receipt.
          </p>
        ) : null}

        <div className={styles.proofPopupActions}>
          <button type="button" className={styles.proofPopupPrimary} onClick={onUpload}>
            {confirmLabel || (beforePay ? "I understand — continue to Paynamics" : "Upload Receipt Now")}
          </button>
          {beforePay ? (
            <button type="button" className={styles.proofPopupSecondary} onClick={onLater}>
              Cancel
            </button>
          ) : null}
        </div>
      </div>
    </PortalModal>
  );
}
