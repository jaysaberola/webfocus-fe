import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * Shared multi-select state for admin data tables.
 */
export function useRowSelection<T>(
  rows: T[],
  getRowId: (row: T) => string | number
) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const rowIds = useMemo(
    () => rows.map((row) => String(getRowId(row))),
    [rows, getRowId]
  );

  // Drop selections that are no longer on the current page/list.
  useEffect(() => {
    setSelectedIds((current) => {
      const allowed = new Set(rowIds);
      const next = current.filter((id) => allowed.has(id));
      return next.length === current.length ? current : next;
    });
  }, [rowIds]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const allSelected =
    rowIds.length > 0 && rowIds.every((id) => selectedSet.has(id));
  const someSelected =
    rowIds.some((id) => selectedSet.has(id)) && !allSelected;

  const isSelected = useCallback(
    (row: T) => selectedSet.has(String(getRowId(row))),
    [getRowId, selectedSet]
  );

  const toggleRow = useCallback(
    (row: T) => {
      const id = String(getRowId(row));
      setSelectedIds((current) =>
        current.includes(id)
          ? current.filter((entry) => entry !== id)
          : [...current, id]
      );
    },
    [getRowId]
  );

  const toggleAll = useCallback(() => {
    setSelectedIds((current) => {
      const currentSet = new Set(current);
      const allOnPageSelected =
        rowIds.length > 0 && rowIds.every((id) => currentSet.has(id));
      if (allOnPageSelected) {
        return current.filter((id) => !rowIds.includes(id));
      }
      return Array.from(new Set([...current, ...rowIds]));
    });
  }, [rowIds]);

  const clearSelection = useCallback(() => setSelectedIds([]), []);

  return {
    selectedIds,
    selectedCount: selectedIds.length,
    allSelected,
    someSelected,
    isSelected,
    toggleRow,
    toggleAll,
    clearSelection,
    setSelectedIds,
  };
}

export function defaultAdminRowId(row: unknown, index: number): string {
  if (row == null || typeof row !== "object") return String(index);
  const record = row as Record<string, unknown>;
  if (record.id != null) return String(record.id);
  if (record.uuid != null) return String(record.uuid);
  if (record.transaction_no != null) return String(record.transaction_no);
  if (record.ticketNo != null) return String(record.ticketNo);
  if (record.proofNo != null) return String(record.proofNo);
  if (record.invoiceId != null) return String(record.invoiceId);
  return String(index);
}
