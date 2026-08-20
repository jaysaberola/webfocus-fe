import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import SortableTableHead from "@/components/CommerceAdmin/SortableTableHead";
import {
  CommerceSelectAllHead,
  CommerceSelectRowCell,
} from "@/components/CommerceAdmin/CommerceSelectCells";
import { useRowSelection } from "@/lib/useRowSelection";
import ClientCrmForm, { type ClientCrmFormHandle } from "@/components/CommerceAdmin/ClientCrmForm";
import ClientDealsPanel from "@/components/CommerceAdmin/ClientDealsPanel";
import ClientSearchResults from "@/components/CommerceAdmin/ClientSearchResults";
import ClientRelatedList, { type ClientRelatedSection } from "@/components/CommerceAdmin/ClientRelatedList";
import { scrollToClientSection } from "@/lib/commerceAdmin/clientScrollHelpers";
import ClientDetailModal from "@/components/CommerceAdmin/modals/ClientDetailModal";
import AssignClientOwnerModal from "@/components/CommerceAdmin/modals/AssignClientOwnerModal";
import ConfirmModal from "@/components/UI/ConfirmModal";
import TableFilterPanel, { TableFilterShell } from "@/components/shared/TableFilterPanel";
import {
  CLIENT_COLUMN_LABELS,
  DEFAULT_CLIENT_COLUMNS,
  clientAllServiceText,
  clientBillingInCharge,
  clientClassification,
  clientDisplayName,
  clientDisplayNameWithOrderCount,
  clientDisplayStatus,
  clientHasExpiringService,
  clientOwnerName,
  clientPlanName,
  clientProductCategory,
  clientServiceName,
  clientDomain,
  clientSubject,
  formatClientCreatedTime,
  sortClients,
  type ClientColumnKey,
  type ClientSortKey,
} from "@/lib/commerceAdmin/clientHelpers";
import { exportClientsToExcel } from "@/lib/commerceAdmin/exportClientsExcel";
import {
  clientSortDirection,
  isClientColumnSorted,
  toggleClientSort,
} from "@/lib/commerceAdmin/tableSortHelpers";
import {
  emptyDateRange,
  rowMatchesDateRange,
  rowMatchesSearch,
  type DateRangeValue,
} from "@/lib/dateRangeHelpers";
import {
  applyTableFilter,
  emptyTableFilter,
  isTableFilterActive,
  type TableFilterFieldDef,
  type TableFilterState,
} from "@/lib/tableFilterHelpers";
import { getCustomers } from "@/services/commerceAdminService";
import { bulkDeleteCustomers, type CustomerRow } from "@/services/customerService";
import type { CommerceAdminTab } from "@/lib/commerceAdmin/types";
import { COMMERCE_ADMIN_PATH } from "@/lib/commerceAdmin/constants";
import { useRouter } from "next/router";
import styles from "@/styles/commerceAdmin.module.css";

const PAGE_SIZE = 10;

const CLIENT_FILTER_FIELDS: TableFilterFieldDef[] = [
  { id: "owner", label: "Client Owner" },
  { id: "billing", label: "Billing-in-Charge" },
  { id: "classification", label: "Client Classification" },
  { id: "client_type", label: "Client Type" },
  { id: "contact_person", label: "Billing Contact Information" },
  { id: "status", label: "Status" },
  { id: "name", label: "Client Name", mode: "contains" },
  { id: "service", label: "Service Name", mode: "contains" },
  { id: "plan", label: "Plan Name", mode: "contains" },
  { id: "subject", label: "Subject", mode: "contains" },
  { id: "productCategory", label: "Product Category", mode: "contains" },
  { id: "domain", label: "Domain", mode: "contains" },
];

type Props = {
  onTabChange?: (tab: CommerceAdminTab) => void;
};

type ClientView = "list" | "create" | "edit";

