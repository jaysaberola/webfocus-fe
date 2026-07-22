import { useEffect, useState } from "react";
import { createPortalTicket, fetchPortalTickets } from "@/services/customerPortalService";
import type { PortalTicket } from "@/lib/customerPortal/types";
import { toast } from "@/lib/toast";
import styles from "@/styles/customerPortal.module.css";

export default function HelpTab() {
  const [chatInput, setChatInput] = useState("");
  const [tickets, setTickets] = useState<PortalTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [messages, setMessages] = useState([
    "Mabuhay! Welcome to WebFocus NOC Support. How may we assist your Manila server deployment today?",
  ]);

  useEffect(() => {
    fetchPortalTickets()
      .then(setTickets)
      .finally(() => setLoading(false));
  }, []);

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
                placeholder="Describe your issue (optional)"
                onChange={(e) => setTicketMessage(e.target.value)}
                rows={3}
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

          {loading ? (
            <p className={styles.panelSub}>Loading tickets...</p>
          ) : (
            <div className={styles.ticketList}>
              {tickets.length === 0 ? (
                <p className={styles.panelSub}>No support tickets yet.</p>
              ) : (
                tickets.map((ticket) => (
                  <article key={ticket.id} className={styles.ticketCard}>
                    <div>
                      <div className={styles.ticketMeta}>
                        <span className={styles.monoBlue}>{ticket.id}</span>
                        <span className={ticket.status === "Resolved" ? styles.badgeGreen : styles.badgeBlue}>
                          {ticket.status}
                        </span>
                      </div>
                      <h3>{ticket.subject}</h3>
                    </div>
                    <span className={styles.ticketDate}>{ticket.date}</span>
                  </article>
                ))
              )}
            </div>
          )}
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
            <button type="button" onClick={sendMessage}>
              Send
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
