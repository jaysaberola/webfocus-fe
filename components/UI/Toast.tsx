import { useEffect } from "react";
import type { ToastType, ToastVariant } from "@/lib/toast";
import styles from "@/styles/toast.module.css";

const defaultTypeClass: Record<ToastType, string> = {
  success: styles.defaultToastSuccess,
  danger: styles.defaultToastDanger,
  warning: styles.defaultToastWarning,
  info: styles.defaultToastInfo,
};

export default function Toast({
  message,
  type,
  variant = "default",
  title,
  body,
  onClick,
  onClose,
}: {
  message: string;
  type: ToastType;
  variant?: ToastVariant;
  title?: string;
  body?: string;
  onClick?: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const duration = variant === "inbox" ? 7000 : variant === "cart" ? 4000 : 3000;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, variant]);

  if (variant === "inbox") {
    const heading = title || "New notification";
    const detail = body || (title ? "" : message);
    return (
      <div className={styles.inboxToast} role="status" aria-live="polite">
        <button
          type="button"
          className={styles.inboxToastMain}
          onClick={() => {
            onClick?.();
            onClose();
          }}
        >
          <div className={styles.inboxToastIcon} aria-hidden="true">
            <i className="fa-regular fa-bell" />
          </div>
          <div className={styles.inboxToastText}>
            <strong>{heading}</strong>
            {detail ? <p>{detail}</p> : null}
          </div>
        </button>
        <button type="button" className={styles.inboxToastClose} onClick={onClose} aria-label="Dismiss">
          <i className="fa-solid fa-xmark" aria-hidden="true" />
        </button>
      </div>
    );
  }

  if (variant === "cart") {
    return (
      <div className={styles.cartToast} role="status" aria-live="polite">
        <div className={styles.cartToastBody}>
          <div className={styles.cartToastIcon} aria-hidden="true">
            <i className="fa-solid fa-wand-magic-sparkles" />
          </div>
          <p className={styles.cartToastMessage}>{message}</p>
        </div>
        <button type="button" className={styles.cartToastClose} onClick={onClose} aria-label="Dismiss">
          <i className="fa-solid fa-xmark" aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <div className={`${styles.defaultToast} ${defaultTypeClass[type]}`} role="status" aria-live="polite">
      <span>{message}</span>
      <button type="button" className={styles.defaultToastClose} onClick={onClose} aria-label="Dismiss">
        ×
      </button>
    </div>
  );
}
