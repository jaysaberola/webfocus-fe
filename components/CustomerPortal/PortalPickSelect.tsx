import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import styles from "@/styles/customerPortal.module.css";

type Option = {
  value: string;
  label: string;
};

type PortalPickSelectProps = {
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  ariaLabel?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

export default function PortalPickSelect({
  value,
  options,
  onChange,
  ariaLabel,
  placeholder = "Select",
  className,
  disabled,
}: PortalPickSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const media = window.matchMedia("(max-width: 768px)");
    const sync = () => setIsMobile(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const selected = useMemo(() => options.find((option) => option.value === value), [options, value]);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return options;
    return options.filter((option) => option.label.toLowerCase().includes(needle));
  }, [options, query]);

  if (!isMobile) {
    return (
      <select
        className={className}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={ariaLabel}
        disabled={disabled}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <>
      <button
        type="button"
        className={[className, styles.pickTrigger].filter(Boolean).join(" ")}
        onClick={() => setOpen(true)}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={styles.pickTriggerValue}>{selected?.label || placeholder}</span>
        <i className="fa-solid fa-chevron-down" aria-hidden="true" />
      </button>
      {open && mounted
        ? createPortal(
            <div className={`${styles.customerPortal} ${styles.pickOverlay}`} onClick={() => setOpen(false)}>
              <div
                className={styles.pickSheet}
                role="dialog"
                aria-label={ariaLabel || "Select an option"}
                onClick={(event) => event.stopPropagation()}
              >
                <div className={styles.pickHead}>
                  <strong>{ariaLabel || "Select"}</strong>
                  <button type="button" className={styles.pickClose} onClick={() => setOpen(false)} aria-label="Close">
                    <i className="fa-solid fa-xmark" aria-hidden="true" />
                  </button>
                </div>
                {options.length > 8 ? (
                  <input
                    className={styles.pickSearch}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search..."
                    autoFocus
                  />
                ) : null}
                <div className={styles.pickList} role="listbox">
                  <button
                    type="button"
                    className={[styles.pickOption, !value ? styles.pickOptionActive : ""].filter(Boolean).join(" ")}
                    onClick={() => {
                      onChange("");
                      setOpen(false);
                    }}
                  >
                    {placeholder}
                  </button>
                  {filtered.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={[
                        styles.pickOption,
                        option.value === value ? styles.pickOptionActive : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={() => {
                        onChange(option.value);
                        setOpen(false);
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                  {filtered.length === 0 ? <p className={styles.pickEmpty}>No matches.</p> : null}
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
