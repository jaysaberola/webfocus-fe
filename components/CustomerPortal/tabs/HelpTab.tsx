import { useCallback, useEffect, useMemo, useState } from "react";
import PortalSortableTableHead from "@/components/CustomerPortal/PortalSortableTableHead";
import TableFilterPanel, { TableFilterShell } from "@/components/shared/TableFilterPanel";
import { createPortalTicket, fetchPortalTickets } from "@/services/customerPortalService";
import type { PortalTicket } from "@/lib/customerPortal/types";
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
import { toast } from "@/lib/toast";
import styles from "@/styles/customerPortal.module.css";

type TicketColumnKey = "id" | "subject" | "date" | "status";
type TicketSortKey =
  | "id-asc"
  | "id-desc"
  | "subject-asc"
  | "subject-desc"
  | "date-asc"
  | "date-desc"
  | "status-asc"
  | "status-desc";

const TICKET_FILTER_FIELDS: TableFilterFieldDef[] = [
  { id: "status", label: "Status" },
  { id: "subject", label: "Subject", mode: "contains" },
  { id: "id", label: "Ticket", mode: "contains" },
];

const TICKET_SORT_ASC: Record<TicketColumnKey, TicketSortKey> = {
  id: "id-asc",
  subject: "subject-asc",
  date: "date-asc",
  status: "status-asc",
};

const TICKET_SORT_DESC: Record<TicketColumnKey, TicketSortKey> = {
  id: "id-desc",
  subject: "subject-desc",
  date: "date-desc",
  status: "status-desc",
};

function sortPortalTickets(rows: PortalTicket[], sortBy: TicketSortKey) {
  const copy = [...rows];
  copy.sort((a, b) => {
    const compareText = (left: string, right: string, desc: boolean) => {
      const result = left.localeCompare(right);
      return desc ? -result : result;
    };

    if (sortBy.startsWith("id")) return compareText(a.id, b.id, sortBy === "id-desc");
    if (sortBy.startsWith("subject")) {
      return compareText(a.subject, b.subject, sortBy === "subject-desc");
    }
    if (sortBy.startsWith("date")) return compareText(a.date, b.date, sortBy === "date-desc");
    if (sortBy.startsWith("status")) return compareText(a.status, b.status, sortBy === "status-desc");
    return 0;
  });
  return copy;
}

function toggleTicketSort(current: TicketSortKey, column: TicketColumnKey): TicketSortKey {
  const asc = TICKET_SORT_ASC[column];
  const desc = TICKET_SORT_DESC[column];
  return current === asc ? desc : asc;
}

function ticketSortDirection(sortBy: TicketSortKey, column: TicketColumnKey): "asc" | "desc" | null {
  if (sortBy === TICKET_SORT_ASC[column]) return "asc";
  if (sortBy === TICKET_SORT_DESC[column]) return "desc";
  return null;
}

