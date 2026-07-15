import { ReactNode, useMemo, useState, useEffect } from "react";
import type { CSSProperties } from "react";

type SortOrder = "asc" | "desc";

export interface Column<T> {
  key: string;
  header: ReactNode;
  render?: (row: T) => ReactNode;
  thClassName?: string;
  tdClassName?: string;
  width?: number | string;
  minWidth?: number | string;
  maxWidth?: number | string;
  thStyle?: CSSProperties;
  tdStyle?: CSSProperties;
  sortable?: boolean;
  sortField?: string;
  sortLabel?: string;
  defaultSortOrder?: SortOrder;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  wrapperClassName?: string;
  wrapperStyle?: CSSProperties;
  tableClassName?: string;
  tableStyle?: CSSProperties;
  fixedLayout?: boolean;
  stickyHeader?: boolean;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  itemsPerPage?: number;
  onItemsPerPageChange?: (n: number) => void;
  sortBy?: string;
  sortOrder?: SortOrder;
  onSortChange?: (sortBy: string, sortOrder: SortOrder) => void;
  actions?: ReactNode;
  entriesPlacement?: "bottom" | "top" | "none";
}

export default function DataTable<T>({
  columns,
  data,
  loading = false,
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage = 10,
  onItemsPerPageChange,
  sortBy,
  sortOrder,
  onSortChange,
  wrapperClassName,
  wrapperStyle,
  tableClassName,
  tableStyle,
  fixedLayout = false,
  stickyHeader = false,
  actions,
  entriesPlacement = "bottom",
}: DataTableProps<T>) {
  const isServerPaginated =
    typeof currentPage === "number" &&
    typeof totalPages === "number" &&
    typeof onPageChange === "function";

  const sortableColumns = useMemo(() => columns.filter((c) => c.sortable), [columns]);
  const firstSortableField = sortableColumns[0]?.sortField ?? sortableColumns[0]?.key;
  const [localSortBy, setLocalSortBy] = useState<string | undefined>(firstSortableField);
  const [localSortOrder, setLocalSortOrder] = useState<SortOrder>("asc");

  const effectiveSortBy = onSortChange ? sortBy : (sortBy ?? localSortBy);
  const effectiveSortOrder: SortOrder = onSortChange ? (sortOrder ?? "asc") : (sortOrder ?? localSortOrder);

  const applySortChange = (nextBy: string, nextOrder: SortOrder) => {
    if (onSortChange) { onSortChange(nextBy, nextOrder); return; }
    setLocalSortBy(nextBy);
    setLocalSortOrder(nextOrder);
  };

  const getHeaderLabel = (col: Column<T>) => {
    if (col.sortLabel) return col.sortLabel;
    if (typeof col.header === "string") return col.header;
    return col.key;
  };

  const renderSortableHeader = (col: Column<T>) => {
    const field = col.sortField ?? col.key;
    const label = getHeaderLabel(col);
    const active = (effectiveSortBy ?? "") === field;
    const order = active ? effectiveSortOrder : undefined;
    const iconClass = !active ? "fas fa-sort" : order === "asc" ? "fas fa-sort-up" : "fas fa-sort-down";
    const defaultOrder: SortOrder = col.defaultSortOrder ?? "asc";

    return (
      <button
        type="button"
        onClick={() => {
          if (active) { applySortChange(field, effectiveSortOrder === "asc" ? "desc" : "asc"); return; }
          applySortChange(field, defaultOrder);
        }}
        aria-label={`Sort by ${label}`}
        title={`Sort by ${label}`}
        style={{
          background: "none", border: "none", padding: 0, cursor: "pointer",
          display: "inline-flex", alignItems: "center", gap: 6,
          color: "inherit", fontWeight: 700, fontSize: "inherit",
        }}
      >
        <span>{col.header}</span>
        <i className={iconClass} style={{ fontSize: 10, opacity: active ? 1 : 0.4 }} />
      </button>
    );
  };

  const sortedData = useMemo(() => {
    if (onSortChange) return data;
    if (!effectiveSortBy) return data;
    const col = columns.find((c) => (c.sortField ?? c.key) === effectiveSortBy);
    if (!col || !col.sortable) return data;
    const direction = effectiveSortOrder === "asc" ? 1 : -1;
    const field = effectiveSortBy;
    const valueOf = (row: any) => row?.[field];
    const toComparable = (v: any) => {
      if (v == null) return "";
      if (typeof v === "number") return v;
      if (typeof v === "boolean") return v ? 1 : 0;
      const asString = String(v);
      const ms = Date.parse(asString);
      if (Number.isFinite(ms)) return ms;
      return asString.toLowerCase();
    };
    return data
      .map((row, idx) => ({ row, idx }))
      .sort((a, b) => {
        const av = toComparable(valueOf(a.row));
        const bv = toComparable(valueOf(b.row));
        let cmp = 0;
        if (typeof av === "number" && typeof bv === "number") cmp = av - bv;
        else cmp = String(av).localeCompare(String(bv));
        if (cmp === 0) cmp = a.idx - b.idx;
        return cmp * direction;
      })
      .map((x) => x.row);
  }, [columns, data, effectiveSortBy, effectiveSortOrder, onSortChange]);

  const [clientPage, setClientPage] = useState(1);
  const [selectedItemsPerPage, setSelectedItemsPerPage] = useState(itemsPerPage);

  useEffect(() => { setSelectedItemsPerPage(itemsPerPage); }, [itemsPerPage]);

  const effectiveCurrentPage = isServerPaginated ? (currentPage || 1) : clientPage;
  const effectiveTotalPages = isServerPaginated
    ? (totalPages || 1)
    : Math.max(1, Math.ceil(sortedData.length / selectedItemsPerPage));

  const clampPage = (p: number) => Math.min(Math.max(1, p), effectiveTotalPages);

  const handlePageChange = (p: number) => {
    const next = clampPage(p);
    if (isServerPaginated) onPageChange?.(next);
    else setClientPage(next);
  };

  const pageData = isServerPaginated
    ? data
    : sortedData.slice(
        (effectiveCurrentPage - 1) * selectedItemsPerPage,
        effectiveCurrentPage * selectedItemsPerPage
      );

  const safeTotal = Math.max(1, effectiveTotalPages);
  const safeCurrent = Math.min(Math.max(1, effectiveCurrentPage), safeTotal);
  const entriesOptions = [5, 10, 25, 50, 100];
  const showBottomEntries = entriesPlacement === "bottom" && (!isServerPaginated || typeof onItemsPerPageChange === "function");
  const shouldRenderPaginationBlock = showBottomEntries || effectiveTotalPages > 1;

  const entriesControl = (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <label style={{ fontSize: 13, color: "#64748b", marginBottom: 0 }}>Show</label>
      <select
        value={selectedItemsPerPage}
        onChange={(e) => {
          const v = Number(e.target.value) || 10;
          setSelectedItemsPerPage(v);
          if (!isServerPaginated) setClientPage(1);
          if (isServerPaginated && typeof onItemsPerPageChange === "function") onItemsPerPageChange(v);
        }}
        style={{
          border: "1px solid #e2e8f0", borderRadius: 7, padding: "4px 10px",
          fontSize: 13, color: "#374151", background: "#fff",
          cursor: "pointer", outline: "none",
        }}
      >
        {entriesOptions.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <span style={{ fontSize: 13, color: "#94a3b8" }}>entries</span>
    </div>
  );

  // Shared cell/header padding
  const thPad: CSSProperties = { padding: "11px 14px" };
  const tdPad: CSSProperties = { padding: "12px 14px" };

  return (
    <>
      <style>{`
        .dt-enhanced-table { border-collapse: collapse; width: 100%; }
        .dt-enhanced-table thead th {
          background: #f8fafc;
          color: #64748b;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          border-bottom: 1px solid #e2e8f0;
          border-right: 1px solid #f1f5f9;
          white-space: nowrap;
          position: relative;
        }
        .dt-enhanced-table thead th:last-child { border-right: none; }
        .dt-enhanced-table tbody tr {
          border-bottom: 1px solid #f1f5f9;
          transition: background 0.12s;
        }
        .dt-enhanced-table tbody tr:last-child { border-bottom: none; }
        .dt-enhanced-table tbody tr:hover { background: #f8fafc; }
        .dt-enhanced-table tbody td {
          color: #374151;
          font-size: 13.5px;
          border-right: 1px solid #f8fafc;
          vertical-align: middle;
        }
        .dt-enhanced-table tbody td:last-child { border-right: none; }
        .dt-pg-btn {
          height: 32px; min-width: 32px; padding: 0 12px;
          border-radius: 7px; border: 1px solid #e2e8f0;
          background: #fff; font-size: 13px; color: #374151;
          cursor: pointer; display: inline-flex; align-items: center;
          justify-content: center; transition: background 0.12s, border-color 0.12s;
          font-family: inherit;
        }
        .dt-pg-btn:hover:not(:disabled) { background: #f1f5f9; border-color: #cbd5e1; }
        .dt-pg-btn:disabled { color: #cbd5e1; cursor: default; background: #fafafa; }
        .dt-pg-info {
          height: 32px; padding: 0 14px;
          border-radius: 7px; background: #f1f5f9;
          font-size: 13px; color: #64748b;
          display: inline-flex; align-items: center;
          border: 1px solid #e8edf3;
        }
      `}</style>

      {(entriesPlacement === "top" || actions) && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div>{actions}</div>
          <div>{entriesPlacement === "top" ? entriesControl : null}</div>
        </div>
      )}

      {/* Table wrapper */}
      <div
        className={wrapperClassName}
        style={{
          background: "#fff",
          borderRadius: 12,
          border: "1px solid #e8edf3",
          overflow: "hidden",
          ...(!wrapperClassName ? { overflowX: "auto" } : {}),
          ...wrapperStyle,
        }}
      >
        <table
          className={`dt-enhanced-table${tableClassName ? ` ${tableClassName}` : ""}`}
          style={{
            ...(fixedLayout ? { tableLayout: "fixed" } : {}),
            ...tableStyle,
          }}
        >
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={col.thClassName}
                  style={{
                    ...thPad,
                    ...(stickyHeader ? { position: "sticky", top: 0, zIndex: 2 } : {}),
                    ...(col.width != null ? { width: col.width } : {}),
                    ...(col.minWidth != null ? { minWidth: col.minWidth } : {}),
                    ...(col.maxWidth != null ? { maxWidth: col.maxWidth } : {}),
                    ...col.thStyle,
                  }}
                >
                  {col.sortable ? renderSortableHeader(col) : col.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan={columns.length} style={{ ...tdPad, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
                  <span style={{ opacity: 0.7 }}>Loading...</span>
                </td>
              </tr>
            )}

            {!loading && pageData.length === 0 && (
              <tr>
                <td colSpan={columns.length} style={{ ...tdPad, textAlign: "center", color: "#94a3b8", fontSize: 13, padding: "40px 14px" }}>
                  No records found.
                </td>
              </tr>
            )}

            {!loading && pageData.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={col.tdClassName}
                    style={{
                      ...tdPad,
                      ...(col.width != null ? { width: col.width } : {}),
                      ...(col.minWidth != null ? { minWidth: col.minWidth } : {}),
                      ...(col.maxWidth != null ? { maxWidth: col.maxWidth } : {}),
                      ...col.tdStyle,
                    }}
                  >
                    {col.render ? col.render(row) : (row as any)[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer: entries + pagination */}
      {shouldRenderPaginationBlock && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 4px 4px",
        }}>
          <div>{showBottomEntries && entriesControl}</div>

          <nav aria-label="Pagination">
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <button
                className="dt-pg-btn"
                onClick={() => handlePageChange(safeCurrent - 1)}
                disabled={safeCurrent <= 1}
              >
                Prev
              </button>
              <span className="dt-pg-info">{safeCurrent} / {safeTotal}</span>
              <button
                className="dt-pg-btn"
                onClick={() => handlePageChange(safeCurrent + 1)}
                disabled={safeCurrent >= safeTotal}
              >
                Next
              </button>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}