import { formatPeso } from "@/lib/customerPortal/mockData";
import {
  orderCanCancel,
  orderCanCheckout,
  orderDueDate,
  orderPaymentDate,
  orderPaymentMethodLabel,
  orderPlanLabel,
  orderServiceName,
} from "@/lib/customerPortal/orderHelpers";
import type { PortalOrder } from "@/lib/customerPortal/types";
import styles from "@/styles/customerPortal.module.css";

function orderStatusClass(status: PortalOrder["status"]) {
  if (status === "Active Live") return styles.badgeGreen;
  if (status === "Provisioning") return styles.badgeBlue;
  if (status === "Cancelled" || status === "Expired") return styles.badgeRed;
  return styles.badgeAmber;
}

function ReadField({ label, value }: { label: string; value: string }) {
  return (
    <label className={styles.orderInfoField}>
      <span className={styles.orderInfoLabel}>{label}</span>
      <input className={styles.orderInfoInput} value={value} readOnly />
    </label>
  );
}

type OrderInfoPanelProps = {
  order: PortalOrder;
  onBack: () => void;
  onCheckout?: () => void;
  onCancel?: () => void;
  cancelling?: boolean;
};

export default function OrderInfoPanel({
  order,
  onBack,
  onCheckout,
  onCancel,
  cancelling = false,
}: OrderInfoPanelProps) {
  const serviceName = orderServiceName(order);
  const plan = orderPlanLabel(order);
  const canCheckout = orderCanCheckout(order) && Boolean(onCheckout);
  const canCancel = orderCanCancel(order) && Boolean(onCancel);

  return (
    <section className={`${styles.panel} ${styles.orderInfoPage}`}>
      <div className={styles.orderInfoTopBar}>
        <div className={styles.orderInfoTitleBlock}>
          <button type="button" className={styles.secondaryBtnSm} onClick={onBack}>
            <i className="fa-solid fa-arrow-left" aria-hidden="true" /> Back
          </button>
          <div>
            <h2 className={styles.panelTitle}>
              {serviceName} - {formatPeso(order.total)}
            </h2>
            <p className={styles.panelSub}>Orders</p>
          </div>
        </div>
        {canCheckout || canCancel ? (
          <div className={styles.orderInfoActions}>
            {canCheckout ? (
              <button type="button" className={styles.primaryBtnSm} onClick={onCheckout}>
                Ready for Checkout
              </button>
            ) : null}
            {canCancel ? (
              <button
                type="button"
                className={`${styles.secondaryBtnSm} ${styles.dangerBtnSm}`}
                onClick={onCancel}
                disabled={cancelling}
              >
                {cancelling ? "Cancelling..." : "Cancel Order"}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className={styles.orderInfoSection}>
        <h3 className={styles.orderInfoSectionTitle}>Order Information</h3>
        <div className={styles.orderInfoGrid}>
          <ReadField label="Order #" value={order.id} />
          {order.invoiceId ? <ReadField label="Invoice" value={order.invoiceId} /> : null}
          <ReadField label="Service Name" value={serviceName} />
          <ReadField label="Plan" value={plan || "—"} />
          {order.domain ? <ReadField label="Domain Name" value={order.domain} /> : null}
          <ReadField label="Amount" value={formatPeso(order.total)} />
          <ReadField label="Payment Mode" value={orderPaymentMethodLabel(order)} />
          <ReadField label="Payment Date" value={orderPaymentDate(order) || "—"} />
          <ReadField label="Payment Status" value={order.paymentStatus || "—"} />
          <ReadField label="Date Ordered" value={order.date || "—"} />
          <ReadField label="Due Date" value={orderDueDate(order) || "—"} />
          <label className={styles.orderInfoField}>
            <span className={styles.orderInfoLabel}>Status</span>
            <span className={styles.orderInfoStatusWrap}>
              <span className={orderStatusClass(order.status)}>{order.status}</span>
            </span>
          </label>
        </div>
      </div>

      {order.items.length > 0 ? (
        <div className={styles.orderInfoSection}>
          <h3 className={styles.orderInfoSectionTitle}>Items</h3>
          <div className={styles.orderInfoItemsWrap}>
            <table className={styles.orderInfoItemsTable}>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Detail</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, index) => (
                  <tr key={`${item.name}-${index}`}>
                    <td>{item.name || "—"}</td>
                    <td>{item.detail || "—"}</td>
                    <td className={styles.monoBold}>{formatPeso(item.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </section>
  );
}
