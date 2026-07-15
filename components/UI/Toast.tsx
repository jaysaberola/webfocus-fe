import { useEffect } from "react";

export default function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "danger" | "warning" | "info";
  onClose: () => void;
}) {
  const colors: Record<string, string> = {
    success: "#198754",
    danger: "#dc3545",
    warning: "#ffc107",
    info: "#0dcaf0",
  };

  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      style={{
        backgroundColor: colors[type],
        color: "#fff",
        padding: "12px 16px",
        borderRadius: "6px",
        minWidth: "260px",
        boxShadow: "0 4px 10px rgba(0,0,0,.15)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <span>{message}</span>
      <button
        onClick={onClose}
        style={{
          background: "transparent",
          border: "none",
          color: "#fff",
          fontSize: "18px",
          cursor: "pointer",
        }}
      >
        ×
      </button>
    </div>
  );
}
