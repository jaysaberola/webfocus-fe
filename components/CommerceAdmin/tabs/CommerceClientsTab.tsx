import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import SortableTableHead from "@/components/CommerceAdmin/SortableTableHead";
import {
  CommerceSelectAllHead,
  CommerceSelectRowCell,
} from "@/components/CommerceAdmin/CommerceSelectCells";
import { useRowSelection } from "@/lib/useRowSelection";
import CreateClientModal from "@/components/CommerceAdmin/modals/CreateClientModal";
import EditClientModal from "@/components/CommerceAdmin/modals/EditClientModal";
import ClientDetailModal from "@/components/CommerceAdmin/modals/ClientDetailModal";
import AssignClientOwnerModal from "@/components/CommerceAdmin/modals/AssignClientOwnerModal";
import ConfirmModal from "@/components/UI/ConfirmModal";
import {
  CLIENT_COLUMN_LABELS,
  DEFAULT_CLIENT_COLUMNS,
  clientBillingInCharge,
  clientClassification,
  clientDisplayName,
  clientIsAssigned,
  clientOwnerName,
  filterClients,
  formatClientCreatedTime,
  sortClients,
  type ClientColumnKey,
  type ClientFilterKey,
  type ClientSortKey,
} from "@/lib/commerceAdmin/clientHelpers";
import { exportClientsToExcel } from "@/lib/commerceAdmin/exportClientsExcel";
import {
  clientSortDirection,
  isClientColumnSorted,
  toggleClientSort,
} from "@/lib/commerceAdmin/tableSortHelpers";
import { getCustomers } from "@/services/commerceAdminService";
import { bulkDeleteCustomers, type CustomerRow } from "@/services/customerService";
import type { CommerceAdminTab } from "@/lib/commerceAdmin/types";
import styles from "@/styles/commerceAdmin.module.css";

const PAGE_SIZE = 10;

type Props = {
  onTabChange?: (tab: CommerceAdminTab) => void;
};