export default function CommerceClientsTab(_props: Props) {
  const router = useRouter();
  const [rows, setRows] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<ClientSortKey>("newest");
  const [filterOpen, setFilterOpen] = useState(false);
  const [draftFilter, setDraftFilter] = useState<TableFilterState>(emptyTableFilter);
  const [appliedFilter, setAppliedFilter] = useState<TableFilterState>(emptyTableFilter);
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<DateRangeValue>(emptyDateRange);
  const [columnsVisible, setColumnsVisible] = useState(DEFAULT_CLIENT_COLUMNS);
  const [colVisOpen, setColVisOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [view, setView] = useState<ClientView>("list");
  const [editClient, setEditClient] = useState<CustomerRow | null>(null);
  const [detailClient, setDetailClient] = useState<CustomerRow | null>(null);
  const [detailMode, setDetailMode] = useState<"info" | "audit">("info");
  const [assignOwnerClient, setAssignOwnerClient] = useState<CustomerRow | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const colVisRef = useRef<HTMLDivElement>(null);
  const editFormRef = useRef<HTMLElement | null>(null);
  const formRef = useRef<ClientCrmFormHandle>(null);
  const dealsRef = useRef<HTMLElement | null>(null);
  const [activeSection, setActiveSection] = useState<ClientRelatedSection>("info");
  const [relatedListVisible, setRelatedListVisible] = useState(true);
  const [expiringOnly, setExpiringOnly] = useState(false);

  const getFilterValue = useCallback((client: CustomerRow, fieldId: string) => {
    switch (fieldId) {
      case "owner":
        return clientOwnerName(client);
      case "billing":
        return clientBillingInCharge(client);
      case "classification":
        return clientClassification(client);
      case "client_type":
        return String(client.client_type ?? "").trim();
      case "contact_person":
        return String(client.contact_person ?? "").trim();
      case "status":
        return clientDisplayStatus(client);
      case "name":
        return clientDisplayName(client);
      case "service":
        return clientServiceName(client);
      case "plan":
        return clientPlanName(client);
      case "subject":
        return clientSubject(client);
      case "productCategory":
        return clientProductCategory(client);
      case "domain":
        return clientDomain(client);
      default:
        return "";
    }
  }, []);

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
    if (!router.isReady) return;
    if (router.query.queue !== "expiring") return;
    setExpiringOnly(true);
    setView("list");
    void router.replace(
      { pathname: COMMERCE_ADMIN_PATH, query: { tab: "clients" } },
      undefined,
      { shallow: true },
    );
  }, [router.isReady, router.query.queue, router]);

  useEffect(() => {
    setPage(1);
  }, [sortBy, appliedFilter, search, dateRange, expiringOnly]);

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
    const filtered = applyTableFilter(rows, appliedFilter, CLIENT_FILTER_FIELDS, getFilterValue)
      .filter((client) =>
        rowMatchesSearch(
          [
            clientDisplayName(client),
            client.company,
            client.email,
            clientOwnerName(client),
            clientBillingInCharge(client),
            client.contact_person,
            clientClassification(client),
            clientServiceName(client),
            clientPlanName(client),
            clientSubject(client),
            clientProductCategory(client),
            clientDomain(client),
            clientAllServiceText(client),
          ],
          search,
        ),
      )
      .filter((client) => rowMatchesDateRange(client.created_at, dateRange))
      .filter((client) => (expiringOnly ? clientHasExpiringService(client) : true));
    return sortClients(filtered, sortBy);
  }, [rows, appliedFilter, sortBy, getFilterValue, search, dateRange, expiringOnly]);

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
    return rows.filter((row) => ids.has(String(row.id)));
  }, [rows, selection.selectedIds]);

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

  const openCreate = () => {
    setEditClient(null);
    setView("create");
  };

  const openEdit = (client: CustomerRow) => {
    const source = rows.find((row) => row.id === client.id) ?? client;
    setDetailClient(null);
    setEditClient(source);
    setActiveSection("info");
    setRelatedListVisible(true);
    setView("edit");
  };

  const navigateToSection = useCallback((section: ClientRelatedSection) => {
    setActiveSection(section);
    if (section === "orders") {
      scrollToClientSection(dealsRef.current);
      return;
    }
    formRef.current?.goToSection(section);
  }, []);

  const backToList = () => {
    setView("list");
    setEditClient(null);
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

  if (view === "create" || view === "edit") {
    return (
      <div
        className={
          view === "edit"
            ? `${styles.clientEditShell}${relatedListVisible ? "" : ` ${styles.clientEditShellExpanded}`}`
            : undefined
        }
      >
        {view === "edit" && relatedListVisible ? (
          <ClientRelatedList
            activeSection={activeSection}
            onNavigate={navigateToSection}
            onHide={() => setRelatedListVisible(false)}
          />
        ) : null}
        <div className={styles.clientEditLayout}>
          {view === "edit" && !relatedListVisible ? (
            <button
              type="button"
              className={styles.clientRelatedListShowBtn}
              onClick={() => setRelatedListVisible(true)}
            >
              <i className="fa-solid fa-list" aria-hidden="true" />
              Show Related List
            </button>
          ) : null}
          <section className={styles.panel} ref={editFormRef}>
            <ClientCrmForm
              ref={view === "edit" ? formRef : undefined}
              mode={view === "edit" ? "edit" : "create"}
              client={view === "edit" ? editClient : null}
              onBack={backToList}
              onSaved={loadRows}
              onSectionChange={view === "edit" ? setActiveSection : undefined}
            />
          </section>
          {view === "edit" && editClient?.id ? (
            <section
              className={`${styles.panel} ${styles.clientEditScrollTarget}`}
              ref={dealsRef}
              id="client-section-orders"
            >
              <ClientDealsPanel
                client={editClient}
                onEditClient={() => navigateToSection("info")}
              onClientUpdated={(payload) => {
                setEditClient((current) =>
                  current && current.id === payload.id
                    ? {
                        ...current,
                        owner_id: payload.owner_id,
                        owner: payload.owner,
                        owner_name: payload.owner_name,
                      }
                    : current,
                );
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
              }}
            />
          </section>
        ) : null}
        </div>
      </div>
    );
  }

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

      {expiringOnly ? (
        <div className={styles.filterBanner}>
          <span>Showing clients with services expiring within 30 days</span>
          <button type="button" className={styles.secondaryBtnSm} onClick={() => setExpiringOnly(false)}>
            Clear filter
          </button>
        </div>
      ) : null}

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
          <button type="button" className={styles.primaryBtnSm} onClick={openCreate}>
            <i className="fa-solid fa-plus" aria-hidden="true" /> Create Client
          </button>
        </div>
      )}

      <TableFilterShell
        open={filterOpen}
        active={isTableFilterActive(appliedFilter)}
        total={processedRows.length}
        onToggle={() => setFilterOpen((open) => !open)}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search clients..."
        dateRange={dateRange}
        onDateRangeChange={(next) => {
          setDateRange(next);
          setPage(1);
        }}
        panel={
          <TableFilterPanel
            rows={rows}
            fields={CLIENT_FILTER_FIELDS}
            draft={draftFilter}
            applied={appliedFilter}
            getValue={getFilterValue}
            onDraftChange={setDraftFilter}
            onApply={() => {
              setAppliedFilter(draftFilter);
              setPage(1);
            }}
            onClear={() => {
              setDraftFilter(emptyTableFilter);
              setAppliedFilter(emptyTableFilter);
              setPage(1);
            }}
            onClose={() => setFilterOpen(false)}
            sortControl={
              <select
                className={styles.selectInline}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as ClientSortKey)}
                aria-label="Sort clients"
              >
                <option value="name-asc">Client Name (A - Z)</option>
                <option value="name-desc">Client Name (Z - A)</option>
                <option value="owner-asc">Client Owner (A - Z)</option>
                <option value="owner-desc">Client Owner (Z - A)</option>
                <option value="newest">Newest Created</option>
                <option value="oldest">Oldest Created</option>
                <option value="billing-asc">Billing-in-Charge (A - Z)</option>
                <option value="billing-desc">Billing-in-Charge (Z - A)</option>
                <option value="status-asc">Client Status (A - Z)</option>
                <option value="status-desc">Client Status (Z - A)</option>
              </select>
            }
          />
        }
      >
        {loading ? (
          <p className={styles.emptyState}>Loading clients...</p>
        ) : search.trim() ? (
          <ClientSearchResults
            search={search}
            clients={processedRows}
            onOpenClient={openEdit}
          />
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
                    {columnsVisible.status ? renderSortableHead("status") : null}
                    {columnsVisible.service ? renderSortableHead("service") : null}
                    {columnsVisible.plan ? renderSortableHead("plan") : null}
                    {columnsVisible.subject ? renderSortableHead("subject") : null}
                    {columnsVisible.productCategory ? renderSortableHead("productCategory") : null}
                    {columnsVisible.domain ? renderSortableHead("domain") : null}
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
                          key={String(client.id)}
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
                                onClick={() => openEdit(client)}
                              >
                                {clientDisplayNameWithOrderCount(client)}
                              </button>
                            </td>
                          ) : null}
                          {columnsVisible.owner ? (
                            <td>
                              <button
                                type="button"
                                className={styles.tableCellLink}
                                onClick={() => setAssignOwnerClient(client)}
                                title="Assign client owner"
                              >
                                {clientOwnerName(client)}
                              </button>
                            </td>
                          ) : null}
                          {columnsVisible.created ? (
                            <td>{formatClientCreatedTime(client)}</td>
                          ) : null}
                          {columnsVisible.billing ? (
                            <td>{clientBillingInCharge(client)}</td>
                          ) : null}
                          {columnsVisible.status ? (
                            <td>
                              {clientDisplayStatus(client) === "Active" ? (
                                <span className={styles.badgePaid}>{clientDisplayStatus(client)}</span>
                              ) : (
                                <span className={styles.badgeMuted}>{clientDisplayStatus(client)}</span>
                              )}
                            </td>
                          ) : null}
                          {columnsVisible.service ? <td>{clientServiceName(client)}</td> : null}
                          {columnsVisible.plan ? <td>{clientPlanName(client)}</td> : null}
                          {columnsVisible.subject ? <td>{clientSubject(client)}</td> : null}
                          {columnsVisible.productCategory ? <td>{clientProductCategory(client)}</td> : null}
                          {columnsVisible.domain ? <td>{clientDomain(client)}</td> : null}
                          {columnsVisible.classification ? (
                            <td>
                              <span
                                className={
                                  classification === "Existing"
                                    ? styles.badgePaid
                                    : styles.badgePending
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
              <div className={styles.paginationInfo}>
                Showing {processedRows.length === 0 ? "0 to 0" : `${rangeStart} to ${rangeEnd}`}
              </div>
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
      </TableFilterShell>

      <ClientDetailModal
        open={Boolean(detailClient)}
        client={detailClient}
        mode={detailMode}
        onClose={() => setDetailClient(null)}
        onEdit={(client) => openEdit(client)}
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
