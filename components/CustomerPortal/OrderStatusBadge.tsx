import { useEffect, useState } from "react";
import type { PortalOrder } from "@/lib/customerPortal/types";
import { provisioningCountdownCopy } from "@/lib/customerPortal/orderHelpers";
import styles from "@/styles/customerPortal.module.css";

function orderStatusClass(status: PortalOrder["status"]) {
  if (status === "Active Live") return styles.badgeGreen;
  if (status === "Provisioning") return styles.badgeBlue;
  if (status === "Cancelled" || status === "Expired") return styles.badgeRed;
  return styles.badgeAmber;
}

type Props = {
  order: PortalOrder;
};

export default function OrderStatusBadge({ order }: Props) {
  const [now, setNow] = useState(() => Date.now());
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (order.status !== "Provisioning" || !open) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [open, order.status]);

  if (order.status !== "Provisioning") {
    return <span className={orderStatusClass(order.status)}>{order.status}</span>;
  }

  const countdown = provisioningCountdownCopy(order, now);

  return (
    <span
      className={styles.statusTipWrap}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <span className={orderStatusClass(order.status)} tabIndex={0}>
        {order.status}
      </span>
      {open ? (
        <span className={styles.statusTip} role="tooltip">
          <strong>{countdown.headline}</strong>
          <em>{countdown.detail}</em>
        </span>
      ) : null}
    </span>
  );
}
