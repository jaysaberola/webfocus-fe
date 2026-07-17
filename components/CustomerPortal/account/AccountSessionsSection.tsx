import { useState } from "react";
import { PORTAL_ACTIVE_SESSIONS } from "@/lib/customerPortal/mockAccountData";
import type { PortalActiveSession } from "@/lib/customerPortal/types";
import { toast } from "@/lib/toast";
import styles from "@/styles/customerPortal.module.css";

export default function AccountSessionsSection() {
  const [sessions, setSessions] = useState<PortalActiveSession[]>(PORTAL_ACTIVE_SESSIONS);

  const revokeSession = (session: PortalActiveSession) => {
    if (session.current) {
      toast.info("You cannot revoke your current session. Sign out instead.");
      return;
    }
    setSessions((prev) => prev.filter((item) => item.id !== session.id));
    toast.success(`${session.device} session revoked.`);
  };

  const revokeOthers = () => {
    setSessions((prev) => prev.filter((item) => item.current));
    toast.success("All other active sessions were revoked.");
  };

  return (
    <section className={`${styles.panel} ${styles.accountSection}`}>
      <div className={styles.accountSectionHead}>
        <div>
          <h2 className={styles.panelTitle}>Active Sessions</h2>
          <p className={styles.panelSub}>Review devices currently signed in to your account.</p>
        </div>
        {sessions.some((item) => !item.current) && (
          <button type="button" className={styles.secondaryBtnSm} onClick={revokeOthers}>
            Revoke Other Sessions
          </button>
        )}
      </div>

      <div className={styles.sessionList}>
        {sessions.map((session) => (
          <article key={session.id} className={styles.sessionCard}>
            <div className={styles.sessionMain}>
              <div className={styles.sessionTop}>
                <strong>{session.device}</strong>
                {session.current ? (
                  <span className={styles.badgeGreen}>Current Session</span>
                ) : (
                  <span className={styles.badgeBlue}>Active</span>
                )}
              </div>
              <p>{session.location}</p>
              <p className={styles.sessionMeta}>
                IP {session.ip} · {session.lastActive}
              </p>
            </div>
            {!session.current && (
              <button
                type="button"
                className={styles.sessionRevokeBtn}
                onClick={() => revokeSession(session)}
              >
                Revoke
              </button>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
