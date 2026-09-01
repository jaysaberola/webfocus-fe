import type { CommercePaymentProofRow } from "@/services/commerceAdminService";
import { commerceDueDate, formatCommerceDate } from "@/lib/commerceAdmin/dateHelpers";
import { formatCommerceMoney } from "@/lib/commerceAdmin/mockData";

export type ApprovalSortKey =
  | "date-desc"
  | "date-asc"
  | "due-desc"
  | "due-asc"
  | "amount-desc"
  | "amount-asc"
  | "invoice-asc"
  | "invoice-desc"
  | "service-asc"
  | "service-desc"
  | "plan-asc"
  | "plan-desc"
  | "client-asc"
  | "client-desc"
  | "status-asc"
  | "status-desc";
export type ApprovalFilterKey = "all" | "provisioning" | "receipt" | "profile";

export function approvalQueueType(
  row: CommercePaymentProofRow,
): "Receipt Verification" | "Pending Provisioning" | "Profile Change" {
  if (row.kind === "profile_change") return "Profile Change";
  return "Receipt Verification";
}

export function filterApprovals(rows: CommercePaymentProofRow[], filter: ApprovalFilterKey) {
  if (filter === "all") return rows;
  if (filter === "provisioning") {
    return rows.filter((row) => approvalQueueType(row) === "Pending Provisioning");
  }
  if (filter === "profile") {
    return rows.filter((row) => approvalQueueType(row) === "Profile Change");
  }
  return rows.filter((row) => approvalQueueType(row) === "Receipt Verification");
}

export function sortApprovals(rows: CommercePaymentProofRow[], sortBy: ApprovalSortKey) {
  const copy = [...rows];
  copy.sort((a, b) => {
    const compareText = (left: string, right: string, desc: boolean) => {
      const result = left.localeCompare(right);
      return desc ? -result : result;
    };

    if (sortBy.startsWith("date")) {
      const aIssued = approvalIssuedDate(a);
      const bIssued = approvalIssuedDate(b);
      return compareText(aIssued, bIssued, sortBy === "date-desc");
    }
    if (sortBy.startsWith("due")) {
      const aDue = approvalDueDate(a);
      const bDue = approvalDueDate(b);
      return compareText(aDue, bDue, sortBy === "due-desc");
    }
    if (sortBy.startsWith("amount")) {
      const aAmount = Number(a.amount ?? 0);
      const bAmount = Number(b.amount ?? 0);
      return sortBy === "amount-desc" ? bAmount - aAmount : aAmount - bAmount;
    }
    if (sortBy.startsWith("invoice")) {
      return compareText(
        String(a.invoiceId || a.proofNo),
        String(b.invoiceId || b.proofNo),
        sortBy === "invoice-desc"
      );
    }
    if (sortBy.startsWith("service")) {
      return compareText(approvalServiceLabel(a), approvalServiceLabel(b), sortBy === "service-desc");
    }
    if (sortBy.startsWith("plan")) {
      return compareText(approvalPlanLabel(a), approvalPlanLabel(b), sortBy === "plan-desc");
    }
    if (sortBy.startsWith("client")) {
      return compareText(String(a.client ?? ""), String(b.client ?? ""), sortBy === "client-desc");
    }
    if (sortBy.startsWith("status")) {
      return compareText(String(a.status ?? ""), String(b.status ?? ""), sortBy === "status-desc");
    }
    return 0;
  });
  return copy;
}

export function formatApprovalDate(value?: string | null) {
  return formatCommerceDate(value);
}

export function approvalIssuedDate(row: CommercePaymentProofRow) {
  return formatCommerceDate(row.issuedDate);
}

export function approvalDueDate(row: CommercePaymentProofRow) {
  if (row.expiredDate) return formatCommerceDate(row.expiredDate);
  return commerceDueDate(row.issuedDate);
}

export function approvalServiceLabel(row: CommercePaymentProofRow) {
  return row.serviceName?.trim() || (row.kind === "profile_change" ? "Profile Change" : "Service");
}

export function approvalPlanLabel(row: CommercePaymentProofRow) {
  if (row.kind === "profile_change") {
    return row.summary?.trim() || row.plan?.trim() || "Profile update request";
  }
  return row.plan?.trim() || "Payment Deposit";
}

export function approvalAmountLabel(row: CommercePaymentProofRow) {
  if (row.kind === "profile_change") return "—";
  return formatCommerceMoney(Number(row.amount ?? 0));
}
