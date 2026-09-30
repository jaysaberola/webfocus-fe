import { formatDealAmount, type ClientDealRow } from "@/lib/commerceAdmin/clientDealHelpers";
import styles from "@/styles/commerceAdmin.module.css";

type Props = {
  order: ClientDealRow;
  embedded?: boolean;
  amountValues?: Record<string, string>;
  discountValues?: Record<string, string>;
  taxValues?: Record<string, string>;
  onAmountChange?: (itemName: string, value: string) => void;
  onDiscountChange?: (itemName: string, value: string) => void;
  onTaxChange?: (itemName: string, value: string) => void;
  clientNotes?: string;
  salesNotes?: string;
  onSalesNotesChange?: (value: string) => void;
  actions?: React.ReactNode;
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

function withDealSerial(items: ClientDealRow["items"]) {
  let serial = 0;
  return items.map((item) => {
    const included = Boolean(item.included);
    if (!included) serial += 1;
    return { item, included, serial };
  });
}

export default function OrderProductDetailsPanel({
  order,
  embedded = false,
  amountValues,
  discountValues,
  taxValues,
  onAmountChange,
  onDiscountChange,
  onTaxChange,
  clientNotes,
  salesNotes,
  onSalesNotesChange,
  actions,
  onClose,
}: Props) {
  const subtitle = [order.dealName || order.subject, order.transactionNo].filter(Boolean).join(" · ");
  const canEditAmount = Boolean(onAmountChange);
  const canEditDiscount = Boolean(onDiscountChange);
  const canEditTax = Boolean(onTaxChange);
  const customerNote = String(clientNotes || "").trim();
  const customerName = String(order.clientName || "").trim();
  const showNotes = Boolean(onSalesNotesChange) || customerNote !== "";

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
              withDealSerial(order.items).map(({ item, included, serial }) => {
                const period = splitPeriod(item.period);
                const amountValue =
                  amountValues?.[item.name] ?? (item.amount ? String(item.amount) : "");
                const discountValue =
                  discountValues?.[item.name] ?? (item.discount ? String(item.discount) : "");
                const taxValue = taxValues?.[item.name] ?? (item.tax ? String(item.tax) : "");
                return (
                <tr
                  key={item.id}
                  className={included ? styles.productDetailsIncludedRow : undefined}
                >
                  <td data-label="S.NO">{included ? "" : serial}</td>
                  <td data-label="Deal Name">
                    <div className={styles.productNameCell}>
                      {included ? (
                        <span className={styles.productIncludedName}>{item.name}</span>
                      ) : (
                        <strong>{item.name}</strong>
                      )}
                      {!included && item.additionalServices?.length ? (
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
                  <td className={styles.dealsAmount} data-label="Amount(₱)">
                    {canEditAmount ? (
                      <input
                        className={`${styles.clientCrmInput} ${styles.productDetailsDiscountInput}`}
                        type="number"
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        value={amountValue}
                        onChange={(event) => onAmountChange?.(item.name, event.target.value)}
                        placeholder="0.00"
                        aria-label={`Amount for ${item.name}`}
                      />
                    ) : (
                      moneyCell(item.amount)
                    )}
                  </td>
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

      <div className={styles.productDetailsFooter}>
        {showNotes ? (
          <div className={styles.productDetailsNotes}>
            <div className={styles.productDetailsMessageIn}>
              <span className={styles.productDetailsMessageName}>
                {customerName || "Customer"}
              </span>
              <p className={styles.productDetailsMessageBubble}>
                {customerNote || "No notes yet."}
              </p>
            </div>
            {onSalesNotesChange ? (
              <label className={styles.productDetailsMessageOut}>
                <span className={styles.productDetailsMessageName}>Sales</span>
                <textarea
                  className={styles.productDetailsMessageInput}
                  rows={3}
                  value={salesNotes ?? ""}
                  onChange={(event) => onSalesNotesChange(event.target.value)}
                  placeholder={customerName ? `Reply to ${customerName}` : "Write a reply"}
                />
              </label>
            ) : null}
          </div>
        ) : (
          <div />
        )}
        <div className={styles.productDetailsFooterRight}>
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
          {actions ? <div className={styles.productDetailsActions}>{actions}</div> : null}
        </div>
      </div>
    </div>
  );
}
