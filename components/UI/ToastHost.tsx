import { useCallback, useEffect, useState } from "react";
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

let id = 0;

export default function ToastHost() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

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
        // Keep a single inbox popup (Gmail-style), replace older ones.
        if (nextItem.variant === "inbox") {
          return [...prev.filter((row) => row.variant !== "inbox"), nextItem];
        }
        return [...prev, nextItem];
      });
    });

    return unsubscribe;
  }, []);

  const remove = useCallback((toastId: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== toastId));
  }, []);

  const hasCartToast = toasts.some((t) => t.variant === "cart");
  const hasInboxToast = toasts.some((t) => t.variant === "inbox");

  return (
    <div
      className={`${styles.toastHost}${hasInboxToast ? ` ${styles.toastHostInbox}` : ""}`}
      style={{
        top: hasCartToast || hasInboxToast ? "5.1rem" : "20px",
      }}
    >
      {toasts.map((t) => (
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
  );
}
