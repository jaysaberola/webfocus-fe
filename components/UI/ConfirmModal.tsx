import React from "react";

interface ConfirmModalProps {
  show: boolean;
  title?: string;
  message?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  confirmVariant?: "primary" | "secondary" | "success" | "danger" | "warning" | "info" | "light" | "dark";
  accentVariant?: "primary" | "secondary" | "success" | "danger" | "warning" | "info" | "light" | "dark";
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  show,
  title = "Confirm",
  message,
  confirmLabel = "Yes, delete",
  cancelLabel = "Cancel",
  danger = true,
  confirmVariant,
  accentVariant,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const effectiveAccent = accentVariant ?? (danger ? "danger" : "primary");
  const effectiveConfirm = confirmVariant ?? (danger ? "danger" : "primary");

  React.useEffect(() => {
    if (!show) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [show, onCancel]);

  if (!show) return null;

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ background: "rgba(15, 23, 42, 0.55)", backdropFilter: "blur(2px)", zIndex: 1060 }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(e) => {
        // close only when clicking the backdrop (not inside the modal)
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        className={`card border-0 shadow-lg rounded-4 border-start border-4 border-${effectiveAccent}`}
        style={{ width: "min(520px, 98vw)" }}
      >
        <div className="card-header bg-white border-0 d-flex align-items-start justify-content-between pt-2 px-2 pb-0">
          <div className="d-flex align-items-center gap-2">
            <div
              className={`rounded-circle d-flex align-items-center justify-content-center bg-${effectiveAccent}-subtle`}
              style={{ width: 34, height: 34 }}
            >
              <i className={`fas ${danger ? "fa-exclamation-triangle" : "fa-info-circle"} text-${effectiveAccent}`} />
            </div>
            <div>
              <h5 className="mb-0">{title}</h5>
            </div>
          </div>

          <button type="button" className="btn btn-sm btn-link text-muted" onClick={onCancel} aria-label="Close">
            <i className="fas fa-times" />
          </button>
        </div>

        <div className="card-body px-2 pt-2 pb-2">
          <div className="text-body">{message}</div>
        </div>

        <div className="card-footer bg-white border-0 px-2 pb-2 pt-0 d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-outline-secondary" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className={`btn btn-${effectiveConfirm}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
