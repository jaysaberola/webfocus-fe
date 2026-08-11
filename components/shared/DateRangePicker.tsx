import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { formatDateRangeLabel, type DateRangeValue } from "@/lib/dateRangeHelpers";
import styles from "@/styles/dateRangePicker.module.css";

type Props = {
  value: DateRangeValue;
  onChange: (next: DateRangeValue) => void;
  onClear?: () => void;
  label?: string;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, count: number) {
  return new Date(date.getFullYear(), date.getMonth() + count, 1);
}

function toIsoDay(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function monthLabel(date: Date) {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function buildMonthCells(month: Date) {
  const first = startOfMonth(month);
  const startOffset = first.getDay();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: Array<{ iso: string; day: number; inMonth: boolean }> = [];

  for (let i = 0; i < startOffset; i += 1) {
    const date = new Date(month.getFullYear(), month.getMonth(), i - startOffset + 1);
    cells.push({ iso: toIsoDay(date), day: date.getDate(), inMonth: false });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(month.getFullYear(), month.getMonth(), day);
    cells.push({ iso: toIsoDay(date), day, inMonth: true });
  }

  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1];
    const date = new Date(last.iso);
    date.setDate(date.getDate() + 1);
    cells.push({ iso: toIsoDay(date), day: date.getDate(), inMonth: false });
  }

  return cells;
}

export default function DateRangePicker({ value, onChange, onClear, label = "Date Range" }: Props) {
  const [open, setOpen] = useState(false);
  const [leftMonth, setLeftMonth] = useState(() => startOfMonth(new Date()));
  const [draftFrom, setDraftFrom] = useState(value.from);
  const [draftTo, setDraftTo] = useState(value.to);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setDraftFrom(value.from);
    setDraftTo(value.to);
    if (value.from) {
      setLeftMonth(startOfMonth(new Date(`${value.from}T00:00:00`)));
    }
  }, [open, value.from, value.to]);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;

    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const width = Math.min(560, Math.max(320, window.innerWidth - 24));
      let left = rect.left;
      if (left + width > window.innerWidth - 12) {
        left = Math.max(12, window.innerWidth - width - 12);
      }

      const spaceBelow = window.innerHeight - rect.bottom;
      const preferAbove = spaceBelow < 360 && rect.top > spaceBelow;
      const top = preferAbove ? undefined : rect.bottom + 8;
      const bottom = preferAbove ? window.innerHeight - rect.top + 8 : undefined;

      setPopoverStyle({
        position: "fixed",
        top,
        bottom,
        left,
        width,
        zIndex: 10000,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (popoverRef.current?.contains(target)) return;
      setOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const rightMonth = useMemo(() => addMonths(leftMonth, 1), [leftMonth]);
  const leftCells = useMemo(() => buildMonthCells(leftMonth), [leftMonth]);
  const rightCells = useMemo(() => buildMonthCells(rightMonth), [rightMonth]);

  const pickDay = (iso: string) => {
    if (!draftFrom || (draftFrom && draftTo)) {
      setDraftFrom(iso);
      setDraftTo("");
      return;
    }

    if (iso < draftFrom) {
      setDraftTo(draftFrom);
      setDraftFrom(iso);
      return;
    }

    setDraftTo(iso);
  };

  const dayClass = (iso: string, inMonth: boolean) => {
    const classes = [styles.day];
    if (!inMonth) classes.push(styles.dayOutside);
    if (draftFrom && draftTo && iso > draftFrom && iso < draftTo) classes.push(styles.dayInRange);
    if (iso === draftFrom || iso === draftTo) classes.push(styles.dayEndpoint);
    if (iso === draftFrom) classes.push(styles.dayStart);
    if (iso === draftTo) classes.push(styles.dayEnd);
    return classes.join(" ");
  };

  const canSelect = Boolean(draftFrom);

  const commit = () => {
    if (!draftFrom) return;
    onChange({ from: draftFrom, to: draftTo || draftFrom });
    setOpen(false);
  };

  const clear = (event?: React.MouseEvent) => {
    event?.stopPropagation();
    setDraftFrom("");
    setDraftTo("");
    onChange({ from: "", to: "" });
    onClear?.();
    setOpen(false);
  };

  const renderMonth = (month: Date, cells: ReturnType<typeof buildMonthCells>, side: "left" | "right") => (
    <div className={styles.month}>
      <div className={styles.monthHead}>
        {side === "left" ? (
          <button
            type="button"
            className={styles.navBtn}
            onClick={() => setLeftMonth((current) => addMonths(current, -1))}
            aria-label="Previous month"
          >
            <i className="fa-solid fa-chevron-left" aria-hidden="true" />
          </button>
        ) : (
          <span className={styles.navSpacer} />
        )}
        <strong>{monthLabel(month)}</strong>
        {side === "right" ? (
          <button
            type="button"
            className={styles.navBtn}
            onClick={() => setLeftMonth((current) => addMonths(current, 1))}
            aria-label="Next month"
          >
            <i className="fa-solid fa-chevron-right" aria-hidden="true" />
          </button>
        ) : (
          <span className={styles.navSpacer} />
        )}
      </div>
      <div className={styles.weekdays}>
        {WEEKDAYS.map((day) => (
          <span key={day} className={day === "Sun" ? styles.sunday : undefined}>
            {day}
          </span>
        ))}
      </div>
      <div className={styles.days}>
        {cells.map((cell) => (
          <button
            key={`${side}-${cell.iso}`}
            type="button"
            className={dayClass(cell.iso, cell.inMonth)}
            onClick={() => pickDay(cell.iso)}
          >
            {cell.day}
          </button>
        ))}
      </div>
    </div>
  );

  const popover =
    open && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={popoverRef}
            className={styles.popover}
            style={popoverStyle}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className={styles.calendars}>
              {renderMonth(leftMonth, leftCells, "left")}
              {renderMonth(rightMonth, rightCells, "right")}
            </div>
            <div className={styles.footer}>
              <button type="button" className={styles.selectBtn} onClick={commit} disabled={!canSelect}>
                Select dates
              </button>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className={styles.root} ref={rootRef}>
      {label ? <span className={styles.label}>{label}</span> : null}
      <div className={styles.controls}>
        <button
          ref={triggerRef}
          type="button"
          className={[styles.trigger, value.from || value.to ? styles.triggerActive : ""]
            .filter(Boolean)
            .join(" ")}
          onClick={(e) => {
            e.stopPropagation();
            setOpen((current) => !current);
          }}
        >
          <i className="fa-regular fa-calendar" aria-hidden="true" />
          <span>{formatDateRangeLabel(value)}</span>
          <i className="fa-solid fa-chevron-down" aria-hidden="true" />
        </button>
        {value.from || value.to ? (
          <button type="button" className={styles.clearBtn} onClick={clear}>
            Clear
          </button>
        ) : null}
      </div>
      {popover}
    </div>
  );
}
