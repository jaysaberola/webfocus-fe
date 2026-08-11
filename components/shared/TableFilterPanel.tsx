import { useEffect, useMemo, useRef, useState } from "react";
import DateRangePicker from "@/components/shared/DateRangePicker";
import {
  isTableFilterActive,
  uniqueTableFilterValues,
  withNoneField,
  type TableFilterFieldDef,
  type TableFilterState,
} from "@/lib/tableFilterHelpers";
import type { DateRangeValue } from "@/lib/dateRangeHelpers";
import styles from "@/styles/tableFilter.module.css";

type Props<T> = {
  rows: T[];
  fields: TableFilterFieldDef[];
  draft: TableFilterState;
  applied: TableFilterState;
  getValue: (row: T, fieldId: string) => string;
  onDraftChange: (next: TableFilterState) => void;
  onApply: () => void;
  onClear: () => void;
  onClose: () => void;
  sortControl?: React.ReactNode;
};

function fieldLabel(fields: TableFilterFieldDef[], fieldId: string) {
  return fields.find((item) => item.id === fieldId)?.label ?? "None";
}

export default function TableFilterPanel<T>({
  rows,
  fields,
  draft,
  applied,
  getValue,
  onDraftChange,
  onApply,
  onClear,
  onClose,
  sortControl,
}: Props<T>) {
  const allFields = useMemo(() => withNoneField(fields), [fields]);
  const [fieldOpen, setFieldOpen] = useState(false);
  const [valueOpen, setValueOpen] = useState(false);
  const [fieldSearch, setFieldSearch] = useState("");
  const [valueSearch, setValueSearch] = useState("");
  const fieldRef = useRef<HTMLDivElement>(null);
  const valueRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (fieldRef.current && !fieldRef.current.contains(target)) setFieldOpen(false);
      if (valueRef.current && !valueRef.current.contains(target)) setValueOpen(false);
    };
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, []);

  const filteredFields = useMemo(() => {
    const needle = fieldSearch.trim().toLowerCase();
    if (!needle) return allFields;
    return allFields.filter((field) => field.label.toLowerCase().includes(needle));
  }, [allFields, fieldSearch]);

  const activeField = allFields.find((field) => field.id === draft.field);
  const needsValue = draft.field !== "none";
  const isContains = activeField?.mode === "contains";

  const valueOptions = useMemo(() => {
    if (!needsValue || isContains) return [];
    return uniqueTableFilterValues(rows, draft.field, getValue);
  }, [rows, draft.field, getValue, needsValue, isContains]);

  const filteredValues = useMemo(() => {
    const needle = valueSearch.trim().toLowerCase();
    if (!needle) return valueOptions;
    return valueOptions.filter((value) => value.toLowerCase().includes(needle));
  }, [valueOptions, valueSearch]);

  const canApply = draft.field === "none" || (needsValue && draft.value.trim().length > 0);
  const hasApplied = isTableFilterActive(applied);

  return (
    <aside className={styles.panel} aria-label="Filter By">
      <div className={styles.panelHead}>
        <h4 className={styles.panelTitle}>Filter By</h4>
        <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close filter">
          <i className="fa-solid fa-xmark" aria-hidden="true" />
        </button>
      </div>

      <div className={styles.body}>
        <label className={styles.label}>
          Field
          <div className={styles.selectWrap} ref={fieldRef}>
            <button
              type="button"
              className={styles.selectBtn}
              onClick={(e) => {
                e.stopPropagation();
                setFieldOpen((open) => !open);
                setValueOpen(false);
              }}
            >
              <span>{fieldLabel(allFields, draft.field)}</span>
              <i className="fa-solid fa-chevron-down" aria-hidden="true" />
            </button>
            {fieldOpen ? (
              <div className={styles.dropdown} onClick={(e) => e.stopPropagation()}>
                <div className={styles.searchRow}>
                  <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
                  <input
                    className={styles.searchInputInDropdown}
                    value={fieldSearch}
                    onChange={(e) => setFieldSearch(e.target.value)}
                    placeholder="Search"
                    autoFocus
                  />
                </div>
                <div className={styles.options}>
                  {filteredFields.length === 0 ? (
                    <div className={styles.empty}>No fields found.</div>
                  ) : (
                    filteredFields.map((field) => (
                      <button
                        key={field.id}
                        type="button"
                        className={[
                          styles.option,
                          draft.field === field.id ? styles.optionActive : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        onClick={() => {
                          onDraftChange({ field: field.id, value: "" });
                          setFieldOpen(false);
                          setFieldSearch("");
                          setValueSearch("");
                        }}
                      >
                        {field.label}
                      </button>
                    ))
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </label>

        {needsValue ? (
          <label className={styles.label}>
            {isContains ? "Contains" : "Equals"}
            {isContains ? (
              <input
                className={styles.textInput}
                value={draft.value}
                onChange={(e) => onDraftChange({ ...draft, value: e.target.value })}
                placeholder="Type a value..."
              />
            ) : (
              <div className={styles.selectWrap} ref={valueRef}>
                <button
                  type="button"
                  className={styles.selectBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    setValueOpen((open) => !open);
                    setFieldOpen(false);
                  }}
                >
                  <span>{draft.value || "Select value"}</span>
                  <i className="fa-solid fa-chevron-down" aria-hidden="true" />
                </button>
                {valueOpen ? (
                  <div className={styles.dropdown} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.searchRow}>
                      <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
                      <input
                        className={styles.searchInputInDropdown}
                        value={valueSearch}
                        onChange={(e) => setValueSearch(e.target.value)}
                        placeholder="Search"
                        autoFocus
                      />
                    </div>
                    <div className={styles.options}>
                      {filteredValues.length === 0 ? (
                        <div className={styles.empty}>No values found.</div>
                      ) : (
                        filteredValues.map((value) => (
                          <button
                            key={value}
                            type="button"
                            className={[
                              styles.option,
                              draft.value === value ? styles.optionActive : "",
                            ]
                              .filter(Boolean)
                              .join(" ")}
                            onClick={() => {
                              onDraftChange({ ...draft, value });
                              setValueOpen(false);
                              setValueSearch("");
                            }}
                          >
                            {value}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </label>
        ) : null}
      </div>

      {sortControl ? (
        <div className={styles.sortWrap}>
          <span className={styles.toolLabel}>Sort By</span>
          <div className={styles.sortControlWrap}>
            <div className={styles.sortControl}>{sortControl}</div>
            <i className={`fa-solid fa-chevron-down ${styles.sortChevron}`} aria-hidden="true" />
          </div>
        </div>
      ) : null}

      <div className={styles.actions}>
        {hasApplied || draft.field !== "none" ? (
          <button type="button" className={styles.clearBtn} onClick={onClear}>
            Clear
          </button>
        ) : null}
        <button type="button" className={styles.applyBtn} onClick={onApply} disabled={!canApply}>
          Apply Filter
        </button>
      </div>
    </aside>
  );
}

type ShellProps = {
  open: boolean;
  active: boolean;
  total: number;
  onToggle: () => void;
  panel: React.ReactNode;
  children: React.ReactNode;
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  dateRange?: DateRangeValue;
  onDateRangeChange?: (next: DateRangeValue) => void;
};

export function TableFilterShell({
  open,
  active,
  total,
  onToggle,
  panel,
  children,
  search,
  onSearchChange,
  searchPlaceholder = "Search table...",
  dateRange,
  onDateRangeChange,
}: ShellProps) {
  const showSearch = typeof search === "string" && typeof onSearchChange === "function";
  const showDateRange = Boolean(dateRange && onDateRangeChange);
  const showTools = showSearch || showDateRange;

  return (
    <div className={[styles.layout, open ? styles.layoutWithPanel : ""].filter(Boolean).join(" ")}>
      {open ? panel : null}
      <div className={styles.main}>
        <div className={styles.toggleRow}>
          <button
            type="button"
            className={[styles.toggleBtn, open || active ? styles.toggleBtnActive : ""]
              .filter(Boolean)
              .join(" ")}
            onClick={onToggle}
          >
            <i className="fa-solid fa-filter" aria-hidden="true" /> Filter
          </button>

          {showTools ? (
            <div className={styles.tools}>
              {showSearch ? (
                <label className={styles.searchWrap}>
                  <span className={styles.searchLabel}>Search</span>
                  <input
                    type="search"
                    className={styles.searchInput}
                    value={search}
                    onChange={(e) => onSearchChange?.(e.target.value)}
                    placeholder={searchPlaceholder}
                    aria-label="Search table"
                  />
                </label>
              ) : null}
              {showDateRange && dateRange && onDateRangeChange ? (
                <DateRangePicker value={dateRange} onChange={onDateRangeChange} />
              ) : null}
            </div>
          ) : null}

          <span className={styles.total}>Total Records: {total}</span>
        </div>
        {children}
      </div>
    </div>
  );
}
