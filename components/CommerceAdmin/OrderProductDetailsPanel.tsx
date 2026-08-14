import { formatDealAmount, type ClientDealRow } from "@/lib/commerceAdmin/clientDealHelpers";
import styles from "@/styles/commerceAdmin.module.css";

type Props = {
  order: ClientDealRow;
  onClose: () => void;
};

function moneyCell(value: number) {
  return formatDealAmount(value).replace("₱ ", "");
}

function splitPeriod(period?: string) {
  const parts = String(period ?? "")
    .split(" - ")
    .map((part) => part.trim())
    .filter(Boolean);
  return {
    start: parts[0] || "—",
    end: parts[1] || "—",
  };
}

export default function OrderProductDetailsPanel({ order, onClose }: Props) {
  return (
    <div className={styles.productDetailsPanel}>
      <div className={styles.productDetailsHead}>
        <div>
          <h4 className={styles.clientCrmSectionTitle}>Product Details</h4>
          <p className={styles.panelSubtitle}>
            {order.subject}
            {order.transactionNo ? ` · ${order.transactionNo}` : ""}
          </p>
        </div>
        <button type="button" className={styles.secondaryBtnSm} onClick={onClose}>
          Close
        </button>
      </div>

      <div className={styles.tableWrap}>
        <table className={`${styles.table} ${styles.productDetailsTable}`}>
          <thead>
            <tr>
              <th>S.NO</th>
              <th>Product Name</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th className={styles.dealsAmount}>List Price(₱)</th>
              <th className={styles.dealsAmount}>Quantity</th>
              <th className={styles.dealsAmount}>Amount(₱)</th>
              <th className={styles.dealsAmount}>Discount(₱)</th>
              <th className={styles.dealsAmount}>Tax(₱)</th>
            </tr>
          </thead>
          <tbody>
            {order.items.length === 0 ? (
              <tr>
                <td colSpan={9}>No product lines found for this order.</td>
              </tr>
            ) : (
              order.items.map((item, index) => {
                const period = splitPeriod(item.period);
                return (
                <tr key={item.id}>
                  <td>{index + 1}</td>
                  <td>
                    <div className={styles.productNameCell}>
                      <strong>{item.name}</strong>
                      {item.domain ? <span>{item.domain}</span> : null}
                    </div>
                  </td>
                  <td className={styles.dealsNowrap}>{period.start}</td>
                  <td className={styles.dealsNowrap}>{period.end}</td>
                  <td className={styles.dealsAmount}>{moneyCell(item.listPrice)}</td>
                  <td className={styles.dealsAmount}>{item.quantity}</td>
                  <td className={styles.dealsAmount}>{moneyCell(item.amount)}</td>
                  <td className={styles.dealsAmount}>{moneyCell(item.discount)}</td>
                  <td className={styles.dealsAmount}>{moneyCell(item.tax)}</td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className={styles.productDetailsTotals}>
        <div>
          <span>Sub Total</span>
          <strong>{formatDealAmount(order.subtotal)}</strong>
        </div>
        <div>
          <span>Discount</span>
          <strong>{formatDealAmount(order.discountTotal)}</strong>
        </div>
        <div>
          <span>Tax</span>
          <strong>{formatDealAmount(order.taxTotal)}</strong>
        </div>
        <div>
          <span>Adjustment</span>
          <strong>{formatDealAmount(order.adjustment)}</strong>
        </div>
        <div className={styles.productDetailsGrand}>
          <span>Grand Total</span>
          <strong>{formatDealAmount(order.grandTotal)}</strong>
        </div>
      </div>
    </div>
  );
}
