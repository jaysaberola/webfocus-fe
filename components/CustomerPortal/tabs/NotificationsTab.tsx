import { PORTAL_NOTIFICATIONS } from "@/lib/customerPortal/mockData";
import styles from "@/styles/customerPortal.module.css";

export default function NotificationsTab() {
  return (
    <div className={styles.tabStack}>
      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <div>
            <h2 className={styles.panelTitle}>System Notifications &amp; Advisories</h2>
            <p className={styles.panelSub}>Real-time alerts regarding scheduled maintenance and billing notices.</p>
          </div>
        </div>

        <div className={styles.notifList}>
          {PORTAL_NOTIFICATIONS.map((item) => (
            <article
              key={item.id}
              className={[styles.notifCard, item.unread ? styles.notifUnread : ""].filter(Boolean).join(" ")}
            >
              <div>
                <div className={styles.notifHead}>
                  <h3>{item.title}</h3>
                  <span className={styles.notifDate}>{item.date}</span>
                </div>
                <p>{item.desc}</p>
              </div>
              {item.unread && <span className={styles.unreadDot} aria-label="Unread" />}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
