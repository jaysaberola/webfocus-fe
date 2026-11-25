import { parseDealMeta } from "@/lib/commerceAdmin/clientOrderFormHelpers";
import {
  formatDealAmount,
  transactionPaymentDate,
  transactionPaymentMode,
} from "@/lib/commerceAdmin/clientDealHelpers";
import { parseInvoiceMeta, type ClientInvoiceRow } from "@/lib/commerceAdmin/clientInvoiceHelpers";
import { isPaidStatus } from "@/lib/commerceAdmin/transactionHelpers";
import type { CommercePaymentProofRow } from "@/services/commerceAdminService";
import { getPaynamicsPaymentLabel } from "@/lib/checkoutPaymentMethods";
import type { PaynamicsPaymentReferenceRow, SalesTransaction } from "@/services/salesTransactionService";

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
  isSample?: boolean;
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

export type CollectionQueueColumnKey =
  | "customer"
  | "invoice"
  | "due"
  | "amount"
  | "payment"
  | "taxOr"
  | "status";

export const COLLECTION_QUEUE_COLUMN_LABELS: Record<CollectionQueueColumnKey, string> = {
  customer: "Customer & account",
  invoice: "Invoice #",
  due: "Due & PTP / logs",
  amount: "Amount",
  payment: "Payment & ref",
  taxOr: "2307 & OR",
  status: "Status",
};

export const COLLECTION_QUEUE_COLUMN_KEYS: CollectionQueueColumnKey[] = [
  "customer",
  "invoice",
  "due",
  "amount",
  "payment",
  "taxOr",
  "status",
];

export const DEFAULT_COLLECTION_QUEUE_COLUMNS: Record<CollectionQueueColumnKey, boolean> = {
  customer: true,
  invoice: true,
  due: true,
  amount: true,
  payment: true,
  taxOr: true,
  status: true,
};

export type CollectionQueueKpis = {
  totalReceivables: number;
  overdueAmount: number;
  suspensionCount: number;
  forVerificationCount: number;
  forVerificationSub: string;
  collectedThisMonth: number;
};

export type CollectionQueueKpiFilter =
  | "all"
  | "receivables"
  | "overdue"
  | "verification"
  | "collected";

function isPendingPaymentProof(proof: CommercePaymentProofRow) {
  const status = String(proof.proofStatus ?? proof.status ?? "")
    .toLowerCase()
    .trim();
  return proof.kind !== "profile_change" && status.includes("pending");
}

function isVerifiedPaymentProof(proof: CommercePaymentProofRow) {
  const status = String(proof.proofStatus ?? proof.status ?? "")
    .toLowerCase()
    .trim();
  return proof.kind !== "profile_change" && status.includes("verified");
}

function isCancelledQueueRow(row: CollectionQueueRow) {
  const order = String(row.transaction.order_status ?? "").toLowerCase();
  const payment = String(row.transaction.payment_status ?? "").toLowerCase();
  return (
    order === "cancelled" ||
    order === "canceled" ||
    order === "draft" ||
    payment === "cancelled" ||
    payment === "canceled"
  );
}

export function isCollectionReceivableRow(row: CollectionQueueRow) {
  if (isCancelledQueueRow(row)) return false;
  if (row.queueStatus === "paid" || isPaidStatus(row.transaction.payment_status)) return false;
  return true;
}

function rowCollectedThisMonth(row: CollectionQueueRow, monthStartMs: number) {
  if (!isPaidStatus(row.transaction.payment_status) && row.queueStatus !== "paid") return false;
  const paidAt =
    parseWhen(row.transaction.payment_date) ??
    parseWhen(row.invoice.paymentDate) ??
    parseWhen(row.transaction.issued_date) ??
    parseWhen(row.transaction.transacted_at) ??
    parseWhen(row.transaction.created_at);
  return paidAt != null && paidAt >= monthStartMs;
}

function buildForVerificationSubtext(queueRows: CollectionQueueRow[], pendingProofs: number) {
  const awaitingTax = queueRows.filter(
    (row) => isCollectionReceivableRow(row) && row.tax2307Label === "Pending 2307",
  ).length;
  const parts: string[] = [];
  if (pendingProofs > 0) {
    parts.push(`${pendingProofs} payment${pendingProofs === 1 ? "" : "s"} pending review`);
  }
  if (awaitingTax > 0) {
    parts.push(`${awaitingTax} awaiting 2307`);
  }
  if (parts.length === 0) return "Nothing pending review";
  return parts.join(" · ");
}

