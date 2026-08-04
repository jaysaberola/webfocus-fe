import { useEffect, useMemo, useRef, useState } from "react";
import styles from "@/styles/commerceAdmin.module.css";

type Props = {
  label: string;
  required?: boolean;
  placeholder: string;
  options: string[];
  selected: string[];
  loading?: boolean;
  onChange: (next: string[]) => void;
};

export default function ClientMultiSelectDropdown({
  label,
  required,
  placeholder,
  options,
  selected,
  loading,
  onChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, []);

  const buttonLabel = useMemo(() => {
    if (loading) return "Loading options...";
    if (selected.length === 0) return placeholder;
    if (selected.length === 1) return selected[0];
    return `${selected.length} Selected`;
  }, [loading, placeholder, selected]);

  const toggleOption = (option: string) => {
    onChange(
      selected.includes(option) ? selected.filter((item) => item !== option) : [...selected, option],
    );
  };

  return (
    <div className={styles.multiSelectWrap} ref={wrapRef}>
      <span className={styles.modalLabel}>
        {label}
        {required ? " *" : ""}
      </span>
      <button
        type="button"
        className={`${styles.multiSelectBtn} ${selected.length ? styles.multiSelectBtnActive : ""}`}
        disabled={loading}
        onClick={(event) => {
          event.stopPropagation();
          if (!loading) setOpen((value) => !value);
        }}
      >
        <span>{buttonLabel}</span>
        <i className={`fa-solid fa-chevron-down ${styles.multiSelectChevron}`} aria-hidden="true" />
      </button>
      {open && !loading ? (
        <div className={styles.multiSelectPanel}>
          {options.length === 0 ? (
            <p className={styles.multiSelectEmpty}>No options available.</p>
          ) : (
            options.map((option) => (
              <label key={option} className={styles.multiSelectItem}>
                <input
                  type="checkbox"
                  checked={selected.includes(option)}
                  onChange={() => toggleOption(option)}
                />
                <span>{option}</span>
              </label>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
