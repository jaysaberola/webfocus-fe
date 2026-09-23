import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  const [tipPos, setTipPos] = useState({ top: 0, left: 0, place: "top" as "top" | "bottom" });
  const wrapRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (order.status !== "Provisioning") return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [order.status]);

  useEffect(() => {
    if (!open || !wrapRef.current) return;

    const placeTip = () => {
      const rect = wrapRef.current?.getBoundingClientRect();
      if (!rect) return;
      const place = rect.top > 88 ? "top" : "bottom";
      setTipPos({
        top: place === "top" ? rect.top - 8 : rect.bottom + 8,
        left: rect.left + rect.width / 2,
        place,
      });
    };

    placeTip();
    window.addEventListener("scroll", placeTip, true);
    window.addEventListener("resize", placeTip);
    return () => {
      window.removeEventListener("scroll", placeTip, true);
      window.removeEventListener("resize", placeTip);
    };
  }, [open]);

  if (order.status !== "Provisioning") {
    return <span className={orderStatusClass(order.status)}>{order.status}</span>;
  }

  const countdown = provisioningCountdownCopy(order, now);

  return (
    <span
      ref={wrapRef}
      className={styles.statusTipWrap}
      data-provisioning-status=""
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <span className={orderStatusClass(order.status)} tabIndex={0}>
        {order.status}
      </span>
      <span className={styles.statusCountdown} aria-live="polite">
        {countdown.clock}
      </span>
      {open && typeof document !== "undefined"
        ? createPortal(
            <span
              className={styles.statusTip}
              role="tooltip"
              style={{
                top: tipPos.top,
                left: tipPos.left,
                transform: tipPos.place === "top" ? "translate(-50%, -100%)" : "translate(-50%, 0)",
              }}
            >
              <strong>{countdown.headline}</strong>
              <em>{countdown.detail}</em>
            </span>,
            document.body,
          )
        : null}
    </span>
  );
}
