import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import SortableTableHead from "@/components/CommerceAdmin/SortableTableHead";
import CreateClientModal from "@/components/CommerceAdmin/modals/CreateClientModal";
import EditClientModal from "@/components/CommerceAdmin/modals/EditClientModal";
import ClientServicesModal from "@/components/CommerceAdmin/modals/ClientServicesModal";
import ClientDetailModal from "@/components/CommerceAdmin/modals/ClientDetailModal";
import {
  CLIENT_COLUMN_LABELS,
  DEFAULT_CLIENT_COLUMNS,
  clientActiveServicesCount,
  clientDisplayStatus,
  filterClients,
  sortClients,
  type ClientColumnKey,
  type ClientFilterKey,
  type ClientSortKey,
} from "@/lib/commerceAdmin/clientHelpers";
import {
  clientSortDirection,
  isClientColumnSorted,
  toggleClientSort,
} from "@/lib/commerceAdmin/tableSortHelpers";
import { getCustomers } from "@/services/commerceAdminService";
import type { CustomerRow } from "@/services/customerService";
import type { CommerceAdminTab } from "@/lib/commerceAdmin/types";
import { COMMERCE_ADMIN_PATH } from "@/lib/commerceAdmin/constants";
import styles from "@/styles/commerceAdmin.module.css";

const PAGE_SIZE = 10;
const TX_CLIENT_FILTER_KEY = "commerceAdmin:txClientFilter";

type Props = {
  onTabChange?: (tab: CommerceAdminTab) => void;
};

export default function CommerceClientsTab({ onTabChange }: Props) {
  const router = useRouter();
  const [rows, setRows] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<ClientSortKey>("name-asc");
  const [filterStatus, setFilterStatus] = useState<ClientFilterKey>("all");
  const [columnsVisible, setColumnsVisible] = useState(DEFAULT_CLIENT_COLUMNS);
  const [colVisOpen, setColVisOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editClient, setEditClient] = useState<CustomerRow | null>(null);
  const [servicesClient, setServicesClient] = useState<CustomerRow | null>(null);
  const [detailClient, setDetailClient] = useState<CustomerRow | null>(null);
  const [detailMode, setDetailMode] = useState<"info" | "audit">("info");
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

  const handleAction = (client: CustomerRow, action: string) => {
    if (action === "info") {
      setDetailClient(client);
      setDetailMode("info");
      return;
    }
    if (action === "purchases") {
      sessionStorage.setItem(
        TX_CLIENT_FILTER_KEY,
        JSON.stringify({
          id: client.id,
          name: client.name,
          email: client.email,
        }),
      );
      if (onTabChange) {
        onTabChange("transactions");
      } else {
        router.push(`${COMMERCE_ADMIN_PATH}?tab=transactions`);
      }
      return;
    }
    if (action === "edit") {
      setEditClient(client);
      return;
    }
    if (action === "audit") {
      setDetailClient(client);
      setDetailMode("audit");
    }
  };

  const renderActionSelect = (client: CustomerRow) => (
    <select
      className={styles.actionSelect}
      defaultValue=""
      onChange={(e) => {
        const value = e.target.value;
        e.target.value = "";
        if (value) handleAction(client, value);
      }}
    >
      <option value="" disabled>
        Actions...
      </option>
      <option value="info">View Client Account/Info</option>
      <option value="purchases">View Purchases Service</option>
      <option value="edit">Edit Customer Account</option>
      <option value="audit">View Audit Trail</option>
    </select>
  );

  const renderStatusBadge = (client: CustomerRow) => {
    const status = clientDisplayStatus(client);
    const active = status === "Active";
    return <span className={active ? styles.badgePaid : styles.badgePending}>{status}</span>;
  };

  const visibleColumnCount = Object.values(columnsVisible).filter(Boolean).length + 1;

  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <h3 className={styles.panelTitle}>Client Directory &amp; Organizations</h3>
          <p className={styles.panelSubtitle}>
            Manage registered corporate accounts, domain registrations, and assigned nodes.
          </p>
        </div>
      </div>

      <div className={styles.toolbarRow}>
        <div className={styles.toolbarFilters}>
          <select
            className={styles.selectInline}
            value={sortBy === "name-asc" || sortBy === "name-desc" || sortBy === "newest" ? sortBy : "name-asc"}
            onChange={(e) => setSortBy(e.target.value as ClientSortKey)}
          >
            <option value="name-asc">Sort: Name (A - Z)</option>
            <option value="name-desc">Sort: Name (Z - A)</option>
            <option value="newest">Sort: Newest Joined</option>
          </select>
          <select
            className={styles.selectInline}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as ClientFilterKey)}
          >
            <option value="all">Filter: All Statuses</option>
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
          <i className="fa-solid fa-plus" aria-hidden="true" /> Add Client
        </button>
      </div>

      {loading ? (
        <p className={styles.emptyState}>Loading clients...</p>
      ) : (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  {columnsVisible.id ? renderSortableHead("id") : null}
                  {columnsVisible.name ? renderSortableHead("name") : null}
                  {columnsVisible.email ? renderSortableHead("email") : null}
                  {columnsVisible.service ? renderSortableHead("service") : null}
                  {columnsVisible.status ? renderSortableHead("status") : null}
                  <th className={styles.tableActionsHead}>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount}>No clients found.</td>
                  </tr>
                ) : (
                  paginatedRows.map((client) => {
                    const serviceCount = clientActiveServicesCount(client);
                    return (
                      <tr key={client.id}>
                        {columnsVisible.id ? (
                          <td className={styles.monoCell}>CL-{client.id}</td>
                        ) : null}
                        {columnsVisible.name ? (
                          <td>
                            <strong>{client.name}</strong>
                          </td>
                        ) : null}
                        {columnsVisible.email ? <td>{client.email}</td> : null}
                        {columnsVisible.service ? (
                          <td>
                            <button
                              type="button"
                              className={styles.clientServiceBadge}
                              onClick={() => setServicesClient(client)}
                            >
                              <i className="fa-solid fa-layer-group" aria-hidden="true" /> {serviceCount} Active
                              Service{serviceCount === 1 ? "" : "s"}
                            </button>
                          </td>
                        ) : null}
                        {columnsVisible.status ? (
                          <td className={styles.statusCell}>{renderStatusBadge(client)}</td>
                        ) : null}
                        <td className={styles.tableActionsCell}>{renderActionSelect(client)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {processedRows.length > PAGE_SIZE ? (
            <div className={styles.paginationBar}>
              <span>
                Showing {rangeStart}–{rangeEnd} of {processedRows.length} clients
              </span>
              <div className={styles.paginationControls}>
                <button
                  type="button"
                  className={styles.secondaryBtnSm}
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <span>
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  className={styles.secondaryBtnSm}
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </>
      )}

      <CreateClientModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={loadRows} />
      <EditClientModal
        open={Boolean(editClient)}
        client={editClient}
        onClose={() => setEditClient(null)}
        onUpdated={loadRows}
      />
      <ClientServicesModal
        open={Boolean(servicesClient)}
        client={servicesClient}
        onClose={() => setServicesClient(null)}
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
    </section>
  );
}
