import { parseDealMeta } from "@/lib/commerceAdmin/clientOrderFormHelpers";
import { formatDealAmount } from "@/lib/commerceAdmin/clientDealHelpers";
import type { ClientInvoiceRow } from "@/lib/commerceAdmin/clientInvoiceHelpers";
import { isPaidStatus } from "@/lib/commerceAdmin/transactionHelpers";
import type { CommercePaymentProofRow } from "@/services/commerceAdminService";
import type { SalesTransaction } from "@/services/salesTransactionService";

export type CollectionAccountBadge = "active" | "grace" | "suspension";

export type CollectionQueueStatus =
  | "for_verification"
  | "overdue"
  | "partially_paid"
  | "paid"
  | "pending";

export type CollectionQueueRow = {
  invoice: ClientInvoiceRow;
  transaction: SalesTransaction;
  proof: CommercePaymentProofRow | null;
  accountBadge: CollectionAccountBadge;
  queueStatus: CollectionQueueStatus;
  duePrimary: string;
  dueSecondary: string;
  amountPrimary: string;
  amountSecondary: string;
  paymentPrimary: string;
  paymentSecondary: string;
  orLabel: string;
  tax2307Label: string;
  daysPastDue: number;
};

export type CollectionQueueKpis = {
  totalReceivables: number;
  overdueAmount: number;
  suspensionCount: number;
  forVerificationCount: number;
  forVerificationSub: string;
  collectedThisMonth: number;
};

export type ReceivablesAgingBucket = {
  label: string;
  key: "current" | "d30" | "d60" | "d61_90" | "d90plus";
  amount: number;
};

function parseWhen(value?: string | null) {
  const raw = String(value ?? "").trim();
  if (!raw || raw === "—") return null;
  const stamp = Date.parse(raw);
  if (Number.isFinite(stamp)) return stamp;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
}

function dueTimestamp(transaction: SalesTransaction) {
  const meta = parseDealMeta(transaction.notes);
  return (
    parseWhen(transaction.due_date) ??
    parseWhen(meta?.paymentCommitmentDate) ??
    parseWhen(transaction.transacted_at) ??
    parseWhen(transaction.issued_date)
  );
}

function daysPastDue(transaction: SalesTransaction) {
  const due = dueTimestamp(transaction);
  if (due == null) return 0;
  const diff = Date.now() - due;
  if (diff <= 0) return 0;
  return Math.floor(diff / (24 * 60 * 60 * 1000));
}

function accountBadge(transaction: SalesTransaction): CollectionAccountBadge {
  if (isPaidStatus(transaction.payment_status)) return "active";
  const days = daysPastDue(transaction);
  if (days > 30) return "suspension";
  if (days > 0 && days <= 14) return "grace";
  return "active";
}

function queueStatus(
  invoice: ClientInvoiceRow,
  transaction: SalesTransaction,
  proof: CommercePaymentProofRow | null,
): CollectionQueueStatus {
  const proofPending =
    proof &&
    proof.kind !== "profile_change" &&
    String(proof.proofStatus ?? proof.status ?? "")
      .toLowerCase()
      .includes("pending");
  if (proofPending) return "for_verification";

  const status = String(invoice.status ?? "").toLowerCase();
  if (status.includes("partial")) return "partially_paid";
  if (isPaidStatus(transaction.payment_status) || status === "paid") return "paid";

  const days = daysPastDue(transaction);
  if (days > 0 || status.includes("overdue")) return "overdue";
  return "pending";
}

