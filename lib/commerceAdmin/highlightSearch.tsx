import { type ReactNode } from "react";

export function highlightSearch(text: string, search: string, className = ""): ReactNode {
  const value = String(text ?? "");
  const needle = search.trim();
  if (!needle || !value) return value || "—";

  const lower = value.toLowerCase();
  const query = needle.toLowerCase();
  const parts: ReactNode[] = [];
  let cursor = 0;
  let index = lower.indexOf(query, cursor);
  let key = 0;

  while (index >= 0) {
    if (index > cursor) parts.push(value.slice(cursor, index));
    parts.push(
      <mark key={`hit-${key++}`} className={className}>
        {value.slice(index, index + needle.length)}
      </mark>,
    );
    cursor = index + needle.length;
    index = lower.indexOf(query, cursor);
  }

  if (cursor < value.length) parts.push(value.slice(cursor));
  return parts.length ? parts : value;
}