export default function HelpTab() {
  const [chatInput, setChatInput] = useState("");
  const [tickets, setTickets] = useState<PortalTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sortBy, setSortBy] = useState<TicketSortKey>("date-desc");
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<DateRangeValue>(emptyDateRange);
  const [filterOpen, setFilterOpen] = useState(false);
  const [draftFilter, setDraftFilter] = useState<TableFilterState>(emptyTableFilter);
  const [appliedFilter, setAppliedFilter] = useState<TableFilterState>(emptyTableFilter);
  const [messages, setMessages] = useState([
    "Mabuhay! Welcome to WebFocus NOC Support. How may we assist your Manila server deployment today?",
  ]);

  useEffect(() => {
    fetchPortalTickets()
      .then(setTickets)
      .finally(() => setLoading(false));
  }, []);

  const getTicketFilterValue = useCallback((ticket: PortalTicket, fieldId: string) => {
    switch (fieldId) {
      case "status":
        return ticket.status;
      case "subject":
        return ticket.subject;
      case "id":
        return ticket.id;
      default:
        return "";
    }
  }, []);

  const filteredTickets = useMemo(() => {
    let rows = tickets.filter((ticket) => {
      if (!rowMatchesDateRange(ticket.date, dateRange)) return false;
      return rowMatchesSearch([ticket.id, ticket.subject, ticket.status], search);
    });
    rows = applyTableFilter(rows, appliedFilter, TICKET_FILTER_FIELDS, getTicketFilterValue);
    return sortPortalTickets(rows, sortBy);
  }, [tickets, search, dateRange, appliedFilter, sortBy, getTicketFilterValue]);

  const applyFilter = () => {
    setAppliedFilter(draftFilter);
  };

  const clearFilter = () => {
    setDraftFilter(emptyTableFilter);
    setAppliedFilter(emptyTableFilter);
  };

  const sendMessage = () => {
    const text = chatInput.trim();
    if (!text) return;
    setMessages((prev) => [...prev, `You: ${text}`, "Thank you. A NOC engineer will follow up shortly."]);
    setChatInput("");
    toast.info("Message sent to NOC support.");
  };

  const submitTicket = async () => {
    const subject = ticketSubject.trim();
    if (!subject) {
      toast.error("Please enter a ticket subject.");
      return;
    }

    setSubmitting(true);
    try {
      const ticket = await createPortalTicket({
        subject,
        message: ticketMessage.trim() || undefined,
      });
      setTickets((prev) => [ticket, ...prev]);
      setTicketSubject("");
      setTicketMessage("");
      setShowTicketForm(false);
      toast.success("Support ticket created.");
    } catch {
      toast.error("Could not create ticket. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.tabStack}>
      <div className={styles.helpGrid}>
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <h2 className={styles.panelTitle}>Support Tickets &amp; NOC Helpdesk</h2>
              <p className={styles.panelSub}>Direct line to our systems engineers in Ortigas Center, Pasig.</p>
            </div>
            <button type="button" className={styles.primaryBtnSm} onClick={() => setShowTicketForm((v) => !v)}>
              New Ticket
            </button>
          </div>

          {showTicketForm ? (
            <div className={styles.ticketForm}>
              <input
                type="text"
                value={ticketSubject}
                placeholder="Ticket subject"
                onChange={(e) => setTicketSubject(e.target.value)}
              />
              <textarea
                value={ticketMessage}
                placeholder="Describe your issue..."
                onChange={(e) => setTicketMessage(e.target.value)}
              />
              <div className={styles.ticketFormActions}>
                <button type="button" className={styles.secondaryBtnSm} onClick={() => setShowTicketForm(false)}>
                  Cancel
                </button>
                <button type="button" className={styles.primaryBtnSm} disabled={submitting} onClick={submitTicket}>
                  {submitting ? "Submitting..." : "Submit Ticket"}
                </button>
              </div>
            </div>
          ) : null}

          {!showTicketForm && loading ? (
            <p className={styles.panelSub}>Loading tickets...</p>
          ) : null}

          {!showTicketForm && !loading ? (
            <TableFilterShell
              open={filterOpen}
              active={isTableFilterActive(appliedFilter)}
              total={filteredTickets.length}
              onToggle={() => setFilterOpen((o) => !o)}
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search tickets..."
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              sortControl={
                <select
                  className={styles.portalToolbarControl}
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as TicketSortKey)}
                  aria-label="Sort tickets"
                >
                  <option value="date-desc">Date (Newest)</option>
                  <option value="date-asc">Date (Oldest)</option>
                  <option value="status-asc">Status (A-Z)</option>
                  <option value="subject-asc">Subject (A-Z)</option>
                  <option value="id-asc">Ticket ID (A-Z)</option>
                </select>
              }
              panel={
                <TableFilterPanel
                  rows={tickets}
                  fields={TICKET_FILTER_FIELDS}
                  draft={draftFilter}
                  applied={appliedFilter}
                  getValue={getTicketFilterValue}
                  onDraftChange={setDraftFilter}
                  onApply={applyFilter}
                  onClear={clearFilter}
                  onClose={() => setFilterOpen(false)}
                />
              }
            >
              <div className={styles.tableWrap}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <PortalSortableTableHead
                        label="Ticket"
                        active={ticketSortDirection(sortBy, "id") !== null}
                        direction={ticketSortDirection(sortBy, "id") ?? "asc"}
                        onClick={() => setSortBy((current) => toggleTicketSort(current, "id"))}
                      />
                      <PortalSortableTableHead
                        label="Subject"
                        active={ticketSortDirection(sortBy, "subject") !== null}
                        direction={ticketSortDirection(sortBy, "subject") ?? "asc"}
                        onClick={() => setSortBy((current) => toggleTicketSort(current, "subject"))}
                      />
                      <PortalSortableTableHead
                        label="Date"
                        active={ticketSortDirection(sortBy, "date") !== null}
                        direction={ticketSortDirection(sortBy, "date") ?? "asc"}
                        onClick={() => setSortBy((current) => toggleTicketSort(current, "date"))}
                      />
                      <PortalSortableTableHead
                        label="Status"
                        active={ticketSortDirection(sortBy, "status") !== null}
                        direction={ticketSortDirection(sortBy, "status") ?? "asc"}
                        onClick={() => setSortBy((current) => toggleTicketSort(current, "status"))}
                      />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTickets.length === 0 ? (
                      <tr>
                        <td colSpan={4}>No support tickets yet.</td>
                      </tr>
                    ) : (
                      filteredTickets.map((ticket) => (
                        <tr key={ticket.id}>
                          <td className={styles.monoBlue}>{ticket.id}</td>
                          <td className={styles.serviceNameBold}>{ticket.subject}</td>
                          <td>{ticket.date}</td>
                          <td>
                            <span className={ticket.status === "Resolved" ? styles.badgeGreen : styles.badgeBlue}>
                              {ticket.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </TableFilterShell>
          ) : null}
        </section>

        <section className={styles.chatPanel}>
          <div className={styles.chatHead}>
            <div className={styles.chatLive}>
              <span className={styles.liveDot} aria-hidden="true" />
              NOC Live Support Chat
            </div>
            <span className={styles.chatAgent}>Agent: Engr. Marco</span>
          </div>
          <div className={styles.chatMessages}>
            {messages.map((msg, index) => (
              <div
                key={`${index}-${msg.slice(0, 12)}`}
                className={msg.startsWith("You:") ? styles.chatBubbleUser : styles.chatBubbleAgent}
              >
                {msg}
              </div>
            ))}
          </div>
          <div className={styles.chatInputRow}>
            <input
              type="text"
              value={chatInput}
              placeholder="Type your query to NOC engineer..."
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button type="button" className={styles.chatSendBtn} onClick={sendMessage}>
              Send
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
