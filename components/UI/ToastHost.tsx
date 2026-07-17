import { useEffect, useState } from "react";
import Toast from "./Toast";
import { toastEmitter, ToastType, ToastVariant } from "@/lib/toast";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
  variant: ToastVariant;
}

let id = 0;

export default function ToastHost() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const unsubscribe = toastEmitter.subscribe((toast) => {
      setToasts((prev) => [
        ...prev,
        {
          id: ++id,
          message: toast.message,
          type: toast.type,
          variant: toast.variant ?? "default",
        },
      ]);
    });

    return unsubscribe;
  }, []);

  const remove = (toastId: number) => setToasts((prev) => prev.filter((t) => t.id !== toastId));

  const hasCartToast = toasts.some((t) => t.variant === "cart");

  return (
    <div
      style={{
        position: "fixed",
        top: hasCartToast ? "5rem" : "20px",
        right: "1rem",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      {toasts.map((t) => (
        <Toast
          key={t.id}
          message={t.message}
          type={t.type}
          variant={t.variant}
          onClose={() => remove(t.id)}
        />
      ))}
    </div>
  );
}
