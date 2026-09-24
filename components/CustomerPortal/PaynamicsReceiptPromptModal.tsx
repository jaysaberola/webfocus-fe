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
      onClose={onLater}
      closeOnOverlay={false}
      closeOnEscape
      ariaLabelledBy="paynamics-receipt-prompt-title"
      dialogClassName={styles.proofPopupDialog}
    >
      <div className={styles.proofPopup}>
        <div className={styles.proofPopupScroll}>
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
                {beforePay
                  ? "If you miss that page, save the Paynamics email receipt. A GCash, Maya, or bank confirmation only works if it still shows Paynamics or this payment's Request ID."
                  : "If you did not screenshot it, upload the Paynamics email receipt. An e-wallet or bank confirmation only works if it still shows Paynamics or this payment's Request ID."}
              </span>
            </li>
            <li>
              <span className={styles.proofPopupStepNum}>3</span>
              <span>
                Upload that file in <strong>Billing → Submit Payment Proof</strong> so we can confirm your payment.
              </span>
            </li>
          </ol>

          {!beforePay ? (
            <div className={styles.proofPopupNote}>
              <strong>Didn't screenshot or save it?</strong>
              <ul className={styles.proofPopupFallback}>
                <li>Open your email and search for Paynamics, then screenshot or save that receipt.</li>
                <li>GCash, Maya, or bank screenshots only work if they still show Paynamics or this payment's Request ID.</li>
                <li>A random transfer screenshot with no Paynamics details will be rejected.</li>
              </ul>
            </div>
          ) : (
            <p className={styles.proofPopupNote}>
              The success page disappears quickly. If you miss it, your Paynamics email or e-wallet/bank confirmation still
              works as proof.
            </p>
          )}
        </div>

        <div className={styles.proofPopupActions}>
          <button type="button" className={styles.proofPopupPrimary} onClick={onUpload}>
            {confirmLabel || (beforePay ? "I understand — continue to Paynamics" : "Upload Receipt Now")}
          </button>
          <button type="button" className={styles.proofPopupSecondary} onClick={onLater}>
            {beforePay ? "Cancel" : "Remind me later"}
          </button>
        </div>
      </div>
    </PortalModal>
  );
}
