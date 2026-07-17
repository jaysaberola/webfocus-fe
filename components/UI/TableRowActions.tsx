import React, { ReactNode, useEffect, useRef, useState } from "react";

type ActionVariant = "view" | "edit" | "delete" | "restore" | "toggle-on" | "toggle-off" | "custom";

type TableActionButtonProps = {
  icon: string;
  title: string;
  onClick?: () => void;
  href?: string;
  variant?: ActionVariant;
  className?: string;
  disabled?: boolean;
};

export function TableActionButton({
  icon,
  title,
  onClick,
  href,
  variant = "custom",
  className = "",
  disabled = false,
}: TableActionButtonProps) {
  const variantClass =
    variant === "view" || variant === "edit"
      ? `cms-action-btn--${variant}`
      : variant !== "custom"
        ? `cms-action-btn--${variant}`
        : "";

  const cls = `cms-action-btn ${variantClass} ${className}`.trim();

  if (href) {
    return (
      <a href={href} className={cls} title={title} aria-label={title} target="_blank" rel="noopener noreferrer">
        <i className={icon} />
      </a>
    );
  }

  return (
    <button type="button" className={cls} title={title} aria-label={title} onClick={onClick} disabled={disabled}>
      <i className={icon} />
    </button>
  );
}

type TableOptionsMenuItem = {
  label: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
};

type TableOptionsMenuProps = {
  items: TableOptionsMenuItem[];
  title?: string;
  header?: string;
};

export function TableOptionsMenu({ items, title = "More actions", header }: TableOptionsMenuProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const handleClick = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const menuWidth = 180;
    const left = Math.min(rect.left, window.innerWidth - menuWidth - 12);
    setPos({ top: rect.bottom + 6, left: Math.max(8, left) });
    setOpen((s) => !s);
  };

  return (
    <div style={{ display: "inline-block", position: "relative" }}>
      <button
        ref={triggerRef}
        type="button"
        className={`cms-options-trigger btn btn-link p-0${open ? " is-open" : ""}`}
        onClick={handleClick}
        title={title}
        aria-label={title}
        aria-expanded={open}
      >
        <i className="fa-solid fa-ellipsis-vertical" />
      </button>

      {open && pos && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 1055 }}
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            className="cms-options-menu card shadow-sm compact-dropdown"
            style={{ position: "fixed", top: pos.top, left: pos.left, zIndex: 1060, width: 180 }}
          >
            {header && <div className="cms-options-menu__header">{header}</div>}
            <div className="list-group list-group-flush">
              {items.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className={`list-group-item list-group-item-action${item.danger ? " text-danger" : ""}`}
                  disabled={item.disabled}
                  onClick={() => {
                    item.onClick();
                    setOpen(false);
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function TableRowActions({ children }: { children: ReactNode }) {
  return <div className="cms-row-actions">{children}</div>;
}
