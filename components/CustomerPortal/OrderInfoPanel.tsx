import { useEffect, useMemo, useRef, useState } from "react";
import { formatPeso } from "@/lib/customerPortal/mockData";
import {
  orderCanCancel,
  orderCanCheckout,
  orderCanCustomize,
  orderDueDate,
  orderPaymentDate,
  orderPaymentMethodLabel,
  orderPlanLabel,
  orderServiceName,
} from "@/lib/customerPortal/orderHelpers";
import { DEAL_NAME_OPTIONS, DOMAIN_TYPE_OPTIONS } from "@/lib/commerceAdmin/clientOrderFormHelpers";
import { HOSTING_PLANS, UNIVERSAL_HOSTING_ADDONS, WEBDESIGN_PACKAGES } from "@/lib/servicesCatalog";
import { fetchPublicProducts } from "@/services/publicProductService";
import { getAllPublicHostingAddons } from "@/services/publicHostingService";
import { getServices } from "@/services/serviceService";
import { updatePortalOrderItems } from "@/services/customerPortalService";
import { toast } from "@/lib/toast";
import type { PortalOrder } from "@/lib/customerPortal/types";
import styles from "@/styles/customerPortal.module.css";

type DraftItem = {
  key: string;
  recordId?: number;
  name: string;
  detail: string;
  originalName: string;
  quantity: number;
  unitPrice: number;
  itemType?: string | null;
  persistable: boolean;
};

type CatalogService = {
  name: string;
  price: number;
};

const DOMAIN_TYPE_FALLBACK_PRICE: Record<string, number> = {
  "Country Level Domain": 3456,
  "Top Level Domain": 1728,
  "Hybrid Top Level Domain": 4032,
  "Educational Domain": 5304,
  "Government Domain": 5184,
};

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

function moneyText(value: number) {
  return Number(value || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function normalizeItemName(value?: string | null) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ");
}

function uniqueServiceNames(names: Array<string | null | undefined>) {
  const seen = new Set<string>();
  const next: string[] = [];
  for (const value of names) {
    const text = String(value ?? "").trim();
    if (!text) continue;
    const key = normalizeItemName(text);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    next.push(text);
  }
  return next;
}

function readCatalogRows(payload: any): CatalogService[] {
  const rows = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.data?.data)
        ? payload.data.data
        : [];
  return rows
    .map((row: any) => {
      const name = String(row?.name ?? row?.title ?? "").trim();
      const price = Number(row?.price ?? row?.amount ?? row?.unit_price ?? 0);
      return name && Number.isFinite(price) && price > 0 ? { name, price } : null;
    })
    .filter((row: CatalogService | null): row is CatalogService => Boolean(row));
}

function isDomainTypeName(value?: string | null) {
  const text = normalizeItemName(value);
  if (!text) return false;
  return DOMAIN_TYPE_OPTIONS.some((option) => {
    const optionName = normalizeItemName(option);
    return text === optionName || text.startsWith(`${optionName} `);
  });
}

function draftsFromOrder(order: PortalOrder): DraftItem[] {
  return (order.items || []).map((item, index) => {
    const quantity = Math.max(1, Number(item.quantity || 1));
    const total = Number(item.total ?? item.price ?? 0);
    const unitPrice = Number(item.unitPrice ?? 0) || (quantity > 0 ? total / quantity : total);
    const detail = item.detail || item.name || "Item";
    const rawId = item.id;
    const numericId = typeof rawId === "number" ? rawId : Number(rawId);
    const recordId = Number.isFinite(numericId) && numericId > 0 ? numericId : undefined;
    const synthetic =
      !recordId &&
      (String(rawId ?? "").startsWith("domain-") ||
        String(item.itemType ?? "").toLowerCase() === "domain" ||
        isDomainTypeName(detail) ||
        isDomainTypeName(item.name));
    return {
      key: String(rawId ?? `row-${index}`),
      recordId,
      name: item.name || "Item",
      detail,
      originalName: detail,
      quantity,
      unitPrice,
      itemType: item.itemType,
      persistable: !synthetic,
    };
  });
}

function lineTotal(item: DraftItem) {
  return Math.round(item.unitPrice * item.quantity * 100) / 100;
}

type OrderInfoPanelProps = {
  order: PortalOrder;
  onBack: () => void;
  onCheckout?: () => void;
  onCancel?: () => void;
  onOrderUpdated?: (order: PortalOrder) => void;
  cancelling?: boolean;
  checkingOut?: boolean;
};

