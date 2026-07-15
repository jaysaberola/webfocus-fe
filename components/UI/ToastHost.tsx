import { useEffect, useState } from "react";
import Toast from "./Toast";
import { toastEmitter } from "@/lib/toast";

interface ToastItem {
  id: number;
  message: string;
  type: "success" | "danger" | "warning" | "info";
}

let id = 0;

export default function ToastHost() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const unsubscribe = toastEmitter.subscribe((toast) => {
      setToasts((prev) => [
        ...prev,
        { id: ++id, ...toast },
      ]);
    });

    return unsubscribe;
  }, []);

  const remove = (id: number) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        right: "20px",
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
          onClose={() => remove(t.id)}
        />
      ))}
    </div>
  );
}
