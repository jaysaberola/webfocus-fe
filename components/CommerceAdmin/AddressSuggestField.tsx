import { useEffect, useMemo, useRef, useState } from "react";
import styles from "@/styles/commerceAdmin.module.css";

export type AddressSuggestOption = {
  value: string;
  label: string;
  street?: string;
  city?: string;
  province?: string;
  zip?: string;
  country?: string;
};

type Props = {
  label: string;
  value: string;
  options: AddressSuggestOption[];
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  onChange: (value: string) => void;
  onSelect?: (value: string, option: AddressSuggestOption) => void;
};

const MAX_VISIBLE = 80;

export default function AddressSuggestField({
  label,
  value,
  options,
  placeholder,
  autoComplete = "off",
  required,
  onChange,
  onSelect,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const filtered = useMemo(() => {
    const needle = value.trim().toLowerCase();
    const next = needle
      ? options.filter(
          (option) =>
            option.label.toLowerCase().includes(needle) ||
            option.value.toLowerCase().includes(needle)
        )
      : options;
    return next.slice(0, MAX_VISIBLE);
  }, [options, value]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, []);

  useEffect(() => {
    setActiveIndex(0);
  }, [filtered]);

  const pick = (option: AddressSuggestOption) => {
    onChange(option.value);
    onSelect?.(option.value, option);
    setOpen(false);
  };

  return (
    <label className={styles.clientCrmField}>
      <span>{label}</span>
      <div className={styles.addressSuggestWrap} ref={wrapRef}>
        <input
          className={styles.clientCrmInput}
          value={value}
          autoComplete={autoComplete}
          required={required}
          placeholder={placeholder}
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (!open && (event.key === "ArrowDown" || event.key === "Enter")) {
              setOpen(true);
              return;
            }
            if (event.key === "Escape") {
              setOpen(false);
              return;
            }
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActiveIndex((index) => Math.min(index + 1, Math.max(filtered.length - 1, 0)));
              return;
            }
            if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((index) => Math.max(index - 1, 0));
              return;
            }
            if (event.key === "Enter" && open && filtered[activeIndex]) {
              event.preventDefault();
              pick(filtered[activeIndex]);
            }
          }}
        />
        {open ? (
          <ul className={styles.addressSuggestList} role="listbox">
            {filtered.length === 0 ? (
              <li className={styles.addressSuggestEmpty}>No Philippine matches</li>
            ) : (
              filtered.map((option, index) => (
                <li key={`${option.value}-${option.label}`}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={index === activeIndex}
                    className={
                      index === activeIndex
                        ? styles.addressSuggestOptionActive
                        : styles.addressSuggestOption
                    }
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => pick(option)}
                  >
                    {option.label}
                  </button>
                </li>
              ))
            )}
          </ul>
        ) : null}
      </div>
    </label>
  );
}