export default function OrderInfoPanel({
  order,
  onBack,
  onCheckout,
  onCancel,
  onOrderUpdated,
  cancelling = false,
  checkingOut = false,
}: OrderInfoPanelProps) {
  const serviceName = orderServiceName(order);
  const plan = orderPlanLabel(order);
  const canCustomize = orderCanCustomize(order) && Boolean(order.recordId);
  const canCheckout = orderCanCheckout(order) && Boolean(onCheckout);
  const canCancel = orderCanCancel(order) && Boolean(onCancel);
  const [draftItems, setDraftItems] = useState<DraftItem[]>(() => draftsFromOrder(order));
  const [saving, setSaving] = useState(false);
  const [catalog, setCatalog] = useState<CatalogService[]>([]);
  const saveTimer = useRef<number | null>(null);

  useEffect(() => {
    setDraftItems(draftsFromOrder(order));
  }, [order.id, order.recordId, order.total, order.items]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchPublicProducts().catch(() => []),
      getAllPublicHostingAddons().catch(() => []),
      getServices({ per_page: 1000 }, { silent: true }).catch(() => null),
    ]).then(([products, addons, services]) => {
      if (cancelled) return;
      setCatalog([
        ...readCatalogRows(products),
        ...readCatalogRows(addons),
        ...readCatalogRows(services),
        ...HOSTING_PLANS.map((plan) => ({ name: plan.name, price: plan.price })),
        ...WEBDESIGN_PACKAGES.map((pkg) => ({ name: pkg.name, price: pkg.price })),
        ...UNIVERSAL_HOSTING_ADDONS.map((addon) => ({ name: addon.name, price: addon.price })),
        ...DOMAIN_TYPE_OPTIONS.map((name) => ({
          name,
          price: DOMAIN_TYPE_FALLBACK_PRICE[name] ?? 0,
        })).filter((row) => row.price > 0),
      ]);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, []);

  const grandTotal = useMemo(
    () => draftItems.reduce((sum, item) => sum + lineTotal(item), 0),
    [draftItems],
  );

  const catalogPrices = useMemo(() => {
    const prices = new Map<string, number>();
    for (const row of catalog) {
      const key = normalizeItemName(row.name);
      if (key && !prices.has(key)) prices.set(key, row.price);
    }
    return prices;
  }, [catalog]);

  const serviceOptions = useMemo(
    () =>
      uniqueServiceNames([
        ...draftItems.map((item) => item.detail),
        ...DEAL_NAME_OPTIONS,
        ...catalog.map((row) => row.name),
        ...HOSTING_PLANS.map((plan) => plan.name),
        ...WEBDESIGN_PACKAGES.map((pkg) => pkg.name),
        ...UNIVERSAL_HOSTING_ADDONS.map((addon) => addon.name),
      ]),
    [catalog, draftItems],
  );

  const priceForService = (name: string, fallback = 0) =>
    catalogPrices.get(normalizeItemName(name)) ?? fallback;

  const persistItems = async (items: DraftItem[]) => {
    if (!order.recordId || !canCustomize) return null;
    const payload = items
      .filter((item) => item.persistable && String(item.detail || item.name).trim())
      .map((item) => {
        const name = item.detail || item.name;
        const unchanged = Boolean(item.recordId) && normalizeItemName(name) === normalizeItemName(item.originalName);
        return {
          ...(unchanged ? { id: item.recordId } : { name }),
          quantity: item.quantity,
        };
      });
    if (!payload.length) {
      toast.info("Keep at least one item on the order.");
      return null;
    }
    setSaving(true);
    try {
      const updated = await updatePortalOrderItems(order.recordId, payload);
      onOrderUpdated?.(updated);
      return updated;
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update this order.");
      return null;
    } finally {
      setSaving(false);
    }
  };

  const queueSave = (items: DraftItem[]) => {
    if (!canCustomize) return;
    if (items.some((item) => !String(item.detail || item.name).trim())) return;
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      void persistItems(items);
    }, 450);
  };

  const updateDraft = (next: DraftItem[]) => {
    setDraftItems(next);
    queueSave(next);
  };

  const handleQuantityChange = (key: string, raw: string) => {
    const quantity = Math.max(1, Math.min(99, Math.round(Number(raw) || 1)));
    updateDraft(draftItems.map((item) => (item.key === key ? { ...item, quantity } : item)));
  };

  const handleRemove = (key: string) => {
    if (draftItems.length <= 1) {
      toast.info("Keep at least one item on the order.");
      return;
    }
    updateDraft(draftItems.filter((item) => item.key !== key));
  };

  const handleAddRow = () => {
    updateDraft([
      ...draftItems,
      {
        key: `new-${Date.now()}`,
        name: "",
        detail: "",
        originalName: "",
        quantity: 1,
        unitPrice: 0,
        persistable: true,
      },
    ]);
  };

  const handleServiceChange = (key: string, name: string) => {
    updateDraft(
      draftItems.map((item) => {
        if (item.key !== key) return item;
        const unchanged = normalizeItemName(name) === normalizeItemName(item.originalName);
        return {
          ...item,
          recordId: unchanged ? item.recordId : undefined,
          name,
          detail: name,
          unitPrice: priceForService(name, unchanged ? item.unitPrice : 0),
          persistable:
            Boolean(item.recordId) ||
            (Boolean(name) && !isDomainTypeName(name) && !String(item.key).startsWith("domain-")),
        };
      }),
    );
  };

  const handleCheckout = async () => {
    if (!onCheckout) return;
    if (draftItems.some((item) => !String(item.detail || item.name).trim())) {
      toast.info("Choose a service for every item before checkout.");
      return;
    }
    if (saveTimer.current) {
      window.clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    const saved = await persistItems(draftItems);
    if (saved || !canCustomize) onCheckout();
  };

  return (
    <section className={`${styles.panel} ${styles.orderInfoPage}`}>
      <div className={styles.orderInfoTopBar}>
        <div className={styles.orderInfoTitleBlock}>
          <button type="button" className={styles.secondaryBtnSm} onClick={onBack}>
            <i className="fa-solid fa-arrow-left" aria-hidden="true" /> Back
          </button>
          <div>
            <h2 className={styles.panelTitle}>
              {serviceName} - {formatPeso(canCustomize ? grandTotal : order.total)}
            </h2>
            <p className={styles.panelSub}>Orders</p>
          </div>
        </div>
        {canCheckout || canCancel ? (
          <div className={styles.orderInfoActions}>
            {canCheckout ? (
              <button type="button" className={styles.primaryBtnSm} onClick={() => void handleCheckout()} disabled={saving || checkingOut}>
                {checkingOut ? "Opening Paynamics..." : "Ready for Checkout"}
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
          <ReadField label="Amount" value={formatPeso(canCustomize ? grandTotal : order.total)} />
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

      {canCustomize ? (
        <div className={styles.orderInfoSection}>
          <h3 className={styles.orderInfoSectionTitle}>Items</h3>
          <div className={styles.orderCustomizeWrap}>
            <table className={styles.orderCustomizeTable}>
              <thead>
                <tr>
                  <th className={styles.orderCustomizeActionHead} aria-label="Remove" />
                  <th>S.NO</th>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Amount(₱)</th>
                  <th>Total(₱)</th>
                </tr>
              </thead>
              <tbody>
                {draftItems.map((item, index) => {
                  const selected = item.detail || item.name;
                  const options = uniqueServiceNames([selected, ...serviceOptions]);
                  return (
                    <tr key={item.key}>
                      <td className={styles.orderCustomizeActionCell}>
                        <button
                          type="button"
                          className={styles.orderCustomizeRemove}
                          title="Remove row"
                          aria-label="Remove row"
                          onClick={() => handleRemove(item.key)}
                        >
                          <i className="fa-regular fa-trash-can" aria-hidden="true" />
                        </button>
                      </td>
                      <td className={styles.orderCustomizeSno}>{index + 1}</td>
                      <td>
                        <div className={styles.orderCustomizeDealSelect}>
                          <select
                            className={styles.orderCustomizeInput}
                            value={selected}
                            onChange={(event) => handleServiceChange(item.key, event.target.value)}
                            aria-label="Service"
                          >
                            <option value="">-None-</option>
                            {options.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                          <span className={styles.orderCustomizeDealChevron} aria-hidden="true">
                            <i className="fa-solid fa-chevron-down" />
                          </span>
                        </div>
                      </td>
                      <td>
                        <input
                          className={`${styles.orderCustomizeInput} ${styles.orderCustomizeQty}`}
                          inputMode="numeric"
                          value={item.quantity}
                          onChange={(event) => handleQuantityChange(item.key, event.target.value)}
                          aria-label="Quantity"
                        />
                      </td>
                      <td>
                        <input
                          className={`${styles.orderCustomizeInput} ${styles.orderCustomizeMoney}`}
                          value={moneyText(item.unitPrice)}
                          readOnly
                          tabIndex={-1}
                          aria-label="Amount"
                        />
                      </td>
                      <td>
                        <input
                          className={`${styles.orderCustomizeInput} ${styles.orderCustomizeMoney}`}
                          value={moneyText(lineTotal(item))}
                          readOnly
                          tabIndex={-1}
                          aria-label="Total"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className={styles.orderCustomizeFooter}>
            <button type="button" className={styles.orderCustomizeAddRow} onClick={handleAddRow}>
              + Add row
            </button>
            <div className={styles.orderCustomizeTotals}>
              <label className={styles.orderCustomizeGrand}>
                <span>Grand Total (₱)</span>
                <input value={moneyText(grandTotal)} readOnly />
              </label>
            </div>
          </div>
        </div>
      ) : order.items.length > 0 ? (
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
