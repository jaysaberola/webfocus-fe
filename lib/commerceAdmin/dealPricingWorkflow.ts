import {
  dealAmountNumber,
  parseDealMeta,
  patchDealMetaInNotes,
  type ClientOrderFormState,
} from "@/lib/commerceAdmin/clientOrderFormHelpers";
import { parseQuoteMoney } from "@/lib/commerceAdmin/hostingClientQuote";

export const PRICING_WORKFLOW = {
  missing: "missing_price",
  awaiting: "awaiting_price",
  review: "price_updated_review",
  ready: "draft_ready",
} as const;

export type PricingWorkflowStatus = (typeof PRICING_WORKFLOW)[keyof typeof PRICING_WORKFLOW];

export type DealPriceLineForWorkflow = {
  name: string;
  needsAmount?: boolean;
  price: number;
  isDomain?: boolean;
};

export function pricingWorkflowFromNotes(notes?: string | null): PricingWorkflowStatus {
  const raw = String(parseDealMeta(notes)?.pricingWorkflowStatus ?? "").trim();
  if (raw === PRICING_WORKFLOW.awaiting) return PRICING_WORKFLOW.awaiting;
  if (raw === PRICING_WORKFLOW.review) return PRICING_WORKFLOW.review;
  if (raw === PRICING_WORKFLOW.ready) return PRICING_WORKFLOW.ready;
  return PRICING_WORKFLOW.missing;
}

export function pricingWorkflowLabel(status: PricingWorkflowStatus): string {
  switch (status) {
    case PRICING_WORKFLOW.awaiting:
      return "Awaiting price";
    case PRICING_WORKFLOW.review:
      return "Price updated — review";
    case PRICING_WORKFLOW.ready:
      return "Draft ready to complete";
    default:
      return "Missing price";
  }
}

export function isDraftTransaction(orderStatus?: string | null) {
  return String(orderStatus ?? "").trim().toLowerCase() === "draft";
}

export function dealLinesMissingPrice(
  lines: DealPriceLineForWorkflow[],
  dealAmounts: Record<string, string> | undefined,
  quoteAnnualSrp?: string,
): boolean {
  const annual = parseQuoteMoney(quoteAnnualSrp ?? "");
  if (annual != null && annual > 0) return false;
  if (!lines.length) return true;
  return lines.some((row) => {
    if (row.isDomain) return false;
    if (dealAmountNumber(dealAmounts, row.name) > 0) return false;
    if (!row.needsAmount && row.price > 0) return false;
    return true;
  });
}

/** Mirror backend `DealMeta::syncPricingWorkflowStatus` for draft deals. */
export function computeDraftPricingWorkflowStatus(
  notes: string | null | undefined,
  lines: DealPriceLineForWorkflow[],
  dealAmounts: Record<string, string> | undefined,
  quoteAnnualSrp: string,
): PricingWorkflowStatus {
  const hasMissingPrices = dealLinesMissingPrice(lines, dealAmounts, quoteAnnualSrp);
  const current = pricingWorkflowFromNotes(notes);
  if (current === PRICING_WORKFLOW.awaiting) {
    return hasMissingPrices ? PRICING_WORKFLOW.awaiting : PRICING_WORKFLOW.review;
  }
  if (!hasMissingPrices && (current === PRICING_WORKFLOW.missing || current === PRICING_WORKFLOW.review)) {
    return PRICING_WORKFLOW.review;
  }
  if (hasMissingPrices && current === PRICING_WORKFLOW.review) {
    return PRICING_WORKFLOW.review;
  }
  return hasMissingPrices ? PRICING_WORKFLOW.missing : PRICING_WORKFLOW.ready;
}

/** Badge + UI: use live form state on draft deals, not stale saved meta alone. */
export function displayPricingWorkflowForDraft(
  notes: string | null | undefined,
  lines: DealPriceLineForWorkflow[],
  form: Pick<ClientOrderFormState, "dealAmounts" | "quoteAnnualSrp">,
): PricingWorkflowStatus {
  return computeDraftPricingWorkflowStatus(notes, lines, form.dealAmounts, form.quoteAnnualSrp);
}

export function withDraftPricingWorkflowNotes(
  notes: string,
  lines: DealPriceLineForWorkflow[],
  form: Pick<ClientOrderFormState, "dealAmounts" | "quoteAnnualSrp">,
): string {
  const status = computeDraftPricingWorkflowStatus(notes, lines, form.dealAmounts, form.quoteAnnualSrp);
  return patchDealMetaInNotes(notes, { pricingWorkflowStatus: status });
}
