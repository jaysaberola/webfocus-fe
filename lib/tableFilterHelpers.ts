export type TableFilterFieldDef = {
  id: string;
  label: string;
  /** defaults to equals */
  mode?: "equals" | "contains";
};

export type TableFilterState = {
  field: string;
  value: string;
};

export const emptyTableFilter: TableFilterState = {
  field: "none",
  value: "",
};

export const NONE_FILTER_FIELD: TableFilterFieldDef = {
  id: "none",
  label: "None",
};

export function withNoneField(fields: TableFilterFieldDef[]): TableFilterFieldDef[] {
  return [NONE_FILTER_FIELD, ...fields.filter((field) => field.id !== "none")];
}

export function isTableFilterActive(filter: TableFilterState) {
  return filter.field !== "none" && Boolean(filter.value.trim());
}

export function applyTableFilter<T>(
  rows: T[],
  filter: TableFilterState,
  fields: TableFilterFieldDef[],
  getValue: (row: T, fieldId: string) => string,
): T[] {
  if (!isTableFilterActive(filter)) return rows;

  const field = fields.find((item) => item.id === filter.field);
  const mode = field?.mode ?? "equals";
  const needle = filter.value.trim().toLowerCase();

  return rows.filter((row) => {
    const raw = String(getValue(row, filter.field) ?? "").trim();
    if (mode === "contains") {
      return raw.toLowerCase().includes(needle);
    }
    return raw.toLowerCase() === needle;
  });
}

export function uniqueTableFilterValues<T>(
  rows: T[],
  fieldId: string,
  getValue: (row: T, fieldId: string) => string,
): string[] {
  if (!fieldId || fieldId === "none") return [];

  const values = rows
    .map((row) => String(getValue(row, fieldId) ?? "").trim())
    .filter(Boolean);

  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}
