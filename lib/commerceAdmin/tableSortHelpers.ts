import type { TxColumnKey, TxSortKey } from "@/lib/commerceAdmin/transactionHelpers";
import type { ApprovalSortKey } from "@/lib/commerceAdmin/approvalHelpers";

const TX_ASC: Partial<Record<TxColumnKey, TxSortKey>> = {
  id: "id-asc",
  items: "service-asc",
  subscription: "plan-asc",
  orderType: "order-type-asc",
  date: "date-asc",
  expiredDate: "due-asc",
  amount: "amount-asc",
  status: "status-asc",
};

const TX_DESC: Partial<Record<TxColumnKey, TxSortKey>> = {
  id: "id-desc",
  items: "service-desc",
  subscription: "plan-desc",
  orderType: "order-type-desc",
  date: "date-desc",
  expiredDate: "due-desc",
  amount: "amount-desc",
  status: "status-desc",
};

export function toggleTxSort(current: TxSortKey, column: TxColumnKey): TxSortKey {
  const asc = TX_ASC[column];
  const desc = TX_DESC[column];
  if (!asc || !desc) return current;
  return current === asc ? desc : asc;
}

export function txSortDirection(sortBy: TxSortKey, column: TxColumnKey): "asc" | "desc" | null {
  const asc = TX_ASC[column];
  const desc = TX_DESC[column];
  if (sortBy === asc) return "asc";
  if (sortBy === desc) return "desc";
  return null;
}

export function isTxColumnSorted(sortBy: TxSortKey, column: TxColumnKey) {
  return txSortDirection(sortBy, column) !== null;
}

export type ApprovalColumnKey =
  | "invoice"
  | "service"
  | "plan"
  | "client"
  | "issued"
  | "due"
  | "amount"
  | "status";

const APPROVAL_ASC: Record<ApprovalColumnKey, ApprovalSortKey> = {
  invoice: "invoice-asc",
  service: "service-asc",
  plan: "plan-asc",
  client: "client-asc",
  issued: "date-asc",
  due: "due-asc",
  amount: "amount-asc",
  status: "status-asc",
};

const APPROVAL_DESC: Record<ApprovalColumnKey, ApprovalSortKey> = {
  invoice: "invoice-desc",
  service: "service-desc",
  plan: "plan-desc",
  client: "client-desc",
  issued: "date-desc",
  due: "due-desc",
  amount: "amount-desc",
  status: "status-desc",
};

export function toggleApprovalSort(current: ApprovalSortKey, column: ApprovalColumnKey): ApprovalSortKey {
  const asc = APPROVAL_ASC[column];
  const desc = APPROVAL_DESC[column];
  return current === asc ? desc : asc;
}

export function approvalSortDirection(
  sortBy: ApprovalSortKey,
  column: ApprovalColumnKey
): "asc" | "desc" | null {
  const asc = APPROVAL_ASC[column];
  const desc = APPROVAL_DESC[column];
  if (sortBy === asc) return "asc";
  if (sortBy === desc) return "desc";
  return null;
}

export function isApprovalColumnSorted(sortBy: ApprovalSortKey, column: ApprovalColumnKey) {
  return approvalSortDirection(sortBy, column) !== null;
}
