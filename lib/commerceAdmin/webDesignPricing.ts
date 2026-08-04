import { isWebDesignPlan, resolveServiceCategoryFromItems } from "@/lib/serviceCategory";
import type { SalesTransaction, SalesTransactionItem } from "@/services/salesTransactionService";

export const WEB_DESIGN_PENDING_QUOTATION_MARKER = "Pricing: Pending Quotation";
export const WEB_DESIGN_PRICE_SET_MARKER = "Pricing: Set by Sales";

export function isWebDesignTransaction(transaction: SalesTransaction) {
  const items = Array.isArray(transaction.items) ? transaction.items : [];
  if (items.some((item) => isWebDesignPlan(item.name, item.item_type))) return true;
  if (resolveServiceCategoryFromItems(items) === "Custom Web Design") return true;
  const notes = String(transaction.notes || "");
  return /agency web design|pending quotation|custom web design|website template/i.test(notes);
}

export function isPendingQuotationTransaction(transaction: SalesTransaction) {
  if (!isWebDesignTransaction(transaction)) return false;
  const notes = String(transaction.notes || "");
  if (new RegExp(WEB_DESIGN_PRICE_SET_MARKER, "i").test(notes)) return false;
  if (new RegExp(WEB_DESIGN_PENDING_QUOTATION_MARKER, "i").test(notes)) return true;
  return Number(transaction.grand_total || 0) <= 0;
}

export function transactionAmountLabel(transaction: SalesTransaction) {
  if (isPendingQuotationTransaction(transaction)) return "Pending Quotation";
  const amount = Number(transaction.grand_total || 0);
  return `₱${amount.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
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

  return cleaned ? `${pricedLine}\n${cleaned}` : pricedLine;
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
