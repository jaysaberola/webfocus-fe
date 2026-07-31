import { useCallback, useEffect, useState } from "react";
import {
  broadcastCommerceNotification,
  fetchCommerceNotifications,
  type CommerceNotificationAdminRow,
} from "@/services/commerceAdminService";
import { toast } from "@/lib/toast";
import styles from "@/styles/commerceAdmin.module.css";

export default function CommerceNotificationsTab() {
  const [rows, setRows] = useState<CommerceNotificationAdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const loadRows = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCommerceNotifications();
      setRows(Array.isArray(data) ? data : []);
    } catch {
      setRows([]);
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
        ) : rows.length === 0 ? (
          <p className={styles.emptyState}>No broadcast notices sent yet.</p>
        ) : (
          <div className={styles.discountList}>
            {rows.map((row) => (
              <article key={row.id} className={styles.broadcastCard}>
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
