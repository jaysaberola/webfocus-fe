import { useState } from "react";
import { PORTAL_TICKETS } from "@/lib/customerPortal/mockData";
import { toast } from "@/lib/toast";
import styles from "@/styles/customerPortal.module.css";

export default function HelpTab() {
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([
    "Mabuhay! Welcome to WebFocus NOC Support. How may we assist your Manila server deployment today?",
  ]);

  const sendMessage = () => {
    const text = chatInput.trim();
    if (!text) return;
    setMessages((prev) => [...prev, `You: ${text}`, "Thank you. A NOC engineer will follow up shortly."]);
    setChatInput("");
    toast.info("Message sent to NOC support.");
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
            <button type="button" className={styles.primaryBtnSm}>
              New Ticket
            </button>
          </div>
          <div className={styles.ticketList}>
            {PORTAL_TICKETS.map((ticket) => (
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
            ))}
          </div>
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
