import { useEffect, useRef } from "react";
import type { InboxToastPriority, ToastType, ToastVariant } from "@/lib/toast";
import { inboxToastEyebrow } from "@/lib/inboxToastPriority";
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
  if (!detail) return { detail: "", extraUnread: 0 };
  if (heading && detail.toLowerCase().startsWith(heading.toLowerCase())) {
    detail = detail.slice(heading.length).replace(/^[\s:.\-–—]+/, "").trim();
  }
  let extraUnread = 0;
  const extraMatch = detail.match(/(?:·|\|)\s*(\d+)\s+more unread\s*$/i);
  if (extraMatch) {
    extraUnread = Number(extraMatch[1]) || 0;
    detail = detail.replace(/(?:·|\|)\s*\d+\s+more unread\s*$/i, "").trim();
  }
  if (detail.length > 220) {
    const clipped = detail.slice(0, 220);
    const lastSpace = clipped.lastIndexOf(" ");
    detail = `${(lastSpace > 140 ? clipped.slice(0, lastSpace) : clipped).trim()}…`;
  }
  return { detail, extraUnread };
}

export default function Toast({
  message,
  type,
  variant = "default",
  title,
  body,
  onClick,
  onClose,
  inboxPriority = "default",
  actionLabel,
  unreadCount = 1,
}: {
  message: string;
  type: ToastType;
  variant?: ToastVariant;
  title?: string;
  body?: string;
  onClick?: () => void;
  onClose: () => void;
  inboxPriority?: InboxToastPriority;
  actionLabel?: string;
  unreadCount?: number;
}) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    // Inbox toasts re-open from LiveInboxHost while unread remain — stay long enough to read.
    const duration =
      variant === "inbox"
        ? inboxPriority === "critical"
          ? 45000
          : inboxPriority === "warning"
            ? 38000
            : 32000
        : variant === "cart"
          ? 4000
          : 3000;
    const timer = window.setTimeout(() => onCloseRef.current(), duration);
    return () => window.clearTimeout(timer);
  }, [variant, title, body, message, inboxPriority]);

  if (variant === "inbox") {
    const heading = title || "New notification";
    const { detail, extraUnread } = cleanInboxBody(heading, body || (title ? "" : message));
    const totalUnread = Math.max(unreadCount, extraUnread + 1);
    const unreadLabel = inboxToastEyebrow(totalUnread, inboxPriority);
    const priorityClass =
      inboxPriority === "critical"
        ? styles.inboxToastCritical
        : inboxPriority === "warning"
          ? styles.inboxToastWarning
          : "";
    const iconClass =
      inboxPriority === "critical"
        ? "fa-solid fa-triangle-exclamation"
        : inboxPriority === "warning"
          ? "fa-solid fa-clock"
          : "fa-solid fa-bell";
    const cta = actionLabel || "Open notifications";
    return (
      <div
        className={[styles.inboxToast, priorityClass].filter(Boolean).join(" ")}
        role="alertdialog"
        aria-live="assertive"
        aria-label={heading}
      >
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
        <button
          type="button"
          className={styles.inboxToastMain}
          onClick={() => {
            onClick?.();
            onClose();
          }}
        >
          <div className={styles.inboxToastIcon} aria-hidden="true">
            <i className={iconClass} />
          </div>
          <div className={styles.inboxToastBody}>
            <span className={styles.inboxToastEyebrow}>{unreadLabel}</span>
            <strong className={styles.inboxToastTitle}>{heading}</strong>
            <div className={styles.inboxToastFootRow}>
              <div className={styles.inboxToastCopy}>
                {detail ? <p className={styles.inboxToastDetail}>{detail}</p> : null}
                {extraUnread > 0 ? (
                  <span className={styles.inboxToastMeta}>+{extraUnread} more unread</span>
                ) : null}
              </div>
              <span className={styles.inboxToastAction}>{cta}</span>
            </div>
          </div>
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
