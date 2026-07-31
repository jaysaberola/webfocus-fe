const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** Format a date/time value as YYYY-MM-DD using local calendar date (no UTC shift). */
export function formatCommerceDate(value?: string | null): string {
  if (!value) return "—";
  const raw = String(value).trim();
  if (DATE_ONLY.test(raw)) return raw;

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    const match = raw.match(/^(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : "—";
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Due date = issued date + N calendar days (default 30, matches admin invoice rules). */
export function commerceDueDate(issuedValue?: string | null, days = 30): string {
  const issued = formatCommerceDate(issuedValue);
  if (issued === "—") return "—";

  const [year, month, day] = issued.split("-").map(Number);
  const due = new Date(year, month - 1, day);
  due.setDate(due.getDate() + days);

  const dueYear = due.getFullYear();
  const dueMonth = String(due.getMonth() + 1).padStart(2, "0");
  const dueDay = String(due.getDate()).padStart(2, "0");
  return `${dueYear}-${dueMonth}-${dueDay}`;
}
