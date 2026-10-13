import { useEffect, useRef } from "react";
import type { ToastType, ToastVariant } from "@/lib/toast";
import styles from "@/styles/toast.module.css";

const defaultTypeClass: Record<ToastType, string> = {
  success: styles.defaultToastSuccess,
  danger: styles.defaultToastDanger,
  warning: styles.defaultToastWarning,
  info: styles.defaultToastInfo,
};

function cleanInboxBody(title: string, body: string) {
  let detail = String(body || "").trim();
  const heading = String(title || "").trim();
  if (!detail) return "";
  if (heading && detail.toLowerCase().startsWith(heading.toLowerCase())) {
    detail = detail.slice(heading.length).replace(/^[\s:.\-–—]+/, "").trim();
  }
  if (detail.length > 140) {
    const clipped = detail.slice(0, 140);
    const lastSpace = clipped.lastIndexOf(" ");
    detail = `${(lastSpace > 80 ? clipped.slice(0, lastSpace) : clipped).trim()}…`;
  }
  return detail;
}

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
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const duration = variant === "inbox" ? 10000 : variant === "cart" ? 4000 : 3000;
    const timer = window.setTimeout(() => onCloseRef.current(), duration);
    return () => window.clearTimeout(timer);
  }, [variant, title, body, message]);

  if (variant === "inbox") {
    const heading = title || "New notification";
    const detail = cleanInboxBody(heading, body || (title ? "" : message));
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
            <span className={styles.inboxToastAction}>Open notifications</span>
          </div>
        </button>
        <button
          type="button"
          className={styles.inboxToastClose}
          onClick={(event) => {
            event.stopPropagation();
            onClose();
          }}
          aria-label="Dismiss"
        >
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
