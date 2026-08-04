import { useCallback, useEffect, useState } from "react";
import {
  broadcastCommerceNotification,
  fetchCommerceNotifications,
  type CommerceNotificationAdminRow,
} from "@/services/commerceAdminService";
import { toast } from "@/lib/toast";
import styles from "@/styles/commerceAdmin.module.css";

type Props = {
  onOpenTransactions?: () => void;
};

export default function CommerceNotificationsTab({ onOpenTransactions }: Props) {
  const [clientAlerts, setClientAlerts] = useState<CommerceNotificationAdminRow[]>([]);
  const [broadcasts, setBroadcasts] = useState<CommerceNotificationAdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const loadRows = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCommerceNotifications();
      setClientAlerts(Array.isArray(data.clientAlerts) ? data.clientAlerts : []);
      setBroadcasts(Array.isArray(data.broadcasts) ? data.broadcasts : []);
    } catch {
      setClientAlerts([]);
      setBroadcasts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const handleBroadcast = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();
    if (!trimmedTitle || !trimmedBody) {
      toast.error("Please enter title and description for broadcast.");
      return;
    }

    setSubmitting(true);
    try {
      await broadcastCommerceNotification({ title: trimmedTitle, body: trimmedBody });
      toast.success("Broadcast notice successfully sent to all client portals!");
      setTitle("");
      setBody("");
      loadRows();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to send broadcast notice.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <h3 className={styles.panelTitle}>Client Quotation Alerts</h3>
          <p className={styles.panelSubtitle}>
            Web design Pending Quotation checkouts from client portals appear here for Sales
            pricing.
          </p>
        </div>
      </div>

      <div className={styles.broadcastHistory} style={{ borderTop: "none", paddingTop: 0 }}>
        {loading ? (
          <p className={styles.emptyState}>Loading client quotation alerts...</p>
        ) : clientAlerts.length === 0 ? (
          <p className={styles.emptyState}>No pending web design quotation checkouts.</p>
        ) : (
          <div className={styles.discountList}>
            {clientAlerts.map((row) => (
              <article key={`alert-${row.id}`} className={styles.broadcastCard}>
                <div>
                  <h5>{row.title}</h5>
                  <p className={styles.panelSubtitle}>{row.desc}</p>
                  {(row.email || row.transactionNo) && (
                    <p className={styles.panelSubtitle} style={{ marginTop: "0.35rem" }}>
                      {[row.email, row.transactionNo].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
                <div className={styles.broadcastCardMeta}>
                  <span className={styles.badgePending}>{row.status}</span>
                  <span className={styles.monoCell}>{row.date}</span>
                  {onOpenTransactions ? (
                    <button
                      type="button"
                      className={styles.primaryBtnSm}
                      onClick={onOpenTransactions}
                    >
                      Open Transactions
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <div className={styles.panelHeader} style={{ marginTop: "1.75rem" }}>
        <div>
          <h3 className={styles.panelTitle}>Broadcast System Notifications</h3>
          <p className={styles.panelSubtitle}>
            Send global maintenance alerts or notices to all client portals.
          </p>
        </div>
      </div>

      <form className={styles.broadcastForm} onSubmit={handleBroadcast}>
        <label className={styles.modalLabel}>
          Notice Title
          <input
            className={styles.modalInput}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Scheduled Core Datacenter Upgrade"
          />
        </label>
        <label className={styles.modalLabel}>
          Notice Description
          <textarea
            className={styles.modalTextarea}
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Provide details of the system update or broadcast message..."
          />
        </label>
        <div className={styles.modalActions}>
          <button type="submit" className={styles.primaryBtnSm} disabled={submitting}>
            {submitting ? "Sending..." : "Broadcast Notice"}
          </button>
        </div>
      </form>

      <div className={styles.broadcastHistory}>
        <h4 className={styles.broadcastHistoryTitle}>Broadcast History</h4>
        {loading ? (
          <p className={styles.emptyState}>Loading notification history...</p>
        ) : broadcasts.length === 0 ? (
          <p className={styles.emptyState}>No broadcast notices sent yet.</p>
        ) : (
          <div className={styles.discountList}>
            {broadcasts.map((row) => (
              <article key={`broadcast-${row.id}`} className={styles.broadcastCard}>
                <div>
                  <h5>{row.title}</h5>
                  <p className={styles.panelSubtitle}>{row.desc}</p>
                </div>
                <div className={styles.broadcastCardMeta}>
                  <span className={styles.badgePaid}>{row.status}</span>
                  <span className={styles.monoCell}>{row.date}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
