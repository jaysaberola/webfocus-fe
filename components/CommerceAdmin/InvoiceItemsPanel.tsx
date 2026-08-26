import {
  emptyInvoiceLineItem,
  formatInvoiceAmount,
  invoiceLineAmount,
  invoiceLineTotal,
  invoiceTotals,
  type InvoiceLineItem,
} from "@/lib/commerceAdmin/clientInvoiceHelpers";
import styles from "@/styles/commerceAdmin.module.css";

type Props = {
  items: InvoiceLineItem[];
  adjustment: string;
  onItemsChange: (items: InvoiceLineItem[]) => void;
  onAdjustmentChange: (value: string) => void;
};

export default function InvoiceItemsPanel({
  items,
  adjustment,
  onItemsChange,
  onAdjustmentChange,
}: Props) {
  const totals = invoiceTotals(items, adjustment);

  const updateItem = (id: string, patch: Partial<InvoiceLineItem>) => {
    onItemsChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const removeItem = (id: string) => {
    if (items.length <= 1) {
      onItemsChange([emptyInvoiceLineItem()]);
      return;
    }
    onItemsChange(items.filter((item) => item.id !== id));
  };

  return (
    <section className={`${styles.clientCrmSection} ${styles.invoiceItemsSection}`}>
      <h4 className={`${styles.clientCrmSectionTitle} ${styles.invoiceSectionTitle}`}>Invoiced Items</h4>

      <div className={styles.invoiceItemsTableWrap}>
        <table className={styles.invoiceItemsTable}>
          <thead>
            <tr>
              <th className={styles.invoiceItemsActionHead} aria-label="Remove" />
              <th>S.NO</th>
              <th>Product Name</th>
              <th>List Price(₱)</th>
              <th>Quantity</th>
              <th>Amount(₱)</th>
              <th>Discount(₱)</th>
              <th>Tax(₱)</th>
              <th>Total(₱)</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.id}>
                <td className={styles.invoiceItemsActionCell}>
                  <button
                    type="button"
                    className={styles.invoiceItemsRemove}
                    title="Remove row"
                    aria-label="Remove row"
                    onClick={() => removeItem(item.id)}
                  >
                    <i className="fa-regular fa-trash-can" aria-hidden="true" />
                  </button>
                </td>
                <td className={styles.invoiceItemsSno}>{index + 1}</td>
                <td>
                  <div className={styles.invoiceItemsProduct}>
                    <input
                      className={`${styles.clientCrmInput} ${styles.clientCrmInputRequired}`}
                      value={item.productName}
                      onChange={(event) => updateItem(item.id, { productName: event.target.value })}
                      required
                    />
                    <textarea
                      className={styles.invoiceItemsDescription}
                      value={item.description}
                      placeholder="Description"
                      rows={3}
                      onChange={(event) => updateItem(item.id, { description: event.target.value })}
                    />
                  </div>
                </td>
                <td>
                  <input
                    className={`${styles.clientCrmInput} ${styles.invoiceItemsMoney}`}
                    inputMode="decimal"
                    value={item.listPrice}
                    onChange={(event) => updateItem(item.id, { listPrice: event.target.value })}
                  />
                </td>
                <td>
                  <input
                    className={`${styles.clientCrmInput} ${styles.invoiceItemsQty}`}
                    inputMode="decimal"
                    value={item.quantity}
                    onChange={(event) => updateItem(item.id, { quantity: event.target.value })}
                  />
                </td>
                <td>
                  <input
                    className={`${styles.clientCrmInput} ${styles.invoiceItemsMoney}`}
                    value={formatInvoiceAmount(invoiceLineAmount(item))}
                    readOnly
                    tabIndex={-1}
                  />
                </td>
                <td>
                  <input
                    className={`${styles.clientCrmInput} ${styles.invoiceItemsMoney}`}
                    inputMode="decimal"
                    value={item.discount}
                    onChange={(event) => updateItem(item.id, { discount: event.target.value })}
                  />
                </td>
                <td>
                  <input
                    className={`${styles.clientCrmInput} ${styles.invoiceItemsMoney}`}
                    inputMode="decimal"
                    value={item.tax}
                    onChange={(event) => updateItem(item.id, { tax: event.target.value })}
                  />
                </td>
                <td>
                  <input
                    className={`${styles.clientCrmInput} ${styles.invoiceItemsMoney}`}
                    value={formatInvoiceAmount(invoiceLineTotal(item))}
                    readOnly
                    tabIndex={-1}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.invoiceItemsFooter}>
        <button
          type="button"
          className={styles.invoiceItemsAddRow}
          onClick={() => onItemsChange([...items, emptyInvoiceLineItem()])}
        >
          + Add row
        </button>

        <div className={styles.invoiceItemsTotals}>
          <label>
            <span>Sub Total (₱)</span>
            <input value={formatInvoiceAmount(totals.subTotal)} readOnly />
          </label>
          <label>
            <span>Discount (₱)</span>
            <input value={formatInvoiceAmount(totals.discount)} readOnly />
          </label>
          <label>
            <span>Tax (₱)</span>
            <input value={formatInvoiceAmount(totals.tax)} readOnly />
          </label>
          <label>
            <span>Adjustment (₱)</span>
            <input
              inputMode="decimal"
              value={adjustment}
              onChange={(event) => onAdjustmentChange(event.target.value)}
            />
          </label>
          <label className={styles.invoiceItemsGrand}>
            <span>Grand Total (₱)</span>
            <input value={formatInvoiceAmount(totals.grandTotal)} readOnly />
          </label>
        </div>
      </div>
    </section>
  );
}
