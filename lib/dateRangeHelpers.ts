export type DateRangeValue = {
  from: string;
  to: string;
};

export const emptyDateRange: DateRangeValue = { from: "", to: "" };

export function isDateRangeActive(range: DateRangeValue) {
  return Boolean(range.from || range.to);
}

/** Normalize many display date formats to YYYY-MM-DD for comparison. */
export function toComparableDate(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return value.toISOString().slice(0, 10);
  }

  const raw = String(value).trim();
  if (!raw || raw === "—") return null;

  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    return raw.slice(0, 10);
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function rowMatchesDateRange(
  rowDate: string | Date | null | undefined,
  range: DateRangeValue,
): boolean {
  if (!isDateRangeActive(range)) return true;
  const current = toComparableDate(rowDate);
  if (!current) return false;
  if (range.from && current < range.from) return false;
  if (range.to && current > range.to) return false;
  return true;
}

export function rowMatchesSearch(
  haystacks: Array<string | number | null | undefined>,
  search: string,
): boolean {
  const needle = search.trim().toLowerCase();
  if (!needle) return true;
  return haystacks.some((value) => String(value ?? "").toLowerCase().includes(needle));
}

export function formatDateRangeLabel(range: DateRangeValue) {
  if (range.from && range.to) return `${range.from} → ${range.to}`;
  if (range.from) return `From ${range.from}`;
  if (range.to) return `Until ${range.to}`;
  return "Select dates";
}
