import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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
  label: ReactNode;
  value: string;
  options: AddressSuggestOption[];
  placeholder?: string;
  autoComplete?: string;
  name?: string;
  required?: boolean;
  className?: string;
  inputClassName?: string;
  wrapClassName?: string;
  preventBrowserFill?: boolean;
  onChange: (value: string) => void;
  onSelect?: (value: string, option: AddressSuggestOption) => void;
  maxVisible?: number;
  filterMode?: "text" | "code";
};

const DEFAULT_MAX_VISIBLE = 80;

export default function AddressSuggestField({
  label,
  value,
  options,
  placeholder,
  autoComplete = "off",
  name,
  required,
  className,
  inputClassName,
  wrapClassName,
  preventBrowserFill = false,
  onChange,
  onSelect,
  maxVisible = DEFAULT_MAX_VISIBLE,
  filterMode = "text",
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [typedQuery, setTypedQuery] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [autofillUnlocked, setAutofillUnlocked] = useState(!preventBrowserFill);

  const selectedValue = value.trim().toLowerCase();
  const filtered = useMemo(() => {
    const rawNeedle = (typedQuery ?? (filterMode === "code" ? value : "")).trim().toLowerCase();
    const codeNeedle = rawNeedle.replace(/\D/g, "");
    const next = options
      .filter((option) => {
        if (filterMode === "code") {
          const zip = String(option.value || option.zip || "").replace(/\D/g, "");
          if (!zip) return false;
          if (!codeNeedle) return true;
          return codeNeedle.length >= 4 ? zip === codeNeedle : zip.startsWith(codeNeedle);
        }
        if (!rawNeedle) return true;
        return (
          option.label.toLowerCase().includes(rawNeedle) ||
          option.value.toLowerCase().includes(rawNeedle)
        );
      })
      .slice();
    const selectedIndex = next.findIndex((option) => option.value.trim().toLowerCase() === selectedValue);
    if (selectedIndex > 0) {
      const [selected] = next.splice(selectedIndex, 1);
      next.unshift(selected);
    }
    return next.slice(0, maxVisible);
  }, [options, typedQuery, value, filterMode, maxVisible, selectedValue]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setOpen(false);
        setTypedQuery(null);
      }
    };
    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, []);

  useEffect(() => {
    const selectedIndex = filtered.findIndex(
      (option) => option.value.trim().toLowerCase() === selectedValue
    );
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
  }, [filtered, selectedValue]);

  const pick = (option: AddressSuggestOption) => {
    onChange(option.value);
    onSelect?.(option.value, option);
    setTypedQuery(null);
    setOpen(false);
  };

  const openList = () => {
    if (preventBrowserFill) setAutofillUnlocked(true);
    setTypedQuery(null);
    setOpen(true);
  };

  return (
    <label className={className || styles.clientCrmField} data-open={open ? "true" : "false"}>
      <span>{label}</span>
      <div
        className={`${styles.addressSuggestWrap}${open ? ` ${styles.addressSuggestWrapOpen}` : ""}${
          wrapClassName ? ` ${wrapClassName}` : ""
        }`}
        ref={wrapRef}
        data-open={open ? "true" : "false"}
      >
        <input
          className={inputClassName || styles.clientCrmInput}
          name={name}
          value={value}
          autoComplete={preventBrowserFill ? "off" : autoComplete}
          inputMode={filterMode === "code" ? "numeric" : undefined}
          readOnly={preventBrowserFill && !autofillUnlocked}
          required={required}
          placeholder={placeholder}
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          onFocus={openList}
          onChange={(event) => {
            const next =
              filterMode === "code" ? event.target.value.replace(/\D/g, "").slice(0, 12) : event.target.value;
            setTypedQuery(next);
            onChange(next);
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (!open && (event.key === "ArrowDown" || event.key === "Enter")) {
              openList();
              return;
            }
            if (event.key === "Escape") {
              setOpen(false);
              setTypedQuery(null);
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
        <button
          type="button"
          className={styles.addressSuggestToggle}
          tabIndex={-1}
          aria-label={open ? "Hide address suggestions" : "Show address suggestions"}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            if (open) {
              setOpen(false);
              setTypedQuery(null);
              return;
            }
            openList();
          }}
        >
          <i className={open ? "fa-solid fa-chevron-up" : "fa-solid fa-chevron-down"} aria-hidden="true" />
        </button>
        {open ? (
          <ul className={styles.addressSuggestList} role="listbox">
            {filtered.length === 0 ? (
              <li className={styles.addressSuggestEmpty}>No matching addresses</li>
            ) : (
              filtered.map((option, index) => {
                const selected = option.value.trim().toLowerCase() === selectedValue;
                return (
                  <li key={`${option.value}-${option.label}`}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected || index === activeIndex}
                      className={
                        selected
                          ? styles.addressSuggestOptionSelected
                          : index === activeIndex
                            ? styles.addressSuggestOptionActive
                            : styles.addressSuggestOption
                      }
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => pick(option)}
                    >
                      <span>{option.label}</span>
                      {selected ? <i className="fa-solid fa-check" aria-hidden="true" /> : null}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        ) : null}
      </div>
    </label>
  );
}
