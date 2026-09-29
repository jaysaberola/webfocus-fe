import { formatDealAmount, type ClientDealRow } from "@/lib/commerceAdmin/clientDealHelpers";
import styles from "@/styles/commerceAdmin.module.css";

type Props = {
  order: ClientDealRow;
  embedded?: boolean;
  discountValues?: Record<string, string>;
  taxValues?: Record<string, string>;
  onDiscountChange?: (itemName: string, value: string) => void;
  onTaxChange?: (itemName: string, value: string) => void;
  onClose?: () => void;
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

export default function OrderProductDetailsPanel({
  order,
  embedded = false,
  discountValues,
  taxValues,
  onDiscountChange,
  onTaxChange,
  onClose,
}: Props) {
  const subtitle = [order.dealName || order.subject, order.transactionNo].filter(Boolean).join(" · ");
  const canEditDiscount = Boolean(onDiscountChange);
  const canEditTax = Boolean(onTaxChange);

  return (
    <div className={`${styles.productDetailsPanel}${embedded ? ` ${styles.productDetailsPanelEmbedded}` : ""}`}>
      <div className={styles.productDetailsHead}>
        <div>
          {embedded ? null : <h4 className={styles.clientCrmSectionTitle}>Deal Info</h4>}
          {subtitle ? <p className={styles.panelSubtitle}>{subtitle}</p> : null}
        </div>
        {embedded || !onClose ? null : (
          <button type="button" className={styles.secondaryBtnSm} onClick={onClose}>
            Close
          </button>
        )}
      </div>

      <div className={styles.tableWrap}>
        <table className={`${styles.table} ${styles.productDetailsTable}`}>
          <thead>
            <tr>
              <th>S.NO</th>
              <th>Deal Name</th>
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
                const discountValue =
                  discountValues?.[item.name] ?? (item.discount ? String(item.discount) : "");
                const taxValue = taxValues?.[item.name] ?? (item.tax ? String(item.tax) : "");
                return (
                <tr key={item.id}>
                  <td data-label="S.NO">{index + 1}</td>
                  <td data-label="Deal Name">
                    <div className={styles.productNameCell}>
                      <strong>{item.name}</strong>
                      {item.additionalServices?.length ? (
                        <span className={styles.productIncludedServices}>
                          {item.additionalServices.join(" · ")}
                        </span>
                      ) : null}
                      {item.domain ? <span>{item.domain}</span> : null}
                    </div>
                  </td>
                  <td className={styles.dealsNowrap} data-label="Start Date">{period.start}</td>
                  <td className={styles.dealsNowrap} data-label="End Date">{period.end}</td>
                  <td className={styles.dealsAmount} data-label="List Price(₱)">{moneyCell(item.listPrice)}</td>
                  <td className={styles.dealsAmount} data-label="Quantity">{item.quantity}</td>
                  <td className={styles.dealsAmount} data-label="Amount(₱)">{moneyCell(item.amount)}</td>
                  <td className={styles.dealsAmount} data-label="Discount(₱)">
                    {canEditDiscount ? (
                      <input
                        className={`${styles.clientCrmInput} ${styles.productDetailsDiscountInput}`}
                        type="number"
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        value={discountValue}
                        onChange={(event) => onDiscountChange?.(item.name, event.target.value)}
                        placeholder="0.00"
                        aria-label={`Discount for ${item.name}`}
                      />
                    ) : (
                      moneyCell(item.discount)
                    )}
                  </td>
                  <td className={styles.dealsAmount} data-label="Tax(₱)">
                    {canEditTax ? (
                      <input
                        className={`${styles.clientCrmInput} ${styles.productDetailsDiscountInput}`}
                        type="number"
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        value={taxValue}
                        onChange={(event) => onTaxChange?.(item.name, event.target.value)}
                        placeholder="0.00"
                        aria-label={`Tax for ${item.name}`}
                      />
                    ) : (
                      moneyCell(item.tax)
                    )}
                  </td>
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
