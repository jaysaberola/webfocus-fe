import type { SalesTransaction } from "@/services/salesTransactionService";
import {
  isAddonLineItem,
  joinPlanNames,
  resolveServiceCategory,
} from "@/lib/serviceCategory";

export type TxSortKey = "date-desc" | "date-asc" | "amount-desc" | "amount-asc" | "id-asc";
export type TxFilterKey = "all" | "paid" | "pending";

export type TxColumnKey =
  | "id"
  | "items"
  | "subscription"
  | "orderType"
  | "date"
  | "expiredDate"
  | "amount"
  | "status";

export const TX_COLUMN_LABELS: Record<TxColumnKey, string> = {
  id: "Invoice ID",
  items: "Service Name",
  subscription: "Plan",
  orderType: "Order Type",
  date: "Issued Date",
  expiredDate: "Expired Date",
  amount: "Amount",
  status: "Status",
};

export const DEFAULT_TX_COLUMNS: Record<TxColumnKey, boolean> = {
  id: true,
  items: true,
  subscription: true,
  orderType: true,
  date: true,
  expiredDate: true,
  amount: true,
  status: true,
};

const normalizeItems = (items: SalesTransaction["items"]) =>
  (items ?? []).map((item) => ({
    ...item,
    name: String(item?.name ?? ""),
    item_type: item?.item_type ?? null,
    total_price: Number(item?.total_price ?? Number(item?.price || 0) * Number(item?.quantity || 0)),
  }));

function primaryTransactionItem(items: ReturnType<typeof normalizeItems>[number][] | ReturnType<typeof normalizeItems>) {
  const list = items as ReturnType<typeof normalizeItems>;
  return list.find((item) => !isAddonLineItem(item.name)) ?? list[0];
}

export function transactionServiceCategory(transaction: SalesTransaction) {
  const items = normalizeItems(transaction.items);
  if (!items.length) return "—";
  const primary = primaryTransactionItem(items);
  return resolveServiceCategory(primary.name, primary.item_type);
}

export function transactionPlanDetail(transaction: SalesTransaction) {
  const items = normalizeItems(transaction.items);
  if (!items.length) return "—";
  return joinPlanNames(items.map((item) => item.name)) || "—";
}

/** Service Name column — category such as Hosting, Secure Domain, DMS, Custom Web Design */
export function transactionItemSummary(transaction: SalesTransaction) {
  return transactionServiceCategory(transaction);
}

/** Plan column — package / domain / product line with optional customer */
export function transactionPlanLabel(transaction: SalesTransaction) {
  const detail = transactionPlanDetail(transaction);
  if (detail === "—") return transaction.customer_name ?? "—";
  return transaction.customer_name ? `${detail} (${transaction.customer_name})` : detail;
}

export function transactionOrderType(transaction: SalesTransaction) {
  const notes = String(transaction.notes ?? "").toLowerCase();
  if (notes.includes("client order") || notes.includes("manual order")) return "Client Order";
  return "Web Order";
}

export function formatTxDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return date.toISOString().slice(0, 10);
}

export function transactionDueDate(transaction: SalesTransaction) {
  const base = transaction.transacted_at ? new Date(transaction.transacted_at) : new Date();
  if (Number.isNaN(base.getTime())) return "—";
  const due = new Date(base);
  due.setDate(due.getDate() + 30);
  return due.toISOString().slice(0, 10);
}

export function paymentStatusLabel(status?: string | null) {
  const raw = String(status ?? "pending").toLowerCase();
  if (raw === "paid") return "Paid";
  if (raw === "pending") return "Pending Payment";
  if (raw === "failed") return "Failed";
  if (raw === "refunded") return "Refunded";
  if (raw === "overdue") return "Overdue";
  return status ?? "Pending Payment";
}

export function isPaidStatus(status?: string | null) {
  return String(status ?? "").toLowerCase() === "paid";
}

export function filterTransactions(rows: SalesTransaction[], filter: TxFilterKey) {
  if (filter === "all") return rows;
  if (filter === "paid") return rows.filter((row) => isPaidStatus(row.payment_status));
  return rows.filter((row) => !isPaidStatus(row.payment_status));
}

export function sortTransactions(rows: SalesTransaction[], sortBy: TxSortKey) {
  const copy = [...rows];
  copy.sort((a, b) => {
    if (sortBy === "date-desc") {
      return new Date(b.transacted_at ?? 0).getTime() - new Date(a.transacted_at ?? 0).getTime();
    }
    if (sortBy === "date-asc") {
      return new Date(a.transacted_at ?? 0).getTime() - new Date(b.transacted_at ?? 0).getTime();
    }
    if (sortBy === "amount-desc") {
      return Number(b.grand_total ?? 0) - Number(a.grand_total ?? 0);
    }
    if (sortBy === "amount-asc") {
      return Number(a.grand_total ?? 0) - Number(b.grand_total ?? 0);
    }
    if (sortBy === "id-asc") {
      return String(a.transaction_no ?? "").localeCompare(String(b.transaction_no ?? ""));
    }
    return 0;
  });
  return copy;
}