function formatCompactMoney(amount: number) {
  if (!Number.isFinite(amount) || amount <= 0) return "";
  if (amount >= 1_000_000) return `₱${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `₱${(amount / 1_000).toFixed(1)}k`;
  return formatDealAmount(amount);
}

function proofMap(proofs: CommercePaymentProofRow[]) {
  const byTx = new Map<number, CommercePaymentProofRow>();
  for (const proof of proofs) {
    if (proof.kind === "profile_change") continue;
    const txId = Number(proof.salesTransactionId ?? 0);
    if (!(txId > 0)) continue;
    const existing = byTx.get(txId);
    if (!existing) {
      byTx.set(txId, proof);
      continue;
    }
    const pending = String(proof.status ?? "").toLowerCase().includes("pending");
    const existingPending = String(existing.status ?? "").toLowerCase().includes("pending");
    if (pending && !existingPending) byTx.set(txId, proof);
  }
  return byTx;
}

export function buildCollectionQueueRows(
  invoices: ClientInvoiceRow[],
  transactions: SalesTransaction[],
  proofs: CommercePaymentProofRow[],
): CollectionQueueRow[] {
  const txById = new Map(transactions.map((t) => [t.id, t]));
  const proofsByTx = proofMap(proofs);

  return invoices.map((invoice) => {
    const transaction =
      txById.get(invoice.transactionId) ??
      ({
        id: invoice.transactionId,
        payment_status: invoice.status,
        grand_total: invoice.grandTotal,
      } as SalesTransaction);

    const proof = proofsByTx.get(invoice.transactionId) ?? null;
    const meta = parseDealMeta(transaction.notes);
    const days = daysPastDue(transaction);
    const ptp = String(meta?.paymentCommitmentDate ?? "").trim();
    const collectionNote = String(meta?.collectionNote ?? "").trim();
    const dueSecondary = ptp
      ? `PTP: ${formatDealDateShort(ptp)}`
      : collectionNote
        ? collectionNote.slice(0, 48)
        : days > 0
          ? "Past due"
          : "";

    const total = Number(invoice.grandTotal ?? transaction.grand_total ?? 0);
    const netGuess = total > 0 ? total / 1.12 : 0;

    const or = String(invoice.officialReceipt ?? "").trim();
    const orLabel = or && or !== "—" ? "OR Issued" : "Pending OR";
    const tax2307Label = "Pending 2307";

    let paymentPrimary = invoice.paymentMode && invoice.paymentMode !== "—" ? invoice.paymentMode : "—";
    let paymentSecondary = invoice.paymentDate && invoice.paymentDate !== "—" ? invoice.paymentDate : "";
    if (proof) {
      const ref = proof.proofNo || proof.invoiceId;
      paymentPrimary = ref ? `${paymentPrimary !== "—" ? `${paymentPrimary} • ` : ""}Ref #${ref}` : paymentPrimary;
      paymentSecondary = proof.submittedAt
        ? new Date(proof.submittedAt).toLocaleDateString("en-PH", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : paymentSecondary;
    }

    return {
      invoice,
      transaction,
      proof,
      accountBadge: accountBadge(transaction),
      queueStatus: queueStatus(invoice, transaction, proof),
      duePrimary: invoice.dueDate && invoice.dueDate !== "—" ? invoice.dueDate : "—",
      dueSecondary,
      amountPrimary: formatDealAmount(total) || "—",
      amountSecondary: netGuess > 0 ? `Net: ${formatCompactMoney(netGuess)}` : "",
      paymentPrimary,
      paymentSecondary,
      orLabel,
      tax2307Label,
      daysPastDue: days,
    };
  });
}

function formatDealDateShort(value: string) {
  const ms = parseWhen(value);
  if (ms == null) return value;
  return new Date(ms).toLocaleDateString("en-PH", { month: "short", day: "numeric" });
}

export function computeCollectionQueueKpis(
  rows: CollectionQueueRow[],
  proofs: CommercePaymentProofRow[],
): CollectionQueueKpis {
  let totalReceivables = 0;
  let overdueAmount = 0;
  let suspensionCount = 0;
  let collectedThisMonth = 0;

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  for (const row of rows) {
    const amount = Number(row.invoice.grandTotal ?? 0);
    if (!isPaidStatus(row.transaction.payment_status)) {
      totalReceivables += amount;
      if (row.queueStatus === "overdue" || row.daysPastDue > 0) overdueAmount += amount;
      if (row.accountBadge === "suspension") suspensionCount += 1;
    } else {
      const paidAt =
        parseWhen(row.transaction.payment_date) ??
        parseWhen(row.invoice.paymentDate) ??
        parseWhen(row.transaction.transacted_at);
      if (paidAt != null && paidAt >= monthStart.getTime()) {
        collectedThisMonth += amount;
      }
    }
  }

  const pendingProofs = proofs.filter(
    (p) =>
      p.kind !== "profile_change" &&
      String(p.status ?? "")
        .toLowerCase()
        .includes("pending"),
  );

  return {
    totalReceivables,
    overdueAmount,
    suspensionCount,
    forVerificationCount: pendingProofs.length,
    forVerificationSub: `${pendingProofs.length} payment${pendingProofs.length === 1 ? "" : "s"} & 2307 not tracked yet`,
    collectedThisMonth,
  };
}

export function computeReceivablesAging(rows: CollectionQueueRow[]): ReceivablesAgingBucket[] {
  const buckets = { current: 0, d30: 0, d60: 0, d61_90: 0, d90plus: 0 };

  for (const row of rows) {
    if (isPaidStatus(row.transaction.payment_status)) continue;
    const amount = Number(row.invoice.grandTotal ?? 0);
    const days = row.daysPastDue;
    if (days <= 0) buckets.current += amount;
    else if (days <= 30) buckets.d30 += amount;
    else if (days <= 60) buckets.d60 += amount;
    else if (days <= 90) buckets.d61_90 += amount;
    else buckets.d90plus += amount;
  }

  return [
    { key: "current", label: "Current", amount: buckets.current },
    { key: "d30", label: "1–30", amount: buckets.d30 },
    { key: "d60", label: "31–60", amount: buckets.d60 },
    { key: "d61_90", label: "61–90", amount: buckets.d61_90 },
    { key: "d90plus", label: "90+", amount: buckets.d90plus },
  ];
}

export function collectionQueueStatusLabel(status: CollectionQueueStatus) {
  switch (status) {
    case "for_verification":
      return "For Verification";
    case "overdue":
      return "Overdue";
    case "partially_paid":
      return "Partially Paid";
    case "paid":
      return "Paid";
    default:
      return "Pending";
  }
}

export function collectionAccountBadgeLabel(badge: CollectionAccountBadge) {
  switch (badge) {
    case "suspension":
      return "For Suspension";
    case "grace":
      return "Grace Period";
    default:
      return "Active";
  }
}