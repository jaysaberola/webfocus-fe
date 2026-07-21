import { useEffect } from "react";

type LegalContentModalProps = {
  open: boolean;
  title: string;
  html: string;
  onClose: () => void;
  onAccept?: () => void;
};

export default function LegalContentModal({ open, title, html, onClose, onAccept }: LegalContentModalProps) {
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="legal-content-modal" role="presentation">
      <button type="button" className="legal-content-modal__backdrop" aria-label="Close dialog" onClick={onClose} />
      <div className="legal-content-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="legal-content-modal-title">
        <div className="legal-content-modal__header">
          <div>
            <p className="legal-content-modal__kicker">WebFocus Solutions, Inc.</p>
            <h2 id="legal-content-modal-title">{title}</h2>
          </div>
          <button type="button" className="legal-content-modal__close" aria-label="Close" onClick={onClose}>
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>

        <div className="legal-content-modal__body public-page-content" dangerouslySetInnerHTML={{ __html: html }} />

        <div className="legal-content-modal__footer">
          <button type="button" className="legal-content-modal__secondary" onClick={onClose}>
            Close
          </button>
          {onAccept ? (
            <button type="button" className="legal-content-modal__primary" onClick={onAccept}>
              I Agree
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
