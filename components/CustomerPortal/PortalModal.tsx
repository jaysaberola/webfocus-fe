import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import styles from "@/styles/customerPortal.module.css";

type PortalModalProps = {
  open: boolean;
  onClose: () => void;
  ariaLabelledBy?: string;
  children: ReactNode;
  dialogClassName?: string;
};

export default function PortalModal({
  open,
  onClose,
  ariaLabelledBy,
  children,
  dialogClassName,
}: PortalModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  const dialogClass = [styles.billingModal, dialogClassName].filter(Boolean).join(" ");

  return createPortal(
    <div className={styles.billingModalOverlay} role="presentation" onClick={onClose}>
      <div
        className={dialogClass}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledBy}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
