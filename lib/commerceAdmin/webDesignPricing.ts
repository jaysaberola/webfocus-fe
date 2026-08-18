import { isWebDesignPlan, resolveServiceCategoryFromItems } from "@/lib/serviceCategory";
import type { SalesTransaction, SalesTransactionItem } from "@/services/salesTransactionService";

export const WEB_DESIGN_PENDING_QUOTATION_MARKER = "Pricing: Pending Quotation";
export const WEB_DESIGN_PRICE_SET_MARKER = "Pricing: Set by Sales";
export const WEB_DESIGN_PROPOSAL_SUBMITTED_MARKER = "Proposal: Submitted";
export const WEB_DESIGN_PROPOSAL_SIGNED_MARKER = "Proposal: Signed";
export const WEB_DESIGN_PAYMENT_REQUESTED_MARKER = "Payment: Requested";

function notesOf(transaction: Pick<SalesTransaction, "notes"> | string | null | undefined) {
  if (typeof transaction === "string" || transaction == null) return String(transaction || "");
  return String(transaction.notes || "");
}

function hasMarker(notes: string, marker: string) {
  return notes.toLowerCase().includes(marker.toLowerCase());
}

export function isWebDesignTransaction(transaction: SalesTransaction) {
  const items = Array.isArray(transaction.items) ? transaction.items : [];
  if (items.some((item) => isWebDesignPlan(item.name, item.item_type))) return true;
  if (resolveServiceCategoryFromItems(items) === "Custom Web Design") return true;
  const notes = notesOf(transaction);
  return /agency web design|pending quotation|custom web design|website template/i.test(notes);
}

export function isWebDesignPaymentRequested(transaction: SalesTransaction) {
  return hasMarker(notesOf(transaction), WEB_DESIGN_PAYMENT_REQUESTED_MARKER);
}

export function isPendingQuotationTransaction(transaction: SalesTransaction) {
  if (!isWebDesignTransaction(transaction)) return false;
  const paid = ["paid", "completed", "success"].includes(
    String(transaction.payment_status || "").toLowerCase(),
  );
  if (paid) return false;
  if (isWebDesignPaymentRequested(transaction)) return false;
  return true;
}

export function isProposalSubmittedTransaction(transaction: SalesTransaction) {
  return hasMarker(notesOf(transaction), WEB_DESIGN_PROPOSAL_SUBMITTED_MARKER);
}

export function isProposalSignedTransaction(transaction: SalesTransaction) {
  return hasMarker(notesOf(transaction), WEB_DESIGN_PROPOSAL_SIGNED_MARKER);
}

export function formatZeroPeso() {
  return "₱0.00";
}

export function transactionDisplayAmount(transaction: SalesTransaction) {
  if (isPendingQuotationTransaction(transaction)) return 0;
  return Number(transaction.grand_total || 0);
}

export function transactionAmountLabel(transaction: SalesTransaction) {
  const amount = transactionDisplayAmount(transaction);
  return `₱${amount.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function appendWebDesignMarker(notes: string | null | undefined, marker: string) {
  const current = String(notes || "").trim();
  if (hasMarker(current, marker)) return current;
  return current ? `${marker}\n${current}` : marker;
}

export function buildWebDesignPricedNotes(notes: string | null | undefined, amount: number) {
  const cleaned = String(notes || "")
    .replace(new RegExp(`^${WEB_DESIGN_PENDING_QUOTATION_MARKER}\\s*\\n?`, "im"), "")
    .replace(new RegExp(`^${WEB_DESIGN_PRICE_SET_MARKER}.*$`, "gim"), "")
    .trim();

  const pricedLine = `${WEB_DESIGN_PRICE_SET_MARKER} · ₱${Number(amount).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const withPending = cleaned.includes(WEB_DESIGN_PENDING_QUOTATION_MARKER)
    ? cleaned
    : `${WEB_DESIGN_PENDING_QUOTATION_MARKER}\n${cleaned}`.trim();

  return withPending ? `${pricedLine}\n${withPending}` : pricedLine;
}

export function applyWebDesignPriceToItems(
  items: SalesTransactionItem[] | undefined,
  amount: number
): SalesTransactionItem[] {
  const list = Array.isArray(items) ? items : [];
  if (!list.length) {
    return [
      {
        name: "Agency Web Design",
        item_type: "web_design",
        price: amount,
        quantity: 1,
        total_price: amount,
      },
    ];
  }

  const designIndexes = list
    .map((item, index) => (isWebDesignPlan(item.name, item.item_type) ? index : -1))
    .filter((index) => index >= 0);

  const targets = designIndexes.length ? designIndexes : [0];

  return list.map((item, index) => {
    if (!targets.includes(index)) return item;
    const qty = Math.max(1, Number(item.quantity || 1));
    const unit = targets.length === 1 ? amount : amount / targets.length;
    return {
      ...item,
      item_type: item.item_type || "web_design",
      price: unit,
      quantity: qty,
      total_price: unit * qty,
    };
  });
}
