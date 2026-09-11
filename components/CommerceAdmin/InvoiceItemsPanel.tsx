import {
  emptyInvoiceLineItem,
  formatInvoiceAmount,
  invoiceLineAmount,
  invoiceLineTotal,
  invoiceMoney,
  invoiceTotals,
  type InvoiceLineItem,
} from "@/lib/commerceAdmin/clientInvoiceHelpers";
import { DEAL_NAME_OPTIONS } from "@/lib/commerceAdmin/clientOrderFormHelpers";
import { HOSTING_PLANS, WEBDESIGN_PACKAGES } from "@/lib/servicesCatalog";
import styles from "@/styles/commerceAdmin.module.css";

type Props = {
  items: InvoiceLineItem[];
  adjustment: string;
  onItemsChange: (items: InvoiceLineItem[]) => void;
  onAdjustmentChange: (value: string) => void;
};

function withExtraOption(options: readonly string[], value?: string | null) {
  const text = String(value ?? "").trim();
  if (!text || options.some((option) => option === text)) return options;
  return [text, ...options];
}

function catalogPriceForDealName(dealName: string) {
  const needle = dealName.trim().toLowerCase();
  if (!needle) return null;
  const hosting = HOSTING_PLANS.find((plan) => plan.name.toLowerCase() === needle);
  if (hosting) return hosting.price;
  const design = WEBDESIGN_PACKAGES.find((pkg) => pkg.name.toLowerCase() === needle);
  if (design) return design.price;
  return null;
}

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

  const handleDealNameChange = (id: string, dealName: string) => {
    const current = items.find((item) => item.id === id);
    if (!current) return;

    const catalogPrice = catalogPriceForDealName(dealName);
    const currentPrice = invoiceMoney(current.listPrice);
    const shouldFillPrice = catalogPrice != null && (currentPrice === 0 || !String(current.listPrice).trim());

    updateItem(id, {
      productName: dealName,
      ...(shouldFillPrice ? { listPrice: formatInvoiceAmount(catalogPrice) } : {}),
    });
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
              <th>Deal Name</th>
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
                    <div className={styles.invoiceItemsDealSelect}>
                      <select
                        className={`${styles.clientCrmInput} ${styles.clientCrmInputRequired}`}
                        value={item.productName}
                        onChange={(event) => handleDealNameChange(item.id, event.target.value)}
                        required
                        aria-label="Deal name"
                      >
                        <option value="">-None-</option>
                        {withExtraOption(DEAL_NAME_OPTIONS, item.productName).map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      <span className={styles.invoiceItemsDealChevron} aria-hidden="true">
                        <i className="fa-solid fa-chevron-down" />
                      </span>
                    </div>
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