export function matchesCollectionKpiFilter(row: CollectionQueueRow, filter: CollectionQueueKpiFilter) {
  if (filter === "all") return true;
  if (row.isSample) return false;
  if (filter === "receivables") return isCollectionReceivableRow(row);
  if (filter === "overdue") {
    return isCollectionReceivableRow(row) && (row.queueStatus === "overdue" || row.daysPastDue > 0);
  }
  if (filter === "verification") return row.queueStatus === "for_verification";
  if (filter === "collected") {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    return rowCollectedThisMonth(row, monthStart.getTime());
  }
  return true;
}

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

function normalizeInvoiceKey(value?: string | null) {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

function proofTimestamp(proof: CommercePaymentProofRow) {
  return parseWhen(proof.submittedAt) ?? 0;
}

function proofRank(proof: CommercePaymentProofRow) {
  const status = String(proof.proofStatus ?? proof.status ?? "").toLowerCase();
  if (status.includes("pending")) return 30;
  if (status.includes("verified") || status.includes("credited")) return 20;
  if (status.includes("reject") || status.includes("declin")) return 5;
  return 10;
}

function shouldReplaceProof(
  current: CommercePaymentProofRow | undefined,
  candidate: CommercePaymentProofRow,
) {
  if (!current) return true;
  const rankDelta = proofRank(candidate) - proofRank(current);
  if (rankDelta !== 0) return rankDelta > 0;
  return proofTimestamp(candidate) > proofTimestamp(current);
}

function buildProofIndexes(proofs: CommercePaymentProofRow[]) {
  const byTx = new Map<number, CommercePaymentProofRow>();
  const byInvoice = new Map<string, CommercePaymentProofRow>();

  const upsert = <K,>(map: Map<K, CommercePaymentProofRow>, key: K, proof: CommercePaymentProofRow) => {
    const existing = map.get(key);
    if (shouldReplaceProof(existing, proof)) map.set(key, proof);
  };

  for (const proof of proofs) {
    if (proof.kind === "profile_change") continue;
    const txId = Number(proof.salesTransactionId ?? 0);
    if (txId > 0) upsert(byTx, txId, proof);
    const invoiceKey = normalizeInvoiceKey(proof.invoiceId);
    if (invoiceKey) upsert(byInvoice, invoiceKey, proof);
  }

  return { byTx, byInvoice };
}

const WEAK_REF_VALUES = new Set(["tes", "test", "note", "notes", "pending", "null", "none"]);

function isUsableReference(value: string) {
  const ref = value.trim();
  if (ref.length < 4) return false;
  if (WEAK_REF_VALUES.has(ref.toLowerCase())) return false;
  if (/^PRF-/i.test(ref)) return true;
  return ref.length >= 5 || /\d{4,}/.test(ref);
}

function paynamicsReferenceRows(transaction: SalesTransaction): PaynamicsPaymentReferenceRow[] {
  const snake = transaction.paynamics_payment_references;
  const camel = transaction.paynamicsPaymentReferences;
  if (Array.isArray(snake) && snake.length) return snake;
  if (Array.isArray(camel) && camel.length) return camel;
  return [];
}

function pickPaynamicsReference(transaction: SalesTransaction): PaynamicsPaymentReferenceRow | null {
  const rows = paynamicsReferenceRows(transaction);
  if (!rows.length) return null;

  const score = (row: PaynamicsPaymentReferenceRow) => {
    const status = String(row.status ?? "").toLowerCase();
    if (status === "paid" || row.paid_at) return 30;
    if (status === "pending") return 20;
    return 10;
  };

  return [...rows].sort(
    (a, b) => score(b) - score(a) || Number(b.id ?? 0) - Number(a.id ?? 0),
  )[0];
}

function normalizePaynamicsMethod(
  transaction: SalesTransaction,
  paynamics: PaynamicsPaymentReferenceRow | null,
  invoiceMeta: Partial<ReturnType<typeof parseInvoiceMeta>> | null,
  meta: ReturnType<typeof parseDealMeta>,
  invoice: ClientInvoiceRow,
) {
  const fromPaynamics = String(paynamics?.payment_method ?? "").trim();
  if (fromPaynamics) {
    const idMatch = fromPaynamics.match(/^paynamics[-_]([a-z0-9]+)$/i);
    if (idMatch?.[1]) {
      const label = getPaynamicsPaymentLabel(idMatch[1]);
      return label !== idMatch[1] ? label : fromPaynamics;
    }
    return fromPaynamics;
  }

  const modeMeta = { paymentMode: invoiceMeta?.paymentMode || meta?.paymentMode };
  let method = transactionPaymentMode(transaction, modeMeta);
  if (method === "—" && invoice.paymentMode && invoice.paymentMode !== "—") {
    method = invoice.paymentMode;
  }
  return method;
}

function paynamicsReferenceNumber(paynamics: PaynamicsPaymentReferenceRow | null): string {
  if (!paynamics) return "";
  const response = String(paynamics.response_id ?? "").trim();
  if (isUsableReference(response)) return response;
  const request = String(paynamics.request_id ?? "").trim();
  if (isUsableReference(request)) return request;
  return "";
}

function extractPaymentReferenceFromNotes(notes?: string | null) {
  const raw = String(notes ?? "");
  const patterns = [
    /(?:Pay\s*reference|payreference)\s*:?\s*([A-Za-z0-9-]{4,})/i,
    /(?:processor\s*response\s*id)\s*:?\s*([A-Za-z0-9-]{4,})/i,
    /(?:Ref|Reference)\s*#\s*([A-Za-z0-9-]{4,})/i,
    /Check\s*#\s*([A-Za-z0-9-]{4,})/i,
    /(?:Transaction|Txn|Request)\s*(?:ID|No\.?)\s*:?\s*([A-Za-z0-9-]{5,})/i,
  ];
  for (const pattern of patterns) {
    const match = raw.match(pattern);
    const value = String(match?.[1] ?? "").trim();
    if (isUsableReference(value)) return value;
  }
  return "";
}

function formatPaymentRefLabel(method: string, reference: string, proof?: CommercePaymentProofRow | null) {
  const normalizedMethod = method && method !== "—" ? method : "";
  const refValue = String(reference || proof?.proofNo || "").trim();
  const proofNo = String(proof?.proofNo ?? "").trim();

  if (normalizedMethod && refValue) {
    return `${normalizedMethod} • Ref #${refValue.replace(/^#+/, "")}`;
  }
  if (normalizedMethod) return normalizedMethod;
  if (proofNo) return `Proof ${proofNo}`;
  if (refValue) return `Ref #${refValue.replace(/^#+/, "")}`;
  return "—";
}

function formatPaymentRefDate(
  transaction: SalesTransaction,
  invoice: ClientInvoiceRow,
  proof: CommercePaymentProofRow | null,
  invoiceMeta: Partial<ReturnType<typeof parseInvoiceMeta>> | null,
  meta: ReturnType<typeof parseDealMeta>,
) {
  const proofAt = proof?.submittedAt ? parseWhen(proof.submittedAt) : null;
  if (proofAt != null) {
    return new Date(proofAt).toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  const paymentDate = transactionPaymentDate(transaction, {
    paymentDate: invoiceMeta?.paymentDate || meta?.paymentDate,
  });
  if (paymentDate && paymentDate !== "—") return paymentDate;

  const invoiceDate = String(invoice.paymentDate ?? "").trim();
  return invoiceDate && invoiceDate !== "—" ? invoiceDate : "";
}

function buildPaymentRefDisplay(
  transaction: SalesTransaction,
  invoice: ClientInvoiceRow,
  proof: CommercePaymentProofRow | null,
  invoiceMeta: Partial<ReturnType<typeof parseInvoiceMeta>> | null,
  meta: ReturnType<typeof parseDealMeta>,
) {
  const paynamics = pickPaynamicsReference(transaction);
  const method = normalizePaynamicsMethod(transaction, paynamics, invoiceMeta, meta, invoice);

  let reference = paynamicsReferenceNumber(paynamics);
  if (!reference) {
    const proofNo = String(proof?.proofNo ?? "").trim();
    if (isUsableReference(proofNo)) reference = proofNo;
  }
  if (!reference) {
    reference = extractPaymentReferenceFromNotes(transaction.notes);
  }

  const paymentPrimary = formatPaymentRefLabel(
    method,
    reference,
    paynamics || reference ? null : proof,
  );

  let paymentSecondary = "";
  const paynamicsPaidAt = paynamics?.paid_at ? parseWhen(paynamics.paid_at) : null;
  if (paynamicsPaidAt != null) {
    paymentSecondary = new Date(paynamicsPaidAt).toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } else {
    paymentSecondary = formatPaymentRefDate(transaction, invoice, proof, invoiceMeta, meta);
  }

  return { paymentPrimary, paymentSecondary };
}

function shouldShowCollectionQueueSamples() {
  const flag = String(process.env.NEXT_PUBLIC_COLLECTION_QUEUE_SAMPLES ?? "").trim();
  if (flag === "0") return false;
  return true;
}

function buildCollectionQueueSampleRows(): CollectionQueueRow[] {
  const baseTransaction = {
    subtotal: 0,
    discount_total: 0,
    tax_total: 0,
    shipping_total: 0,
    grand_total: 0,
    order_status: "processing",
    notes: "",
  } satisfies Partial<SalesTransaction>;

  const sampleId = (n: number) => -(10_000 + n);

  const wrapSample = (row: Omit<CollectionQueueRow, "isSample">, sampleIndex: number): CollectionQueueRow => ({
    ...row,
    isSample: true,
    invoice: { ...row.invoice, transactionId: sampleId(sampleIndex) },
    transaction: { ...row.transaction, id: sampleId(sampleIndex) } as SalesTransaction,
  });

  return [
    wrapSample({
      invoice: {
        id: "sample-for-verification",
        transactionId: -1,
        invoiceOwner: "Sample",
        subject: "Sample — For verification",
        invoiceDate: "—",
        dueDate: "Oct 25, 2026",
        clientName: "Apex Solutions Inc.",
        contactName: "—",
        currency: "PHP",
        status: "Unpaid",
        collectionDate: "—",
        officialReceipt: "",
        paymentDate: "—",
        paymentMode: "GCash",
        exchangeRate: "1",
        billingStreet: "—",
        billingCity: "—",
        billingState: "—",
        billingCode: "—",
        billingCountry: "—",
        billingInCharge: "—",
        wsiInvoiceNumber: "INV-00921",
        grandTotal: 85_000,
      },
      transaction: {
        ...baseTransaction,
        payment_status: "pending",
        grand_total: 85_000,
        payment_mode: "GCash",
        paynamics_payment_references: [
          {
            request_id: "REQ-88412",
            response_id: "88412",
            payment_method: "GCash",
            status: "pending",
          },
        ],
      } as SalesTransaction,
      proof: null,
      accountBadge: "active",
      queueStatus: "for_verification",
      duePrimary: "25 Oct 2026",
      dueSecondary: "PTP: Nov 28 • Called",
      amountPrimary: formatDealAmount(85_000),
      amountSecondary: "Net: ₱83.3k",
      paymentPrimary: "GCash • Ref #88412",
      paymentSecondary: "Nov 24, 2026",
      orLabel: "Pending OR",
      tax2307Label: "Pending 2307",
      daysPastDue: 0,
    }, 1),
    wrapSample({
      invoice: {
        id: "sample-partial",
        transactionId: -1,
        invoiceOwner: "Sample",
        subject: "Sample — Partially paid",
        invoiceDate: "—",
        dueDate: "Oct 18, 2026",
        clientName: "Pacific Office Supplies",
        contactName: "—",
        currency: "PHP",
        status: "Partial",
        collectionDate: "—",
        officialReceipt: "OR-1024",
        paymentDate: "Nov 23, 2026",
        paymentMode: "Check",
        exchangeRate: "1",
        billingStreet: "—",
        billingCity: "—",
        billingState: "—",
        billingCode: "—",
        billingCountry: "—",
        billingInCharge: "—",
        wsiInvoiceNumber: "PO-11220",
        grandTotal: 42_500,
      },
      transaction: {
        ...baseTransaction,
        payment_status: "partial",
        grand_total: 42_500,
        payment_mode: "Check",
        paynamics_payment_references: [
          {
            request_id: "REQ-004512",
            response_id: "004512",
            payment_method: "Check",
            status: "paid",
            paid_at: "2026-11-23",
          },
        ],
      } as SalesTransaction,
      proof: null,
      accountBadge: "grace",
      queueStatus: "partially_paid",
      duePrimary: "18 Oct 2026",
      dueSecondary: "Reminded",
      amountPrimary: formatDealAmount(42_500),
      amountSecondary: "Bal: ₱21.3k",
      paymentPrimary: "Check • Ref #004512",
      paymentSecondary: "Nov 23, 2026",
      orLabel: "OR Issued",
      tax2307Label: "2307 Received",
      daysPastDue: 12,
    }, 2),
    wrapSample({
      invoice: {
        id: "sample-paid",
        transactionId: -1,
        invoiceOwner: "Sample",
        subject: "Sample — Paid",
        invoiceDate: "—",
        dueDate: "Oct 10, 2026",
        clientName: "Sunrise Marketing",
        contactName: "—",
        currency: "PHP",
        status: "Paid",
        collectionDate: "—",
        officialReceipt: "OR-2201",
        paymentDate: "Nov 18, 2026",
        paymentMode: "Maya",
        exchangeRate: "1",
        billingStreet: "—",
        billingCity: "—",
        billingState: "—",
        billingCode: "—",
        billingCountry: "—",
        billingInCharge: "—",
        wsiInvoiceNumber: "SM-33455",
        grandTotal: 18_200,
      },
      transaction: {
        ...baseTransaction,
        payment_status: "paid",
        grand_total: 18_200,
        payment_mode: "Maya",
        paynamics_payment_references: [
          {
            request_id: "REQ-77210",
            response_id: "77210",
            payment_method: "Maya",
            status: "paid",
            paid_at: "2026-11-18",
          },
        ],
      } as SalesTransaction,
      proof: null,
      accountBadge: "active",
      queueStatus: "paid",
      duePrimary: "10 Oct 2026",
      dueSecondary: "",
      amountPrimary: formatDealAmount(18_200),
      amountSecondary: "",
      paymentPrimary: "Maya • Ref #77210",
      paymentSecondary: "Nov 18, 2026",
      orLabel: "OR Issued",
      tax2307Label: "2307 Received",
      daysPastDue: 0,
    }, 3),
  ];
}

function formatQueueDueDate(value: string) {
  if (!value || value === "—") return "—";
  const ms = parseWhen(value);
  if (ms == null) return value;
  return new Date(ms).toLocaleDateString("en-PH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function buildCollectionQueueRows(
  invoices: ClientInvoiceRow[],
  transactions: SalesTransaction[],
  proofs: CommercePaymentProofRow[],
): CollectionQueueRow[] {
  const txById = new Map(transactions.map((t) => [t.id, t]));
  const { byTx: proofsByTx, byInvoice: proofsByInvoice } = buildProofIndexes(proofs);

  const built = invoices.map((invoice) => {
    const transaction =
      txById.get(invoice.transactionId) ??
      ({
        id: invoice.transactionId,
        payment_status: invoice.status,
        grand_total: invoice.grandTotal,
      } as SalesTransaction);

    const invoiceKey = normalizeInvoiceKey(invoice.wsiInvoiceNumber);
    const proof =
      proofsByTx.get(invoice.transactionId) ??
      (invoiceKey ? proofsByInvoice.get(invoiceKey) : undefined) ??
      null;
    const invoiceMeta = parseInvoiceMeta(transaction.notes);
    const meta = parseDealMeta(transaction.notes);
    const days = daysPastDue(transaction);
    const ptp = String(meta?.paymentCommitmentDate ?? "").trim();
    const collectionNote = String(meta?.collectionNote ?? "").trim();
    const dueParts: string[] = [];
    if (ptp) dueParts.push(`PTP: ${formatDealDateShort(ptp)}`);
    if (collectionNote) dueParts.push(collectionNote.slice(0, 40));
    const dueSecondary =
      dueParts.length > 0 ? dueParts.join(" • ") : days > 0 ? "Past due" : "";

    const total = Number(invoice.grandTotal ?? transaction.grand_total ?? 0);
    const netGuess = total > 0 ? total / 1.12 : 0;

    const or = String(invoice.officialReceipt ?? "").trim();
    const orLabel = or && or !== "—" ? "OR Issued" : "Pending OR";
    const tax2307Label = "Pending 2307";

    const { paymentPrimary, paymentSecondary } = buildPaymentRefDisplay(
      transaction,
      invoice,
      proof,
      invoiceMeta,
      meta,
    );

    return {
      invoice,
      transaction,
      proof,
      accountBadge: accountBadge(transaction),
      queueStatus: queueStatus(invoice, transaction, proof),
      duePrimary:
        invoice.dueDate && invoice.dueDate !== "—" ? formatQueueDueDate(invoice.dueDate) : "—",
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

  if (!shouldShowCollectionQueueSamples()) return built;
  return [...buildCollectionQueueSampleRows(), ...built];
}

export function collectionQueueRowsForMetrics(rows: CollectionQueueRow[]) {
  return rows.filter((row) => !row.isSample);
}

export function collectionQueueRowsEligibleForBulkSoa(rows: CollectionQueueRow[]) {
  return rows.filter((row) => {
    if (row.isSample) return false;
    if (!(row.invoice.transactionId > 0)) return false;
    if (row.queueStatus === "paid" || row.queueStatus === "for_verification") return false;
    return Number(row.transaction.customer_id ?? 0) > 0;
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
  rows = collectionQueueRowsForMetrics(rows);
  let totalReceivables = 0;
  let overdueAmount = 0;
  let suspensionCount = 0;
  let collectedThisMonth = 0;

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthStartMs = monthStart.getTime();

  const creditedTxnIds = new Set<number>();

  for (const proof of proofs) {
    if (!isVerifiedPaymentProof(proof)) continue;
    const paidAt = parseWhen(proof.submittedAt) ?? parseWhen(proof.issuedDate);
    if (paidAt == null || paidAt < monthStartMs) continue;
    const amount = Number(proof.amount ?? 0);
    if (amount > 0) collectedThisMonth += amount;
    if (proof.salesTransactionId) creditedTxnIds.add(Number(proof.salesTransactionId));
  }

  for (const row of rows) {
    const amount = Number(row.invoice.grandTotal ?? row.transaction.grand_total ?? 0);
    if (isCollectionReceivableRow(row)) {
      totalReceivables += amount;
      if (row.queueStatus === "overdue" || row.daysPastDue > 0) overdueAmount += amount;
      if (row.accountBadge === "suspension") suspensionCount += 1;
    }
    if (rowCollectedThisMonth(row, monthStartMs) && !creditedTxnIds.has(row.invoice.transactionId)) {
      collectedThisMonth += amount;
    }
  }

  const verificationRows = rows.filter((row) => row.queueStatus === "for_verification");
  const pendingProofs = proofs.filter(isPendingPaymentProof);
  const forVerificationCount = Math.max(verificationRows.length, pendingProofs.length);

  return {
    totalReceivables,
    overdueAmount,
    suspensionCount,
    forVerificationCount,
    forVerificationSub: buildForVerificationSubtext(rows, pendingProofs.length),
    collectedThisMonth,
  };
}

export function computeReceivablesAging(rows: CollectionQueueRow[]): ReceivablesAgingBucket[] {
  rows = collectionQueueRowsForMetrics(rows);
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

export type CollectionQueueActionKind = "verify" | "remind" | "view" | "soa" | "log";

export type CollectionQueueAction = {
  kind: CollectionQueueActionKind;
  label: string;
};

export function collectionQueueActions(row: CollectionQueueRow): CollectionQueueAction[] {
  const withLog = (primary: CollectionQueueAction): CollectionQueueAction[] => [
    primary,
    { kind: "log", label: "Log" },
  ];

  if (row.isSample) {
    if (row.queueStatus === "for_verification") {
      return withLog({ kind: "verify", label: "Verify" });
    }
    if (row.queueStatus === "partially_paid") {
      return withLog({ kind: "remind", label: "Remind" });
    }
    if (row.queueStatus === "paid") {
      return [{ kind: "soa", label: "View SOA" }];
    }
    return withLog({ kind: "view", label: "View" });
  }

  if (row.queueStatus === "for_verification" && row.proof) {
    return withLog({ kind: "verify", label: "Verify" });
  }

  if (
    row.queueStatus === "overdue" ||
    (row.queueStatus === "pending" && row.daysPastDue > 0) ||
    row.accountBadge === "suspension"
  ) {
    return withLog({ kind: "remind", label: "Remind" });
  }

  if (row.queueStatus === "paid") {
    return withLog({ kind: "soa", label: "View SOA" });
  }

  if (row.queueStatus === "partially_paid") {
    return withLog({ kind: "view", label: "View" });
  }

  return withLog({ kind: "view", label: "View" });
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