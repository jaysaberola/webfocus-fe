import type { PortalOrder } from "@/lib/customerPortal/types";
import { orderRenewalInfo } from "@/lib/customerPortal/orderHelpers";
import styles from "@/styles/customerPortal.module.css";

type Props = {
  order: PortalOrder;
};

export default function OrderRenewalCell({ order }: Props) {
  const renewal = orderRenewalInfo(order);

  if (!renewal.showRenewal) {
    return (
      <div className={styles.orderRenewCell}>
        <span className={styles.orderRenewMuted}>—</span>
        <span className={styles.orderRenewCountdownMuted}>{renewal.countdownLabel}</span>
      </div>
    );
  }

  const toneClass =
    renewal.tone === "expired"
      ? styles.orderRenewCountdownExpired
      : renewal.tone === "urgent"
        ? styles.orderRenewCountdownUrgent
        : renewal.tone === "soon"
          ? styles.orderRenewCountdownSoon
          : styles.orderRenewCountdownOk;

  return (
    <div className={styles.orderRenewCell}>
      <strong className={styles.orderRenewDate}>{renewal.endDate}</strong>
      <span className={`${styles.orderRenewCountdown} ${toneClass}`}>{renewal.countdownLabel}</span>
    </div>
  );
}
