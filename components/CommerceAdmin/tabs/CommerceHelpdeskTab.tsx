import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchCommerceTickets,
  updateCommerceTicket,
  type CommerceTicketAdminRow,
} from "@/services/commerceAdminService";
import CommerceBulkSelectionBar from "@/components/CommerceAdmin/CommerceBulkSelectionBar";
import {
  CommerceSelectAllHead,
  CommerceSelectRowCell,
} from "@/components/CommerceAdmin/CommerceSelectCells";
import { useRowSelection } from "@/lib/useRowSelection";
import { exportRowsToExcel } from "@/lib/commerceAdmin/exportTableExcel";
import { toast } from "@/lib/toast";
import styles from "@/styles/commerceAdmin.module.css";

const STATUS_OPTIONS = ["Open", "In Progress", "Resolved", "Closed"];
const PAGE_SIZE = 10;

export default function CommerceHelpdeskTab() {
  const [rows, setRows] = useState<CommerceTicketAdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);

  const filteredRows = useMemo(() => {
    if (statusFilter === "all") return rows;
    return rows.filter((ticket) => ticket.status === statusFilter);
  }, [rows, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredRows.slice(start, start + PAGE_SIZE);
  }, [filteredRows, page]);

  const getTicketRowId = useCallback((ticket: CommerceTicketAdminRow) => String(ticket.id), []);
  const selection = useRowSelection(paginatedRows, getTicketRowId);
  const hasSelection = selection.selectedCount > 0;

  const selectedRows = useMemo(() => {
    const ids = new Set(selection.selectedIds);
    return filteredRows.filter((ticket) => ids.has(String(ticket.id)));
  }, [filteredRows, selection.selectedIds]);

  const rangeStart = filteredRows.length ? (page - 1) * PAGE_SIZE + 1 : 0;
  const rangeEnd = Math.min(page * PAGE_SIZE, filteredRows.length);

  const load = () => {
    setLoading(true);
    fetchCommerceTickets()
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const handleStatusChange = async (ticket: CommerceTicketAdminRow, status: string) => {
    if (status === ticket.status) return;

    try {
      setBusyId(ticket.id);
      await updateCommerceTicket(ticket.id, status);
      toast.success(`Ticket ${ticket.ticketNo} updated to ${status}.`);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update ticket.");
    } finally {
      setBusyId(null);
    }
  };

  const handleExportSelected = () => {
    if (selectedRows.length === 0 || exporting) return;
    setExporting(true);
    try {
      exportRowsToExcel(
        ["Ticket", "Subject", "Message", "Client", "Email", "Updated", "Status"],
        selectedRows.map((ticket) => [
          ticket.ticketNo,
          ticket.subject,
          ticket.message ?? "",
          ticket.client,
          ticket.email ?? "",
          ticket.updatedAt,
          ticket.status,
        ]),
        "helpdesk-tickets",
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <h3 className={styles.panelTitle}>Helpdesk Tickets</h3>
          <p className={styles.panelSubtitle}>
            Support requests submitted from the customer portal Help tab.
          </p>
        </div>
      </div>

      {hasSelection ? (
        <CommerceBulkSelectionBar
          selectedCount={selection.selectedCount}
          entityLabel="ticket"
          exporting={exporting}
          onExport={handleExportSelected}
          onClear={selection.clearSelection}
          showDelete={false}
        />
      ) : (
        <div className={styles.toolbarRow}>
          <div className={styles.toolbarFilters}>
            <select
              className={styles.selectInline}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Filter: All Statuses</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {loading ? (
        <p className={styles.emptyState}>Loading tickets...</p>
      ) : filteredRows.length === 0 ? (
        <p className={styles.emptyState}>No support tickets yet.</p>
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
                  <th>Ticket</th>
                  <th>Subject</th>
                  <th>Client</th>
                  <th>Updated</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRows.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className={selection.isSelected(ticket) ? styles.rowSelected : undefined}
                  >
                    <CommerceSelectRowCell
                      checked={selection.isSelected(ticket)}
                      onChange={() => selection.toggleRow(ticket)}
                      label={`Select ticket ${ticket.ticketNo}`}
                    />
                    <td className={styles.monoCell}>
                      <button type="button" className={styles.tableCellLink}>
                        {ticket.ticketNo}
                      </button>
                    </td>
                    <td>
                      <strong>{ticket.subject}</strong>
                      {ticket.message ? <div className={styles.panelSubtitle}>{ticket.message}</div> : null}
                    </td>
                    <td>
                      {ticket.client}
                      {ticket.email ? <div className={styles.panelSubtitle}>{ticket.email}</div> : null}
                    </td>
                    <td>{ticket.updatedAt}</td>
                    <td>
                      <select
                        className={styles.selectInline}
                        value={ticket.status}
                        disabled={busyId === ticket.id}
                        onChange={(e) => handleStatusChange(ticket, e.target.value)}
                        aria-label={`Status for ${ticket.ticketNo}`}
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.paginationBar}>
            <div className={styles.paginationInfo}>Total Records {filteredRows.length}</div>
            <div className={styles.paginationControls}>
              <button
                type="button"
                className={styles.secondaryBtnSm}
                disabled={page <= 1 || filteredRows.length === 0}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                aria-label="Previous page"
              >
                <i className="fa-solid fa-chevron-left" aria-hidden="true" />
              </button>
              <span className={styles.paginationRange}>
                {filteredRows.length === 0 ? "0 to 0" : `${rangeStart} to ${rangeEnd}`}
              </span>
              <button
                type="button"
                className={styles.secondaryBtnSm}
                disabled={page >= totalPages || filteredRows.length === 0}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                aria-label="Next page"
              >
                <i className="fa-solid fa-chevron-right" aria-hidden="true" />
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