export default function CommerceClientsTab(_props: Props) {
  const [rows, setRows] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<ClientSortKey>("name-asc");
  const [filterStatus, setFilterStatus] = useState<ClientFilterKey>("all");
  const [columnsVisible, setColumnsVisible] = useState(DEFAULT_CLIENT_COLUMNS);
  const [colVisOpen, setColVisOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editClient, setEditClient] = useState<CustomerRow | null>(null);
  const [detailClient, setDetailClient] = useState<CustomerRow | null>(null);
  const [detailMode, setDetailMode] = useState<"info" | "audit">("info");
  const [assignOwnerClient, setAssignOwnerClient] = useState<CustomerRow | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const colVisRef = useRef<HTMLDivElement>(null);

  const loadRows = useCallback(() => {
    setLoading(true);
    getCustomers({ per_page: 200 }, { silent: true })
      .then((res) => setRows(Array.isArray(res?.data) ? res.data : []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  useEffect(() => {
    setPage(1);
  }, [sortBy, filterStatus]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (colVisRef.current && !colVisRef.current.contains(event.target as Node)) {
        setColVisOpen(false);
      }
    };
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, []);

  const processedRows = useMemo(() => {
    const filtered = filterClients(rows, filterStatus);
    return sortClients(filtered, sortBy);
  }, [rows, filterStatus, sortBy]);

  const totalPages = Math.max(1, Math.ceil(processedRows.length / PAGE_SIZE));
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return processedRows.slice(start, start + PAGE_SIZE);
  }, [processedRows, page]);

  const getClientRowId = useCallback((client: CustomerRow) => String(client.id), []);
  const selection = useRowSelection(paginatedRows, getClientRowId);
  const hasSelection = selection.selectedCount > 0;

  const selectedRows = useMemo(() => {
    const ids = new Set(selection.selectedIds);
    return processedRows.filter((row) => ids.has(String(row.id)));
  }, [processedRows, selection.selectedIds]);

  const rangeStart = processedRows.length ? (page - 1) * PAGE_SIZE + 1 : 0;
  const rangeEnd = Math.min(page * PAGE_SIZE, processedRows.length);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const handleColumnSort = (column: ClientColumnKey) => {
    setSortBy((current) => toggleClientSort(current, column));
  };

  const renderSortableHead = (column: ClientColumnKey, label = CLIENT_COLUMN_LABELS[column]) => (
    <SortableTableHead
      key={column}
      label={label}
      active={isClientColumnSorted(sortBy, column)}
      direction={clientSortDirection(sortBy, column) ?? "asc"}
      onClick={() => handleColumnSort(column)}
    />
  );

  const toggleColumn = (key: ClientColumnKey, checked: boolean) => {
    setColumnsVisible((current) => ({ ...current, [key]: checked }));
  };

  const openClient = (client: CustomerRow) => {
    setDetailClient(client);
    setDetailMode("info");
  };

  const handleExportExcel = async () => {
    if (selectedRows.length === 0 || exporting) return;
    setExporting(true);
    try {
      await exportClientsToExcel(selectedRows);
    } finally {
      setExporting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRows.length === 0) return;
    setDeleting(true);
    try {
      await bulkDeleteCustomers(selectedRows.map((row) => row.id));
      selection.clearSelection();
      setDeleteConfirmOpen(false);
      loadRows();
    } catch {
      // Keep selection so the user can retry after an error toast from axios.
    } finally {
      setDeleting(false);
    }
  };

  const visibleColumnCount = Object.values(columnsVisible).filter(Boolean).length + 1;

  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <h3 className={styles.panelTitle}>Clients</h3>
          <p className={styles.panelSubtitle}>
            Manage registered corporate accounts, ownership, and classification.
          </p>
        </div>
      </div>

      {hasSelection ? (
        <div className={styles.bulkSelectionBar}>
          <span>
            {selection.selectedCount} client{selection.selectedCount === 1 ? "" : "s"} selected
          </span>
          <div className={styles.bulkSelectionActions}>
            <button
              type="button"
              className={styles.secondaryBtnSm}
              onClick={() => void handleExportExcel()}
              disabled={exporting || deleting}
            >
              <i className="fa-solid fa-file-excel" aria-hidden="true" />
              {exporting ? " Exporting..." : " Export Excel"}
            </button>
            <button
              type="button"
              className={styles.dangerBtnSm}
              onClick={() => setDeleteConfirmOpen(true)}
              disabled={deleting || exporting}
            >
              <i className="fa-solid fa-trash" aria-hidden="true" /> Delete
            </button>
            <button
              type="button"
              className={styles.secondaryBtnSm}
              onClick={selection.clearSelection}
              disabled={deleting || exporting}
            >
              Clear
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.toolbarRow}>
          <div className={styles.toolbarFilters}>
            <select
              className={styles.selectInline}
              value={
                sortBy === "name-asc" || sortBy === "name-desc" || sortBy === "newest" || sortBy === "oldest"
                  ? sortBy
                  : "name-asc"
              }
              onChange={(e) => setSortBy(e.target.value as ClientSortKey)}
            >
              <option value="name-asc">Sort: Client Name (A - Z)</option>
              <option value="name-desc">Sort: Client Name (Z - A)</option>
              <option value="newest">Sort: Newest Created</option>
              <option value="oldest">Sort: Oldest Created</option>
            </select>
            <select
              className={styles.selectInline}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as ClientFilterKey)}
            >
              <option value="all">Filter: All Clients</option>
              <option value="New">New</option>
              <option value="Existing">Existing</option>
              <option value="Active">Active</option>
              <option value="Disabled">Disabled</option>
            </select>
            <div className={styles.colVisWrap} ref={colVisRef}>
              <button
                type="button"
                className={styles.colVisBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  setColVisOpen((open) => !open);
                }}
              >
                <i className="fa-solid fa-table-columns" aria-hidden="true" /> Column Visibility
              </button>
              {colVisOpen ? (
                <div className={styles.colVisPanel}>
                  <div className={styles.colVisTitle}>Toggle Columns</div>
                  {(Object.keys(CLIENT_COLUMN_LABELS) as ClientColumnKey[]).map((key) => (
                    <label key={key} className={styles.colVisItem}>
                      <input
                        type="checkbox"
                        checked={columnsVisible[key]}
                        onChange={(e) => toggleColumn(key, e.target.checked)}
                      />
                      {CLIENT_COLUMN_LABELS[key]}
                    </label>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
          <button type="button" className={styles.primaryBtnSm} onClick={() => setCreateOpen(true)}>
            <i className="fa-solid fa-plus" aria-hidden="true" /> Create Client
          </button>
        </div>
      )}

      {loading ? (
        <p className={styles.emptyState}>Loading clients...</p>
      ) : (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <CommerceSelectAllHead
                    allSelected={selection.allSelected}
                    someSelected={selection.someSelected}
                    onToggleAll={selection.toggleAll}
                    disabled={paginatedRows.length === 0}
                  />
                  {columnsVisible.name ? renderSortableHead("name") : null}
                  {columnsVisible.owner ? renderSortableHead("owner") : null}
                  {columnsVisible.created ? renderSortableHead("created") : null}
                  {columnsVisible.billing ? renderSortableHead("billing") : null}
                  {columnsVisible.classification ? renderSortableHead("classification") : null}
                </tr>
              </thead>
              <tbody>
                {paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount}>No clients found.</td>
                  </tr>
                ) : (
                  paginatedRows.map((client) => {
                    const classification = clientClassification(client);
                    return (
                      <tr
                        key={client.id}
                        className={selection.isSelected(client) ? styles.rowSelected : undefined}
                      >
                        <CommerceSelectRowCell
                          checked={selection.isSelected(client)}
                          onChange={() => selection.toggleRow(client)}
                          label={`Select client ${clientDisplayName(client)}`}
                        />
                        {columnsVisible.name ? (
                          <td>
                            <button
                              type="button"
                              className={styles.tableCellLink}
                              onClick={() => openClient(client)}
                            >
                              {clientDisplayName(client)}
                            </button>
                          </td>
                        ) : null}
                        {columnsVisible.owner ? (
                          <td>
                            <button
                              type="button"
                              className={
                                clientIsAssigned(client)
                                  ? styles.txAssignedBadge
                                  : styles.txAssignedEmpty
                              }
                              onClick={() => setAssignOwnerClient(client)}
                              title="Assign client owner"
                            >
                              {clientOwnerName(client)}
                            </button>
                          </td>
                        ) : null}
                        {columnsVisible.created ? <td>{formatClientCreatedTime(client)}</td> : null}
                        {columnsVisible.billing ? <td>{clientBillingInCharge(client)}</td> : null}
                        {columnsVisible.classification ? (
                          <td>
                            <span
                              className={
                                classification === "Existing" ? styles.badgePaid : styles.badgePending
                              }
                            >
                              {classification}
                            </span>
                          </td>
                        ) : null}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className={styles.paginationBar}>
            <div className={styles.paginationInfo}>Total Records {processedRows.length}</div>
            <div className={styles.paginationControls}>
              <button
                type="button"
                className={styles.secondaryBtnSm}
                disabled={page <= 1 || processedRows.length === 0}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label="Previous page"
              >
                <i className="fa-solid fa-chevron-left" aria-hidden="true" />
              </button>
              <span className={styles.paginationRange}>
                {processedRows.length === 0 ? "0 to 0" : `${rangeStart} to ${rangeEnd}`}
              </span>
              <button
                type="button"
                className={styles.secondaryBtnSm}
                disabled={page >= totalPages || processedRows.length === 0}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                aria-label="Next page"
              >
                <i className="fa-solid fa-chevron-right" aria-hidden="true" />
              </button>
            </div>
          </div>
        </>
      )}

      <CreateClientModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={loadRows} />
      <EditClientModal
        open={Boolean(editClient)}
        client={editClient}
        onClose={() => setEditClient(null)}
        onUpdated={loadRows}
      />
      <ClientDetailModal
        open={Boolean(detailClient)}
        client={detailClient}
        mode={detailMode}
        onClose={() => setDetailClient(null)}
        onEdit={(client) => {
          setDetailClient(null);
          setEditClient(client);
        }}
      />
      <AssignClientOwnerModal
        open={Boolean(assignOwnerClient)}
        client={assignOwnerClient}
        onClose={() => setAssignOwnerClient(null)}
        onAssigned={(payload) => {
          setRows((current) =>
            current.map((row) =>
              row.id === payload.id
                ? {
                    ...row,
                    owner_id: payload.owner_id,
                    owner: payload.owner,
                    owner_name: payload.owner_name,
                  }
                : row,
            ),
          );
          setAssignOwnerClient(null);
        }}
      />
      <ConfirmModal
        show={deleteConfirmOpen}
        title="Delete clients"
        message={
          <>
            Delete <strong>{selection.selectedCount}</strong> selected client
            {selection.selectedCount === 1 ? "" : "s"}? This cannot be undone from the list.
          </>
        }
        confirmLabel={deleting ? "Deleting..." : "Delete"}
        danger
        onConfirm={() => {
          if (!deleting) void handleBulkDelete();
        }}
        onCancel={() => {
          if (!deleting) setDeleteConfirmOpen(false);
        }}
      />
    </section>
  );
}
