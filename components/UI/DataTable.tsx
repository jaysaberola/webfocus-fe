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

function buildPageList(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "ellipsis")[] = [1];
  if (current > 3) pages.push("ellipsis");
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p += 1) {
    pages.push(p);
  }
  if (current < total - 2) pages.push("ellipsis");
  pages.push(total);
  return pages;
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
        className={`dt-sort-btn${active ? " is-active" : ""}`}
        onClick={() => {
          if (active) { applySortChange(field, effectiveSortOrder === "asc" ? "desc" : "asc"); return; }
          applySortChange(field, defaultOrder);
        }}
        aria-label={`Sort by ${label}`}
        title={`Sort by ${label}`}
      >
        <span>{col.header}</span>
        <i className={iconClass} />
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
  const pageList = buildPageList(safeCurrent, safeTotal);
  const entriesOptions = [5, 10, 25, 50, 100];
  const showBottomEntries = entriesPlacement === "bottom" && (!isServerPaginated || typeof onItemsPerPageChange === "function");
  const shouldRenderPaginationBlock = showBottomEntries || effectiveTotalPages > 1;

  const thPad: CSSProperties = { padding: "12px 16px" };
  const tdPad: CSSProperties = { padding: "13px 16px" };

  const entriesControl = (
    <div className="dt-entries-control">
      <label>Show</label>
      <select
        value={selectedItemsPerPage}
        onChange={(e) => {
          const v = Number(e.target.value) || 10;
          setSelectedItemsPerPage(v);
          if (!isServerPaginated) setClientPage(1);
          if (isServerPaginated && typeof onItemsPerPageChange === "function") onItemsPerPageChange(v);
        }}
      >
        {entriesOptions.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <span>entries</span>
    </div>
  );

  return (
    <>
      {(entriesPlacement === "top" || actions) && (
        <div className="dt-toolbar">
          <div>{actions}</div>
          <div>{entriesPlacement === "top" ? entriesControl : null}</div>
        </div>
      )}

      <div
        className={[
          "cms-table-wrap",
          !wrapperClassName ? "cms-table-wrap--scroll" : "",
          wrapperClassName ?? "",
        ].join(" ")}
        style={wrapperStyle}
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
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={`sk-${i}`} className="dt-skeleton-row">
                  {columns.map((col) => (
                    <td key={col.key} style={tdPad}>
                      <div
                        className="dt-skeleton-bar"
                        style={{ width: col.key === "options" ? 80 : `${55 + (i * 7) % 30}%` }}
                      />
                    </td>
                  ))}
                </tr>
              ))
            )}

            {!loading && pageData.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="dt-empty-state">
                  <div className="dt-empty-state__icon">
                    <i className="fas fa-inbox" />
                  </div>
                  <div className="dt-empty-state__title">No records found</div>
                  <div className="text-muted small mt-1">Try adjusting your search or filters.</div>
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

      {shouldRenderPaginationBlock && (
        <div className="dt-footer">
          <div>{showBottomEntries && entriesControl}</div>

          <nav aria-label="Pagination">
            <div className="dt-pagination">
              <button
                type="button"
                className="dt-pg-btn"
                onClick={() => handlePageChange(safeCurrent - 1)}
                disabled={safeCurrent <= 1}
                aria-label="Previous page"
              >
                <i className="fas fa-chevron-left" style={{ fontSize: 10 }} />
                Prev
              </button>

              {safeTotal <= 7 ? (
                pageList.map((p, idx) =>
                  p === "ellipsis" ? (
                    <span key={`e-${idx}`} className="dt-pg-info" style={{ padding: "0 8px" }}>…</span>
                  ) : (
                    <button
                      key={p}
                      type="button"
                      className={`dt-pg-btn${p === safeCurrent ? " is-active" : ""}`}
                      onClick={() => handlePageChange(p)}
                      aria-label={`Page ${p}`}
                      aria-current={p === safeCurrent ? "page" : undefined}
                    >
                      {p}
                    </button>
                  )
                )
              ) : (
                <span className="dt-pg-info">{safeCurrent} / {safeTotal}</span>
              )}

              <button
                type="button"
                className="dt-pg-btn"
                onClick={() => handlePageChange(safeCurrent + 1)}
                disabled={safeCurrent >= safeTotal}
                aria-label="Next page"
              >
                Next
                <i className="fas fa-chevron-right" style={{ fontSize: 10 }} />
              </button>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
