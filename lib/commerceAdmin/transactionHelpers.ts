import type { SalesTransaction } from "@/services/salesTransactionService";
import { commerceDueDate, formatCommerceDate } from "@/lib/commerceAdmin/dateHelpers";
import {
  isAddonLineItem,
  joinPlanNames,
  resolveServiceCategoryFromItems,
} from "@/lib/serviceCategory";

export type TxSortKey =
  | "date-desc"
  | "date-asc"
  | "due-desc"
  | "due-asc"
  | "amount-desc"
  | "amount-asc"
  | "id-asc"
  | "id-desc"
  | "service-asc"
  | "service-desc"
  | "plan-asc"
  | "plan-desc"
  | "order-type-asc"
  | "order-type-desc"
  | "status-asc"
  | "status-desc";
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
  expiredDate: "Due Date",
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
  return resolveServiceCategoryFromItems(items);
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
  return formatCommerceDate(value);
}

export function transactionIssuedDate(transaction: SalesTransaction) {
  return formatCommerceDate(transaction.issued_date ?? transaction.transacted_at);
}

export function transactionDueDate(transaction: SalesTransaction) {
  if (transaction.due_date) return formatCommerceDate(transaction.due_date);
  return commerceDueDate(transaction.issued_date ?? transaction.transacted_at);
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
    const compareText = (left: string, right: string, desc: boolean) => {
      const result = left.localeCompare(right);
      return desc ? -result : result;
    };

    if (sortBy === "date-desc") {
      return compareText(transactionIssuedDate(b), transactionIssuedDate(a), true);
    }
    if (sortBy === "date-asc") {
      return compareText(transactionIssuedDate(a), transactionIssuedDate(b), false);
    }
    if (sortBy === "due-desc") {
      return compareText(transactionDueDate(b), transactionDueDate(a), true);
    }
    if (sortBy === "due-asc") {
      return compareText(transactionDueDate(a), transactionDueDate(b), false);
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
    if (sortBy === "id-desc") {
      return String(b.transaction_no ?? "").localeCompare(String(a.transaction_no ?? ""));
    }
    if (sortBy === "service-asc") {
      return compareText(transactionItemSummary(a), transactionItemSummary(b), false);
    }
    if (sortBy === "service-desc") {
      return compareText(transactionItemSummary(a), transactionItemSummary(b), true);
    }
    if (sortBy === "plan-asc") {
      return compareText(transactionPlanLabel(a), transactionPlanLabel(b), false);
    }
    if (sortBy === "plan-desc") {
      return compareText(transactionPlanLabel(a), transactionPlanLabel(b), true);
    }
    if (sortBy === "order-type-asc") {
      return compareText(transactionOrderType(a), transactionOrderType(b), false);
    }
    if (sortBy === "order-type-desc") {
      return compareText(transactionOrderType(a), transactionOrderType(b), true);
    }
    if (sortBy === "status-asc") {
      return compareText(paymentStatusLabel(a.payment_status), paymentStatusLabel(b.payment_status), false);
    }
    if (sortBy === "status-desc") {
      return compareText(paymentStatusLabel(a.payment_status), paymentStatusLabel(b.payment_status), true);
    }
    return 0;
  });
  return copy;
}
