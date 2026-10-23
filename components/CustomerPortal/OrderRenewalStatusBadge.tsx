import type { PortalOrder } from "@/lib/customerPortal/types";
import { orderDisplayStatus, orderRenewalInfo } from "@/lib/customerPortal/orderHelpers";
import OrderStatusBadge from "@/components/CustomerPortal/OrderStatusBadge";
import styles from "@/styles/customerPortal.module.css";

type Props = {
  order: PortalOrder;
};

export default function OrderRenewalStatusBadge({ order }: Props) {
  const renewal = orderRenewalInfo(order);
  const displayOrder = { ...order, status: orderDisplayStatus(order) };

  return (
    <span className={styles.orderStatusStack}>
      <OrderStatusBadge order={displayOrder} />
      {renewal.showRenewal && renewal.tone === "urgent" && displayOrder.status !== "Expired" ? (
        <span className={`${styles.orderRenewStatusBadge} ${styles.orderRenewStatusBadgeSoon}`}>
          Expiring soon
        </span>
      ) : null}
    </span>
  );
}
