import type { CommercePaymentProofRow } from "@/services/commerceAdminService";

export type ApprovalSortKey = "date-desc" | "date-asc" | "amount-desc" | "amount-asc";
export type ApprovalFilterKey = "all" | "provisioning" | "receipt";

export function approvalQueueType(_row: CommercePaymentProofRow): "Receipt Verification" | "Pending Provisioning" {
  return "Receipt Verification";
}

export function filterApprovals(rows: CommercePaymentProofRow[], filter: ApprovalFilterKey) {
  if (filter === "all") return rows;
  if (filter === "provisioning") {
    return rows.filter((row) => approvalQueueType(row) === "Pending Provisioning");
  }
  return rows.filter((row) => approvalQueueType(row) === "Receipt Verification");
}

export function sortApprovals(rows: CommercePaymentProofRow[], sortBy: ApprovalSortKey) {
  const copy = [...rows];
  copy.sort((a, b) => {
    if (sortBy.startsWith("date")) {
      const aTime = new Date(a.submittedAt).getTime();
      const bTime = new Date(b.submittedAt).getTime();
      return sortBy === "date-desc" ? bTime - aTime : aTime - bTime;
    }
    const aAmount = Number(a.amount ?? 0);
    const bAmount = Number(b.amount ?? 0);
    return sortBy === "amount-desc" ? bAmount - aAmount : aAmount - bAmount;
  });
  return copy;
}

export function formatApprovalDate(value?: string | null) {
  if (!value) return "—";
  return String(value).slice(0, 10);
}

export function approvalServiceLabel(row: CommercePaymentProofRow) {
  return row.serviceName?.trim() || "Service";
}

export function approvalPlanLabel(row: CommercePaymentProofRow) {
  const plan = row.plan?.trim() || "Payment Deposit";
  return row.client ? `${plan} (${row.client})` : plan;
}
