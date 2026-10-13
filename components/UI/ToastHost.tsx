import { useCallback, useEffect, useMemo, useState } from "react";
import Toast from "./Toast";
import { toastEmitter, ToastType, ToastVariant } from "@/lib/toast";
import styles from "@/styles/toast.module.css";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
  variant: ToastVariant;
  title?: string;
  body?: string;
  onClick?: () => void;
}

type AnchorRect = {
  top: number;
  right: number;
  width: number;
};

const INBOX_WIDTH = 420;

let id = 0;

function readNotifyAnchor(): AnchorRect | null {
  if (typeof document === "undefined") return null;
  const bell = document.getElementById("portal-notify-bell");
  if (!bell) return null;
  const rect = bell.getBoundingClientRect();
  if (!rect.width && !rect.height) return null;

  // Right-align popup to the bell button (standard header dropdown).
  const right = Math.max(8, window.innerWidth - rect.right);
  const width = Math.min(INBOX_WIDTH, window.innerWidth - right - 8);

  return {
    top: rect.bottom + 8,
    right,
    width,
  };
}

export default function ToastHost() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [anchor, setAnchor] = useState<AnchorRect | null>(null);

  const hasInboxToast = toasts.some((t) => t.variant === "inbox");
  const hasCartToast = toasts.some((t) => t.variant === "cart");
  const regularToasts = useMemo(() => toasts.filter((t) => t.variant !== "inbox"), [toasts]);
  const inboxToasts = useMemo(() => toasts.filter((t) => t.variant === "inbox"), [toasts]);

  useEffect(() => {
    const unsubscribe = toastEmitter.subscribe((toast) => {
      setToasts((prev) => {
        const nextItem: ToastItem = {
          id: ++id,
          message: toast.message,
          type: toast.type,
          variant: toast.variant ?? "default",
          title: toast.title,
          body: toast.body,
          onClick: toast.onClick,
        };
        if (nextItem.variant === "inbox") {
          return [...prev.filter((row) => row.variant !== "inbox"), nextItem];
        }
        return [...prev, nextItem];
      });
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!hasInboxToast) {
      setAnchor(null);
      return;
    }

    let frame = 0;
    const update = () => {
      frame = window.requestAnimationFrame(() => setAnchor(readNotifyAnchor()));
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [hasInboxToast, inboxToasts.length]);

  const remove = useCallback((toastId: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== toastId));
  }, []);

  return (
    <>
      {regularToasts.length ? (
        <div
          className={styles.toastHost}
          style={{
            top: hasCartToast ? "5.1rem" : "20px",
            right: "1rem",
          }}
        >
          {regularToasts.map((t) => (
            <Toast
              key={t.id}
              message={t.message}
              type={t.type}
              variant={t.variant}
              title={t.title}
              body={t.body}
              onClick={t.onClick}
              onClose={() => remove(t.id)}
            />
          ))}
        </div>
      ) : null}

      {inboxToasts.length ? (
        <div
          className={`${styles.toastHost} ${styles.toastHostInbox}`}
          style={
            anchor
              ? {
                  top: `${anchor.top}px`,
                  right: `${anchor.right}px`,
                  width: `${anchor.width}px`,
                  maxWidth: `${anchor.width}px`,
                }
              : {
                  top: "5.1rem",
                  right: "0.75rem",
                  width: `${INBOX_WIDTH}px`,
                  maxWidth: `min(${INBOX_WIDTH}px, calc(100vw - 1.5rem))`,
                }
          }
        >
          {inboxToasts.map((t) => (
            <Toast
              key={t.id}
              message={t.message}
              type={t.type}
              variant={t.variant}
              title={t.title}
              body={t.body}
              onClick={t.onClick}
              onClose={() => remove(t.id)}
            />
          ))}
        </div>
      ) : null}
    </>
  );
}
