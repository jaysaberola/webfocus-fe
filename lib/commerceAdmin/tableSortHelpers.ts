import { TX_COLUMN_KEYS, type TxColumnKey, type TxSortKey } from "@/lib/commerceAdmin/transactionHelpers";
import type { ApprovalSortKey } from "@/lib/commerceAdmin/approvalHelpers";
import type { ClientColumnKey, ClientSortKey } from "@/lib/commerceAdmin/clientHelpers";

const TX_ASC = Object.fromEntries(TX_COLUMN_KEYS.map((key) => [key, `${key}-asc`])) as Record<
  TxColumnKey,
  TxSortKey
>;
const TX_DESC = Object.fromEntries(TX_COLUMN_KEYS.map((key) => [key, `${key}-desc`])) as Record<
  TxColumnKey,
  TxSortKey
>;

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

const CLIENT_ASC: Partial<Record<ClientColumnKey, ClientSortKey>> = {
  name: "name-asc",
  status: "status-asc",
  service: "service-asc",
  plan: "plan-asc",
  subject: "subject-asc",
  productCategory: "productCategory-asc",
  domain: "domain-asc",
  owner: "owner-asc",
  created: "oldest",
  billing: "billing-asc",
  classification: "classification-asc",
};

const CLIENT_DESC: Partial<Record<ClientColumnKey, ClientSortKey>> = {
  name: "name-desc",
  status: "status-desc",
  service: "service-desc",
  plan: "plan-desc",
  subject: "subject-desc",
  productCategory: "productCategory-desc",
  domain: "domain-desc",
  owner: "owner-desc",
  created: "newest",
  billing: "billing-desc",
  classification: "classification-desc",
};

export function toggleClientSort(current: ClientSortKey, column: ClientColumnKey): ClientSortKey {
  const asc = CLIENT_ASC[column];
  const desc = CLIENT_DESC[column];
  if (!asc || !desc) return current;
  return current === asc ? desc : asc;
}

export function clientSortDirection(sortBy: ClientSortKey, column: ClientColumnKey): "asc" | "desc" | null {
  const asc = CLIENT_ASC[column];
  const desc = CLIENT_DESC[column];
  if (sortBy === asc) return "asc";
  if (sortBy === desc) return "desc";
  return null;
}

export function isClientColumnSorted(sortBy: ClientSortKey, column: ClientColumnKey) {
  return clientSortDirection(sortBy, column) !== null;
}
