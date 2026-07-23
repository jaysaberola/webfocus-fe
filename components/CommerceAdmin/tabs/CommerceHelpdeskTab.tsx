import { useEffect, useState } from "react";
import {
  fetchCommerceTickets,
  updateCommerceTicket,
  type CommerceTicketAdminRow,
} from "@/services/commerceAdminService";
import { toast } from "@/lib/toast";
import styles from "@/styles/commerceAdmin.module.css";

const STATUS_OPTIONS = ["Open", "In Progress", "Resolved", "Closed"];

export default function CommerceHelpdeskTab() {
  const [rows, setRows] = useState<CommerceTicketAdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

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

      {loading ? (
        <p className={styles.emptyState}>Loading tickets...</p>
      ) : rows.length === 0 ? (
        <p className={styles.emptyState}>No support tickets yet.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Subject</th>
                <th>Client</th>
                <th>Updated</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((ticket) => (
                <tr key={ticket.id}>
                  <td className={styles.monoCell}>{ticket.ticketNo}</td>
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
      )}
    </section>
  );
}
