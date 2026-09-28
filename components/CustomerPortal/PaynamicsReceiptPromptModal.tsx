import { useEffect, useState } from "react";
import PortalModal from "@/components/CustomerPortal/PortalModal";
import styles from "@/styles/customerPortal.module.css";

const BEFORE_PAY_WAIT_SECONDS = 4;

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
  const [acked, setAcked] = useState(false);
  const [waitSeconds, setWaitSeconds] = useState(0);

  useEffect(() => {
    if (!open || !beforePay) {
      setAcked(false);
      setWaitSeconds(0);
      return;
    }

    setAcked(false);
    setWaitSeconds(BEFORE_PAY_WAIT_SECONDS);
  }, [open, beforePay]);

  useEffect(() => {
    if (!open || !beforePay || waitSeconds <= 0) return;
    const timeout = window.setTimeout(() => setWaitSeconds((current) => Math.max(0, current - 1)), 1000);
    return () => window.clearTimeout(timeout);
  }, [open, beforePay, waitSeconds]);

  const canContinue = !beforePay || (acked && waitSeconds === 0);
  const primaryLabel = beforePay
    ? waitSeconds > 0
      ? `Please read first (${waitSeconds})`
      : acked
        ? "I will screenshot — continue to Paynamics"
        : "Check the box to continue"
    : confirmLabel || "Upload Receipt Now";

  return (
    <PortalModal
      open={open}
      onClose={onLater}
      closeOnOverlay={false}
      closeOnEscape={!beforePay}
      ariaLabelledBy="paynamics-receipt-prompt-title"
      dialogClassName={styles.proofPopupDialog}
    >
      <div className={styles.proofPopup}>
        <div className={styles.proofPopupScroll}>
          <div className={styles.proofPopupHero} aria-hidden="true">
            <span className={beforePay ? styles.proofPopupIconUrgent : styles.proofPopupIcon}>
              <i className="fa-solid fa-camera" />
            </span>
          </div>
          <h3 id="paynamics-receipt-prompt-title" className={styles.proofPopupTitle}>
            {beforePay ? "Required: screenshot your receipt after you pay" : "Upload your Paynamics receipt"}
          </h3>
          <p className={styles.proofPopupLead}>
            {beforePay
              ? "Paynamics will show a Payment Success page for a few seconds, then redirect you back. Capture that page before it disappears. Without that screenshot, billing cannot confirm your payment."
              : invoiceId
                ? `${invoiceId} is already paid. Please upload your Paynamics Payment Success screenshot now so billing can confirm it.`
                : "Your Paynamics payment went through. Please upload your Payment Success screenshot now so billing can confirm it."}
          </p>

          <ol className={styles.proofPopupSteps}>
            <li>
              <span className={styles.proofPopupStepNum}>1</span>
              <span>
                On the Paynamics <strong>Payment Success</strong> page, take a screenshot or download/save the receipt
                before tapping anything else.
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

          {beforePay ? (
            <div className={styles.proofPopupHow}>
              <strong>How to screenshot so you do not forget</strong>
              <ul>
                <li>Phone: press Power + Volume Down together.</li>
                <li>Windows: press Windows + Shift + S, or PrtScn.</li>
                <li>Mac: press Command + Shift + 4.</li>
              </ul>
            </div>
          ) : null}

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
              Do not leave the success page until you have the screenshot. If you miss it, your Paynamics email or
              e-wallet/bank confirmation still works as proof.
            </p>
          )}
        </div>

        <div className={styles.proofPopupActions}>
          {beforePay ? (
            <label className={styles.proofPopupAck}>
              <input
                type="checkbox"
                checked={acked}
                onChange={(event) => setAcked(event.target.checked)}
              />
              <span>I will screenshot or save the Payment Success receipt before it disappears.</span>
            </label>
          ) : null}
          <button
            type="button"
            className={styles.proofPopupPrimary}
            onClick={onUpload}
            disabled={!canContinue}
          >
            {primaryLabel}
          </button>
          <button type="button" className={styles.proofPopupSecondary} onClick={onLater}>
            {beforePay ? "Cancel" : "Remind me later"}
          </button>
        </div>
      </div>
    </PortalModal>
  );
}
