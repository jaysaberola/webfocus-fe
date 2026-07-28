import { FormEvent, ReactNode, useEffect } from "react";

type CmsFormModalProps = {
  show: boolean;
  title: string;
  description?: string;
  icon?: string;
  submitLabel?: string;
  cancelLabel?: string;
  onClose: () => void;
  onSubmit: () => void | Promise<void>;
  children: ReactNode;
  size?: "md" | "lg";
};

export default function CmsFormModal({
  show,
  title,
  description,
  icon = "fa-solid fa-pen-to-square",
  submitLabel = "Save Changes",
  cancelLabel = "Cancel",
  onClose,
  onSubmit,
  children,
  size = "md",
}: CmsFormModalProps) {
  useEffect(() => {
    if (!show) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [show, onClose]);

  if (!show) return null;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void onSubmit();
  };

  return (
    <div
      className="cms-form-modal__backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <form
        className={`cms-form-modal cms-form-modal--${size}`}
        onSubmit={handleSubmit}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="cms-form-modal__header">
          <div className="cms-form-modal__header-copy">
            <span className="cms-form-modal__icon" aria-hidden="true">
              <i className={icon} />
            </span>
            <div>
              <h2>{title}</h2>
              {description ? <p>{description}</p> : null}
            </div>
          </div>
          <button type="button" className="cms-form-modal__close" onClick={onClose} aria-label="Close">
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>

        <div className="cms-form-modal__body">{children}</div>

        <div className="cms-form-modal__footer">
          <button type="button" className="btn btn-outline-secondary cms-form-modal__btn" onClick={onClose}>
            {cancelLabel}
          </button>
          <button type="submit" className="btn btn-primary cms-form-modal__btn cms-form-modal__btn--primary">
            <i className="fa-solid fa-floppy-disk" aria-hidden="true" />
            {submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
