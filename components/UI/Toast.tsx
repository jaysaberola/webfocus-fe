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
  onClose,
}: {
  message: string;
  type: ToastType;
  variant?: ToastVariant;
  onClose: () => void;
}) {
  useEffect(() => {
    const duration = variant === "cart" ? 4000 : 3000;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, variant]);

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
