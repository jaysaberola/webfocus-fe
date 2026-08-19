import type { SalesTransaction } from "@/services/salesTransactionService";
import { commerceDueDate, formatCommerceDate } from "@/lib/commerceAdmin/dateHelpers";
import {
  isAddonLineItem,
  joinPlanNames,
  resolveServiceCategoryFromItems,
} from "@/lib/serviceCategory";

export type TxColumnKey =
  | "clientOwner"
  | "probability"
  | "expectedRevenue"
  | "stage"
  | "closingDate"
  | "clientName"
  | "contactName"
  | "clientStatus"
  | "productStatus"
  | "subject"
  | "productCategory"
  | "salesStatus"
  | "statusTriggerDate"
  | "joNumber"
  | "billingInCharge"
  | "dealStatus"
  | "paymentTerms"
  | "paymentMethod"
  | "paymentStatus"
  | "invoiceStatus"
  | "invoiceSentDate"
  | "invoiceReceivedDate"
  | "paymentCommitmentDate"
  | "collectionNote";

export type TxSortKey =
  | "date-desc"
  | "date-asc"
  | "due-desc"
  | "due-asc"
  | "amount-desc"
  | "amount-asc"
  | "id-asc"
  | "id-desc"
  | `${TxColumnKey}-asc`
  | `${TxColumnKey}-desc`;
export type TxFilterKey = "all" | "paid" | "pending";

export const TX_COLUMN_LABELS: Record<TxColumnKey, string> = {
  clientOwner: "Client Owner",
  probability: "Probability (%)",
  expectedRevenue: "Expected Revenue ₱",
  stage: "Stage",
  closingDate: "Closing Date",
  clientName: "Client Name",
  contactName: "Contact Name",
  clientStatus: "Client Status",
  productStatus: "Product Status",
  subject: "Subject",
  productCategory: "Product Category",
  salesStatus: "Sales Status",
  statusTriggerDate: "Status Trigger Date",
  joNumber: "JO Number",
  billingInCharge: "Billing-in-Charge",
  dealStatus: "Deal Status",
  paymentTerms: "Payment Terms",
  paymentMethod: "Payment Method",
  paymentStatus: "Payment Status",
  invoiceStatus: "Invoice Status",
  invoiceSentDate: "Invoice Sent Date",
  invoiceReceivedDate: "Invoice Received Date",
  paymentCommitmentDate: "Payment Commitment Date",
  collectionNote: "Collection Note",
};

export const DEFAULT_TX_COLUMNS: Record<TxColumnKey, boolean> = {
  clientOwner: true,
  probability: false,
  expectedRevenue: false,
  stage: true,
  closingDate: false,
  clientName: true,
  contactName: false,
  clientStatus: true,
  productStatus: false,
  subject: true,
  productCategory: true,
  salesStatus: false,
  statusTriggerDate: false,
  joNumber: false,
  billingInCharge: false,
  dealStatus: false,
  paymentTerms: false,
  paymentMethod: false,
  paymentStatus: false,
  invoiceStatus: false,
  invoiceSentDate: false,
  invoiceReceivedDate: false,
  paymentCommitmentDate: false,
  collectionNote: false,
};

export const TX_COLUMN_KEYS = Object.keys(TX_COLUMN_LABELS) as TxColumnKey[];

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

export function sortTransactions(
  rows: SalesTransaction[],
  sortBy: TxSortKey,
  columnValue?: (row: SalesTransaction, column: TxColumnKey) => string,
) {
  const copy = [...rows];
  const dateValue = (row: SalesTransaction) =>
    Date.parse(String(row.created_at || row.transacted_at || row.issued_date || "")) || 0;
  const dueValue = (row: SalesTransaction) =>
    Date.parse(String(row.due_date || transactionDueDate(row) || "")) || 0;
  const rowId = (row: SalesTransaction) => Number(row.id) || 0;
  copy.sort((a, b) => {
    const compareText = (left: string, right: string, desc: boolean) => {
      const result = left.localeCompare(right, undefined, { numeric: true, sensitivity: "base" });
      return desc ? -result : result;
    };

    if (sortBy === "date-desc") {
      const byDate = dateValue(b) - dateValue(a);
      return byDate !== 0 ? byDate : rowId(b) - rowId(a);
    }
    if (sortBy === "date-asc") {
      const byDate = dateValue(a) - dateValue(b);
      return byDate !== 0 ? byDate : rowId(a) - rowId(b);
    }
    if (sortBy === "due-desc") {
      return dueValue(b) - dueValue(a);
    }
    if (sortBy === "due-asc") {
      return dueValue(a) - dueValue(b);
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

    const columnMatch = sortBy.match(/^(.*)-(asc|desc)$/) as [string, TxColumnKey, "asc" | "desc"] | null;
    if (columnMatch && columnValue) {
      const [, column, direction] = columnMatch;
      return compareText(columnValue(a, column), columnValue(b, column), direction === "desc");
    }
    return 0;
  });
  return copy;
}
